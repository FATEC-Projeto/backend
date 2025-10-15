// src/middlewares/auth.middleware.ts
import { FastifyReply, FastifyRequest } from "fastify";
import { verifyAccessToken } from "../utils/jwt";

declare module "fastify" {
  interface FastifyRequest {
    user?: {
      sub: string;
      email: string;
      role: string;
    };
  }
}

export async function authenticate(req: FastifyRequest, res: FastifyReply) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.code(401).send({ error: "Token ausente" });
  }

  const token = header.slice("Bearer ".length).trim();
  if (!token) {
    return res.code(401).send({ error: "Token inválido" });
  }

  try {
    const payload = verifyAccessToken(token); // { sub, email, role }
    req.user = payload;
  } catch (err: any) {
    return res.code(401).send({ error: "Não autorizado", details: err?.message });
  }
}
