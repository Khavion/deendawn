import {
  channelSpec,
  deriveChannelId,
  desiredChannels,
  diffChannels,
  SOUND_SPEC,
} from '../channels';
import { DEFAULT_NOTIFICATION_PREFS, NotificationPrefs } from '../scheduler';

const prefs = (over: Partial<NotificationPrefs> = {}): NotificationPrefs => ({
  enabled: { ...DEFAULT_NOTIFICATION_PREFS.enabled, ...(over.enabled ?? {}) },
  sound: { ...DEFAULT_NOTIFICATION_PREFS.sound, ...(over.sound ?? {}) },
});

describe('deriveChannelId', () => {
  test('derives adhan channel ids as {stream}.{prayer}.{sound}.v{version}', () => {
    expect(deriveChannelId('adhan', 'fajr', 'default')).toBe('adhan.fajr.default.v1');
    expect(deriveChannelId('adhan', 'maghrib', 'silent')).toBe('adhan.maghrib.silent.v1');
    expect(deriveChannelId('adhan', 'isha', 'clip')).toBe('adhan.isha.clip.v1');
  });

  test('fullAdhan maps to the clip channel (no dedicated channel)', () => {
    // Audible behavior at fire time is identical (the clip plays); the
    // tap-opens-app behavior rides content.data, not the channel — so a
    // clip<->fullAdhan switch causes zero channel churn.
    expect(deriveChannelId('adhan', 'fajr', 'fullAdhan')).toBe(
      deriveChannelId('adhan', 'fajr', 'clip')
    );
  });

  test('suhoor derives its own single channel id regardless of prayer/sound', () => {
    expect(deriveChannelId('suhoor', 'fajr', 'default')).toBe('suhoor.default.v1');
    expect(deriveChannelId('suhoor', 'fajr', 'clip')).toBe('suhoor.default.v1');
  });

  test('bumping one sound version changes only that sound family', () => {
    const bumped = { ...SOUND_SPEC, clip: { ...SOUND_SPEC.clip, version: 2 } };
    expect(deriveChannelId('adhan', 'fajr', 'clip', bumped)).toBe('adhan.fajr.clip.v2');
    expect(deriveChannelId('adhan', 'fajr', 'fullAdhan', bumped)).toBe('adhan.fajr.clip.v2');
    expect(deriveChannelId('adhan', 'fajr', 'default', bumped)).toBe('adhan.fajr.default.v1');
    expect(deriveChannelId('adhan', 'fajr', 'silent', bumped)).toBe('adhan.fajr.silent.v1');
  });
});

describe('channelSpec', () => {
  test('silent channel: null sound, still high importance (heads-up parity)', () => {
    const spec = channelSpec('adhan.fajr.silent.v1');
    expect(spec.sound).toBeNull();
    expect(spec.importance).toBe('high');
  });

  test('audible channels carry the alarm audio usage (OEM ringtone-toggle quirk)', () => {
    expect(channelSpec('adhan.dhuhr.clip.v1').audioUsage).toBe('alarm');
    expect(channelSpec('adhan.dhuhr.default.v1').audioUsage).toBe('alarm');
    expect(channelSpec('adhan.fajr.silent.v1').audioUsage).toBeNull();
  });

  test('clip spec filename matches the bundled res/raw asset', () => {
    // The file is staged into res/raw by the expo-notifications plugin
    // `sounds` array (assets/sounds/adhan_clip_placeholder.wav) — Android
    // res/raw names must be [a-z0-9_].
    expect(channelSpec('adhan.asr.clip.v1').sound).toBe('adhan_clip_placeholder.wav');
    expect(SOUND_SPEC.clip.file).toBe('adhan_clip_placeholder.wav');
  });

  test('default-sound channels use the system default (null file, audible)', () => {
    const spec = channelSpec('adhan.asr.default.v1');
    expect(spec.sound).toBe('default');
    expect(spec.importance).toBe('high');
  });

  test('suhoor channel is audible high-importance with the system default sound', () => {
    const spec = channelSpec('suhoor.default.v1');
    expect(spec.sound).toBe('default');
    expect(spec.importance).toBe('high');
    expect(spec.kind).toBe('suhoor');
  });

  test('exposes kind and prayer for display-name localization', () => {
    expect(channelSpec('adhan.maghrib.clip.v1')).toMatchObject({
      kind: 'adhan',
      prayer: 'maghrib',
    });
    expect(channelSpec('suhoor.default.v1').prayer).toBeNull();
  });
});

describe('desiredChannels', () => {
  test('contains exactly the enabled prayers active sound channels', () => {
    const p = prefs({
      enabled: { fajr: true, dhuhr: true, asr: false, maghrib: false, isha: false },
      sound: { ...DEFAULT_NOTIFICATION_PREFS.sound, fajr: 'clip', dhuhr: 'silent' },
    });
    expect(desiredChannels(p, false).sort()).toEqual(
      ['adhan.dhuhr.silent.v1', 'adhan.fajr.clip.v1'].sort()
    );
  });

  test('adds the suhoor channel only when the reminder is configured', () => {
    const p = prefs({
      enabled: { fajr: false, dhuhr: false, asr: false, maghrib: false, isha: false },
    });
    expect(desiredChannels(p, true)).toEqual(['suhoor.default.v1']);
    expect(desiredChannels(p, false)).toEqual([]);
  });

  test('fullAdhan and clip collapse into one desired channel', () => {
    const p = prefs({
      enabled: { fajr: true, dhuhr: true, asr: false, maghrib: false, isha: false },
      sound: { ...DEFAULT_NOTIFICATION_PREFS.sound, fajr: 'fullAdhan', dhuhr: 'fullAdhan' },
    });
    expect(desiredChannels(p, false).sort()).toEqual(
      ['adhan.dhuhr.clip.v1', 'adhan.fajr.clip.v1'].sort()
    );
  });
});

describe('diffChannels', () => {
  test('creates missing, keeps current, deletes stale owned ids', () => {
    const existing = ['adhan.fajr.default.v1', 'adhan.dhuhr.silent.v1'];
    const desired = ['adhan.fajr.clip.v1', 'adhan.dhuhr.silent.v1'];
    expect(diffChannels(existing, desired)).toEqual({
      create: ['adhan.fajr.clip.v1'],
      keep: ['adhan.dhuhr.silent.v1'],
      deleteIds: ['adhan.fajr.default.v1'],
    });
  });

  test('never deletes foreign channels (prefix guard)', () => {
    const existing = [
      'expo_notifications_fallback_notification_channel',
      'expo_audio_channel',
      'adhan.isha.default.v1',
    ];
    const { deleteIds } = diffChannels(existing, []);
    expect(deleteIds).toEqual(['adhan.isha.default.v1']);
  });

  test('version bump reconciliation: old version deleted, new created', () => {
    const bumped = { ...SOUND_SPEC, clip: { ...SOUND_SPEC.clip, version: 2 } };
    const p = prefs({
      enabled: { fajr: true, dhuhr: false, asr: false, maghrib: false, isha: false },
      sound: { ...DEFAULT_NOTIFICATION_PREFS.sound, fajr: 'clip' },
    });
    const desired = desiredChannels(p, false, bumped);
    expect(diffChannels(['adhan.fajr.clip.v1'], desired)).toEqual({
      create: ['adhan.fajr.clip.v2'],
      keep: [],
      deleteIds: ['adhan.fajr.clip.v1'],
    });
  });
});
