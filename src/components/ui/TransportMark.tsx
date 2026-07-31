import React from 'react';
import { I18nManager, StyleSheet, View } from 'react-native';

/**
 * Transport marks (handoff §5 gap 11) — play/pause/prev/next drawn from
 * plain Views. GATE-5-PLACEHOLDER: these CSS-triangle shapes stand in until
 * the scholar-approved geometric icon set clears; swap sites, not callers.
 * Direction-locked: prev/next mirror manually under RTL (audio transport
 * follows time, not writing direction — mirroring here means "previous ayah"
 * keeps pointing at the previous ayah).
 */
export type TransportKind = 'play' | 'pause' | 'prev' | 'next';

export function TransportMark({
  kind,
  size = 14,
  color,
}: {
  kind: TransportKind;
  size?: number;
  color: string;
}) {
  const rtl = I18nManager.isRTL;
  const pointsEnd = kind === 'play' || kind === 'next';
  // In RTL the row is mirrored, so an "end-pointing" triangle must flip to
  // keep pointing forward in time.
  const flip = rtl ? !pointsEnd : pointsEnd;

  if (kind === 'pause') {
    const barW = Math.max(3, size * 0.28);
    return (
      <View style={[styles.row, { gap: barW }]} accessibilityElementsHidden importantForAccessibility="no">
        <View style={{ width: barW, height: size, backgroundColor: color }} />
        <View style={{ width: barW, height: size, backgroundColor: color }} />
      </View>
    );
  }

  const triangle = (
    <View
      style={{
        width: 0,
        height: 0,
        borderTopWidth: size / 2,
        borderBottomWidth: size / 2,
        borderTopColor: 'transparent',
        borderBottomColor: 'transparent',
        ...(flip
          ? { borderLeftWidth: size * 0.85, borderLeftColor: color }
          : { borderRightWidth: size * 0.85, borderRightColor: color }),
      }}
    />
  );

  if (kind === 'play') {
    return (
      <View accessibilityElementsHidden importantForAccessibility="no">
        {triangle}
      </View>
    );
  }

  // prev/next: triangle plus a stop bar on the pointed side.
  const bar = <View style={{ width: Math.max(2, size * 0.18), height: size, backgroundColor: color }} />;
  return (
    <View style={styles.row} accessibilityElementsHidden importantForAccessibility="no">
      {flip ? (
        <>
          {triangle}
          {bar}
        </>
      ) : (
        <>
          {bar}
          {triangle}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 2 },
});
