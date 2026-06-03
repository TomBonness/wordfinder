import { getStore } from "./get-store";
import type { DailyStat, StatsSummary } from "./types";

export async function getStatsSummary(): Promise<StatsSummary> {
  return getStore().getStats();
}

export async function getDailyStats(limitDays = 30): Promise<DailyStat[]> {
  return getStore().getDailyStats(Math.max(1, Math.min(limitDays, 365)));
}
