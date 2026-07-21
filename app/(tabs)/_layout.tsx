import { Tabs } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTokens } from '@/src/lib/theme/useTokens';

export default function TabLayout() {
  const t = useTokens();
  const { t: tr } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        // Follow the app ThemeProvider (light/dark/night-warm), not the raw OS
        // scheme — so a manual theme override colours the tab bar correctly.
        tabBarActiveTintColor: t.accent,
        tabBarInactiveTintColor: t.icon,
        tabBarStyle: { backgroundColor: t.bgSurface, borderTopColor: t.border },
        headerShown: false,
        tabBarButton: HapticTab,
        freezeOnBlur: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: tr('tabs.today'),
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="sun.max.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="quran"
        options={{
          title: tr('tabs.quran'),
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="book.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="ask"
        options={{
          title: tr('tabs.ask'),
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="magnifyingglass" color={color} />,
        }}
      />
      <Tabs.Screen
        name="qibla"
        options={{
          title: tr('tabs.qibla'),
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="safari.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: tr('tabs.more'),
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="ellipsis.circle.fill" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
