export default function InfoPage() {
  return (
    <div className="page-shell narrow-page">
      <section className="text-page">
        <div className="kicker">about the archive</div>
        <h1>A word discovery project with a strict corpus boundary.</h1>
        <p>
          Word Finder is inspired by quiet public research tools: one input, one shared archive, and a record of what visitors have
          found. A word becomes discoverable only when it exists in the imported dictionary corpus.
        </p>
        <p>
          The initial corpus target is Kaikki.org/Wiktextract data derived from Wiktionary. The import pipeline filters entries to
          normalized Roman/Latin-script words and stores only those normalized dictionary keys in DynamoDB.
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
