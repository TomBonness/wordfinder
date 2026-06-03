import type { DailyStat } from "@/lib/types";

export function StatsChart({ data }: { data: DailyStat[] }) {
  const width = 720;
  const height = 220;
  const padding = 28;
  const max = Math.max(1, ...data.map((item) => item.discoveryCount));
  const points = data.map((item, index) => {
    const denominator = Math.max(1, data.length - 1);
    const x = padding + (index / denominator) * (width - padding * 2);
    const y = height - padding - (item.discoveryCount / max) * (height - padding * 2);
    return { ...item, x, y };
  });
  const path = points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(" ");

  if (data.length === 0) {
    return <div className="empty-chart">No daily discovery data yet.</div>;
  }

  return (
    <figure className="chart-card">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Daily discoveries line chart">
        <line x1={padding} x2={width - padding} y1={height - padding} y2={height - padding} className="chart-axis" />
        <line x1={padding} x2={padding} y1={padding} y2={height - padding} className="chart-axis" />
        <path d={path} className="chart-line" />
        {points.map((point) => (
          <circle key={point.day} cx={point.x} cy={point.y} r="4" className="chart-point">
            <title>{`${point.day}: ${point.discoveryCount} discoveries`}</title>
          </circle>
        ))}
      </svg>
      <figcaption>{data.length} days of first discoveries</figcaption>
    </figure>
  );
}
