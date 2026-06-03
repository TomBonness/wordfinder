export type LocalDictionaryEntry = {
  word: string;
  display: string;
  language: string;
  source: string;
};

export const LOCAL_DICTIONARY: readonly LocalDictionaryEntry[] = [
  { word: "apple", display: "apple", language: "English", source: "local seed corpus" },
  { word: "word", display: "word", language: "English", source: "local seed corpus" },
  { word: "river", display: "river", language: "English", source: "local seed corpus" },
  { word: "cafe", display: "cafe", language: "English", source: "local seed corpus" },
  { word: "café", display: "café", language: "French", source: "local seed corpus" },
  { word: "mañana", display: "mañana", language: "Spanish", source: "local seed corpus" },
  { word: "niño", display: "niño", language: "Spanish", source: "local seed corpus" },
  { word: "über", display: "über", language: "German", source: "local seed corpus" },
  { word: "smörgås", display: "smörgås", language: "Swedish", source: "local seed corpus" },
  { word: "fiancé", display: "fiancé", language: "French", source: "local seed corpus" },
  { word: "lumière", display: "lumière", language: "French", source: "local seed corpus" },
  { word: "co-operate", display: "co-operate", language: "English", source: "local seed corpus" },
  { word: "l'amour", display: "l'amour", language: "French", source: "local seed corpus" },
  { word: "fjord", display: "fjord", language: "Norwegian", source: "local seed corpus" },
  { word: "lake", display: "lake", language: "English", source: "local seed corpus" },
  { word: "roma", display: "Roma", language: "Italian", source: "local seed corpus" }
];
