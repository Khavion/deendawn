import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
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

  return (
    <SettingsProvider>
      <NotificationScheduler />
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </SettingsProvider>
  );
}
