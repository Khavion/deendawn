import { Tabs } from 'expo-router/js-tabs';
import * as QuickActions from 'expo-quick-actions';
import { useQuickActionRouting } from 'expo-quick-actions/router';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { TabBar } from '@/src/components/ui/TabBar';
import { loadLastRead } from '@/src/features/quran/readerState';
import { getUserKVStore } from '@/src/lib/kvStore';

/**
 * The custom DS tab bar (handoff §5 gap 03; DECISIONS 2026-07-31) — replaces
 * NativeTabs so both platforms render the same 66pt surface bar with the gold
 * diamond active mark. No icons until the Gate-#5 geometric set clears; the
 * diamond + label do all the marking. Lineup per the handoff: Today, Quran,
 * Qibla, Tasbih, More — Ask lives inside the Quran tab's stack.
 */
export default function TabLayout() {
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
      { id: 'tasbih', title: tr('tabs.tasbih'), params: { href: '/tasbih' } },
      { id: 'continue', title: tr('quran.continueShort'), params: { href: readerHref } },
    ]);
  }, [tr, i18n.language]);

  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="index"
        options={{ title: tr('tabs.today'), tabBarButtonTestID: 'tab-today' }}
      />
      <Tabs.Screen
        name="quran"
        options={{ title: tr('tabs.quran'), tabBarButtonTestID: 'tab-quran' }}
      />
      <Tabs.Screen
        name="qibla"
        options={{ title: tr('tabs.qibla'), tabBarButtonTestID: 'tab-qibla' }}
      />
      <Tabs.Screen
        name="tasbih"
        options={{ title: tr('tabs.tasbih'), tabBarButtonTestID: 'tab-tasbih' }}
      />
      <Tabs.Screen
        name="more"
        options={{ title: tr('tabs.more'), tabBarButtonTestID: 'tab-more' }}
      />
    </Tabs>
  );
}
