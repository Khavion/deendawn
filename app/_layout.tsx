import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import React, { Suspense } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { registerBackgroundRefresh } from '@/src/features/notifications/backgroundRefresh';
import { installForegroundHandler } from '@/src/features/notifications/service';
import { useNotificationScheduling } from '@/src/features/notifications/useNotificationScheduling';
import { SettingsProvider } from '@/src/features/settings/SettingsContext';

export const unstable_settings = {
  anchor: '(tabs)',
};

installForegroundHandler();
void registerBackgroundRefresh();

/** Must render inside SettingsProvider to react to settings changes. */
function NotificationScheduler() {
  useNotificationScheduling();
  return null;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded] = useFonts({
    // Extracted from the pinned Amiri release by the content pipeline (OFL 1.1).
    AmiriQuran: require('@/assets/fonts/AmiriQuran.ttf'),
  });

  if (!fontsLoaded) return null;

  return (
    <SettingsProvider>
      <NotificationScheduler />
      <Suspense fallback={null}>
        <SQLiteProvider
          databaseName="quran.db"
          assetSource={{ assetId: require('@/assets/db/quran.db') }}
          useSuspense
        >
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="surah/[id]" options={{ headerBackTitle: 'Quran' }} />
            </Stack>
            <StatusBar style="auto" />
          </ThemeProvider>
        </SQLiteProvider>
      </Suspense>
    </SettingsProvider>
  );
}
