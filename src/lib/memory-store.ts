import { LOCAL_DICTIONARY } from "@/data/local-dictionary";
import type { AddNoteInput, WordFinderStore } from "./store";
import { publicNote } from "./store";
import type { DailyStat, DictionaryEntry, DiscoveryRecord, PublicNote, StoredNote } from "./types";

type MemoryState = {
  dictionary: Map<string, DictionaryEntry>;
  discoveries: Map<string, DiscoveryRecord>;
  notes: Map<string, StoredNote[]>;
  daily: Map<string, number>;
};

const GLOBAL_KEY = Symbol.for("wordfinder.memory-store");

type GlobalWithStore = typeof globalThis & { [GLOBAL_KEY]?: MemoryState };

function createInitialState(): MemoryState {
  const dictionary = new Map<string, DictionaryEntry>();
  for (const entry of LOCAL_DICTIONARY) {
    dictionary.set(entry.word, entry);
  }
  return {
    dictionary,
    discoveries: new Map(),
    notes: new Map(),
    daily: new Map(),
  };
}

function getState(): MemoryState {
  const globalStore = globalThis as GlobalWithStore;
  globalStore[GLOBAL_KEY] ??= createInitialState();
  return globalStore[GLOBAL_KEY];
}

export function resetMemoryStore(entries: readonly DictionaryEntry[] = LOCAL_DICTIONARY): void {
  const dictionary = new Map<string, DictionaryEntry>();
  for (const entry of entries) {
    dictionary.set(entry.word, entry);
  }
  (globalThis as GlobalWithStore)[GLOBAL_KEY] = {
    dictionary,
    discoveries: new Map(),
    notes: new Map(),
    daily: new Map(),
  };
}

export class MemoryWordFinderStore implements WordFinderStore {
  async getDictionaryEntry(word: string): Promise<DictionaryEntry | null> {
    return getState().dictionary.get(word) ?? null;
  }

  async recordDiscovery(
    entry: DictionaryEntry,
    now: string,
    day: string,
  ): Promise<{ isNew: boolean; discovery: DiscoveryRecord }> {
    const state = getState();
    const existing = state.discoveries.get(entry.word);

    if (!existing) {
      const discovery: DiscoveryRecord = {
        word: entry.word,
        display: entry.display,
        discoveredAt: now,
        lastSearchedAt: now,
        searchCount: 1,
      };
      state.discoveries.set(entry.word, discovery);
      state.daily.set(day, (state.daily.get(day) ?? 0) + 1);
      return { isNew: true, discovery };
    }

    const discovery: DiscoveryRecord = {
      ...existing,
      lastSearchedAt: now,
      searchCount: existing.searchCount + 1,
    };
    state.discoveries.set(entry.word, discovery);
    return { isNew: false, discovery };
  }

  async getDiscovery(word: string): Promise<DiscoveryRecord | null> {
    return getState().discoveries.get(word) ?? null;
  }

  async getRecentNote(word: string): Promise<PublicNote | null> {
    const notes = getState().notes.get(word) ?? [];
    return notes.length > 0 ? publicNote(notes[0]) : null;
  }

  async listNotes(word: string, limit: number): Promise<PublicNote[]> {
    return (getState().notes.get(word) ?? []).slice(0, limit).map(publicNote);
  }

  async countRecentNotesByIpWord(ipWord: string, sinceIso: string): Promise<number> {
    let count = 0;
    for (const notes of getState().notes.values()) {
      for (const note of notes) {
        if (note.ipWord === ipWord && note.createdAt >= sinceIso) {
          count += 1;
        }
      }
    }
    return count;
  }

  async addNote(input: AddNoteInput): Promise<PublicNote> {
    const note: StoredNote = {
      id: `${input.createdAt}-${crypto.randomUUID()}`,
      word: input.word,
      body: input.body,
      createdAt: input.createdAt,
      ipHash: input.ipHash,
      ipWord: `${input.word}#${input.ipHash}`,
    };
    const state = getState();
    const notes = state.notes.get(input.word) ?? [];
    notes.unshift(note);
    state.notes.set(input.word, notes);
    return publicNote(note);
  }

  async getStats(): Promise<{
    totalDiscovered: number;
    topRediscovered: DiscoveryRecord[];
    wordOfTheDay: DiscoveryRecord | null;
  }> {
    const discoveries = Array.from(getState().discoveries.values());
    const topRediscovered = [...discoveries]
      .sort((a, b) => b.searchCount - a.searchCount || a.word.localeCompare(b.word))
      .slice(0, 10);

    return {
      totalDiscovered: discoveries.length,
      topRediscovered,
      wordOfTheDay: pickWordOfTheDay(discoveries),
    };
  }

  async getDailyStats(limitDays: number): Promise<DailyStat[]> {
    return Array.from(getState().daily.entries())
      .map(([day, discoveryCount]) => ({ day, discoveryCount }))
      .sort((a, b) => a.day.localeCompare(b.day))
      .slice(-limitDays);
  }
}

export function pickWordOfTheDay(discoveries: readonly DiscoveryRecord[], date = new Date()): DiscoveryRecord | null {
  if (discoveries.length === 0) {
    return null;
  }
  const dayKey = date.toISOString().slice(0, 10);
  let hash = 0;
  for (let i = 0; i < dayKey.length; i += 1) {
    hash = (hash * 31 + dayKey.charCodeAt(i)) >>> 0;
  }
  return discoveries[hash % discoveries.length] ?? null;
}
