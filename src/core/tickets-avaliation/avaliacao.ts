import type { PrismaClient } from "@prisma/client";
import type { AvaliarChamadoBody } from "./avaliacao.types";

export const prisma = new PrismaClient();

export type Ctx = typeof prisma;

type Ctx = PrismaClient;

export async function avaliarChamado(
  prisma: Ctx,
  chamadoId: string,
  usuarioId: string,
  body: AvaliarChamadoBody
) {
  const { nota, comentario } = body;

  if (!nota || nota < 1 || nota > 5) {
    throw Object.assign(new Error("Nota inválida. Use valores entre 1 e 5."), { code: "INVALID_NOTE" });
  }

  const chamado = await prisma.chamado.findUnique({
    where: { id: chamadoId },
    select: { criadoPorId: true, status: true }
  });

  if (!chamado) {
    throw Object.assign(new Error("Chamado não encontrado"), { code: "NOT_FOUND" });
  }

  if (chamado.criadoPorId !== usuarioId) {
    throw Object.assign(new Error("Você não pode avaliar este chamado"), { code: "FORBIDDEN" });
  }

  const existente = await prisma.avaliacaoChamado.findFirst({
    where: { chamadoId, usuarioId }
  });

  if (existente) {
    throw Object.assign(new Error("Este chamado já foi avaliado"), { code: "ALREADY_EXISTS" });
  }

  const avaliacao = await prisma.avaliacaoChamado.create({
    data: {
      chamadoId,
      usuarioId,
      nota,
      comentario: comentario ?? null
    }
  });

  await prisma.chamado.update({
    where: { id: chamadoId },
    data: { status: "ENCERRADO", encerradoEm: new Date() }
  });

  return avaliacao;
}

export async function getAvaliacao(prisma: Ctx, chamadoId: string) {
  return prisma.avaliacaoChamado.findFirst({
    where: { chamadoId },
    select: {
      id: true,
      nota: true,
      comentario: true,
      criadoEm: true,
      usuarioId: true
    }
  });
}
