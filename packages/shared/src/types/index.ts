import type { CAMERA_IDS, EVENT_TYPES, ZONE_IDS } from "../constants/index.js";

export type EventType = (typeof EVENT_TYPES)[number];
export type CameraId = (typeof CAMERA_IDS)[number];
export type ZoneId = (typeof ZONE_IDS)[number];
export type Severity = "INFO" | "WARN" | "CRITICAL";
export type DataConfidence = "LOW" | "MEDIUM" | "HIGH";

export interface Event {
  event_id: string;
  store_id: string;
  camera_id: CameraId;
  visitor_id: string;
  event_type: EventType;
  timestamp: string;
  zone_id: ZoneId | null;
  dwell_ms: number;
  is_staff: boolean;
  confidence: number;
  metadata: Record<string, unknown>;
}

export interface Metrics {
  storeId: string;
  uniqueVisitors: number;
  convertedVisitors: number;
  conversionRate: number;
  avgDwell: number;
  queueDepth: number;
  abandonmentRate: number;
}

export interface FunnelStage {
  stage: "ENTRY" | "ZONE" | "BILLING" | "PURCHASE";
  count: number;
  conversionPct: number;
  dropOff: number;
}

export interface Funnel {
  storeId: string;
  stages: FunnelStage[];
}

export interface HeatmapZone {
  zoneId: ZoneId;
  visits: number;
  avgDwell: number;
  normalizedScore: number;
}

export interface Heatmap {
  storeId: string;
  dataConfidence: DataConfidence;
  zones: HeatmapZone[];
}

export interface Anomaly {
  type: "QUEUE_SPIKE" | "CONVERSION_DROP" | "DEAD_ZONE";
  severity: Severity;
  suggestedAction: string;
  metadata: Record<string, unknown>;
}

export interface Store {
  id: string;
  name: string;
  timezone: string;
}

export interface Visitor {
  visitorId: string;
  storeId: string;
  firstSeen: string;
  lastSeen: string;
  isStaff: boolean;
}
