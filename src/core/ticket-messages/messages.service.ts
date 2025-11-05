import { PrismaClient } from "@prisma/client";

type Ctx = PrismaClient;

/**
 * Cria uma nova mensagem vinculada a um chamado
 */
export async function createTicketMessage(
  prisma: Ctx,
  chamadoId: string,
  autorId: string,
  conteudo: string
) {
  // 💾 Cria a mensagem no banco
  const msg = await prisma.mensagem.create({
    data: { chamadoId, autorId, conteudo },
    include: {
      autor: { select: { id: true, nome: true, emailPessoal: true } },
    },
  });

  // 🔔 Busca os usuários relacionados ao chamado (solicitante, responsável e setor)
  const chamado = await prisma.chamado.findUnique({
    where: { id: chamadoId },
    select: {
      criadoPorId: true,
      responsavelId: true,
      setorId: true,
      organizacaoId: true,
      protocolo: true,
    },
  });

  const userIds = new Set<string>();
  if (chamado?.criadoPorId) userIds.add(chamado.criadoPorId);
  if (chamado?.responsavelId) userIds.add(chamado.responsavelId);

  if (chamado?.setorId) {
    const vinculos = await prisma.usuarioSetor.findMany({
      where: { setorId: chamado.setorId, usuario: { ativo: true } },
      select: { usuarioId: true },
    });
    vinculos.forEach(v => userIds.add(v.usuarioId));
  }

  // 📡 Envia notificação persistente + broadcast em tempo real
  const app: any = (global as any).fastifyAppInstance; // setado no app.ts

  // 🔥 1. Broadcast WebSocket (para atualizar os chats de todos conectados)
  if ((globalThis as any).broadcastWS) {
    (globalThis as any).broadcastWS({
      type: "nova_mensagem",
      chamadoId,
      mensagem: msg,
    });
  }

  // 🔔 2. Notificação persistente (banco + push realtime)
  if (app?.notifyUsers) {
    await app.notifyUsers(
      Array.from(userIds),
      {
        titulo: "Nova mensagem no chamado",
        mensagem: `O chamado ${chamado?.protocolo ?? chamadoId} recebeu uma nova mensagem.`,
        tipo: "MENSAGEM_NOVA",
        canal: "IN_APP",
        meta: {
          chamadoId,
          autorId,
          conteudo,
        },
      },
      prisma
    );
  }

  return msg;
}

/**
 * Lista todas as mensagens de um chamado
 */
export async function listTicketMessages(
  prisma: Ctx,
  chamadoId: string,
  query: {
    page?: number;
    pageSize?: number;
    orderDir?: "asc" | "desc";
  }
) {
  const { page = 1, pageSize = 100, orderDir = "asc" } = query;

  const [total, mensagens] = await Promise.all([
    prisma.mensagem.count({ where: { chamadoId } }),
    prisma.mensagem.findMany({
      where: { chamadoId },
      orderBy: { criadoEm: orderDir },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        autor: { select: { id: true, nome: true, emailPessoal: true } },
      },
    }),
  ]);

  return { total, page, pageSize, mensagens };
}
