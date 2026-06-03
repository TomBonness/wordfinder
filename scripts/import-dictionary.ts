import { createReadStream } from "fs";
import { Readable } from "stream";
import { createGunzip } from "zlib";
import { createInterface } from "readline";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, BatchWriteCommand, type BatchWriteCommandInput } from "@aws-sdk/lib-dynamodb";
import { normalizeWordInput } from "../src/lib/normalize-word";

type WiktextractEntry = {
  word?: unknown;
  lang?: unknown;
  lang_code?: unknown;
  pos?: unknown;
};

type BatchRequestItems = NonNullable<BatchWriteCommandInput["RequestItems"]>;

const sources = process.argv.slice(2);
const tableName = process.env.WORD_FINDER_DICTIONARY_TABLE;

if (sources.length === 0) {
  throw new Error("Usage: npm run import:dictionary -- /path/or/url/to/kaikki.jsonl[.gz] [...]");
}

if (!tableName) {
  throw new Error("WORD_FINDER_DICTIONARY_TABLE is required.");
}

const doc = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: { removeUndefinedValues: true },
});

async function inputStream(path: string): Promise<NodeJS.ReadableStream> {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    const response = await fetch(path);
    if (!response.ok || !response.body) {
      throw new Error(`Failed to fetch ${path}: ${response.status} ${response.statusText}`);
    }
    const stream = Readable.fromWeb(response.body as Parameters<typeof Readable.fromWeb>[0]);
    return path.endsWith(".gz") ? stream.pipe(createGunzip()) : stream;
  }

  const file = createReadStream(path);
  return path.endsWith(".gz") ? file.pipe(createGunzip()) : file;
}

async function flush(items: Record<string, unknown>[]): Promise<void> {
  if (items.length === 0) {
    return;
  }

  let requestItems: BatchRequestItems = {
    [tableName as string]: items.map((Item) => ({ PutRequest: { Item } })),
  };

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const response = await doc.send(new BatchWriteCommand({ RequestItems: requestItems }));
    const unprocessed = response.UnprocessedItems?.[tableName as string] ?? [];
    if (unprocessed.length === 0) {
      return;
    }
    requestItems = { [tableName as string]: unprocessed };
    await new Promise((resolve) => setTimeout(resolve, 100 * 2 ** attempt));
  }

  throw new Error(`DynamoDB did not process ${requestItems[tableName as string].length} dictionary writes after retries.`);
}

let acceptedTotal = 0;
let skippedTotal = 0;

for (const source of sources) {
  let accepted = 0;
  let skipped = 0;
  const seen = new Set<string>();
  const batch: Record<string, unknown>[] = [];
  const lines = createInterface({ input: await inputStream(source), crlfDelay: Infinity });

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

    if (accepted % 10000 === 0) {
      console.log(`${source}: imported ${accepted}, skipped ${skipped}`);
    }
  }

  await flush(batch);
  acceptedTotal += accepted;
  skippedTotal += skipped;
  console.log(`${source}: imported ${accepted} dictionary entries; skipped ${skipped}.`);
}

console.log(`Imported ${acceptedTotal} dictionary entries into ${tableName}; skipped ${skippedTotal}.`);
