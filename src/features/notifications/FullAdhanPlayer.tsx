import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import * as Notifications from 'expo-notifications';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AdhanPrayer } from './scheduler';
import { ThemedText } from '@/components/themed-text';
import { radius, spacing } from '@/src/lib/theme/tokens';
import { useTokens } from '@/src/lib/theme/useTokens';

/** True when the user opened the app from a full-adhan reminder. */
export function wantsFullAdhan(response: Notifications.NotificationResponse): AdhanPrayer | null {
  const data = response.notification.request.content.data as
    { fullAdhan?: boolean; prayer?: AdhanPrayer } | undefined;
  return data?.fullAdhan && data.prayer ? data.prayer : null;
}

/**
 * iOS cannot play long audio from a notification itself; the full adhan plays
 * when the app is opened from the reminder (the sound picker says exactly
 * that). Placeholder audio until license-cleared recordings arrive.
 */
export function FullAdhanPlayer() {
  const t = useTokens();
  const insets = useSafeAreaInsets();
  const { t: tr } = useTranslation();
  const [playing, setPlaying] = useState<AdhanPrayer | null>(null);
  const player = useRef<AudioPlayer | null>(null);

  const stop = () => {
    player.current?.pause();
    player.current?.remove();
    player.current = null;
    setPlaying(null);
  };

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const prayer = wantsFullAdhan(response);
      if (!prayer) return;
      void (async () => {
        await setAudioModeAsync({ playsInSilentMode: true });
        player.current?.remove();
        player.current = createAudioPlayer(require('@/assets/sounds/adhan_full_placeholder.wav'));
        player.current.play();
        setPlaying(prayer);
      })();
    });
    return () => {
      sub.remove();
      player.current?.remove();
    };
  }, []);

  if (!playing) return null;

  return (
    <View
      style={[styles.banner, { backgroundColor: t.accent, top: insets.top + spacing.s }]}
      testID="full-adhan-banner"
    >
      <ThemedText type="defaultSemiBold" style={{ color: t.textOnAccent }}>
        {tr('notifications.playingFullAdhan', { prayer: tr(`prayers.${playing}`) })}
      </ThemedText>
      <Pressable accessibilityRole="button" testID="stop-adhan" onPress={stop} hitSlop={12}>
        <ThemedText type="defaultSemiBold" style={{ color: t.textOnAccent }}>
          {tr('common.stop')}
        </ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    left: spacing.l,
    right: spacing.l,
    zIndex: 10,
    borderRadius: radius.card,
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.m,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
