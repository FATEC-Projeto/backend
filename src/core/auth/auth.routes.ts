import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { login, refresh, logout, me, register, getUser, firstAccess } from "./auth.controller";
import { buildRouteValidator, zEmail, zStringTrim, zPapelOptional } from "../../utils/zod-helpers";
import { z } from "zod";
import { FirstAccessSchema } from "../../validators/auth";

const zRA = zStringTrim.min(3).max(32).regex(/^[A-Za-z0-9._-]+$/, "RA inválido");

export const LoginSchema = z
  .object({
    email: zEmail.optional(),
    ra: zRA.optional(),
    password: zStringTrim.min(8),
  })
  .refine((d) => (!!d.email) !== (!!d.ra), {
    message: "Informe email (funcionário) OU RA (aluno).",
  });

const RefreshSchema = z.object({ refreshToken: z.string().min(20) });

const RegisterSchema = z.object({
  email: zEmail, 
  password: zStringTrim.min(8),
  role: zPapelOptional, 
  name: zStringTrim.min(2),
  educationalEmail: zEmail.optional(),
  ra: zStringTrim.max(32).optional(), 
});

const GetUserQuerySchema = z.object({
  ra: zStringTrim.optional(),
  email: zEmail.optional(),
  id: zStringTrim.optional(),
  name: zStringTrim.optional(),
  educationalEmail: zEmail.optional(),
});

const preBody =
  (schema: z.ZodTypeAny) =>
  async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const v = buildRouteValidator({ body: schema }).parse(req);
    if ("error" in v) {
      await reply.code(400).send(v.error);
      return;
    }
  };

const preQuery =
  (schema: z.ZodTypeAny) =>
  async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const v = buildRouteValidator({ query: schema }).parse(req);
    if ("error" in v) {
      await reply.code(400).send(v.error);
      return;
    }
  };

export default async function authRoutes(app: FastifyInstance) {
  app.post("/login",    { preHandler: preBody(LoginSchema) }, login);
  app.post("/refresh",  { preHandler: preBody(RefreshSchema) }, refresh);
  app.post("/logout",   { preHandler: preBody(RefreshSchema) }, logout);
  app.post("/register", { preHandler: preBody(RegisterSchema) }, register);
  app.post("/primeiro-acesso", { preHandler: preBody(FirstAccessSchema) }, firstAccess);

  app.get("/me", { preHandler: app.authenticate as any }, me);
  app.get("/usuarios", { preHandler: [app.authenticate as any, preQuery(GetUserQuerySchema)] }, getUser);
}

