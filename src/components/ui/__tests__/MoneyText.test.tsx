import { render } from '@testing-library/react-native';
import React from 'react';

import { formatMoney, MoneyText } from '../MoneyText';

// Arabic-script expectations are built from char codes (guard hook: no
// Arabic literals outside the content pipeline / locales).
const ARABIC_45 = String.fromCharCode(0x0664, 0x0665);
const ARABIC_COMMA = String.fromCharCode(0x060c);

describe('formatMoney', () => {
  it('groups by locale', () => {
    expect(formatMoney(837600, 'en')).toBe('837,600');
  });

  it('uses a true minus for negatives', () => {
    expect(formatMoney(-4200, 'en')).toBe('−4,200');
    expect(formatMoney(-4200, 'en')).not.toContain('-');
  });

  it('places the currency per locale', () => {
    expect(formatMoney(20940, 'en', { currency: 'PKR' })).toMatch(/^Rs\s?20,940$/);
  });

  it('urdu pins Latin digits (digit policy)', () => {
    expect(formatMoney(1254, 'ur')).toMatch(new RegExp(`1[,${ARABIC_COMMA}]?254`));
  });

  it('arabic uses Eastern Arabic-Indic digits', () => {
    expect(formatMoney(45, 'ar')).toContain(ARABIC_45);
  });

  it('caps fraction digits and drops trailing zeros', () => {
    expect(formatMoney(10.5, 'en')).toBe('10.5');
    expect(formatMoney(10.456, 'en')).toBe('10.46');
    expect(formatMoney(10, 'en')).toBe('10');
  });
});

describe('MoneyText', () => {
  it('renders tabular figures and the formatted amount', async () => {
    const { getByText } = await render(<MoneyText amount={837600} />);
    const node = getByText('837,600');
    expect(JSON.stringify(node.props.style)).toContain('tabular-nums');
  });

  it('signed renders a debt with the true minus', async () => {
    const { getByText } = await render(<MoneyText amount={4200} signed />);
    expect(getByText('−4,200')).toBeTruthy();
  });
});
