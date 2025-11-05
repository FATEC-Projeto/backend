import fp from "fastify-plugin";
import { verifyAccessToken, verifyDownloadToken } from "../utils/jwt";

export default fp(async (app) => {
  app.decorate("authenticate", async (req: any, res: any) => {
    try {
      let token: string | undefined;

      const authHeader = req.headers?.authorization;
      if (authHeader && typeof authHeader === 'string') {
        token = authHeader.replace(/^Bearer\s+/i, "");
      }

      if (!token && req.cookies?.access_token) {
        token = req.cookies.access_token;
      }

      if (!token && req.query?.access_token) {
        token = req.query.access_token;
      }

      if (!token) throw new Error("Token ausente");

      try {
        const decoded = verifyAccessToken(token);
        req.user = decoded;
      } catch (accessErr) {
        const dl = verifyDownloadToken(token);
        req.user = { sub: dl.sub, __downloadAnexoId: dl.anexoId, __download: true };
      }
    } catch (err) {
      app.log.warn({ err }, "Falha de autenticação JWT");
      return res.code(401).send({ error: "Não autorizado" });
    }
  });
});
