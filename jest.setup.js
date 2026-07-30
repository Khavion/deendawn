/* global jest */
// Reanimated 4 under Jest: mock the worklets runtime AND reanimated itself
// (each package ships its own mock; worklets' isn't exposed at the root).
// Animated components render as plain views; shared values are plain objects.
jest.mock('react-native-worklets', () => require('react-native-worklets/lib/module/mock'));
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

// Global i18n bootstrap for component tests: English, initialized once.
jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageTag: 'en-US', languageCode: 'en' }],
}));
require('./src/lib/i18n').initI18n('en');
