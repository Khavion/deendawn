import type { DayPrayerTimes } from '../prayer-times/types';

/**
 * Data the Home Screen widget reads (research Rec #3/#12).
 *
 * The app computes prayer times on-device and writes this snapshot to the
 * shared App Group; the native WidgetKit widget reads it and shows a live
 * countdown to the next prayer WITHOUT the app running (its timeline refreshes
 * at each prayer). This module is the pure, serializable contract + the same
 * "which prayer is next" logic the Swift side mirrors — kept here so it is
 * unit-tested and stays the single source of truth. No network, no tracking:
 * the widget only ever displays times already computed on the device.
 */

export const WIDGET_PRAYER_KEYS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;
export type WidgetPrayerKey = (typeof WIDGET_PRAYER_KEYS)[number];

export interface WidgetPrayer {
  key: WidgetPrayerKey;
  /** ISO-8601 instant. */
  iso: string;
}

export interface WidgetSnapshot {
  cityLabel: string;
  /** IANA zone, so the widget formats in the city's local time. */
  timeZone: string;
  generatedAtIso: string;
  /** Today's five prayers plus tomorrow's fajr, chronological. */
  prayers: WidgetPrayer[];
}

/**
 * Build the snapshot from today's times + tomorrow's fajr. Including tomorrow's
 * fajr guarantees there is always a "next" prayer after isha, so the widget
 * never shows an empty state late at night.
 */
export function buildWidgetSnapshot(
  today: DayPrayerTimes,
  tomorrowFajr: Date,
  cityLabel: string,
  timeZone: string,
  now: Date
): WidgetSnapshot {
  const prayers: WidgetPrayer[] = WIDGET_PRAYER_KEYS.map((key) => ({
    key,
    iso: today[key].toISOString(),
  }));
  prayers.push({ key: 'fajr', iso: tomorrowFajr.toISOString() });
  return {
    cityLabel,
    timeZone,
    generatedAtIso: now.toISOString(),
    prayers,
  };
}

/**
 * The next prayer at `now` from a snapshot: the first entry strictly after now.
 * Pure — the Swift TimelineProvider computes the identical thing. Returns null
 * only if the snapshot is exhausted (all entries in the past → app must refresh).
 */
export function nextFromSnapshot(snapshot: WidgetSnapshot, now: Date): WidgetPrayer | null {
  const t = now.getTime();
  for (const p of snapshot.prayers) {
    if (new Date(p.iso).getTime() > t) return p;
  }
  return null;
}

/** True when the snapshot no longer covers `now` and the app should rewrite it. */
export function isSnapshotStale(snapshot: WidgetSnapshot, now: Date): boolean {
  return nextFromSnapshot(snapshot, now) === null;
}
