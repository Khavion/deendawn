import { DEFAULT_RECITER_ID } from './reciters';

/**
 * Recitation audio source configuration.
 *
 * Privacy invariant (constitution rule 2): the ONLY production audio domain
 * is our R2 bucket, injected at build time via EXPO_PUBLIC_AUDIO_BASE_URL.
 * When it is unset the listening feature is hidden entirely — no dead UI.
 *
 * With a base URL set, the bucket serves REAL recitation (the audio
 * pipeline's verified set — see content-pipeline/audio/), so no placeholder
 * badge regardless of build type. Without one, dev builds fall back to the
 * localhost tone server, which is NEVER presented as recitation: the player
 * shows a persistent dev badge for that source (rule 1).
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
  isDev: boolean,
  envReciterId?: string
): AudioSource | null {
  const base = envBaseUrl?.trim();
  if (base) {
    return {
      baseUrl: base,
      reciterId: envReciterId?.trim() || DEFAULT_RECITER_ID,
      fileExt: 'mp3',
      placeholder: false,
    };
  }
  if (isDev) {
    return { baseUrl: DEV_AUDIO_BASE_URL, reciterId: 'dev', fileExt: 'm4a', placeholder: true };
  }
  return null;
}

export function getAudioSource(): AudioSource | null {
  return resolveAudioSource(
    process.env.EXPO_PUBLIC_AUDIO_BASE_URL,
    __DEV__,
    process.env.EXPO_PUBLIC_AUDIO_RECITER
  );
}
