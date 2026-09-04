import type { FastifyInstance } from 'fastify'
import { create, list, getOne, responder } from './sugestoes.controller'

export async function sugestoesRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate as any)

  // POST /sugestoes — qualquer usuário autenticado cria a própria sugestão
  app.post('/', create)

  // GET /sugestoes — aluno vê as próprias; staff vê todas
  app.get('/', list)

  // GET /sugestoes/:id — aluno só a própria; staff qualquer uma
  app.get('/:id', getOne)

  // PATCH /sugestoes/:id — somente professor/funcionário (nunca o aluno)
  app.patch(
    '/:id',
    { preHandler: (app as any).authorize(['ADMINISTRADOR', 'BACKOFFICE', 'TECNICO']) },
    responder,
  )
}
