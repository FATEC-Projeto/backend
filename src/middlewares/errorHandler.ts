// src/middlewares/errorHandler.ts
import { FastifyInstance } from "fastify";
import { env } from "../env";

type ErrorWithExtras = {
  validation?: unknown[];
  statusCode?: number;
  message?: string;
  stack?: string;
};

export function registerErrorHandler(app: FastifyInstance) {
  app.setErrorHandler((error, request, reply) => {
    const typedError = error as ErrorWithExtras;
    request.log.error({ err: error }, "Erro não tratado");

    // Erros de validação do Fastify/Zod
    if (Array.isArray(typedError.validation) && typedError.validation.length > 0) {
      return reply.status(400).send({
        error: "Dados inválidos",
        details: typedError.validation,
      });
    }

    // Rate limit
    if (typedError.statusCode === 429) {
      return reply.status(429).send({
        error: typedError.message ?? "Muitas requisições",
      });
    }

    // Erro genérico
    const statusCode = typedError.statusCode ?? 500;
    const message = typedError.message ?? "Erro interno do servidor";
    const payload: Record<string, unknown> = {
      error: statusCode >= 500 ? "Erro interno do servidor" : message,
    };

    if (env.NODE_ENV !== "production" && statusCode >= 500) {
      payload.debug = message;
      payload.stack = typedError.stack ?? "Sem stack disponível";
    }

    return reply.status(statusCode).send(payload);
  });
}
