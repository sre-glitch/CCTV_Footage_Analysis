"use client";

import {
  AlertTriangle,
  Percent,
  ShoppingBag,
  Users,
  RefreshCw,
  TrendingUp
} from "lucide-react";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

import {
  ResponsiveContainer,
  FunnelChart,
  Funnel,
  Tooltip,
  AreaChart,
  Area,
  XAxis,
  CartesianGrid
} from "recharts";

import { useDashboardStore } from "../../store/dashboard";
import { StatCard } from "../../components/ui/StatCard";

const fmtPct = (value: number) => `${Math.round(value * 100)}%`;

export function Dashboard() {
  const [storeId, setStoreId] = useState("store_001");

  const { metrics, funnel, heatmap, anomalies, refresh } =
    useDashboardStore();

  useEffect(() => {
    refresh(storeId);

    const timer = setInterval(() => {
      refresh(storeId);
    }, 10000);

    return () => clearInterval(timer);
  }, [refresh, storeId]);

  const funnelData =
    funnel?.stages.map((stage) => ({
      name: stage.stage,
      value: stage.count
    })) ?? [];

  const heatmapData =
    heatmap?.zones.map((z) => ({
      name: z.zoneId,
      visits: z.visits
    })) ?? [];

  return (
    <main className="shell">
      <div className="backgroundGlow" />

      <header className="topbar">
        <div>
          <span className="eyebrow">Apex Retail Analytics</span>
          <h1>Store Intelligence Dashboard</h1>
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <select
            value={storeId}
            onChange={(e) => setStoreId(e.target.value)}
          >
            <option value="store_001">Store 1</option>
            <option value="store_002">Store 2</option>
          </select>

          <button
            className="refreshButton"
            onClick={() => refresh(storeId)}
          >
            <RefreshCw size={18} />
            Refresh
          </button>
        </div>
      </header>

      <section className="stats">
        <StatCard
          label="Visitors"
          value={`${metrics?.uniqueVisitors ?? 0}`}
          icon={Users}
        />

        <StatCard
          label="Conversion"
          value={fmtPct(metrics?.conversionRate ?? 0)}
          icon={Percent}
          tone="good"
        />

        <StatCard
          label="Queue Depth"
          value={`${metrics?.queueDepth ?? 0}`}
          icon={ShoppingBag}
          tone="warn"
        />

        <StatCard
          label="Anomalies"
          value={`${anomalies.length}`}
          icon={AlertTriangle}
          tone="warn"
        />
      </section>

      <section className="grid">
        <motion.div
          className="panel"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <h2>Conversion Funnel</h2>

          <ResponsiveContainer width="100%" height={280}>
            <FunnelChart>
              <Tooltip />
              <Funnel
                dataKey="value"
                data={funnelData}
                isAnimationActive
              />
            </FunnelChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          className="panel"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <h2>Zone Engagement</h2>

          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={heatmapData}>
              <defs>
                <linearGradient id="colorVisits">
                  <stop offset="5%" stopColor="#4f8cff" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#4f8cff" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <Tooltip />

              <Area
                type="monotone"
                dataKey="visits"
                stroke="#4f8cff"
                fillOpacity={1}
                fill="url(#colorVisits)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          className="panel wide"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="panelHeader">
            <h2>Anomaly Detection</h2>
            <TrendingUp size={18} />
          </div>

          <div className="anomalies">
            {anomalies.map((anomaly, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.01 }}
                className="anomaly"
              >
                <div>
                  <strong>{anomaly.type}</strong>
                  <p>{anomaly.suggestedAction}</p>
                </div>

                <span className={`severity ${anomaly.severity}`}>
                  {anomaly.severity}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>
    </main>
  );
}