import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Platform } from 'react-native';

import { useTokens } from '@/src/lib/theme/useTokens';

/**
 * Native tabs (expo-router NativeTabs): UITabBarController on iOS (adopts
 * iOS 26 Liquid Glass — no background/blur overrides beyond the tint, or the
 * material dies), Material bottom navigation on Android.
 *
 * Icons: `sf` is iOS-only; expo-router 57.0.9 has no `md` prop yet, so the
 * Android channel is `src` fed by the official VectorIcon helper — same
 * MaterialIcons glyph names as components/ui/icon-symbol.tsx, no bundled
 * assets. The bar applies its own selected/unselected tint.
 *
 * role="search" is iOS-only on purpose: on Android it breaks tab navigation
 * entirely when transition animations are off (accessibility "Remove
 * animations" or e2e animation-scale 0) — verified on emulator 2026-07-30.
 */
const androidIcon = (name: React.ComponentProps<typeof MaterialIcons>['name']) =>
  Platform.OS === 'android' ? (
    <NativeTabs.Trigger.VectorIcon family={MaterialIcons} name={name} />
  ) : undefined;

export default function TabLayout() {
  const t = useTokens();
  const { t: tr } = useTranslation();

  return (
    <NativeTabs tintColor={t.accent}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon sf="sun.max.fill" src={androidIcon('wb-sunny')} />
        <NativeTabs.Trigger.Label>{tr('tabs.today')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="quran">
        <NativeTabs.Trigger.Icon sf="book.fill" src={androidIcon('menu-book')} />
        <NativeTabs.Trigger.Label>{tr('tabs.quran')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="ask" role={Platform.OS === 'ios' ? 'search' : undefined}>
        <NativeTabs.Trigger.Icon sf="magnifyingglass" src={androidIcon('search')} />
        <NativeTabs.Trigger.Label>{tr('tabs.ask')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="qibla">
        <NativeTabs.Trigger.Icon sf="safari.fill" src={androidIcon('explore')} />
        <NativeTabs.Trigger.Label>{tr('tabs.qibla')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="more">
        <NativeTabs.Trigger.Icon sf="ellipsis.circle.fill" src={androidIcon('more-horiz')} />
        <NativeTabs.Trigger.Label>{tr('tabs.more')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
