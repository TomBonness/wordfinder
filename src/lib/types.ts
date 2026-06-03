export type DictionaryEntry = {
  word: string;
  display: string;
  language?: string;
  source?: string;
};

export type DiscoveryRecord = {
  word: string;
  display: string;
  discoveredAt: string;
  lastSearchedAt: string;
  searchCount: number;
};

export type PublicNote = {
  id: string;
  word: string;
  body: string;
  createdAt: string;
};

export type StoredNote = PublicNote & {
  ipHash: string;
  ipWord: string;
};

export type NotePreview = {
  body: string;
  createdAt: string;
} | null;

export type DiscoveryResult = {
  isNew: boolean;
  entry: DictionaryEntry;
  discovery: DiscoveryRecord;
  notePreview: NotePreview;
};

export type DailyStat = {
  day: string;
  discoveryCount: number;
};

export type StatsSummary = {
  totalDiscovered: number;
  wordOfTheDay: DiscoveryRecord | null;
  topRediscovered: DiscoveryRecord[];
};

export type WordDetail = {
  entry: DictionaryEntry | null;
  discovery: DiscoveryRecord | null;
  notePreview: NotePreview;
};
