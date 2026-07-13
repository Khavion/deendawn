/**
 * @jest-environment node
 */
import {
  computeZakat,
  EMPTY_INPUTS,
  NISAB_GOLD_GRAMS,
  NISAB_SILVER_GRAMS,
  ZAKAT_RATE,
} from '../zakat';

describe('computeZakat', () => {
  test('needs at least one metal price to establish nisab', () => {
    const r = computeZakat({ ...EMPTY_INPUTS, cash: 100000 });
    expect(r.status).toBe('needPrices');
    expect(r.zakatDue).toBe(0);
    expect(r.nisabThreshold).toBeNull();
  });

  test('2.5% due when wealth meets the lower (silver) nisab', () => {
    const r = computeZakat({
      ...EMPTY_INPUTS,
      cash: 10000,
      goldPricePerGram: 100, // gold nisab = 8500
      silverPricePerGram: 1, // silver nisab = 595 (lower -> applies)
    });
    expect(r.nisabGoldValue).toBe(100 * NISAB_GOLD_GRAMS);
    expect(r.nisabSilverValue).toBe(1 * NISAB_SILVER_GRAMS);
    expect(r.nisabThreshold).toBe(595);
    expect(r.status).toBe('due');
    expect(r.zakatDue).toBe(10000 * ZAKAT_RATE);
  });

  test('below nisab -> nothing due', () => {
    const r = computeZakat({ ...EMPTY_INPUTS, cash: 500, silverPricePerGram: 1 });
    expect(r.status).toBe('belowNisab');
    expect(r.zakatDue).toBe(0);
  });

  test('metal holdings are valued and liabilities subtract (floored at zero)', () => {
    const r = computeZakat({
      ...EMPTY_INPUTS,
      goldGrams: 100,
      goldPricePerGram: 80, // 8000 assets, gold nisab 6800
      liabilities: 1000,
    });
    expect(r.totalAssets).toBe(8000);
    expect(r.zakatableWealth).toBe(7000);
    expect(r.status).toBe('due');
    expect(r.zakatDue).toBe(175);

    const drowned = computeZakat({
      ...EMPTY_INPUTS,
      cash: 1000,
      liabilities: 5000,
      silverPricePerGram: 1,
    });
    expect(drowned.zakatableWealth).toBe(0);
    expect(drowned.status).toBe('belowNisab');
  });

  test('gold-only pricing uses the gold nisab', () => {
    const r = computeZakat({ ...EMPTY_INPUTS, cash: 7000, goldPricePerGram: 80 });
    expect(r.nisabSilverValue).toBeNull();
    expect(r.nisabThreshold).toBe(6800);
    expect(r.status).toBe('due');
  });

  test('negative/NaN inputs are treated as zero; rounding is to cents', () => {
    const r = computeZakat({
      ...EMPTY_INPUTS,
      cash: 1000.005,
      liabilities: -50,
      goldGrams: Number.NaN,
      silverPricePerGram: 1,
    });
    expect(r.totalAssets).toBe(1000.01);
    expect(r.zakatableWealth).toBe(1000.01);
    expect(r.zakatDue).toBe(25);
  });
});
