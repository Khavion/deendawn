import React, { useContext, useMemo } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { Gradient } from './Gradient';
import { ThemeContext, useThemeMode } from '@/src/lib/theme/ThemeProvider';
import {
  elevation,
  onFeaturedTokens,
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
  /**
   * Content theming when the gradient fill renders (handoff §5 gap 02):
   * 'auto' provides the onFeatured palette to the subtree so AppText/
   * PeriodEyebrow/Divider land legibly without hand-passed colors; 'none'
   * opts out for callers that manage their own colors.
   */
  contentTone?: 'auto' | 'none';
};

/**
 * The ONE featured card per screen (handoff §2): a fine gold frame with small
 * gold corner brackets, an optional gradient fill, and the green-tinted E3
 * elevation. Night mutes the featured fill — in dark/nightWarm the gradient
 * is DROPPED (a lit block is the loudest thing in a dark room) and the card
 * reads as a gold hairline on the surface. On the essential tier the brackets
 * and gradient fall back to a plain border + flat fill.
 */
export function GoldFrameCard({
  gradientColors,
  step = 'e3',
  corners = true,
  mode,
  contentTone = 'auto',
  style,
  children,
  ...rest
}: GoldFrameCardProps) {
  const appMode = useThemeMode();
  const t = useTokens(mode);
  const parentCtx = useContext(ThemeContext);
  const { flat } = useDeviceTier();
  const rm = richMode(mode ?? appMode);
  const shadow = flat ? undefined : elevation[rm][step];
  const showCorners = corners && !flat;
  // §2 "night mutes the featured fill": the gradient only renders in light.
  const fillShown = !!gradientColors && rm === 'light';

  const featuredCtx = useMemo(
    () =>
      parentCtx
        ? { ...parentCtx, mode: 'dark' as const, tokens: onFeaturedTokens }
        : {
            mode: 'dark' as const,
            pref: 'system' as const,
            setPref: () => {},
            tokens: onFeaturedTokens,
          },
    [parentCtx]
  );

  const content =
    fillShown && contentTone === 'auto' ? (
      <ThemeContext.Provider value={featuredCtx}>{children}</ThemeContext.Provider>
    ) : (
      children
    );

  return (
    <View
      style={[
        styles.card,
        { borderColor: t.ochre, backgroundColor: fillShown ? 'transparent' : t.bgSurface },
        shadow,
        style,
      ]}
      {...rest}
    >
      {fillShown ? (
        <Gradient
          colors={gradientColors}
          flat={flat}
          style={[StyleSheet.absoluteFill, styles.fill]}
        />
      ) : null}
      {content}
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
