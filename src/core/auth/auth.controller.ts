// src/modules/auth/auth.controller.ts
import { FastifyRequest, FastifyReply, RouteHandler, RouteGenericInterface } from "fastify";
import bcrypt from "bcrypt";
import { PrismaClient, Papel } from "@prisma/client";
import { loginService, refreshService, logoutService, meService } from "./auth.service";
import { generateAccessToken, generateRefreshToken } from "../../utils/jwt";

const prisma = new PrismaClient();

/** Tipos dos corpos das requisições */
type LoginRequestBody = {
  email: string;     // email pessoal
  password: string;
};

type RefreshRequestBody = {
  refreshToken: string;
};

type RegisterRequestBody = {
  email: string;               // email pessoal
  password: string;
  role?: string;               // USUARIO | BACKOFFICE | TECNICO | ADMINISTRADOR
  name: string;                // nome
  educationalEmail?: string;   // email educacional
  ra?: string;
};

/** Tipos da rota GET /usuarios */
type GetUserQuery = {
  ra?: string;
  email?: string; // email pessoal
  id?: string;
  name?: string;
  educationalEmail?: string;
};
interface GetUserRoute extends RouteGenericInterface {
  Querystring: GetUserQuery;
}

/** Helper: normaliza string -> enum Papel (fallback USUARIO) */
function parsePapel(input?: string): Papel {
  if (!input) return Papel.USUARIO;
  const norm = input.toUpperCase().replace(/\s+/g, "_");
  return (Papel as any)[norm] ?? Papel.USUARIO;
}

/** LOGIN */
export const login: RouteHandler<{ Body: LoginRequestBody }> = async (req, res) => {
  const { email, password } = req.body;

  try {
    const { accessToken, refreshToken, user } = await loginService(email, password, {
      ip: req.ip,
      userAgent: (req.headers["user-agent"] as string) || undefined,
    });
    return res.send({ user, accessToken, refreshToken });
  } catch (error: any) {
    return res.code(500).send({ error: error?.message || "Erro interno" });
  }
};

/** REFRESH */
export const refresh: RouteHandler<{ Body: RefreshRequestBody }> = async (req, res) => {
  const { refreshToken } = req.body;

  try {
    const { accessToken } = await refreshService(refreshToken);
    return res.send({ accessToken });
  } catch (error: any) {
    return res.code(500).send({ error: error?.message || "Erro interno" });
  }
};

/** LOGOUT */
export const logout: RouteHandler<{ Body: RefreshRequestBody }> = async (req, res) => {
  const { refreshToken } = req.body;

  try {
    await logoutService(refreshToken);
    return res.send({ message: "Logout realizado com sucesso" });
  } catch (error: any) {
    return res.code(500).send({ error: error?.message || "Erro interno" });
  }
};

/** ME (dados do usuário autenticado) */
export const me: RouteHandler = async (req, res) => {
  // `req.user` depende do middleware; guard para TS
  const authUser = (req as any).user as { sub?: string } | undefined;

  if (!authUser?.sub) {
    return res.code(401).send({ error: "Não autenticado" });
  }

  try {
    const userData = await meService(authUser.sub);
    return res.send(userData);
  } catch (error: any) {
    return res.code(500).send({ error: error?.message || "Erro interno" });
  }
};

/** REGISTER */
export const register: RouteHandler<{ Body: RegisterRequestBody }> = async (req, res) => {
  const { email, password, role, name, educationalEmail, ra } = req.body;

  // já existe esse email pessoal?
  const existing = await prisma.usuario.findUnique({
    where: { emailPessoal: email },
    select: { id: true },
  });
  if (existing) return res.code(400).send({ error: "Email já está em uso" });

  // hash da senha
  const senhaHash = await bcrypt.hash(password, 10);
  const papel = parsePapel(role);

  try {
    const user = await prisma.usuario.create({
      data: {
        nome: name,
        emailPessoal: email,
        emailEducacional: educationalEmail ?? null,
        ra: ra ?? null,
        senhaHash,
        papel,
        ativo: true,
      },
    });

    // tokens
    const accessToken = generateAccessToken({
      sub: user.id,
      email: user.emailPessoal ?? "", // seu verifyAccessToken tipa como string
      role: user.papel,
    });
    const refreshToken = generateRefreshToken({ sub: user.id });

    return res.send({ user, accessToken, refreshToken });
  } catch (error: any) {
    return res
      .code(500)
      .send({ error: "Erro ao criar o usuário", details: error?.message });
  }
};

/** GET /usuarios (protegida) */
export const getUser: RouteHandler<GetUserRoute> = async (req, res) => {
  const { ra, email, id, name, educationalEmail } = req.query;

  const where: any = {};
  if (id) where.id = id;
  if (ra) where.ra = ra;
  if (email) where.emailPessoal = email;
  if (educationalEmail) where.emailEducacional = educationalEmail;
  if (name) where.nome = { contains: name, mode: "insensitive" as const };

  try {
    const users = await prisma.usuario.findMany({ where });
    if (!users.length) {
      return res.code(404).send({ error: "Usuário não encontrado" });
    }
    return res.send(users);
  } catch (error: any) {
    return res.code(500).send({ error: error?.message || "Erro interno" });
  }
};
