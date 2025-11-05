import { FastifyRequest, FastifyReply } from "fastify";
import { buildRouteValidator } from "../../utils/zod-helpers";
import {
  TicketCreateSchema,
  TicketListSchema,
  TicketUpdateSchema,
  ParamsWithIdSchema,
} from "../../validators/tickets";
const {
  createTicket,
  getTicketById,
  listTickets,
  updateTicket,
  softDeleteTicket,
} = require('./tickets.service');

import type { TicketsListQuery } from "./tickets.types";

const errMsg = (e: unknown) => (e instanceof Error ? e.message : String(e));

const createValidator = buildRouteValidator({
  body: TicketCreateSchema.shape.body,
});
const listValidator = buildRouteValidator({
  query: TicketListSchema.shape.query,
});
const idValidator = buildRouteValidator({
  params: ParamsWithIdSchema.shape.params,
});
const updateValidator = buildRouteValidator({
  params: TicketUpdateSchema.shape.params,
  body: TicketUpdateSchema.shape.body,
});

/* ============ POST /tickets ============ */
export async function create(req: FastifyRequest, res: FastifyReply) {
  const parsed = createValidator.parse(req);
  if ("error" in parsed)
    return void (await res.code(400).send(parsed.error));

  const prisma = (req.server as any).prisma;
  const feitoPorId = (req as any).user?.sub as string | undefined;

  try {
    if (!feitoPorId)
      return void (await res.code(401).send({ error: "Não autenticado" }));

    const ticket = await createTicket(prisma, parsed.data!.body!, {
      feitoPorId,
    });

    await res.code(201).send(ticket);
  } catch (e) {
    req.log.error({ e }, "💥 Erro ao criar ticket");
    await res.code(500).send({ error: errMsg(e) });
  }
}

/* ============ GET /tickets/:id ============ */
export async function getOne(req: FastifyRequest, res: FastifyReply) {
  const parsed = idValidator.parse(req);
  if ("error" in parsed)
    return void (await res.code(400).send(parsed.error));

  const prisma = (req.server as any).prisma;
  try {
    const ticket = await getTicketById(prisma, parsed.data!.params!.id, [
      "cliente",
      "contrato",
      "servico",
      "setor",
      "responsavel",
      "criadoPor",
      "historico",
    ]);

    if (!ticket)
      return void (await res.code(404).send({ error: "Chamado não encontrado" }));

    await res.send(ticket);
  } catch (e) {
    req.log.error({ e }, "💥 Erro ao buscar ticket");
    await res.code(500).send({ error: errMsg(e) });
  }
}

/* ============ GET /tickets ============ */
export async function list(req: FastifyRequest, res: FastifyReply) {
  const parsed = listValidator.parse(req);
  if ("error" in parsed)
    return void (await res.code(400).send(parsed.error));

  const prisma = (req.server as any).prisma;

  const authUser = (req as any).user as { sub: string; role: string } | undefined;
  if (!authUser) {
    return void (await res.code(401).send({ error: "Não autenticado" }));
  }

  try {
    const q = parsed.data!.query!;
    const isAluno = authUser.role === 'USUARIO';

    // ✅ CORREÇÃO FINAL DA LÓGICA
    const query: TicketsListQuery = {
      ...q,
      include: q.include, 
      // Se for aluno, força o ID do token.
      // Se for admin, usa o 'criadoPorId' que veio da query (q.criadoPorId)
      criadoPorId: isAluno ? authUser.sub : q.criadoPorId,
    };

    const page = await listTickets(prisma, query);
    await res.send(page);
  } catch (e) {
    req.log.error({ e }, "💥 Erro ao listar tickets");
    await res.code(500).send({ error: "Erro interno ao listar tickets" });
  }
}


/* ============ PATCH /tickets/:id ============ */
export async function patch(req: FastifyRequest, res: FastifyReply) {
  const parsed = updateValidator.parse(req);
  if ("error" in parsed)
    return void (await res.code(400).send(parsed.error));

  const prisma = (req.server as any).prisma;
  const feitoPorId = (req as any).user?.sub as string | undefined;

  try {
    const ticket = await updateTicket(
      prisma,
      parsed.data!.params!.id,
      parsed.data!.body!,
      { feitoPorId }
    );
    await res.send(ticket);
  } catch (e: any) {
    if (e?.code === "P2025")
      return void (await res
        .code(404)
        .send({ error: "Chamado não encontrado" }));
    req.log.error({ e }, "💥 Erro ao atualizar ticket");
    await res.code(500).send({ error: errMsg(e) });
  }
}

/* ============ DELETE /tickets/:id (soft) ============ */
export async function removeSoft(req: FastifyRequest, res: FastifyReply) {
  const parsed = idValidator.parse(req);
  if ("error" in parsed)
    return void (await res.code(400).send(parsed.error));

  const prisma = (req.server as any).prisma;
  const feitoPorId = (req as any).user?.sub as string | undefined;

  try {
    const ticket = await softDeleteTicket(
      prisma,
      parsed.data!.params!.id,
      { feitoPorId }
    );
    await res.send(ticket);
  } catch (e: any) {
    if (e?.code === "P2025")
      return void (await res
        .code(404)
        .send({ error: "Chamado não encontrado" }));
    req.log.error({ e }, "💥 Erro ao remover (soft) ticket");
    await res.code(500).send({ error: errMsg(e) });
  }
}
