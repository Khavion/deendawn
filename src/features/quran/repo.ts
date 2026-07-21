import { hasArabic, normalizeArabicQuery } from './normalize';

/**
 * Read-only queries over the bundled quran.db. The db interface is the
 * synchronous subset shared by expo-sqlite (device) and a better-sqlite3
 * adapter (tests run against the real committed database bytes).
 */
export interface QuranDb {
  getAllSync<T>(sql: string, params: (string | number)[]): T[];
  getFirstSync<T>(sql: string, params: (string | number)[]): T | null;
}

export interface SurahRow {
  number: number;
  name_arabic: string;
  name_transliteration: string;
  name_english: string;
  ayah_count: number;
  revelation_type: string;
}

export interface AyahRow {
  id: number;
  surah: number;
  ayah: number;
  juz: number;
  text_uthmani: string;
  text_translation: string;
}

export function listSurahs(db: QuranDb): SurahRow[] {
  return db.getAllSync<SurahRow>(
    'SELECT number, name_arabic, name_transliteration, name_english, ayah_count, revelation_type FROM surahs ORDER BY number',
    []
  );
}

export function getSurah(db: QuranDb, number: number): SurahRow | null {
  return db.getFirstSync<SurahRow>(
    'SELECT number, name_arabic, name_transliteration, name_english, ayah_count, revelation_type FROM surahs WHERE number = ?',
    [number]
  );
}

export function listAyahs(db: QuranDb, surah: number): AyahRow[] {
  return db.getAllSync<AyahRow>('SELECT * FROM ayahs WHERE surah = ? ORDER BY ayah', [surah]);
}

export function getAyah(db: QuranDb, surah: number, ayah: number): AyahRow | null {
  return db.getFirstSync<AyahRow>('SELECT * FROM ayahs WHERE surah = ? AND ayah = ?', [
    surah,
    ayah,
  ]);
}

/**
 * Fetch the ayah rows for a list of (surah, ayah) refs, preserving the given
 * order and dropping any ref not found. Used by the bookmarks browser to
 * render saved verses with their text.
 */
export function getAyahsByRefs(
  db: QuranDb,
  refs: { surah: number; ayah: number }[]
): AyahRow[] {
  const rows: AyahRow[] = [];
  for (const ref of refs) {
    const row = getAyah(db, ref.surah, ref.ayah);
    if (row) rows.push(row);
  }
  return rows;
}

/**
 * FTS search over the derived normalized columns. Arabic queries are folded
 * with the same normalization the index was built with; every token is
 * quoted so user input can never inject FTS syntax.
 */
export function searchAyahs(db: QuranDb, query: string, limit = 50): AyahRow[] {
  const folded = hasArabic(query) ? normalizeArabicQuery(query) : query.toLowerCase().trim();
  const tokens = folded.split(/\s+/).filter((t) => t.length > 0);
  if (tokens.length === 0) return [];
  const match = tokens.map((t) => `"${t.replace(/"/g, '')}"`).join(' ');
  return db.getAllSync<AyahRow>(
    `SELECT a.* FROM ayahs_fts f JOIN ayahs a ON a.id = f.rowid
     WHERE ayahs_fts MATCH ? ORDER BY a.id LIMIT ?`,
    [match, limit]
  );
}

/** Share text with a proper citation; content is verbatim db bytes. */
export function buildShareText(
  row: AyahRow,
  surah: SurahRow,
  options: { includeTranslation: boolean }
): string {
  const cite = `— Quran ${row.surah}:${row.ayah} (${surah.name_transliteration})`;
  const parts = [row.text_uthmani];
  if (options.includeTranslation) parts.push(row.text_translation);
  parts.push(cite);
  return parts.join('\n\n');
}
