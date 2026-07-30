import i18n from '@/src/lib/i18n';
import { listCellDirection } from '../direction';

describe('listCellDirection (FlashList RTL cell fix)', () => {
  const original = i18n.language;
  afterAll(() => void i18n.changeLanguage(original));

  it.each([
    ['en', 'ltr'],
    ['ar', 'rtl'],
    ['ur', 'rtl'],
  ] as const)('%s → %s', async (lang, dir) => {
    await i18n.changeLanguage(lang);
    expect(listCellDirection()).toEqual({ direction: dir });
  });
});
