import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import Fastify from "fastify";
import { randomUUID } from "node:crypto";
import { ERROR_CODES } from "@store/shared";
import { prisma } from "./db/client.js";
import { EventsController } from "./controllers/eventsController.js";
import { HealthController } from "./controllers/healthController.js";
import { StoresController } from "./controllers/storesController.js";
import { EventRepository } from "./repositories/eventRepository.js";
import { PosRepository } from "./repositories/posRepository.js";
import { eventsRoutes } from "./routes/events.js";
import { healthRoutes } from "./routes/health.js";
import { storesRoutes } from "./routes/stores.js";
import { IngestService } from "./services/ingestService.js";
import { IntelligenceService } from "./services/intelligenceService.js";
import { registerAuth } from "./middleware/auth.js";
import { registerLogging } from "./middleware/logging.js";

export async function buildApp() {
  const app = Fastify({ logger: true, genReqId: () => randomUUID() });
  await app.register(cors, { origin: true });
  await app.register(rateLimit, { max: 300, timeWindow: "1 minute" });
  await registerAuth(app);
  await registerLogging(app);

  const eventRepository = new EventRepository(prisma);
  const posRepository = new PosRepository(prisma);
  const intelligenceService = new IntelligenceService();

  await eventsRoutes(app, new EventsController(new IngestService(eventRepository)));
  await storesRoutes(app, new StoresController(eventRepository, posRepository, intelligenceService));
  await healthRoutes(app, new HealthController(eventRepository));

  app.setErrorHandler((error, _request, reply) => {
    app.log.error(error);
    const message = error instanceof Error ? error.message : "Unknown error";
    const unavailable = /connect|database|prisma/i.test(message);
    reply.status(unavailable ? 503 : 500).send({
      error: {
        code: unavailable ? ERROR_CODES.DATABASE_UNAVAILABLE : "INTERNAL_ERROR",
        message: unavailable ? "Database unavailable" : "Unexpected server error"
      }
    });
  });

  return app;
}
