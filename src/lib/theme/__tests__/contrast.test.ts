/**
 * @jest-environment node
 *
 * WCAG 2.2 contrast enforcement for the token palettes (docs/DESIGN.md).
 * A palette edit that breaks readability fails this suite.
 */
import {
  celebration,
  dimOnFeatured,
  featuredGradient,
  heroWash,
  latinType,
  palette,
  periodWash,
  tajweedColors,
  textOnFeatured,
  ThemeMode,
  withAlpha,
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
  const m = rgba.match(/rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/);
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

describe('handoff additions (design handoff 2026-07-31)', () => {
  describe.each(MODES)('period washes (%s)', (mode) => {
    const c = palette[mode];

    test('text stays legible on every wash composited over the canvas', () => {
      for (const spec of Object.values(periodWash[mode])) {
        if (!spec) continue;
        const washed = compositeOver(spec.color, c.bgCanvas);
        expect(contrastRatio(c.textPrimary, washed)).toBeGreaterThanOrEqual(7);
        expect(contrastRatio(c.textSecondary, washed)).toBeGreaterThanOrEqual(4.5);
      }
    });
  });

  // The hero fill only appears in light mode (dark/nightWarm drop the
  // gradient per §2), so the wash-over-gradient legibility check is light-only.
  test('hero text survives the period wash over every featured stop (light)', () => {
    for (const wash of Object.values(heroWash)) {
      if (!wash) continue;
      for (const stop of featuredGradient.light) {
        const washed = compositeOver(wash, stop);
        expect(contrastRatio(textOnFeatured.light, washed)).toBeGreaterThanOrEqual(4.5);
        const dim = compositeOver(dimOnFeatured.light, washed);
        expect(contrastRatio(dim, washed)).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  // The hero countdown renders in ochre(dark) at `title` size (22pt serif —
  // WCAG large text, 3:1). It sits in the hero's lower half, i.e. on the
  // BOTTOM gradient stop; components must not move it onto the top stop,
  // where the gold falls below 3:1.
  test('countdown gold reaches 3:1 (large text) on the washed bottom stop', () => {
    const bottomStop = featuredGradient.light[featuredGradient.light.length - 1];
    for (const wash of Object.values(heroWash)) {
      if (!wash) continue;
      const washed = compositeOver(wash, bottomStop);
      expect(contrastRatio(palette.dark.ochre, washed)).toBeGreaterThanOrEqual(3);
    }
  });

  describe.each(MODES)('progress tracks (%s)', (mode) => {
    const c = palette[mode];

    test('solid ochre arc reaches 3:1 against its own faint track', () => {
      for (const trackAlpha of [0.14, 0.16]) {
        for (const bg of [c.bgCanvas, c.bgSurface]) {
          const track = compositeOver(withAlpha(c.ochre, trackAlpha), bg);
          expect(contrastRatio(c.ochre, track)).toBeGreaterThanOrEqual(3);
        }
      }
    });
  });

  // The glow itself is decorative redundancy — the celebration's state is
  // carried by the solid-ochre ring (covered by the ochre tests), the success
  // caption, and the detent. Assert the grammar's hard limits instead.
  test('celebration stays inside the register limits', () => {
    expect(celebration.maxDuration).toBeLessThanOrEqual(300);
    expect(celebration.glow.shadowColor).toBe(palette.dark.ochre);
  });

  test('numeral role keeps tabular figures (digits must not jitter)', () => {
    expect(latinType.numeral.fontVariant).toContain('tabular-nums');
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
