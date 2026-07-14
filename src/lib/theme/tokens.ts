/**
 * DeenDawn design tokens — the single source of visual truth (docs/DESIGN.md).
 * Components never hardcode a hex, radius, or duration: they read tokens.
 * Contrast ratios are enforced by __tests__/contrast.test.ts.
 */

export type ThemeMode = 'light' | 'dark' | 'nightWarm';

export interface ColorTokens {
  /** App background (warm ivory / warm near-black). */
  bgCanvas: string;
  /** Cards and sheets sitting on the canvas. */
  bgSurface: string;
  /** Higher tonal elevation (dark mode depth without shadows). */
  bgElevated: string;
  textPrimary: string;
  textSecondary: string;
  /** Text/icons placed on top of the accent color. */
  textOnAccent: string;
  /** Lapis — interactive elements, links, selection. */
  accent: string;
  /** Quiet accent-tinted fill for highlighted rows/chips. */
  accentSoft: string;
  /** Text color that reads on accentSoft. */
  textOnAccentSoft: string;
  /** Gold ochre — sparse highlights only (bookmarks, badges). */
  ochre: string;
  /** Ochre-tinted quiet fill (DEV badge background). */
  ochreSoft: string;
  /** Confirmations only. */
  success: string;
  border: string;
  icon: string;
}

export const palette: Record<ThemeMode, ColorTokens> = {
  light: {
    bgCanvas: '#FBF7EF',
    bgSurface: '#FFFFFF',
    bgElevated: '#F2ECDF',
    textPrimary: '#1C1A17',
    textSecondary: '#57514A',
    textOnAccent: '#FFFFFF',
    accent: '#1F3A5F',
    accentSoft: '#E4EAF2',
    textOnAccentSoft: '#1F3A5F',
    ochre: '#7A5417',
    ochreSoft: '#F3E8D3',
    success: '#3E6B4F',
    border: 'rgba(28, 26, 23, 0.14)',
    icon: '#6B6459',
  },
  dark: {
    bgCanvas: '#121212',
    bgSurface: '#1E1C1A',
    bgElevated: '#262320',
    textPrimary: '#E8E4DC',
    textSecondary: '#B3ADA3',
    textOnAccent: '#0E1620',
    accent: '#7FA8D8',
    accentSoft: '#1D2B3C',
    textOnAccentSoft: '#A9C4E4',
    ochre: '#D9AE6A',
    ochreSoft: '#2C2417',
    success: '#7FB093',
    border: 'rgba(232, 228, 220, 0.16)',
    icon: '#948D81',
  },
  nightWarm: {
    bgCanvas: '#1A1410',
    bgSurface: '#231B14',
    bgElevated: '#2B2118',
    textPrimary: '#E8D8C0',
    textSecondary: '#B29B7C',
    textOnAccent: '#1A1410',
    accent: '#D9AE6A',
    accentSoft: '#2C2417',
    textOnAccentSoft: '#D9AE6A',
    ochre: '#D9AE6A',
    ochreSoft: '#2C2417',
    success: '#9DB58F',
    border: 'rgba(232, 216, 192, 0.16)',
    icon: '#9C8B72',
  },
};

/** Spacing scale — the only allowed gaps/paddings. */
export const spacing = { xs: 4, s: 8, m: 12, l: 16, xl: 24, xxl: 32, xxxl: 48 } as const;

/** Radius family — cards 12, controls 8. Nothing else. */
export const radius = { card: 12, control: 8 } as const;

/** Type scale (pt). */
export const fontSize = {
  display: 34,
  title: 28,
  h1: 24,
  h2: 20,
  body: 17,
  callout: 15,
  caption: 13,
  micro: 11,
} as const;

/**
 * Font families. Serif (Literata) for reading content, sans (Source Sans 3)
 * for UI, Amiri Quran for Quranic Arabic. All pinned SIL-OFL artifacts.
 */
export const fonts = {
  serif: 'Literata-Regular',
  serifMedium: 'Literata-Medium',
  serifSemiBold: 'Literata-SemiBold',
  sans: 'SourceSans3-Regular',
  sansMedium: 'SourceSans3-Medium',
  sansSemiBold: 'SourceSans3-Semibold',
  quran: 'AmiriQuran',
  /** Urdu content face — Nastaliq needs ~1.9-2.1 line-height (docs/DESIGN.md). */
  nastaliq: 'NotoNastaliqUrdu',
} as const;

/** Multiplier applied to Latin line-heights when rendering Urdu Nastaliq. */
export const URDU_LINE_HEIGHT_FACTOR = 1.55;

/** Quranic Arabic sizing: generous size + ~2.0 leading for stacked tashkeel. */
export const quranType = {
  ayahSize: 28,
  ayahLineHeight: 56,
  surahNameSize: 20,
  surahNameLineHeight: 36,
} as const;

/** Motion durations (ms) — transform/opacity only, ease-in-out. */
export const duration = { fast: 200, normal: 250, slow: 300 } as const;

/** Cap Dynamic Type scaling so layouts degrade gracefully, not brokenly. */
export const MAX_FONT_SCALE = 1.4;

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
