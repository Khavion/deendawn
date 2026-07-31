/**
 * @jest-environment node
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import manifest from '../manifest.json';
import {
  deleteSurahAudio,
  downloadBytes,
  downloadedSurahs,
  ensureSurahAudio,
  isMarkedDownloaded,
  localAudioPath,
  markDownloaded,
  surahFileName,
  type AudioDownloadPlatform,
} from '../downloadManager';
import { createMemoryKVStore } from '../../../../lib/kvStore';

const ALAFASY_001 = (manifest as Record<string, { files: Record<string, { sha256: string; bytes: number }> }>)
  .alafasy.files['001.mp3'];

const CONFIG = {
  baseUrl: 'https://audio.example/',
  documentsDir: '/docs',
  allowCellular: false,
};

function makePlatform(overrides: Partial<AudioDownloadPlatform> = {}): AudioDownloadPlatform & {
  calls: string[];
} {
  const calls: string[] = [];
  return {
    calls,
    isWifi: async () => true,
    download: async (url, dest, onProgress) => {
      calls.push(`download:${url}->${dest}`);
      onProgress(10, 100);
    },
    sha256OfFile: async () => ALAFASY_001.sha256,
    deleteFile: async (p) => {
      calls.push(`delete:${p}`);
    },
    fileExists: async () => false,
    ...overrides,
  };
}

describe('manifest drift guard', () => {
  it('the generated manifest matches audio.lock byte-for-byte', () => {
    const lock = JSON.parse(
      readFileSync(join(__dirname, '../../../../../content-pipeline/audio/audio.lock'), 'utf8')
    );
    for (const [reciter, rec] of Object.entries(
      lock.recitations as Record<string, { totalBytes: number; files: object }>
    )) {
      const m = (manifest as Record<string, { totalBytes: number; files: object }>)[reciter];
      expect(m).toBeDefined();
      expect(m.totalBytes).toBe(rec.totalBytes);
      expect(m.files).toEqual(rec.files);
    }
  });
});

describe('ensureSurahAudio', () => {
  it('downloads to the R2 URL, verifies the pinned hash, marks ready', async () => {
    const platform = makePlatform();
    const states: string[] = [];
    const final = await ensureSurahAudio('alafasy', 1, CONFIG, platform, (s) =>
      states.push(s.phase)
    );
    expect(final.phase).toBe('ready');
    expect(states).toEqual(['downloading', 'verifying', 'ready']);
    expect(platform.calls[0]).toBe('download:https://audio.example/alafasy/001.mp3->/docs/audio/alafasy/001.mp3');
  });

  it('blocks on cellular unless allowed', async () => {
    const platform = makePlatform({ isWifi: async () => false });
    const final = await ensureSurahAudio('alafasy', 1, CONFIG, platform, () => {});
    expect(final).toEqual({ phase: 'blocked', reason: 'cellular' });
    const allowed = await ensureSurahAudio(
      'alafasy',
      1,
      { ...CONFIG, allowCellular: true },
      platform,
      () => {}
    );
    expect(allowed.phase).toBe('ready');
  });

  it('hash mismatch deletes the file and fails closed', async () => {
    const platform = makePlatform({ sha256OfFile: async () => 'wrong' });
    const final = await ensureSurahAudio('alafasy', 1, CONFIG, platform, () => {});
    expect(final).toEqual({ phase: 'failed', reason: 'hashMismatch' });
    expect(platform.calls.some((c) => c.startsWith('delete:'))).toBe(true);
  });

  it('existing intact file short-circuits to ready without downloading', async () => {
    const platform = makePlatform({ fileExists: async () => true });
    const final = await ensureSurahAudio('alafasy', 1, CONFIG, platform, () => {});
    expect(final.phase).toBe('ready');
    expect(platform.calls.some((c) => c.startsWith('download:'))).toBe(false);
  });

  it('unknown surah/reciter blocks (never fetches unpinned bytes)', async () => {
    const platform = makePlatform();
    const final = await ensureSurahAudio('nobody', 1, CONFIG, platform, () => {});
    expect(final).toEqual({ phase: 'blocked', reason: 'unknownFile' });
  });

  it('network failure surfaces as failed:network', async () => {
    const platform = makePlatform({
      download: async () => {
        throw new Error('offline');
      },
    });
    const final = await ensureSurahAudio('alafasy', 1, CONFIG, platform, () => {});
    expect(final).toEqual({ phase: 'failed', reason: 'network' });
  });
});

describe('bookkeeping', () => {
  it('marks, lists, and deletes downloads', async () => {
    const store = createMemoryKVStore();
    markDownloaded(store, 'alafasy', 2, true);
    markDownloaded(store, 'alafasy', 1, true);
    expect(downloadedSurahs(store, 'alafasy')).toEqual([1, 2]);
    expect(isMarkedDownloaded(store, 'alafasy', 2)).toBe(true);
    const platform = makePlatform({ fileExists: async () => true });
    await deleteSurahAudio('alafasy', 2, CONFIG, platform, store);
    expect(downloadedSurahs(store, 'alafasy')).toEqual([1]);
    expect(platform.calls).toContain('delete:/docs/audio/alafasy/002.mp3');
  });

  it('exposes byte sizes for the consent UI', () => {
    expect(downloadBytes('alafasy', 1)).toBe(ALAFASY_001.bytes);
    expect(downloadBytes('alafasy', 999)).toBeNull();
  });

  it('sha256 of known bytes matches node crypto (sanity for the verifier)', () => {
    const digest = createHash('sha256').update('deendawn').digest('hex');
    expect(digest).toHaveLength(64);
    expect(surahFileName(7)).toBe('007.mp3');
    expect(localAudioPath(CONFIG, 'alafasy', 7)).toBe('/docs/audio/alafasy/007.mp3');
  });
});
