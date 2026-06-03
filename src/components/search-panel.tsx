"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import type { DiscoveryResult } from "@/lib/types";

type ApiState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; result: DiscoveryResult }
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
      <div className="kicker">open corpus / anonymous discovery</div>
      <h1 id="search-heading">Find whether a word has entered the archive.</h1>
      <p className="lede">
        Search a Roman-alphabet word from the imported Wiktionary-derived corpus. New discoveries become part of the public record;
        rediscoveries strengthen its signal.
      </p>

      <form className="search-form" onSubmit={onSubmit}>
        <label className="sr-only" htmlFor="word-search">Word</label>
        <input
          id="word-search"
          name="word"
          autoComplete="off"
          autoCapitalize="none"
          placeholder="mañana"
          value={word}
          onChange={(event) => setWord(event.target.value)}
        />
        <button type="submit" disabled={state.status === "loading"}>
          {state.status === "loading" ? "searching" : "search"}
        </button>
      </form>

      <div className="personal-card" aria-live="polite">
        <span className="metric-value">{personalStats.discoveries}</span>
        <span className="metric-label">new discoveries from this browser</span>
      </div>

      <ResultState state={state} />
    </section>
  );
}

function ResultState({ state }: { state: ApiState }) {
  if (state.status === "idle") {
    return <div className="result-card muted">Try a word from any Latin-script language in the corpus.</div>;
  }

  if (state.status === "loading") {
    return <div className="result-card muted">Checking the dictionary and public archive…</div>;
  }

  if (state.status === "error") {
    return <div className="result-card error">{state.error}</div>;
  }

  const { result } = state;
  const detailHref = `/word/${encodeURIComponent(result.discovery.word)}`;

  return (
    <article className="result-card success">
      <div className="result-label">{result.isNew ? "new discovery" : "rediscovered"}</div>
      <h2>{result.entry.display}</h2>
      <dl className="result-grid">
        <div>
          <dt>search count</dt>
          <dd>{result.discovery.searchCount.toLocaleString()}</dd>
        </div>
        <div>
          <dt>discovered</dt>
          <dd>{new Date(result.discovery.discoveredAt).toLocaleString()}</dd>
        </div>
        <div>
          <dt>language</dt>
          <dd>{result.entry.language ?? "corpus entry"}</dd>
        </div>
      </dl>
      {result.notePreview ? (
        <blockquote className="note-preview">“{result.notePreview.body}”</blockquote>
      ) : (
        <p className="muted-copy">No notes yet. Leave the first anonymous note on the word page.</p>
      )}
      <Link className="text-link" href={detailHref}>open word record</Link>
    </article>
  );
}
