/**
 * Tiny color utilities for the pure-JS gradient primitive (src/components/ui/
 * Gradient.tsx). No native module needed — we render interpolated bands, so the
 * signature dawn-sky gradient works on the current build without a native
 * rebuild. Handles #rgb / #rrggbb / rgb() / rgba().
 */

export interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

export function parseColor(input: string): RGBA {
  const s = input.trim();
  if (s.startsWith('#')) {
    const hex = s.slice(1);
    if (hex.length === 3) {
      return {
        r: parseInt(hex[0] + hex[0], 16),
        g: parseInt(hex[1] + hex[1], 16),
        b: parseInt(hex[2] + hex[2], 16),
        a: 1,
      };
    }
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
      a: hex.length >= 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1,
    };
  }
  const m = s.match(/rgba?\(([^)]+)\)/i);
  if (m) {
    const parts = m[1].split(',').map((p) => parseFloat(p.trim()));
    return { r: parts[0] || 0, g: parts[1] || 0, b: parts[2] || 0, a: parts[3] ?? 1 };
  }
  // Unknown format (e.g. 'transparent') → transparent black.
  if (s === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };
  return { r: 0, g: 0, b: 0, a: 1 };
}

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);

export function toRgbaString({ r, g, b, a }: RGBA): string {
  return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${Number(a.toFixed(3))})`;
}

/** Linearly interpolate two colors; t in [0,1]. */
export function mixColor(a: RGBA, b: RGBA, t: number): RGBA {
  const k = clamp01(t);
  return {
    r: a.r + (b.r - a.r) * k,
    g: a.g + (b.g - a.g) * k,
    b: a.b + (b.b - a.b) * k,
    a: a.a + (b.a - a.a) * k,
  };
}

/**
 * Sample a multi-stop gradient at position t in [0,1]. `locations` (0..1, same
 * length as colors) are optional; evenly spaced if omitted.
 */
export function sampleGradient(colors: RGBA[], t: number, locations?: number[]): RGBA {
  if (colors.length === 0) return { r: 0, g: 0, b: 0, a: 0 };
  if (colors.length === 1) return colors[0];
  const stops = locations ?? colors.map((_, i) => i / (colors.length - 1));
  const k = clamp01(t);
  if (k <= stops[0]) return colors[0];
  if (k >= stops[stops.length - 1]) return colors[colors.length - 1];
  for (let i = 0; i < stops.length - 1; i++) {
    if (k >= stops[i] && k <= stops[i + 1]) {
      const span = stops[i + 1] - stops[i] || 1;
      return mixColor(colors[i], colors[i + 1], (k - stops[i]) / span);
    }
  }
  return colors[colors.length - 1];
}
