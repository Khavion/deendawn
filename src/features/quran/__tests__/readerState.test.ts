import {
  DEFAULT_READING_SCALE,
  loadLastRead,
  loadReadingScale,
  READING_SCALES,
  recordReadingPosition,
  saveLastRead,
  saveReadingScale,
  stepReadingScale,
} from '../readerState';
import { createMemoryKVStore } from '../../../lib/kvStore';

describe('recordReadingPosition (last-read tracking)', () => {
  test('records the position while tracking is on', () => {
    const store = createMemoryKVStore();
    recordReadingPosition(store, { surah: 2, ayah: 12 }, true);
    expect(loadLastRead(store)).toEqual({ surah: 2, ayah: 12 });
  });

  test('does NOT overwrite the deep-linked position while tracking is off', () => {
    // The top-of-surah render fires before the deep-link scroll settles.
    const store = createMemoryKVStore();
    saveLastRead(store, { surah: 2, ayah: 50 });
    recordReadingPosition(store, { surah: 2, ayah: 1 }, false);
    expect(loadLastRead(store)).toEqual({ surah: 2, ayah: 50 });
  });

  test('ignores empty viewable items', () => {
    const store = createMemoryKVStore();
    recordReadingPosition(store, undefined, true);
    expect(loadLastRead(store)).toBeNull();
  });
});

describe('reading scale preference', () => {
  test('defaults to 1.0 when unset or invalid', () => {
    const store = createMemoryKVStore();
    expect(loadReadingScale(store)).toBe(DEFAULT_READING_SCALE);
    store.set('quran.readingScale.v1', '3'); // not an allowed step
    expect(loadReadingScale(store)).toBe(DEFAULT_READING_SCALE);
    store.set('quran.readingScale.v1', 'huge');
    expect(loadReadingScale(store)).toBe(DEFAULT_READING_SCALE);
  });

  test('saves and loads an allowed scale; ignores disallowed values', () => {
    const store = createMemoryKVStore();
    saveReadingScale(store, 1.3);
    expect(loadReadingScale(store)).toBe(1.3);
    saveReadingScale(store, 99); // rejected — previous value stays
    expect(loadReadingScale(store)).toBe(1.3);
  });

  test('stepping moves through the allowed set and clamps at both ends', () => {
    expect(stepReadingScale(1, 1)).toBe(1.15);
    expect(stepReadingScale(1, -1)).toBe(0.85);
    // Clamp at max
    expect(stepReadingScale(READING_SCALES[READING_SCALES.length - 1], 1)).toBe(
      READING_SCALES[READING_SCALES.length - 1]
    );
    // Clamp at min
    expect(stepReadingScale(READING_SCALES[0], -1)).toBe(READING_SCALES[0]);
    // Unknown current value steps relative to the default
    expect(stepReadingScale(42, 1)).toBe(1.15);
  });
});
