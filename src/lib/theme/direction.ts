import i18n, { isRtl, type LanguageCode } from '@/src/lib/i18n';

/**
 * FlashList v2 cell containers do not inherit the app's RTL layout direction
 * (rows rendered LTR under Arabic/Urdu — caught by the Phase-9 Arabic cells).
 * Apply to every FlashList renderItem ROOT to restore inheritance.
 *
 * Derived from the app LANGUAGE, not I18nManager.isRTL: on the New
 * Architecture the JS-side isRTL constant proved stale/unreliable while the
 * native tree was already mirrored. The language is the app's own source of
 * truth, and layout direction only changes with a restart anyway.
 */
export function listCellDirection(): { direction: 'rtl' | 'ltr' } {
  return { direction: isRtl(i18n.language as LanguageCode) ? 'rtl' : 'ltr' };
}
