/**
 * DeenDawn / "Deen Dawn" design tokens — the single source of visual truth
 * (docs/DESIGN.md). Components never hardcode a hex, radius, or duration.
 * Contrast ratios are enforced by __tests__/contrast.test.ts.
 *
 * Palette derived from the Khavion brand (forest-green primary + bronze/gold
 * accent, warm ivory / cool near-black grounds). This supersedes the earlier
 * lapis/ochre palette. NOTE: the reference site HTML was not available in-repo,
 * so colors/radii/fonts come from the brief's explicit values and the Latin
 * type scale is DERIVED from the app's existing scale + the brief's variants.
 *
 * Token-name mapping (legacy key → brand role), kept so existing screens work
 * without churn: `accent` = the dominant PRIMARY (forest green / sage);
 * `ochre` = the brand ACCENT (bronze / gold). `primary`/`onPrimary`/
 * `primarySoft` are added as clear aliases for the new UI primitives.
 */

import { withAlpha } from '../color';

export { withAlpha };

export type ThemeMode = 'light' | 'dark' | 'nightWarm';

export interface ColorTokens {
  /** App background (warm ivory / cool near-black). */
  bgCanvas: string;
  /** Cards and sheets sitting on the canvas. */
  bgSurface: string;
  /** Higher tonal elevation (depth without shadows). */
  bgElevated: string;
  textPrimary: string;
  textSecondary: string;
  /** Text/icons placed on top of the primary color. */
  textOnAccent: string;
  /** PRIMARY brand color (forest green / sage) — buttons, active states. */
  accent: string;
  /** Quiet primary-tinted fill for highlighted rows/chips. */
  accentSoft: string;
  /** Text color that reads on accentSoft. */
  textOnAccentSoft: string;
  /** Brand ACCENT (bronze / gold) — sparse highlights (bookmarks, badges). */
  ochre: string;
  /** Accent-tinted quiet fill (badge background). */
  ochreSoft: string;
  /** Confirmations only. */
  success: string;
  border: string;
  icon: string;
  // --- brand-semantic aliases (same values; clearer for new primitives) ---
  /** = accent. The dominant brand color. */
  primary: string;
  /** = textOnAccent. */
  onPrimary: string;
  /** = accentSoft. */
  primarySoft: string;
}

export const palette: Record<ThemeMode, ColorTokens> = {
  light: {
    bgCanvas: '#F7F6F2',
    bgSurface: '#FFFFFF',
    bgElevated: '#F0EEE7',
    textPrimary: '#20242A',
    textSecondary: '#6B675C',
    textOnAccent: '#F7F6F2',
    accent: '#274D3D',
    accentSoft: '#B9CDC2',
    textOnAccentSoft: '#20242A',
    ochre: '#8A6430',
    ochreSoft: '#F4ECDE',
    success: '#2E6A48',
    border: '#DCD9D0',
    icon: '#8B8677',
    primary: '#274D3D',
    onPrimary: '#F7F6F2',
    primarySoft: '#B9CDC2',
  },
  dark: {
    bgCanvas: '#15181D',
    bgSurface: '#1B1F25',
    bgElevated: '#232830',
    textPrimary: '#F4F3EE',
    textSecondary: '#9AA1AA',
    textOnAccent: '#15181D',
    accent: '#6FA28B',
    accentSoft: '#24352E',
    textOnAccentSoft: '#F4F3EE',
    ochre: '#C69B5F',
    ochreSoft: '#2A2519',
    success: '#7FB98F',
    border: '#343A43',
    icon: '#8E96A0',
    primary: '#6FA28B',
    onPrimary: '#15181D',
    primarySoft: '#24352E',
  },
  // Night-warm reading mode: rebuilt on the dark base with the gold family
  // (docs/DESIGN.md), warm-shifted for low-light Quran reading.
  nightWarm: {
    bgCanvas: '#16130D',
    bgSurface: '#1E1A12',
    bgElevated: '#251F16',
    textPrimary: '#ECE3D2',
    textSecondary: '#AEA286',
    textOnAccent: '#16130D',
    accent: '#C69B5F',
    accentSoft: '#2A2417',
    textOnAccentSoft: '#ECE3D2',
    ochre: '#C69B5F',
    ochreSoft: '#2A2417',
    success: '#9DB58F',
    border: '#322A1E',
    icon: '#9C8B72',
    primary: '#C69B5F',
    onPrimary: '#16130D',
    primarySoft: '#2A2417',
  },
};

/** Spacing scale — the only allowed gaps/paddings. */
export const spacing = { xs: 4, s: 8, m: 12, l: 16, xl: 24, xxl: 32, xxxl: 48 } as const;

/** Radius family — 8 default, 6 small (Khavion brief). Nothing else. */
export const radius = { card: 8, control: 6 } as const;

/** Numeric type scale (pt) — kept for existing consumers. */
export const fontSize = {
  display: 32,
  title: 22,
  h1: 22,
  h2: 18,
  body: 16,
  callout: 15,
  caption: 13,
  micro: 11,
  numeral: 88,
} as const;

/**
 * Font families.
 * - Latin display serif: Newsreader (headlines, accent italic word, reading).
 * - Latin body/UI sans: Public Sans.
 * - Arabic: Amiri Quran (Quranic) + Noto Nastaliq (Urdu) — UNCHANGED and always
 *   takes precedence for Quranic/Arabic content.
 */
export const fonts = {
  serif: 'Newsreader_400Regular',
  serifMedium: 'Newsreader_500Medium',
  serifSemiBold: 'Newsreader_600SemiBold',
  serifBold: 'Newsreader_700Bold',
  serifItalic: 'Newsreader_400Regular_Italic',
  serifLight: 'Newsreader_300Light',
  sans: 'PublicSans_400Regular',
  sansMedium: 'PublicSans_500Medium',
  sansSemiBold: 'PublicSans_600SemiBold',
  sansBold: 'PublicSans_700Bold',
  quran: 'AmiriQuran',
  /** Urdu content face — Nastaliq needs ~1.9-2.1 line-height (docs/DESIGN.md). */
  nastaliq: 'NotoNastaliqUrdu',
} as const;

/**
 * Latin type scale (DERIVED — see file header). Each variant is a ready style.
 * Eyebrow tracking follows the brief's 0.14-0.16em → absolute letterSpacing at
 * its size (~1.9 at 12pt). Newsreader italic carries the single accent word.
 *
 * `subtitle` / `reading` / `bodyStrong` / `link` carry the legacy ThemedText
 * faces (serif subheading, editorial serif reading, semibold emphasis, tinted
 * link) into the single AppText primitive — metrics are the same values those
 * styles already used, not new ones. `reading` keeps Newsreader for long-form
 * translations and editorial passages (the brief lists Newsreader for reading).
 */
export const latinType = {
  display: {
    fontFamily: fonts.serifSemiBold,
    fontSize: fontSize.display,
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  displayAccent: {
    fontFamily: fonts.serifItalic,
    fontSize: fontSize.display,
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  title: {
    fontFamily: fonts.serifSemiBold,
    fontSize: fontSize.title,
    lineHeight: 28,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontFamily: fonts.serifMedium,
    fontSize: fontSize.h2,
    lineHeight: 28,
    letterSpacing: -0.2,
  },
  reading: {
    fontFamily: fonts.serif,
    fontSize: fontSize.body,
    lineHeight: 26,
    letterSpacing: 0,
  },
  body: {
    fontFamily: fonts.sans,
    fontSize: fontSize.body,
    lineHeight: 24,
    letterSpacing: 0,
  },
  bodyStrong: {
    fontFamily: fonts.sansSemiBold,
    fontSize: fontSize.body,
    lineHeight: 24,
    letterSpacing: 0,
  },
  link: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSize.body,
    lineHeight: 24,
    letterSpacing: 0,
  },
  eyebrow: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1.9,
    textTransform: 'uppercase' as const,
  },
  caption: {
    fontFamily: fonts.sans,
    fontSize: fontSize.caption,
    lineHeight: 18,
    letterSpacing: 0.1,
  },
  /**
   * The one glanceable number per screen (tasbih count; widget countdown at
   * reduced size). Newsreader Light with tabular figures so digits don't
   * jitter as they change (handoff §1/§3).
   */
  numeral: {
    fontFamily: fonts.serifLight,
    fontSize: fontSize.numeral,
    lineHeight: 92,
    letterSpacing: -1,
    // Mutable array on purpose: RN's TextStyle.fontVariant type rejects
    // readonly arrays.
    fontVariant: ['tabular-nums'] as 'tabular-nums'[],
  },
} as const;

/** Multiplier applied to Latin line-heights when rendering Urdu Nastaliq. */
export const URDU_LINE_HEIGHT_FACTOR = 1.55;

/** Quranic Arabic sizing: generous size + ~2.0 leading for stacked tashkeel. */
export const quranType = {
  ayahSize: 28,
  ayahLineHeight: 56,
  surahNameSize: 20,
  surahNameLineHeight: 36,
  /** Preview-card scale (Verse of the Day) — smaller than the reader on purpose. */
  cardAyahSize: 24,
  cardAyahLineHeight: 46,
} as const;

/**
 * Motion durations (ms) — transform/opacity only, ease-in-out.
 * Press feedback is asymmetric on purpose: finger-down reads as instant,
 * release settles a touch slower (Apple-feel, not spec).
 */
export const duration = { pressIn: 80, pressOut: 140, fast: 200, normal: 250, slow: 300 } as const;

/**
 * Content measures for wide screens (iPad, landscape). Applied as
 * `maxWidth + alignSelf:'center' + width:'100%'` — inert on phones, keeps
 * text and forms at a readable width everywhere else.
 */
export const measure = {
  /** General content: settings rows, forms, cards. */
  content: 640,
  /** Long-form reading: Quran rows, book sections. */
  reading: 680,
  /** The hijri month grid — cells stay near-square. */
  grid: 520,
} as const;

/**
 * Per-role Dynamic Type caps (HIG: prioritize content; chrome scales less).
 * iOS Fabric multiplies lineHeight together with the font multiplier, so
 * scaled text keeps its leading — the caps exist for layout sanity, not to
 * dodge clipping. `content` deliberately reaches Apple's 200% accessibility
 * sizes; labels/chrome stay recognizable instead of exploding.
 */
export const fontScaleCaps = {
  /** Reading/body content, inputs — the text people came for. */
  content: 2.0,
  /** Headings and display serif — large already, scale gently. */
  heading: 1.6,
  /** Eyebrows, captions-as-chrome, header controls. */
  label: 1.4,
} as const;

/**
 * Ceiling for the PRODUCT of the reader's own A−/A+ scale × system Dynamic
 * Type on Quranic Arabic — either control alone reaches it; stacked they
 * don't compound past it (28pt base → ~73pt max).
 */
export const MAX_ARABIC_EFFECTIVE_SCALE = 2.6;

// --- Rich design tokens (docs/RICH_DESIGN_SPEC.md) ------------------------
// Warmer/richer evolution: soft depth, dawn-sky ambient gradients, a gold
// frame on the one featured card per screen, illuminated gold section rules.
// Values extracted from the approved design. nightWarm maps to the dark set.

export type ElevationStep = 'e1' | 'e2' | 'e3';
export type DayPeriod = 'fajr' | 'day' | 'asr' | 'maghrib' | 'isha';

interface Shadow {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}

/** Collapse the 3 themes to the two depth families the design defines. */
export function richMode(mode: ThemeMode): 'light' | 'dark' {
  return mode === 'light' ? 'light' : 'dark';
}

/**
 * 3-step elevation. RN allows one shadow per View, so each step is a single
 * tuned shadow approximating the design's two-layer depth. E3 (the featured
 * card) casts a faint GREEN-tinted shadow (#1C372C) per the spec.
 */
export const elevation: Record<'light' | 'dark', Record<ElevationStep, Shadow>> = {
  light: {
    e1: {
      shadowColor: '#20242A',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 1,
    },
    e2: {
      shadowColor: '#20242A',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.1,
      shadowRadius: 14,
      elevation: 4,
    },
    e3: {
      shadowColor: '#1C372C',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.2,
      shadowRadius: 22,
      elevation: 9,
    },
  },
  dark: {
    e1: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.3,
      shadowRadius: 3,
      elevation: 2,
    },
    e2: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 22,
      elevation: 6,
    },
    e3: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.5,
      shadowRadius: 28,
      elevation: 12,
    },
  },
};

/** Ambient "dawn-sky" gradient stops per prayer period (top of screen → canvas). */
export const ambientGradient: Record<'light' | 'dark', Record<DayPeriod, string[]>> = {
  light: {
    fajr: ['#F0D8BE', '#F3E5D4', '#F6F0E7', '#F7F6F2'],
    day: ['#F4EBE0', '#F7F6F2'],
    asr: ['#F4E7D7', '#F7F6F2'],
    maghrib: ['#F3E6D6', '#F7F6F2'],
    isha: ['#F4E7D7', '#F7F6F2'],
  },
  dark: {
    fajr: ['#232A38', '#15181D'],
    day: ['#1E242F', '#15181D'],
    asr: ['#1F2530', '#15181D'],
    maghrib: ['#222836', '#15181D'],
    isha: ['#222836', '#191E27', '#15181D'],
  },
};

/**
 * Period wash (handoff §5 gap 01) — a quiet vertical tint pinned to the top of
 * the canvas, fading to transparent over `height` px. Keyed by the existing
 * prayer-named DayPeriod: fajr carries the handoff's "dawn" wash, maghrib its
 * "dusk", isha its "night"; day AND asr are deliberately washless (§6 screen 01
 * defines exactly four hero states — the wash stays a rarity). Vertical only,
 * so RTL needs no fork. Render with `Gradient` + pointerEvents="none".
 */
export interface PeriodWashSpec {
  /** Top-stop color (alpha already applied); render as [color, transparent]. */
  color: string;
  /** Vertical extent of the fade, in px. */
  height: number;
}

export const periodWash: Record<ThemeMode, Record<DayPeriod, PeriodWashSpec | null>> = (
  ['light', 'dark', 'nightWarm'] as const
).reduce(
  (acc, mode) => {
    acc[mode] = {
      fajr: { color: withAlpha(palette[mode].ochre, 0.11), height: 400 },
      day: null,
      asr: null,
      // Handoff states 15%, but light-mode textSecondary drops to 4.31:1 on
      // the composited wash — 11% is the strongest dusk that keeps AA (the
      // contrast suite enforces it). Dark/nightWarm keep the spec value.
      maghrib: {
        color: withAlpha(palette[mode].ochre, mode === 'light' ? 0.11 : 0.15),
        height: 470,
      },
      // The night wash is the dark sage in every theme (spec: accent(dark) 9%).
      isha: { color: withAlpha(palette.dark.accent, 0.09), height: 420 },
    };
    return acc;
  },
  {} as Record<ThemeMode, Record<DayPeriod, PeriodWashSpec | null>>,
);

/**
 * Hero-interior wash — the period overlay ON the featured gradient fill
 * (handoff §6 screen 01: 17/0/22/10%). Always the dark gold regardless of
 * theme because it composites onto the green featured gradient.
 */
export const heroWash: Record<DayPeriod, string | null> = {
  fajr: withAlpha(palette.dark.ochre, 0.17),
  day: null,
  asr: null,
  maghrib: withAlpha(palette.dark.ochre, 0.22),
  isha: withAlpha(palette.dark.ochre, 0.1),
};

/**
 * Celebration grammar (handoff §2): qibla alignment and tasbih milestones share
 * the exact same moment — ring/rim to solid ochre, this glow, a radial canvas
 * bloom, ONE detent haptic, a success caption. ≤ duration.slow, opacity/
 * transform only, never repeated while held, never particles or sound.
 * Reduce Motion: crossfade only. The gold is the dark-gold literal in every
 * mode (the spec states the rgba directly).
 */
export const celebration = {
  /** Ring/rim glow — one RN shadow (0 0 46px rgba(198,155,95,.55)). */
  glow: {
    shadowColor: '#C69B5F',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 46,
    elevation: 12,
  },
  /** Radial canvas bloom behind the celebrating object (24% → transparent). */
  bloomColor: withAlpha('#C69B5F', 0.24),
  bloomSize: 460,
  /** Hard ceiling for the whole moment. */
  maxDuration: duration.slow,
} as const;

/** The one featured card's gradient fill + the text color that reads on it. */
export const featuredGradient: Record<'light' | 'dark', string[]> = {
  light: ['#2C5646', '#23402F'],
  dark: ['#78AB93', '#66997F'],
};
export const textOnFeatured: Record<'light' | 'dark', string> = {
  light: '#F7F6F2',
  dark: '#15181D',
};
export const dimOnFeatured: Record<'light' | 'dark', string> = {
  // 0.75 composited to ~4.15:1 under the strongest hero period wash — below
  // AA for the small featured-card captions. 0.82 clears 4.5:1 on every
  // washed stop (contrast test enforces it) while still reading as secondary.
  light: 'rgba(247,246,242,0.82)',
  // 0.66 composited to ~3.2:1 on the dark gradient stops — below AA for the
  // small featured-card captions. 0.88 clears 4.5:1 on both stops (contrast
  // test enforces it) while still reading as secondary.
  dark: 'rgba(21,24,29,0.88)',
};

/** Illuminated gold hairline rule (transparent → gold → transparent). */
export const goldRuleGradient: Record<'light' | 'dark', string[]> = {
  light: ['rgba(138,100,48,0)', 'rgba(138,100,48,0.45)', 'rgba(138,100,48,0)'],
  dark: ['rgba(198,155,95,0)', 'rgba(198,155,95,0.5)', 'rgba(198,155,95,0)'],
};

/**
 * Tajweed rule colors (light/dark). Hues follow a common printed-mushaf scheme;
 * the rule→color MAPPING is flagged SCHOLAR-REVIEW (see src/features/quran/
 * tajweed.ts). Chosen for legibility on both grounds against the ivory/dark
 * Quran canvas. `silent` deliberately reads as muted grey (not pronounced).
 */
export type TajweedColorMap = Record<
  'maddLong' | 'maddNatural' | 'ghunnah' | 'ikhfa' | 'iqlab' | 'qalqalah' | 'idghaam' | 'silent',
  string
>;

export const tajweedColors: Record<'light' | 'dark', TajweedColorMap> = {
  light: {
    maddLong: '#C0392B',
    maddNatural: '#B9770E',
    ghunnah: '#2E7D32',
    ikhfa: '#0E7C86',
    iqlab: '#7B3FB0',
    qalqalah: '#2456C0',
    idghaam: '#6B7280',
    silent: '#A7A29A',
  },
  dark: {
    maddLong: '#F08A7E',
    maddNatural: '#E0A96D',
    ghunnah: '#8CCB92',
    ikhfa: '#6FC6D0',
    iqlab: '#C4A6EC',
    qalqalah: '#8FB2E8',
    idghaam: '#A6ADB8',
    silent: '#7C766C',
  },
};
