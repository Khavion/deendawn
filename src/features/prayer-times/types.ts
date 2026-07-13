export const METHOD_KEYS = [
  'MuslimWorldLeague',
  'Egyptian',
  'Karachi',
  'UmmAlQura',
  'Dubai',
  'MoonsightingCommittee',
  'NorthAmerica',
  'Kuwait',
  'Qatar',
  'Singapore',
  'Tehran',
  'Turkey',
] as const;
export type MethodKey = (typeof METHOD_KEYS)[number];

export type MadhabKey = 'shafi' | 'hanafi';

/** 'auto' resolves via adhan's HighLatitudeRule.recommended(coordinates). */
export const HIGH_LAT_RULE_KEYS = [
  'auto',
  'middleofthenight',
  'seventhofthenight',
  'twilightangle',
] as const;
export type HighLatRuleKey = (typeof HIGH_LAT_RULE_KEYS)[number];

export interface PrayerSettings {
  method: MethodKey;
  madhab: MadhabKey;
  highLatRule: HighLatRuleKey;
}

export interface GeoCoordinates {
  latitude: number;
  longitude: number;
}

export const PRAYER_NAMES = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;
export type PrayerName = (typeof PRAYER_NAMES)[number];

/** Absolute instants for one calendar day at one location. */
export type DayPrayerTimes = Record<PrayerName, Date>;

export interface NextPrayerInfo {
  prayer: Exclude<PrayerName, 'sunrise'>;
  time: Date;
  /** True when the next prayer is tomorrow's fajr (after isha). */
  isTomorrow: boolean;
}
