import { getStore } from "./get-store";
import { normalizeWordInput } from "./normalize-word";
import type { DictionaryEntry } from "./types";

export type DictionaryLookup =
  | { ok: true; normalized: string; display: string; entry: DictionaryEntry }
  | { ok: false; status: number; error: string };

export async function lookupDictionaryWord(input: string): Promise<DictionaryLookup> {
  const normalized = normalizeWordInput(input);
  if (!normalized.ok) {
    return { ok: false, status: 400, error: normalized.error };
  }

  const entry = await getStore().getDictionaryEntry(normalized.value.normalized);
  if (!entry) {
    return {
      ok: false,
      status: 404,
      error: "That word is not in the current Roman-alphabet dictionary corpus.",
    };
  }

  return {
    ok: true,
    normalized: normalized.value.normalized,
    display: normalized.value.display,
    entry,
  };
}
