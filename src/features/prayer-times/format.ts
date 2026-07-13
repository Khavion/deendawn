/**
 * Timezone-aware display formatting. Instants come from the engine; DST
 * correctness falls out of formatting with an explicit IANA zone (or the
 * device default when omitted).
 */
export function formatTimeInZone(
  date: Date,
  options: { timeZone?: string; hour12?: boolean } = {}
): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: options.hour12 === false ? 'h23' : 'h12',
    ...(options.timeZone && { timeZone: options.timeZone }),
  }).format(date);
}

/** 24h "HH:mm" — the canonical form used by test fixtures. */
export function formatHHmm(date: Date, timeZone?: string): string {
  return formatTimeInZone(date, { timeZone, hour12: false });
}
