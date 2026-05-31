import type { FastifyReply, FastifyRequest } from "fastify";
import type { EventRepository } from "../repositories/eventRepository.js";
import type { PosRepository } from "../repositories/posRepository.js";
import type { IntelligenceService } from "../services/intelligenceService.js";

interface StoreParams {
  id: string;
}

export class StoresController {
  constructor(
    private readonly events: EventRepository,
    private readonly pos: PosRepository,
    private readonly intelligence: IntelligenceService
  ) {}

  metrics = async (request: FastifyRequest<{ Params: StoreParams }>, reply: FastifyReply) => {
    const events = await this.events.findByStore(request.params.id);
    const transactions = await this.pos.findByStore(request.params.id);
    return reply.send(this.intelligence.metrics(request.params.id, events, transactions));
  };

  funnel = async (request: FastifyRequest<{ Params: StoreParams }>, reply: FastifyReply) => {
    const events = await this.events.findByStore(request.params.id);
    const transactions = await this.pos.findByStore(request.params.id);
    return reply.send(this.intelligence.funnel(request.params.id, events, transactions));
  };

  heatmap = async (request: FastifyRequest<{ Params: StoreParams }>, reply: FastifyReply) => {
    const events = await this.events.findByStore(request.params.id);
    return reply.send(this.intelligence.heatmap(request.params.id, events));
  };

  anomalies = async (request: FastifyRequest<{ Params: StoreParams }>, reply: FastifyReply) => {
    const events = await this.events.findByStore(request.params.id);
    const transactions = await this.pos.findByStore(request.params.id);
    return reply.send({ storeId: request.params.id, anomalies: this.intelligence.anomalies(request.params.id, events, transactions) });
  };
}
