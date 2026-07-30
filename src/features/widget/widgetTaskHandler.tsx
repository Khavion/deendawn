import React from 'react';
import { Appearance } from 'react-native';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';

import { PrayerTimesWidget, PrayerTimesWidgetEmpty, WidgetPrayerRow } from './PrayerTimesWidget';
import { buildWidgetSnapshot, nextFromSnapshot, WIDGET_PRAYER_KEYS } from './widgetData';
import { computeDayTimes, isValidTime } from '../prayer-times/engine';
import { formatTimeInZone } from '../prayer-times/format';
import i18n, { initI18n, isRtl, LanguageCode, loadLanguage } from '../../lib/i18n';
import { getUserKVStore } from '../../lib/kvStore';
import { log } from '../../lib/log';
import { readThemePref } from '../../lib/theme/ThemeProvider';
import { loadSettings, resolveLocation, resolvePrayerConfig } from '../settings/settingsStore';

/**
 * Headless widget rendering (react-native-android-widget). The task handler
 * runs in its own JS instance via WorkManager — the app process may be dead,
 * so everything is computed here from the KV store + the pure engine (the
 * same path the app itself uses; no data handoff needed). Refresh sources:
 * the WIDGET_UPDATE periodic tick (30-min floor), WIDGET_ADDED, and
 * refreshPrayerWidget() from the app's reschedule path.
 */
export function buildPrayerWidgetTree(now: Date = new Date()): React.ReactElement {
  const store = getUserKVStore();
  initI18n(loadLanguage(store));
  const language = i18n.language;
  const rtl = isRtl(language as LanguageCode);
  const dark = resolveDark();

  const settings = loadSettings(store);
  const location = resolveLocation(settings);
  if (!location) {
    return <PrayerTimesWidgetEmpty message={i18n.t('widget.chooseCity')} dark={dark} />;
  }

  const config = resolvePrayerConfig(settings);
  const today = computeDayTimes(location, now, config);
  const tomorrow = computeDayTimes(
    location,
    new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 12),
    config
  );
  // Device zone throughout — matching the Today screen's formatting.
  const snapshot = buildWidgetSnapshot(
    today,
    tomorrow.fajr,
    location.label,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    now
  );
  const next = nextFromSnapshot(snapshot, now);

  const prayers: WidgetPrayerRow[] = WIDGET_PRAYER_KEYS.map((key) => {
    const t = today[key];
    return {
      key,
      name: i18n.t(`prayers.${key}`),
      time: isValidTime(t) ? formatTimeInZone(t) : '—',
      isNext: next?.key === key,
    };
  });

  const dateLabel = now.toLocaleDateString(language, { month: 'short', day: 'numeric' });

  return (
    <PrayerTimesWidget
      cityLabel={snapshot.cityLabel}
      dateLabel={dateLabel}
      prayers={prayers}
      rtl={rtl}
      dark={dark}
    />
  );
}

export async function widgetTaskHandler(props: WidgetTaskHandlerProps): Promise<void> {
  const action = props.widgetAction;
  if (action === 'WIDGET_DELETED' || action === 'WIDGET_CLICK') return;
  props.renderWidget(buildPrayerWidgetTree());
  log.info('widget', 'rendered', { action });
}

function resolveDark(): boolean {
  try {
    const pref = readThemePref(getUserKVStore());
    if (pref === 'light') return false;
    // nightWarm is a reader palette; the widget renders it as dark.
    if (pref === 'dark' || pref === 'nightWarm') return true;
  } catch {
    // fall through to the system scheme
  }
  return Appearance.getColorScheme() === 'dark';
}
