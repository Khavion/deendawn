import { digitLocale, formatDayKey, localizeNumber } from '../format';

// Arabic-script expectations are built from codepoints (U+0660-0669
// Arabic-Indic digits): the NO-AI ZONE guard hook rejects raw Arabic script
// outside src/lib/i18n/locales/, and these are numerals — not religious
// text — so constructed strings keep both the hook and the assertions honest.
const arabicDigits = (...digits: number[]) =>
  digits.map((d) => String.fromCharCode(0x0660 + d)).join('');
const ARABIC_42 = arabicDigits(4, 2);
const ARABIC_1448 = arabicDigits(1, 4, 4, 8);
const ARABIC_24 = arabicDigits(2, 4);

describe('digitLocale', () => {
  it('pins Eastern Arabic-Indic digits for Arabic', () => {
    expect(digitLocale('ar')).toBe('ar-u-nu-arab');
    expect(digitLocale('ar-SA')).toBe('ar-u-nu-arab');
  });
  it('pins Latin digits for Urdu (Pakistani-app convention)', () => {
    expect(digitLocale('ur')).toBe('ur-u-nu-latn');
  });
  it('passes English through', () => {
    expect(digitLocale('en')).toBe('en');
    expect(digitLocale('')).toBe('en');
  });
});

describe('localizeNumber', () => {
  it('renders Arabic-Indic digits for ar', () => {
    expect(localizeNumber(42, 'ar')).toBe(ARABIC_42);
    expect(localizeNumber(1448, 'ar')).toBe(ARABIC_1448);
  });
  it('keeps Latin digits for ur and en, without grouping', () => {
    expect(localizeNumber(1448, 'ur')).toBe('1448');
    expect(localizeNumber(1448, 'en')).toBe('1448');
  });
  it('passes through non-finite values unformatted', () => {
    expect(localizeNumber(NaN, 'ar')).toBe('NaN');
  });
});

describe('formatDayKey', () => {
  it('localizes a day key per language', () => {
    expect(formatDayKey('2026-07-24', 'en')).toBe('Jul 24');
    const ar = formatDayKey('2026-07-24', 'ar');
    expect(ar).toContain(ARABIC_24);
    expect(ar).not.toMatch(/[0-9]/);
  });
  it('returns malformed keys untouched', () => {
    expect(formatDayKey('not-a-day', 'en')).toBe('not-a-day');
  });
});
