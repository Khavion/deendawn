import { render } from '@testing-library/react-native';
import React from 'react';

import { AppText } from '../AppText';
import { Divider } from '../Divider';
import { GoldFrameCard } from '../GoldFrameCard';
import { AppThemeProvider } from '@/src/lib/theme/ThemeProvider';
import { featuredGradient, onFeaturedTokens, palette } from '@/src/lib/theme/tokens';
import type { KVStore } from '@/src/lib/kvStore';

const storeWith = (pref: string): KVStore => {
  const map = new Map<string, string>([['theme.pref.v1', pref]]);
  return {
    get: (k: string) => map.get(k) ?? null,
    set: (k: string, v: string) => void map.set(k, v),
    delete: (k: string) => void map.delete(k),
  } as KVStore;
};

describe('GoldFrameCard content tone (handoff gap 02)', () => {
  it('provides the onFeatured palette to children when filled (light)', async () => {
    const { getByText } = await render(
      <AppThemeProvider store={storeWith('light')}>
        <GoldFrameCard gradientColors={featuredGradient.light}>
          <AppText>inside</AppText>
        </GoldFrameCard>
      </AppThemeProvider>
    );
    expect(JSON.stringify(getByText('inside').props.style)).toContain(
      onFeaturedTokens.textPrimary
    );
  });

  it('drops the fill and keeps the ambient palette in dark (§2 night rule)', async () => {
    const { getByText, toJSON } = await render(
      <AppThemeProvider store={storeWith('dark')}>
        <GoldFrameCard gradientColors={featuredGradient.light}>
          <AppText>night</AppText>
        </GoldFrameCard>
      </AppThemeProvider>
    );
    // Text takes the normal dark palette, not the onFeatured ivory.
    expect(JSON.stringify(getByText('night').props.style)).toContain(palette.dark.textPrimary);
    // The card falls back to the surface fill (no gradient layer).
    expect(JSON.stringify(toJSON())).toContain(palette.dark.bgSurface);
  });

  it('contentTone="none" leaves children on the ambient palette', async () => {
    const { getByText } = await render(
      <AppThemeProvider store={storeWith('light')}>
        <GoldFrameCard gradientColors={featuredGradient.light} contentTone="none">
          <AppText>optout</AppText>
        </GoldFrameCard>
      </AppThemeProvider>
    );
    expect(JSON.stringify(getByText('optout').props.style)).toContain(palette.light.textPrimary);
  });

  it('unfilled card children keep the ambient palette', async () => {
    const { getByText } = await render(
      <AppThemeProvider store={storeWith('light')}>
        <GoldFrameCard>
          <AppText>plain</AppText>
        </GoldFrameCard>
      </AppThemeProvider>
    );
    expect(JSON.stringify(getByText('plain').props.style)).toContain(palette.light.textPrimary);
  });

  it('a Divider inside the filled card resolves the onFeatured hairline', async () => {
    const { toJSON } = await render(
      <AppThemeProvider store={storeWith('light')}>
        <GoldFrameCard gradientColors={featuredGradient.light}>
          <Divider testID="d" />
        </GoldFrameCard>
      </AppThemeProvider>
    );
    expect(JSON.stringify(toJSON())).toContain(onFeaturedTokens.border);
  });
});
