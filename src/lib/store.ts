import type {
  DailyStat,
  DictionaryEntry,
  DiscoveryRecord,
  PublicNote,
  StoredNote,
} from "./types";

export type AddNoteInput = {
  word: string;
  body: string;
  ipHash: string;
  createdAt: string;
};

export interface WordFinderStore {
  getDictionaryEntry(word: string): Promise<DictionaryEntry | null>;
  recordDiscovery(entry: DictionaryEntry, now: string, day: string): Promise<{ isNew: boolean; discovery: DiscoveryRecord }>;
  getDiscovery(word: string): Promise<DiscoveryRecord | null>;
  getRecentNote(word: string): Promise<PublicNote | null>;
  listNotes(word: string, limit: number): Promise<PublicNote[]>;
  countRecentNotesByIpWord(ipWord: string, sinceIso: string): Promise<number>;
  addNote(input: AddNoteInput): Promise<PublicNote>;
  getStats(): Promise<{ totalDiscovered: number; topRediscovered: DiscoveryRecord[]; wordOfTheDay: DiscoveryRecord | null }>;
  getDailyStats(limitDays: number): Promise<DailyStat[]>;
}

export function publicNote(note: StoredNote): PublicNote {
  return {
    id: note.id,
    word: note.word,
    body: note.body,
    createdAt: note.createdAt,
  };
}
