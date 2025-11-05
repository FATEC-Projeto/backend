import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";
import { generateAccessToken, generateRefreshToken } from "../../utils/jwt";
import { hashValue } from "../../utils/crypto";

const prisma = new PrismaClient();

type LoginContext = {
  ip?: string | null;
  userAgent?: string | null;
};

/** TTLs */
const ACCESS_TTL_MIN = 15;              // access: 15 min
const REFRESH_TTL_DAYS = 7;             // refresh: 7 dias
const REFRESH_TTL_MS = REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000;

// CONFIGURAÇÕES DE BLOQUEIO
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutos

function plusMs(ms: number) {
  return new Date(Date.now() + ms);
}

/** VERIFICA SE CONTA ESTÁ BLOQUEADA */
const checkAccountLock = async (user: any) => {
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
const recordFailedAttempt = async (userId: string, email: string, ctx: LoginContext, motivo: string = "Senha incorreta") => {
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
      ip: ctx.ip,
      userAgent: ctx.userAgent,
      motivo,
    },
  });

  // Verificar se deve bloquear a conta
  if (updatedUser.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
    await prisma.usuario.update({
      where: { id: userId },
      data: {
        lockedUntil: plusMs(LOCKOUT_DURATION_MS),
      },
    });
  }

  return updatedUser;
};

/** RESETAR TENTATIVAS EM SUCESSO */
const resetLoginAttempts = async (userId: string, email: string, ctx: LoginContext) => {
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
      ip: ctx.ip,
      userAgent: ctx.userAgent,
      motivo: "Login bem-sucedido",
    },
  });
};

/** LOGIN ATUALIZADO COM BLOQUEIO */
export const loginService = async (
  email: string,
  password: string,
  ctx: LoginContext = {}
) => {
  const user = await prisma.usuario.findUnique({
    where: { emailPessoal: email },
  });

  if (!user) {
    // Registrar tentativa falha mesmo para usuário não encontrado (sem userId)
    await prisma.loginTentativa.create({
      data: {
        email,
        sucesso: false,
        ip: ctx.ip,
        userAgent: ctx.userAgent,
        motivo: "Usuário não encontrado",
      },
    });
    throw new Error("Usuário ou senha inválidos");
  }

  // Verificar se conta está ativa
  if (!user.ativo || !user.senhaHash) {
    await prisma.loginTentativa.create({
      data: {
        email,
        usuarioId: user.id,
        sucesso: false,
        ip: ctx.ip,
        userAgent: ctx.userAgent,
        motivo: "Conta inativa",
      },
    });
    throw new Error("Usuário ou senha inválidos");
  }

  // Verificar se conta está bloqueada
  const isLocked = await checkAccountLock(user);
  if (isLocked) {
    const remainingTime = Math.ceil((user.lockedUntil!.getTime() - Date.now()) / 1000);
    await prisma.loginTentativa.create({
      data: {
        email,
        usuarioId: user.id,
        sucesso: false,
        ip: ctx.ip,
        userAgent: ctx.userAgent,
        motivo: `Conta bloqueada - ${remainingTime}s restantes`,
      },
    });
    throw new Error(`Conta bloqueada devido a muitas tentativas. Tente novamente em ${Math.ceil(remainingTime / 60)} minutos.`);
  }

  // Verificar senha
  const ok = await argon2.verify(user.senhaHash, password);
  if (!ok) {
    const updatedUser = await recordFailedAttempt(user.id, email, ctx);
    const attemptsLeft = MAX_LOGIN_ATTEMPTS - updatedUser.loginAttempts;
    
    if (attemptsLeft <= 0) {
      throw new Error("Conta bloqueada devido a muitas tentativas falhas. Tente novamente em 15 minutos.");
    }
    
    throw new Error(`Usuário ou senha inválidos. ${attemptsLeft} tentativas restantes.`);
  }

  // Login bem-sucedido - resetar tentativas
  await resetLoginAttempts(user.id, email, ctx);

  // Gerar tokens
  const accessToken = generateAccessToken({
    sub: user.id,
    email: user.emailPessoal ?? undefined,
    role: user.papel,
    exp: Math.floor((Date.now() + ACCESS_TTL_MIN * 60 * 1000) / 1000),
  });

  const refreshToken = generateRefreshToken({ sub: user.id });
  const refreshHash = await hashValue(refreshToken);

  await prisma.sessao.create({
    data: {
      usuarioId: user.id,
      refreshHash,
      expiraEm: plusMs(REFRESH_TTL_MS),
      ip: ctx.ip ?? null,
      userAgent: ctx.userAgent ?? null,
    },
  });

  return { accessToken, refreshToken, user };
};

/** REFRESH: emite NOVO access e faz rotação do refresh (revoga o antigo e cria outro) */
export const refreshService = async (refreshToken: string) => {
  const refreshHash = await hashValue(refreshToken);

  const session = await prisma.sessao.findFirst({
    where: { refreshHash, revogadaEm: null },
    include: { usuario: true },
  });

  if (!session) throw new Error("Sessão não encontrada ou expirada");

  if (session.expiraEm && session.expiraEm < new Date()) {
    // expirada → marca como revogada/expirada e erra
    try {
      await prisma.sessao.update({
        where: { id: session.id },
        data: { revogadaEm: new Date() },
      });
    } catch { }
    throw new Error("Sessão expirada");
  }

  const user = session.usuario;
  if (!user || !user.ativo) throw new Error("Usuário inativo");

  // Novo access
  const accessToken = generateAccessToken({
    sub: user.id,
    email: user.emailPessoal ?? undefined,
    role: user.papel,
    exp: Math.floor((Date.now() + ACCESS_TTL_MIN * 60 * 1000) / 1000),
  });

  // Rotação do refresh: cria novo refresh + nova sessão e aponta substituição
  const newRefresh = generateRefreshToken({ sub: user.id });
  const newRefreshHash = await hashValue(newRefresh);

  const novaSessao = await prisma.sessao.create({
    data: {
      usuarioId: user.id,
      refreshHash: newRefreshHash,
      expiraEm: plusMs(REFRESH_TTL_MS),
      ip: session.ip ?? null,
      userAgent: session.userAgent ?? null,
    },
  });

  // Revoga a sessão antiga e liga a nova
  await prisma.sessao.update({
    where: { id: session.id },
    data: {
      revogadaEm: new Date(),
      substituidaPorId: novaSessao.id, // requer campo na tabela; comente se ainda não migrou
      // ultimoUsoEm: new Date(),
    },
  });

  return { accessToken, refreshToken: newRefresh };
};

/** LOGOUT: revoga o refresh atual (idempotente) */
export const logoutService = async (refreshToken: string) => {
  const refreshHash = await hashValue(refreshToken);

  const session = await prisma.sessao.findFirst({
    where: { refreshHash, revogadaEm: null },
    select: { id: true },
  });

  if (!session) throw new Error("Sessão não encontrada");

  await prisma.sessao.update({
    where: { id: session.id },
    data: { revogadaEm: new Date() },
  });

  return { success: true };
};

/** ME (dados públicos do usuário autenticado) */
export const meService = async (userId: string) => {
  const user = await prisma.usuario.findUnique({
    where: { id: userId },
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

  if (!user) throw new Error("Usuário não encontrado");
  return user;
};
