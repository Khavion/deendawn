/**
 * @jest-environment node
 */
import { createMemoryKVStore } from '../../../lib/kvStore';

type Scheduled = {
  identifier: string;
  content: { data?: Record<string, unknown> };
  trigger: { type: string; date: Date };
};

const state: {
  pending: Scheduled[];
  granted: boolean;
  scheduleCalls: number;
  cancelCalls: number;
} = { pending: [], granted: true, scheduleCalls: 0, cancelCalls: 0 };

jest.mock('expo-notifications', () => ({
  SchedulableTriggerInputTypes: { DATE: 'date' },
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(async () => ({ granted: state.granted, canAskAgain: true })),
  requestPermissionsAsync: jest.fn(async () => ({ granted: state.granted })),
  getAllScheduledNotificationsAsync: jest.fn(async () =>
    state.pending.map((p) => ({
      identifier: p.identifier,
      content: p.content,
      trigger: { type: 'date', value: p.trigger.date.getTime() },
    }))
  ),
  scheduleNotificationAsync: jest.fn(async (req: Scheduled) => {
    state.scheduleCalls++;
    state.pending.push(req);
    return req.identifier;
  }),
  cancelScheduledNotificationAsync: jest.fn(async (id: string) => {
    state.cancelCalls++;
    state.pending = state.pending.filter((p) => p.identifier !== id);
  }),
}));

// Import after the mock so the service binds to it.
// eslint-disable-next-line import/first
import { rescheduleAll } from '../service';

const NOW = new Date(2026, 6, 13, 3, 0, 0);
const HOUSTON_SETTINGS = JSON.stringify({
  location: { type: 'manual', cityId: 'houston-us' },
  method: 'auto',
  madhab: 'shafi',
  highLatRule: 'auto',
});

jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageTag: 'en-US' }],
}));

beforeEach(() => {
  state.pending = [];
  state.granted = true;
  state.scheduleCalls = 0;
  state.cancelCalls = 0;
});

describe('rescheduleAll', () => {
  test('fills the OS queue with the rolling plan (8 days x 5 prayers)', async () => {
    const store = createMemoryKVStore({ 'settings.v1': HOUSTON_SETTINGS });
    await rescheduleAll(NOW, store);
    expect(state.scheduleCalls).toBe(40);
    expect(state.pending.length).toBe(40);
    expect(state.pending.every((p) => p.trigger.date.getTime() > NOW.getTime())).toBe(true);
    expect(
      state.pending.every((p) =>
        /^(fajr|dhuhr|asr|maghrib|isha)-\d{4}-\d{2}-\d{2}$/.test(p.identifier)
      )
    ).toBe(true);
  });

  test('second run at the same moment is a no-op (idempotent)', async () => {
    const store = createMemoryKVStore({ 'settings.v1': HOUSTON_SETTINGS });
    await rescheduleAll(NOW, store);
    const after = state.scheduleCalls;
    await rescheduleAll(NOW, store);
    expect(state.scheduleCalls).toBe(after);
    expect(state.cancelCalls).toBe(0);
  });

  test('a day later, stale entries are cancelled and the horizon extends', async () => {
    const store = createMemoryKVStore({ 'settings.v1': HOUSTON_SETTINGS });
    await rescheduleAll(NOW, store);
    const nextDay = new Date(2026, 6, 14, 3, 0, 0);
    await rescheduleAll(nextDay, store);
    // Day-13 entries (already fired) are gone from the plan; day-21 added.
    expect(state.pending.some((p) => p.identifier.endsWith('2026-07-13'))).toBe(false);
    expect(state.pending.some((p) => p.identifier.endsWith('2026-07-21'))).toBe(true);
    expect(state.pending.length).toBe(40);
  });

  test('no location -> schedules nothing', async () => {
    const store = createMemoryKVStore();
    await rescheduleAll(NOW, store);
    expect(state.scheduleCalls).toBe(0);
  });

  test('permission not granted -> schedules nothing (and never prompts)', async () => {
    state.granted = false;
    const store = createMemoryKVStore({ 'settings.v1': HOUSTON_SETTINGS });
    await rescheduleAll(NOW, store);
    expect(state.scheduleCalls).toBe(0);
  });

  test('disabled prayer prefs are honored', async () => {
    const store = createMemoryKVStore({
      'settings.v1': HOUSTON_SETTINGS,
      'notificationPrefs.v1': JSON.stringify({
        enabled: { fajr: false, dhuhr: true, asr: true, maghrib: true, isha: true },
        sound: {},
      }),
    });
    await rescheduleAll(NOW, store);
    expect(state.pending.some((p) => p.identifier.startsWith('fajr-'))).toBe(false);
    expect(state.pending.length).toBe(32); // 8 days x 4 prayers
  });
});
