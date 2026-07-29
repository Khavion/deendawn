import { NativeTabs } from 'expo-router/unstable-native-tabs';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { useTokens } from '@/src/lib/theme/useTokens';

/**
 * Native UITabBarController tabs (expo-router NativeTabs). The bar is drawn by
 * the system, so it adopts iOS 26 Liquid Glass automatically — no background,
 * blur, or color overrides here beyond the selected tint, or the material dies.
 */
export default function TabLayout() {
  const t = useTokens();
  const { t: tr } = useTranslation();

  return (
    <NativeTabs tintColor={t.accent}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon sf="sun.max.fill" />
        <NativeTabs.Trigger.Label>{tr('tabs.today')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="quran">
        <NativeTabs.Trigger.Icon sf="book.fill" />
        <NativeTabs.Trigger.Label>{tr('tabs.quran')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="ask" role="search">
        <NativeTabs.Trigger.Icon sf="magnifyingglass" />
        <NativeTabs.Trigger.Label>{tr('tabs.ask')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="qibla">
        <NativeTabs.Trigger.Icon sf="safari.fill" />
        <NativeTabs.Trigger.Label>{tr('tabs.qibla')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="more">
        <NativeTabs.Trigger.Icon sf="ellipsis.circle.fill" />
        <NativeTabs.Trigger.Label>{tr('tabs.more')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
