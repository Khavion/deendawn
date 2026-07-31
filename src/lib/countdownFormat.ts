/**
 * The countdown vocabulary (handoff §5 gap 07 / gap 28) — shared by the
 * Countdown UI component and the widget timeline so the thresholds can never
 * fork between surfaces:
 *
 *   under a minute  → "now"
 *   under an hour   → "in 41 minutes"
 *   an hour or more → "in 2 h 14 min"
 *
 * Pure and i18n-agnostic: it returns a shape; callers render it through their
 * own translation layer (i18next plurals in-app, fixed strings in widgets).
 * Minutes are ceilinged so the countdown never understates the wait.
 */

export type CountdownShape =
  | { kind: 'now' }
  | { kind: 'minutes'; minutes: number }
  | { kind: 'hoursMinutes'; hours: number; minutes: number };

const MINUTE_MS = 60_000;

export function countdownShape(msRemaining: number): CountdownShape {
  if (msRemaining < MINUTE_MS) return { kind: 'now' };
  const totalMinutes = Math.ceil(msRemaining / MINUTE_MS);
  if (totalMinutes < 60) return { kind: 'minutes', minutes: totalMinutes };
  return {
    kind: 'hoursMinutes',
    hours: Math.floor(totalMinutes / 60),
    minutes: totalMinutes % 60,
  };
}

/**
 * When the display next changes, in ms (for timers and widget timeline
 * entries): the moment the remaining time crosses the next minute boundary.
 * Never returns less than 1s so a caller can't spin.
 */
export function msUntilCountdownChange(msRemaining: number): number {
  if (msRemaining <= 0) return MINUTE_MS;
  const intoMinute = msRemaining % MINUTE_MS;
  return Math.max(intoMinute === 0 ? MINUTE_MS : intoMinute, 1000);
}
