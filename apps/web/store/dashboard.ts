import { create } from "zustand";
import type { Anomaly, Funnel, Heatmap, Metrics } from "@store/shared";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

interface DashboardState {
  metrics: Metrics | null;
  funnel: Funnel | null;
  heatmap: Heatmap | null;
  anomalies: Anomaly[];
  loading: boolean;
  error: string | null;
  refresh: (storeId: string) => Promise<void>;
}

async function safeFetch<T>(url: string): Promise<T | null> {
  try {
    const controller = new AbortController();

    const timeout = setTimeout(() => {
      controller.abort();
    }, 5000);

    const response = await fetch(url, {
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch {
    return null;
  }
}

export const useDashboardStore = create<DashboardState>((set) => ({
  metrics: null,
  funnel: null,
  heatmap: null,
  anomalies: [],
  loading: true,
  error: null,

  refresh: async (storeId) => {
    set({ loading: true });

    const [metrics, funnel, heatmap, anomalyResponse] =
      await Promise.all([
        safeFetch<Metrics>(
          `${API_URL}/stores/${storeId}/metrics`
        ),
        safeFetch<Funnel>(
          `${API_URL}/stores/${storeId}/funnel`
        ),
        safeFetch<Heatmap>(
          `${API_URL}/stores/${storeId}/heatmap`
        ),
        safeFetch<{ anomalies: Anomaly[] }>(
          `${API_URL}/stores/${storeId}/anomalies`
        )
      ]);

    set({
      metrics,
      funnel,
      heatmap,
      anomalies: anomalyResponse?.anomalies ?? [],
      loading: false,
      error:
        !metrics && !funnel && !heatmap
          ? "Unable to reach API"
          : null
    });
  }
}));
