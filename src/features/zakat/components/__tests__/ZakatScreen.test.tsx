import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { parseAmount, ZakatScreen } from '../ZakatScreen';
import i18n from '@/src/lib/i18n';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('expo-router', () => ({ Stack: { Screen: () => null } }));

describe('parseAmount', () => {
  test('western, arabic-indic digits, and both decimal separators', () => {
    expect(parseAmount('1234.56')).toBe(1234.56);
    expect(parseAmount('1234,56')).toBe(1234.56);
    // Arabic-Indic 1234 (escapes only per guard policy)
    expect(parseAmount('\u0661\u0662\u0663\u0664')).toBe(1234);
    expect(parseAmount('')).toBe(0);
    expect(parseAmount('abc')).toBe(0);
    expect(parseAmount('-50')).toBe(0);
  });
});

describe('ZakatScreen', () => {
  test('walks from need-prices to a live 2.5% result', async () => {
    const view = await render(<ZakatScreen />);
    expect(view.getByText(/Enter at least one metal price/)).toBeOnTheScreen();

    await fireEvent.changeText(view.getByTestId('zakat-cash'), '10000');
    await fireEvent.changeText(view.getByTestId('zakat-silverPricePerGram'), '1');
    expect(view.getByText(/Zakat due/)).toBeOnTheScreen();
    expect(view.getByText('250')).toBeOnTheScreen();
    expect(view.getByText(/Nisab threshold: 595/)).toBeOnTheScreen();

    // Liabilities pull below nisab.
    await fireEvent.changeText(view.getByTestId('zakat-liabilities'), '9600');
    expect(view.getByText(/below the nisab/)).toBeOnTheScreen();
  });

  test('renders long values in Arabic locale without crashing (3-locale layout check)', async () => {
    await i18n.changeLanguage('ar');
    try {
      const view = await render(<ZakatScreen />);
      await fireEvent.changeText(view.getByTestId('zakat-cash'), '123456789.99');
      await fireEvent.changeText(view.getByTestId('zakat-goldPricePerGram'), '350');
      expect(view.getByTestId('zakat-result')).toBeOnTheScreen();
    } finally {
      await i18n.changeLanguage('en');
    }
  });

  test('disclaimer is always visible', async () => {
    const view = await render(<ZakatScreen />);
    expect(view.getByText(/not a religious ruling/)).toBeOnTheScreen();
  });
});
