import type { VectorHit } from './hybrid';

/**
 * Verse-embedding store for Tier B hybrid retrieval (directive E9).
 *
 * Lives in vectors.db via expo-sqlite's bundled `sqlite-vec` extension — the
 * SAME SQLite stack as the Quran/library DBs, in its own database file. (SDK
 * 54's expo-sqlite ships the vec.xcframework and loads it through
 * `bundledExtensions['sqlite-vec']`, so op-sqlite is no longer needed and the
 * from-source-RN + fmt build patches were removed.) The memory implementation
 * backs tests and keeps every consumer runnable without native code.
 *
 * NOTE: the native `sqlite-vec` framework is bundled only when the
 * `withSQLiteVecExtension` config-plugin flag is enabled in app.json. It is
 * currently OFF (Tier B is gated + model-blocked + only validatable on a
 * physical device), so `createExpoSqliteVectorStore()` throws until the flag is
 * turned on in the dedicated on-device Tier B session. Nothing calls it before
 * then; the memory store powers all tests.
 */
export const EMBEDDING_DIM = 384; // multilingual-e5-small / all-MiniLM-L6-v2 (both 384-dim)

export interface VectorStore {
  count(): number;
  upsert(items: { ayahId: number; embedding: number[] }[]): void;
  /** k nearest verses; hits carry score where higher = closer. */
  searchNearest(query: number[], k: number): VectorHit[];
  close(): void;
}

function assertDim(embedding: number[], what: string): void {
  if (embedding.length !== EMBEDDING_DIM) {
    throw new RangeError(`${what} must have ${EMBEDDING_DIM} dims, got ${embedding.length}`);
  }
}

/** distance (smaller = closer) → score (higher = closer), stable in [0, 1]. */
export function distanceToScore(distance: number): number {
  return 1 / (1 + Math.max(0, distance));
}

export function createMemoryVectorStore(): VectorStore {
  const rows = new Map<number, number[]>();
  return {
    count: () => rows.size,
    upsert(items) {
      for (const { ayahId, embedding } of items) {
        assertDim(embedding, 'embedding');
        rows.set(ayahId, embedding);
      }
    },
    searchNearest(query, k) {
      assertDim(query, 'query');
      if (k <= 0) return [];
      const scored: VectorHit[] = [];
      for (const [ayahId, emb] of rows) {
        // Cosine distance, matching sqlite-vec's distance_cosine metric.
        let dot = 0;
        let qn = 0;
        let en = 0;
        for (let i = 0; i < EMBEDDING_DIM; i++) {
          dot += query[i] * emb[i];
          qn += query[i] * query[i];
          en += emb[i] * emb[i];
        }
        const denom = Math.sqrt(qn) * Math.sqrt(en);
        const cosine = denom > 0 ? dot / denom : 0;
        scored.push({ ayahId, score: distanceToScore(1 - cosine) });
      }
      return scored.sort((a, b) => b.score - a.score || a.ayahId - b.ayahId).slice(0, k);
    },
    close() {
      rows.clear();
    },
  };
}

export const VECTORS_DB_NAME = 'vectors.db';

/** Embeddings are stored little-endian float32; sqlite-vec reads a raw blob. */
function embeddingBlob(embedding: number[]): Uint8Array {
  return new Uint8Array(new Float32Array(embedding).buffer);
}

/**
 * Real store on expo-sqlite's bundled sqlite-vec. Lazy-requires expo-sqlite so
 * importing this module never touches native code; rowid IS the ayah id.
 * Async because loading the extension is async (`loadExtensionAsync`).
 */
export async function createExpoSqliteVectorStore(): Promise<VectorStore> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const SQLite = require('expo-sqlite') as typeof import('expo-sqlite');
  const db = SQLite.openDatabaseSync(VECTORS_DB_NAME);
  const ext = SQLite.bundledExtensions['sqlite-vec'];
  if (!ext) {
    throw new Error(
      'sqlite-vec extension is not bundled — enable withSQLiteVecExtension in app.json'
    );
  }
  await db.loadExtensionAsync(ext.libPath, ext.entryPoint);
  db.execSync(
    `CREATE VIRTUAL TABLE IF NOT EXISTS vec_verses USING vec0(embedding float[${EMBEDDING_DIM}])`
  );
  return {
    count() {
      const row = db.getFirstSync<{ n: number }>('SELECT COUNT(*) AS n FROM vec_verses');
      return Number(row?.n ?? 0);
    },
    upsert(items) {
      for (const { ayahId, embedding } of items) {
        assertDim(embedding, 'embedding');
        db.runSync('INSERT OR REPLACE INTO vec_verses(rowid, embedding) VALUES (?, ?)', [
          ayahId,
          embeddingBlob(embedding),
        ]);
      }
    },
    searchNearest(query, k) {
      assertDim(query, 'query');
      if (k <= 0) return [];
      const rows = db.getAllSync<{ ayahId: number; distance: number }>(
        'SELECT rowid AS ayahId, distance FROM vec_verses WHERE embedding MATCH ? ORDER BY distance LIMIT ?',
        [embeddingBlob(query), k]
      );
      return rows.map((r) => ({
        ayahId: Number(r.ayahId),
        score: distanceToScore(Number(r.distance)),
      }));
    },
    close() {
      db.closeSync();
    },
  };
}
