import React from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { Gradient } from './Gradient';
import { useThemeMode } from '@/src/lib/theme/ThemeProvider';
import {
  elevation,
  radius,
  richMode,
  type ElevationStep,
  type ThemeMode,
} from '@/src/lib/theme/tokens';
import { useTokens } from '@/src/lib/theme/useTokens';
import { useDeviceTier } from '@/src/lib/theme/useDeviceTier';

export type GoldFrameCardProps = ViewProps & {
  /** If set, the card is filled with this gradient (the featured green card). */
  gradientColors?: string[];
  /** Elevation step (default e3 — the featured card sits highest). */
  step?: ElevationStep;
  /** Show the gold corner brackets (auto-off on the essential tier). */
  corners?: boolean;
  /**
   * Override the theme mode (e.g. the reader's night-warm) so the frame color
   * and elevation match a locally-themed surface. Defaults to the app mode.
   */
  mode?: ThemeMode;
};

/**
 * The ONE featured card per screen (docs/RICH_DESIGN_SPEC.md): a fine gold
 * frame with small gold corner brackets, an optional gradient fill, and the
 * green-tinted E3 elevation. On the essential tier the brackets and gradient
 * fall back to a plain border + flat fill.
 */
export function GoldFrameCard({
  gradientColors,
  step = 'e3',
  corners = true,
  mode,
  style,
  children,
  ...rest
}: GoldFrameCardProps) {
  const appMode = useThemeMode();
  const t = useTokens(mode);
  const { flat } = useDeviceTier();
  const rm = richMode(mode ?? appMode);
  const shadow = flat ? undefined : elevation[rm][step];
  const showCorners = corners && !flat;

  return (
    <View
      style={[
        styles.card,
        { borderColor: t.ochre, backgroundColor: gradientColors ? 'transparent' : t.bgSurface },
        shadow,
        style,
      ]}
      {...rest}
    >
      {gradientColors ? (
        <Gradient
          colors={gradientColors}
          flat={flat}
          style={[StyleSheet.absoluteFill, styles.fill]}
        />
      ) : null}
      {children}
      {showCorners ? <Corners color={t.ochre} /> : null}
    </View>
  );
}

const BRACKET = 14;

function Corners({ color }: { color: string }) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={[styles.corner, styles.tl, { borderColor: color }]} />
      <View style={[styles.corner, styles.tr, { borderColor: color }]} />
      <View style={[styles.corner, styles.bl, { borderColor: color }]} />
      <View style={[styles.corner, styles.br, { borderColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  fill: { borderRadius: radius.card },
  corner: { position: 'absolute', width: BRACKET, height: BRACKET },
  tl: { top: 5, left: 5, borderTopWidth: 1.5, borderLeftWidth: 1.5 },
  tr: { top: 5, right: 5, borderTopWidth: 1.5, borderRightWidth: 1.5 },
  bl: { bottom: 5, left: 5, borderBottomWidth: 1.5, borderLeftWidth: 1.5 },
  br: { bottom: 5, right: 5, borderBottomWidth: 1.5, borderRightWidth: 1.5 },
});
