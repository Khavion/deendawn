import { CalculationMethod, CalculationParameters } from 'adhan';

import { MethodKey, METHOD_KEYS } from './types';

/** Display labels only — no religious positions asserted, just organization names. */
export const METHOD_LABELS: Record<MethodKey, string> = {
  MuslimWorldLeague: 'Muslim World League',
  Egyptian: 'Egyptian General Authority of Survey',
  Karachi: 'University of Islamic Sciences, Karachi',
  UmmAlQura: 'Umm al-Qura University, Makkah',
  Dubai: 'Dubai (UAE)',
  MoonsightingCommittee: 'Moonsighting Committee Worldwide',
  NorthAmerica: 'Islamic Society of North America (ISNA)',
  Kuwait: 'Kuwait',
  Qatar: 'Qatar',
  Singapore: 'Majlis Ugama Islam Singapura',
  Tehran: 'Institute of Geophysics, University of Tehran',
  Turkey: 'Diyanet İşleri Başkanlığı, Turkey',
};

export function methodParams(key: MethodKey): CalculationParameters {
  return CalculationMethod[key]();
}

export function isMethodKey(v: string): v is MethodKey {
  return (METHOD_KEYS as readonly string[]).includes(v);
}

/**
 * Default method by device locale: ISNA for US locale, MWL otherwise
 * (CLAUDE.md acceptance criterion 1). Region is taken from the BCP-47 tag.
 */
export function defaultMethodForLocale(locale: string | null | undefined): MethodKey {
  const region = (locale ?? '').split('-').map((p) => p.toUpperCase());
  return region.includes('US') ? 'NorthAmerica' : 'MuslimWorldLeague';
}
