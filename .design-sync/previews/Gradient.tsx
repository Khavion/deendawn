import React from 'react';
import { View } from 'react-native';
import { AppText, Gradient, featuredGradient, spacing, textOnFeatured } from 'deendawn';

/** The signature forest-green featured fill (dependency-free banded gradient). */
export function FeaturedFill() {
  return (
    <View style={{ padding: spacing.l, maxWidth: 360 }}>
      <Gradient
        colors={featuredGradient.light}
        style={{ borderRadius: 8, padding: spacing.xl, alignItems: 'center' }}
      >
        <AppText variant="title" color={textOnFeatured.light}>
          Dawn sky
        </AppText>
      </Gradient>
    </View>
  );
}

/** Horizontal gold fade — the SectionRule's illuminated hairline, writ large. */
export function GoldFadeHorizontal() {
  return (
    <View style={{ padding: spacing.l, maxWidth: 360 }}>
      <Gradient
        colors={['rgba(138,100,48,0.5)', 'rgba(138,100,48,0)']}
        direction="horizontal"
        style={{ height: 8, borderRadius: 4 }}
      />
    </View>
  );
}

/** `flat` mode: a single fill for low-end devices / reduced motion. */
export function FlatFallback() {
  return (
    <View style={{ padding: spacing.l, maxWidth: 360 }}>
      <Gradient
        colors={featuredGradient.light}
        flat
        style={{ borderRadius: 8, padding: spacing.xl, alignItems: 'center' }}
      >
        <AppText variant="body" color={textOnFeatured.light}>
          Flat fill on the essential tier
        </AppText>
      </Gradient>
    </View>
  );
}
