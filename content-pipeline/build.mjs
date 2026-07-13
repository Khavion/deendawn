// content:build — emit assets/db/quran.db and assets/attribution.json.
// Source columns hold the verified bytes untouched; FTS indexes are built on
// DERIVED normalized columns only (CLAUDE.md rule 1). Runs verify first and
// self-checks the emitted db against content.lock afterwards.
import Database from 'better-sqlite3';
import { readFileSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import {
  DATA_DIR,
  REPO_ROOT,
  loadSources,
  loadLock,
  sha256,
  parseTanzilTxt,
  parseQuranDataXml,
  normalizeArabicForSearch,
  markPipelineRan,
  EXPECTED_AYAHS,
} from './lib.mjs';
import { runVerify, concatHash } from './verify.mjs';

const errs = runVerify();
if (errs.length > 0) {
  console.error('content:build refused — verification failed:\n');
  for (const e of errs) console.error(' - ' + e);
  process.exit(1);
}

const sources = loadSources();
const lock = loadLock();
const byId = Object.fromEntries(sources.map((s) => [s.id, s]));
const read = (id) => readFileSync(path.join(DATA_DIR, byId[id].file));

const uthmani = parseTanzilTxt(read('quran-uthmani')).verses;
const translation = parseTanzilTxt(read('en-pickthall')).verses;
const { suras, juzs } = parseQuranDataXml(read('quran-metadata'));

// Cross-artifact alignment: both texts must cover exactly the same ayah keys.
if (uthmani.length !== translation.length)
  throw new Error(
    `verse count mismatch: uthmani ${uthmani.length} vs translation ${translation.length}`
  );
for (let i = 0; i < uthmani.length; i++) {
  if (uthmani[i].sura !== translation[i].sura || uthmani[i].aya !== translation[i].aya)
    throw new Error(
      `alignment break at index ${i}: ${uthmani[i].sura}:${uthmani[i].aya} vs ${translation[i].sura}:${translation[i].aya}`
    );
}

// juz lookup: global ayah index -> juz number
const juzStarts = juzs
  .map((j) => ({ index: Number(j.index), sura: Number(j.sura), aya: Number(j.aya) }))
  .sort((a, b) => a.index - b.index);
function juzOf(sura, aya) {
  let current = 1;
  for (const j of juzStarts) {
    if (sura > j.sura || (sura === j.sura && aya >= j.aya)) current = j.index;
    else break;
  }
  return current;
}

const dbDir = path.join(REPO_ROOT, 'assets', 'db');
mkdirSync(dbDir, { recursive: true });
const dbPath = path.join(dbDir, 'quran.db');
markPipelineRan(); // sanction this write for the file guards
rmSync(dbPath, { force: true });

const db = new Database(dbPath);
db.pragma('journal_mode = OFF');
db.exec(`
  CREATE TABLE meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
  CREATE TABLE surahs (
    number INTEGER PRIMARY KEY,
    name_arabic TEXT NOT NULL,
    name_transliteration TEXT NOT NULL,
    name_english TEXT NOT NULL,
    ayah_count INTEGER NOT NULL,
    revelation_type TEXT NOT NULL,
    chronological_order INTEGER NOT NULL,
    rukus INTEGER NOT NULL
  );
  CREATE TABLE ayahs (
    id INTEGER PRIMARY KEY,
    surah INTEGER NOT NULL REFERENCES surahs(number),
    ayah INTEGER NOT NULL,
    juz INTEGER NOT NULL,
    text_uthmani TEXT NOT NULL,
    text_translation TEXT NOT NULL,
    UNIQUE(surah, ayah)
  );
  CREATE VIRTUAL TABLE ayahs_fts USING fts5(
    text_normalized,
    translation_normalized,
    tokenize = 'unicode61 remove_diacritics 2'
  );
`);

const insSurah = db.prepare(
  'INSERT INTO surahs VALUES (@number, @name_arabic, @name_transliteration, @name_english, @ayah_count, @revelation_type, @chronological_order, @rukus)'
);
const insAyah = db.prepare(
  'INSERT INTO ayahs VALUES (@id, @surah, @ayah, @juz, @text_uthmani, @text_translation)'
);
const insFts = db.prepare(
  'INSERT INTO ayahs_fts (rowid, text_normalized, translation_normalized) VALUES (?, ?, ?)'
);

db.transaction(() => {
  for (const s of suras) {
    insSurah.run({
      number: Number(s.index),
      name_arabic: s.name,
      name_transliteration: s.tname,
      name_english: s.ename,
      ayah_count: Number(s.ayas),
      revelation_type: s.type,
      chronological_order: Number(s.order),
      rukus: Number(s.rukus),
    });
  }
  for (let i = 0; i < uthmani.length; i++) {
    const v = uthmani[i];
    const id = i + 1;
    insAyah.run({
      id,
      surah: v.sura,
      ayah: v.aya,
      juz: juzOf(v.sura, v.aya),
      text_uthmani: v.text,
      text_translation: translation[i].text,
    });
    insFts.run(id, normalizeArabicForSearch(v.text), translation[i].text.toLowerCase());
  }
  const metaRows = {
    schema_version: '1',
    numbering: 'hafs-kufan',
    uthmani_sha256: lock.artifacts['quran-uthmani'].sha256,
    translation_sha256: lock.artifacts['en-pickthall'].sha256,
    metadata_sha256: lock.artifacts['quran-metadata'].sha256,
    uthmani_concat_sha256: lock.artifacts['quran-uthmani'].concatSha256,
    translation_concat_sha256: lock.artifacts['en-pickthall'].concatSha256,
  };
  const insMeta = db.prepare('INSERT INTO meta VALUES (?, ?)');
  for (const [k, val] of Object.entries(metaRows)) insMeta.run(k, val);
})();
db.exec('VACUUM;');

// Self-check: read back and compare against the lock before declaring success.
const rows = db
  .prepare('SELECT surah AS sura, ayah AS aya, text_uthmani AS text FROM ayahs ORDER BY id')
  .all();
const tRows = db
  .prepare('SELECT surah AS sura, ayah AS aya, text_translation AS text FROM ayahs ORDER BY id')
  .all();
if (rows.length !== EXPECTED_AYAHS) throw new Error(`db has ${rows.length} ayahs`);
if (concatHash(rows) !== lock.artifacts['quran-uthmani'].concatSha256)
  throw new Error('POST-BUILD CHECK FAILED: db uthmani text does not match content.lock');
if (concatHash(tRows) !== lock.artifacts['en-pickthall'].concatSha256)
  throw new Error('POST-BUILD CHECK FAILED: db translation text does not match content.lock');
const firstAyah = db.prepare('SELECT text_uthmani FROM ayahs WHERE surah=1 AND ayah=1').get();
if (
  sha256(Buffer.from(firstAyah.text_uthmani, 'utf8')) !==
  lock.artifacts['quran-uthmani'].spotChecks['ayah-1:1']
)
  throw new Error('POST-BUILD CHECK FAILED: ayah 1:1 bytes differ from pinned spot-check');
db.close();

// Attribution manifest — rendered on the About screen.
const attribution = {
  generatedFrom: 'content-pipeline/sources.json',
  artifacts: sources.map((s) => ({
    id: s.id,
    kind: s.kind,
    attribution: s.attribution,
    license: s.license,
    url: s.url,
    sha256: lock.artifacts[s.id].sha256,
    pinnedAt: lock.artifacts[s.id].pinnedAt,
    ...(s.devOnly && { devOnly: true }),
  })),
};
writeFileSync(
  path.join(REPO_ROOT, 'assets', 'attribution.json'),
  JSON.stringify(attribution, null, 2) + '\n'
);

markPipelineRan();
const { size } = await import('node:fs').then((fs) => fs.statSync(dbPath));
console.log(
  `content:build OK — assets/db/quran.db (${(size / 1024 / 1024).toFixed(1)} MB, ${rows.length} ayahs), assets/attribution.json written.`
);
