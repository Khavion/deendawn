import { KVStore } from '../../lib/kvStore';

/**
 * Detects environment changes that invalidate the *identity* of the pending
 * notification set even when every fire instant is still correct.
 *
 * Timezone: fire times are epoch instants computed from coordinates, so a
 * DST shift in the SAME zone changes nothing (epoch handles it — forcing
 * would churn twice a year for nothing). A zone CHANGE, though, shifts the
 * local-day enumeration behind the plan ids and is a strong signal the
 * location context moved — and expo-notifications has no TIMEZONE_CHANGED
 * receiver on Android (verified in the sdk-57 module manifest), so the
 * compare rides every rescheduleAll trigger instead (foreground, settings,
 * notification-received, 12h background task). Native receiver deliberately
 * deferred — see DECISIONS 2026-07-30.
 */
export interface ScheduleContext {
  /** IANA zone, e.g. "America/Chicago". */
  timeZone: string;
}

const KEY = 'notifications.scheduleContext.v1';

export function currentScheduleContext(): ScheduleContext {
  return { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone };
}

/** First observation (nothing stored) records without forcing. */
export function contextChanged(stored: ScheduleContext | null, current: ScheduleContext): boolean {
  return stored !== null && stored.timeZone !== current.timeZone;
}

export function loadScheduleContext(store: KVStore): ScheduleContext | null {
  const raw = store.get(KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<ScheduleContext>;
    return typeof parsed.timeZone === 'string' ? { timeZone: parsed.timeZone } : null;
  } catch {
    return null;
  }
}

export function saveScheduleContext(store: KVStore, ctx: ScheduleContext): void {
  store.set(KEY, JSON.stringify(ctx));
}
