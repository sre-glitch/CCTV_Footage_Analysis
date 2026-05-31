// PROMPT: Build a production-quality Store Intelligence Platform from CCTV events and POS data.
// CHANGES MADE: Added service-level duplicate ingest coverage with a fake repository.
import { describe, expect, it } from "vitest";
import type { Event } from "@store/shared";
import { IngestService } from "../src/services/ingestService";

describe("IngestService", () => {
  it("passes duplicate events to the idempotent repository boundary", async () => {
    const event: Event = {
      event_id: "11111111-1111-4111-8111-111111111111",
      store_id: "store_001",
      camera_id: "ENTRY_CAMERA",
      visitor_id: "v1",
      event_type: "ENTRY",
      timestamp: "2026-05-30T10:00:00.000Z",
      zone_id: "ENTRY",
      dwell_ms: 0,
      is_staff: false,
      confidence: 0.9,
      metadata: {}
    };
    const repo = {
      upsertMany: async (events: Event[]) => ({ accepted: events.length, inserted: 1 })
    };

    const result = await new IngestService(repo).ingest([event, event]);
    expect(result).toEqual({ accepted: 2, inserted: 1 });
  });
});
