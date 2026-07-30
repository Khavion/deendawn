// audio:verify — structural + integrity verification of audio/data/.
// First run for a recitation RECORDS the per-file SHA-256 set into
// audio.lock (commit it in the same change, like content.lock). Later runs
// COMPARE: any byte drift fails the build. Never regenerate hashes to make
// a failure pass — investigate why the bytes changed (CLAUDE.md rule 1).
// usage: node content-pipeline/audio/verify.mjs [recitationId]
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import {
  loadLock,
  loadRecitations,
  looksLikeMp3,
  saveLock,
  sha256,
  surahPath,
} from './lib.mjs';

const MIN_BYTES = 50_000; // even 108/al-Kawthar at 128 kbps is > 200 KB

const only = process.argv[2];
const recitations = loadRecitations().filter((r) => !only || r.id === only);
const lock = loadLock();
let failed = false;

for (const rec of recitations) {
  const existing = lock.recitations[rec.id];
  const files = {};
  let total = 0;
  for (let n = 1; n <= rec.surahCount; n++) {
    const file = surahPath(rec.id, n);
    const name = path.basename(file);
    if (!existsSync(file)) {
      console.error(`MISSING ${rec.id}/${name}`);
      failed = true;
      continue;
    }
    const buf = readFileSync(file);
    if (buf.length < MIN_BYTES) {
      console.error(`TOO SMALL ${rec.id}/${name}: ${buf.length} bytes`);
      failed = true;
    }
    if (!looksLikeMp3(buf)) {
      console.error(`NOT MP3 ${rec.id}/${name}`);
      failed = true;
    }
    const hash = sha256(buf);
    if (existing?.files?.[name] && existing.files[name].sha256 !== hash) {
      console.error(
        `HASH MISMATCH ${rec.id}/${name}: lock ${existing.files[name].sha256.slice(0, 12)}… got ${hash.slice(0, 12)}…`
      );
      failed = true;
    }
    files[name] = { sha256: hash, bytes: buf.length };
    total += buf.length;
  }
  if (failed) continue;

  if (!existing) {
    lock.recitations[rec.id] = {
      edition: rec.edition,
      urlPattern: rec.urlPattern,
      license: rec.license,
      licenseUrl: rec.licenseUrl,
      pinnedAt: new Date().toISOString().slice(0, 10),
      totalBytes: total,
      files,
    };
    saveLock(lock);
    console.log(`${rec.id}: RECORDED ${rec.surahCount} hashes into audio.lock (commit it)`);
  } else {
    const lockedCount = Object.keys(existing.files).length;
    if (lockedCount !== rec.surahCount) {
      console.error(`${rec.id}: lock has ${lockedCount} files, expected ${rec.surahCount}`);
      failed = true;
    } else {
      console.log(`${rec.id}: VERIFIED ${rec.surahCount} files against audio.lock`);
    }
  }
  console.log(`${rec.id}: total ${(total / 1e9).toFixed(2)} GB`);
}

process.exit(failed ? 1 : 0);
