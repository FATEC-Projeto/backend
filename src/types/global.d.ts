import type { FastifyInstance } from "fastify";
import type WebSocket from "ws";

declare global {
  var app: FastifyInstance & {
    wsClients?: Map<string, WebSocket>;
    notifyUsers?: (
      userIds: string[],
      payload: Record<string, any>,
      prisma: any
    ) => Promise<void>;
  };
}

export {};
