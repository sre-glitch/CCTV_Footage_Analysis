import { POS_CORRELATION_WINDOW_MS, ZONE_IDS } from "../constants/index.js";
import type { Anomaly, Event, Funnel, Heatmap, Metrics, ZoneId } from "../types/index.js";

export interface PosTransaction {
  store_id: string;
  transaction_id: string;
  timestamp: string;
  basket_value: number;
}

const customerEvents = (events: Event[]) => events.filter((event) => !event.is_staff);
const unique = <T>(items: T[]) => Array.from(new Set(items));

export function convertedVisitorIds(events: Event[], transactions: PosTransaction[]): Set<string> {
  const converted = new Set<string>();
  const customers = customerEvents(events);
  for (const tx of transactions) {
    const txTime = Date.parse(tx.timestamp);
    for (const event of customers) {
      if (event.store_id !== tx.store_id || event.zone_id !== "CASH_COUNTER") continue;
      const eventTime = Date.parse(event.timestamp);
      if (eventTime <= txTime && txTime - eventTime <= POS_CORRELATION_WINDOW_MS) {
        converted.add(event.visitor_id);
        break;
      }
    }
  }
  return converted;
}

export function computeMetrics(storeId: string, events: Event[], transactions: PosTransaction[]): Metrics {
  const scoped = customerEvents(events).filter((event) => event.store_id === storeId);
  const visitors = unique(scoped.filter((event) => event.event_type === "ENTRY" || event.event_type === "REENTRY").map((event) => event.visitor_id));
  const converted = convertedVisitorIds(scoped, transactions.filter((tx) => tx.store_id === storeId));
  const dwellEvents = scoped.filter((event) => event.event_type === "ZONE_DWELL");
  const avgDwell = dwellEvents.length ? Math.round(dwellEvents.reduce((sum, event) => sum + event.dwell_ms, 0) / dwellEvents.length) : 0;
  const joins = scoped.filter((event) => event.event_type === "BILLING_QUEUE_JOIN");
  const abandons = scoped.filter((event) => event.event_type === "BILLING_QUEUE_ABANDON");
  const latestJoinDepth = joins.at(-1)?.metadata.queue_depth;
  const queueDepth = typeof latestJoinDepth === "number" ? latestJoinDepth : Math.max(0, joins.length - converted.size - abandons.length);

  return {
    storeId,
    uniqueVisitors: visitors.length,
    convertedVisitors: converted.size,
    conversionRate: visitors.length ? converted.size / visitors.length : 0,
    avgDwell,
    queueDepth,
    abandonmentRate: joins.length ? abandons.length / joins.length : 0
  };
}

export function computeFunnel(storeId: string, events: Event[], transactions: PosTransaction[]): Funnel {
  const scoped = customerEvents(events).filter((event) => event.store_id === storeId);
  const entered = new Set(scoped.filter((event) => event.event_type === "ENTRY" || event.event_type === "REENTRY").map((event) => event.visitor_id));
  const zoned = new Set(scoped.filter((event) => event.event_type === "ZONE_ENTER" && event.zone_id !== "ENTRY" && event.zone_id !== "EXIT").map((event) => event.visitor_id));
  const billing = new Set(scoped.filter((event) => event.zone_id === "CASH_COUNTER" || event.event_type === "BILLING_QUEUE_JOIN").map((event) => event.visitor_id));
  const purchased = convertedVisitorIds(scoped, transactions.filter((tx) => tx.store_id === storeId));
  const counts = [entered.size, zoned.size, billing.size, purchased.size];
  const names = ["ENTRY", "ZONE", "BILLING", "PURCHASE"] as const;

  return {
    storeId,
    stages: names.map((stage, index) => ({
      stage,
      count: counts[index],
      conversionPct: counts[0] ? counts[index] / counts[0] : 0,
      dropOff: index === 0 ? 0 : Math.max(0, counts[index - 1] - counts[index])
    }))
  };
}

export function computeHeatmap(storeId: string, events: Event[]): Heatmap {
  const scoped = customerEvents(events).filter((event) => event.store_id === storeId);
  const sessionCount = unique(scoped.map((event) => event.visitor_id)).length;
  const zones = ZONE_IDS.map((zoneId) => {
    const zoneEvents = scoped.filter((event) => event.zone_id === zoneId && (event.event_type === "ZONE_ENTER" || event.event_type === "ZONE_DWELL"));
    const dwell = zoneEvents.filter((event) => event.event_type === "ZONE_DWELL");
    return {
      zoneId,
      visits: unique(zoneEvents.map((event) => event.visitor_id)).length,
      avgDwell: dwell.length ? Math.round(dwell.reduce((sum, event) => sum + event.dwell_ms, 0) / dwell.length) : 0,
      normalizedScore: 0
    };
  });
  const maxVisits = Math.max(1, ...zones.map((zone) => zone.visits));

  return {
    storeId,
    dataConfidence: sessionCount < 20 ? "LOW" : sessionCount < 100 ? "MEDIUM" : "HIGH",
    zones: zones.map((zone) => ({ ...zone, normalizedScore: zone.visits / maxVisits }))
  };
}

export function computeAnomalies(storeId: string, events: Event[], transactions: PosTransaction[]): Anomaly[] {
  const metrics = computeMetrics(storeId, events, transactions);
  const heatmap = computeHeatmap(storeId, events);
  const anomalies: Anomaly[] = [];

  if (metrics.queueDepth >= 5) {
    anomalies.push({
      type: "QUEUE_SPIKE",
      severity: metrics.queueDepth >= 8 ? "CRITICAL" : "WARN",
      suggestedAction: "Open another billing counter or assign staff to checkout assistance.",
      metadata: { queueDepth: metrics.queueDepth, threshold: 5 }
    });
  }

  if (metrics.uniqueVisitors >= 5 && metrics.conversionRate < 0.2) {
    anomalies.push({
      type: "CONVERSION_DROP",
      severity: metrics.conversionRate < 0.1 ? "CRITICAL" : "WARN",
      suggestedAction: "Review floor assistance and product availability near high-dwell zones.",
      metadata: { conversionRate: metrics.conversionRate, baseline: 0.2 }
    });
  }

  for (const zone of heatmap.zones.filter((zone) => zone.visits === 0 && !["ENTRY", "EXIT"].includes(zone.zoneId))) {
    anomalies.push({
      type: "DEAD_ZONE",
      severity: "INFO",
      suggestedAction: `Inspect merchandising, visibility, and camera coverage for ${zone.zoneId}.`,
      metadata: { zoneId: zone.zoneId }
    });
  }

  return anomalies;
}
