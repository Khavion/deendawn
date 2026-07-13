import { createMemoryVectorStore, distanceToScore, EMBEDDING_DIM } from '../vectorStore';

const unit = (hotIndex: number): number[] => {
  const v = new Array(EMBEDDING_DIM).fill(0);
  v[hotIndex] = 1;
  return v;
};

const blend = (a: number[], b: number[], t: number): number[] =>
  a.map((x, i) => x * (1 - t) + b[i] * t);

describe('memory vector store', () => {
  it('returns nearest neighbours closest-first', () => {
    const store = createMemoryVectorStore();
    const q = unit(0);
    store.upsert([
      { ayahId: 1, embedding: unit(0) }, // identical
      { ayahId: 2, embedding: blend(unit(0), unit(1), 0.3) }, // close
      { ayahId: 3, embedding: unit(1) }, // orthogonal
    ]);
    const hits = store.searchNearest(q, 3);
    expect(hits.map((h) => h.ayahId)).toEqual([1, 2, 3]);
    expect(hits[0].score).toBeGreaterThan(hits[1].score);
    expect(hits[1].score).toBeGreaterThan(hits[2].score);
  });

  it('caps results at k and handles empty stores', () => {
    const store = createMemoryVectorStore();
    expect(store.searchNearest(unit(0), 5)).toEqual([]);
    store.upsert([
      { ayahId: 1, embedding: unit(0) },
      { ayahId: 2, embedding: unit(1) },
    ]);
    expect(store.searchNearest(unit(0), 1)).toHaveLength(1);
    expect(store.searchNearest(unit(0), 0)).toEqual([]);
    expect(store.count()).toBe(2);
  });

  it('upsert replaces an existing ayah embedding', () => {
    const store = createMemoryVectorStore();
    store.upsert([{ ayahId: 7, embedding: unit(2) }]);
    store.upsert([{ ayahId: 7, embedding: unit(3) }]);
    expect(store.count()).toBe(1);
    expect(store.searchNearest(unit(3), 1)[0].ayahId).toBe(7);
  });

  it('rejects wrong-dimension vectors', () => {
    const store = createMemoryVectorStore();
    expect(() => store.upsert([{ ayahId: 1, embedding: [1, 2, 3] }])).toThrow(RangeError);
    expect(() => store.searchNearest([1], 3)).toThrow(RangeError);
  });

  it('scores map distance 0 to 1 and shrink monotonically', () => {
    expect(distanceToScore(0)).toBe(1);
    expect(distanceToScore(1)).toBeLessThan(distanceToScore(0.5));
    expect(distanceToScore(-3)).toBe(1); // clamped
  });
});
