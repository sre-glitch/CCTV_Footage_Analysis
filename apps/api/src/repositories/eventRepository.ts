import type { PrismaClient } from "@prisma/client";
import type { Event } from "@store/shared";

const toDomain = (event: Awaited<ReturnType<PrismaClient["event"]["findMany"]>>[number]): Event => ({
  event_id: event.event_id,
  store_id: event.store_id,
  camera_id: event.camera_id as Event["camera_id"],
  visitor_id: event.visitor_id,
  event_type: event.event_type as Event["event_type"],
  timestamp: event.timestamp.toISOString(),
  zone_id: event.zone_id as Event["zone_id"],
  dwell_ms: event.dwell_ms,
  is_staff: event.is_staff,
  confidence: event.confidence,
  metadata: JSON.parse(event.metadata || "{}") as Record<string, unknown>
});

export class EventRepository {
  constructor(private readonly db: PrismaClient) {}

  async upsertMany(events: Event[]) {
    const ids = events.map((event) => event.event_id);
    const existing = await this.db.event.findMany({ where: { event_id: { in: ids } }, select: { event_id: true } });
    const existingIds = new Set(existing.map((event) => event.event_id));
    let inserted = 0;
    for (const event of events) {
      if (existingIds.has(event.event_id)) continue;
      await this.db.event.create({
        data: {
          event_id: event.event_id,
          store_id: event.store_id,
          camera_id: event.camera_id,
          visitor_id: event.visitor_id,
          event_type: event.event_type,
          timestamp: new Date(event.timestamp),
          zone_id: event.zone_id,
          dwell_ms: event.dwell_ms,
          is_staff: event.is_staff,
          confidence: event.confidence,
          metadata: JSON.stringify(event.metadata)
        }
      });
      existingIds.add(event.event_id);
      inserted += 1;
    }
    return { accepted: events.length, inserted };
  }

  async findByStore(storeId: string): Promise<Event[]> {
    const events = await this.db.event.findMany({ where: { store_id: storeId }, orderBy: { timestamp: "asc" } });
    return events.map(toDomain);
  }

  async findLast() {
    const event = await this.db.event.findFirst({ orderBy: { timestamp: "desc" } });
    return event ? toDomain(event) : null;
  }
}
