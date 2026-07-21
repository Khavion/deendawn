import { KVStore } from '../../lib/kvStore';

export interface AyahRef {
  surah: number;
  ayah: number;
}

const BOOKMARKS_KEY = 'quran.bookmarks.v1';
const LAST_READ_KEY = 'quran.lastRead.v1';
const SHOW_TRANSLATION_KEY = 'quran.showTranslation.v1';
const NIGHT_WARM_KEY = 'quran.nightWarm.v1';
const TAJWEED_KEY = 'quran.tajweed.v1';
const READING_SCALE_KEY = 'quran.readingScale.v1';

/** Allowed reader text-size multipliers (applied to both Arabic + translation). */
export const READING_SCALES = [0.85, 1, 1.15, 1.3, 1.5] as const;
export const DEFAULT_READING_SCALE = 1;

const isRef = (o: unknown): o is AyahRef =>
  typeof o === 'object' &&
  o !== null &&
  Number.isInteger((o as AyahRef).surah) &&
  Number.isInteger((o as AyahRef).ayah) &&
  (o as AyahRef).surah >= 1 &&
  (o as AyahRef).surah <= 114 &&
  (o as AyahRef).ayah >= 1;

export function loadBookmarks(store: KVStore): AyahRef[] {
  try {
    const parsed: unknown = JSON.parse(store.get(BOOKMARKS_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter(isRef) : [];
  } catch {
    return [];
  }
}

export function isBookmarked(store: KVStore, ref: AyahRef): boolean {
  return loadBookmarks(store).some((b) => b.surah === ref.surah && b.ayah === ref.ayah);
}

export function toggleBookmark(store: KVStore, ref: AyahRef): boolean {
  const list = loadBookmarks(store);
  const idx = list.findIndex((b) => b.surah === ref.surah && b.ayah === ref.ayah);
  if (idx >= 0) list.splice(idx, 1);
  else list.push(ref);
  store.set(BOOKMARKS_KEY, JSON.stringify(list));
  return idx < 0;
}

export function loadLastRead(store: KVStore): AyahRef | null {
  try {
    const parsed: unknown = JSON.parse(store.get(LAST_READ_KEY) ?? 'null');
    return isRef(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveLastRead(store: KVStore, ref: AyahRef): void {
  if (isRef(ref)) store.set(LAST_READ_KEY, JSON.stringify(ref));
}

/**
 * Record the reader's scroll position as last-read — but only while `tracking`
 * is on. Tracking stays OFF during a deep-link open until the scroll settles,
 * so the top-of-surah render doesn't clobber the position we deep-linked to
 * (continue-reading / bookmark / verse-of-the-day).
 */
export function recordReadingPosition(
  store: KVStore,
  first: AyahRef | undefined,
  tracking: boolean
): void {
  if (!tracking || !first) return;
  saveLastRead(store, { surah: first.surah, ayah: first.ayah });
}

export function loadShowTranslation(store: KVStore): boolean {
  return store.get(SHOW_TRANSLATION_KEY) !== 'false';
}

export function saveShowTranslation(store: KVStore, show: boolean): void {
  store.set(SHOW_TRANSLATION_KEY, String(show));
}

/** Opt-in amber night-reading palette for the reader (docs/DESIGN.md). */
export function loadNightWarm(store: KVStore): boolean {
  return store.get(NIGHT_WARM_KEY) === 'true';
}

export function saveNightWarm(store: KVStore, on: boolean): void {
  store.set(NIGHT_WARM_KEY, String(on));
}

/** Tajweed color-coding, off by default (gated — see tajweedFlag.ts). */
export function loadTajweed(store: KVStore): boolean {
  return store.get(TAJWEED_KEY) === 'true';
}

export function saveTajweed(store: KVStore, on: boolean): void {
  store.set(TAJWEED_KEY, String(on));
}

export function loadReadingScale(store: KVStore): number {
  const v = Number(store.get(READING_SCALE_KEY));
  return (READING_SCALES as readonly number[]).includes(v) ? v : DEFAULT_READING_SCALE;
}

export function saveReadingScale(store: KVStore, scale: number): void {
  if ((READING_SCALES as readonly number[]).includes(scale)) {
    store.set(READING_SCALE_KEY, String(scale));
  }
}

/** Move the reading scale one allowed step up (+1) or down (-1), clamped. */
export function stepReadingScale(current: number, dir: 1 | -1): number {
  const scales = READING_SCALES as readonly number[];
  const idx = scales.indexOf(current);
  const base = idx < 0 ? scales.indexOf(DEFAULT_READING_SCALE) : idx;
  const next = Math.min(scales.length - 1, Math.max(0, base + dir));
  return scales[next];
}
