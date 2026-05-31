import type { FastifyInstance } from "fastify";
import type { HealthController } from "../controllers/healthController.js";

export async function healthRoutes(app: FastifyInstance, controller: HealthController) {
  app.get("/health", controller.health);
}
