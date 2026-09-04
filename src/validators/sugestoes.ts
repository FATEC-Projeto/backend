import { z } from 'zod'

export const SUGESTAO_CONTEUDO_MAX = 1000
export const SUGESTAO_RESPOSTA_MAX = 1000

const SugestaoBodySchema = z.object({
  emailContato: z
    .string()
    .trim()
    .email('Informe um e-mail válido'),
  conteudo: z
    .string()
    .trim()
    .min(3, 'A sugestão deve ter pelo menos 3 caracteres')
    .max(SUGESTAO_CONTEUDO_MAX, `A sugestão deve ter no máximo ${SUGESTAO_CONTEUDO_MAX} caracteres`),
})

export const SugestaoCreateSchema = z.object({
  body: SugestaoBodySchema,
})

export const SugestaoListSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1).optional(),
    pageSize: z.coerce.number().int().min(1).max(100).default(20).optional(),
    status: z.enum(['NAO_RESPONDIDO', 'RESPONDIDO']).optional(),
  }),
})

export const ParamsWithIdSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
})

export const SugestaoResponderSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z
    .object({
      resposta: z
        .string()
        .trim()
        .min(1, 'A resposta não pode ficar vazia')
        .max(SUGESTAO_RESPOSTA_MAX, `A resposta deve ter no máximo ${SUGESTAO_RESPOSTA_MAX} caracteres`)
        .optional(),
      status: z.enum(['NAO_RESPONDIDO', 'RESPONDIDO']).optional(),
    })
    .refine((d) => d.resposta !== undefined || d.status !== undefined, {
      message: 'Informe ao menos a resposta ou o status',
    }),
})
