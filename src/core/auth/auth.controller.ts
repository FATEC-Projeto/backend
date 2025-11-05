// core/auth/auth.controller.ts
import { FastifyRequest, FastifyReply } from "fastify";
import { buildRouteValidator } from "../../utils/zod-helpers";
import { LoginSchema, RegisterSchema, RefreshSchema } from "../../validators/auth";
import { hashPassword, verifyPassword } from "../../security/password";
import { generateAccessToken } from "../../utils/jwt";
import {
  generateRefreshToken as genRT,
  createSession,
  createSessionWithClient,
  verifyAndGetSession,
  rotateSession,
  REFRESH_TOKEN_TTL_MS,
} from "../../security/refresh";

const errMsg = (e: unknown) => (e instanceof Error ? e.message : String(e));

// CONFIGURAÇÕES DE BLOQUEIO (ADICIONAR NO TOPO)
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutos

function parseExpires(v?: string | number) {
  if (!v) return 15 * 60;
  if (typeof v === 'number') return Number(v);
  const s = String(v).trim();
  if (/^\d+$/.test(s)) return Number(s);
  const m = /^([0-9]+)m$/.exec(s);
  if (m) return Number(m[1]) * 60;
  const h = /^([0-9]+)h$/.exec(s);
  if (h) return Number(h[1]) * 3600;
  return 15 * 60;
}

// 🔒 FUNÇÕES DE CONTROLE DE BLOQUEIO (ADICIONAR)
/** VERIFICA SE CONTA ESTÁ BLOQUEADA */
const checkAccountLock = async (prisma: any, user: any) => {
  if (!user.lockedUntil) return false;
  
  // Se o bloqueio expirou, resetar
  if (user.lockedUntil < new Date()) {
    await prisma.usuario.update({
      where: { id: user.id },
      data: {
        loginAttempts: 0,
        lockedUntil: null,
        lastFailedAttempt: null,
      },
    });
    return false;
  }
  
  return true;
};

/** REGISTRAR TENTATIVA FALHA */
const recordFailedAttempt = async (prisma: any, userId: string, email: string, ip: string, userAgent: string, motivo: string = "senha_incorreta") => {
  // Atualizar contador no usuário
  const updatedUser = await prisma.usuario.update({
    where: { id: userId },
    data: {
      loginAttempts: { increment: 1 },
      lastFailedAttempt: new Date(),
    },
  });

  // Registrar na auditoria
  await prisma.loginTentativa.create({
    data: {
      email,
      usuarioId: userId,
      sucesso: false,
      ip,
      userAgent,
      motivo,
    },
  });

  // Verificar se deve bloquear a conta
  if (updatedUser.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
    const lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
    await prisma.usuario.update({
      where: { id: userId },
      data: {
        lockedUntil,
      },
    });
    
    // Atualizar a auditoria com motivo de bloqueio
    await prisma.loginTentativa.create({
      data: {
        email,
        usuarioId: userId,
        sucesso: false,
        ip,
        userAgent,
        motivo: `conta_bloqueada_${Math.ceil(LOCKOUT_DURATION_MS / 60000)}min`,
      },
    });
  }

  return updatedUser;
};

/** RESETAR TENTATIVAS EM SUCESSO */
const resetLoginAttempts = async (prisma: any, userId: string, email: string, ip: string, userAgent: string) => {
  await prisma.usuario.update({
    where: { id: userId },
    data: {
      loginAttempts: 0,
      lockedUntil: null,
      lastFailedAttempt: null,
    },
  });

  // Registrar tentativa bem-sucedida na auditoria
  await prisma.loginTentativa.create({
    data: {
      email,
      usuarioId: userId,
      sucesso: true,
      ip,
      userAgent,
      motivo: "login_sucesso",
    },
  });
};

/* ============ LOGIN ============ */
const loginValidator = buildRouteValidator({ body: LoginSchema });

export const login = async (req: FastifyRequest, res: FastifyReply): Promise<void> => {
  req.log.info("🔹 Iniciando login...");

  const parsed = loginValidator.parse(req);
  if ("error" in parsed) {
    await res.code(400).send(parsed.error);
    return;
  }

  const prisma = (req.server as any).prisma;
  const { email, ra, password } = parsed.data!.body! as {
    email?: string;
    ra?: string;
    password: string;
  };

  const ip = req.ip;
  const userAgent = String(req.headers["user-agent"] || "");
  const identificador = email ?? ra ?? "";

  try {
    // 🔍 Busca: funcionário por emailPessoal (único) | aluno por RA (único)
    const baseSelect = {
      id: true,
      nome: true,
      ra: true,
      papel: true,
      senhaHash: true,
      emailPessoal: true,
      ativo: true,
      loginAttempts: true,      // NOVO CAMPO
      lockedUntil: true,        // NOVO CAMPO
      lastFailedAttempt: true,  // NOVO CAMPO
    } as const;

    const user = email
      ? await prisma.usuario.findUnique({ where: { emailPessoal: email }, select: baseSelect })
      : await prisma.usuario.findUnique({ where: { ra: ra! }, select: baseSelect });

    // Usuário não encontrado
    if (!user) {
      await prisma.loginTentativa.create({
        data: {
          email: email ?? "",
          usuarioId: null,
          sucesso: false,
          ip,
          userAgent,
          motivo: "usuario_nao_encontrado",
        },
      });
      req.log.warn({ identificador }, "❌ Usuário não encontrado");
      await res.code(401).send({ error: "Credenciais inválidas" });
      return;
    }

    // Verificar se conta está bloqueada
    const isLocked = await checkAccountLock(prisma, user);
    if (isLocked) {
      const remainingTime = Math.ceil((user.lockedUntil!.getTime() - Date.now()) / 1000);
      const remainingMinutes = Math.ceil(remainingTime / 60);

      await prisma.loginTentativa.create({
        data: {
          email: user.emailPessoal ?? "",
          usuarioId: user.id,
          sucesso: false,
          ip,
          userAgent,
          motivo: `conta_bloqueada_${remainingMinutes}min_restantes`,
        },
      });

      req.log.warn({ identificador, userId: user.id }, `🔒 Tentativa de login em conta bloqueada`);
      await res.code(423).send({
        error: "Conta bloqueada",
        message: `Muitas tentativas de login. Tente novamente em ${remainingMinutes} minutos.`,
        remainingTime
      });
      return;
    }

    // Usuário inativo
    if (!user.ativo) {
      await prisma.loginTentativa.create({
        data: {
          email: user.emailPessoal ?? "",
          usuarioId: user.id,
          sucesso: false,
          ip,
          userAgent,
          motivo: "usuario_inativo",
        },
      });
      req.log.warn({ identificador }, "⚠️ Usuário inativo");
      await res.code(403).send({ error: "Usuário inativo" });
      return;
    }

    // Hash de senha ausente
    if (!user.senhaHash) {
      await prisma.loginTentativa.create({
        data: {
          email: user.emailPessoal ?? "",
          usuarioId: user.id,
          sucesso: false,
          ip,
          userAgent,
          motivo: "hash_senha_ausente",
        },
      });
      req.log.warn({ identificador }, "❌ Hash de senha ausente");
      await res.code(401).send({ error: "Credenciais inválidas" });
      return;
    }

    // Verificar senha
    const passwordValid = await verifyPassword(user.senhaHash, password);
    if (!passwordValid) {
      const updatedUser = await recordFailedAttempt(prisma, user.id, user.emailPessoal ?? "", ip, userAgent);
      const attemptsLeft = MAX_LOGIN_ATTEMPTS - updatedUser.loginAttempts;

      let errorMessage = "Credenciais inválidas";
      if (attemptsLeft <= 0) {
        errorMessage = "Conta bloqueada devido a muitas tentativas falhas. Tente novamente em 15 minutos.";
      } else if (attemptsLeft <= 2) {
        errorMessage = `Credenciais inválidas. ${attemptsLeft} tentativa(s) restante(s) antes do bloqueio.`;
      }

      req.log.warn({ identificador, attemptsLeft }, "❌ Senha incorreta");
      await res.code(401).send({ error: errorMessage, attemptsLeft });
      return;
    }

    // ✅ LOGIN BEM-SUCEDIDO - Resetar tentativas e gerar tokens
    await resetLoginAttempts(prisma, user.id, user.emailPessoal ?? "", ip, userAgent);

    const accessToken = generateAccessToken({
      sub: user.id,
      email: user.emailPessoal ?? "",
      role: user.papel,
    });

    const { token: refreshToken } = genRT();

    await createSession({
      usuarioId: user.id,
      refreshToken,
      ip,
      userAgent,
      expiraEm: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    });

    req.log.info({ identificador }, "✅ Login concluído com sucesso");

    // Also set httpOnly cookie for access_token so browser navigations include it
    const maxAge = parseExpires(process.env.JWT_ACCESS_EXPIRES);

    try {
      // set httpOnly cookie; front-end will still receive accessToken in body if needed
      (res as any).setCookie('access_token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge,
      });
    } catch (e) {
      // if cookie plugin not installed, just continue — response will still include tokens
      req.log.debug('setCookie failed or cookie plugin not available');
    }

    // Não vazar campos sensíveis
    const { senhaHash, loginAttempts, lockedUntil, lastFailedAttempt, ...safeUser } = user as any;
    await res.send({ user: safeUser, accessToken, refreshToken });

  } catch (e) {
    req.log.error({ e }, "💥 Erro no login");
    await res.code(500).send({ error: errMsg(e) });
  }
};

/* ============ REGISTER ============ */
const registerValidator = buildRouteValidator({ body: RegisterSchema });

export const register = async (req: FastifyRequest, res: FastifyReply): Promise<void> => {
  const parsed = registerValidator.parse(req);
  if ("error" in parsed) {
    await res.code(400).send(parsed.error);
    return;
  }

  const prisma = (req.server as any).prisma;
  const { email, password, role, name, educationalEmail, ra } = parsed.data!.body! as {
    email: string;
    password: string;
    role?: any;
    name: string;
    educationalEmail?: string;
    ra?: string;
  };

  try {
    const result = await prisma.$transaction(async (tx: any) => {
      // e-mail pessoal único
      const existsEmail = await tx.usuario.findUnique({
        where: { emailPessoal: email },
        select: { id: true },
      });
      if (existsEmail) {
        const err: any = new Error("Email já está em uso");
        err.statusCode = 409;
        throw err;
      }

      // RA único (se fornecido)
      if (ra) {
        const existsRa = await tx.usuario.findUnique({
          where: { ra },
          select: { id: true },
        });
        if (existsRa) {
          const err: any = new Error("RA já está em uso");
          err.statusCode = 409;
          throw err;
        }
      }

      const senhaHash = await hashPassword(password);

      const user = await tx.usuario.create({
        data: {
          nome: name,
          emailPessoal: email,
          emailEducacional: educationalEmail ?? null,
          ra: ra ?? null,
          senhaHash,
          papel: role, // se quiser garantir default no banco, mantenha @default(USUARIO) no schema
          ativo: true,
        },
        select: {
          id: true,
          nome: true,
          emailPessoal: true,
          emailEducacional: true,
          ra: true,
          papel: true,
          ativo: true,
          criadoEm: true,
          atualizadoEm: true,
        },
      });

      const accessToken = generateAccessToken({
        sub: user.id,
        email: user.emailPessoal ?? "",
        role: user.papel,
      });

      const { token: refreshToken } = genRT();

      await createSessionWithClient(tx, {
        usuarioId: user.id,
        refreshToken,
        ip: req.ip,
        userAgent: String(req.headers["user-agent"] || ""),
        expiraEm: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      });

      return { user, accessToken, refreshToken };
    });

    await res.send(result);
  } catch (e: any) {
    req.log.error({ e }, "💥 Erro no registro");
    if (e?.statusCode === 409 || e?.code === "P2002") {
      // P2002 = unique constraint
      const msg =
        String(e?.message || "").toLowerCase().includes("ra")
          ? "RA já está em uso"
          : "Email já está em uso";
      await res.code(409).send({ error: msg });
      return;
    }
    await res.code(500).send({ error: "Erro ao criar o usuário", details: errMsg(e) });
  }
};

/* ============ REFRESH TOKEN ============ */
const refreshValidator = buildRouteValidator({ body: RefreshSchema });

export const refresh = async (req: FastifyRequest, res: FastifyReply): Promise<void> => {
  const parsed = refreshValidator.parse(req);
  if ("error" in parsed) {
    await res.code(400).send(parsed.error);
    return;
  }

  const prisma = (req.server as any).prisma;
  const { refreshToken } = parsed.data!.body! as { refreshToken: string };

  try {
    const sessao = await verifyAndGetSession(refreshToken);
    if (!sessao) {
      await res.code(401).send({ error: "Refresh inválido" });
      return;
    }

    const user = await prisma.usuario.findUniqueOrThrow({
      where: { id: sessao.usuarioId },
      select: { id: true, emailPessoal: true, papel: true },
    });

    const accessToken = generateAccessToken({
      sub: user.id,
      email: user.emailPessoal ?? "",
      role: user.papel,
    });

    const { token: novoRefresh } = genRT();
    await rotateSession(sessao.id, novoRefresh);

    try {
      (res as any).setCookie('access_token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: parseExpires(process.env.JWT_ACCESS_EXPIRES),
      });
    } catch {}

    await res.send({ accessToken, refreshToken: novoRefresh });
  } catch (e) {
    req.log.error({ e }, "💥 Erro no refresh");
    await res.code(500).send({ error: errMsg(e) });
  }
};

/* ============ LOGOUT ============ */
export const logout = async (req: FastifyRequest, res: FastifyReply): Promise<void> => {
  const parsed = refreshValidator.parse(req);
  if ("error" in parsed) {
    await res.code(400).send(parsed.error);
    return;
  }

  const prisma = (req.server as any).prisma;
  const { refreshToken } = parsed.data!.body! as { refreshToken: string };

  try {
    const sessao = await verifyAndGetSession(refreshToken);
    if (sessao) {
      await prisma.sessao.update({
        where: { id: sessao.id },
        data: { revogadaEm: new Date() },
      });
    }

    await res.send({ message: "Logout OK" });
  } catch (e) {
    req.log.error({ e }, "💥 Erro no logout");
    await res.code(500).send({ error: errMsg(e) });
  }
};

/* ============ ME (usuário atual) ============ */
export const me = async (req: FastifyRequest, res: FastifyReply): Promise<void> => {
  const prisma = (req.server as any).prisma;
  const authUser = (req as any).user as { sub?: string } | undefined;

  if (!authUser?.sub) {
    await res.code(401).send({ error: "Não autenticado" });
    return;
  }

  try {
    const user = await prisma.usuario.findUnique({
      where: { id: authUser.sub },
      select: {
        id: true,
        nome: true,
        emailPessoal: true,
        emailEducacional: true,
        ra: true,
        papel: true,
        ativo: true,
        criadoEm: true,
        atualizadoEm: true,
      },
    });

    if (!user) {
      await res.code(404).send({ error: "Usuário não encontrado" });
      return;
    }

    await res.send(user);
  } catch (e) {
    req.log.error({ e }, "💥 Erro no /me");
    await res.code(500).send({ error: errMsg(e) });
  }
};

/* ============ GET /usuarios ============ */
export const getUser = async (req: FastifyRequest, res: FastifyReply): Promise<void> => {
  const prisma = (req.server as any).prisma;
  const { ra, email, id, name, educationalEmail } = (req.query ?? {}) as {
    ra?: string;
    email?: string;
    id?: string;
    name?: string;
    educationalEmail?: string;
  };

  const where: any = {};
  if (id) where.id = id;
  if (ra) where.ra = ra;
  if (email) where.emailPessoal = email;
  if (educationalEmail) where.emailEducacional = educationalEmail;
  if (name) where.nome = { contains: name, mode: "insensitive" as const };

  try {
    const users = await prisma.usuario.findMany({
      where,
      select: {
        id: true,
        nome: true,
        emailPessoal: true,
        emailEducacional: true,
        ra: true,
        papel: true,
        ativo: true,
        criadoEm: true,
        atualizadoEm: true,
      },
    });

    if (!users.length) {
      await res.code(404).send({ error: "Usuário não encontrado" });
      return;
    }

    await res.send(users);
  } catch (e) {
    req.log.error({ e }, "💥 Erro em /usuarios");
    await res.code(500).send({ error: errMsg(e) });
  }
};
