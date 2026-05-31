import type { FastifyInstance } from "fastify";
import { env } from "../config/env.js";

export async function registerAuth(app: FastifyInstance) {
  app.addHook("preHandler", async (request, reply) => {
    if (!env.API_KEY) return;
    if (request.headers["x-api-key"] === env.API_KEY) return;
    return reply.status(401).send({ error: { code: "UNAUTHORIZED", message: "Invalid API key", trace_id: request.id } });
  });
}
