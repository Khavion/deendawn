import 'intl-pluralrules'; // Hermes lacks Intl.PluralRules — needed for Arabic's 6 plural forms
import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { I18nManager } from 'react-native';

import ar from './locales/ar.json';
import en from './locales/en.json';
import ur from './locales/ur.json';
import { KVStore } from '../kvStore';

export const LANGUAGES = [
  { code: 'en', rtl: false },
  { code: 'ur', rtl: true },
  { code: 'ar', rtl: true },
] as const;
export type LanguageCode = (typeof LANGUAGES)[number]['code'];

const LANGUAGE_KEY = 'language.v1';

export const resources = {
  en: { translation: en },
  ur: { translation: ur },
  ar: { translation: ar },
} as const;

export function isLanguageCode(v: unknown): v is LanguageCode {
  return typeof v === 'string' && LANGUAGES.some((l) => l.code === v);
}

/** Native-script display name, from each locale's own file. */
export function nativeName(code: LanguageCode): string {
  return resources[code].translation.meta.nativeName;
}

export function isRtl(code: LanguageCode): boolean {
  return LANGUAGES.find((l) => l.code === code)?.rtl ?? false;
}

export function loadLanguage(store: KVStore): LanguageCode | null {
  const v = store.get(LANGUAGE_KEY);
  return isLanguageCode(v) ? v : null;
}

export function saveLanguage(store: KVStore, code: LanguageCode): void {
  store.set(LANGUAGE_KEY, code);
}

export function detectDeviceLanguage(): LanguageCode {
  const device = getLocales()[0]?.languageCode ?? 'en';
  return isLanguageCode(device) ? device : 'en';
}

// Initialize at MODULE LOAD with the device language so no component can
// render before resources exist (init-in-render races with useTranslation).
// The persisted override is applied by initI18n once the store is available.
void i18n.use(initReactI18next).init({
  resources,
  lng: detectDeviceLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnNull: false,
  initAsync: false, // synchronous init — resources are bundled
});

/** Apply the persisted language choice (no-op when it matches). */
export function initI18n(stored: LanguageCode | null): typeof i18n {
  const lng = stored ?? detectDeviceLanguage();
  if (i18n.language !== lng) void i18n.changeLanguage(lng);
  return i18n;
}

/**
 * Whether switching to `code` needs an app restart (layout direction flips).
 * The caller persists the choice first, then triggers the restart.
 */
export function needsRtlRestart(code: LanguageCode): boolean {
  return I18nManager.isRTL !== isRtl(code);
}

/** Apply the RTL flag for the NEXT app start. Effective only after restart. */
export function applyRtlForNextStart(code: LanguageCode): void {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(isRtl(code));
}

export default i18n;
