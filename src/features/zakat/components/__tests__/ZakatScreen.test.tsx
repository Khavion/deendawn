import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { parseAmount, ZakatScreen } from '../ZakatScreen';
import { loadSavedCalculations } from '../../zakatStore';
import { createMemoryKVStore } from '../../../../lib/kvStore';
import { SettingsProvider } from '../../../settings/SettingsContext';
import i18n from '@/src/lib/i18n';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('expo-router', () => ({ Stack: { Screen: () => null } }));

// Arabic-Indic "1234" built from char codes (guard hook: no Arabic literals).
const ARABIC_1234 = String.fromCharCode(0x0661, 0x0662, 0x0663, 0x0664);

const renderZakat = async () => {
  const store = createMemoryKVStore();
  const view = await render(
    <SettingsProvider store={store}>
      <ZakatScreen />
    </SettingsProvider>
  );
  return { store, view };
};

/** Rows open the numeric Sheet (handoff screen 08); type there, then Done. */
const enter = async (
  view: Awaited<ReturnType<typeof renderZakat>>['view'],
  field: string,
  value: string
) => {
  await fireEvent.press(view.getByTestId(`zakat-${field}`));
  await fireEvent.changeText(view.getByTestId('zakat-edit-input'), value);
  await fireEvent.press(view.getByTestId('zakat-edit-done'));
};

describe('parseAmount', () => {
  test('western, arabic-indic digits, and both decimal separators', () => {
    expect(parseAmount('1234.56')).toBe(1234.56);
    expect(parseAmount('1234,56')).toBe(1234.56);
    expect(parseAmount(ARABIC_1234)).toBe(1234);
    expect(parseAmount('')).toBe(0);
    expect(parseAmount('abc')).toBe(0);
    expect(parseAmount('-50')).toBe(0);
  });

  // Review 2026-07-31, calculation finding 3: money must not be understated.
  test('comma is a GROUPING mark, not a decimal, when the number says so', () => {
    expect(parseAmount('10,000')).toBe(10000);
    expect(parseAmount('1,234,567')).toBe(1234567);
    expect(parseAmount('1,234.56')).toBe(1234.56);
    expect(parseAmount('10 000')).toBe(10000);
  });

  test('Arabic decimal separator U+066B keeps its decimals', () => {
    const sep = String.fromCharCode(0x066b);
    expect(parseAmount(`1234${sep}56`)).toBe(1234.56);
    const thousands = String.fromCharCode(0x066c);
    expect(parseAmount(`10${thousands}000`)).toBe(10000);
  });

  test('Urdu / Persian digits U+06F0-U+06F9 parse', () => {
    const urdu1234 = String.fromCharCode(0x06f1, 0x06f2, 0x06f3, 0x06f4);
    expect(parseAmount(urdu1234)).toBe(1234);
    expect(parseAmount(`${urdu1234}.5`)).toBe(1234.5);
  });
});

describe('ZakatScreen (handoff screen 08)', () => {
  test('walks from need-prices to a live 2.5% result via the edit Sheet', async () => {
    const { view } = await renderZakat();
    expect(view.getByText(/Enter at least one metal price/)).toBeOnTheScreen();

    await enter(view, 'cash', '10000');
    await enter(view, 'silverPricePerGram', '1');
    // Result card (the screen's ONE gold object, last) shows the working.
    expect(view.getByTestId('zakat-amount')).toBeOnTheScreen();
    expect(view.getByText('250')).toBeOnTheScreen();
    expect(view.getByText(/silver nisab of 595/)).toBeOnTheScreen();

    // Liabilities pull below nisab.
    await enter(view, 'liabilities', '9600');
    expect(view.getByText(/below the nisab/)).toBeOnTheScreen();
  });

  test('nisab basis toggles between silver (default) and gold', async () => {
    const { view } = await renderZakat();
    await enter(view, 'cash', '100000');
    await enter(view, 'silverPricePerGram', '1');
    await enter(view, 'goldPricePerGram', '100');
    expect(view.getByText(/silver nisab of 595/)).toBeOnTheScreen();
    await fireEvent.press(view.getByTestId('nisab-gold'));
    expect(view.getByText(/gold nisab of 8,500/)).toBeOnTheScreen();
  });

  test('save persists a timestamped calculation and shares the export text', async () => {
    const { Share } = jest.requireActual('react-native');
    const shareSpy = jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' });
    const { store, view } = await renderZakat();
    await enter(view, 'cash', '10000');
    await enter(view, 'silverPricePerGram', '1');
    await fireEvent.press(view.getByTestId('zakat-save'));
    const saved = loadSavedCalculations(store);
    expect(saved).toHaveLength(1);
    expect(saved[0].basis).toBe('silver');
    expect(saved[0].result.zakatDue).toBe(250);
    expect(saved[0].savedAtIso).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    const message = (shareSpy.mock.calls[0][0] as { message: string }).message;
    expect(message).toContain('250');
    shareSpy.mockRestore();
  });

  test('renders long values in Arabic locale without crashing (3-locale layout check)', async () => {
    await i18n.changeLanguage('ar');
    try {
      const { view } = await renderZakat();
      await enter(view, 'cash', '123456789.99');
      await enter(view, 'goldPricePerGram', '350');
      expect(view.getByTestId('zakat-result')).toBeOnTheScreen();
    } finally {
      await i18n.changeLanguage('en');
    }
  });

  test('disclaimer is always visible', async () => {
    const { view } = await renderZakat();
    expect(view.getByText(/not a religious ruling/)).toBeOnTheScreen();
  });
});
