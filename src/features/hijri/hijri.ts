import umalqura from '@umalqura/core';

/**
 * Umm al-Qura calendar wrapper. Everything here is CALCULATED — the UI must
 * always carry the "may differ from local moonsighting" disclaimer, and the
 * user's ±1 day offset (Settings) is applied before any display or detection.
 */
export interface HijriDate {
  year: number;
  /** 1–12 (9 = Ramadan). */
  month: number;
  day: number;
  /** i18n key: hijriMonths.<1-12> */
  monthKey: string;
}

export type HijriOffset = -1 | 0 | 1;

const DAY_MS = 86_400_000;

export function toHijri(date: Date, offset: HijriOffset = 0): HijriDate {
  const adjusted = new Date(date.getTime() + offset * DAY_MS);
  const u = umalqura(adjusted);
  return { year: u.hy, month: u.hm, day: u.hd, monthKey: `hijriMonths.${u.hm}` };
}

/** Gregorian Date (local midday, DST-safe) for a Hijri day, offset-aware. */
export function fromHijri(year: number, month: number, day: number, offset: HijriOffset = 0): Date {
  const u = umalqura(year, month, day);
  const d = new Date(u.date.getTime() - offset * DAY_MS);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12);
}

export function daysInHijriMonth(year: number, month: number): number {
  return umalqura(year, month, 1).daysInMonth;
}

export function isRamadan(date: Date, offset: HijriOffset = 0): boolean {
  return toHijri(date, offset).month === 9;
}

export interface KeyDate {
  day: number;
  /** i18n key under hijriDates.* — labels are copy, flagged in SCHOLAR_REVIEW. */
  labelKey: string;
}

/**
 * Widely observed calendar markers for a Hijri month. Fixed facts of the
 * calendar scheme (not rulings): Ramadan 1/9, Eid al-Fitr 1/10, Eid al-Adha
 * 10/12, Dhul-Hijjah 1–10, Ashura 10/1, and the white days 13–15.
 */
export function keyDatesFor(month: number): KeyDate[] {
  const dates: KeyDate[] = [];
  if (month === 1) dates.push({ day: 10, labelKey: 'hijriDates.ashura' });
  if (month === 9) dates.push({ day: 1, labelKey: 'hijriDates.ramadanStart' });
  if (month === 10) dates.push({ day: 1, labelKey: 'hijriDates.eidAlFitr' });
  if (month === 12) {
    for (let d = 1; d <= 9; d++) dates.push({ day: d, labelKey: 'hijriDates.dhulHijjah' });
    dates.push({ day: 10, labelKey: 'hijriDates.eidAlAdha' });
  }
  for (const day of [13, 14, 15]) dates.push({ day, labelKey: 'hijriDates.whiteDay' });
  return dates.sort((a, b) => a.day - b.day);
}
