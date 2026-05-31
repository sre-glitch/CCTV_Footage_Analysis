// PROMPT: Build a production-quality Store Intelligence Platform from CCTV events and POS data.
// CHANGES MADE: Repository-level duplicate ingest coverage against SQLite test database.
import { beforeEach, describe, expect, it } from "vitest";
import type { Event } from "@store/shared";
import { prisma } from "../src/db/client.js";
import { EventRepository } from "../src/repositories/eventRepository.js";

const repo = new EventRepository(prisma);

const event: Event = {
  event_id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
  store_id: "store_001",
  camera_id: "ENTRY_CAMERA",
  visitor_id: "repo_visitor",
  event_type: "ENTRY",
  timestamp: "2026-05-30T10:00:00.000Z",
  zone_id: "ENTRY",
  dwell_ms: 0,
  is_staff: false,
  confidence: 0.9,
  metadata: {}
};

beforeEach(async () => {
  await prisma.event.deleteMany();
});

describe("EventRepository", () => {
  it("deduplicates duplicate ingest batches", async () => {
    const first = await repo.upsertMany([event]);
    const second = await repo.upsertMany([event]);
    expect(first).toEqual({ accepted: 1, inserted: 1 });
    expect(second).toEqual({ accepted: 1, inserted: 0 });
  });
});
