import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AccessibilityInfo } from 'react-native';

import { AppText, type AppTextProps } from './AppText';
import { countdownShape, msUntilCountdownChange } from '@/src/lib/countdownFormat';
import { useTokens } from '@/src/lib/theme/useTokens';

/**
 * Countdown (handoff §5 gap 07) — owns the countdown vocabulary and its
 * clock. Formats come from the shared countdownFormat lib (same thresholds
 * as the widget timeline): "in 41 minutes" under an hour, "in 2 h 14 min"
 * above, "now" under a minute. The tick is minute-aligned and lives entirely
 * inside this component so host screens never re-render for it. Announces
 * politely at 10/5/1 minutes for screen-reader users.
 */
export type CountdownProps = Omit<AppTextProps, 'children'> & {
  target: Date;
  /** Minute marks that trigger a polite announcement (default 10/5/1). */
  announceAtMinutes?: readonly number[];
};

export function Countdown({
  target,
  announceAtMinutes = [10, 5, 1],
  color,
  ...rest
}: CountdownProps) {
  const { t: tr } = useTranslation();
  const t = useTokens();
  const [now, setNow] = useState(() => new Date());
  const announced = useRef<Set<number>>(new Set());

  const remaining = target.getTime() - now.getTime();
  const shape = countdownShape(remaining);

  // Re-arm exactly at the next display change instead of polling.
  useEffect(() => {
    const delay = msUntilCountdownChange(target.getTime() - Date.now());
    const id = setTimeout(() => setNow(new Date()), delay + 20);
    return () => clearTimeout(id);
  }, [target, now]);

  // Reset announcement memory when the target changes (next prayer rolled).
  useEffect(() => {
    announced.current = new Set();
  }, [target]);

  const label =
    shape.kind === 'now'
      ? tr('today.countdownNow')
      : shape.kind === 'minutes'
        ? tr('today.countdownMinutes', { count: shape.minutes })
        : tr('today.countdownHoursMinutes', { hours: shape.hours, minutes: shape.minutes });

  useEffect(() => {
    if (shape.kind !== 'minutes') return;
    if (announceAtMinutes.includes(shape.minutes) && !announced.current.has(shape.minutes)) {
      announced.current.add(shape.minutes);
      AccessibilityInfo.announceForAccessibility(label);
    }
  }, [shape, announceAtMinutes, label]);

  return (
    <AppText {...rest} color={color ?? t.textSecondary} accessibilityLiveRegion="polite">
      {label}
    </AppText>
  );
}
