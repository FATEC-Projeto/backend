import { PrismaClient } from '@prisma/client'
import { SugestaoCreateInput, SugestaoResponderInput, SugestoesListQuery } from './sugestoes.types'

type Ctx = PrismaClient

const MAX_PAGE_SIZE = 100
const DEFAULT_PAGE_SIZE = 20

const STAFF_ROLES = ['ADMINISTRADOR', 'BACKOFFICE', 'TECNICO']
export function isStaffRole(role?: string) {
  return !!role && STAFF_ROLES.includes(role)
}

export async function createSugestao(
  prisma: Ctx,
  data: SugestaoCreateInput,
  opts: { usuarioId?: string },
) {
  const { usuarioId } = opts
  if (!usuarioId) throw Object.assign(new Error('Não autenticado'), { code: 'UNAUTH' })

  return prisma.sugestao.create({
    data: {
      usuarioId,
      emailContato: data.emailContato,
      conteudo: data.conteudo,
    },
  })
}

/**
 * Lista sugestões. Alunos (USUARIO) só veem as próprias; staff
 * (ADMINISTRADOR/BACKOFFICE/TECNICO) vê todas, com filtro opcional de status.
 */
export async function listSugestoes(
  prisma: Ctx,
  query: SugestoesListQuery,
  opts: { usuarioId: string; role?: string },
) {
  const page = query.page ?? 1
  const pageSize = Math.min(query.pageSize ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE)
  const staff = isStaffRole(opts.role)

  const where = {
    ...(staff ? {} : { usuarioId: opts.usuarioId }),
    ...(query.status ? { status: query.status } : {}),
  }

  const [total, items] = await Promise.all([
    prisma.sugestao.count({ where }),
    prisma.sugestao.findMany({
      where,
      orderBy: { criadoEm: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: staff
        ? { usuario: { select: { id: true, nome: true, ra: true } } }
        : undefined,
    }),
  ])

  return { total, page, pageSize, items }
}

export async function getSugestaoById(
  prisma: Ctx,
  id: string,
  opts: { usuarioId: string; role?: string },
) {
  const sugestao = await prisma.sugestao.findUnique({
    where: { id },
    include: {
      usuario: { select: { id: true, nome: true, ra: true } },
      respondidoPor: { select: { id: true, nome: true } },
    },
  })

  if (!sugestao) return null
  if (!isStaffRole(opts.role) && sugestao.usuarioId !== opts.usuarioId) return null

  return sugestao
}

export async function responderSugestao(
  prisma: Ctx,
  id: string,
  data: SugestaoResponderInput,
  opts: { staffId: string },
) {
  const atual = await prisma.sugestao.findUnique({
    where: { id },
    select: { status: true, resposta: true },
  })
  if (!atual) throw Object.assign(new Error('Sugestão não encontrada'), { code: 'NOT_FOUND' })

  if (atual.status === 'RESPONDIDO') {
    throw Object.assign(
      new Error('Sugestão já respondida: resposta e status não podem mais ser alterados'),
      { code: 'LOCKED' },
    )
  }

  if (data.resposta !== undefined && atual.resposta) {
    throw Object.assign(
      new Error('A resposta já foi salva e não pode ser editada'),
      { code: 'LOCKED' },
    )
  }

  return prisma.sugestao.update({
    where: { id },
    data: {
      ...(data.resposta !== undefined ? { resposta: data.resposta } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
      respondidoPorId: opts.staffId,
      respondidoEm: new Date(),
    },
  })
}
