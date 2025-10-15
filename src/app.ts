import Fastify from "fastify";
import prismaPlugin from "./plugins/prisma";  
import authRoutes from "./core/auth/auth.routes";  

export async function buildApp() {
  const app = Fastify({ logger: true });

  // Registrando o plugin do Prisma para a conexão com o banco de dados
  await app.register(prismaPlugin);

  // Registrando as rotas de autenticação com o prefixo /auth
  app.register(authRoutes, { prefix: "/auth" });

  // Rota de health check para verificar se o servidor está ativo
  app.get("/health", async () => ({ ok: true }));

  return app;
}

