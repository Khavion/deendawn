import React from 'react';
import { View } from 'react-native';
import {
  AppText,
  GoldFrameCard,
  featuredGradient,
  spacing,
  textOnFeatured,
} from 'deendawn';

/** The featured next-prayer hero: gradient fill, gold frame, corner brackets. */
export function FeaturedHero() {
  return (
    <View style={{ padding: spacing.l, maxWidth: 360 }}>
      <GoldFrameCard
        gradientColors={featuredGradient.light}
        style={{ padding: spacing.xl, alignItems: 'center', gap: spacing.s }}
      >
        <AppText variant="eyebrow" color="rgba(247,246,242,0.75)">
          NEXT PRAYER
        </AppText>
        <AppText variant="title" color={textOnFeatured.light}>
          Maghrib
        </AppText>
        <AppText variant="display" color={textOnFeatured.light}>
          8:16 PM
        </AppText>
        <AppText variant="body" color="rgba(247,246,242,0.75)">
          in 1h 58m
        </AppText>
      </GoldFrameCard>
    </View>
  );
}

/** Plain-surface variant — gold frame + brackets on the surface color. */
export function PlainSurface() {
  return (
    <View style={{ padding: spacing.l, maxWidth: 360 }}>
      <GoldFrameCard style={{ padding: spacing.l, gap: spacing.s }}>
        <AppText variant="bodyStrong">Continue reading — 2:255</AppText>
        <AppText variant="caption">Al-Baqara · The Cow</AppText>
      </GoldFrameCard>
    </View>
  );
}

/** Corner brackets off — just the fine gold frame. */
export function NoCorners() {
  return (
    <View style={{ padding: spacing.l, maxWidth: 360 }}>
      <GoldFrameCard corners={false} style={{ padding: spacing.l }}>
        <AppText variant="body">A quieter framed surface without the brackets.</AppText>
      </GoldFrameCard>
    </View>
  );
}
