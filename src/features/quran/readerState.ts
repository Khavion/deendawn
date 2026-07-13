import { KVStore } from '../../lib/kvStore';

export interface AyahRef {
  surah: number;
  ayah: number;
}

const BOOKMARKS_KEY = 'quran.bookmarks.v1';
const LAST_READ_KEY = 'quran.lastRead.v1';
const SHOW_TRANSLATION_KEY = 'quran.showTranslation.v1';

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

export function loadShowTranslation(store: KVStore): boolean {
  return store.get(SHOW_TRANSLATION_KEY) !== 'false';
}

export function saveShowTranslation(store: KVStore, show: boolean): void {
  store.set(SHOW_TRANSLATION_KEY, String(show));
}
