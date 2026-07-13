import { CITIES, City } from './cities';

/** Fold case + diacritics so "Malmo" finds "Malmö" and "sao" finds "São". */
export function foldForSearch(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

/**
 * Offline city search: word-prefix matches on city name rank first, then
 * substring matches on name, then country matches. Ties break alphabetically.
 */
export function searchCities(query: string, limit = 20): City[] {
  const q = foldForSearch(query);
  if (q.length === 0) return [];

  const scored: { city: City; score: number }[] = [];
  for (const city of CITIES) {
    const name = foldForSearch(city.name);
    const country = foldForSearch(city.country);
    let score: number | null = null;
    if (name.startsWith(q)) score = 0;
    else if (name.split(/\s+/).some((w) => w.startsWith(q))) score = 1;
    else if (name.includes(q)) score = 2;
    else if (country.startsWith(q) || country.split(/\s+/).some((w) => w.startsWith(q))) score = 3;
    if (score !== null) scored.push({ city, score });
  }
  return scored
    .sort((a, b) => a.score - b.score || a.city.name.localeCompare(b.city.name))
    .slice(0, limit)
    .map((s) => s.city);
}
