#!/usr/bin/env node
/**
 * Emits the app-side audio download manifest from audio.lock (per-surah
 * SHA-256 + bytes). The app can never import content-pipeline directly, so
 * this generated copy ships in src/ — a jest drift-guard asserts it matches
 * the lock byte-for-byte, keeping the checksum discipline intact.
 * usage: node content-pipeline/audio/emit-manifest.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const lock = JSON.parse(readFileSync(join(here, 'audio.lock'), 'utf8'));
const out = {};
for (const [reciterId, rec] of Object.entries(lock.recitations)) {
  out[reciterId] = { totalBytes: rec.totalBytes, files: rec.files };
}
const dest = join(here, '../../src/features/audio/downloads/manifest.json');
writeFileSync(dest, JSON.stringify(out, null, 2) + '\n');
console.log(`manifest written: ${Object.keys(out).join(', ')}`);
