/**
 * @jest-environment node
 */
import {
  DEFAULT_NOTIFICATION_PREFS,
  daysCovered,
  diffPlans,
  MIN_DAYS_COVERED,
  NOTIFICATION_CAP,
  planNotifications,
} from '../scheduler';
import { PrayerSettings } from '../../prayer-times/types';

const HOUSTON = { latitude: 29.7604, longitude: -95.3698 };
const ANCHORAGE = { latitude: 61.2181, longitude: -149.9003 };
const SETTINGS: PrayerSettings = { method: 'NorthAmerica', madhab: 'shafi', highLatRule: 'auto' };
// 3 AM local: before fajr, so day 0 contributes all five prayers.
const NOW = new Date(2026, 6, 13, 3, 0, 0);

const basePlan = (overrides: Partial<Parameters<typeof planNotifications>[0]> = {}) =>
  planNotifications({
    coords: HOUSTON,
    settings: SETTINGS,
    prefs: DEFAULT_NOTIFICATION_PREFS,
    now: NOW,
    ...overrides,
  });

describe('planNotifications', () => {
  test('covers at least 7 days within the iOS cap, sorted, unique ids, all future', () => {
    const plan = basePlan();
    expect(plan.length).toBeLessThanOrEqual(NOTIFICATION_CAP);
    expect(daysCovered(plan, NOW)).toBeGreaterThanOrEqual(MIN_DAYS_COVERED);
    expect(new Set(plan.map((p) => p.id)).size).toBe(plan.length);
    for (let i = 1; i < plan.length; i++) {
      expect(plan[i].fireDate.getTime()).toBeGreaterThanOrEqual(plan[i - 1].fireDate.getTime());
    }
    expect(plan.every((p) => p.fireDate.getTime() > NOW.getTime())).toBe(true);
  });

  test('cap is respected even when asked for far more days', () => {
    const plan = basePlan({ days: 30 });
    expect(plan.length).toBe(NOTIFICATION_CAP);
    // Capped plan still covers at least the constitutional minimum.
    expect(daysCovered(plan, NOW)).toBeGreaterThanOrEqual(MIN_DAYS_COVERED);
  });

  test('disabled prayers are omitted entirely', () => {
    const prefs = {
      ...DEFAULT_NOTIFICATION_PREFS,
      enabled: { ...DEFAULT_NOTIFICATION_PREFS.enabled, fajr: false, isha: false },
    };
    const plan = basePlan({ prefs });
    expect(plan.some((p) => p.prayer === 'fajr' || p.prayer === 'isha')).toBe(false);
    expect(plan.some((p) => p.prayer === 'dhuhr')).toBe(true);
  });

  test("mid-day start excludes today's past prayers and includes the rest", () => {
    const afternoon = new Date(2026, 6, 13, 15, 0, 0); // between asr and maghrib in Houston
    const plan = basePlan({ now: afternoon });
    const todayIds = plan.filter((p) => p.id.endsWith('2026-07-13')).map((p) => p.prayer);
    expect(todayIds).not.toContain('fajr');
    expect(todayIds).not.toContain('dhuhr');
    expect(todayIds).toContain('maghrib');
    expect(todayIds).toContain('isha');
  });

  test('rescheduling right after a fire yields the next prayer first', () => {
    const plan = basePlan();
    const maghrib = plan.find((p) => p.prayer === 'maghrib')!;
    const justAfter = new Date(maghrib.fireDate.getTime() + 1000);
    const replan = basePlan({ now: justAfter });
    expect(replan[0].prayer).toBe('isha');
    expect(replan.every((p) => p.fireDate.getTime() > justAfter.getTime())).toBe(true);
  });

  test('uncomputable high-latitude times are skipped, not crashed on', () => {
    const midsummer = new Date(2026, 5, 20, 3, 0, 0);
    const plan = planNotifications({
      coords: ANCHORAGE,
      settings: { method: 'MoonsightingCommittee', madhab: 'shafi', highLatRule: 'auto' },
      prefs: DEFAULT_NOTIFICATION_PREFS,
      now: midsummer,
    });
    expect(plan.every((p) => !Number.isNaN(p.fireDate.getTime()))).toBe(true);
    expect(plan.some((p) => p.prayer === 'dhuhr')).toBe(true);
  });

  test('per-prayer sound choice flows through', () => {
    const prefs = {
      ...DEFAULT_NOTIFICATION_PREFS,
      sound: { ...DEFAULT_NOTIFICATION_PREFS.sound, fajr: 'silent' as const },
    };
    const plan = basePlan({ prefs });
    expect(plan.find((p) => p.prayer === 'fajr')!.sound).toBe('silent');
    expect(plan.find((p) => p.prayer === 'dhuhr')!.sound).toBe('default');
  });

  test('deterministic: identical inputs produce identical plans', () => {
    expect(basePlan()).toEqual(basePlan());
  });

  test('planning is fast (constitution: scheduling job < 500ms)', () => {
    const start = Date.now();
    basePlan({ days: 14 });
    expect(Date.now() - start).toBeLessThan(500);
  });
});

describe('suhoor reminder (Ramadan mode)', () => {
  // 1 Ramadan 1447 = 2026-02-18 (verified in hijri tests).
  const IN_RAMADAN = new Date(2026, 1, 20, 3, 0, 0);
  const OUT_OF_RAMADAN = new Date(2026, 6, 13, 3, 0, 0);

  test('adds a pre-fajr reminder 30 min before fajr on Ramadan days only', () => {
    const plan = basePlan({ now: IN_RAMADAN, suhoorReminderMinutes: 30 });
    const suhoors = plan.filter((p) => p.kind === 'suhoor');
    expect(suhoors.length).toBeGreaterThanOrEqual(7);
    for (const s of suhoors) {
      expect(s.id).toMatch(/^suhoor-\d{4}-\d{2}-\d{2}$/);
      const fajr = plan.find(
        (p) => p.kind === 'adhan' && p.prayer === 'fajr' && p.id.endsWith(s.id.slice(7))
      );
      expect(fajr).toBeDefined();
      expect(fajr!.fireDate.getTime() - s.fireDate.getTime()).toBe(30 * 60_000);
    }
  });

  test('no reminders outside Ramadan or when disabled', () => {
    expect(
      basePlan({ now: OUT_OF_RAMADAN, suhoorReminderMinutes: 30 }).filter(
        (p) => p.kind === 'suhoor'
      )
    ).toHaveLength(0);
    expect(basePlan({ now: IN_RAMADAN }).filter((p) => p.kind === 'suhoor')).toHaveLength(0);
    expect(
      basePlan({ now: IN_RAMADAN, suhoorReminderMinutes: null }).filter((p) => p.kind === 'suhoor')
    ).toHaveLength(0);
  });

  test('total plan stays within the cap with reminders on', () => {
    const plan = basePlan({ now: IN_RAMADAN, suhoorReminderMinutes: 30, days: 30 });
    expect(plan.length).toBeLessThanOrEqual(NOTIFICATION_CAP);
  });
});

describe('diffPlans', () => {
  test('unchanged pending entries are kept, stale ones cancelled, new ones scheduled', () => {
    const plan = basePlan();
    const pending = [
      { id: plan[0].id, fireDate: plan[0].fireDate, sound: plan[0].sound }, // unchanged
      { id: plan[1].id, fireDate: new Date(plan[1].fireDate.getTime() + 60_000) }, // time drifted
      { id: 'fajr-2020-01-01', fireDate: new Date(2020, 0, 1) }, // stale
    ];
    const actions = diffPlans(pending, plan);
    expect(actions.keepIds).toEqual([plan[0].id]);
    expect(actions.cancelIds.sort()).toEqual([plan[1].id, 'fajr-2020-01-01'].sort());
    expect(actions.schedule.map((p) => p.id)).not.toContain(plan[0].id);
    expect(actions.schedule.map((p) => p.id)).toContain(plan[1].id);
    expect(actions.schedule.length).toBe(plan.length - 1);
  });

  test('empty pending schedules the whole plan', () => {
    const plan = basePlan();
    const actions = diffPlans([], plan);
    expect(actions.cancelIds).toEqual([]);
    expect(actions.schedule).toEqual(plan);
  });
});
