import { AyahRow } from '../../quran/repo';

export interface VectorHit {
  ayahId: number;
  /** Higher = closer. */
  score: number;
}

/**
 * Hybrid retrieval merge (directive E9): FTS candidates ∪ vector top-k,
 * deduped by ayah id, simply re-ranked — items found by BOTH methods first,
 * then vector hits by score, then remaining FTS hits in corpus order.
 */
export function mergeHybrid(
  ftsRows: AyahRow[],
  vectorHits: VectorHit[],
  rowsById: Map<number, AyahRow>,
  limit: number
): AyahRow[] {
  const ftsIds = new Set(ftsRows.map((r) => r.id));
  const vecIds = new Set(vectorHits.map((h) => h.ayahId));

  const both: AyahRow[] = ftsRows.filter((r) => vecIds.has(r.id));
  const vecOnly: AyahRow[] = vectorHits
    .filter((h) => !ftsIds.has(h.ayahId))
    .sort((a, b) => b.score - a.score)
    .map((h) => rowsById.get(h.ayahId))
    .filter((r): r is AyahRow => !!r);
  const ftsOnly: AyahRow[] = ftsRows.filter((r) => !vecIds.has(r.id));

  const seen = new Set<number>();
  const merged: AyahRow[] = [];
  for (const row of [...both, ...vecOnly, ...ftsOnly]) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    merged.push(row);
    if (merged.length >= limit) break;
  }
  return merged;
}
