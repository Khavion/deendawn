// content:verify — SHA-256 every artifact against content.lock plus deep
// structural validation. A failure here is NEVER worked around by
// regenerating checksums; investigate why the bytes changed (CLAUDE.md rule 1).
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import {
  DATA_DIR,
  loadSources,
  loadLock,
  sha256,
  parseTanzilTxt,
  parseQuranDataXml,
  markPipelineRan,
  EXPECTED_SURAHS,
  EXPECTED_AYAHS,
} from './lib.mjs';

const failures = [];
const fail = (msg) => failures.push(msg);

function assertUtf8(buf, id) {
  try {
    new TextDecoder('utf-8', { fatal: true }).decode(buf);
  } catch {
    fail(`${id}: not valid UTF-8`);
  }
  if (buf.toString('utf8').includes('�'))
    fail(`${id}: contains U+FFFD replacement chars (mojibake)`);
}

/** Structural checks shared by verify and pin. Returns parsed verses. */
export function validateTanzilStructure(buf, id, { arabic }) {
  assertUtf8(buf, id);
  const { verses } = parseTanzilTxt(buf);
  const suras = new Set(verses.map((v) => v.sura));
  if (suras.size !== EXPECTED_SURAHS)
    fail(`${id}: ${suras.size} surahs, expected ${EXPECTED_SURAHS}`);
  if (verses.length !== EXPECTED_AYAHS)
    fail(`${id}: ${verses.length} ayahs, expected ${EXPECTED_AYAHS}`);
  const empty = verses.filter((v) => v.text.trim() === '');
  if (empty.length > 0)
    fail(`${id}: ${empty.length} empty ayahs (first: ${empty[0].sura}:${empty[0].aya})`);
  const arabicRe = /[؀-ۿ]/;
  if (arabic) {
    const nonArabic = verses.filter((v) => !arabicRe.test(v.text));
    if (nonArabic.length > 0)
      fail(
        `${id}: ${nonArabic.length} ayahs contain no Arabic script (first: ${nonArabic[0].sura}:${nonArabic[0].aya})`
      );
  }
  // Ayah numbering must be exactly 1..n per surah, in mushaf order.
  let prevSura = 0;
  let prevAya = 0;
  for (const v of verses) {
    if (v.sura === prevSura + 1 && v.aya === 1) {
      prevSura = v.sura;
      prevAya = 1;
    } else if (v.sura === prevSura && v.aya === prevAya + 1) {
      prevAya = v.aya;
    } else {
      fail(`${id}: numbering break at ${v.sura}:${v.aya} (after ${prevSura}:${prevAya})`);
      break;
    }
  }
  return verses;
}

export function spotHashes(verses) {
  const first = verses.find((v) => v.sura === 1 && v.aya === 1);
  const last = verses.find((v) => v.sura === 114 && v.aya === 6);
  return {
    'ayah-1:1': first ? sha256(Buffer.from(first.text, 'utf8')) : 'MISSING',
    'ayah-114:6': last ? sha256(Buffer.from(last.text, 'utf8')) : 'MISSING',
  };
}

export function concatHash(verses) {
  return sha256(Buffer.from(verses.map((v) => `${v.sura}|${v.aya}|${v.text}`).join('\n'), 'utf8'));
}

export function runVerify() {
  const sources = loadSources();
  const lock = loadLock();

  for (const src of sources) {
    const p = path.join(DATA_DIR, src.file);
    if (!existsSync(p)) {
      fail(`${src.id}: data file missing — run npm run content:fetch`);
      continue;
    }
    const buf = readFileSync(p);
    const entry = lock.artifacts[src.id];
    if (!entry) {
      fail(
        `${src.id}: no content.lock entry — first-time artifact, run npm run content:pin and commit the lock in the same commit`
      );
      continue;
    }
    const actual = sha256(buf);
    if (actual !== entry.sha256) {
      fail(
        `${src.id}: SHA-256 MISMATCH\n  locked : ${entry.sha256}\n  actual : ${actual}\n  Investigate why the bytes changed. NEVER re-pin to silence this.`
      );
      continue;
    }

    if (src.format === 'tanzil-txt') {
      const verses = validateTanzilStructure(buf, src.id, { arabic: src.kind === 'quran-text' });
      const spots = spotHashes(verses);
      for (const [k, v] of Object.entries(entry.spotChecks || {})) {
        if (spots[k] !== v)
          fail(`${src.id}: spot-check ${k} mismatch (locked ${v}, actual ${spots[k]})`);
      }
      if (entry.concatSha256 && concatHash(verses) !== entry.concatSha256)
        fail(`${src.id}: parsed-verse concat hash mismatch`);
    } else if (src.format === 'tanzil-xml') {
      assertUtf8(buf, src.id);
      try {
        parseQuranDataXml(buf);
      } catch (e) {
        fail(`${src.id}: ${e.message}`);
      }
    }
  }
  return failures;
}

const isMain = process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]));
if (isMain) {
  const errs = runVerify();
  if (errs.length > 0) {
    console.error('CONTENT VERIFICATION FAILED:\n');
    for (const e of errs) console.error(' - ' + e);
    process.exit(1);
  }
  markPipelineRan();
  console.log(
    'content:verify OK — all artifacts match content.lock and pass structural validation.'
  );
}
