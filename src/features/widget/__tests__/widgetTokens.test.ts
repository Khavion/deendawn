/**
 * @jest-environment node
 *
 * Drift guard: the widget palettes are DERIVED from tokens.ts — if a palette
 * edit lands, these assertions drag the widgets along instead of letting them
 * strand on stale colors (the pre-pack widget shipped four stale hexes).
 */
import { featuredGradient, palette } from '@/src/lib/theme/tokens';

import { widgetColorsFor, widgetPalettes, widgetSpacing, widgetType } from '../widgetTokens';

describe('widget token pack', () => {
  test('paper palette tracks the light tokens', () => {
    expect(widgetPalettes.paper.fill).toBe(palette.light.bgSurface.toUpperCase());
    expect(widgetPalettes.paper.hairline).toBe(palette.light.border.toUpperCase());
    expect(widgetPalettes.paper.text).toBe(palette.light.textPrimary.toUpperCase());
    expect(widgetPalettes.paper.secondary).toBe(palette.light.textSecondary.toUpperCase());
    expect(widgetPalettes.paper.gold).toBe(palette.light.ochre.toUpperCase());
    expect(widgetPalettes.paper.accent).toBe(palette.light.accent.toUpperCase());
  });

  test('night palette tracks the dark tokens', () => {
    expect(widgetPalettes.night.fill).toBe(palette.dark.bgSurface.toUpperCase());
    expect(widgetPalettes.night.text).toBe(palette.dark.textPrimary.toUpperCase());
    expect(widgetPalettes.night.secondary).toBe(palette.dark.textSecondary.toUpperCase());
    expect(widgetPalettes.night.gold).toBe(palette.dark.ochre.toUpperCase());
  });

  test('forest palette sits on the featured gradient', () => {
    expect(widgetPalettes.forest.fill).toBe(featuredGradient.light[0].toUpperCase());
    expect(widgetPalettes.forest.gold).toBe(palette.dark.ochre.toUpperCase());
  });

  test('every color is a solid hex (RemoteViews cannot composite alpha)', () => {
    for (const p of Object.values(widgetPalettes)) {
      for (const v of Object.values(p)) {
        expect(v).toMatch(/^#[0-9A-F]{6}$/);
      }
    }
  });

  test('legacy dark boolean maps light→paper, dark→night', () => {
    expect(widgetColorsFor(false)).toBe(widgetPalettes.paper);
    expect(widgetColorsFor(true)).toBe(widgetPalettes.night);
  });

  test('gap-26 metrics: 30pt serif time, 13pt countdown, 10pt eyebrow, 14/16 pad', () => {
    expect(widgetType.time.fontSize).toBe(30);
    expect(widgetType.countdown.fontSize).toBe(13);
    expect(widgetType.eyebrow.fontSize).toBe(10);
    expect(widgetSpacing.pad).toBe(14);
    expect(widgetSpacing.padWide).toBe(16);
  });
});
