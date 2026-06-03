import Link from "next/link";
import { StatsChart } from "@/components/stats-chart";
import { getDailyStats, getStatsSummary } from "@/lib/stats";

export const dynamic = "force-dynamic";

export default async function StatsPage() {
  const [summary, daily] = await Promise.all([getStatsSummary(), getDailyStats(30)]);

  return (
    <div className="page-shell stats-page">
      <section className="stats-hero">
        <div className="kicker">public statistics</div>
        <h1>{summary.totalDiscovered.toLocaleString()} discovered words</h1>
        <p className="lede">Counts are updated when a corpus word is found for the first time. Rediscoveries increase a word’s public signal.</p>
      </section>

      <section className="stats-grid" aria-label="Summary metrics">
        <Metric label="total discovered" value={summary.totalDiscovered.toLocaleString()} />
        <Metric
          label="word of the day"
          value={summary.wordOfTheDay?.display ?? "—"}
          href={summary.wordOfTheDay ? `/word/${encodeURIComponent(summary.wordOfTheDay.word)}` : undefined}
        />
        <Metric label="daily entries" value={daily.length.toString()} />
      </section>

      <StatsChart data={daily} />

      <section className="top-list" aria-labelledby="top-heading">
        <div className="section-heading-row">
          <div>
            <div className="kicker">rediscovery</div>
            <h2 id="top-heading">Most searched words</h2>
          </div>
        </div>
        {summary.topRediscovered.length === 0 ? (
          <p className="muted-copy">No rediscovery data yet.</p>
        ) : (
          <ol>
            {summary.topRediscovered.map((item) => (
              <li key={item.word}>
                <Link href={`/word/${encodeURIComponent(item.word)}`}>{item.display}</Link>
                <span>{item.searchCount.toLocaleString()}</span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

function Metric({ label, value, href }: { label: string; value: string; href?: string }) {
  const content = <span className="metric-value">{value}</span>;
  return (
    <article className="metric-card">
      {href ? <Link href={href}>{content}</Link> : content}
      <span className="metric-label">{label}</span>
    </article>
  );
}
