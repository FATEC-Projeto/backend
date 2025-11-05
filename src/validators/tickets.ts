import { z } from 'zod'

// enums como string literal para funcionar mesmo antes do cliente Prisma
export const StatusChamadoValues = ['ABERTO','EM_ATENDIMENTO','AGUARDANDO_USUARIO','RESOLVIDO','ENCERRADO'] as const
export const NivelChamadoValues = ['N1','N2','N3'] as const
export const PrioridadeChamadoValues = ['BAIXA','MEDIA','ALTA','URGENTE'] as const

// ✅ 1. Defina as chaves de inclusão permitidas UMA VEZ
const IncludeKeysEnum = z.enum([
  'cliente',
  'contrato',
  'servico',
  'setor',
  'responsavel',
  'criadoPor',
  'historico'
]);

const IsoDate = z.string().datetime({ offset: true }).or(z.string().datetime().or(z.string())).optional()

export const ParamsWithIdSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
})

export const TicketCreateSchema = z.object({
  body: z.object({
    titulo: z.string().min(3),
    descricao: z.string().min(3),
    prioridade: z.enum(PrioridadeChamadoValues).optional().default('MEDIA'),
    nivel: z.enum(NivelChamadoValues).optional().default('N1'),
    servicoId: z.string().nullish(),
    setorId: z.string().nullish(),
    clienteId: z.string().nullish(),
    contratoId: z.string().nullish(),
    responsavelId: z.string().nullish(),
    organizacaoId: z.string().nullish(),
  }),
})

export const TicketUpdateSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    titulo: z.string().min(3).optional(),
    descricao: z.string().min(3).optional(),
    prioridade: z.enum(PrioridadeChamadoValues).optional(),
    nivel: z.enum(NivelChamadoValues).optional(),
    status: z.enum(StatusChamadoValues).optional(),
    servicoId: z.string().nullish(),
    setorId: z.string().nullish(),
    clienteId: z.string().nullish(),
    contratoId: z.string().nullish(),
    responsavelId: z.string().nullish(),
    organizacaoId: z.string().nullish(),
  }).refine(
    (b) => Object.keys(b).length > 0,
    { message: 'Nenhum campo para atualizar' },
  ),
})

export const TicketListSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1).optional(),
    pageSize: z.coerce.number().int().min(1).max(100).default(20).optional(),
    search: z.string().optional(),
    status: z.union([z.enum(StatusChamadoValues), z.array(z.enum(StatusChamadoValues))]).optional(),
    nivel: z.union([z.enum(NivelChamadoValues), z.array(z.enum(NivelChamadoValues))]).optional(),
    prioridade: z.union([z.enum(PrioridadeChamadoValues), z.array(z.enum(PrioridadeChamadoValues))]).optional(),
    clienteId: z.string().optional(),
    contratoId: z.string().optional(),
    setorId: z.string().optional(),
    servicoId: z.string().optional(),
    responsavelId: z.string().optional(),
    organizacaoId: z.string().optional(),
    criadoPorId: z.string().optional(),
    criadoDe: IsoDate,
    criadoAte: IsoDate,
    orderBy: z.enum(['criadoEm','atualizadoEm']).default('criadoEm').optional(),
    orderDir: z.enum(['asc','desc']).default('desc').optional(),
    
    // ✅ 2. Corrija o 'include' para validar a string transformada
    include: z
      .union([
        // Opção A: Já é um array (ex: ?include=setor&include=criadoPor)
        z.array(IncludeKeysEnum), 
        
        // Opção B: É uma string (ex: ?include=setor,criadoPor)
        z.string()
         .transform((s) => s.split(",").map((x) => x.trim()))
         // 'pipe' valida o resultado da transformação
         .pipe(z.array(IncludeKeysEnum)) 
      ])
      .optional(),
  }),
});
