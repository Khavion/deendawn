/**
 * Zakat CALCULATOR only — zakat payment is permanently out of scope
 * (CLAUDE.md rule 3). No live price APIs (privacy): the user enters today's
 * gold/silver prices themselves.
 */

// SCHOLAR-REVIEW: nisab thresholds. 85g of gold / 595g of silver are the
// figures in widespread contemporary use, but they are a religious position
// and ship only after sign-off (docs/SCHOLAR_REVIEW.md).
export const NISAB_GOLD_GRAMS = 85;
export const NISAB_SILVER_GRAMS = 595;
// SCHOLAR-REVIEW: the 2.5% rate on zakatable wealth.
export const ZAKAT_RATE = 0.025;

export interface ZakatInputs {
  cash: number;
  goldGrams: number;
  silverGrams: number;
  businessAssets: number;
  receivables: number;
  liabilities: number;
  /** User-entered current prices per gram, in the user's own currency. */
  goldPricePerGram: number;
  silverPricePerGram: number;
}

export const EMPTY_INPUTS: ZakatInputs = {
  cash: 0,
  goldGrams: 0,
  silverGrams: 0,
  businessAssets: 0,
  receivables: 0,
  liabilities: 0,
  goldPricePerGram: 0,
  silverPricePerGram: 0,
};

export interface ZakatResult {
  totalAssets: number;
  zakatableWealth: number;
  /** null when that metal's price is not provided. */
  nisabGoldValue: number | null;
  nisabSilverValue: number | null;
  /** The applicable threshold (lower of the available ones), or null. */
  nisabThreshold: number | null;
  status: 'needPrices' | 'belowNisab' | 'due';
  zakatDue: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;
const clamp = (n: number) => (Number.isFinite(n) && n > 0 ? n : 0);

export function computeZakat(raw: ZakatInputs): ZakatResult {
  const inp = Object.fromEntries(
    Object.entries(raw).map(([k, v]) => [k, clamp(v as number)])
  ) as unknown as ZakatInputs;

  const metalValue =
    inp.goldGrams * inp.goldPricePerGram + inp.silverGrams * inp.silverPricePerGram;
  const totalAssets = round2(inp.cash + inp.businessAssets + inp.receivables + metalValue);
  const zakatableWealth = round2(Math.max(0, totalAssets - inp.liabilities));

  const nisabGoldValue =
    inp.goldPricePerGram > 0 ? round2(NISAB_GOLD_GRAMS * inp.goldPricePerGram) : null;
  const nisabSilverValue =
    inp.silverPricePerGram > 0 ? round2(NISAB_SILVER_GRAMS * inp.silverPricePerGram) : null;

  const thresholds = [nisabGoldValue, nisabSilverValue].filter((v): v is number => v !== null);
  const nisabThreshold = thresholds.length > 0 ? Math.min(...thresholds) : null;

  if (nisabThreshold === null) {
    return {
      totalAssets,
      zakatableWealth,
      nisabGoldValue,
      nisabSilverValue,
      nisabThreshold,
      status: 'needPrices',
      zakatDue: 0,
    };
  }

  const meets = zakatableWealth >= nisabThreshold;
  return {
    totalAssets,
    zakatableWealth,
    nisabGoldValue,
    nisabSilverValue,
    nisabThreshold,
    status: meets ? 'due' : 'belowNisab',
    zakatDue: meets ? round2(zakatableWealth * ZAKAT_RATE) : 0,
  };
}
