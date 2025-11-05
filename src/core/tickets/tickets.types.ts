import { NivelChamado, PrioridadeChamado, StatusChamado } from '@prisma/client'

export type TicketsListQuery = {
  page?: number
  pageSize?: number
  search?: string
  status?: StatusChamado | StatusChamado[]
  nivel?: NivelChamado | NivelChamado[]
  prioridade?: PrioridadeChamado | PrioridadeChamado[]
  clienteId?: string
  contratoId?: string
  setorId?: string
  servicoId?: string
  responsavelId?: string
  organizacaoId?: string
  criadoDe?: string // ISO
  criadoAte?: string // ISO
  orderBy?: 'criadoEm' | 'atualizadoEm'
  orderDir?: 'asc' | 'desc'
  criadoPorId?: string
  include?: ('cliente' | 'contrato' | 'servico' | 'setor' | 'responsavel' | 'criadoPor' | 'historico')[]
}

export type TicketCreateInput = {
  titulo: string
  descricao: string
  prioridade?: PrioridadeChamado
  nivel?: NivelChamado
  servicoId?: string | null
  setorId?: string | null
  clienteId?: string | null
  contratoId?: string | null
  responsavelId?: string | null
  organizacaoId?: string | null
}

export type TicketUpdateInput = Partial<TicketCreateInput> & {
  status?: StatusChamado
}
