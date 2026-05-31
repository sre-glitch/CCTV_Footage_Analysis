import type { FastifyReply, FastifyRequest } from "fastify";
import { ERROR_CODES, ingestEventsSchema } from "@store/shared";
import type { IngestService } from "../services/ingestService.js";
import { sendError } from "../types/http.js";

export class EventsController {
  constructor(private readonly ingest: IngestService) {}

  ingestEvents = async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = ingestEventsSchema.safeParse(request.body);
    if (!parsed.success) return sendError(reply, 400, ERROR_CODES.VALIDATION_ERROR, parsed.error.message);
    const result = await this.ingest.ingest(parsed.data.events);
    return reply.status(202).send(result);
  };
}
