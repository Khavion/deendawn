/**
 * @jest-environment node
 *
 * Golden religious-text tests (commit gate). Deliberately independent of the
 * pipeline implementation: re-parses source bytes and re-hashes with its own
 * code so a pipeline bug cannot mask a content defect (CLAUDE.md rule 1).
 */
import Database from 'better-sqlite3';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '..', '..');
const DATA = path.join(ROOT, 'content-pipeline', 'data');
const LOCK = path.join(ROOT, 'content-pipeline', 'content.lock');
const DB = path.join(ROOT, 'assets', 'db', 'quran.db');
const ATTRIBUTION = path.join(ROOT, 'assets', 'attribution.json');

const sha256 = (b: Buffer) => createHash('sha256').update(b).digest('hex');

interface Verse {
  sura: number;
  aya: number;
  text: string;
}

function parseTanzil(buf: Buffer): Verse[] {
  return buf
    .toString('utf8')
    .split('\n')
    .filter((l) => l.trim() !== '' && !l.startsWith('#'))
    .map((l) => {
      const [sura, aya, ...rest] = l.split('|');
      return { sura: Number(sura), aya: Number(aya), text: rest.join('|') };
    });
}

const concatHash = (verses: Verse[]) =>
  sha256(Buffer.from(verses.map((v) => `${v.sura}|${v.aya}|${v.text}`).join('\n'), 'utf8'));

const lock = JSON.parse(readFileSync(LOCK, 'utf8'));

describe('content.lock checksums (NO-AI ZONE gate)', () => {
  const ids = ['quran-uthmani', 'en-pickthall', 'quran-metadata'];

  test('lock has entries for all pinned artifacts', () => {
    for (const id of ids) expect(lock.artifacts[id]?.sha256).toMatch(/^[0-9a-f]{64}$/);
  });

  test.each(ids)('%s bytes match locked SHA-256', (id) => {
    const entry = lock.artifacts[id];
    const buf = readFileSync(path.join(DATA, entry.file));
    expect(sha256(buf)).toBe(entry.sha256);
    expect(buf.length).toBe(entry.bytes);
  });
});

describe('source text structure (Hafs/Kufan numbering)', () => {
  const uthmani = parseTanzil(readFileSync(path.join(DATA, 'quran-uthmani.txt')));
  const translation = parseTanzil(readFileSync(path.join(DATA, 'en.pickthall.txt')));

  test('114 surahs, 6236 ayahs, zero empty, both artifacts aligned', () => {
    for (const verses of [uthmani, translation]) {
      expect(new Set(verses.map((v) => v.sura)).size).toBe(114);
      expect(verses).toHaveLength(6236);
      expect(verses.every((v) => v.text.trim().length > 0)).toBe(true);
    }
    for (let i = 0; i < uthmani.length; i++) {
      expect(`${uthmani[i].sura}:${uthmani[i].aya}`).toBe(
        `${translation[i].sura}:${translation[i].aya}`
      );
    }
  });

  test('spot-check ayahs 1:1 and 114:6 match pinned byte hashes', () => {
    const first = uthmani.find((v) => v.sura === 1 && v.aya === 1)!;
    const last = uthmani.find((v) => v.sura === 114 && v.aya === 6)!;
    const spots = lock.artifacts['quran-uthmani'].spotChecks;
    expect(sha256(Buffer.from(first.text, 'utf8'))).toBe(spots['ayah-1:1']);
    expect(sha256(Buffer.from(last.text, 'utf8'))).toBe(spots['ayah-114:6']);
  });
});

describe('quran.db golden checks', () => {
  let db: InstanceType<typeof Database>;
  beforeAll(() => {
    expect(existsSync(DB)).toBe(true);
    db = new Database(DB, { readonly: true, fileMustExist: true });
  });
  afterAll(() => db?.close());

  test('counts: 114 surahs, 6236 ayahs, 6236 FTS rows, 30 juz', () => {
    expect(db.prepare('SELECT COUNT(*) n FROM surahs').get()).toEqual({ n: 114 });
    expect(db.prepare('SELECT COUNT(*) n FROM ayahs').get()).toEqual({ n: 6236 });
    expect(db.prepare('SELECT COUNT(*) n FROM ayahs_fts').get()).toEqual({ n: 6236 });
    expect(db.prepare('SELECT COUNT(DISTINCT juz) n FROM ayahs').get()).toEqual({ n: 30 });
    expect(db.prepare("SELECT COUNT(*) n FROM ayahs WHERE TRIM(text_uthmani) = ''").get()).toEqual({
      n: 0,
    });
  });

  test('db source columns byte-equal the verified source files (first/last ayah + full concat)', () => {
    const uthmani = parseTanzil(readFileSync(path.join(DATA, 'quran-uthmani.txt')));
    const rows = db
      .prepare('SELECT surah AS sura, ayah AS aya, text_uthmani AS text FROM ayahs ORDER BY id')
      .all() as Verse[];
    expect(rows[0].text).toBe(uthmani[0].text);
    expect(rows[rows.length - 1].text).toBe(uthmani[uthmani.length - 1].text);
    expect(concatHash(rows)).toBe(lock.artifacts['quran-uthmani'].concatSha256);

    const tRows = db
      .prepare('SELECT surah AS sura, ayah AS aya, text_translation AS text FROM ayahs ORDER BY id')
      .all() as Verse[];
    expect(concatHash(tRows)).toBe(lock.artifacts['en-pickthall'].concatSha256);
  });

  test('db meta hashes match content.lock', () => {
    const meta = Object.fromEntries(
      (db.prepare('SELECT key, value FROM meta').all() as { key: string; value: string }[]).map(
        (r) => [r.key, r.value]
      )
    );
    expect(meta.uthmani_sha256).toBe(lock.artifacts['quran-uthmani'].sha256);
    expect(meta.translation_sha256).toBe(lock.artifacts['en-pickthall'].sha256);
    expect(meta.metadata_sha256).toBe(lock.artifacts['quran-metadata'].sha256);
  });

  test('FTS search finds ayah 1:1 by its own normalized words (no literals authored here)', () => {
    const norm = db.prepare('SELECT text_normalized t FROM ayahs_fts WHERE rowid = 1').get() as {
      t: string;
    };
    const word = norm.t.split(' ').find((w) => w.length >= 3)!;
    const hits = db
      .prepare('SELECT rowid FROM ayahs_fts WHERE ayahs_fts MATCH ?')
      .all(`"${word}"`) as { rowid: number }[];
    expect(hits.map((h) => h.rowid)).toContain(1);
  });
});

describe('attribution manifest', () => {
  test('exists and covers every pinned artifact with license + source URL', () => {
    const manifest = JSON.parse(readFileSync(ATTRIBUTION, 'utf8'));
    const ids = manifest.artifacts.map((a: { id: string }) => a.id);
    expect(ids).toEqual(
      expect.arrayContaining(['quran-uthmani', 'en-pickthall', 'quran-metadata'])
    );
    for (const a of manifest.artifacts) {
      expect(a.license).toBeTruthy();
      // Only pinned hosts may appear: Tanzil (text) and official font releases.
      expect(a.url).toMatch(
        /^https:\/\/(tanzil\.net\/|www\.gutenberg\.org\/cache\/epub\/|github\.com\/(aliftype\/amiri|googlefonts\/literata|adobe-fonts\/source-sans|notofonts\/nastaliq)\/releases\/download\/)/
      );
      expect(a.sha256).toBe(lock.artifacts[a.id].sha256);
    }
    expect(manifest.artifacts.find((a: { id: string }) => a.id === 'en-pickthall').devOnly).toBe(
      true
    );
  });
});

describe('library.db golden checks (E10)', () => {
  const LIB = path.join(ROOT, 'assets', 'db', 'library.db');

  test('exists with fully-attributed public-domain works and sane sections', () => {
    expect(existsSync(LIB)).toBe(true);
    const lib = new Database(LIB, { readonly: true, fileMustExist: true });
    const works = lib
      .prepare('SELECT artifact_id, translator, year, license, source_url FROM works')
      .all() as {
      artifact_id: string;
      translator: string;
      year: number;
      license: string;
      source_url: string;
    }[];
    expect(works.length).toBeGreaterThanOrEqual(3);
    for (const w of works) {
      expect(w.translator.length).toBeGreaterThan(0);
      expect(w.year).toBeGreaterThan(1800);
      expect(w.year).toBeLessThan(1930); // US public-domain era for this corpus
      expect(w.license).toMatch(/public domain/i);
      expect(w.source_url).toMatch(/^https:\/\/www\.gutenberg\.org\//);
      expect(lock.artifacts[w.artifact_id]?.sha256).toMatch(/^[0-9a-f]{64}$/);
      const meta = lib
        .prepare('SELECT value FROM meta WHERE key = ?')
        .get('sha256:' + w.artifact_id) as { value: string } | undefined;
      expect(meta?.value).toBe(lock.artifacts[w.artifact_id].sha256);
      const n = (
        lib
          .prepare(
            'SELECT COUNT(*) n FROM sections s JOIN works w ON w.id = s.work_id WHERE w.artifact_id = ?'
          )
          .get(w.artifact_id) as { n: number }
      ).n;
      expect(n).toBeGreaterThanOrEqual(10);
    }
    const hits = lib
      .prepare('SELECT rowid FROM sections_fts WHERE sections_fts MATCH ? LIMIT 3')
      .all('"knowledge"') as { rowid: number }[];
    expect(hits.length).toBeGreaterThan(0);
    lib.close();
  });
});
