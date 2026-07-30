import { AdhanPrayer, ADHAN_PRAYERS, NotificationPrefs, SoundKey } from './scheduler';

/**
 * Pure Android notification-channel model. Zero expo imports on purpose: the
 * ID grammar and reconciliation diff are unit-tested logic; the impure sync
 * against expo-notifications lives in channelSync.ts.
 *
 * Android channels are IMMUTABLE after creation (importance/sound/vibration
 * lock on first create), so IDs carry everything that defines behavior:
 *
 *   {stream}.{prayer}.{soundFamily}.v{version}   e.g. adhan.fajr.clip.v1
 *   suhoor.default.v1                            (single suhoor channel)
 *
 * When a sound file changes (real adhan recordings replacing the placeholder
 * clip), bump ONLY that family's version in SOUND_SPEC: reconciliation then
 * creates the .v2 channels, pending notifications are rescheduled onto them,
 * and the .v1 channels are deleted. Other families are untouched.
 */

/** Channel-relevant sound families. `fullAdhan` is NOT a family — it plays
 * the same clip at fire time (tap-opens-app rides content.data), so it maps
 * onto `clip` and switching clip<->fullAdhan causes zero channel churn. */
export type SoundFamily = 'default' | 'silent' | 'clip';

export interface SoundSpecEntry {
  /** res/raw filename ([a-z0-9_] only), 'default' = system default, null = silent. */
  file: string | null;
  /** Bump when the underlying file changes — channels are immutable. */
  version: number;
}

export const SOUND_SPEC: Record<SoundFamily, SoundSpecEntry> = {
  default: { file: 'default', version: 1 },
  silent: { file: null, version: 1 },
  clip: { file: 'adhan_clip_placeholder.wav', version: 1 },
};

export type SoundSpec = typeof SOUND_SPEC;

export type ChannelKind = 'adhan' | 'suhoor';

/** Prefix that marks a channel as ours — the deletion guard. */
const OWNED_PREFIX = /^(adhan|suhoor)\./;

const familyFor = (sound: SoundKey): SoundFamily => (sound === 'fullAdhan' ? 'clip' : sound);

export function deriveChannelId(
  kind: ChannelKind,
  prayer: AdhanPrayer,
  sound: SoundKey,
  spec: SoundSpec = SOUND_SPEC
): string {
  if (kind === 'suhoor') {
    // One user-visible "Suhoor reminder" channel, independent of per-prayer
    // sound choices (it always uses the system default sound).
    return `suhoor.default.v${spec.default.version}`;
  }
  const family = familyFor(sound);
  return `adhan.${prayer}.${family}.v${spec[family].version}`;
}

export interface ChannelSpec {
  kind: ChannelKind;
  /** null for the suhoor channel (not prayer-specific). */
  prayer: AdhanPrayer | null;
  family: SoundFamily;
  /** 'default' = system default sound; filename = res/raw asset; null = silent. */
  sound: string | null;
  /** Always high: heads-up parity with iOS `timeSensitive` (silent = no sound, still heads-up). */
  importance: 'high';
  /** Audible adhan channels ride the alarm stream (some OEMs mute the app
   * "Ringtone" toggle by default — expo/expo discussion #39508). Trade-off:
   * alarm volume governs them; flagged on the device-pass list. */
  audioUsage: 'alarm' | null;
}

export function channelSpec(channelId: string, spec: SoundSpec = SOUND_SPEC): ChannelSpec {
  const [stream, second, third] = channelId.split('.');
  if (stream === 'suhoor') {
    return {
      kind: 'suhoor',
      prayer: null,
      family: 'default',
      sound: spec.default.file,
      importance: 'high',
      audioUsage: 'alarm',
    };
  }
  const prayer = ADHAN_PRAYERS.includes(second as AdhanPrayer) ? (second as AdhanPrayer) : null;
  const family = (third as SoundFamily) in spec ? (third as SoundFamily) : 'default';
  const file = spec[family].file;
  return {
    kind: 'adhan',
    prayer,
    family,
    sound: file,
    importance: 'high',
    audioUsage: file === null ? null : 'alarm',
  };
}

/** The channel IDs that should exist right now for these prefs. */
export function desiredChannels(
  prefs: NotificationPrefs,
  suhoorEnabled: boolean,
  spec: SoundSpec = SOUND_SPEC
): string[] {
  const ids = new Set<string>();
  for (const prayer of ADHAN_PRAYERS) {
    if (!prefs.enabled[prayer]) continue;
    ids.add(deriveChannelId('adhan', prayer, prefs.sound[prayer], spec));
  }
  if (suhoorEnabled) ids.add(deriveChannelId('suhoor', 'fajr', 'default', spec));
  return [...ids];
}

export interface ChannelDiff {
  create: string[];
  keep: string[];
  /** Stale channels WE own; foreign channels are never touched. */
  deleteIds: string[];
}

export function diffChannels(existingIds: string[], desired: string[]): ChannelDiff {
  const desiredSet = new Set(desired);
  const existingSet = new Set(existingIds);
  return {
    create: desired.filter((id) => !existingSet.has(id)),
    keep: existingIds.filter((id) => desiredSet.has(id)),
    deleteIds: existingIds.filter((id) => OWNED_PREFIX.test(id) && !desiredSet.has(id)),
  };
}
