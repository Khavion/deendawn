import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Easing,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { duration, radius, spacing } from '@/src/lib/theme/tokens';
import { withAlpha } from '@/src/lib/color';
import { useTokens } from '@/src/lib/theme/useTokens';
import { useDeviceTier } from '@/src/lib/theme/useDeviceTier';

/**
 * Bottom sheet (handoff §5 gap 15): bgSurface, top radius, a 36×4 grabber,
 * 35% textPrimary scrim, ≤300ms settle, swipe-down or scrim-tap dismiss,
 * focus trapped inside while open. Reduce Motion (and the essential tier)
 * degrade to a plain fade. Serves: expanded player, ayah actions, method
 * picker, zakat numeric editor, tasbih custom target.
 */
export type SheetProps = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  accessibilityLabel?: string;
  testID?: string;
};

const DISMISS_DRAG = 90;
const DISMISS_VELOCITY = 0.6;

export function Sheet({ visible, onClose, children, accessibilityLabel, testID }: SheetProps) {
  const t = useTokens();
  const insets = useSafeAreaInsets();
  const { height: windowH } = useWindowDimensions();
  const { reduceMotion, flat } = useDeviceTier();
  const instant = reduceMotion || flat;

  // 0 = settled open; windowH = fully off-screen.
  const translateY = useRef(new Animated.Value(windowH)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const settleOpen = useCallback(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: instant ? duration.fast : duration.normal,
        useNativeDriver: true,
      }),
      instant
        ? Animated.timing(translateY, { toValue: 0, duration: 0, useNativeDriver: true })
        : Animated.timing(translateY, {
            toValue: 0,
            duration: duration.slow,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
    ]).start();
  }, [opacity, translateY, instant]);

  const settleClosed = useCallback(
    (after?: () => void) => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: instant ? duration.fast : duration.normal,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: windowH,
          duration: instant ? 0 : duration.normal,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => after?.());
    },
    [opacity, translateY, instant, windowH]
  );

  useEffect(() => {
    if (visible) settleOpen();
  }, [visible, settleOpen]);

  const requestClose = useCallback(() => {
    settleClosed(onClose);
  }, [settleClosed, onClose]);

  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_e, g) => g.dy > 6 && Math.abs(g.dy) > Math.abs(g.dx),
        onPanResponderMove: (_e, g) => {
          translateY.setValue(Math.max(0, g.dy));
        },
        onPanResponderRelease: (_e, g) => {
          if (g.dy > DISMISS_DRAG || g.vy > DISMISS_VELOCITY) {
            settleClosed(onClose);
          } else {
            Animated.timing(translateY, {
              toValue: 0,
              duration: duration.fast,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }).start();
          }
        },
      }),
    [translateY, settleClosed, onClose]
  );

  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      navigationBarTranslucent
      animationType="none"
      onRequestClose={requestClose}
      testID={testID}
    >
      <Animated.View style={[styles.scrim, { backgroundColor: withAlpha(t.textPrimary, 0.35), opacity }]}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={requestClose}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
          testID={testID ? `${testID}-scrim` : 'sheet-scrim'}
        />
      </Animated.View>
      <View style={styles.host} pointerEvents="box-none">
        <Animated.View
          accessibilityViewIsModal
          style={[
            styles.sheet,
            {
              backgroundColor: t.bgSurface,
              paddingBottom: insets.bottom + spacing.l,
              transform: [{ translateY }],
            },
          ]}
        >
          <View {...pan.panHandlers} style={styles.grabberZone} testID="sheet-grabber">
            <View style={[styles.grabber, { backgroundColor: t.border }]} />
          </View>
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  host: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
    paddingHorizontal: spacing.l,
    paddingTop: spacing.s,
  },
  grabberZone: { alignItems: 'center', paddingVertical: spacing.s },
  grabber: { width: 36, height: 4, borderRadius: 2 },
});
