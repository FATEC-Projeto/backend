import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { generateAccessToken, generateRefreshToken } from "../../utils/jwt";
import { hashValue } from "../../utils/crypto";  

const prisma = new PrismaClient();

// Serviço para login de usuário
export const loginService = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.isActive) throw new Error("Usuário ou senha inválidos");

  const validPassword = await bcrypt.compare(password, user.passwordHash);
  if (!validPassword) throw new Error("Usuário ou senha inválidos");

  const accessToken = generateAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role,
  });

  const refreshToken = generateRefreshToken({ sub: user.id });

  // Hash do refreshToken para armazenamento
  const refreshHash = await hashValue(refreshToken);

  // Criar sessão no banco de dados com refresh token
  await prisma.session.create({
    data: {
      userId: user.id,
      refreshHash,
      expiresAt: new Date(new Date().setDate(new Date().getDate() + 7)), // Expira em 7 dias
      ip: "", 
      userAgent: "", 
    },
  });

  return { accessToken, refreshToken, user };
};

// Serviço para gerar novo access token usando refresh token
export const refreshService = async (refreshToken: string) => {
  // Verificar refreshToken no banco de dados
  const session = await prisma.session.findFirst({
    where: { refreshHash: refreshToken }, 
  });

  if (!session) throw new Error("Sessão não encontrada ou expirou");

  const accessToken = generateAccessToken({
    sub: session.userId,
    email: "user-email", 
    role: "user-role", 
  });

  return { accessToken };
};

// Serviço para logout (invalidar o refresh token)
export const logoutService = async (refreshToken: string) => {
  // Encontrar a sessão com base no refresh token
  const session = await prisma.session.findFirst({
    where: { refreshHash: refreshToken }, // Verifica o refreshHash
  });

  if (session) {
    await prisma.session.delete({
      where: { id: session.id }, // Deleta a sessão do banco de dados
    });
  } else {
    throw new Error("Sessão não encontrada");
  }
};

// Serviço para obter dados do usuário (protegido por autenticação)
export const meService = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) throw new Error("Usuário não encontrado");

  return user; // Retorna os dados do usuário
};
