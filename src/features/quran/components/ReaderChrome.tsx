import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { AppPressable, AppText } from '@/src/components/ui';
import { withAlpha } from '@/src/lib/color';
import { duration, spacing } from '@/src/lib/theme/tokens';
import { useTokens } from '@/src/lib/theme/useTokens';
import { useDeviceTier } from '@/src/lib/theme/useDeviceTier';

export const CHROME_HEIGHT = 56;

/**
 * The reader's own top bar (handoff §6 screen 02 + gap 13): back link,
 * centered title with the surah caption, trailing "Aa". Hides on scroll-down,
 * returns on scroll-up — 250ms transform+fade, instant under Reduce Motion —
 * and leaves the a11y tree while hidden. The 2px ochre reading-progress
 * hairline persists beneath the status bar even with the chrome away.
 */
export function ReaderChrome({
  hidden,
  title,
  subtitle,
  backLabel,
  prefsLabel,
  onBack,
  onPrefs,
  progress,
  topInset,
}: {
  hidden: boolean;
  title: string;
  subtitle: string;
  backLabel: string;
  prefsLabel: string;
  onBack: () => void;
  onPrefs: () => void;
  /** Reading position 0–1 for the persistent hairline. */
  progress: number;
  topInset: number;
}) {
  const t = useTokens();
  const { reduceMotion, flat } = useDeviceTier();
  const anim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: hidden ? 0 : 1,
      duration: reduceMotion || flat ? 0 : duration.normal,
      useNativeDriver: true,
    }).start();
  }, [hidden, anim, reduceMotion, flat]);

  return (
    <>
      <Animated.View
        accessibilityElementsHidden={hidden}
        importantForAccessibility={hidden ? 'no-hide-descendants' : 'auto'}
        pointerEvents={hidden ? 'none' : 'auto'}
        style={[
          styles.bar,
          {
            paddingTop: topInset,
            height: topInset + CHROME_HEIGHT,
            backgroundColor: t.bgCanvas,
            borderBottomColor: t.border,
            opacity: anim,
            transform: [
              {
                translateY: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-(topInset + CHROME_HEIGHT), 0],
                }),
              },
            ],
          },
        ]}
      >
        <AppPressable
          accessibilityRole="button"
          testID="reader-back"
          haptic="press"
          hitSlop={8}
          onPress={onBack}
          style={styles.side}
        >
          <AppText variant="link" numberOfLines={1}>
            {backLabel}
          </AppText>
        </AppPressable>
        <View style={styles.center} pointerEvents="none">
          <AppText variant="bodyStrong" numberOfLines={1}>
            {title}
          </AppText>
          <AppText variant="caption" color={t.textSecondary} numberOfLines={1}>
            {subtitle}
          </AppText>
        </View>
        <AppPressable
          accessibilityRole="button"
          accessibilityLabel={prefsLabel}
          testID="reader-prefs"
          haptic="press"
          hitSlop={8}
          onPress={onPrefs}
          style={[styles.side, styles.end]}
        >
          <AppText variant="link">{prefsLabel}</AppText>
        </AppPressable>
      </Animated.View>
      {/* Persistent reading-progress hairline, above the chrome layer. */}
      <View
        pointerEvents="none"
        style={[styles.track, { top: topInset, backgroundColor: withAlpha(t.ochre, 0.14) }]}
      >
        <View
          style={[
            styles.fill,
            {
              backgroundColor: t.ochre,
              width: `${Math.min(100, Math.max(0, progress * 100))}%`,
            },
          ]}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.l,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing.m,
  },
  side: { minWidth: 56, minHeight: 48, justifyContent: 'center' },
  end: { alignItems: 'flex-end' },
  center: { flex: 1, alignItems: 'center', gap: 1 },
  track: { position: 'absolute', left: 0, right: 0, height: 2, zIndex: 3 },
  fill: { height: 2 },
});
