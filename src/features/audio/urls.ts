/** Builds streaming URLs. Layout in the bucket: {base}/{reciterId}/{NNN}.{ext} */
export function surahAudioUrl(
  baseUrl: string,
  reciterId: string,
  surah: number,
  fileExt: 'mp3' | 'm4a' = 'mp3'
): string {
  if (!Number.isInteger(surah) || surah < 1 || surah > 114) {
    throw new RangeError(`surah out of range: ${surah}`);
  }
  if (!baseUrl || !reciterId) {
    throw new Error('audio source not configured');
  }
  const base = baseUrl.replace(/\/+$/, '');
  const padded = String(surah).padStart(3, '0');
  return `${base}/${encodeURIComponent(reciterId)}/${padded}.${fileExt}`;
}
