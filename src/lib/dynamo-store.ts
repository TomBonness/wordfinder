import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  ScanCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import type { AddNoteInput, WordFinderStore } from "./store";
import type { DailyStat, DictionaryEntry, DiscoveryRecord, PublicNote } from "./types";
import { pickWordOfTheDay } from "./memory-store";

type TableConfig = {
  dictionary: string;
  discovered: string;
  notes: string;
  daily: string;
};

type AmplifyOutputs = {
  custom?: {
    wordFinderDictionaryTableName?: string;
    wordFinderDiscoveredTableName?: string;
    wordFinderNotesTableName?: string;
    wordFinderDailyStatsTableName?: string;
  };
};

const DISCOVERY_BUCKET = "all";
const SEARCH_COUNT_INDEX = "bySearchCount";
const DISCOVERED_AT_INDEX = "byDiscoveredAt";
const NOTE_IP_WORD_INDEX = "byIpWord";

function tableConfig(): TableConfig {
  const outputs = readAmplifyOutputs();
  const dictionary = process.env.WORD_FINDER_DICTIONARY_TABLE ?? outputs?.custom?.wordFinderDictionaryTableName;
  const discovered = process.env.WORD_FINDER_DISCOVERED_TABLE ?? outputs?.custom?.wordFinderDiscoveredTableName;
  const notes = process.env.WORD_FINDER_NOTES_TABLE ?? outputs?.custom?.wordFinderNotesTableName;
  const daily = process.env.WORD_FINDER_DAILY_STATS_TABLE ?? outputs?.custom?.wordFinderDailyStatsTableName;

  if (!dictionary || !discovered || !notes || !daily) {
    throw new Error("DynamoDB store requires WORD_FINDER_*_TABLE environment variables or Amplify custom outputs.");
  }

  return { dictionary, discovered, notes, daily };
}

function readAmplifyOutputs(): AmplifyOutputs | null {
  const path = join(process.cwd(), "amplify_outputs.json");
  if (!existsSync(path)) {
    return null;
  }

  return JSON.parse(readFileSync(path, "utf8")) as AmplifyOutputs;
}

function client(): DynamoDBDocumentClient {
  const base = new DynamoDBClient({});
  return DynamoDBDocumentClient.from(base, {
    marshallOptions: { removeUndefinedValues: true },
  });
}

function asDiscoveryRecord(item: Record<string, unknown> | undefined): DiscoveryRecord | null {
  if (!item) {
    return null;
  }
  return {
    word: String(item.word),
    display: String(item.display),
    discoveredAt: String(item.discoveredAt),
    lastSearchedAt: String(item.lastSearchedAt),
    searchCount: Number(item.searchCount),
  };
}

function asDictionaryEntry(item: Record<string, unknown> | undefined): DictionaryEntry | null {
  if (!item) {
    return null;
  }
  return {
    word: String(item.word),
    display: String(item.display ?? item.word),
    language: typeof item.language === "string" ? item.language : undefined,
    source: typeof item.source === "string" ? item.source : undefined,
  };
}

function asPublicNote(item: Record<string, unknown>): PublicNote {
  return {
    id: String(item.noteId),
    word: String(item.word),
    body: String(item.body),
    createdAt: String(item.createdAt),
  };
}

export class DynamoWordFinderStore implements WordFinderStore {
  private readonly tables = tableConfig();
  private readonly doc = client();

  async getDictionaryEntry(word: string): Promise<DictionaryEntry | null> {
    const response = await this.doc.send(
      new GetCommand({
        TableName: this.tables.dictionary,
        Key: { word },
      }),
    );
    return asDictionaryEntry(response.Item);
  }

  async recordDiscovery(
    entry: DictionaryEntry,
    now: string,
    day: string,
  ): Promise<{ isNew: boolean; discovery: DiscoveryRecord }> {
    const firstDiscovery: DiscoveryRecord = {
      word: entry.word,
      display: entry.display,
      discoveredAt: now,
      lastSearchedAt: now,
      searchCount: 1,
    };

    try {
      await this.doc.send(
        new PutCommand({
          TableName: this.tables.discovered,
          Item: {
            ...firstDiscovery,
            bucket: DISCOVERY_BUCKET,
          },
          ConditionExpression: "attribute_not_exists(#word)",
          ExpressionAttributeNames: { "#word": "word" },
        }),
      );

      await this.doc.send(
        new UpdateCommand({
          TableName: this.tables.daily,
          Key: { day },
          UpdateExpression: "ADD discoveryCount :one",
          ExpressionAttributeValues: { ":one": 1 },
        }),
      );

      return { isNew: true, discovery: firstDiscovery };
    } catch (error) {
      if (!(error instanceof Error) || error.name !== "ConditionalCheckFailedException") {
        throw error;
      }
    }

    const response = await this.doc.send(
      new UpdateCommand({
        TableName: this.tables.discovered,
        Key: { word: entry.word },
        UpdateExpression: "ADD searchCount :one SET lastSearchedAt = :now, #display = if_not_exists(#display, :display), #bucket = :bucket",
        ExpressionAttributeNames: { "#display": "display", "#bucket": "bucket" },
        ExpressionAttributeValues: {
          ":one": 1,
          ":now": now,
          ":display": entry.display,
          ":bucket": DISCOVERY_BUCKET,
        },
        ReturnValues: "ALL_NEW",
      }),
    );

    const discovery = asDiscoveryRecord(response.Attributes);
    if (!discovery) {
      throw new Error("Rediscovery update did not return a record.");
    }

    return { isNew: false, discovery };
  }

  async getDiscovery(word: string): Promise<DiscoveryRecord | null> {
    const response = await this.doc.send(
      new GetCommand({
        TableName: this.tables.discovered,
        Key: { word },
      }),
    );
    return asDiscoveryRecord(response.Item);
  }

  async getRecentNote(word: string): Promise<PublicNote | null> {
    const notes = await this.listNotes(word, 1);
    return notes[0] ?? null;
  }

  async listNotes(word: string, limit: number): Promise<PublicNote[]> {
    const response = await this.doc.send(
      new QueryCommand({
        TableName: this.tables.notes,
        KeyConditionExpression: "#word = :word",
        ExpressionAttributeNames: { "#word": "word" },
        ExpressionAttributeValues: { ":word": word },
        ScanIndexForward: false,
        Limit: limit,
      }),
    );
    return (response.Items ?? []).map(asPublicNote);
  }

  async countRecentNotesByIpWord(ipWord: string, sinceIso: string): Promise<number> {
    const response = await this.doc.send(
      new QueryCommand({
        TableName: this.tables.notes,
        IndexName: NOTE_IP_WORD_INDEX,
        KeyConditionExpression: "ipWord = :ipWord AND createdAt >= :since",
        ExpressionAttributeValues: {
          ":ipWord": ipWord,
          ":since": sinceIso,
        },
        Select: "COUNT",
      }),
    );
    return response.Count ?? 0;
  }

  async addNote(input: AddNoteInput): Promise<PublicNote> {
    const noteId = `${input.createdAt}#${crypto.randomUUID()}`;
    const note = {
      word: input.word,
      noteId,
      body: input.body,
      createdAt: input.createdAt,
      ipHash: input.ipHash,
      ipWord: `${input.word}#${input.ipHash}`,
    };

    await this.doc.send(
      new PutCommand({
        TableName: this.tables.notes,
        Item: note,
      }),
    );

    return asPublicNote(note);
  }

  async getStats(): Promise<{ totalDiscovered: number; topRediscovered: DiscoveryRecord[]; wordOfTheDay: DiscoveryRecord | null }> {
    const [daily, topResponse, recentResponse] = await Promise.all([
      this.getDailyStats(3660),
      this.doc.send(
        new QueryCommand({
          TableName: this.tables.discovered,
          IndexName: SEARCH_COUNT_INDEX,
          KeyConditionExpression: "#bucket = :bucket",
          ExpressionAttributeNames: { "#bucket": "bucket" },
          ExpressionAttributeValues: { ":bucket": DISCOVERY_BUCKET },
          ScanIndexForward: false,
          Limit: 10,
        }),
      ),
      this.doc.send(
        new QueryCommand({
          TableName: this.tables.discovered,
          IndexName: DISCOVERED_AT_INDEX,
          KeyConditionExpression: "#bucket = :bucket",
          ExpressionAttributeNames: { "#bucket": "bucket" },
          ExpressionAttributeValues: { ":bucket": DISCOVERY_BUCKET },
          ScanIndexForward: false,
          Limit: 100,
        }),
      ),
    ]);

    const totalDiscovered = daily.reduce((sum, item) => sum + item.discoveryCount, 0);
    const topRediscovered = (topResponse.Items ?? [])
      .map(asDiscoveryRecord)
      .filter((item): item is DiscoveryRecord => item !== null);
    const recentDiscoveries = (recentResponse.Items ?? [])
      .map(asDiscoveryRecord)
      .filter((item): item is DiscoveryRecord => item !== null);

    return {
      totalDiscovered,
      topRediscovered,
      wordOfTheDay: pickWordOfTheDay(recentDiscoveries),
    };
  }

  async getDailyStats(limitDays: number): Promise<DailyStat[]> {
    const response = await this.doc.send(
      new ScanCommand({
        TableName: this.tables.daily,
        Limit: Math.max(1, Math.min(limitDays, 3660)),
      }),
    );

    return (response.Items ?? [])
      .map((item) => ({ day: String(item.day), discoveryCount: Number(item.discoveryCount ?? 0) }))
      .sort((a, b) => a.day.localeCompare(b.day))
      .slice(-limitDays);
  }
}
