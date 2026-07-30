/**
 * Custom entry: expo-router's entry plus the Android home-screen widget
 * task-handler registration (react-native-android-widget requires it at
 * module scope of the app entry; package.json `main` points here).
 */
import 'expo-router/entry';
import { Platform } from 'react-native';

if (Platform.OS === 'android') {
  // Lazy requires keep the widget stack fully out of iOS bundles.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { registerWidgetTaskHandler } = require('react-native-android-widget');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { widgetTaskHandler } = require('./src/features/widget/widgetTaskHandler');
  registerWidgetTaskHandler(widgetTaskHandler);
}
