import { FastifyInstance } from "fastify";
import { login, refresh, logout, me, register, getUser } from "./auth.controller";  
import { authenticate } from "../../middlewares/auth.middleware";  

export default async function (app: FastifyInstance) {
  // Rota de login (sem autenticação necessária)
  app.post("/login", login);

  // Rota para refresh de token (sem autenticação necessária)
  app.post("/refresh", refresh);

  // Rota de logout (sem autenticação necessária)
  app.post("/logout", logout);

  // Rota protegida de perfil do usuário (requere autenticação)
  app.get("/me", { preHandler: authenticate }, me);

  // Rota de cadastro de usuário (sem autenticação necessária)
  app.post("/register", register);

  
  app.get("/user", { preHandler: authenticate }, getUser); 
}
