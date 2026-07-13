import type { KVStore } from '@/src/lib/kvStore';

/**
 * Per-surah resume positions (seconds), keyed by reciter so switching the
 * shipped reciter later never resumes into the wrong recording.
 */
const key = (reciterId: string, surah: number) => `audio.resume.v1.${reciterId}.${surah}`;

export function getResumePosition(store: KVStore, reciterId: string, surah: number): number {
  const raw = store.get(key(reciterId, surah));
  if (raw === null) return 0;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function saveResumePosition(
  store: KVStore,
  reciterId: string,
  surah: number,
  seconds: number
): void {
  if (!Number.isFinite(seconds) || seconds <= 0) return;
  store.set(key(reciterId, surah), String(Math.round(seconds * 10) / 10));
}

export function clearResumePosition(store: KVStore, reciterId: string, surah: number): void {
  store.delete(key(reciterId, surah));
}
