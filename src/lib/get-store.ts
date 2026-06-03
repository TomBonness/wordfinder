import { MemoryWordFinderStore } from "./memory-store";
import type { WordFinderStore } from "./store";

const GLOBAL_KEY = Symbol.for("wordfinder.store");
type GlobalWithStore = typeof globalThis & { [GLOBAL_KEY]?: WordFinderStore };

class LazyDynamoWordFinderStore implements WordFinderStore {
  private store: WordFinderStore | null = null;

  private async getDynamoStore(): Promise<WordFinderStore> {
    if (!this.store) {
      const { DynamoWordFinderStore } = await import("./dynamo-store");
      this.store = new DynamoWordFinderStore();
    }
    return this.store;
  }

  async getDictionaryEntry(...args: Parameters<WordFinderStore["getDictionaryEntry"]>) {
    return (await this.getDynamoStore()).getDictionaryEntry(...args);
  }

  async recordDiscovery(...args: Parameters<WordFinderStore["recordDiscovery"]>) {
    return (await this.getDynamoStore()).recordDiscovery(...args);
  }

  async getDiscovery(...args: Parameters<WordFinderStore["getDiscovery"]>) {
    return (await this.getDynamoStore()).getDiscovery(...args);
  }

  async getRecentNote(...args: Parameters<WordFinderStore["getRecentNote"]>) {
    return (await this.getDynamoStore()).getRecentNote(...args);
  }

  async listNotes(...args: Parameters<WordFinderStore["listNotes"]>) {
    return (await this.getDynamoStore()).listNotes(...args);
  }

  async countRecentNotesByIpWord(...args: Parameters<WordFinderStore["countRecentNotesByIpWord"]>) {
    return (await this.getDynamoStore()).countRecentNotesByIpWord(...args);
  }

  async addNote(...args: Parameters<WordFinderStore["addNote"]>) {
    return (await this.getDynamoStore()).addNote(...args);
  }

  async getStats(...args: Parameters<WordFinderStore["getStats"]>) {
    return (await this.getDynamoStore()).getStats(...args);
  }

  async getDailyStats(...args: Parameters<WordFinderStore["getDailyStats"]>) {
    return (await this.getDynamoStore()).getDailyStats(...args);
  }
}

export function getStore(): WordFinderStore {
  const globalStore = globalThis as GlobalWithStore;
  if (globalStore[GLOBAL_KEY]) {
    return globalStore[GLOBAL_KEY];
  }

  const store = process.env.WORD_FINDER_STORE === "dynamodb"
    ? new LazyDynamoWordFinderStore()
    : new MemoryWordFinderStore();

  globalStore[GLOBAL_KEY] = store;
  return store;
}

export function clearStoreSingletonForTests(): void {
  delete (globalThis as GlobalWithStore)[GLOBAL_KEY];
}
