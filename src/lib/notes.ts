import { createHash } from "crypto";
import { lookupDictionaryWord } from "./dictionary";
import { getStore } from "./get-store";
import type { PublicNote } from "./types";

const MAX_NOTE_LENGTH = 600;
const MAX_NOTES_PER_WINDOW = 3;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;

export type NoteValidation =
  | { ok: true; body: string }
  | { ok: false; status: number; error: string };

export function validateNoteBody(input: unknown): NoteValidation {
  if (typeof input !== "string") {
    return { ok: false, status: 400, error: "Note body must be text." };
  }

  const body = input.trim().replace(/\r\n?/g, "\n");
  if (body.length === 0) {
    return { ok: false, status: 400, error: "Write a note before publishing." };
  }
  if (body.length > MAX_NOTE_LENGTH) {
    return { ok: false, status: 413, error: `Notes must be ${MAX_NOTE_LENGTH} characters or fewer.` };
  }
  return { ok: true, body };
}

export function hashIpAddress(ip: string, salt = process.env.WORD_FINDER_NOTE_HASH_SALT ?? "local-development-salt"): string {
  return createHash("sha256").update(salt).update("|").update(ip).digest("hex");
}

export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",", 1)[0]?.trim() || "unknown";
  }
  return headers.get("x-real-ip") ?? "unknown";
}

export async function listWordNotes(word: string, limit = 50): Promise<PublicNote[]> {
  const lookup = await lookupDictionaryWord(word);
  if (!lookup.ok) {
    throw Object.assign(new Error(lookup.error), { status: lookup.status });
  }
  return getStore().listNotes(lookup.entry.word, Math.max(1, Math.min(limit, 100)));
}

export async function addWordNote(word: string, bodyInput: unknown, ip: string, now = new Date()): Promise<PublicNote> {
  const lookup = await lookupDictionaryWord(word);
  if (!lookup.ok) {
    throw Object.assign(new Error(lookup.error), { status: lookup.status });
  }

  const validation = validateNoteBody(bodyInput);
  if (!validation.ok) {
    throw Object.assign(new Error(validation.error), { status: validation.status });
  }

  const store = getStore();
  const ipHash = hashIpAddress(ip);
  const ipWord = `${lookup.entry.word}#${ipHash}`;
  const sinceIso = new Date(now.getTime() - RATE_LIMIT_WINDOW_MS).toISOString();
  const recentCount = await store.countRecentNotesByIpWord(ipWord, sinceIso);

  if (recentCount >= MAX_NOTES_PER_WINDOW) {
    throw Object.assign(new Error("Too many notes for this word. Try again later."), { status: 429 });
  }

  return store.addNote({
    word: lookup.entry.word,
    body: validation.body,
    ipHash,
    createdAt: now.toISOString(),
  });
}
