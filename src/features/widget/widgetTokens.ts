import { flattenOver, withAlpha } from '@/src/lib/color';
import { featuredGradient, palette } from '@/src/lib/theme/tokens';

/**
 * Widget token pack (handoff §5 gaps 26–27) — the generated subset of the
 * design system that widget surfaces (react-native-android-widget now,
 * WidgetKit/Glance later) may use. Widgets never import tokens.ts directly:
 * RemoteViews need solid hex, so every stated-alpha token is flattened here
 * against the surface it sits on. The drift-guard test asserts these values
 * against their tokens.ts sources, so a palette edit can never silently strand
 * the widgets on stale colors (the bug this file replaces).
 */

type Hex = `#${string}`;

export interface WidgetPalette {
  /** Widget background fill. */
  fill: Hex;
  /** Hairline stroke (border of the widget card / times-strip rule). */
  hairline: Hex;
  /** The big serif time + strip times. */
  text: Hex;
  /** Captions: city, hijri date, past prayers. */
  secondary: Hex;
  /** Eyebrow diamond + the gold countdown / next-prayer emphasis. */
  gold: Hex;
  /** Brand-primary accents (Paper's header city label). */
  accent: Hex;
  /** Quiet fill behind the next-prayer column. */
  nextFill: Hex;
}

const hex = (v: string) => v.toUpperCase() as Hex;

/**
 * The three widget palettes (§6 screen 07): Paper (surface + hairline),
 * Forest (the hero off-app — featured gradient approximated by its top stop;
 * RemoteViews cannot draw gradients), and Night gold (follows system dark).
 */
export const widgetPalettes: Record<'paper' | 'forest' | 'night', WidgetPalette> = {
  paper: {
    fill: hex(palette.light.bgSurface),
    hairline: hex(palette.light.border),
    text: hex(palette.light.textPrimary),
    secondary: hex(palette.light.textSecondary),
    gold: hex(palette.light.ochre),
    accent: hex(palette.light.accent),
    nextFill: hex(palette.light.ochreSoft),
  },
  forest: {
    fill: hex(featuredGradient.light[0]),
    hairline: hex(flattenOver(withAlpha(palette.dark.ochre, 0.28), featuredGradient.light[0])),
    text: hex(palette.light.bgCanvas),
    secondary: hex(flattenOver('rgba(247,246,242,0.82)', featuredGradient.light[0])),
    gold: hex(palette.dark.ochre),
    accent: hex(palette.light.bgCanvas),
    nextFill: hex(flattenOver(withAlpha(palette.dark.ochre, 0.18), featuredGradient.light[0])),
  },
  night: {
    fill: hex(palette.dark.bgSurface),
    hairline: hex(flattenOver(withAlpha(palette.dark.ochre, 0.4), palette.dark.bgSurface)),
    text: hex(palette.dark.textPrimary),
    secondary: hex(palette.dark.textSecondary),
    gold: hex(palette.dark.ochre),
    accent: hex(palette.dark.accent),
    nextFill: hex(palette.dark.ochreSoft),
  },
};

/** Text roles (§5 gap 26): serif time, sans countdown, tracked eyebrow. */
export const widgetType = {
  time: { fontSize: 30 },
  countdown: { fontSize: 13 },
  eyebrow: { fontSize: 10, letterSpacing: 1.5 },
  caption: { fontSize: 11 },
  strip: { name: 11, time: 13 },
} as const;

/** Widget-internal padding (§5 gap 26). */
export const widgetSpacing = { pad: 14, padWide: 16 } as const;

/**
 * Legacy light/dark mapping for the current Android widget tree (its `dark`
 * boolean predates the three-palette scheme): light = Paper, dark = Night.
 * The Phase-4 re-skin adds the palette picker; this keeps today's widget on
 * live tokens in the meantime.
 */
export function widgetColorsFor(dark: boolean): WidgetPalette {
  return dark ? widgetPalettes.night : widgetPalettes.paper;
}
