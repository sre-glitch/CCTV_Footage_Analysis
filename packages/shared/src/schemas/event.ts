import { z } from "zod";
import { CAMERA_IDS, EVENT_TYPES, ZONE_IDS } from "../constants/index.js";

export const eventSchema = z.object({
  event_id: z.string().uuid(),
  store_id: z.string().min(1),
  camera_id: z.enum(CAMERA_IDS),
  visitor_id: z.string().min(1),
  event_type: z.enum(EVENT_TYPES),
  timestamp: z.string().datetime({ offset: true }),
  zone_id: z.enum(ZONE_IDS).nullable(),
  dwell_ms: z.number().int().min(0),
  is_staff: z.boolean(),
  confidence: z.number().min(0).max(1),
  metadata: z.record(z.unknown()).default({})
});

export const ingestEventsSchema = z.object({
  events: z.array(eventSchema).min(1).max(500)
});

export type EventInput = z.infer<typeof eventSchema>;
export type IngestEventsInput = z.infer<typeof ingestEventsSchema>;
