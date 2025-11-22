import { FastifyInstance } from "fastify";
import * as ctl from "./papeis.controller";

export async function papeisRoutes(app: FastifyInstance) {
  const handlers = {
    preHandler: [app.authenticate, app.authorize(['ADMINISTRADOR'])],
  }

  app.get('/papeis', handlers, ctl.list)
  app.post('/papeis', handlers, ctl.create)
  app.get('/papeis/:id', handlers, ctl.getOne)
  app.patch('/papeis/:id', handlers, ctl.patch)
  app.delete('/papeis/:id', handlers, ctl.removeHard)
}