import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import React, { Suspense, useMemo } from 'react';
import { enableFreeze, enableScreens } from 'react-native-screens';
import 'react-native-reanimated';

import { fonts, palette } from '@/src/lib/theme/tokens';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { FullAdhanPlayer } from '@/src/features/notifications/FullAdhanPlayer';
import { registerBackgroundRefresh } from '@/src/features/notifications/backgroundRefresh';
import { installForegroundHandler } from '@/src/features/notifications/service';
import { useNotificationScheduling } from '@/src/features/notifications/useNotificationScheduling';
import { SettingsProvider } from '@/src/features/settings/SettingsContext';
import { initI18n, loadLanguage } from '@/src/lib/i18n';
import { getUserKVStore } from '@/src/lib/kvStore';

export const unstable_settings = {
  anchor: '(tabs)',
};

// E7 navigation feel: native screens + freeze inactive screens (memory + frames).
enableScreens(true);
enableFreeze(true);

installForegroundHandler();
void registerBackgroundRefresh();
// Module scope on purpose: the React Compiler may drop side-effectful useMemo.
initI18n(loadLanguage(getUserKVStore()));

/** Must render inside SettingsProvider to react to settings changes. */
function NotificationScheduler() {
  useNotificationScheduling();
  return null;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  // Navigation chrome derives from the token palettes (never pure black).
  const navTheme = useMemo(() => {
    const dark = colorScheme === 'dark';
    const base = dark ? DarkTheme : DefaultTheme;
    const t = palette[dark ? 'dark' : 'light'];
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: t.accent,
        background: t.bgCanvas,
        card: t.bgCanvas,
        text: t.textPrimary,
        border: t.border,
        notification: t.accent,
      },
      fonts: {
        ...base.fonts,
        regular: { ...base.fonts.regular, fontFamily: fonts.sans },
        medium: { ...base.fonts.medium, fontFamily: fonts.sansMedium },
        bold: { ...base.fonts.bold, fontFamily: fonts.sansSemiBold },
        heavy: { ...base.fonts.heavy, fontFamily: fonts.sansSemiBold },
      },
    };
  }, [colorScheme]);
  const [fontsLoaded] = useFonts({
    // All extracted from pinned releases by the content pipeline (SIL OFL 1.1).
    AmiriQuran: require('@/assets/fonts/AmiriQuran.ttf'),
    'Literata-Regular': require('@/assets/fonts/Literata-Regular.ttf'),
    'Literata-Medium': require('@/assets/fonts/Literata-Medium.ttf'),
    'Literata-SemiBold': require('@/assets/fonts/Literata-SemiBold.ttf'),
    'SourceSans3-Regular': require('@/assets/fonts/SourceSans3-Regular.ttf'),
    'SourceSans3-Medium': require('@/assets/fonts/SourceSans3-Medium.ttf'),
    'SourceSans3-Semibold': require('@/assets/fonts/SourceSans3-Semibold.ttf'),
    NotoNastaliqUrdu: require('@/assets/fonts/NotoNastaliqUrdu-Regular.ttf'),
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
          <ThemeProvider value={navTheme}>
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen
                name="surah/[id]"
                options={{ headerBackButtonDisplayMode: 'minimal' }}
              />
              <Stack.Screen name="calendar" options={{ headerBackButtonDisplayMode: 'minimal' }} />
              <Stack.Screen name="tasbih" options={{ headerBackButtonDisplayMode: 'minimal' }} />
              <Stack.Screen name="zakat" options={{ headerBackButtonDisplayMode: 'minimal' }} />
              <Stack.Screen name="library" options={{ headerBackButtonDisplayMode: 'minimal' }} />
              <Stack.Screen
                name="thinker/[key]"
                options={{ headerBackButtonDisplayMode: 'minimal' }}
              />
              <Stack.Screen name="work/[id]" options={{ headerBackButtonDisplayMode: 'minimal' }} />
            </Stack>
            <FullAdhanPlayer />
            <StatusBar style="auto" />
          </ThemeProvider>
        </SQLiteProvider>
      </Suspense>
    </SettingsProvider>
  );
}
