import { computeAnomalies, computeFunnel, computeHeatmap, computeMetrics, type Event, type PosTransaction } from "@store/shared";

export class IntelligenceService {
  metrics(storeId: string, events: Event[], transactions: PosTransaction[]) {
    return computeMetrics(storeId, events, transactions);
  }

  funnel(storeId: string, events: Event[], transactions: PosTransaction[]) {
    return computeFunnel(storeId, events, transactions);
  }

  heatmap(storeId: string, events: Event[]) {
    return computeHeatmap(storeId, events);
  }

  anomalies(storeId: string, events: Event[], transactions: PosTransaction[]) {
    return computeAnomalies(storeId, events, transactions);
  }
}
