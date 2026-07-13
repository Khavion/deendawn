import { Coordinates, HighLatitudeRule, Madhab, PrayerTimes } from 'adhan';

import { methodParams } from './methods';
import { DayPrayerTimes, GeoCoordinates, NextPrayerInfo, PrayerSettings } from './types';

/**
 * Prayer times for the calendar day containing `date` (interpreted in the
 * device's local timezone, which is what a user standing at `coords` expects).
 * Returned Dates are absolute instants; format them in the display timezone.
 * At extreme latitudes a prayer can be uncomputable for some settings — those
 * come back as Invalid Date from adhan and are surfaced as null by callers
 * that need it (see isValidTime).
 */
export function computeDayTimes(
  coords: GeoCoordinates,
  date: Date,
  settings: PrayerSettings
): DayPrayerTimes {
  const coordinates = new Coordinates(coords.latitude, coords.longitude);
  const params = methodParams(settings.method);
  params.madhab = settings.madhab === 'hanafi' ? Madhab.Hanafi : Madhab.Shafi;
  params.highLatitudeRule =
    settings.highLatRule === 'auto'
      ? HighLatitudeRule.recommended(coordinates)
      : settings.highLatRule;

  const t = new PrayerTimes(coordinates, date, params);
  return {
    fajr: t.fajr,
    sunrise: t.sunrise,
    dhuhr: t.dhuhr,
    asr: t.asr,
    maghrib: t.maghrib,
    isha: t.isha,
  };
}

export function isValidTime(d: Date): boolean {
  return !Number.isNaN(d.getTime());
}

/** The five notification-relevant prayers, in day order. */
const ADHAN_PRAYERS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;

/**
 * Next adhan after `now`, rolling over to tomorrow's fajr once isha has
 * passed. Skips prayers that are uncomputable for the day (extreme latitude).
 */
export function nextPrayer(
  coords: GeoCoordinates,
  now: Date,
  settings: PrayerSettings
): NextPrayerInfo | null {
  const today = computeDayTimes(coords, now, settings);
  for (const prayer of ADHAN_PRAYERS) {
    const time = today[prayer];
    if (isValidTime(time) && time.getTime() > now.getTime()) {
      return { prayer, time, isTomorrow: false };
    }
  }
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 12);
  const t = computeDayTimes(coords, tomorrow, settings);
  for (const prayer of ADHAN_PRAYERS) {
    const time = t[prayer];
    if (isValidTime(time)) return { prayer, time, isTomorrow: true };
  }
  return null;
}
