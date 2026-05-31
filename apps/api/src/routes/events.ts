import type { FastifyInstance } from "fastify";
import type { EventsController } from "../controllers/eventsController.js";

export async function eventsRoutes(app: FastifyInstance, controller: EventsController) {
  app.post("/events/ingest", controller.ingestEvents);
}
