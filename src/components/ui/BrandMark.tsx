import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Gradient } from './Gradient';
import { Marker } from './Marker';
import { withAlpha } from '@/src/lib/color';
import { useTokens } from '@/src/lib/theme/useTokens';
import { useDeviceTier } from '@/src/lib/theme/useDeviceTier';

/**
 * The dawn-arc brand mark (handoff §5 gap 24): a half-circle rising from a
 * hairline horizon — 1.5px ochre stroke, a quiet ochre fill fading upward-
 * out, and the 12px diamond at the apex. Abstract geometry only (aniconism-
 * safe). Static here; the one-time rise/reveal animation is the motion
 * phase's cold-start moment.
 */
export function BrandMark({ size = 224, testID }: { size?: number; testID?: string }) {
  const t = useTokens();
  const { flat } = useDeviceTier();
  const height = size / 2;
  return (
    <View style={[styles.wrap, { width: size }]} testID={testID}>
      <Marker size={12} tone="ochre" style={styles.apex} />
      <View
        style={[
          styles.arc,
          {
            width: size,
            height,
            borderTopLeftRadius: height,
            borderTopRightRadius: height,
            borderColor: t.ochre,
          },
        ]}
      >
        <Gradient
          pointerEvents="none"
          colors={[withAlpha(t.ochre, 0.14), withAlpha(t.ochre, 0)]}
          flat={flat}
          flatColor={withAlpha(t.ochre, 0.07)}
          style={StyleSheet.absoluteFill}
        />
      </View>
      <View style={[styles.horizon, { backgroundColor: t.border }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  apex: { marginBottom: 6 },
  arc: {
    borderWidth: 1.5,
    borderBottomWidth: 0,
    overflow: 'hidden',
  },
  horizon: {
    height: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    marginTop: 0,
    width: '100%',
  },
});
