import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { useTokens } from '@/src/lib/theme/useTokens';

/**
 * The diamond — the register's only mark (handoff §2): a rotated square in
 * gold. Eyebrow marker, active tab, radio/selection control, calendar
 * observance, qibla marker, tasbih round indicator. Font-independent and
 * aniconism-safe. Decorative by itself: hidden from the accessibility tree —
 * the meaning it marks must live on its parent (a checked state, a label).
 */
export type MarkerSize = 5 | 7 | 8 | 9 | 10 | 12;
export type MarkerTone = 'ochre' | 'border' | 'icon' | 'success' | 'accent';

export interface MarkerProps {
  size?: MarkerSize;
  tone?: MarkerTone;
  variant?: 'filled' | 'outline';
  /** Override the tone-derived color (e.g. onFeatured contexts). */
  color?: string;
  style?: StyleProp<ViewStyle>;
}

export function Marker({ size = 7, tone = 'ochre', variant = 'filled', color, style }: MarkerProps) {
  const t = useTokens();
  const resolved = color ?? t[tone];
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={[
        {
          width: size,
          height: size,
          transform: [{ rotate: '45deg' }],
        },
        variant === 'filled'
          ? { backgroundColor: resolved }
          : { borderWidth: 1, borderColor: resolved },
        style,
      ]}
    />
  );
}
