import type { FastifyInstance } from "fastify";

export async function registerLogging(app: FastifyInstance) {
  app.addHook("onResponse", async (request, reply) => {
    request.log.info({
      trace_id: request.id,
      store_id: (request.params as { id?: string }).id,
      endpoint: request.url,
      latency_ms: Math.round(reply.elapsedTime),
      event_count: Array.isArray((request.body as { events?: unknown[] } | undefined)?.events)
        ? (request.body as { events: unknown[] }).events.length
        : undefined,
      status_code: reply.statusCode
    });
  });
}
