import type { DownloadState } from '../downloadManager';
import {
  aggregateDownloadState,
  formatBytes,
  initialControllerState,
  selectArtifacts,
  totalBytes,
} from '../tierbController';

describe('selectArtifacts', () => {
  it('rich devices get the 1.7B model + both embedding files', () => {
    const ids = selectArtifacts('rich').map((a) => a.id);
    expect(ids).toEqual(['qwen3-1.7b-q4', 'minilm-embeddings', 'ayah-embeddings']);
  });

  it('floor devices get the smaller 0.6B model', () => {
    const ids = selectArtifacts('floor').map((a) => a.id);
    expect(ids).toContain('qwen3-0.6b-q4');
    expect(ids).not.toContain('qwen3-1.7b-q4');
  });
});

describe('formatBytes', () => {
  it('shows GB with one decimal at/above 1GB, MB below', () => {
    expect(formatBytes(1_135_000_000)).toBe('1.1 GB');
    expect(formatBytes(485_000_000)).toBe('485 MB');
    expect(formatBytes(25_000_000)).toBe('25 MB');
  });

  it('rich total is ~1.1GB, floor total under 500MB', () => {
    expect(formatBytes(totalBytes(selectArtifacts('rich')))).toBe('1.1 GB');
    expect(totalBytes(selectArtifacts('floor'))).toBeLessThan(500_000_000);
  });
});

describe('aggregateDownloadState', () => {
  it('a block outranks everything', () => {
    const states: DownloadState[] = [
      { phase: 'ready', localPath: '/a' },
      { phase: 'blocked', reason: 'pendingUpload' },
      { phase: 'downloading', receivedBytes: 1, totalBytes: 2 },
    ];
    expect(aggregateDownloadState(states)).toEqual({ phase: 'blocked', reason: 'pendingUpload' });
  });

  it('a failure outranks progress', () => {
    const states: DownloadState[] = [
      { phase: 'downloading', receivedBytes: 1, totalBytes: 2 },
      { phase: 'failed', reason: 'hashMismatch' },
    ];
    expect(aggregateDownloadState(states)).toEqual({ phase: 'failed', reason: 'hashMismatch' });
  });

  it('sums progress across concurrent downloads', () => {
    const states: DownloadState[] = [
      { phase: 'downloading', receivedBytes: 100, totalBytes: 400 },
      { phase: 'downloading', receivedBytes: 50, totalBytes: 100 },
      { phase: 'ready', localPath: '/c' },
    ];
    expect(aggregateDownloadState(states)).toEqual({
      phase: 'downloading',
      receivedBytes: 150,
      totalBytes: 500,
    });
  });

  it('ready only when every artifact is ready', () => {
    expect(
      aggregateDownloadState([
        { phase: 'ready', localPath: '/a' },
        { phase: 'ready', localPath: '/b' },
      ]).phase
    ).toBe('ready');
    expect(
      aggregateDownloadState([{ phase: 'ready', localPath: '/a' }, { phase: 'idle' }]).phase
    ).toBe('idle');
    expect(aggregateDownloadState([]).phase).toBe('idle');
  });
});

describe('initialControllerState', () => {
  it('ineligible device blocks regardless of artifacts', () => {
    expect(initialControllerState(selectArtifacts('rich'), false)).toEqual({
      phase: 'blocked',
      reason: 'ineligibleDevice',
    });
  });

  it('pinned-but-unpublished artifacts block as pendingUpload (ships inert today)', () => {
    // MODEL_LOCK is all PENDING-UPLOAD until BLOCKERS A — must never read idle.
    expect(initialControllerState(selectArtifacts('rich'), true)).toEqual({
      phase: 'blocked',
      reason: 'pendingUpload',
    });
  });
});
