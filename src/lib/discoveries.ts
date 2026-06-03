import { lookupDictionaryWord } from "./dictionary";
import { getStore } from "./get-store";
import { normalizeWordInput } from "./normalize-word";
import type { DiscoveryResult, WordDetail } from "./types";

function isoDay(now: string): string {
  return now.slice(0, 10);
}

export async function checkAndRecordWord(input: string, now = new Date()): Promise<DiscoveryResult> {
  const lookup = await lookupDictionaryWord(input);
  if (!lookup.ok) {
    throw Object.assign(new Error(lookup.error), { status: lookup.status });
  }

  const timestamp = now.toISOString();
  const store = getStore();
  const [{ isNew, discovery }, notePreview] = await Promise.all([
    store.recordDiscovery(lookup.entry, timestamp, isoDay(timestamp)),
    store.getRecentNote(lookup.entry.word),
  ]);

  return {
    isNew,
    entry: lookup.entry,
    discovery,
    notePreview: notePreview ? { body: notePreview.body, createdAt: notePreview.createdAt } : null,
  };
}

export async function getWordDetail(input: string): Promise<WordDetail | null> {
  const normalized = normalizeWordInput(input);
  if (!normalized.ok) {
    return null;
  }

  const store = getStore();
  const [entry, discovery, notePreview] = await Promise.all([
    store.getDictionaryEntry(normalized.value.normalized),
    store.getDiscovery(normalized.value.normalized),
    store.getRecentNote(normalized.value.normalized),
  ]);

  if (!entry && !discovery) {
    return null;
  }

  return {
    entry,
    discovery,
    notePreview: notePreview ? { body: notePreview.body, createdAt: notePreview.createdAt } : null,
  };
}
