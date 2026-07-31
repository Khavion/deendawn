import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import * as Notifications from 'expo-notifications';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AdhanPrayer } from './scheduler';
import { AppPressable, AppText } from '@/src/components/ui';
import { TAB_BAR_HEIGHT } from '@/src/components/ui/TabBar';
import { radius, spacing } from '@/src/lib/theme/tokens';
import { useTokens } from '@/src/lib/theme/useTokens';

/** True when the user opened the app from a full-adhan reminder. */
export function wantsFullAdhan(response: Notifications.NotificationResponse): AdhanPrayer | null {
  const data = response.notification.request.content.data as
    { fullAdhan?: boolean; prayer?: AdhanPrayer } | undefined;
  return data?.fullAdhan && data.prayer ? data.prayer : null;
}

/**
 * Notification sounds can't carry a full-length adhan (iOS hard 30s limit;
 * Android stops channel sounds when the shade is cleared) — the full adhan
 * plays when the app is opened from the reminder (the sound picker says
 * exactly that, per platform). Placeholder audio until license-cleared
 * recordings arrive.
 *
 * Cold starts: the warm response listener misses taps that LAUNCH the app
 * (especially Android, where the process usually isn't resident) —
 * getLastNotificationResponseAsync covers that path, deduped by request id
 * so a warm delivery never double-plays.
 */
export function FullAdhanPlayer() {
  const t = useTokens();
  const insets = useSafeAreaInsets();
  const { t: tr } = useTranslation();
  const [playing, setPlaying] = useState<AdhanPrayer | null>(null);
  const player = useRef<AudioPlayer | null>(null);
  const handledResponseIds = useRef<Set<string>>(new Set());

  const stop = () => {
    player.current?.pause();
    player.current?.remove();
    player.current = null;
    setPlaying(null);
  };

  useEffect(() => {
    const handleResponse = (response: Notifications.NotificationResponse) => {
      const prayer = wantsFullAdhan(response);
      if (!prayer) return;
      const requestId = response.notification.request.identifier;
      if (typeof requestId === 'string') {
        if (handledResponseIds.current.has(requestId)) return;
        handledResponseIds.current.add(requestId);
      }
      void (async () => {
        await setAudioModeAsync({ playsInSilentMode: true });
        player.current?.remove();
        player.current = createAudioPlayer(require('@/assets/sounds/adhan_full_placeholder.wav'));
        player.current.play();
        setPlaying(prayer);
      })();
    };
    const sub = Notifications.addNotificationResponseReceivedListener(handleResponse);
    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) handleResponse(response);
    });
    return () => {
      sub.remove();
      player.current?.remove();
    };
  }, []);

  if (!playing) return null;

  return (
    <View
      style={[
        styles.banner,
        { backgroundColor: t.accent, bottom: insets.bottom + TAB_BAR_CLEARANCE },
      ]}
      testID="full-adhan-banner"
    >
      <AppText variant="bodyStrong" style={{ color: t.textOnAccent }}>
        {tr('notifications.playingFullAdhan', { prayer: tr(`prayers.${playing}`) })}
      </AppText>
      <AppPressable
        accessibilityRole="button"
        testID="stop-adhan"
        haptic="press"
        onPress={stop}
        hitSlop={12}
      >
        <AppText variant="bodyStrong" style={{ color: t.textOnAccent }}>
          {tr('common.stop')}
        </AppText>
      </AppPressable>
    </View>
  );
}

// The banner mounts outside the navigation tree, so a top placement would sit
// on pushed screens' native headers. Bottom-anchored it floats just above the
// DS tab bar (exact height now that the bar is ours) and simply rides a
// little higher on pushed screens.
const TAB_BAR_CLEARANCE = TAB_BAR_HEIGHT + spacing.s;

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
