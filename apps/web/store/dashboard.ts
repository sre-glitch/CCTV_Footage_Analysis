import { create } from "zustand";
import type { Anomaly, Funnel, Heatmap, Metrics } from "@store/shared";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

interface DashboardState {
  metrics: Metrics | null;
  funnel: Funnel | null;
  heatmap: Heatmap | null;
  anomalies: Anomaly[];
  loading: boolean;
  refresh: (storeId: string) => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  metrics: null,
  funnel: null,
  heatmap: null,
  anomalies: [],
  loading: true,
  refresh: async (storeId) => {
    set({ loading: true });
    const [metrics, funnel, heatmap, anomalyResponse] = await Promise.all([
      fetch(`${API_URL}/stores/${storeId}/metrics`).then((response) => response.json()),
      fetch(`${API_URL}/stores/${storeId}/funnel`).then((response) => response.json()),
      fetch(`${API_URL}/stores/${storeId}/heatmap`).then((response) => response.json()),
      fetch(`${API_URL}/stores/${storeId}/anomalies`).then((response) => response.json())
    ]);
    set({ metrics, funnel, heatmap, anomalies: anomalyResponse.anomalies ?? [], loading: false });
  }
}));
