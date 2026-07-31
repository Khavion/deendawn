import { Stack } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * The Quran tab's own stack: surah list at the root, Ask pushed inside it
 * (owner decision 2026-07-31 — Ask left the tab row when Tasbih joined it).
 */
export default function QuranStackLayout() {
  const { t: tr } = useTranslation();
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="ask"
        options={{ title: tr('tabs.ask'), headerBackButtonDisplayMode: 'minimal' }}
      />
    </Stack>
  );
}
