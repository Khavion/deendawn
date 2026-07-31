import { WIDGET_PRAYER_KEYS, type WidgetSnapshot, type WidgetPrayerKey } from './widgetData';

/**
 * iOS widget timeline entries (handoff §5 gap 28): one entry per prayer
 * boundary — each entry shows its NEXT prayer and carries that prayer's
 * fire date so the native side renders a live countdown (Text timerInterval
 * ticks offline with zero refresh budget; it can never go stale, beating
 * the "never stale >1 min" requirement outright).
 *
 * The widget extension has no i18n runtime, so every localized string
 * (names, formatted times, the hijri label) is precomputed here and carried
 * in props. Pure and unit-tested; called from the same reschedule pass that
 * refreshes the Android widget.
 */
export interface WidgetStripItem {
  key: WidgetPrayerKey;
  name: string;
  time: string;
  iso: string;
}

export interface WidgetTimelineEntry {
  /** When this entry becomes current. */
  date: Date;
  props: {
    prayerKey: WidgetPrayerKey;
    prayerName: string;
    /** Localized absolute time of the next prayer. */
    prayerTime: string;
    /** ISO instant of the next prayer (the live-countdown target). */
    prayerIso: string;
    cityLabel: string;
    hijriLabel: string;
    /** Today's five prayers for the medium strip. */
    strip: WidgetStripItem[];
  };
}

export function buildWidgetTimeline(
  snapshot: WidgetSnapshot,
  labels: {
    hijriLabel: string;
    prayerName: (key: WidgetPrayerKey) => string;
    formatTime: (iso: string) => string;
  },
  now: Date
): WidgetTimelineEntry[] {
  const strip: WidgetStripItem[] = snapshot.prayers
    .slice(0, WIDGET_PRAYER_KEYS.length)
    .map((p) => ({
      key: p.key,
      name: labels.prayerName(p.key),
      time: labels.formatTime(p.iso),
      iso: p.iso,
    }));

  const entries: WidgetTimelineEntry[] = [];
  // Entry 0 starts now, targeting the first future prayer; each subsequent
  // entry starts when its predecessor's prayer fires.
  let start = now;
  for (const prayer of snapshot.prayers) {
    const fire = new Date(prayer.iso);
    if (fire.getTime() <= now.getTime()) continue;
    entries.push({
      date: start,
      props: {
        prayerKey: prayer.key,
        prayerName: labels.prayerName(prayer.key),
        prayerTime: labels.formatTime(prayer.iso),
        prayerIso: prayer.iso,
        cityLabel: snapshot.cityLabel,
        hijriLabel: labels.hijriLabel,
        strip,
      },
    });
    start = fire;
  }
  return entries;
}
