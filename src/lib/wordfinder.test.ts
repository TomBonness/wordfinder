import { beforeEach, describe, expect, it } from "vitest";
import { POST as checkPost } from "@/app/api/check/route";
import { POST as notePost } from "@/app/api/words/[word]/notes/route";
import { GET as statsGet } from "@/app/api/stats/route";
import { checkAndRecordWord } from "./discoveries";
import { clearStoreSingletonForTests } from "./get-store";
import { addWordNote, listWordNotes } from "./notes";
import { resetMemoryStore } from "./memory-store";

beforeEach(() => {
  process.env.WORD_FINDER_STORE = "memory";
  process.env.WORD_FINDER_NOTE_HASH_SALT = "test-salt";
  clearStoreSingletonForTests();
  resetMemoryStore();
});

describe("word discovery", () => {
  it("creates a discovery for a dictionary word and increments rediscoveries", async () => {
    const first = await checkAndRecordWord("mañana", new Date("2026-06-03T12:00:00.000Z"));
    expect(first.isNew).toBe(true);
    expect(first.discovery.searchCount).toBe(1);

    const second = await checkAndRecordWord("Mañana", new Date("2026-06-03T12:01:00.000Z"));
    expect(second.isNew).toBe(false);
    expect(second.discovery.searchCount).toBe(2);
    expect(second.discovery.discoveredAt).toBe(first.discovery.discoveredAt);
  });

  it("rejects non-dictionary words", async () => {
    await expect(checkAndRecordWord("notincorpus")).rejects.toMatchObject({ status: 404 });
  });
});

describe("notes", () => {
  it("stores anonymous plain-text notes and rate limits repeated posts", async () => {
    await addWordNote("apple", "<b>context</b>", "203.0.113.1", new Date("2026-06-03T12:00:00.000Z"));
    await addWordNote("apple", "second", "203.0.113.1", new Date("2026-06-03T12:01:00.000Z"));
    await addWordNote("apple", "third", "203.0.113.1", new Date("2026-06-03T12:02:00.000Z"));

    await expect(
      addWordNote("apple", "fourth", "203.0.113.1", new Date("2026-06-03T12:03:00.000Z")),
    ).rejects.toMatchObject({ status: 429 });

    const notes = await listWordNotes("apple");
    expect(notes[0]?.body).toBe("third");
    expect(notes[2]?.body).toBe("<b>context</b>");
  });
});

describe("API routes", () => {
  it("POST /api/check returns new then rediscovered results", async () => {
    const request = new Request("http://localhost/api/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ word: "apple" }),
    });
    const first = await checkPost(request);
    expect(first.status).toBe(200);
    expect(await first.json()).toMatchObject({ isNew: true, discovery: { searchCount: 1 } });

    const second = await checkPost(
      new Request("http://localhost/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: "apple" }),
      }),
    );
    expect(await second.json()).toMatchObject({ isNew: false, discovery: { searchCount: 2 } });
  });

  it("notes and stats routes return stable payloads", async () => {
    await checkAndRecordWord("word", new Date("2026-06-03T12:00:00.000Z"));

    const noteResponse = await notePost(
      new Request("http://localhost/api/words/word/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-forwarded-for": "203.0.113.9" },
        body: JSON.stringify({ body: "first note" }),
      }),
      { params: Promise.resolve({ word: "word" }) },
    );
    expect(noteResponse.status).toBe(201);
    expect(await noteResponse.json()).toMatchObject({ note: { body: "first note" } });

    const statsResponse = await statsGet();
    expect(statsResponse.status).toBe(200);
    expect(await statsResponse.json()).toMatchObject({ totalDiscovered: 1, topRediscovered: expect.any(Array) });
  });
});
