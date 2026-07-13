/**
 * @jest-environment node
 *
 * WCAG 2.2 contrast enforcement for the token palettes (docs/DESIGN.md).
 * A palette edit that breaks readability fails this suite.
 */
import { palette, ThemeMode } from '../tokens';

function srgbChannel(v: number): number {
  const c = v / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function luminance(hex: string): number {
  const m = hex.replace('#', '');
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  return 0.2126 * srgbChannel(r) + 0.7152 * srgbChannel(g) + 0.0722 * srgbChannel(b);
}

export function contrastRatio(a: string, b: string): number {
  const l1 = luminance(a);
  const l2 = luminance(b);
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

const MODES: ThemeMode[] = ['light', 'dark', 'nightWarm'];

describe.each(MODES)('%s palette contrast', (mode) => {
  const c = palette[mode];
  const surfaces = [c.bgCanvas, c.bgSurface, c.bgElevated];

  test('primary text reaches 7:1 (AAA body) on every surface', () => {
    for (const bg of surfaces) {
      expect(contrastRatio(c.textPrimary, bg)).toBeGreaterThanOrEqual(7);
    }
  });

  test('secondary text reaches 4.5:1 (AA) on every surface', () => {
    for (const bg of surfaces) {
      expect(contrastRatio(c.textSecondary, bg)).toBeGreaterThanOrEqual(4.5);
    }
  });

  test('accent used as text/link reaches 4.5:1 on canvas and surface', () => {
    expect(contrastRatio(c.accent, c.bgCanvas)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(c.accent, c.bgSurface)).toBeGreaterThanOrEqual(4.5);
  });

  test('text on accent (buttons) reaches 4.5:1', () => {
    expect(contrastRatio(c.textOnAccent, c.accent)).toBeGreaterThanOrEqual(4.5);
  });

  test('text on accentSoft (highlighted rows) reaches 4.5:1', () => {
    expect(contrastRatio(c.textOnAccentSoft, c.accentSoft)).toBeGreaterThanOrEqual(4.5);
    // Primary text must also survive on the soft fill (times list highlight).
    expect(contrastRatio(c.textPrimary, c.accentSoft)).toBeGreaterThanOrEqual(4.5);
  });

  test('ochre highlights reach 4.5:1 as small text on canvas and its soft fill', () => {
    expect(contrastRatio(c.ochre, c.bgCanvas)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(c.ochre, c.ochreSoft)).toBeGreaterThanOrEqual(4.5);
  });

  test('success and icon colors reach 3:1 (non-text UI) on canvas', () => {
    expect(contrastRatio(c.success, c.bgCanvas)).toBeGreaterThanOrEqual(3);
    expect(contrastRatio(c.icon, c.bgCanvas)).toBeGreaterThanOrEqual(3);
  });

  test('never pure black canvas or pure white body text (halation rule)', () => {
    expect(c.bgCanvas.toLowerCase()).not.toBe('#000000');
    expect(c.textPrimary.toLowerCase()).not.toBe('#ffffff');
  });
});
