import { resolveAudioSource } from '../config';
import { formatClock, progressFraction, resumeSeekTarget } from '../playerLogic';
import { clearResumePosition, getResumePosition, saveResumePosition } from '../resumeStore';
import { surahAudioUrl } from '../urls';
import { createMemoryKVStore } from '@/src/lib/kvStore';

describe('surahAudioUrl', () => {
  it('pads surah numbers to three digits under the reciter prefix', () => {
    expect(surahAudioUrl('https://audio.example.com', 'dev', 1)).toBe(
      'https://audio.example.com/dev/001.mp3'
    );
    expect(surahAudioUrl('https://audio.example.com', 'dev', 114)).toBe(
      'https://audio.example.com/dev/114.mp3'
    );
  });

  it('strips trailing slashes from the base', () => {
    expect(surahAudioUrl('https://audio.example.com///', 'dev', 36)).toBe(
      'https://audio.example.com/dev/036.mp3'
    );
  });

  it('rejects out-of-range and non-integer surahs', () => {
    expect(() => surahAudioUrl('https://x', 'dev', 0)).toThrow(RangeError);
    expect(() => surahAudioUrl('https://x', 'dev', 115)).toThrow(RangeError);
    expect(() => surahAudioUrl('https://x', 'dev', 1.5)).toThrow(RangeError);
  });

  it('rejects missing configuration', () => {
    expect(() => surahAudioUrl('', 'dev', 1)).toThrow();
    expect(() => surahAudioUrl('https://x', '', 1)).toThrow();
  });

  it('supports the dev m4a extension', () => {
    expect(surahAudioUrl('http://localhost:8083', 'dev', 2, 'm4a')).toBe(
      'http://localhost:8083/dev/002.m4a'
    );
  });
});

describe('resolveAudioSource', () => {
  it('uses the env base URL when provided', () => {
    const src = resolveAudioSource('https://r2.example.com/audio', false);
    expect(src?.baseUrl).toBe('https://r2.example.com/audio');
    expect(src?.placeholder).toBe(false);
  });

  it('falls back to localhost placeholder only in dev', () => {
    const dev = resolveAudioSource(undefined, true);
    expect(dev?.baseUrl).toContain('localhost');
    expect(dev?.fileExt).toBe('m4a');
    expect(dev?.placeholder).toBe(true);
    expect(resolveAudioSource(undefined, false)).toBeNull();
    expect(resolveAudioSource('   ', false)).toBeNull();
  });

  it('marks any dev-build source as placeholder until recordings clear', () => {
    expect(resolveAudioSource('https://r2.example.com', true)?.placeholder).toBe(true);
  });
});

describe('resume store', () => {
  it('round-trips positions per reciter and surah', () => {
    const store = createMemoryKVStore();
    saveResumePosition(store, 'dev', 2, 93.46);
    expect(getResumePosition(store, 'dev', 2)).toBeCloseTo(93.5);
    expect(getResumePosition(store, 'dev', 3)).toBe(0);
    expect(getResumePosition(store, 'other', 2)).toBe(0);
    clearResumePosition(store, 'dev', 2);
    expect(getResumePosition(store, 'dev', 2)).toBe(0);
  });

  it('ignores junk writes and survives corrupt values', () => {
    const store = createMemoryKVStore({ 'audio.resume.v1.dev.5': 'garbage' });
    expect(getResumePosition(store, 'dev', 5)).toBe(0);
    saveResumePosition(store, 'dev', 6, NaN);
    saveResumePosition(store, 'dev', 6, -4);
    expect(getResumePosition(store, 'dev', 6)).toBe(0);
  });
});

describe('resumeSeekTarget', () => {
  it('restarts near the beginning and near the end', () => {
    expect(resumeSeekTarget(4, 300)).toBe(0);
    expect(resumeSeekTarget(298, 300)).toBe(0);
    expect(resumeSeekTarget(120, 300)).toBe(120);
  });

  it('allows resume when duration is not yet known', () => {
    expect(resumeSeekTarget(120, NaN)).toBe(120);
    expect(resumeSeekTarget(120, 0)).toBe(120);
  });
});

describe('formatClock / progressFraction', () => {
  it('formats minutes and hours', () => {
    expect(formatClock(0)).toBe('0:00');
    expect(formatClock(65)).toBe('1:05');
    expect(formatClock(3671)).toBe('1:01:11');
    expect(formatClock(NaN)).toBe('0:00');
  });

  it('clamps progress into 0..1', () => {
    expect(progressFraction(30, 60)).toBe(0.5);
    expect(progressFraction(90, 60)).toBe(1);
    expect(progressFraction(-3, 60)).toBe(0);
    expect(progressFraction(10, 0)).toBe(0);
  });
});
