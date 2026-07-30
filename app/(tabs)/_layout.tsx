import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as QuickActions from 'expo-quick-actions';
import { useQuickActionRouting } from 'expo-quick-actions/router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform } from 'react-native';

import { loadLastRead } from '@/src/features/quran/readerState';
import { getUserKVStore } from '@/src/lib/kvStore';
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
  const { t: tr, i18n } = useTranslation();

  // Long-press-icon app shortcuts (Android; iOS gets the same list as Home
  // Screen quick actions for free). Re-set on language change so titles
  // localize; "Continue reading" deep-links to the exact last-read ayah,
  // refreshed each time the tab layout mounts.
  useQuickActionRouting();
  useEffect(() => {
    const lastRead = loadLastRead(getUserKVStore());
    const readerHref = lastRead
      ? `/surah/${lastRead.surah}?ayah=${lastRead.ayah}`
      : '/quran';
    void QuickActions.setItems([
      { id: 'qibla', title: tr('tabs.qibla'), params: { href: '/qibla' } },
      { id: 'tasbih', title: tr('more.tasbih'), params: { href: '/tasbih' } },
      { id: 'continue', title: tr('quran.continueShort'), params: { href: readerHref } },
    ]);
  }, [tr, i18n.language]);

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
