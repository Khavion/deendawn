/**
 * Tiny key-value persistence for user data (settings, positions, counters).
 * Backed by expo-sqlite on device (the constitution's user-data db); tests
 * inject the in-memory implementation. All values are JSON strings.
 */
export interface KVStore {
  get(key: string): string | null;
  set(key: string, value: string): void;
  delete(key: string): void;
}

export function createMemoryKVStore(initial: Record<string, string> = {}): KVStore {
  const map = new Map(Object.entries(initial));
  return {
    get: (k) => map.get(k) ?? null,
    set: (k, v) => void map.set(k, v),
    delete: (k) => void map.delete(k),
  };
}

let sqliteStore: KVStore | null = null;

/** Lazily opens user.db so importing this module never touches native code. */
export function getUserKVStore(): KVStore {
  if (sqliteStore) return sqliteStore;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { openDatabaseSync } = require('expo-sqlite') as typeof import('expo-sqlite');
  const db = openDatabaseSync('user.db');
  db.execSync('CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL)');
  sqliteStore = {
    get: (key) => {
      const row = db.getFirstSync<{ value: string }>('SELECT value FROM kv WHERE key = ?', key);
      return row?.value ?? null;
    },
    set: (key, value) => {
      db.runSync('INSERT OR REPLACE INTO kv (key, value) VALUES (?, ?)', key, value);
    },
    delete: (key) => {
      db.runSync('DELETE FROM kv WHERE key = ?', key);
    },
  };
  return sqliteStore;
}
