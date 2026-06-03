import { describe, expect, it } from "vitest";
import { normalizeWordInput } from "./normalize-word";

describe("normalizeWordInput", () => {
  it("accepts Latin-script words with accents", () => {
    const result = normalizeWordInput("  Mañana  ");
    expect(result).toEqual({
      ok: true,
      value: { input: "  Mañana  ", normalized: "mañana", display: "Mañana" },
    });
  });

  it("normalizes internal punctuation variants", () => {
    const result = normalizeWordInput("L’Amour");
    expect(result.ok && result.value.normalized).toBe("l'amour");
  });

  it("rejects spaces, numbers, emoji, and edge punctuation", () => {
    expect(normalizeWordInput("two words").ok).toBe(false);
    expect(normalizeWordInput("word2").ok).toBe(false);
    expect(normalizeWordInput("🙂").ok).toBe(false);
    expect(normalizeWordInput("-word").ok).toBe(false);
  });
});
