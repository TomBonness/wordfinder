import { DynamoWordFinderStore } from "./dynamo-store";
import { MemoryWordFinderStore } from "./memory-store";
import type { WordFinderStore } from "./store";

const GLOBAL_KEY = Symbol.for("wordfinder.store");
type GlobalWithStore = typeof globalThis & { [GLOBAL_KEY]?: WordFinderStore };

export function getStore(): WordFinderStore {
  const globalStore = globalThis as GlobalWithStore;
  if (globalStore[GLOBAL_KEY]) {
    return globalStore[GLOBAL_KEY];
  }

  const store = process.env.WORD_FINDER_STORE === "dynamodb"
    ? new DynamoWordFinderStore()
    : new MemoryWordFinderStore();

  globalStore[GLOBAL_KEY] = store;
  return store;
}

export function clearStoreSingletonForTests(): void {
  delete (globalThis as GlobalWithStore)[GLOBAL_KEY];
}
