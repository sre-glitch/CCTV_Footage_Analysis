import type { Event } from "@store/shared";

export interface EventWriter {
  upsertMany(events: Event[]): Promise<{ accepted: number; inserted: number }>;
}

export class IngestService {
  constructor(private readonly events: EventWriter) {}

  async ingest(batch: Event[]) {
    return this.events.upsertMany(batch);
  }
}
