import type { FastifyReply } from "fastify";

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    trace_id?: string;
  };
}

export function sendError(reply: FastifyReply, statusCode: number, code: string, message: string) {
  return reply.status(statusCode).send({ error: { code, message, trace_id: reply.request.id } } satisfies ApiErrorBody);
}
