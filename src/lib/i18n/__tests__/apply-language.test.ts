/**
 * @jest-environment node
 */
import i18n, { initI18n } from '../index';

test('initI18n applies a persisted non-english language immediately', () => {
  initI18n('ur');
  expect(i18n.language).toBe('ur');
  expect(i18n.t('tabs.more')).not.toBe('More');
  initI18n('en');
  expect(i18n.t('tabs.more')).toBe('More');
});
