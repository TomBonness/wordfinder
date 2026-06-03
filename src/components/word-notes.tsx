"use client";

import { FormEvent, useState } from "react";
import type { PublicNote } from "@/lib/types";

type NotesState = {
  notes: PublicNote[];
};

export function WordNotes({ word, initialNotes }: { word: string; initialNotes: PublicNote[] }) {
  const [state, setState] = useState<NotesState>({ notes: initialNotes });
  const [body, setBody] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/words/${encodeURIComponent(word)}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const payload = (await response.json()) as { note?: PublicNote; error?: string };
      if (!response.ok || !payload.note) {
        setMessage(payload.error ?? "Could not publish note.");
        return;
      }
      setState((current) => ({ notes: [payload.note as PublicNote, ...current.notes] }));
      setBody("");
      setMessage("Note published anonymously.");
    } catch {
      setMessage("The note service is unavailable.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="notes-section" aria-labelledby="notes-heading">
      <div className="section-heading-row">
        <div>
          <div className="kicker">anonymous notes</div>
          <h2 id="notes-heading">Field notes</h2>
        </div>
        <span className="count-pill">{state.notes.length}</span>
      </div>

      <form className="note-form" onSubmit={submit}>
        <label htmlFor="note-body">Leave a public anonymous note</label>
        <textarea
          id="note-body"
          value={body}
          maxLength={600}
          onChange={(event) => setBody(event.target.value)}
          placeholder="What context, memory, or language does this word carry?"
        />
        <div className="form-row">
          <span>{body.length}/600</span>
          <button type="submit" disabled={pending}>{pending ? "publishing" : "publish note"}</button>
        </div>
      </form>

      {message ? <p className="form-message" role="status">{message}</p> : null}

      <div className="notes-list">
        {state.notes.length === 0 ? (
          <p className="muted-copy">No notes have been published for this word.</p>
        ) : (
          state.notes.map((note) => (
            <article className="note-card" key={note.id}>
              <p>{note.body}</p>
              <time dateTime={note.createdAt}>{new Date(note.createdAt).toLocaleString()}</time>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
