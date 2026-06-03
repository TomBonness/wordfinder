import { SearchPanel } from "@/components/search-panel";

export default function HomePage() {
  return (
    <div className="page-shell home-grid">
      <SearchPanel />
      <aside className="side-panel" aria-label="Dictionary scope">
        <div className="kicker">corpus boundary</div>
        <p>
          Discovery is limited to words present in the imported Kaikki/Wiktextract data set. Searches outside the corpus are rejected
          instead of being silently added.
        </p>
        <div className="rule" />
        <p>
          The archive records first discoveries, rediscoveries, and anonymous public notes without accounts or profiles.
        </p>
      </aside>
    </div>
  );
}
