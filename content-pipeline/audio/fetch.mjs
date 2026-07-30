// audio:fetch — download the pinned recitation sets into audio/data/.
// Resumable: files already present AND matching the lock (when a lock entry
// exists) are skipped; partial/corrupt files are re-downloaded. Bytes are
// written verbatim — no transcoding, no retagging (NO-AI ZONE discipline +
// the source terms license the published bitrates as-is).
// usage: node content-pipeline/audio/fetch.mjs [recitationId]
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import {
  ensureDir,
  loadLock,
  loadRecitations,
  looksLikeMp3,
  sha256,
  sourceUrl,
  surahPath,
} from './lib.mjs';

const only = process.argv[2];
const recitations = loadRecitations().filter((r) => !only || r.id === only);
if (recitations.length === 0) {
  console.error(`no recitation matches "${only}"`);
  process.exit(1);
}
const lock = loadLock();

async function fetchWithRetry(url, tries = 3) {
  for (let attempt = 1; attempt <= tries; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'user-agent': 'DeenDawn-content-pipeline' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return Buffer.from(await res.arrayBuffer());
    } catch (e) {
      if (attempt === tries) throw e;
      await new Promise((r) => setTimeout(r, 2000 * attempt));
    }
  }
}

for (const rec of recitations) {
  ensureDir(path.dirname(surahPath(rec.id, 1)));
  const locked = lock.recitations[rec.id]?.files ?? {};
  let downloaded = 0;
  let skipped = 0;
  let bytes = 0;
  for (let n = 1; n <= rec.surahCount; n++) {
    const file = surahPath(rec.id, n);
    const name = path.basename(file);
    if (existsSync(file)) {
      const buf = readFileSync(file);
      const entry = locked[name];
      const intact = looksLikeMp3(buf) && (!entry || sha256(buf) === entry.sha256);
      if (intact) {
        skipped++;
        continue;
      }
      console.log(`re-downloading ${rec.id}/${name} (corrupt or lock mismatch)`);
    }
    const buf = await fetchWithRetry(sourceUrl(rec, n));
    if (!looksLikeMp3(buf)) throw new Error(`${rec.id}/${name}: response is not an MP3`);
    writeFileSync(file, buf);
    downloaded++;
    bytes += buf.length;
    if (downloaded % 10 === 0 || n === rec.surahCount) {
      console.log(`${rec.id}: ${n}/${rec.surahCount} (${(bytes / 1e6).toFixed(0)} MB new)`);
    }
  }
  console.log(
    `${rec.id}: done — ${downloaded} downloaded, ${skipped} already present. Run audio:verify next.`
  );
}
