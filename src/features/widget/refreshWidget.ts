import { Platform } from 'react-native';

/**
 * On-demand widget refresh from the APP process (foreground reschedules,
 * settings changes). The periodic WIDGET_UPDATE tick has a 30-minute floor —
 * this keeps the next-prayer highlight fresh whenever the app already did
 * the work anyway. Fire-and-forget; a missing widget is a no-op.
 */
export function refreshPrayerWidget(): void {
  if (Platform.OS !== 'android') return;
  void (async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- android-only lazy
      const { requestWidgetUpdate } = require('react-native-android-widget');
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- android-only lazy
      const { buildPrayerWidgetTree } = require('./widgetTaskHandler');
      await requestWidgetUpdate({
        widgetName: 'PrayerTimes',
        renderWidget: () => buildPrayerWidgetTree(),
        widgetNotFound: () => {},
      });
    } catch {
      // Widget stack unavailable — never break the app for the widget.
    }
  })();
}
