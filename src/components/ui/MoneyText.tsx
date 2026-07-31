import React from 'react';
import { useTranslation } from 'react-i18next';

import { AppText, type AppTextProps } from './AppText';
import { digitLocale } from '@/src/lib/i18n/format';

/**
 * MoneyText (handoff §5 gap 30) — every zakat amount renders through this:
 * tabular figures (columns of money don't jitter), locale grouping and digit
 * system via the app's digit policy, a TRUE minus (U+2212) for debts, and
 * currency placement from the locale. With no `currency` it renders a plain
 * grouped amount (zakat is currency-agnostic until the user picks one).
 */
export type MoneyTextProps = Omit<AppTextProps, 'children'> & {
  amount: number;
  /** ISO 4217 code ("PKR", "USD"); omit for a bare grouped number. */
  currency?: string;
  /** Force the sign for negatives even when the caller pre-negated. */
  signed?: boolean;
  maximumFractionDigits?: number;
};

export function formatMoney(
  amount: number,
  lang: string,
  opts: { currency?: string; maximumFractionDigits?: number } = {}
): string {
  const { currency, maximumFractionDigits = 2 } = opts;
  const formatter = new Intl.NumberFormat(digitLocale(lang), {
    ...(currency ? { style: 'currency' as const, currency, currencyDisplay: 'narrowSymbol' } : {}),
    maximumFractionDigits,
    minimumFractionDigits: 0,
  });
  // Intl emits HYPHEN-MINUS in many locales; typographic minus reads better
  // and is the handoff's stated requirement.
  return formatter.format(amount).replace(/-/g, '−');
}

export function MoneyText({
  amount,
  currency,
  signed = false,
  maximumFractionDigits,
  style,
  ...rest
}: MoneyTextProps) {
  const { i18n } = useTranslation();
  const value = signed && amount > 0 ? -amount : amount;
  return (
    <AppText {...rest} style={[{ fontVariant: ['tabular-nums'] }, style]}>
      {formatMoney(value, i18n.language, { currency, maximumFractionDigits })}
    </AppText>
  );
}
