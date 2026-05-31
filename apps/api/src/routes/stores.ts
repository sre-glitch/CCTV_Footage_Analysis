import type { FastifyInstance } from "fastify";
import type { StoresController } from "../controllers/storesController.js";

export async function storesRoutes(app: FastifyInstance, controller: StoresController) {
  app.get("/stores/:id/metrics", controller.metrics);
  app.get("/stores/:id/funnel", controller.funnel);
  app.get("/stores/:id/heatmap", controller.heatmap);
  app.get("/stores/:id/anomalies", controller.anomalies);
}
