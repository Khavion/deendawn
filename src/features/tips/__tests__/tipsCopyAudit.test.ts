/**
 * Constitution rule 3 / Apple guideline 3.2.1: the tip jar may NEVER be
 * framed as charity, zakat, or sadaqah collection, in any locale. This audit
 * fails the build if forbidden framing enters the tips (or more.tips) copy.
 *
 * Arabic-script terms appear as \uXXXX escapes (repo guard: Arabic bytes live
 * only in pipeline artifacts and locale files).
 */
import ar from '@/src/lib/i18n/locales/ar.json';
import en from '@/src/lib/i18n/locales/en.json';
import ur from '@/src/lib/i18n/locales/ur.json';

const FORBIDDEN: { label: string; pattern: RegExp }[] = [
  { label: 'en zakat', pattern: /zakat/i },
  { label: 'en sadaqah', pattern: /sadaqa/i },
  { label: 'en charity', pattern: /charit/i },
  { label: 'en donate-to', pattern: /donate to/i },
  // UR zakat (with or without superscript alef)
  { label: 'ur zakat', pattern: /\u0632\u06a9\u0648\u0670?\u06c3/ },
  // UR sadaqah
  { label: 'ur sadaqah', pattern: /\u0635\u062f\u0642\u06c1/ },
  // UR khayrat (alms)
  { label: 'ur khayrat', pattern: /\u062e\u06cc\u0631\u0627\u062a/ },
  // AR zakat
  { label: 'ar zakat', pattern: /\u0632\u0643\u0627\u0629/ },
  // AR sadaqah
  { label: 'ar sadaqah', pattern: /\u0635\u062f\u0642\u0629/ },
  // AR khayri (charitable)
  { label: 'ar charitable', pattern: /\u062e\u064a\u0631\u064a/ },
];

// The footnote/unavailable strings legitimately NEGATE donation framing
// ("this is not a donation"); they are exempted by exact key and separately
// required below to contain the disclaimer.
const EXEMPT_KEYS = new Set(['footnote', 'unavailable']);

type Dict = Record<string, Record<string, string>>;

describe('tips copy audit (rule 3)', () => {
  const locales: Record<string, Dict> = {
    en: en as unknown as Dict,
    ur: ur as unknown as Dict,
    ar: ar as unknown as Dict,
  };

  for (const [name, dict] of Object.entries(locales)) {
    it(`${name}: tips copy never uses charity/zakat/sadaqah framing`, () => {
      expect(dict.tips).toBeDefined();
      const entries = Object.entries(dict.tips).filter(([k]) => !EXEMPT_KEYS.has(k));
      entries.push(['more.tips', dict.more.tips]);
      for (const [key, value] of entries) {
        for (const { label, pattern } of FORBIDDEN) {
          if (pattern.test(value)) {
            throw new Error(`${name} tips key "${key}" contains forbidden framing: ${label}`);
          }
        }
      }
    });
  }

  it('the footnote explicitly disclaims donation framing in every locale', () => {
    expect((en as unknown as Dict).tips.footnote).toMatch(/not a donation/i);
    // UR "not a donation" (atiyah nahin)
    expect((ur as unknown as Dict).tips.footnote).toContain(
      '\u0639\u0637\u06cc\u06c1 \u0646\u06c1\u06cc\u06ba'
    );
    // AR "is not a donation" (laysat tabarru'an)
    expect((ar as unknown as Dict).tips.footnote).toContain(
      '\u0644\u064a\u0633\u062a \u062a\u0628\u0631\u0639\u064b\u0627'
    );
  });
});
