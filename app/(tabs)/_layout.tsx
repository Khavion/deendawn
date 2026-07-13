import { Tabs } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.today'),
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="sun.max.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="quran"
        options={{
          title: t('tabs.quran'),
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="book.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="qibla"
        options={{
          title: t('tabs.qibla'),
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="safari.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: t('tabs.more'),
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="ellipsis.circle.fill" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
