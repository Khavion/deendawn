import manifest from './manifest.json';
import type { KVStore } from '../../../lib/kvStore';

/**
 * Offline recitation downloads (owner decision 2026-07-31: streaming stays,
 * downloads added; audio remains the only network surface). Mirrors the
 * proven Tier-B pattern: a pure state machine with every platform effect
 * injected, R2-only URLs, Wi-Fi-only by default, SHA-256 verified against
 * the pinned audio.lock hashes (via the generated manifest + drift guard)
 * before a file is ever marked ready, deletable.
 */
export type AudioDownloadState =
  | { phase: 'idle' }
  | { phase: 'blocked'; reason: 'cellular' | 'unknownFile' }
  | { phase: 'downloading'; receivedBytes: number; totalBytes: number }
  | { phase: 'verifying' }
  | { phase: 'ready'; localPath: string }
  | { phase: 'failed'; reason: 'network' | 'hashMismatch' };

export interface AudioDownloadPlatform {
  isWifi(): Promise<boolean>;
  download(
    url: string,
    destination: string,
    onProgress: (received: number, total: number) => void
  ): Promise<void>;
  sha256OfFile(path: string): Promise<string>;
  deleteFile(path: string): Promise<void>;
  fileExists(path: string): Promise<boolean>;
}

export interface AudioDownloadConfig {
  /** Our bucket only — never a third-party host (rule 2). */
  baseUrl: string;
  /** Documents dir (not Caches — "plays offline after" must survive). */
  documentsDir: string;
  allowCellular: boolean;
}

type ManifestShape = Record<string, { totalBytes: number; files: Record<string, { sha256: string; bytes: number }> }>;
const MANIFEST = manifest as ManifestShape;

export function surahFileName(surah: number, fileExt = 'mp3'): string {
  return `${String(surah).padStart(3, '0')}.${fileExt}`;
}

export function manifestEntry(reciterId: string, surah: number, fileExt = 'mp3') {
  return MANIFEST[reciterId]?.files[surahFileName(surah, fileExt)] ?? null;
}

export function localAudioPath(
  config: Pick<AudioDownloadConfig, 'documentsDir'>,
  reciterId: string,
  surah: number,
  fileExt = 'mp3'
): string {
  return `${config.documentsDir}/audio/${reciterId}/${surahFileName(surah, fileExt)}`;
}

/** Download bytes for the consent UI ("surah 2 is 121 MB"). */
export function downloadBytes(reciterId: string, surah: number): number | null {
  return manifestEntry(reciterId, surah)?.bytes ?? null;
}

export async function ensureSurahAudio(
  reciterId: string,
  surah: number,
  config: AudioDownloadConfig,
  platform: AudioDownloadPlatform,
  onState: (s: AudioDownloadState) => void
): Promise<AudioDownloadState> {
  const emit = (s: AudioDownloadState) => {
    onState(s);
    return s;
  };

  const entry = manifestEntry(reciterId, surah);
  if (!entry) return emit({ phase: 'blocked', reason: 'unknownFile' });

  const localPath = localAudioPath(config, reciterId, surah);

  // Already present and intact?
  if (await platform.fileExists(localPath)) {
    emit({ phase: 'verifying' });
    if ((await platform.sha256OfFile(localPath)) === entry.sha256) {
      return emit({ phase: 'ready', localPath });
    }
    await platform.deleteFile(localPath); // corrupt/stale — refetch
  }

  if (!config.allowCellular && !(await platform.isWifi())) {
    return emit({ phase: 'blocked', reason: 'cellular' });
  }

  const base = config.baseUrl.replace(/\/+$/, '');
  const url = `${base}/${encodeURIComponent(reciterId)}/${surahFileName(surah)}`;
  try {
    await platform.download(url, localPath, (received, total) =>
      emit({ phase: 'downloading', receivedBytes: received, totalBytes: total || entry.bytes })
    );
  } catch {
    return emit({ phase: 'failed', reason: 'network' });
  }

  emit({ phase: 'verifying' });
  const digest = await platform.sha256OfFile(localPath);
  if (digest !== entry.sha256) {
    await platform.deleteFile(localPath);
    return emit({ phase: 'failed', reason: 'hashMismatch' });
  }
  return emit({ phase: 'ready', localPath });
}

export async function deleteSurahAudio(
  reciterId: string,
  surah: number,
  config: Pick<AudioDownloadConfig, 'documentsDir'>,
  platform: Pick<AudioDownloadPlatform, 'deleteFile' | 'fileExists'>,
  store: KVStore
): Promise<void> {
  const path = localAudioPath(config, reciterId, surah);
  if (await platform.fileExists(path)) await platform.deleteFile(path);
  markDownloaded(store, reciterId, surah, false);
}

// --- Persistence of which surahs are kept offline -------------------------

const KEY = 'audio.downloads.v1';

type DownloadedMap = Record<string, number[]>;

function loadMap(store: KVStore): DownloadedMap {
  try {
    const raw: unknown = JSON.parse(store.get(KEY) ?? '{}');
    return typeof raw === 'object' && raw !== null ? (raw as DownloadedMap) : {};
  } catch {
    return {};
  }
}

export function markDownloaded(
  store: KVStore,
  reciterId: string,
  surah: number,
  downloaded: boolean
): void {
  const map = loadMap(store);
  const set = new Set(map[reciterId] ?? []);
  if (downloaded) set.add(surah);
  else set.delete(surah);
  map[reciterId] = [...set].sort((a, b) => a - b);
  store.set(KEY, JSON.stringify(map));
}

export function downloadedSurahs(store: KVStore, reciterId: string): number[] {
  return loadMap(store)[reciterId] ?? [];
}

export function isMarkedDownloaded(store: KVStore, reciterId: string, surah: number): boolean {
  return downloadedSurahs(store, reciterId).includes(surah);
}
