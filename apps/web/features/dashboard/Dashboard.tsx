"use client";

import { AlertTriangle, Percent, ShoppingBag, Users, Waves } from "lucide-react";
import { useEffect } from "react";
import { useDashboardStore } from "../../store/dashboard";
import { StatCard } from "../../components/ui/StatCard";

const fmtPct = (value: number) => `${Math.round(value * 100)}%`;

export function Dashboard() {
  const { metrics, funnel, heatmap, anomalies, loading, refresh } = useDashboardStore();

  useEffect(() => {
    refresh("store_001");
    const timer = window.setInterval(() => refresh("store_001"), 10000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  if (loading && !metrics) return <main className="shell">Loading store intelligence...</main>;

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Apex Retail</p>
          <h1>Store Intelligence</h1>
        </div>
        <button className="iconButton" onClick={() => refresh("store_001")} title="Refresh dashboard">
          <Waves size={18} />
        </button>
      </header>

      <section className="stats">
        <StatCard label="Visitors" value={`${metrics?.uniqueVisitors ?? 0}`} icon={Users} />
        <StatCard label="Conversion" value={fmtPct(metrics?.conversionRate ?? 0)} icon={Percent} tone="good" />
        <StatCard label="Queue Depth" value={`${metrics?.queueDepth ?? 0}`} icon={ShoppingBag} tone={(metrics?.queueDepth ?? 0) >= 5 ? "warn" : "neutral"} />
        <StatCard label="Anomalies" value={`${anomalies.length}`} icon={AlertTriangle} tone={anomalies.length ? "warn" : "good"} />
      </section>

      <section className="grid">
        <div className="panel">
          <h2>Funnel</h2>
          <div className="funnel">
            {funnel?.stages.map((stage) => (
              <div key={stage.stage} className="funnelRow">
                <span>{stage.stage}</span>
                <b>{stage.count}</b>
                <progress value={stage.conversionPct} max={1} />
                <small>{fmtPct(stage.conversionPct)}</small>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <h2>Heatmap</h2>
          <p className="muted">Confidence: {heatmap?.dataConfidence ?? "LOW"}</p>
          <div className="heatmap">
            {heatmap?.zones.slice(0, 12).map((zone) => (
              <div key={zone.zoneId} className="zone" style={{ ["--score" as string]: zone.normalizedScore }}>
                <span>{zone.zoneId}</span>
                <b>{zone.visits}</b>
              </div>
            ))}
          </div>
        </div>

        <div className="panel wide">
          <h2>Anomalies</h2>
          <div className="anomalies">
            {anomalies.length === 0 ? <p className="muted">No active anomalies.</p> : null}
            {anomalies.map((anomaly, index) => (
              <article key={`${anomaly.type}-${index}`} className="anomaly">
                <strong>{anomaly.type}</strong>
                <span>{anomaly.severity}</span>
                <p>{anomaly.suggestedAction}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
