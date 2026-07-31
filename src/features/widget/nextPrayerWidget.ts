import { Platform } from 'react-native';

import { buildWidgetSnapshot } from './widgetData';
import { buildWidgetTimeline } from './timeline';
import { toHijri } from '../hijri/hijri';
import { computeDayTimes, isValidTime } from '../prayer-times/engine';
import { formatTimeInZone } from '../prayer-times/format';
import { loadSettings, resolveLocation, resolvePrayerConfig } from '../settings/settingsStore';
import i18n from '../../lib/i18n';
import { digitLocale, localizeNumber } from '../../lib/i18n/format';
import type { KVStore } from '../../lib/kvStore';
import { log } from '../../lib/log';

/**
 * iOS NextPrayer widget wiring (handoff §6 screen 07): registers the widget
 * layout once and pushes a fresh timeline whenever the app already did the
 * scheduling work (same trigger as the Android widget refresh). Lazy,
 * iOS-only, and a silent no-op when the native module is absent (tests,
 * older builds) — the widget must never break the app.
 */
let widget: { updateTimeline: (entries: { date: Date; props: object }[]) => void } | null = null;

function getWidget() {
  if (Platform.OS !== 'ios') return null;
  if (widget) return widget;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- ios-only lazy
    const { createWidget } = require('expo-widgets');
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- ios-only lazy
    const { NextPrayerWidgetView } = require('./NextPrayerWidgetView');
    widget = createWidget('NextPrayer', NextPrayerWidgetView);
  } catch {
    widget = null;
  }
  return widget;
}

export function refreshNextPrayerTimeline(store: KVStore, now: Date = new Date()): void {
  const w = getWidget();
  if (!w) return;
  try {
    const settings = loadSettings(store);
    const location = resolveLocation(settings);
    if (!location) return;
    const config = resolvePrayerConfig(settings);
    const today = computeDayTimes(location, now, config);
    const tomorrow = computeDayTimes(
      location,
      new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 12),
      config
    );
    const snapshot = buildWidgetSnapshot(
      today,
      tomorrow.fajr,
      location.label,
      Intl.DateTimeFormat().resolvedOptions().timeZone,
      now
    );
    const lang = i18n.language;
    const hijri = toHijri(now, settings.hijriOffset);
    const entries = buildWidgetTimeline(
      snapshot,
      {
        hijriLabel: `${localizeNumber(hijri.day, lang)} ${i18n.t(hijri.monthKey)} ${localizeNumber(hijri.year, lang)}`,
        prayerName: (key) => i18n.t(`prayers.${key}`),
        formatTime: (iso) => {
          const d = new Date(iso);
          return isValidTime(d) ? formatTimeInZone(d, { locale: digitLocale(lang) }) : '—';
        },
      },
      now
    );
    w.updateTimeline(entries);
  } catch (e) {
    log.info('widget', 'ios timeline refresh skipped', { message: String(e) });
  }
}
