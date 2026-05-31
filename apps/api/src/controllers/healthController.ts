import type { FastifyReply, FastifyRequest } from "fastify";
import { env } from "../config/env.js";
import type { EventRepository } from "../repositories/eventRepository.js";

export class HealthController {
  constructor(private readonly events: EventRepository) {}

  health = async (_request: FastifyRequest, reply: FastifyReply) => {
    const last = await this.events.findLast();
    const lastEventTimestamp = last?.timestamp ?? null;
    const stale = last ? Date.now() - Date.parse(last.timestamp) > env.STALE_FEED_MINUTES * 60 * 1000 : true;
    return reply.send({ status: "ok", lastEventTimestamp, staleFeedWarning: stale });
  };
}
