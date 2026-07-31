import { isMarkedDownloaded, localAudioPath } from './downloadManager';
import type { AudioSource } from '../config';
import { surahAudioUrl } from '../urls';
import type { KVStore } from '../../../lib/kvStore';

/**
 * Local-first source resolution: a surah marked kept-offline (and therefore
 * hash-verified at download time) plays from its file URI; everything else
 * streams from the bucket. Dev placeholder tones are never cached offline.
 */
export function resolvePlayableUri(
  source: AudioSource,
  surah: number,
  store: KVStore,
  documentsDir: string
): { uri: string; offline: boolean } {
  if (!source.placeholder && isMarkedDownloaded(store, source.reciterId, surah)) {
    const path = localAudioPath({ documentsDir }, source.reciterId, surah, source.fileExt);
    return { uri: path.startsWith('file://') ? path : `file://${path}`, offline: true };
  }
  return {
    uri: surahAudioUrl(source.baseUrl, source.reciterId, surah, source.fileExt),
    offline: false,
  };
}
