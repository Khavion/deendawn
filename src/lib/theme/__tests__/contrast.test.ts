/**
 * @jest-environment node
 *
 * WCAG 2.2 contrast enforcement for the token palettes (docs/DESIGN.md).
 * A palette edit that breaks readability fails this suite.
 */
import {
  dimOnFeatured,
  featuredGradient,
  palette,
  tajweedColors,
  textOnFeatured,
  ThemeMode,
} from '../tokens';

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

/** Alpha-composite an rgba() color over a hex background → hex. */
function compositeOver(rgba: string, bgHex: string): string {
  const m = rgba.match(/rgba\((\d+),(\d+),(\d+),([\d.]+)\)/);
  if (!m) return rgba;
  const [r, g, b, a] = [Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4])];
  const bg = bgHex.replace('#', '');
  const [br, bgc, bb] = [0, 2, 4].map((i) => parseInt(bg.slice(i, i + 2), 16));
  const mix = (fg: number, back: number) =>
    Math.round(fg * a + back * (1 - a))
      .toString(16)
      .padStart(2, '0');
  return `#${mix(r, br)}${mix(g, bgc)}${mix(b, bb)}`;
}

describe.each(['light', 'dark'] as const)('featured card text (%s)', (scheme) => {
  test('textOnFeatured reaches 4.5:1 on every gradient stop', () => {
    for (const stop of featuredGradient[scheme]) {
      expect(contrastRatio(textOnFeatured[scheme], stop)).toBeGreaterThanOrEqual(4.5);
    }
  });

  test('dimOnFeatured (composited) reaches 4.5:1 on every gradient stop', () => {
    for (const stop of featuredGradient[scheme]) {
      const solid = compositeOver(dimOnFeatured[scheme], stop);
      expect(contrastRatio(solid, stop)).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe.each(['light', 'dark'] as const)('tajweed colors (%s)', (scheme) => {
  // Tajweed runs render at Quranic sizes (≥28pt) → WCAG large-text 3:1.
  // `silent` is EXEMPT by design: it marks unpronounced letters and must read
  // as muted — its reduced salience is the semantic (documented in tokens.ts).
  const canvases =
    scheme === 'light'
      ? [palette.light.bgCanvas, palette.light.bgSurface]
      : [palette.dark.bgCanvas, palette.nightWarm.bgCanvas];

  test('every pronounced rule reaches 3:1 on its reading canvases', () => {
    const { silent: _silent, ...pronounced } = tajweedColors[scheme];
    for (const [rule, color] of Object.entries(pronounced)) {
      for (const bg of canvases) {
        const ratio = contrastRatio(color, bg);
        expect({ rule, bg, ok: ratio >= 3 }).toEqual({ rule, bg, ok: true });
      }
    }
  });
});
