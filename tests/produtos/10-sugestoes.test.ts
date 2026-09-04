import { vi, describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import type { FastifyInstance } from 'fastify'

// 1. Importando o motor e as ferramentas da sua equipe
import { buildApp } from '../../src/app'
import { prismaMock } from '../../src/lib/__mocks__/prisma'
import { makeUserToken, bearerAuth } from '../helpers/auth'
import { resetMocks } from '../helpers/reset'

// 2. Mocks obrigatórios que a sua equipe usa
vi.mock('../../src/lib/prisma')
vi.mock('../../src/jobs/cleanupAnexos', () => ({ scheduleCleanupAnexos: vi.fn() }))

let app: FastifyInstance
let userToken: string 

// 3. Ligando o motor antes dos testes
beforeAll(async () => {
  app = await buildApp()
  await app.ready()
  // Usamos o UserToken porque é o Aluno que envia a sugestão
  userToken = makeUserToken() 
})

afterAll(async () => {
  await app.close()
})

beforeEach(() => {
  resetMocks()
})

// 4. O Teste de Verdade
describe('POST /sugestoes — Caixa de Sugestões', () => {

  it('201 — cria uma nova sugestão com sucesso', async () => {
    // PREPARAR (Arrange): Criamos uma sugestão falsa contendo o emailContato obrigatório
    const novaSugestaoFalsa = {
      id: 'sug_123',
      conteudo: 'Testando a urna direto pelo motor, sem navegador!',
      usuarioId: 'usu_123',
      emailContato: 'aluno@fatec.sp.gov.br',
      status: 'NAO_RESPONDIDO',
      resposta: null,
      respondidoPorId: null,
      respondidoEm: null,
      criadoEm: new Date()
    }
    
    prismaMock.sugestao.create.mockResolvedValueOnce(novaSugestaoFalsa as any) 

    // AGIR (Act): O Fastify atira os dados contra a rota enviando o e-mail no payload
    const res = await app.inject({
      method: 'POST',
      url: '/sugestoes', 
      headers: bearerAuth(userToken), 
      payload: {
        conteudo: 'Testando a urna direto pelo motor, sem navegador!',
        emailContato: 'aluno@fatec.sp.gov.br'
      },
    })

    // VERIFICAR (Assert): Conferimos se o motor respondeu com sucesso e devolveu o ID
    expect(res.statusCode).toBe(201)
    expect(res.json()).toHaveProperty('id')
  })

})