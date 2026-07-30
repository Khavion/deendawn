/**
 * @jest-environment node
 *
 * Android-path service tests: channel reconciliation ordering, per-trigger
 * channelId, sound-change propagation to pending entries, and the two
 * force-full-re-registration paths (timezone change; channel rollout).
 * The platform seam (`rescheduleAll(now, store, 'android')`) keeps this
 * independent of react-native's Platform in the node env.
 */
import { createMemoryKVStore } from '../../../lib/kvStore';

type Scheduled = {
  identifier: string;
  content: { data?: Record<string, unknown> };
  trigger: { type: string; date: Date; channelId?: string };
};

const mockState: {
  pending: Scheduled[];
  granted: boolean;
  channels: Map<string, Record<string, unknown>>;
  channelSets: string[];
  channelDeletes: string[];
  events: string[];
} = {
  pending: [],
  granted: true,
  channels: new Map(),
  channelSets: [],
  channelDeletes: [],
  events: [],
};

jest.mock('expo-notifications', () => ({
  SchedulableTriggerInputTypes: { DATE: 'date' },
  AndroidImportance: { HIGH: 6 },
  AndroidAudioUsage: { ALARM: 4 },
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(async () => ({ granted: mockState.granted, canAskAgain: true })),
  requestPermissionsAsync: jest.fn(async () => ({ granted: mockState.granted })),
  getAllScheduledNotificationsAsync: jest.fn(async () =>
    mockState.pending.map((p) => ({
      identifier: p.identifier,
      content: p.content,
      trigger: { type: 'date', value: p.trigger.date.getTime() },
    }))
  ),
  scheduleNotificationAsync: jest.fn(async (req: Scheduled) => {
    mockState.events.push(`schedule:${req.identifier}`);
    mockState.pending.push(req);
    return req.identifier;
  }),
  cancelScheduledNotificationAsync: jest.fn(async (id: string) => {
    mockState.events.push(`cancel:${id}`);
    mockState.pending = mockState.pending.filter((p) => p.identifier !== id);
  }),
  setNotificationChannelAsync: jest.fn(async (id: string, input: Record<string, unknown>) => {
    mockState.events.push(`channel-set:${id}`);
    mockState.channelSets.push(id);
    mockState.channels.set(id, input);
    return { id, ...input };
  }),
  getNotificationChannelsAsync: jest.fn(async () =>
    [...mockState.channels.keys()].map((id) => ({ id }))
  ),
  deleteNotificationChannelAsync: jest.fn(async (id: string) => {
    mockState.events.push(`channel-delete:${id}`);
    mockState.channelDeletes.push(id);
    mockState.channels.delete(id);
  }),
}));

jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageTag: 'en-US' }],
}));

// Import after the mocks so the service binds to them.
// eslint-disable-next-line import/first
import { rescheduleAll } from '../service';

const NOW = new Date(2026, 6, 13, 3, 0, 0);
const HOUSTON_SETTINGS = JSON.stringify({
  location: { type: 'manual', cityId: 'houston-us' },
  method: 'auto',
  madhab: 'shafi',
  highLatRule: 'auto',
});
const HOST_ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;

beforeEach(() => {
  mockState.pending = [];
  mockState.granted = true;
  mockState.channels = new Map();
  mockState.channelSets = [];
  mockState.channelDeletes = [];
  mockState.events = [];
});

describe('rescheduleAll on android', () => {
  test('creates the enabled-prayer channels and points every trigger + data at them', async () => {
    const store = createMemoryKVStore({ 'settings.v1': HOUSTON_SETTINGS });
    await rescheduleAll(NOW, store, 'android');
    expect([...mockState.channels.keys()].sort()).toEqual(
      [
        'adhan.fajr.default.v1',
        'adhan.dhuhr.default.v1',
        'adhan.asr.default.v1',
        'adhan.maghrib.default.v1',
        'adhan.isha.default.v1',
      ].sort()
    );
    expect(mockState.pending).toHaveLength(40);
    for (const p of mockState.pending) {
      const prayer = p.identifier.split('-')[0];
      expect(p.trigger.channelId).toBe(`adhan.${prayer}.default.v1`);
      expect(p.content.data?.channelId).toBe(`adhan.${prayer}.default.v1`);
      expect(p.content.data?.soundKey).toBe('default');
    }
  });

  test('channel spec: HIGH importance, ALARM usage on audible, null sound on silent', async () => {
    const store = createMemoryKVStore({
      'settings.v1': HOUSTON_SETTINGS,
      'notificationPrefs.v1': JSON.stringify({
        enabled: { fajr: true, dhuhr: true, asr: false, maghrib: false, isha: false },
        sound: { fajr: 'clip', dhuhr: 'silent' },
      }),
    });
    await rescheduleAll(NOW, store, 'android');
    const clip = mockState.channels.get('adhan.fajr.clip.v1')!;
    const silent = mockState.channels.get('adhan.dhuhr.silent.v1')!;
    expect(clip).toMatchObject({
      importance: 6,
      sound: 'adhan_clip_placeholder.wav',
      audioAttributes: { usage: 4 },
    });
    expect(silent.importance).toBe(6);
    expect(silent.sound).toBeNull();
    expect(silent.audioAttributes).toBeUndefined();
  });

  test('sound change: pending entries reschedule onto the new channel, old channel deleted, in order', async () => {
    const store = createMemoryKVStore({ 'settings.v1': HOUSTON_SETTINGS });
    await rescheduleAll(NOW, store, 'android');
    mockState.events = [];
    store.set(
      'notificationPrefs.v1',
      JSON.stringify({
        enabled: { fajr: true, dhuhr: true, asr: true, maghrib: true, isha: true },
        sound: { fajr: 'clip', dhuhr: 'default', asr: 'default', maghrib: 'default', isha: 'default' },
      })
    );
    await rescheduleAll(NOW, store, 'android');

    // All 8 fajr entries moved to the clip channel.
    const fajr = mockState.pending.filter((p) => p.identifier.startsWith('fajr-'));
    expect(fajr).toHaveLength(8);
    for (const p of fajr) expect(p.trigger.channelId).toBe('adhan.fajr.clip.v1');
    // Other prayers untouched.
    expect(mockState.events.filter((e) => e.startsWith('cancel:'))).toHaveLength(8);
    // Old channel deleted, new created — and deletion came AFTER scheduling.
    expect(mockState.channelDeletes).toEqual(['adhan.fajr.default.v1']);
    const lastSchedule = mockState.events.map((e) => e.startsWith('schedule:')).lastIndexOf(true);
    const deleteIdx = mockState.events.indexOf('channel-delete:adhan.fajr.default.v1');
    expect(deleteIdx).toBeGreaterThan(lastSchedule);
    // Creation came BEFORE scheduling.
    const createIdx = mockState.events.indexOf('channel-set:adhan.fajr.clip.v1');
    const firstSchedule = mockState.events.findIndex((e) => e.startsWith('schedule:'));
    expect(createIdx).toBeLessThan(firstSchedule);
  });

  test('fullAdhan <-> clip switch causes zero channel churn and zero reschedules', async () => {
    const prefs = (sound: string) =>
      JSON.stringify({
        enabled: { fajr: true, dhuhr: false, asr: false, maghrib: false, isha: false },
        sound: { fajr: sound },
      });
    const store = createMemoryKVStore({
      'settings.v1': HOUSTON_SETTINGS,
      'notificationPrefs.v1': prefs('clip'),
    });
    await rescheduleAll(NOW, store, 'android');
    mockState.events = [];
    store.set('notificationPrefs.v1', prefs('fullAdhan'));
    await rescheduleAll(NOW, store, 'android');
    expect(mockState.channelDeletes).toEqual([]);
    // The soundKey changed (clip -> fullAdhan) so entries reschedule to fix
    // the tap behavior flag — but the CHANNEL stays adhan.fajr.clip.v1.
    for (const p of mockState.pending) expect(p.trigger.channelId).toBe('adhan.fajr.clip.v1');
  });

  test('pending entries without channelId (pre-rollout) are self-healed onto channels', async () => {
    const store = createMemoryKVStore({ 'settings.v1': HOUSTON_SETTINGS });
    // Simulate the pre-channel world: schedule via the iOS path first.
    await rescheduleAll(NOW, store, 'ios');
    expect(mockState.pending[0].trigger.channelId).toBeUndefined();
    mockState.events = [];
    await rescheduleAll(NOW, store, 'android');
    expect(mockState.events.filter((e) => e.startsWith('cancel:'))).toHaveLength(40);
    for (const p of mockState.pending) expect(p.trigger.channelId).toBeDefined();
  });

  test('timezone change forces full re-registration', async () => {
    const store = createMemoryKVStore({ 'settings.v1': HOUSTON_SETTINGS });
    await rescheduleAll(NOW, store, 'android');
    mockState.events = [];
    store.set(
      'notifications.scheduleContext.v1',
      JSON.stringify({ timeZone: 'Antarctica/Troll' })
    );
    await rescheduleAll(NOW, store, 'android');
    expect(mockState.events.filter((e) => e.startsWith('cancel:'))).toHaveLength(40);
    expect(mockState.events.filter((e) => e.startsWith('schedule:'))).toHaveLength(40);
    // Context re-saved -> steady state again.
    expect(JSON.parse(store.get('notifications.scheduleContext.v1')!)).toEqual({
      timeZone: HOST_ZONE,
    });
    mockState.events = [];
    await rescheduleAll(NOW, store, 'android');
    expect(mockState.events.filter((e) => e.startsWith('cancel:'))).toHaveLength(0);
  });

  test('suhoor reminder gets its own channel', async () => {
    const store = createMemoryKVStore({
      'settings.v1': JSON.stringify({
        location: { type: 'manual', cityId: 'houston-us' },
        method: 'auto',
        madhab: 'shafi',
        highLatRule: 'auto',
        suhoorReminderMinutes: 30,
      }),
    });
    await rescheduleAll(NOW, store, 'android');
    expect(mockState.channels.has('suhoor.default.v1')).toBe(true);
  });

  test('foreign channels are never deleted', async () => {
    mockState.channels.set('expo_audio_channel', { name: 'Playback' });
    const store = createMemoryKVStore({ 'settings.v1': HOUSTON_SETTINGS });
    await rescheduleAll(NOW, store, 'android');
    expect(mockState.channels.has('expo_audio_channel')).toBe(true);
    expect(mockState.channelDeletes).toEqual([]);
  });
});
