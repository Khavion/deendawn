/**
 * Reciter catalog — the app-side mirror of content-pipeline/audio/sources.json
 * (a jest test keeps the two in sync). IDs are bucket folder names; display
 * names are proper nouns and stay untranslated in every locale.
 */
export interface Reciter {
  id: string;
  name: string;
  style: string;
}

export const RECITERS: Reciter[] = [
  { id: 'alafasy', name: 'Mishary Rashid Alafasy', style: 'Murattal' },
];

export const DEFAULT_RECITER_ID = 'alafasy';

export function reciterName(id: string): string | undefined {
  return RECITERS.find((r) => r.id === id)?.name;
}
