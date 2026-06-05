"use client";

import { FormEvent, useEffect, useState } from "react";
import { WordNotes } from "@/components/word-notes";
import type { DiscoveryResult, PublicNote } from "@/lib/types";

type ApiState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; result: DiscoveryResult }
  | { status: "error"; error: string };

type NotesLoadState =
  | { status: "loading" }
  | { status: "success"; notes: PublicNote[] }
  | { status: "error"; error: string };

type PersonalStats = {
  discoveries: number;
  words: string[];
};

const STORAGE_KEY = "wordfinder.personalStats";

function readPersonalStats(): PersonalStats {
  if (typeof window === "undefined") {
    return { discoveries: 0, words: [] };
  }
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return { discoveries: 0, words: [] };
  }
  try {
    const parsed = JSON.parse(raw) as Partial<PersonalStats>;
    return {
      discoveries: typeof parsed.discoveries === "number" ? parsed.discoveries : 0,
      words: Array.isArray(parsed.words) ? parsed.words.filter((item): item is string => typeof item === "string") : [],
    };
  } catch {
    return { discoveries: 0, words: [] };
  }
}

function writePersonalStats(stats: PersonalStats): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
}

export function SearchPanel() {
  const [word, setWord] = useState("");
  const [state, setState] = useState<ApiState>({ status: "idle" });
  const [personalStats, setPersonalStats] = useState<PersonalStats>({ discoveries: 0, words: [] });

  useEffect(() => {
    setPersonalStats(readPersonalStats());
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ status: "loading" });

    try {
      const response = await fetch("/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word }),
      });
      const payload = (await response.json()) as DiscoveryResult | { error?: string };

      if (!response.ok) {
        setState({ status: "error", error: "error" in payload && payload.error ? payload.error : "Search failed." });
        return;
      }

      const result = payload as DiscoveryResult;
      setState({ status: "success", result });

      if (result.isNew) {
        const next = readPersonalStats();
        if (!next.words.includes(result.discovery.word)) {
          next.words = [result.discovery.word, ...next.words].slice(0, 100);
          next.discoveries += 1;
          writePersonalStats(next);
          setPersonalStats(next);
        }
      }
    } catch {
      setState({ status: "error", error: "The search service is unavailable." });
    }
  }

  return (
    <section className="search-panel" aria-labelledby="search-heading">
      <div className="kicker">search the curve</div>
      <h1 id="search-heading">Add a word to the count.</h1>
      <p className="lede">
        Try a word, see whether it is new or rediscovered, and add one anonymous signal to the shared ranking.
      </p>

      <form className="search-form" onSubmit={onSubmit}>
        <label className="sr-only" htmlFor="word-search">Word</label>
        <input
          id="word-search"
          name="word"
          autoComplete="off"
          autoCapitalize="none"
          placeholder="fjord"
          value={word}
          onChange={(event) => setWord(event.target.value)}
        />
        <button type="submit" disabled={state.status === "loading"}>
          {state.status === "loading" ? "searching" : "search"}
        </button>
      </form>

      <div className="home-meta" aria-live="polite">
        <span>{personalStats.discoveries} discoveries from this browser</span>
        <span>Try “café”, “fjord”, or “lake”.</span>
      </div>

      <ResultState state={state} />
    </section>
  );
}

function ResultState({ state }: { state: ApiState }) {
  if (state.status === "idle") {
    return null;
  }

  if (state.status === "loading") {
    return <div className="result-card muted">Checking the dictionary and public archive…</div>;
  }

  if (state.status === "error") {
    return <div className="result-card error">{state.error}</div>;
  }

  const { result } = state;

  return (
    <article className="result-card success">
      <div className="result-label">{result.isNew ? "new discovery" : "rediscovered"}</div>
      <h2>{result.entry.display}</h2>
      <dl className="result-grid">
        <div>
          <dt>language</dt>
          <dd>{result.entry.language ?? "corpus entry"}</dd>
        </div>
        <div>
          <dt>source</dt>
          <dd>{result.entry.source ?? "imported corpus"}</dd>
        </div>
        <div>
          <dt>status</dt>
          <dd>{result.isNew ? "new public record" : "already discovered"}</dd>
        </div>
        <div>
          <dt>search count</dt>
          <dd>{result.discovery.searchCount.toLocaleString()}</dd>
        </div>
        <div>
          <dt>first discovered</dt>
          <dd>{new Date(result.discovery.discoveredAt).toLocaleString()}</dd>
        </div>
        <div>
          <dt>last searched</dt>
          <dd>{new Date(result.discovery.lastSearchedAt).toLocaleString()}</dd>
        </div>
      </dl>
      {result.notePreview ? (
        <blockquote className="note-preview">“{result.notePreview.body}”</blockquote>
      ) : (
        <p className="muted-copy">No notes yet. Publish the first anonymous note below.</p>
      )}
      <InlineWordNotes word={result.discovery.word} />
    </article>
  );
}

function InlineWordNotes({ word }: { word: string }) {
  const [notesState, setNotesState] = useState<NotesLoadState>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    setNotesState({ status: "loading" });

    async function loadNotes() {
      try {
        const response = await fetch(`/api/words/${encodeURIComponent(word)}/notes?limit=50`, { signal: controller.signal });
        const payload = (await response.json()) as { notes?: PublicNote[]; error?: string };
        if (!response.ok || !Array.isArray(payload.notes)) {
          setNotesState({ status: "error", error: payload.error ?? "Could not load notes." });
          return;
        }
        setNotesState({ status: "success", notes: payload.notes });
      } catch {
        if (!controller.signal.aborted) {
          setNotesState({ status: "error", error: "The note service is unavailable." });
        }
      }
    }

    void loadNotes();
    return () => controller.abort();
  }, [word]);

  if (notesState.status === "loading") {
    return <p className="inline-notes-status muted-copy">Loading notes…</p>;
  }

  if (notesState.status === "error") {
    return <p className="inline-notes-status error">{notesState.error}</p>;
  }

  return <WordNotes key={word} word={word} initialNotes={notesState.notes} />;
}
