import type { DayPeriod } from '@/src/lib/theme/tokens';

/** The subset of the day's times the period logic needs (all local Dates). */
export interface PeriodTimes {
  fajr: Date;
  sunrise: Date;
  asr: Date;
  maghrib: Date;
  isha: Date;
}

/**
 * Which "sky" period we're in right now, for the Home ambient gradient
 * (docs/RICH_DESIGN_SPEC.md). Invalid (high-latitude) boundary times compare
 * false and are skipped gracefully, falling through to night.
 */
export function currentPeriod(now: Date, times: PeriodTimes): DayPeriod {
  const t = now.getTime();
  if (t < times.fajr.getTime()) return 'isha';
  if (t < times.sunrise.getTime()) return 'fajr';
  if (t < times.asr.getTime()) return 'day';
  if (t < times.maghrib.getTime()) return 'asr';
  if (t < times.isha.getTime()) return 'maghrib';
  return 'isha';
}

/** The prayer whose window this period belongs to (for the period eyebrow). */
const PERIOD_PRAYER = {
  fajr: 'fajr',
  day: 'dhuhr',
  asr: 'asr',
  maghrib: 'maghrib',
  isha: 'isha',
} as const;
export function periodPrayer(period: DayPeriod): (typeof PERIOD_PRAYER)[DayPeriod] {
  return PERIOD_PRAYER[period];
}

/** i18n key suffix for the period word ("dawn", "night", …). */
const PERIOD_WORD: Record<DayPeriod, string> = {
  fajr: 'dawn',
  day: 'day',
  asr: 'afternoon',
  maghrib: 'dusk',
  isha: 'night',
};
export function periodWord(period: DayPeriod): string {
  return PERIOD_WORD[period];
}
