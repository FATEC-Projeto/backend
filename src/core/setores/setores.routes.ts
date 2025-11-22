import { FastifyInstance } from "fastify";
import * as ctl from "./setores.controller";

export async function setoresRoutes(app: FastifyInstance) {
  const handlers = {
    preHandler: [app.authenticate, app.authorize(['ADMINISTRADOR'])],
  }

  app.post('/setores', handlers, ctl.create)
  app.get('/setores/:id', handlers, ctl.getOne)
  app.get('/setores', handlers, ctl.list)
  app.patch('/setores/:id', handlers, ctl.patch)
  app.delete('/setores/:id', handlers, ctl.removeHard)
}