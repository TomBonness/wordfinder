import { SearchPanel } from "@/components/search-panel";
import { StatsChart } from "@/components/stats-chart";
import { ZipfChart } from "@/components/zipf-chart";
import { getDailyStats, getStatsSummary } from "@/lib/stats";
import type { DiscoveryRecord } from "@/lib/types";

export const dynamic = "force-dynamic";

const PASSIVE_HIDDEN_WORDS = new Set(["manana", "mañana"]);

function isPassiveVisibleWord(item: DiscoveryRecord): boolean {
  return !PASSIVE_HIDDEN_WORDS.has(item.word);
}

export default async function HomePage() {
  const [summary, daily] = await Promise.all([getStatsSummary(), getDailyStats(30)]);
  const rankedWords = summary.topRediscovered.filter(isPassiveVisibleWord);
  const rediscoverySearches = rankedWords.reduce((sum, item) => sum + item.searchCount, 0);
  const topWords = rankedWords.slice(0, 8);

  return (
    <div className="page-shell story-page">
      <section className="story-hero" aria-label="Zipf word-search experiment">
        <SearchPanel />
        <div className="story-hero-copy">
          <div className="kicker">public Zipf experiment</div>
          <p className="story-deck">
            Search any word that comes to mind. Each rediscovery adds one public count, and the ranked counts can reveal whether
            collective curiosity bends into a Zipf-like curve.
          </p>
        </div>
      </section>

      <section className="story-section story-copy" aria-labelledby="experiment-heading">
        <div className="kicker">how it works</div>
        <h2 id="experiment-heading">Random searches become a ranked public signal.</h2>
        <div className="story-columns">
          <p>
            Every valid search checks one dictionary boundary. A first match creates a public word record; later matches increment
            that word’s rediscovery count.
          </p>
          <p>
            Nothing is weighted or predicted. The curve is made from the order people actually search: familiar words pile up, while
            rare rediscoveries stretch into the tail.
          </p>
        </div>
      </section>

      <section className="curve-section" aria-labelledby="curve-heading">
        <div className="curve-intro">
          <div>
            <div className="kicker">live rank curve</div>
            <h2 id="curve-heading">The experiment is the graph.</h2>
          </div>
          <p>
            The left edge tracks the most rediscovered words. The long right side is where one-off searches wait to be found again.
          </p>
        </div>
        <ZipfChart data={rankedWords} />
        <div className="story-metrics" aria-label="Current experiment metrics">
          <Metric label="discovered words" value={summary.totalDiscovered.toLocaleString()} />
          <Metric label="rediscovery searches" value={rediscoverySearches.toLocaleString()} />
          <Metric label="ranked words shown" value={rankedWords.length.toLocaleString()} />
        </div>
        <TopWords words={topWords} />
      </section>

      <section className="story-section activity-section" aria-labelledby="activity-heading">
        <div className="section-heading-row">
          <div>
            <div className="kicker">discovery archive</div>
            <h2 id="activity-heading">New first finds keep the archive growing.</h2>
          </div>
        </div>
        <StatsChart data={daily} />
      </section>

      <section className="story-section boundary-section" aria-labelledby="boundary-heading">
        <div>
          <div className="kicker">boundaries</div>
          <h2 id="boundary-heading">Searches stay public, plain, and dictionary-bound.</h2>
        </div>
        <div className="info-grid">
          <div>
            <h3>Valid searches</h3>
            <p>Latin-script words with optional internal apostrophes or hyphens, present in the imported dictionary data.</p>
          </div>
          <div>
            <h3>Not counted</h3>
            <p>Numbers, emoji, punctuation-only input, overly long strings, spaces, and words absent from the current corpus.</p>
          </div>
          <div>
            <h3>Public notes</h3>
            <p>Anonymous notes are immediate, length-limited, plain text, and intended for word context rather than private messages.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <article className="metric-card">
      <span className="metric-value">{value}</span>
      <span className="metric-label">{label}</span>
    </article>
  );
}

function TopWords({ words }: { words: DiscoveryRecord[] }) {
  return (
    <section className="top-list" aria-labelledby="top-heading">
      <div className="section-heading-row">
        <div>
          <div className="kicker">rediscovery leaders</div>
          <h2 id="top-heading">Most searched words</h2>
        </div>
      </div>
      {words.length === 0 ? (
        <p className="muted-copy">No rediscovery data yet.</p>
      ) : (
        <ol>
          {words.map((item) => (
            <li key={item.word}>
              <span className="top-word-display">{item.display}</span>
              <span>{item.searchCount.toLocaleString()}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
