/* global jest */
// Global i18n bootstrap for component tests: English, initialized once.
jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageTag: 'en-US', languageCode: 'en' }],
}));
require('./src/lib/i18n').initI18n('en');
