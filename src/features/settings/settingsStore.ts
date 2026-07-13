import { getLocales } from 'expo-localization';

import { CITIES } from './cities';
import { defaultMethodForLocale } from '../prayer-times/methods';
import {
  GeoCoordinates,
  HIGH_LAT_RULE_KEYS,
  HighLatRuleKey,
  MadhabKey,
  METHOD_KEYS,
  MethodKey,
  PrayerSettings,
} from '../prayer-times/types';
import { KVStore } from '../../lib/kvStore';

/** Persisted user settings. `method: 'auto'` follows the device locale. */
export interface AppSettings {
  location: { type: 'manual'; cityId: string } | null;
  method: MethodKey | 'auto';
  madhab: MadhabKey;
  highLatRule: HighLatRuleKey;
}

export const DEFAULT_SETTINGS: AppSettings = {
  location: null,
  method: 'auto',
  madhab: 'shafi',
  highLatRule: 'auto',
};

const KEY = 'settings.v1';

/** Parse persisted JSON defensively — unknown fields dropped, bad values reset. */
export function parseSettings(raw: string | null): AppSettings {
  if (!raw) return DEFAULT_SETTINGS;
  let obj: unknown;
  try {
    obj = JSON.parse(raw);
  } catch {
    return DEFAULT_SETTINGS;
  }
  if (typeof obj !== 'object' || obj === null) return DEFAULT_SETTINGS;
  const o = obj as Record<string, unknown>;
  const out: AppSettings = { ...DEFAULT_SETTINGS };

  const loc = o.location as Record<string, unknown> | null | undefined;
  if (
    loc &&
    loc.type === 'manual' &&
    typeof loc.cityId === 'string' &&
    CITIES.some((c) => c.id === loc.cityId)
  ) {
    out.location = { type: 'manual', cityId: loc.cityId };
  }
  if (o.method === 'auto' || (METHOD_KEYS as readonly string[]).includes(o.method as string)) {
    out.method = o.method as AppSettings['method'];
  }
  if (o.madhab === 'shafi' || o.madhab === 'hanafi') out.madhab = o.madhab;
  if ((HIGH_LAT_RULE_KEYS as readonly string[]).includes(o.highLatRule as string)) {
    out.highLatRule = o.highLatRule as HighLatRuleKey;
  }
  return out;
}

export function loadSettings(store: KVStore): AppSettings {
  return parseSettings(store.get(KEY));
}

export function saveSettings(store: KVStore, settings: AppSettings): void {
  store.set(KEY, JSON.stringify(settings));
}

/** Coordinates + display name for the chosen location, or null if unset. */
export function resolveLocation(
  settings: AppSettings
): (GeoCoordinates & { label: string }) | null {
  if (settings.location?.type !== 'manual') return null;
  const city = CITIES.find((c) => c.id === settings.location!.cityId);
  if (!city) return null;
  return { latitude: city.latitude, longitude: city.longitude, label: city.name };
}

/** Concrete engine settings with 'auto' method resolved via device locale. */
export function resolvePrayerConfig(
  settings: AppSettings,
  localeTag?: string | null
): PrayerSettings {
  const tag = localeTag ?? getLocales()[0]?.languageTag ?? null;
  return {
    method: settings.method === 'auto' ? defaultMethodForLocale(tag) : settings.method,
    madhab: settings.madhab,
    highLatRule: settings.highLatRule,
  };
}
