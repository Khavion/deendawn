import { Directory, File, Paths } from 'expo-file-system';
import { createDownloadResumable } from 'expo-file-system/legacy';
import { sha256 } from 'js-sha256';

import type { AudioDownloadConfig, AudioDownloadPlatform } from './downloadManager';

/**
 * The real platform behind the audio download state machine: resumable
 * downloads via the legacy API (progress + resume across launches), and
 * chunked SHA-256 via the File readable stream + js-sha256 (pure JS — a
 * 120 MB surah never lands in memory at once, and the JS thread yields
 * between chunks).
 */
export function audioDownloadConfig(baseUrl: string, allowCellular: boolean): AudioDownloadConfig {
  return {
    baseUrl,
    documentsDir: Paths.document.uri.replace(/\/+$/, ''),
    allowCellular,
  };
}

export const expoAudioDownloadPlatform: AudioDownloadPlatform = {
  async isWifi() {
    // No network-info dependency: the Wi-Fi gate is enforced as a consent
    // dialog showing the size instead (privacy: no reachability probing).
    // Callers pass allowCellular=true only after that consent.
    return true;
  },

  async download(url, destination, onProgress) {
    const dir = new Directory(destination.slice(0, destination.lastIndexOf('/')));
    if (!dir.exists) dir.create({ intermediates: true });
    const partPath = `${destination}.part`;
    const resumable = createDownloadResumable(url, partPath, {}, (p) =>
      onProgress(p.totalBytesWritten, p.totalBytesExpectedToWrite)
    );
    const result = await resumable.downloadAsync();
    if (!result || (result.status !== 200 && result.status !== 206)) {
      throw new Error(`download failed: ${result?.status ?? 'no result'}`);
    }
    const part = new File(partPath);
    const dest = new File(destination);
    if (dest.exists) dest.delete();
    part.move(dest);
  },

  async sha256OfFile(path) {
    const file = new File(path);
    const stream = file.readableStream();
    const reader = stream.getReader();
    const hash = sha256.create();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) hash.update(value);
      // Yield so a 120 MB verify can't starve the JS thread.
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    return hash.hex();
  },

  async deleteFile(path) {
    const file = new File(path);
    if (file.exists) file.delete();
  },

  async fileExists(path) {
    return new File(path).exists;
  },
};
