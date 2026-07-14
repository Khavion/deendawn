import { toColoredRuns } from '../tajweed';

// A tiny fake rules table for the pure-logic tests (real data is golden-tested).
const RULES = ['ghunnah', 'madd_6', 'hamzat_wasl'];
// indexes: ghunnah=0 (color ghunnah), madd_6=1 (maddLong), hamzat_wasl=2 (silent)

describe('toColoredRuns', () => {
  it('returns one uncolored run when there are no spans', () => {
    expect(toColoredRuns('abcd', [], RULES)).toEqual([{ text: 'abcd', colorKey: null }]);
  });

  it('splits into colored + default runs and preserves the exact text', () => {
    // color codepoints 1..2 (madd_6 → maddLong)
    const runs = toColoredRuns('abcd', [[1, 1, 3]], RULES);
    expect(runs.map((r) => r.text).join('')).toBe('abcd');
    expect(runs).toEqual([
      { text: 'a', colorKey: null },
      { text: 'bc', colorKey: 'maddLong' },
      { text: 'd', colorKey: null },
    ]);
  });

  it('coalesces neighbouring codepoints of the same color', () => {
    const runs = toColoredRuns(
      'abcd',
      [
        [1, 0, 2],
        [1, 2, 4],
      ],
      RULES
    );
    expect(runs).toEqual([{ text: 'abcd', colorKey: 'maddLong' }]);
  });

  it('higher-priority color wins on overlap (maddLong over ghunnah)', () => {
    // ghunnah over 0..3, madd_6 over 1..2 → middle is maddLong
    const runs = toColoredRuns(
      'abcd',
      [
        [0, 0, 4],
        [1, 1, 3],
      ],
      RULES
    );
    expect(runs).toEqual([
      { text: 'a', colorKey: 'ghunnah' },
      { text: 'bc', colorKey: 'maddLong' },
      { text: 'd', colorKey: 'ghunnah' },
    ]);
  });

  it('ignores out-of-range span bounds gracefully', () => {
    const runs = toColoredRuns('ab', [[2, -5, 99]], RULES); // hamzat_wasl → silent
    expect(runs).toEqual([{ text: 'ab', colorKey: 'silent' }]);
  });

  it('handles multi-codepoint (astral) text by codepoint, not UTF-16 unit', () => {
    // 'a😀b' is 3 codepoints; color the emoji only.
    const runs = toColoredRuns('a\u{1F600}b', [[1, 1, 2]], RULES);
    expect(runs.map((r) => r.text).join('')).toBe('a\u{1F600}b');
    expect(runs[1]).toEqual({ text: '\u{1F600}', colorKey: 'maddLong' });
  });
});
