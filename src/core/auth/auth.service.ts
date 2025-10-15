// src/modules/auth/auth.service.ts
import { PrismaClient, Papel } from "@prisma/client";
import bcrypt from "bcrypt";
import { generateAccessToken, generateRefreshToken } from "../../utils/jwt";
import { hashValue } from "../../utils/crypto";

const prisma = new PrismaClient();

type LoginContext = {
  ip?: string | null;
  userAgent?: string | null;
};

const REFRESH_TTL_DAYS = 7;

/** LOGIN */
export const loginService = async (
  email: string,
  password: string,
  ctx: LoginContext = {}
) => {
  const user = await prisma.usuario.findUnique({
    where: { emailPessoal: email },
  });

  if (!user || !user.ativo) {
    throw new Error("Usuário ou senha inválidos");
  }

  const validPassword = await bcrypt.compare(password, user.senhaHash);
  if (!validPassword) throw new Error("Usuário ou senha inválidos");

  // Gera tokens
  const accessToken = generateAccessToken({
    sub: user.id,
    email: user.emailPessoal ?? undefined,
    role: user.papel, // enum Papel
  });
  const refreshToken = generateRefreshToken({ sub: user.id });

  // Armazena APENAS o hash do refresh
  const refreshHash = await hashValue(refreshToken);
  const expires = new Date();
  expires.setDate(expires.getDate() + REFRESH_TTL_DAYS);

  await prisma.sessao.create({
    data: {
      usuarioId: user.id,
      refreshHash,
      expiraEm: expires,
      ip: ctx.ip ?? null,
      userAgent: ctx.userAgent ?? null,
    },
  });

  return { accessToken, refreshToken, user };
};

/** REFRESH (gera novo access a partir do refreshToken) */
export const refreshService = async (refreshToken: string) => {
  // Comparação por HASH, nunca em texto puro
  const refreshHash = await hashValue(refreshToken);

  const session = await prisma.sessao.findFirst({
    where: { refreshHash },
    include: {
      usuario: true,
    },
  });

  if (!session) throw new Error("Sessão não encontrada ou expirada");
  if (session.expiraEm && session.expiraEm < new Date()) {
    // sessão expirada → remover opcionalmente
    try {
      await prisma.sessao.delete({ where: { id: session.id } });
    } catch {}
    throw new Error("Sessão expirada");
  }

  const user = session.usuario;
  if (!user || !user.ativo) throw new Error("Usuário inativo");

  const accessToken = generateAccessToken({
    sub: user.id,
    email: user.emailPessoal ?? undefined,
    role: user.papel,
  });

  return { accessToken };
};

/** LOGOUT (invalida o refresh) */
export const logoutService = async (refreshToken: string) => {
  const refreshHash = await hashValue(refreshToken);

  const session = await prisma.sessao.findFirst({
    where: { refreshHash },
    select: { id: true },
  });

  if (!session) throw new Error("Sessão não encontrada");

  await prisma.sessao.delete({
    where: { id: session.id },
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
