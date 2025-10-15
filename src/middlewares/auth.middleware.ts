import { FastifyRequest, FastifyReply } from "fastify";
import { verifyAccessToken } from "../utils/jwt";  

export const authenticate = async (req: FastifyRequest, reply: FastifyReply) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];  

  if (!token) {
    return reply.status(401).send({ error: "Token não fornecido" });
  }

  try {
    // Verificando o token e atribuindo as informações do usuário ao `req.user`
    const decoded = verifyAccessToken(token);
    req.user = decoded;  
  } catch (error) {
    return reply.status(401).send({ error: "Token inválido ou expirado" });
  }
};
