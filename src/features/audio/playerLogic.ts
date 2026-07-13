/** Pure decisions for the streaming player, kept out of the hook for testing. */

/** Resuming into the first seconds or the final tail is worse than restarting. */
const MIN_RESUME_SECONDS = 10;
const END_GUARD_SECONDS = 5;

export function resumeSeekTarget(savedSeconds: number, durationSeconds: number): number {
  if (!Number.isFinite(savedSeconds) || savedSeconds < MIN_RESUME_SECONDS) return 0;
  if (Number.isFinite(durationSeconds) && durationSeconds > 0) {
    if (savedSeconds > durationSeconds - END_GUARD_SECONDS) return 0;
  }
  return savedSeconds;
}

/** "m:ss" (or "h:mm:ss" past an hour) for the progress readout. */
export function formatClock(seconds: number): string {
  const total = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = h > 0 ? String(m).padStart(2, '0') : String(m);
  return `${h > 0 ? `${h}:` : ''}${mm}:${String(s).padStart(2, '0')}`;
}

/** 0..1 progress for the track bar; safe on unloaded/zero durations. */
export function progressFraction(currentSeconds: number, durationSeconds: number): number {
  if (!Number.isFinite(currentSeconds) || !Number.isFinite(durationSeconds)) return 0;
  if (durationSeconds <= 0) return 0;
  return Math.min(1, Math.max(0, currentSeconds / durationSeconds));
}
