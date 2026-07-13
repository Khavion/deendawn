import type { VectorHit } from './hybrid';

/**
 * Verse-embedding store for Tier B hybrid retrieval (directive E9).
 *
 * Lives in vectors.db via op-sqlite + sqlite-vec — a SEPARATE database file
 * and SQLite stack from the expo-sqlite quran.db (constitution stack rule;
 * the dual-SQLite build risk is handled by building RN from source, see
 * plugins/withRNFromSource.js). The memory implementation backs tests and
 * keeps every consumer runnable without native code.
 */
export const EMBEDDING_DIM = 384; // all-MiniLM-L6-v2

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

/**
 * Real store on sqlite-vec. Lazy-requires op-sqlite so importing this module
 * never touches native code; rowid IS the ayah id.
 */
export function createOpSqliteVectorStore(): VectorStore {
  const { open } =
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('@op-engineering/op-sqlite') as typeof import('@op-engineering/op-sqlite');
  const db = open({ name: VECTORS_DB_NAME });
  db.executeSync(
    `CREATE VIRTUAL TABLE IF NOT EXISTS vec_verses USING vec0(embedding float[${EMBEDDING_DIM}])`
  );
  return {
    count() {
      const res = db.executeSync('SELECT COUNT(*) AS n FROM vec_verses');
      return Number(res.rows[0]?.n ?? 0);
    },
    upsert(items) {
      for (const { ayahId, embedding } of items) {
        assertDim(embedding, 'embedding');
        db.executeSync('INSERT OR REPLACE INTO vec_verses(rowid, embedding) VALUES (?, ?)', [
          ayahId,
          new Float32Array(embedding).buffer,
        ]);
      }
    },
    searchNearest(query, k) {
      assertDim(query, 'query');
      if (k <= 0) return [];
      const res = db.executeSync(
        'SELECT rowid AS ayahId, distance FROM vec_verses WHERE embedding MATCH ? ORDER BY distance LIMIT ?',
        [new Float32Array(query).buffer, k]
      );
      return res.rows.map((r) => ({
        ayahId: Number((r as { ayahId: number }).ayahId),
        score: distanceToScore(Number((r as { distance: number }).distance)),
      }));
    },
    close() {
      db.close();
    },
  };
}
