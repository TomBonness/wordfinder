const MAX_WORD_LENGTH = 64;
const LATIN_WORD_RE = /^\p{Script=Latin}+(?:['-]\p{Script=Latin}+)*$/u;
const APOSTROPHE_RE = /[’‘`´]/g;
const HYPHEN_RE = /[‐‑‒–—−]/g;

export type NormalizedWord = {
  input: string;
  normalized: string;
  display: string;
};

export type WordValidation =
  | { ok: true; value: NormalizedWord }
  | { ok: false; error: string };

export function normalizeWordInput(input: string): WordValidation {
  const trimmed = input.trim();

  if (trimmed.length === 0) {
    return { ok: false, error: "Enter a word to search." };
  }

  const canonical = trimmed
    .normalize("NFC")
    .replace(APOSTROPHE_RE, "'")
    .replace(HYPHEN_RE, "-")
    .replace(/\s+/g, " ");

  if (canonical.length > MAX_WORD_LENGTH) {
    return { ok: false, error: `Words must be ${MAX_WORD_LENGTH} characters or fewer.` };
  }

  if (canonical.includes(" ")) {
    return { ok: false, error: "Search one word at a time." };
  }

  const normalized = canonical.toLocaleLowerCase().normalize("NFC");

  if (!LATIN_WORD_RE.test(normalized)) {
    return {
      ok: false,
      error: "Use Latin/Roman alphabet letters, with optional internal apostrophes or hyphens.",
    };
  }

  return {
    ok: true,
    value: {
      input,
      normalized,
      display: canonical,
    },
  };
}

export function assertNormalizedWord(word: string): NormalizedWord {
  const result = normalizeWordInput(word);
  if (!result.ok) {
    throw new Error(result.error);
  }
  return result.value;
}
