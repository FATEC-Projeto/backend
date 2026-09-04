import { vi } from 'vitest'

function buildMock() {
  const mock: any = {
    $connect: vi.fn().mockResolvedValue(undefined),
    $disconnect: vi.fn().mockResolvedValue(undefined),
    $queryRaw: vi.fn().mockResolvedValue([{ 1: 1 }]),
    usuario: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
      delete: vi.fn(),
    },
    chamado: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
    },
    mensagem: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    setor: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    categoria: {
      findMany: vi.fn(),
    },
    servico: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    notificacao: {
      create: vi.fn(),
      createMany: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      count: vi.fn(),
    },
    auditoria: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    papelCatalogo: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    usuarioSetor: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    loginTentativa: {
      create: vi.fn(),
    },
    sessao: {
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    tokenResetSenha: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    anexo: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    historicoStatusChamado: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    comunicacaoTemplate: {
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
    comunicacaoTemplate: {
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
    sugestao: {
      create: vi.fn(),
    },
  }
  // $transaction passes the mock itself as the tx client so inner calls work
  
  // $transaction passes the mock itself as the tx client so inner calls work
  mock.$transaction = vi.fn().mockImplementation((fnOrArr: any) =>
    typeof fnOrArr === 'function' ? fnOrArr(mock) : Promise.all(fnOrArr),
  )
  return mock
}

export const prismaMock = buildMock()
export const prisma = prismaMock
