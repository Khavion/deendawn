import { isRamadan } from '../hijri/hijri';
import { computeDayTimes, isValidTime } from '../prayer-times/engine';
import { GeoCoordinates, PrayerSettings } from '../prayer-times/types';

/** The five adhan notifications. Sunrise is informational only, never notified. */
export const ADHAN_PRAYERS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;
export type AdhanPrayer = (typeof ADHAN_PRAYERS)[number];

export type SoundKey = 'default' | 'silent' | 'clip' | 'fullAdhan';

export interface NotificationPrefs {
  enabled: Record<AdhanPrayer, boolean>;
  sound: Record<AdhanPrayer, SoundKey>;
}

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  enabled: { fajr: true, dhuhr: true, asr: true, maghrib: true, isha: true },
  sound: { fajr: 'default', dhuhr: 'default', asr: 'default', maghrib: 'default', isha: 'default' },
};

export interface PlannedNotification {
  /** Deterministic id (`fajr-2026-07-13`, `suhoor-2026-02-19`). */
  id: string;
  prayer: AdhanPrayer;
  fireDate: Date;
  sound: SoundKey;
  /** Ramadan pre-Fajr reminder vs regular adhan. */
  kind: 'adhan' | 'suhoor';
}

/**
 * iOS silently drops everything past 64 pending local notifications. We plan
 * to a lower cap to leave headroom for future reminder types (pre-fajr
 * suhoor alarm etc.).
 */
export const NOTIFICATION_CAP = 60;
/** Constitution: keep at least 7 days scheduled at all times. */
export const MIN_DAYS_COVERED = 7;

const dateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/**
 * Pure rolling plan: next `days` days of enabled adhans strictly after `now`,
 * capped. Uncomputable times (extreme latitudes) are skipped. Output is
 * sorted by fire time and deterministic for identical inputs.
 */
export function planNotifications(opts: {
  coords: GeoCoordinates;
  settings: PrayerSettings;
  prefs: NotificationPrefs;
  now: Date;
  days?: number;
  cap?: number;
  /** Ramadan suhoor reminder: minutes before Fajr, null/undefined = off. */
  suhoorReminderMinutes?: number | null;
  hijriOffset?: -1 | 0 | 1;
}): PlannedNotification[] {
  const { coords, settings, prefs, now } = opts;
  const days = opts.days ?? MIN_DAYS_COVERED + 1;
  const cap = opts.cap ?? NOTIFICATION_CAP;

  const planned: PlannedNotification[] = [];
  for (let offset = 0; offset < days; offset++) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset, 12);
    const times = computeDayTimes(coords, day, settings);
    for (const prayer of ADHAN_PRAYERS) {
      if (!prefs.enabled[prayer]) continue;
      const t = times[prayer];
      if (!isValidTime(t) || t.getTime() <= now.getTime()) continue;
      planned.push({
        id: `${prayer}-${dateKey(day)}`,
        prayer,
        fireDate: t,
        sound: prefs.sound[prayer],
        kind: 'adhan',
      });
    }
    const suhoorMin = opts.suhoorReminderMinutes;
    if (suhoorMin && isValidTime(times.fajr) && isRamadan(day, opts.hijriOffset ?? 0)) {
      const fireDate = new Date(times.fajr.getTime() - suhoorMin * 60_000);
      if (fireDate.getTime() > now.getTime()) {
        planned.push({
          id: `suhoor-${dateKey(day)}`,
          prayer: 'fajr',
          fireDate,
          sound: 'default',
          kind: 'suhoor',
        });
      }
    }
  }
  planned.sort((a, b) => a.fireDate.getTime() - b.fireDate.getTime());
  return planned.slice(0, cap);
}

export interface RescheduleActions {
  cancelIds: string[];
  schedule: PlannedNotification[];
  /** Ids already pending with an identical fire time — left untouched. */
  keepIds: string[];
}

/**
 * Minimal diff between what's pending in the OS and the fresh plan. Sound or
 * time changes reschedule the id (cancel + schedule).
 */
export function diffPlans(
  pending: { id: string; fireDate: Date; sound?: string }[],
  plan: PlannedNotification[]
): RescheduleActions {
  const planById = new Map(plan.map((p) => [p.id, p]));

  const cancelIds: string[] = [];
  const keepIds: string[] = [];
  for (const p of pending) {
    const match = planById.get(p.id);
    if (
      match &&
      match.fireDate.getTime() === p.fireDate.getTime() &&
      (p.sound === undefined || p.sound === match.sound)
    ) {
      keepIds.push(p.id);
    } else {
      cancelIds.push(p.id);
    }
  }
  const kept = new Set(keepIds);
  const schedule = plan.filter((p) => !kept.has(p.id));
  return { cancelIds, schedule, keepIds };
}

/** Days fully covered by a plan, counting from `now`'s calendar day. */
export function daysCovered(plan: PlannedNotification[], now: Date): number {
  if (plan.length === 0) return 0;
  const last = plan[plan.length - 1].fireDate;
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfLastDay = new Date(last.getFullYear(), last.getMonth(), last.getDate());
  return Math.round((startOfLastDay.getTime() - startOfToday.getTime()) / 86_400_000);
}
