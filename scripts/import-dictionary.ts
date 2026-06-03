import { createReadStream } from "fs";
import { createGunzip } from "zlib";
import { createInterface } from "readline";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, BatchWriteCommand } from "@aws-sdk/lib-dynamodb";
import { normalizeWordInput } from "../src/lib/normalize-word";

type WiktextractEntry = {
  word?: unknown;
  lang?: unknown;
  lang_code?: unknown;
  pos?: unknown;
};

const [, , filePath] = process.argv;
const tableName = process.env.WORD_FINDER_DICTIONARY_TABLE;

if (!filePath) {
  throw new Error("Usage: npm run import:dictionary -- /path/to/kaikki.jsonl[.gz]");
}

if (!tableName) {
  throw new Error("WORD_FINDER_DICTIONARY_TABLE is required.");
}

const doc = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: { removeUndefinedValues: true },
});

function inputStream(path: string) {
  const file = createReadStream(path);
  return path.endsWith(".gz") ? file.pipe(createGunzip()) : file;
}

async function flush(items: Record<string, unknown>[]): Promise<void> {
  if (items.length === 0) {
    return;
  }
  await doc.send(
    new BatchWriteCommand({
      RequestItems: {
        [tableName as string]: items.map((Item) => ({ PutRequest: { Item } })),
      },
    }),
  );
}

let accepted = 0;
let skipped = 0;
const seen = new Set<string>();
const batch: Record<string, unknown>[] = [];
const lines = createInterface({ input: inputStream(filePath), crlfDelay: Infinity });

for await (const line of lines) {
  if (line.trim().length === 0) {
    continue;
  }

  let parsed: WiktextractEntry;
  try {
    parsed = JSON.parse(line) as WiktextractEntry;
  } catch {
    skipped += 1;
    continue;
  }

  if (typeof parsed.word !== "string") {
    skipped += 1;
    continue;
  }

  const normalized = normalizeWordInput(parsed.word);
  if (!normalized.ok || seen.has(normalized.value.normalized)) {
    skipped += 1;
    continue;
  }

  seen.add(normalized.value.normalized);
  batch.push({
    word: normalized.value.normalized,
    display: normalized.value.display,
    language: typeof parsed.lang === "string" ? parsed.lang : undefined,
    languageCode: typeof parsed.lang_code === "string" ? parsed.lang_code : undefined,
    source: "Kaikki/Wiktextract from Wiktionary",
    partOfSpeech: typeof parsed.pos === "string" ? parsed.pos : undefined,
  });

  if (batch.length === 25) {
    await flush(batch.splice(0, batch.length));
  }
  accepted += 1;
}

await flush(batch);
console.log(`Imported ${accepted} dictionary entries into ${tableName}; skipped ${skipped}.`);
