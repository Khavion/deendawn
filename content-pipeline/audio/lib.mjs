// Shared helpers for the AUDIO pipeline. These scripts are the only
// sanctioned writers of content-pipeline/audio/data/* and audio.lock —
// same discipline as the text pipeline (CLAUDE.md rule 1), applied to
// recitation recordings: bytes stay verbatim from the pinned source.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const AUDIO_DIR = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.dirname(path.dirname(AUDIO_DIR));
export const DATA_DIR = path.join(AUDIO_DIR, 'data');
export const LOCK_PATH = path.join(AUDIO_DIR, 'audio.lock');

export function sha256(buf) {
  return createHash('sha256').update(buf).digest('hex');
}

export function loadRecitations() {
  return JSON.parse(readFileSync(path.join(AUDIO_DIR, 'sources.json'), 'utf8')).recitations;
}

export function loadLock() {
  if (!existsSync(LOCK_PATH)) return { version: 1, recitations: {} };
  return JSON.parse(readFileSync(LOCK_PATH, 'utf8'));
}

export function saveLock(lock) {
  writeFileSync(LOCK_PATH, JSON.stringify(lock, null, 2) + '\n');
}

/** Local path for one surah file: data/<id>/NNN.mp3 (app URL scheme). */
export function surahPath(recitationId, n) {
  return path.join(DATA_DIR, recitationId, `${String(n).padStart(3, '0')}.mp3`);
}

export function sourceUrl(rec, n) {
  return rec.urlPattern.replace('{n}', String(n));
}

export function ensureDir(p) {
  mkdirSync(p, { recursive: true });
}

/** MP3 sanity: ID3v2 header or an MPEG frame-sync in the first bytes. */
export function looksLikeMp3(buf) {
  if (buf.length < 4) return false;
  if (buf[0] === 0x49 && buf[1] === 0x44 && buf[2] === 0x33) return true; // "ID3"
  return buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0; // frame sync
}
