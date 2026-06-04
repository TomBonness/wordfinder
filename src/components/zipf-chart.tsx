import type { DiscoveryRecord } from "@/lib/types";
import { getZipfChartPath, getZipfChartPoints } from "./zipf-chart-geometry";

export function ZipfChart({ data }: { data: DiscoveryRecord[] }) {
  const width = 720;
  const height = 240;
  const padding = 32;

  if (data.length === 0) {
    return <div className="empty-chart">No rediscovery data yet.</div>;
  }

  const points = getZipfChartPoints(data, width, height, padding);
  const path = getZipfChartPath(points);

  return (
    <figure className="zipf-card" aria-labelledby="zipf-heading">
      <div className="section-heading-row">
        <div>
          <div className="kicker">rank curve</div>
          <h2 id="zipf-heading">Top searched words by rank</h2>
        </div>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Top searched words plotted by rank and search count">
        <line x1={padding} x2={width - padding} y1={height - padding} y2={height - padding} className="chart-axis" />
        <line x1={padding} x2={padding} y1={padding} y2={height - padding} className="chart-axis" />
        <path d={path} className="zipf-line" />
        {points.map((point) => {
          const searchLabel = point.searchCount === 1 ? "search" : "searches";

          return (
            <circle key={point.word} cx={point.x} cy={point.y} r="5" className="zipf-point">
              <title>{`${point.display}: rank ${point.rank}, ${point.searchCount.toLocaleString()} ${searchLabel}`}</title>
            </circle>
          );
        })}
      </svg>
      <figcaption>
        If public rediscovery behaves like a Zipf curve, the left side should climb sharply while lower-ranked words trail into a
        long, quiet tail.
      </figcaption>
    </figure>
  );
}
