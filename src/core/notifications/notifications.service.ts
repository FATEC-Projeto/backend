import { PrismaClient } from "@prisma/client";
import type { NotificationsListQuery } from "./notifications.types";

type Ctx = PrismaClient;

function parseISO(v?: string) {
  if (!v) return undefined;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

const buildWhere = (userId: string, q: NotificationsListQuery) => {
  const criadoDe = parseISO(q.criadoDe);
  const criadoAte = parseISO(q.criadoAte);

  return {
    usuarioId: userId,
    ...(q.apenasNaoLidas ? { lidaEm: null, arquivadaEm: null } : {}),
    ...(q.tipo ? { tipo: q.tipo } : {}),
    ...(q.canal ? { canal: q.canal } : {}),
    ...((criadoDe || criadoAte) && {
      criadoEm: { ...(criadoDe ? { gte: criadoDe } : {}), ...(criadoAte ? { lte: criadoAte } : {}) },
    }),
    ...(q.search && {
      OR: [
        { titulo:   { contains: q.search, mode: "insensitive" as const } },
        { mensagem: { contains: q.search, mode: "insensitive" as const } },
      ],
    }),
  };
};

export async function listNotifications(prisma: Ctx, userId: string, q: NotificationsListQuery) {
  const page = q.page ?? 1;
  const pageSize = q.pageSize ?? 50;
  const skip = (page - 1) * pageSize;
  const take = pageSize;

  const where = buildWhere(userId, q);

  const [total, items] = await Promise.all([
    prisma.notificacao.count({ where }),
    prisma.notificacao.findMany({
      where,
      orderBy: { [q.orderBy ?? "criadoEm"]: q.orderDir ?? "desc" },
      skip,
      take,
      select: {
        id: true,
        usuarioId: true,
        titulo: true,
        mensagem: true,
        tipo: true,
        canal: true,
        criadoEm: true,
        lidaEm: true,
        arquivadaEm: true,
        erroEntrega: true,
        meta: true,
        organizacaoId: true,
        chamadoId: true,
        mensagemId: true,
        anexoId: true,
      },
    }),
  ]);

  return { total, page, pageSize, items };
}

export async function markAsRead(prisma: Ctx, id: string, userId: string) {
  const r = await prisma.notificacao.update({
    where: { id: id },  // Usando 'id' para encontrar a notificação
    data: {
      lidaEm: new Date(),  // Atualizando 'lidaEm' para marcar como lida
      arquivadaEm: null,   // Garantindo que 'arquivadaEm' seja nulo
      erroEntrega: null,   // Limpando qualquer erro de entrega
    },
  });
  if (!r) throw Object.assign(new Error("Notificação não encontrada"), { code: "P2025" });
}




export async function archiveNotification(prisma: Ctx, id: string, userId: string) {
  const r = await prisma.notificacao.updateMany({
    where: { id, usuarioId: userId },
    data: { arquivadaEm: new Date() },
  });
  if (!r.count) throw Object.assign(new Error("Notificação não encontrada"), { code: "P2025" });
}

export async function unarchiveNotification(prisma: Ctx, id: string, userId: string) {
  const r = await prisma.notificacao.updateMany({
    where: { id, usuarioId: userId },
    data: { arquivadaEm: null },
  });
  if (!r.count) throw Object.assign(new Error("Notificação não encontrada"), { code: "P2025" });
}

export async function markAllAsRead(prisma: Ctx, userId: string) {
  const r = await prisma.notificacao.updateMany({
    where: { usuarioId: userId, lidaEm: null, arquivadaEm: null },
    data: { lidaEm: new Date() },
  });
  return { count: r.count };
}

export async function createTestNotification(prisma: Ctx, userId: string) {
  return prisma.notificacao.create({
    data: {
      usuarioId: userId,
      titulo: "Ping do sistema",
      mensagem: "Exemplo de notificação",
      tipo: "SISTEMA",
      canal: "IN_APP",
      meta: { url: "/dashboard" },
    },
    select: { id: true },
  });
}
