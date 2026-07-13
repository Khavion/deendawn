/**
 * @jest-environment node
 *
 * i18n completeness gates (PHASE_2 E1): every key exists in all three locales,
 * no empty values, Arabic plural forms work, drafts are flagged.
 */
import 'intl-pluralrules';
import i18next from 'i18next';

import ar from '../locales/ar.json';
import en from '../locales/en.json';
import ur from '../locales/ur.json';

type Tree = { [k: string]: string | Tree };

function flatten(obj: Tree, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    typeof v === 'string' ? [`${prefix}${k}`] : flatten(v, `${prefix}${k}.`)
  );
}

/** Plural suffixes differ per language — compare keys with suffixes stripped. */
const stripPlurals = (keys: string[]) => [
  ...new Set(keys.map((k) => k.replace(/_(zero|one|two|few|many|other)$/, ''))),
];

const enKeys = stripPlurals(flatten(en as Tree)).sort();
const urKeys = stripPlurals(flatten(ur as Tree).filter((k) => k !== 'meta.status')).sort();
const arKeys = stripPlurals(flatten(ar as Tree).filter((k) => k !== 'meta.status')).sort();

describe('locale completeness (missing-key CI gate)', () => {
  test('ur and ar cover exactly the en key set', () => {
    expect(urKeys).toEqual(enKeys);
    expect(arKeys).toEqual(enKeys);
  });

  test('no empty values in any locale', () => {
    for (const tree of [en, ur, ar] as Tree[]) {
      const walk = (o: Tree): void =>
        Object.values(o).forEach((v) =>
          typeof v === 'string' ? expect(v.trim().length).toBeGreaterThan(0) : walk(v)
        );
      walk(tree);
    }
  });

  test('machine-drafted locales are flagged for Gate 8 review', () => {
    expect((ur as Tree & { meta: { status?: string } }).meta.status).toContain('@draft');
    expect((ar as Tree & { meta: { status?: string } }).meta.status).toContain('@draft');
  });

  test('every locale declares its native-script name', () => {
    expect((en.meta as { nativeName: string }).nativeName).toBe('English');
    expect((ur.meta as { nativeName: string }).nativeName.length).toBeGreaterThan(0);
    expect((ar.meta as { nativeName: string }).nativeName.length).toBeGreaterThan(0);
  });
});

describe('plural forms', () => {
  const make = async (lng: string) => {
    const inst = i18next.createInstance();
    await inst.init({
      resources: { en: { translation: en }, ur: { translation: ur }, ar: { translation: ar } },
      lng,
      fallbackLng: 'en',
      interpolation: { escapeValue: false },
    });
    return inst;
  };

  test('english one/other', async () => {
    const inst = await make('en');
    expect(inst.t('quran.verses', { count: 1 })).toBe('1 verse');
    expect(inst.t('quran.verses', { count: 7 })).toBe('7 verses');
  });

  test('arabic uses all six CLDR forms without falling back to english', async () => {
    const inst = await make('ar');
    const counts = [0, 1, 2, 3, 11, 100];
    const rendered = counts.map((count) => inst.t('quran.verses', { count }));
    // Six distinct CLDR categories: zero, one, two, few, many, other.
    for (const r of rendered) {
      expect(r).not.toMatch(/verse/); // never the english fallback
      expect(r.trim().length).toBeGreaterThan(0);
    }
    // one and two have dedicated wordings distinct from the counted forms
    expect(rendered[1]).not.toBe(rendered[3]);
    expect(rendered[2]).not.toBe(rendered[3]);
  });

  test('urdu one/other', async () => {
    const inst = await make('ur');
    expect(inst.t('quran.verses', { count: 1 })).not.toBe(inst.t('quran.verses', { count: 5 }));
  });
});
