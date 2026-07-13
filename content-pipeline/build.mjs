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

// Extract pinned font archives (bytes verified above) into assets/fonts.
const { execFileSync } = await import('node:child_process');
for (const src of sources) {
  if (src.format !== 'zip' || !src.extract) continue;
  const zipPath = path.join(DATA_DIR, src.file);
  for (const { from, to } of src.extract) {
    const dest = path.join(REPO_ROOT, to);
    mkdirSync(path.dirname(dest), { recursive: true });
    const bytes = execFileSync('unzip', ['-p', zipPath, from], { maxBuffer: 64 * 1024 * 1024 });
    writeFileSync(dest, bytes);
    console.log(`extracted ${from} -> ${to} (${bytes.length} bytes)`);
  }
}

// library.db — public-domain scholar texts (E10), sections + FTS.
const libSources = sources.filter((s) => s.format === 'gutenberg-txt');
if (libSources.length > 0) {
  const libPath = path.join(REPO_ROOT, 'assets', 'db', 'library.db');
  rmSync(libPath, { force: true });
  const lib = new Database(libPath);
  lib.pragma('journal_mode = OFF');
  lib.exec(`
    CREATE TABLE meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    CREATE TABLE works (
      id INTEGER PRIMARY KEY,
      artifact_id TEXT NOT NULL UNIQUE,
      author_key TEXT NOT NULL,
      title TEXT NOT NULL,
      translator TEXT NOT NULL,
      year INTEGER NOT NULL,
      license TEXT NOT NULL,
      source_url TEXT NOT NULL
    );
    CREATE TABLE sections (
      id INTEGER PRIMARY KEY,
      work_id INTEGER NOT NULL REFERENCES works(id),
      section_index INTEGER NOT NULL,
      body TEXT NOT NULL,
      UNIQUE(work_id, section_index)
    );
    CREATE VIRTUAL TABLE sections_fts USING fts5(body, tokenize = 'unicode61 remove_diacritics 2');
  `);
  const insWork = lib.prepare(
    'INSERT INTO works (artifact_id, author_key, title, translator, year, license, source_url) VALUES (?,?,?,?,?,?,?)'
  );
  const insSection = lib.prepare(
    'INSERT INTO sections (work_id, section_index, body) VALUES (?,?,?)'
  );
  const insFts = lib.prepare('INSERT INTO sections_fts (rowid, body) VALUES (?,?)');
  const insLibMeta = lib.prepare('INSERT INTO meta VALUES (?,?)');
  let sectionRowId = 0;
  lib.transaction(() => {
    for (const src of libSources) {
      const text = readFileSync(path.join(DATA_DIR, src.file), 'utf8');
      const start = text.search(/\*\*\* START OF[^\n]*\n/);
      const end = text.search(/\*\*\* END OF/);
      const body = text.slice(text.indexOf('\n', start) + 1, end).replace(/\r/g, '');
      // Paragraphs -> retrieval sections of up to ~1200 chars.
      let paragraphs = body
        .split(/\n\s*\n/)
        .map((p) => p.replace(/\s+/g, ' ').trim())
        .filter((p) => p.length >= 40)
        // Non-authorial boilerplate: production notes, imprints, TOC lines.
        .filter(
          (p) =>
            !/^(produced by|e-text prepared|edited by|printed by|translated for the first time|london john murray|transcriber|\[illustration)/i.test(
              p
            ) && !(p.length <= 140 && /\s\d{1,3}$/.test(p))
        );
      // Reading view starts at the first substantial prose paragraph.
      const firstProse = paragraphs.findIndex((p) => p.length >= 400);
      if (firstProse > 0) paragraphs = paragraphs.slice(firstProse);
      const sections = [];
      let current = '';
      for (const p of paragraphs) {
        if (current && current.length + p.length > 1200) {
          sections.push(current);
          current = p;
        } else {
          current = current ? current + '\n\n' + p : p;
        }
      }
      if (current) sections.push(current);
      if (sections.length < 10)
        throw new Error(`${src.id}: implausibly few sections (${sections.length})`);
      const workId = insWork.run(
        src.id,
        src.library.authorKey,
        src.library.title,
        src.library.translator,
        src.library.year,
        src.license,
        src.url
      ).lastInsertRowid;
      sections.forEach((s, i) => {
        sectionRowId++;
        insSection.run(workId, i + 1, s);
        insFts.run(sectionRowId, s.toLowerCase());
      });
    }
    for (const src of libSources) insLibMeta.run(`sha256:${src.id}`, lock.artifacts[src.id].sha256);
  })();
  lib.exec('VACUUM;');
  const workCount = lib.prepare('SELECT COUNT(*) n FROM works').get().n;
  const sectionCount = lib.prepare('SELECT COUNT(*) n FROM sections').get().n;
  lib.close();
  console.log(`library.db: ${workCount} works, ${sectionCount} sections`);
}

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
