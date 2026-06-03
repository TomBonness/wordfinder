import Link from "next/link";
import { notFound } from "next/navigation";
import { WordNotes } from "@/components/word-notes";
import { getWordDetail } from "@/lib/discoveries";
import { listWordNotes } from "@/lib/notes";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ word: string }>;
};

export default async function WordPage({ params }: PageProps) {
  const { word } = await params;
  const decoded = decodeURIComponent(word);
  const detail = await getWordDetail(decoded);

  if (!detail || !detail.entry) {
    notFound();
  }

  const notes = await listWordNotes(detail.entry.word, 50);

  return (
    <div className="page-shell word-page">
      <Link className="text-link" href="/">← search another word</Link>
      <section className="word-record">
        <div className="kicker">word record</div>
        <h1>{detail.entry.display}</h1>
        <dl className="result-grid">
          <div>
            <dt>language</dt>
            <dd>{detail.entry.language ?? "corpus entry"}</dd>
          </div>
          <div>
            <dt>source</dt>
            <dd>{detail.entry.source ?? "imported corpus"}</dd>
          </div>
          <div>
            <dt>status</dt>
            <dd>{detail.discovery ? "discovered" : "not yet discovered"}</dd>
          </div>
          {detail.discovery ? (
            <>
              <div>
                <dt>search count</dt>
                <dd>{detail.discovery.searchCount.toLocaleString()}</dd>
              </div>
              <div>
                <dt>first discovered</dt>
                <dd>{new Date(detail.discovery.discoveredAt).toLocaleString()}</dd>
              </div>
              <div>
                <dt>last searched</dt>
                <dd>{new Date(detail.discovery.lastSearchedAt).toLocaleString()}</dd>
              </div>
            </>
          ) : null}
        </dl>
      </section>

      <WordNotes word={detail.entry.word} initialNotes={notes} />
    </div>
  );
}
