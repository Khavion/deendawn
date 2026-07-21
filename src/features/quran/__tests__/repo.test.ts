/**
 * @jest-environment node
 *
 * Runs against the REAL committed quran.db via a better-sqlite3 adapter, so
 * these tests exercise the same bytes the app ships.
 */
import Database from 'better-sqlite3';
import path from 'node:path';

import { normalizeArabicQuery } from '../normalize';
import {
  buildShareText,
  getAyah,
  getAyahByOrdinal,
  getSurah,
  listAyahs,
  listSurahs,
  searchAyahs,
  QuranDb,
} from '../repo';
import {
  isBookmarked,
  loadBookmarks,
  loadLastRead,
  loadShowTranslation,
  saveLastRead,
  saveShowTranslation,
  toggleBookmark,
} from '../readerState';
import { createMemoryKVStore } from '../../../lib/kvStore';

const DB_PATH = path.resolve(__dirname, '..', '..', '..', '..', 'assets', 'db', 'quran.db');

function openTestDb(): { db: QuranDb; close: () => void } {
  const raw = new Database(DB_PATH, { readonly: true, fileMustExist: true });
  return {
    db: {
      getAllSync: <T>(sql: string, params: (string | number)[] = []) =>
        raw.prepare(sql).all(...params) as T[],
      getFirstSync: <T>(sql: string, params: (string | number)[] = []) =>
        (raw.prepare(sql).get(...params) as T) ?? null,
    },
    close: () => raw.close(),
  };
}

const { db, close } = openTestDb();
afterAll(close);

describe('quran repo over the shipped database', () => {
  test('getAyahByOrdinal walks mushaf order — first, last, and a middle verse', () => {
    expect(getAyahByOrdinal(db, 0)).toMatchObject({ surah: 1, ayah: 1 });
    expect(getAyahByOrdinal(db, 6235)).toMatchObject({ surah: 114, ayah: 6 });
    // Al-Faatiha has 7 ayat, so ordinal 7 is the first ayah of Al-Baqara.
    expect(getAyahByOrdinal(db, 7)).toMatchObject({ surah: 2, ayah: 1 });
  });

  test('lists all 114 surahs in order with metadata', () => {
    const surahs = listSurahs(db);
    expect(surahs).toHaveLength(114);
    expect(surahs[0]).toMatchObject({
      number: 1,
      name_transliteration: 'Al-Faatiha',
      ayah_count: 7,
    });
    expect(surahs[113]).toMatchObject({
      number: 114,
      name_transliteration: 'An-Naas',
      ayah_count: 6,
    });
  });

  test('surah detail and ayah listing match declared counts', () => {
    for (const n of [1, 2, 18, 114]) {
      const surah = getSurah(db, n)!;
      const ayahs = listAyahs(db, n);
      expect(ayahs).toHaveLength(surah.ayah_count);
      expect(ayahs[0].ayah).toBe(1);
      expect(ayahs.at(-1)!.ayah).toBe(surah.ayah_count);
      expect(ayahs.every((a) => a.text_uthmani.length > 0 && a.text_translation.length > 0)).toBe(
        true
      );
    }
    expect(getSurah(db, 115)).toBeNull();
    expect(getAyah(db, 1, 8)).toBeNull();
  });

  test('TS query normalization is byte-identical to the pipeline-built index', () => {
    // Parity check without authoring Arabic: normalize source text and compare
    // to the stored derived column for a sample of ayahs.
    const rows = db.getAllSync<{ rowid: number; text_normalized: string }>(
      'SELECT rowid, text_normalized FROM ayahs_fts WHERE rowid IN (1, 7, 255, 3000, 6236)',
      []
    );
    expect(rows).toHaveLength(5);
    for (const r of rows) {
      const source = db.getFirstSync<{ text_uthmani: string }>(
        'SELECT text_uthmani FROM ayahs WHERE id = ?',
        [r.rowid]
      )!;
      expect(normalizeArabicQuery(source.text_uthmani)).toBe(r.text_normalized);
    }
  });

  test('Arabic FTS search: words taken from an ayah find that ayah', () => {
    const norm = db.getFirstSync<{ text_normalized: string }>(
      'SELECT text_normalized FROM ayahs_fts WHERE rowid = 1',
      []
    )!;
    const word = norm.text_normalized.split(' ')[1];
    const hits = searchAyahs(db, word);
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.some((h) => h.surah === 1 && h.ayah === 1)).toBe(true);
  });

  test('English FTS search over the translation works and is case-insensitive', () => {
    const hits = searchAyahs(db, 'MERCIFUL');
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.some((h) => h.surah === 1)).toBe(true);
  });

  test('FTS syntax characters in user input cannot break the query', () => {
    expect(() => searchAyahs(db, 'mercy" OR x')).not.toThrow();
    expect(searchAyahs(db, '"" ~ ( )')).toEqual([]);
    expect(searchAyahs(db, '   ')).toEqual([]);
  });

  test('share text carries verbatim db bytes and a citation', () => {
    const row = getAyah(db, 112, 1)!;
    const surah = getSurah(db, 112)!;
    const withT = buildShareText(row, surah, { includeTranslation: true });
    expect(withT).toContain(row.text_uthmani);
    expect(withT).toContain(row.text_translation);
    expect(withT).toContain('— Quran 112:1 (Al-Ikhlaas)');
    const withoutT = buildShareText(row, surah, { includeTranslation: false });
    expect(withoutT).not.toContain(row.text_translation);
  });
});

describe('reader state (bookmarks, last read, translation toggle)', () => {
  test('bookmark toggle round-trips and de-duplicates', () => {
    const store = createMemoryKVStore();
    expect(loadBookmarks(store)).toEqual([]);
    expect(toggleBookmark(store, { surah: 2, ayah: 255 })).toBe(true);
    expect(isBookmarked(store, { surah: 2, ayah: 255 })).toBe(true);
    expect(toggleBookmark(store, { surah: 2, ayah: 255 })).toBe(false);
    expect(loadBookmarks(store)).toEqual([]);
  });

  test('last read persists and rejects malformed values', () => {
    const store = createMemoryKVStore();
    expect(loadLastRead(store)).toBeNull();
    saveLastRead(store, { surah: 18, ayah: 10 });
    expect(loadLastRead(store)).toEqual({ surah: 18, ayah: 10 });
    store.set('quran.lastRead.v1', '{"surah": 999, "ayah": -1}');
    expect(loadLastRead(store)).toBeNull();
  });

  test('translation toggle defaults on and persists off', () => {
    const store = createMemoryKVStore();
    expect(loadShowTranslation(store)).toBe(true);
    saveShowTranslation(store, false);
    expect(loadShowTranslation(store)).toBe(false);
  });
});
