// src/security/refresh.ts
import { prisma } from "../lib/prisma";
import { randomBytes } from "node:crypto";
import argon2 from "argon2";

export const REFRESH_TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 dias

export function generateRefreshToken() {
  const token = randomBytes(64).toString("base64url");
  return { token };
}

export async function createSession({ usuarioId, refreshToken, ip, userAgent, expiraEm }: {
  usuarioId: string; refreshToken: string; ip?: string; userAgent?: string; expiraEm: Date;
}) {
  const refreshHash = await argon2.hash(refreshToken);
  return prisma.sessao.create({
    data: { usuarioId, refreshHash, ip, userAgent, expiraEm },
  });
}

export async function createSessionWithClient(tx: any, args: {
  usuarioId: string; refreshToken: string; ip?: string; userAgent?: string; expiraEm: Date;
}) {
  const refreshHash = await argon2.hash(args.refreshToken);
  return tx.sessao.create({
    data: { usuarioId: args.usuarioId, refreshHash, ip: args.ip, userAgent: args.userAgent, expiraEm: args.expiraEm },
  });
}

export async function verifyAndGetSession(refreshToken: string) {
  const sessoes = await prisma.sessao.findMany({
    where: { revogadaEm: null },
    orderBy: { criadoEm: "desc" },
  });
  for (const s of sessoes) {
    const ok = await argon2.verify(s.refreshHash, refreshToken);
    if (ok) return s;
  }
  return null;
}

export async function rotateSession(sessaoId: string, novoRefreshToken: string) {
  const novoHash = await argon2.hash(novoRefreshToken);
  return prisma.sessao.update({
    where: { id: sessaoId },
    data: { refreshHash: novoHash, ultimoUsoEm: new Date() },
  });
}
