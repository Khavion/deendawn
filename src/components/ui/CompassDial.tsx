import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { type AnimatedStyle } from 'react-native-reanimated';

import { AppText } from './AppText';
import { Gradient } from './Gradient';
import { Marker } from './Marker';
import { withAlpha } from '@/src/lib/color';
import { celebration, elevation, richMode, spacing } from '@/src/lib/theme/tokens';
import { useThemeMode } from '@/src/lib/theme/ThemeProvider';
import { useTokens } from '@/src/lib/theme/useTokens';
import { useDeviceTier } from '@/src/lib/theme/useDeviceTier';

/**
 * CompassDial (handoff §5 gap 17): a compass rose on a bgSurface disc —
 * hairline rim, border ticks every 30°, localized cardinal captions
 * (N textPrimary, E/S/W icon — PHYSICAL directions, never RTL-flipped), a
 * fixed 10px notch diamond at 12 o'clock, and the qibla marked on the rose
 * by a 12px ochre diamond with a fading ray toward center. Aligned state
 * applies the celebration grammar to the rim (solid ochre + glow); the one
 * detent and hysteresis live in the qibla feature, not here.
 *
 * Rotation: pass `roseAnimatedStyle` (reanimated/Animated style driving
 * `rotate`) for the live sensor path; without it the rose is rotated
 * statically by −heading (tests, no-compass fallback renders N-up).
 */
export type CompassDialProps = {
  size?: number;
  /** Device heading in degrees, or null before the sensor warms up. */
  heading: number | null;
  /** Great-circle qibla bearing in degrees from true north. */
  bearing: number;
  aligned: boolean;
  /** Static rose (N up) for devices without a magnetometer. */
  noSensor?: boolean;
  /** Live rotation style from the caller's sensor pipeline (reanimated). */
  roseAnimatedStyle?: StyleProp<AnimatedStyle<ViewStyle>>;
  cardinals: { north: string; east: string; south: string; west: string };
  /** Center overlay (live heading readout / bearing display). */
  children?: React.ReactNode;
  testID?: string;
};

const RAY_LENGTH = 92;
const TICKS = Array.from({ length: 12 }, (_, i) => i * 30);

export function CompassDial({
  size = 292,
  heading,
  bearing,
  aligned,
  noSensor = false,
  roseAnimatedStyle,
  cardinals,
  children,
  testID,
}: CompassDialProps) {
  const t = useTokens();
  const mode = useThemeMode();
  const { flat } = useDeviceTier();
  const rm = richMode(mode);

  const staticRotation = noSensor || heading === null ? 0 : -heading;
  const roseStyle: StyleProp<AnimatedStyle<ViewStyle>> =
    roseAnimatedStyle ?? { transform: [{ rotate: `${staticRotation}deg` }] };

  return (
    <View style={{ width: size, height: size }} testID={testID}>
      <View
        style={[
          styles.disc,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: t.bgSurface,
            borderColor: aligned ? t.ochre : t.border,
            borderWidth: aligned ? 1.5 : StyleSheet.hairlineWidth,
          },
          flat ? undefined : elevation[rm].e2,
          aligned && !flat ? celebration.glow : undefined,
        ]}
      >
        <Animated.View style={[styles.rose, roseStyle]}>
          {TICKS.map((deg) => (
            <View key={deg} style={[styles.tickArm, { transform: [{ rotate: `${deg}deg` }] }]}>
              <View style={[styles.tick, { backgroundColor: t.border }]} />
            </View>
          ))}
          {/* E/W absolute physical positions — never mirrored by UI direction. */}
          <AppText variant="caption" style={[styles.north, { color: t.textPrimary }]}>
            {cardinals.north}
          </AppText>
          <View style={styles.eastWrap}>
            <AppText variant="caption" color={t.icon}>
              {cardinals.east}
            </AppText>
          </View>
          <View style={styles.southWrap}>
            <AppText variant="caption" color={t.icon}>
              {cardinals.south}
            </AppText>
          </View>
          <View style={styles.westWrap}>
            <AppText variant="caption" color={t.icon}>
              {cardinals.west}
            </AppText>
          </View>
          {/* Qibla mark riding the rose at its bearing: diamond + fading ray. */}
          <View
            style={[styles.qiblaArm, { transform: [{ rotate: `${bearing}deg` }] }]}
            testID={testID ? `${testID}-qibla-mark` : undefined}
          >
            <Marker size={12} tone="ochre" />
            <Gradient
              pointerEvents="none"
              colors={[withAlpha(t.ochre, 0.55), withAlpha(t.ochre, 0)]}
              style={styles.ray}
              flat={flat}
              flatColor={withAlpha(t.ochre, 0.3)}
            />
          </View>
        </Animated.View>
        <View style={styles.center} pointerEvents="box-none">
          {children}
        </View>
      </View>
      {/* Fixed 12-o'clock notch, outside the rotating rose. */}
      <View style={styles.notch} pointerEvents="none">
        <Marker size={10} tone={aligned ? 'ochre' : 'icon'} />
      </View>
    </View>
  );
}

const fill = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } as const;

const styles = StyleSheet.create({
  disc: { overflow: 'hidden' },
  rose: { ...fill, alignItems: 'center', justifyContent: 'center' },
  tickArm: { ...fill, alignItems: 'center' },
  tick: { width: 1, height: 8, marginTop: 3 },
  north: { position: 'absolute', top: spacing.l, alignSelf: 'center' },
  eastWrap: { position: 'absolute', right: spacing.l, top: '50%', marginTop: -9 },
  southWrap: { position: 'absolute', bottom: spacing.l, alignSelf: 'center' },
  westWrap: { position: 'absolute', left: spacing.l, top: '50%', marginTop: -9 },
  qiblaArm: { ...fill, alignItems: 'center', paddingTop: spacing.xl + spacing.s },
  ray: { width: 2, height: RAY_LENGTH, marginTop: spacing.xs },
  center: { ...fill, alignItems: 'center', justifyContent: 'center' },
  notch: {
    position: 'absolute',
    top: -4,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
});
