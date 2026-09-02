// src/app.ts
import Fastify from "fastify";
import cors from "@fastify/cors";
import websocket from "@fastify/websocket";
import multipart from "@fastify/multipart";
import fastifyFormbody from "@fastify/formbody";
import fastifyCookie from "@fastify/cookie";
import path from "path";
import fs from "fs";

import { env } from "./env";
import prismaPlugin from "./plugins/prisma";
import authRoutes from "./core/auth/auth.routes";
import authVerify from "./plugins/auth-verify";
import auditoriaRoutes from "./core/auditoria/auditoria.routes";
import { usersRoutes } from "./core/users/users.routes";
import { ticketsRoutes } from "./core/tickets/tickets.routes";
import { catalogoRoutes } from "./core/catalogo/catalogo.routes";
import swaggerPlugin from "./plugins/swagger";
import helmetPlugin from "./plugins/helmet";
import rateLimitPlugin from "./plugins/rateLimit";
import { registerErrorHandler } from "./middlewares/errorHandler";
import { setoresRoutes } from "./core/setores/setores.routes";
import { papeisRoutes } from "./core/papeis/papeis.routes";
import { usuarioSetorRoutes } from "./core/usuario-setor/usuarioSetor.routes";
import { comunicacoesRoutes } from "./core/comunicacoes/comunicacoes.routes";
import { notificationsRoutes } from "./core/notifications/notifications.routes";
import { anexoRoutes } from "./core/anexos/anexos.routes";
import { verifyAccessToken } from "./utils/jwt";
import { scheduleCleanupAnexos } from "./jobs/cleanupAnexos";

/* ====== Configuração de uploads ====== */
function ensureUploadsDirectory() {
  const directory = path.resolve(
    env.STORAGE_DRIVER === "local" ? env.LOCAL_STORAGE_DIR : "./uploads",
  );

  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }

  return directory;
}

const UPLOADS_DIR = ensureUploadsDirectory();

function isOriginAllowed(origin: string | undefined, allowedOrigins: string[]) {
  if (!origin) return true;
  return allowedOrigins.includes(origin);
}

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === "production" ? "info" : "debug",
      ...(env.NODE_ENV !== "production" && {
        transport: { target: "pino-pretty", options: { colorize: true } },
      }),
    },
    trustProxy: true,
  });

  await app.register(helmetPlugin);
  await app.register(rateLimitPlugin);
  await app.register(fastifyFormbody);

  // Limite de 10MB por arquivo (proteção contra DoS por upload)
  await app.register(multipart, {
    limits: { fileSize: 10 * 1024 * 1024 },
  });

  const allowedOrigins = env.CORS_ORIGIN
    ? env.CORS_ORIGIN.split(",").map((o) => o.trim())
    : [];

  await app.register(cors, {
    origin: (origin, cb) => {
      if (isOriginAllowed(origin, allowedOrigins)) return cb(null, true);
      app.log.warn({ origin }, "Origin bloqueado pelo CORS");
      return cb(new Error("Not allowed by CORS"), false);
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  });

  await app.register(fastifyCookie, {
    secret: env.COOKIE_SECRET || "dev-secret",
    parseOptions: {
      httpOnly: true,
      sameSite: env.NODE_ENV === "production" ? "none" : "lax",
      secure: env.NODE_ENV === "production",
      path: "/",
    },
  });

  await app.register(prismaPlugin);
  await app.register(authVerify);
  await app.register(swaggerPlugin);
  await app.register(websocket);

  registerErrorHandler(app);

  // NOTA: /downloads/ foi removido intencionalmente.
  // Arquivos são servidos exclusivamente via GET /anexos/:id (rota autenticada).

  app.addHook("onRequest", async (req) =>
    req.log.debug({ method: req.method, url: req.url }, "REQ"),
  );

  // ✅ Health check público
  app.get("/health", async (_req, reply) => {
    try {
      await app.prisma.$queryRaw`SELECT 1`;
      return { status: "ok", db: "connected" };
    } catch {
      return reply.status(503).send({ status: "degraded", db: "disconnected" });
    }
  });

  app.register(authRoutes, { prefix: "/auth" });
  app.register(usersRoutes, { prefix: "/usuarios" });
  app.register(ticketsRoutes, { prefix: "/tickets" });
  app.register(catalogoRoutes, { prefix: "/catalogo" });
  app.register(setoresRoutes, { prefix: "/admin" });
  app.register(papeisRoutes, { prefix: "/admin" });
  app.register(usuarioSetorRoutes, { prefix: "/admin" });
  app.register(comunicacoesRoutes, { prefix: "/admin" });
  app.register(notificationsRoutes, { prefix: "/notifications" });
  app.register(anexoRoutes, { prefix: "/" });
  app.register(auditoriaRoutes);

  // ---------------------------------------------------------
  // 🔌 WebSocket — autenticado por handshake no primeiro frame.
  // O cliente envia { type: "auth", token } logo após conectar, evitando
  // o JWT na query string (que vaza em logs de acesso/proxy).
  // O token via ?token= ainda é aceito como fallback de compatibilidade.
  // ---------------------------------------------------------
  const connections = new Map<string, import("ws").WebSocket>();
  const AUTH_TIMEOUT_MS = 10_000;

  app.get("/ws", { websocket: true }, (connection, _req) => {
    const socket = (connection as any).socket ?? (connection as any);

    let userId: string | null = null;
    let authTimer: ReturnType<typeof setTimeout> | null = null;

    function authenticate(token: unknown): boolean {
      if (typeof token !== "string" || !token) return false;
      try {
        userId = verifyAccessToken(token).sub;
        connections.set(userId, socket);
        app.log.info(`WS conectado: userId=${userId}`);
        return true;
      } catch {
        return false;
      }
    }

    // Autenticação exclusivamente pelo 1º frame { type: "auth", token } — o
    // token nunca vai na URL (evita vazamento em logs). Fecha se não chegar.
    authTimer = setTimeout(() => {
      if (!userId) {
        socket.send(JSON.stringify({ error: "Timeout de autenticação" }));
        socket.close();
      }
    }, AUTH_TIMEOUT_MS);

    socket.on("message", async (rawMsg: string) => {
      let data: any;
      try {
        data = JSON.parse(rawMsg);
      } catch {
        return;
      }

      // Handshake: enquanto não autenticado, só o frame { type: "auth" } vale.
      if (!userId) {
        if (data?.type === "auth" && authenticate(data.token)) {
          if (authTimer) { clearTimeout(authTimer); authTimer = null; }
          socket.send(JSON.stringify({ type: "auth_ok" }));
        } else {
          socket.send(JSON.stringify({ error: "Não autenticado" }));
          socket.close();
        }
        return;
      }

      try {
        if (data.type === "nova_mensagem") {
          const { chamadoId, mensagem, autorId, autor } = data;
          for (const [, client] of connections) {
            if (client.readyState === client.OPEN) {
              client.send(JSON.stringify({
                type: "nova_mensagem",
                chamadoId,
                mensagem: {
                  id: Date.now().toString(),
                  conteudo: mensagem,
                  criadoEm: new Date().toISOString(),
                  autorId,
                  autor,
                },
              }));
            }
          }
        }
      } catch (err) {
        app.log.error({ err }, "Erro ao processar WS message");
      }
    });

    socket.on("close", () => {
      if (authTimer) { clearTimeout(authTimer); authTimer = null; }
      if (userId) {
        connections.delete(userId);
        app.log.info(`WS desconectado: userId=${userId}`);
      }
    });

    socket.on("error", (err: unknown) => {
      app.log.error({ err }, `WS erro (${userId ?? "não autenticado"})`);
    });
  });

  (globalThis as any).broadcastWS = (data: any) => {
    for (const [, socket] of connections) {
      if (socket.readyState === socket.OPEN) socket.send(JSON.stringify(data));
    }
  };

  app.decorate("notifyUsers", async (userIds: string[], data: any) => {
    if (!userIds.length) return;

    // Respeita a preferência: só entrega a quem optou por notificações in-app.
    const optIn = await app.prisma.usuario.findMany({
      where: { id: { in: userIds }, notificacoesInApp: true },
      select: { id: true },
    });
    const alvos = new Set(optIn.map((u: { id: string }) => u.id));

    for (const userId of userIds) {
      if (!alvos.has(userId)) continue;

      const socket = connections.get(userId);
      if (socket && socket.readyState === socket.OPEN) socket.send(JSON.stringify(data));

      await app.prisma.notificacao.create({
        data: {
          usuarioId: userId,
          titulo: data.titulo ?? "Nova notificação",
          mensagem: data.mensagem ?? "Você tem uma atualização no chamado",
          tipo: data.tipo ?? "SISTEMA",
          canal: data.canal ?? "IN_APP",
          meta: data.meta ?? {},
        },
      });
    }
  });

  // Referência global usada por messages.service — necessária por limitação de arquitetura
  // TODO: refatorar para injeção de dependência via plugin Fastify
  (global as any).fastifyAppInstance = app;

  scheduleCleanupAnexos(app.prisma, UPLOADS_DIR);

  return app;
}
