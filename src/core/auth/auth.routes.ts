// src/modules/auth/auth.routes.ts
import { FastifyInstance } from "fastify";
import { login, refresh, logout, me, register, getUser } from "./auth.controller";
import { authenticate } from "../../middlewares/auth.middleware";

export default async function authRoutes(app: FastifyInstance) {
  // Schemas de validação
  const loginSchema = {
    body: {
      type: "object",
      required: ["email", "password"],
      properties: {
        email: { type: "string", format: "email" },
        password: { type: "string", minLength: 1 },
      },
      additionalProperties: false,
    },
  } as const;

  const tokenSchema = {
    body: {
      type: "object",
      required: ["refreshToken"],
      properties: {
        refreshToken: { type: "string", minLength: 10 },
      },
      additionalProperties: false,
    },
  } as const;

  const registerSchema = {
    body: {
      type: "object",
      required: ["email", "password", "name"],
      properties: {
        email: { type: "string", format: "email" },  // email pessoal
        password: { type: "string", minLength: 6 },
        role: { type: "string" },                    // USUARIO | BACKOFFICE | TECNICO | ADMINISTRADOR
        name: { type: "string", minLength: 1 },      // nome
        educationalEmail: { type: "string", nullable: true },
        ra: { type: "string", nullable: true },
      },
      additionalProperties: false,
    },
  } as const;

  // Schema de querystring para /usuarios
  const getUserQuerySchema = {
    querystring: {
      type: "object",
      properties: {
        ra: { type: "string" },
        email: { type: "string" },             // email pessoal
        id: { type: "string" },
        name: { type: "string" },
        educationalEmail: { type: "string" },
      },
      additionalProperties: false,
    },
  } as const;

  // Rotas de autenticação
  app.post("/auth/login", { schema: loginSchema }, login);
  app.post("/auth/refresh", { schema: tokenSchema }, refresh);
  app.post("/auth/logout", { schema: tokenSchema }, logout);
  app.post("/auth/register", { schema: registerSchema }, register);

  // Perfil protegido
  app.get("/auth/me", { preHandler: authenticate }, me);

  app.get<{
    Querystring: {
      ra?: string;
      email?: string;
      id?: string;
      name?: string;
      educationalEmail?: string;
    };
  }>(
    "/usuarios",
    { preHandler: authenticate, schema: getUserQuerySchema },
    getUser
  );
}
