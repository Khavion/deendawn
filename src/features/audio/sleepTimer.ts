/**
 * Sleep-timer choices for the expanded player (handoff §6 screen 03:
 * "Sleep off" cycling through quiet options). Pure logic, unit-tested.
 */
export const SLEEP_CHOICES = [0, 15, 30] as const;
export type SleepChoice = (typeof SLEEP_CHOICES)[number];

export function nextSleepChoice(current: SleepChoice): SleepChoice {
  const i = SLEEP_CHOICES.indexOf(current);
  return SLEEP_CHOICES[(i + 1) % SLEEP_CHOICES.length];
}

/** Deadline for a choice made at `now`; null when off. */
export function sleepDeadline(choice: SleepChoice, now: Date): Date | null {
  if (choice === 0) return null;
  return new Date(now.getTime() + choice * 60_000);
}

export function sleepExpired(deadline: Date | null, now: Date): boolean {
  return deadline !== null && now.getTime() >= deadline.getTime();
}

/** Playback-rate cycle for the quiet row ("Speed 1.0×"). */
export const RATE_CHOICES = [1, 1.25, 1.5] as const;
export type RateChoice = (typeof RATE_CHOICES)[number];

export function nextRateChoice(current: RateChoice): RateChoice {
  const i = RATE_CHOICES.indexOf(current);
  return RATE_CHOICES[(i + 1) % RATE_CHOICES.length];
}
