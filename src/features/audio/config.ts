/**
 * Recitation audio source configuration.
 *
 * Privacy invariant (constitution rule 2): the ONLY production audio domain
 * is our R2 bucket, injected at build time via EXPO_PUBLIC_AUDIO_BASE_URL.
 * When it is unset the listening feature is hidden entirely — no dead UI.
 *
 * Dev builds fall back to a localhost server so the full streaming player can
 * be exercised with placeholder tones before licensed recordings exist
 * (BLOCKERS item 2). Placeholder audio is NEVER presented as recitation: the
 * player shows a persistent dev badge whenever the placeholder source is used.
 */
export interface AudioSource {
  baseUrl: string;
  reciterId: string;
  /** File extension in the bucket: mp3 for real recordings, m4a for dev tones. */
  fileExt: 'mp3' | 'm4a';
  /** True when this source serves labeled placeholder tones, not recitation. */
  placeholder: boolean;
}

/** localhost (not 127.0.0.1) — it is the ATS exception domain in debug builds. */
export const DEV_AUDIO_BASE_URL = 'http://localhost:8083';

export function resolveAudioSource(
  envBaseUrl: string | undefined,
  isDev: boolean
): AudioSource | null {
  const base = envBaseUrl?.trim();
  if (base) {
    return { baseUrl: base, reciterId: 'dev', fileExt: 'mp3', placeholder: isDev };
  }
  if (isDev) {
    return { baseUrl: DEV_AUDIO_BASE_URL, reciterId: 'dev', fileExt: 'm4a', placeholder: true };
  }
  return null;
}

export function getAudioSource(): AudioSource | null {
  return resolveAudioSource(process.env.EXPO_PUBLIC_AUDIO_BASE_URL, __DEV__);
}
