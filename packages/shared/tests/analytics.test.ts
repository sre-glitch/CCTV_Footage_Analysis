// PROMPT: Build a production-quality Store Intelligence Platform from CCTV events and POS data.
// CHANGES MADE: Added focused unit tests for metric, funnel, anomaly, heatmap, staff, duplicate, empty, and re-entry behavior.
import { describe, expect, it } from "vitest";
import { computeAnomalies, computeFunnel, computeHeatmap, computeMetrics, type Event, type PosTransaction } from "../src/index";

const base = "2026-05-30T10:00:00.000Z";

function evt(partial: Partial<Event>): Event {
  return {
    event_id: crypto.randomUUID(),
    store_id: "store_001",
    camera_id: "ENTRY_CAMERA",
    visitor_id: "v1",
    event_type: "ENTRY",
    timestamp: base,
    zone_id: "ENTRY",
    dwell_ms: 0,
    is_staff: false,
    confidence: 0.9,
    metadata: {},
    ...partial
  };
}

describe("store analytics", () => {
  it("handles an empty store", () => {
    const metrics = computeMetrics("store_001", [], []);
    expect(metrics.uniqueVisitors).toBe(0);
    expect(metrics.conversionRate).toBe(0);
    expect(metrics.queueDepth).toBe(0);
  });

  it("excludes all-staff clips from analytics", () => {
    const events = [evt({ is_staff: true }), evt({ visitor_id: "staff", event_type: "ZONE_DWELL", zone_id: "FOH", dwell_ms: 30000, is_staff: true })];
    expect(computeMetrics("store_001", events, []).uniqueVisitors).toBe(0);
    expect(computeHeatmap("store_001", events).zones.every((zone) => zone.visits === 0)).toBe(true);
  });

  it("does not double count re-entry sessions", () => {
    const events = [evt({ visitor_id: "v1", event_type: "ENTRY" }), evt({ visitor_id: "v1", event_type: "REENTRY" })];
    expect(computeMetrics("store_001", events, []).uniqueVisitors).toBe(1);
  });

  it("keeps duplicate event ids from changing pure calculations", () => {
    const duplicated = evt({ event_id: "11111111-1111-4111-8111-111111111111", visitor_id: "v1", event_type: "ENTRY" });
    expect(computeMetrics("store_001", [duplicated, duplicated], []).uniqueVisitors).toBe(1);
  });

  it("returns zero purchases without crashing", () => {
    const events = [evt({ visitor_id: "v1" }), evt({ visitor_id: "v1", event_type: "ZONE_ENTER", zone_id: "CASH_COUNTER" })];
    expect(computeMetrics("store_001", events, []).convertedVisitors).toBe(0);
  });

  it("correlates billing-zone presence to purchases inside five minutes", () => {
    const events = [
      evt({ visitor_id: "v1" }),
      evt({ visitor_id: "v1", event_type: "ZONE_ENTER", zone_id: "CASH_COUNTER", timestamp: "2026-05-30T10:01:00.000Z" })
    ];
    const tx: PosTransaction[] = [{ store_id: "store_001", transaction_id: "t1", timestamp: "2026-05-30T10:04:00.000Z", basket_value: 42 }];
    const metrics = computeMetrics("store_001", events, tx);
    expect(metrics.convertedVisitors).toBe(1);
    expect(metrics.conversionRate).toBe(1);
  });

  it("calculates session-based funnel drop-offs", () => {
    const events = [
      evt({ visitor_id: "v1" }),
      evt({ visitor_id: "v1", event_type: "ZONE_ENTER", zone_id: "LAKME" }),
      evt({ visitor_id: "v2", event_type: "ENTRY" })
    ];
    const funnel = computeFunnel("store_001", events, []);
    expect(funnel.stages.map((stage) => stage.count)).toEqual([2, 1, 0, 0]);
    expect(funnel.stages[1].dropOff).toBe(1);
  });

  it("calculates heatmap visits, dwell, and low confidence for small sessions", () => {
    const events = [
      evt({ visitor_id: "v1", event_type: "ZONE_ENTER", zone_id: "LAKME" }),
      evt({ visitor_id: "v1", event_type: "ZONE_DWELL", zone_id: "LAKME", dwell_ms: 30000 })
    ];
    const heatmap = computeHeatmap("store_001", events);
    const lakme = heatmap.zones.find((zone) => zone.zoneId === "LAKME");
    expect(heatmap.dataConfidence).toBe("LOW");
    expect(lakme?.visits).toBe(1);
    expect(lakme?.avgDwell).toBe(30000);
  });

  it("detects queue and conversion anomalies", () => {
    const entries = Array.from({ length: 6 }, (_, index) => evt({ visitor_id: `v${index}`, event_type: "ENTRY" }));
    const joins = Array.from({ length: 6 }, (_, index) =>
      evt({ visitor_id: `v${index}`, event_type: "BILLING_QUEUE_JOIN", zone_id: "CASH_COUNTER", metadata: { queue_depth: index + 1 } })
    );
    const events = [...entries, ...joins];
    const anomalies = computeAnomalies("store_001", events, []);
    expect(anomalies.some((anomaly) => anomaly.type === "QUEUE_SPIKE")).toBe(true);
    expect(anomalies.some((anomaly) => anomaly.type === "CONVERSION_DROP")).toBe(true);
  });
});
