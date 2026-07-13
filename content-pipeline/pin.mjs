// content:pin — record hashes for FIRST-TIME artifacts into content.lock.
// Refuses to change an existing entry: a changed hash is investigated, never
// re-pinned (CLAUDE.md rule 1). The lock must be committed in the same commit
// as the data files it pins.
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import {
  DATA_DIR,
  loadSources,
  loadLock,
  saveLock,
  sha256,
  parseTanzilTxt,
  markPipelineRan,
} from './lib.mjs';
import { validateTanzilStructure, spotHashes, concatHash } from './verify.mjs';

const sources = loadSources();
const lock = loadLock();
let pinned = 0;

for (const src of sources) {
  const p = path.join(DATA_DIR, src.file);
  if (!existsSync(p)) {
    console.error(`${src.id}: data file missing — run npm run content:fetch first`);
    process.exit(1);
  }
  const buf = readFileSync(p);
  const actual = sha256(buf);
  const existing = lock.artifacts[src.id];

  if (existing) {
    if (existing.sha256 !== actual) {
      console.error(
        `${src.id}: REFUSING to re-pin. Locked ${existing.sha256}, actual ${actual}.\n` +
          'A changed hash means the source bytes changed — investigate why. Never regenerate a checksum to make verification pass.'
      );
      process.exit(1);
    }
    continue; // already pinned, unchanged
  }

  // Validate BEFORE pinning — never lock in garbage.
  const entry = {
    file: src.file,
    sha256: actual,
    bytes: buf.length,
    url: src.url,
    license: src.license,
    pinnedAt: new Date().toISOString().slice(0, 10),
  };
  if (src.format === 'tanzil-txt') {
    const verses = validateTanzilStructure(buf, src.id, { arabic: src.kind === 'quran-text' });
    const { copyright } = parseTanzilTxt(buf);
    if (src.kind === 'quran-text' && !/tanzil/i.test(copyright))
      throw new Error(`${src.id}: Tanzil copyright block not found — it must be retained verbatim`);
    entry.spotChecks = spotHashes(verses);
    entry.concatSha256 = concatHash(verses);
  }
  lock.artifacts[src.id] = entry;
  pinned++;
  console.log(`pinned ${src.id}: ${actual}`);
}

if (pinned > 0) {
  saveLock(lock);
  markPipelineRan();
  console.log(
    `\ncontent.lock updated (${pinned} new). Commit it in the SAME commit as content-pipeline/data/, and log source+license+date in docs/DECISIONS.md.`
  );
} else {
  console.log('Nothing to pin — all artifacts already locked.');
}
