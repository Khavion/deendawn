// audio:upload — push verified recitation files to the R2 bucket.
// Credentials come from .env at RUNTIME (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID,
// R2_SECRET_ACCESS_KEY, R2_BUCKET) — they are never printed, never
// committed, and the agent never reads .env directly (CLAUDE.md rule 4).
// Uploads only files whose hashes are recorded in audio.lock; refuses to
// run when verification has not been done. Existing objects with a
// matching size are skipped, so re-runs are cheap and resumable.
// Bucket layout matches the app: {bucket}/{recitationId}/NNN.mp3
// usage: node content-pipeline/audio/upload.mjs [recitationId]
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

import { HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

import { REPO_ROOT, loadLock, loadRecitations, sha256, surahPath } from './lib.mjs';

// Minimal .env parser — avoids adding dotenv; values stay in process memory.
function loadEnv() {
  const file = path.join(REPO_ROOT, '.env');
  if (!existsSync(file)) return {};
  const out = {};
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (m && !m[1].startsWith('#')) out[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return out;
}

const env = { ...loadEnv(), ...process.env };
const missing = ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET'].filter(
  (k) => !env[k]
);
if (missing.length) {
  console.error(`R2 credentials missing from .env: ${missing.join(', ')}`);
  console.error('See docs/BLOCKERS.md — "Turn on the audio bucket (Cloudflare R2)".');
  process.exit(1);
}

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: env.R2_ACCESS_KEY_ID, secretAccessKey: env.R2_SECRET_ACCESS_KEY },
});

const only = process.argv[2];
const lock = loadLock();
const recitations = loadRecitations().filter((r) => !only || r.id === only);

for (const rec of recitations) {
  const entry = lock.recitations[rec.id];
  if (!entry) {
    console.error(`${rec.id}: not in audio.lock — run audio:fetch + audio:verify first`);
    process.exit(1);
  }
  let uploaded = 0;
  let skipped = 0;
  for (const [name, meta] of Object.entries(entry.files)) {
    const key = `${rec.id}/${name}`;
    try {
      const head = await s3.send(new HeadObjectCommand({ Bucket: env.R2_BUCKET, Key: key }));
      if (head.ContentLength === meta.bytes) {
        skipped++;
        continue;
      }
    } catch {
      // not there yet — upload below
    }
    const buf = readFileSync(surahPath(rec.id, Number(name.slice(0, 3))));
    if (sha256(buf) !== meta.sha256) {
      console.error(`${key}: local bytes no longer match audio.lock — re-verify before uploading`);
      process.exit(1);
    }
    await s3.send(
      new PutObjectCommand({
        Bucket: env.R2_BUCKET,
        Key: key,
        Body: buf,
        ContentType: 'audio/mpeg',
        CacheControl: 'public, max-age=31536000, immutable',
      })
    );
    uploaded++;
    if (uploaded % 10 === 0) console.log(`${rec.id}: ${uploaded} uploaded…`);
  }
  console.log(`${rec.id}: upload done — ${uploaded} uploaded, ${skipped} already in bucket`);
}
