import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppPressable } from './AppPressable';
import { AppText } from './AppText';
import { Gradient } from './Gradient';
import { ProgressRing } from './ProgressRing';
import { Skeleton } from './Skeleton';
import { TransportMark } from './TransportMark';
import { withAlpha } from '@/src/lib/color';
import { elevation, radius, richMode, spacing } from '@/src/lib/theme/tokens';
import { useThemeMode } from '@/src/lib/theme/ThemeProvider';
import { useTokens } from '@/src/lib/theme/useTokens';
import { useDeviceTier } from '@/src/lib/theme/useDeviceTier';

/**
 * ListenBar (handoff §5 gap 10) — the collapsed audio presence: a docked
 * card floating over a canvas fade, a 40px accent play control, title +
 * reciter credit, an ayah position, and a 2px ochre progress hairline over
 * a faint track. Buffering swaps the control ring to the dashed state and
 * the duration slot to a Skeleton with zero layout shift. Tapping the body
 * expands (the Sheet player); tapping the control toggles playback.
 */
export type ListenBarProps = {
  title: string;
  /** Reciter credit — always shown (constitution: reciter always credited). */
  subtitle: string;
  /** e.g. "3 / 7" (localized by the caller). */
  positionLabel?: string;
  /** 0–1 playback progress. */
  progress: number;
  state: 'playing' | 'paused' | 'buffering';
  bufferingLabel?: string;
  onToggle: () => void;
  onExpand?: () => void;
  toggleAccessibilityLabel: string;
  expandAccessibilityLabel?: string;
  testID?: string;
};

const CONTROL = 40;
const FADE_HEIGHT = 120;

export function ListenBar({
  title,
  subtitle,
  positionLabel,
  progress,
  state,
  bufferingLabel,
  onToggle,
  onExpand,
  toggleAccessibilityLabel,
  expandAccessibilityLabel,
  testID,
}: ListenBarProps) {
  const t = useTokens();
  const mode = useThemeMode();
  const { flat } = useDeviceTier();
  const rm = richMode(mode);
  const buffering = state === 'buffering';

  return (
    <View pointerEvents="box-none" testID={testID}>
      <Gradient
        pointerEvents="none"
        colors={[withAlpha(t.bgCanvas, 0), withAlpha(t.bgCanvas, 0.92)]}
        style={styles.fade}
        flat={flat}
        flatColor={withAlpha(t.bgCanvas, 0.92)}
      />
      <View
        style={[
          styles.card,
          { backgroundColor: t.bgSurface, borderColor: t.border },
          flat ? undefined : elevation[rm].e2,
        ]}
      >
        <View style={styles.row}>
          <AppPressable
            accessibilityRole="button"
            accessibilityLabel={toggleAccessibilityLabel}
            haptic="press"
            onPress={onToggle}
            style={styles.controlZone}
            testID={testID ? `${testID}-toggle` : undefined}
          >
            {buffering ? (
              <ProgressRing size={CONTROL} strokeWidth={3} progress={0} state="buffering">
                <View style={[styles.controlCore, { backgroundColor: t.accentSoft }]} />
              </ProgressRing>
            ) : (
              <View style={[styles.control, { backgroundColor: t.accent }]}>
                <TransportMark
                  kind={state === 'playing' ? 'pause' : 'play'}
                  size={14}
                  color={t.textOnAccent}
                />
              </View>
            )}
          </AppPressable>
          <AppPressable
            accessibilityRole={onExpand ? 'button' : undefined}
            accessibilityLabel={expandAccessibilityLabel}
            onPress={onExpand}
            disabled={!onExpand}
            style={styles.meta}
            testID={testID ? `${testID}-expand` : undefined}
          >
            <AppText variant="bodyStrong" numberOfLines={1}>
              {title}
            </AppText>
            {buffering && bufferingLabel ? (
              <View style={styles.bufferRow}>
                <AppText variant="caption" color={t.textSecondary} numberOfLines={1} style={styles.grow}>
                  {bufferingLabel}
                </AppText>
                <Skeleton width={34} height={12} />
              </View>
            ) : (
              <AppText variant="caption" color={t.textSecondary} numberOfLines={1}>
                {subtitle}
              </AppText>
            )}
          </AppPressable>
          {positionLabel ? (
            <AppText variant="caption" color={t.textSecondary}>
              {positionLabel}
            </AppText>
          ) : null}
        </View>
        <View style={[styles.track, { backgroundColor: withAlpha(t.ochre, 0.16) }]}>
          <View
            style={[
              styles.fill,
              buffering
                ? { width: '30%', backgroundColor: withAlpha(t.ochre, 0.45) }
                : { width: `${Math.min(100, Math.max(0, progress * 100))}%`, backgroundColor: t.ochre },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: FADE_HEIGHT,
  },
  card: {
    marginHorizontal: spacing.m,
    marginBottom: spacing.m,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.m,
    padding: spacing.m,
  },
  controlZone: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  control: {
    width: CONTROL,
    height: CONTROL,
    borderRadius: CONTROL / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlCore: {
    width: CONTROL - 10,
    height: CONTROL - 10,
    borderRadius: (CONTROL - 10) / 2,
  },
  meta: { flex: 1, gap: 2 },
  bufferRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.s },
  grow: { flexShrink: 1 },
  track: { height: 2, width: '100%' },
  fill: { height: 2 },
});
