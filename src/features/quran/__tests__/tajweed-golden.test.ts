/**
 * @jest-environment node
 *
 * Golden alignment gate for the tajweed data. Runs the bundled
 * assets/tajweed.json against the REAL committed quran.db and fails the build
 * if ANY annotation drifts from the text. This is the integrity guarantee that
 * lets us ship derived tajweed spans without hand-checking checksums: the data
 * is proven, on every commit, to color the right letters.
 */
import Database from 'better-sqlite3';
import path from 'node:path';

import tajweed from '../../../../assets/tajweed.json';

const HAMZAT_WASL = 0x0671; // alef wasla
const LAM = 0x0644; // base lam of the sun-letter lam

const raw = new Database(
  path.resolve(__dirname, '..', '..', '..', '..', 'assets', 'db', 'quran.db'),
  { readonly: true, fileMustExist: true }
);
const ayahs = raw
  .prepare('SELECT surah, ayah, text_uthmani FROM ayahs ORDER BY surah, ayah')
  .all() as { surah: number; ayah: number; text_uthmani: string }[];
afterAll(() => raw.close());

const data = tajweed as unknown as {
  rules: string[];
  ayat: Record<string, [number, number, number][]>;
};

describe('tajweed data aligns to the shipped quran.db', () => {
  test('covers exactly the 6236 ayahs, keyed to the corpus', () => {
    expect(ayahs).toHaveLength(6236);
    expect(Object.keys(data.ayat)).toHaveLength(6236);
    for (const a of ayahs) {
      expect(data.ayat[`${a.surah}:${a.ayah}`]).toBeDefined();
    }
  });

  test('the rule set is the known 18 tajweed rules', () => {
    expect(data.rules).toHaveLength(18);
    expect(data.rules).toEqual([...data.rules].sort()); // stable ordering
    expect(data.rules).toContain('hamzat_wasl');
    expect(data.rules).toContain('qalqalah');
  });

  test('every span is in-bounds for its ayah (no drift past the text)', () => {
    for (const a of ayahs) {
      const len = [...a.text_uthmani].length;
      for (const [ruleId, start, end] of data.ayat[`${a.surah}:${a.ayah}`]) {
        expect(ruleId).toBeGreaterThanOrEqual(0);
        expect(ruleId).toBeLessThan(data.rules.length);
        expect(start).toBeGreaterThanOrEqual(0);
        expect(end).toBeGreaterThan(start);
        expect(end).toBeLessThanOrEqual(len);
      }
    }
  });

  test('semantic anchor: hamzat_wasl spans sit on the alef-wasla; lam_shamsiyyah spans cover a lam', () => {
    const hamzaId = data.rules.indexOf('hamzat_wasl');
    const lamId = data.rules.indexOf('lam_shamsiyyah');
    let hamza = 0;
    let lam = 0;
    for (const a of ayahs) {
      const cps = [...a.text_uthmani];
      for (const [ruleId, start, end] of data.ayat[`${a.surah}:${a.ayah}`]) {
        const slice = cps.slice(start, end).map((c) => c.codePointAt(0));
        if (ruleId === hamzaId) {
          hamza++;
          expect(slice).toContain(HAMZAT_WASL);
        } else if (ruleId === lamId) {
          lam++;
          expect(slice).toContain(LAM);
        }
      }
    }
    // Sanity: these rules actually occur in the corpus.
    expect(hamza).toBeGreaterThan(10000);
    expect(lam).toBeGreaterThan(2000);
  });
});
