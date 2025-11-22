import type { FastifyInstance } from "fastify";
import {
  list,
  readOne,
  archive,
  unarchive,
  readAll,
  createTest,
} from "./notifications.controller";

export async function notificationsRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate as any);

  app.get("/", list);
  app.post("/read-all", readAll);
  app.post("/test", createTest);
  app.patch("/:id/lida", readOne);  // A rota para marcar como lida deve ser PATCH
  app.post("/:id/archive", archive);
  app.post("/:id/unarchive", unarchive);
}
