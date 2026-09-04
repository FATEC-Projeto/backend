import { FastifyRequest, FastifyReply } from 'fastify'
import { buildRouteValidator } from '../../utils/zod-helpers'
import {
  SugestaoCreateSchema,
  SugestaoListSchema,
  ParamsWithIdSchema,
  SugestaoResponderSchema,
} from '../../validators/sugestoes'
import {
  createSugestao,
  listSugestoes,
  getSugestaoById,
  responderSugestao,
} from './sugestoes.service'

const errMsg = (e: unknown) => (e instanceof Error ? e.message : String(e))

const createValidator = buildRouteValidator({ body: SugestaoCreateSchema.shape.body })
const listValidator = buildRouteValidator({ query: SugestaoListSchema.shape.query })
const idValidator = buildRouteValidator({ params: ParamsWithIdSchema.shape.params })
const responderValidator = buildRouteValidator({
  params: SugestaoResponderSchema.shape.params,
  body: SugestaoResponderSchema.shape.body,
})

/* ============ POST /sugestoes ============ */
export async function create(req: FastifyRequest, res: FastifyReply) {
  const parsed = createValidator.parse(req)
  if ('error' in parsed) return void (await res.code(400).send(parsed.error))

  const prisma = req.server.prisma
  const usuarioId = req.user?.sub as string | undefined

  try {
    if (!usuarioId) return void (await res.code(401).send({ error: 'Não autenticado' }))

    const sugestao = await createSugestao(prisma, parsed.data!.body!, { usuarioId })
    await res.code(201).send(sugestao)
  } catch (e) {
    req.log.error({ e }, '💥 Erro ao criar sugestão')
    await res.code(500).send({ error: errMsg(e) })
  }
}

/* ============ GET /sugestoes ============ */
/* Aluno: lista as próprias. Staff: lista todas (com filtro de status). */
export async function list(req: FastifyRequest, res: FastifyReply) {
  const parsed = listValidator.parse(req)
  if ('error' in parsed) return void (await res.code(400).send(parsed.error))

  const prisma = req.server.prisma
  const authUser = req.user as { sub: string; role?: string } | undefined
  const usuarioId = authUser?.sub

  try {
    if (!usuarioId) return void (await res.code(401).send({ error: 'Não autenticado' }))

    const result = await listSugestoes(prisma, parsed.data!.query!, {
      usuarioId,
      role: authUser?.role,
    })
    await res.send(result)
  } catch (e) {
    req.log.error({ e }, '💥 Erro ao listar sugestões')
    await res.code(500).send({ error: errMsg(e) })
  }
}

/* ============ GET /sugestoes/:id ============ */
export async function getOne(req: FastifyRequest, res: FastifyReply) {
  const parsed = idValidator.parse(req)
  if ('error' in parsed) return void (await res.code(400).send(parsed.error))

  const prisma = req.server.prisma
  const authUser = req.user as { sub: string; role?: string } | undefined
  const usuarioId = authUser?.sub

  try {
    if (!usuarioId) return void (await res.code(401).send({ error: 'Não autenticado' }))

    const { id } = parsed.data!.params!
    const sugestao = await getSugestaoById(prisma, id, { usuarioId, role: authUser?.role })
    if (!sugestao) return void (await res.code(404).send({ error: 'Sugestão não encontrada' }))

    await res.send(sugestao)
  } catch (e) {
    req.log.error({ e }, '💥 Erro ao buscar sugestão')
    await res.code(500).send({ error: errMsg(e) })
  }
}

/* ============ PATCH /sugestoes/:id ============ */
export async function responder(req: FastifyRequest, res: FastifyReply) {
  const parsed = responderValidator.parse(req)
  if ('error' in parsed) return void (await res.code(400).send(parsed.error))

  const prisma = req.server.prisma
  const staffId = req.user?.sub as string | undefined

  try {
    if (!staffId) return void (await res.code(401).send({ error: 'Não autenticado' }))

    const { id } = parsed.data!.params!
    const atualizada = await responderSugestao(prisma, id, parsed.data!.body!, { staffId })
    await res.send(atualizada)
  } catch (e: any) {
    if (e?.code === 'NOT_FOUND')
      return void (await res.code(404).send({ error: 'Sugestão não encontrada' }))
    if (e?.code === 'LOCKED')
      return void (await res.code(409).send({ error: errMsg(e) }))
    req.log.error({ e }, '💥 Erro ao responder sugestão')
    await res.code(500).send({ error: errMsg(e) })
  }
}
