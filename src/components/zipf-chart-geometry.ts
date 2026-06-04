import type { DiscoveryRecord } from "@/lib/types";

export type ZipfChartPoint = {
  word: string;
  display: string;
  searchCount: number;
  rank: number;
  x: number;
  y: number;
};

export function getZipfChartPoints(data: DiscoveryRecord[], width: number, height: number, padding: number): ZipfChartPoint[] {
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  const max = Math.max(1, ...data.map((item) => item.searchCount));
  const denominator = Math.max(1, data.length - 1);

  return data.map((item, index) => {
    const rank = index + 1;
    const x = data.length === 1 ? width / 2 : padding + (index / denominator) * chartWidth;
    const y = height - padding - (item.searchCount / max) * chartHeight;

    return { word: item.word, display: item.display, searchCount: item.searchCount, rank, x, y };
  });
}

export function getZipfChartPath(points: ZipfChartPoint[]): string {
  return points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(" ");
}
