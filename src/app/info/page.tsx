export default function InfoPage() {
  return (
    <div className="page-shell narrow-page">
      <section className="text-page">
        <div className="kicker">about the experiment</div>
        <h1>A public word-discovery experiment with a strict corpus boundary.</h1>
        <p>
          Word Finder is a shared record of ordinary searches against one imported dictionary corpus. Each successful search
          rediscovers a word and adds a small public signal to its rank.
        </p>
        <p>
          Over time, the question is whether those rediscovery counts begin to resemble a Zipf-like curve: a few words searched
          again and again on the left, then a long tail of words that people find rarely. The curve is observational, not forced;
          the site records what visitors actually search.
        </p>
        <p>
          The corpus boundary still matters. The initial corpus target is Kaikki.org/Wiktextract data derived from Wiktionary, and
          the import pipeline filters entries to normalized Roman/Latin-script words before storing only those normalized dictionary
          keys in DynamoDB.
        </p>
        <p>
          Anonymous notes are public, immediate, length-limited, plain text, and rate-limited per word. They are intended for usage
          context, etymological curiosity, memories, and small observations—not private messages.
        </p>
        <div className="info-grid">
          <div>
            <h2>What counts</h2>
            <p>Latin-script words with optional internal apostrophes or hyphens, present in the imported corpus.</p>
          </div>
          <div>
            <h2>What does not</h2>
            <p>Numbers, emoji, punctuation-only input, overly long strings, spaces, and words absent from the corpus.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
