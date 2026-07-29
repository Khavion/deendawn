import { DarkTheme, DefaultTheme, ThemeProvider } from "expo-router/react-navigation";
import {
  Newsreader_300Light,
  Newsreader_400Regular,
  Newsreader_400Regular_Italic,
  Newsreader_500Medium,
  Newsreader_600SemiBold,
  Newsreader_700Bold,
} from '@expo-google-fonts/newsreader';
import {
  PublicSans_400Regular,
  PublicSans_500Medium,
  PublicSans_600SemiBold,
  PublicSans_700Bold,
} from '@expo-google-fonts/public-sans';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import React, { Suspense, useEffect, useMemo } from 'react';
import { enableFreeze, enableScreens } from 'react-native-screens';
import 'react-native-reanimated';

import { AppThemeProvider, useTheme } from '@/src/lib/theme/ThemeProvider';
import { fonts, palette, ThemeMode } from '@/src/lib/theme/tokens';

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

// Keep the native splash up until fonts + quran.db are ready — otherwise the OS
// hides it on bundle load and the user sees blank frames while useFonts resolves.
void SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({ fade: true, duration: 200 });

/** Must render inside SettingsProvider to react to settings changes. */
function NotificationScheduler() {
  useNotificationScheduling();
  return null;
}

/** Navigation chrome derived from the resolved theme mode (never pure black). */
function buildNavTheme(mode: ThemeMode) {
  const dark = mode !== 'light';
  const base = dark ? DarkTheme : DefaultTheme;
  const t = palette[mode];
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
}

/** Navigation subtree — reads the app theme so headers follow manual overrides. */
function ThemedNavigation() {
  const { mode } = useTheme();
  const navTheme = useMemo(() => buildNavTheme(mode), [mode]);
  // Mounting here means fonts loaded AND the SQLite Suspense resolved.
  useEffect(() => {
    void SplashScreen.hideAsync();
  }, []);
  return (
    <ThemeProvider value={navTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="surah/[id]" options={{ headerBackButtonDisplayMode: 'minimal' }} />
        <Stack.Screen name="bookmarks" options={{ headerBackButtonDisplayMode: 'minimal' }} />
        <Stack.Screen name="calendar" options={{ headerBackButtonDisplayMode: 'minimal' }} />
        <Stack.Screen name="tasbih" options={{ headerBackButtonDisplayMode: 'minimal' }} />
        <Stack.Screen name="zakat" options={{ headerBackButtonDisplayMode: 'minimal' }} />
        <Stack.Screen name="library" options={{ headerBackButtonDisplayMode: 'minimal' }} />
        <Stack.Screen name="about" options={{ headerBackButtonDisplayMode: 'minimal' }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="thinker/[key]" options={{ headerBackButtonDisplayMode: 'minimal' }} />
        <Stack.Screen name="work/[id]" options={{ headerBackButtonDisplayMode: 'minimal' }} />
        <Stack.Screen name="theme-preview" options={{ headerBackButtonDisplayMode: 'minimal' }} />
        <Stack.Screen name="+not-found" options={{ headerBackButtonDisplayMode: 'minimal' }} />
      </Stack>
      <FullAdhanPlayer />
      <StatusBar style={mode === 'light' ? 'dark' : 'light'} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    // Arabic faces stay pinned content-pipeline artifacts (SIL OFL 1.1).
    AmiriQuran: require('@/assets/fonts/AmiriQuran.ttf'),
    NotoNastaliqUrdu: require('@/assets/fonts/NotoNastaliqUrdu-Regular.ttf'),
    // Latin brand faces (Khavion): Newsreader display serif + Public Sans UI.
    Newsreader_300Light,
    Newsreader_400Regular,
    Newsreader_400Regular_Italic,
    Newsreader_500Medium,
    Newsreader_600SemiBold,
    Newsreader_700Bold,
    PublicSans_400Regular,
    PublicSans_500Medium,
    PublicSans_600SemiBold,
    PublicSans_700Bold,
  });

  if (!fontsLoaded) return null;

  return (
    <SettingsProvider>
      <AppThemeProvider>
        <NotificationScheduler />
        <Suspense fallback={null}>
          <SQLiteProvider
            databaseName="quran.db"
            assetSource={{ assetId: require('@/assets/db/quran.db') }}
            useSuspense
          >
            <ThemedNavigation />
          </SQLiteProvider>
        </Suspense>
      </AppThemeProvider>
    </SettingsProvider>
  );
}
