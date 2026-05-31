// PROMPT: Build a production-quality Store Intelligence Platform from CCTV events and POS data.
// CHANGES MADE: Added Fastify integration tests for ingest idempotency and intelligence endpoints.
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { buildApp } from "../src/app.js";
import { prisma } from "../src/db/client.js";

let app: Awaited<ReturnType<typeof buildApp>>;

const sampleEvent = {
  event_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  store_id: "store_001",
  camera_id: "ENTRY_CAMERA" as const,
  visitor_id: "integration_visitor",
  event_type: "ENTRY" as const,
  timestamp: "2026-05-30T10:00:00.000Z",
  zone_id: "ENTRY" as const,
  dwell_ms: 0,
  is_staff: false,
  confidence: 0.91,
  metadata: {}
};

beforeAll(async () => {
  app = await buildApp();
});

beforeEach(async () => {
  await prisma.event.deleteMany();
  await prisma.posTransaction.deleteMany();
  await prisma.posTransaction.create({
    data: {
      transaction_id: "tx_test",
      store_id: "store_001",
      timestamp: new Date("2026-05-30T10:04:00.000Z"),
      basket_value: 25
    }
  });
});

afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

describe("API integration", () => {
  it("ingests events idempotently", async () => {
    const first = await app.inject({ method: "POST", url: "/events/ingest", payload: { events: [sampleEvent] } });
    const second = await app.inject({ method: "POST", url: "/events/ingest", payload: { events: [sampleEvent] } });
    expect(first.statusCode).toBe(202);
    expect(second.json()).toMatchObject({ accepted: 1, inserted: 0 });
  });

  it("returns metrics computed from stored events", async () => {
    const billing = {
      ...sampleEvent,
      event_id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
      event_type: "ZONE_ENTER" as const,
      zone_id: "CASH_COUNTER" as const,
      timestamp: "2026-05-30T10:03:00.000Z"
    };
    await app.inject({ method: "POST", url: "/events/ingest", payload: { events: [sampleEvent, billing] } });
    const response = await app.inject({ method: "GET", url: "/stores/store_001/metrics" });
    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.uniqueVisitors).toBe(1);
    expect(body.convertedVisitors).toBe(1);
  });

  it("returns funnel, heatmap, anomalies, and health", async () => {
    await app.inject({ method: "POST", url: "/events/ingest", payload: { events: [sampleEvent] } });
    const funnel = await app.inject({ method: "GET", url: "/stores/store_001/funnel" });
    const heatmap = await app.inject({ method: "GET", url: "/stores/store_001/heatmap" });
    const anomalies = await app.inject({ method: "GET", url: "/stores/store_001/anomalies" });
    const health = await app.inject({ method: "GET", url: "/health" });
    expect(funnel.statusCode).toBe(200);
    expect(heatmap.statusCode).toBe(200);
    expect(anomalies.statusCode).toBe(200);
    expect(health.json().status).toBe("ok");
  });
});
