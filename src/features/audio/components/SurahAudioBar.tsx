import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import type { AudioSource } from '../config';
import { getAudioSource } from '../config';
import { formatClock, progressFraction, resumeSeekTarget } from '../playerLogic';
import { clearResumePosition, getResumePosition, saveResumePosition } from '../resumeStore';
import { surahAudioUrl } from '../urls';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useSettings } from '@/src/features/settings/SettingsContext';
import { radius, spacing } from '@/src/lib/theme/tokens';
import { useTokens } from '@/src/lib/theme/useTokens';

const SAVE_INTERVAL_SECONDS = 5;

/**
 * Streaming player for one surah. Renders nothing when no audio source is
 * configured (rule 2: R2 is the only production audio domain) — no dead UI.
 */
export function SurahAudioBar({
  surah,
  title,
  nightWarm,
}: {
  surah: number;
  title: string;
  nightWarm?: boolean;
}) {
  const source = getAudioSource();
  if (!source) return null;
  return <AudioBarInner source={source} surah={surah} title={title} nightWarm={nightWarm} />;
}

function AudioBarInner({
  source,
  surah,
  title,
  nightWarm,
}: {
  source: AudioSource;
  surah: number;
  title: string;
  nightWarm?: boolean;
}) {
  const t = useTokens(nightWarm ? 'nightWarm' : undefined);
  const { t: tr } = useTranslation();
  const { store } = useSettings();
  const url = surahAudioUrl(source.baseUrl, source.reciterId, surah, source.fileExt);
  const player = useAudioPlayer({ uri: url });
  const status = useAudioPlayerStatus(player);
  const [started, setStarted] = useState(false);
  const startedRef = useRef(false);
  const lastSavedRef = useRef(0);
  const positionRef = useRef(0);
  positionRef.current = status.currentTime;

  // Periodic resume-point save while playing; final save on unmount.
  useEffect(() => {
    if (!status.playing) return;
    if (status.currentTime - lastSavedRef.current >= SAVE_INTERVAL_SECONDS) {
      lastSavedRef.current = status.currentTime;
      saveResumePosition(store, source.reciterId, surah, status.currentTime);
    }
  }, [status.playing, status.currentTime, store, source.reciterId, surah]);

  useEffect(() => {
    return () => {
      if (!startedRef.current) return;
      if (positionRef.current > 0) {
        saveResumePosition(store, source.reciterId, surah, positionRef.current);
      }
      player.clearLockScreenControls();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!status.didJustFinish) return;
    clearResumePosition(store, source.reciterId, surah);
    lastSavedRef.current = 0;
    positionRef.current = 0;
    startedRef.current = false;
    setStarted(false);
  }, [status.didJustFinish, store, source.reciterId, surah]);

  const toggle = () => {
    if (status.playing) {
      player.pause();
      saveResumePosition(store, source.reciterId, surah, status.currentTime);
      return;
    }
    if (!started) {
      void setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: true,
        interruptionMode: 'doNotMix',
      });
      const saved = getResumePosition(store, source.reciterId, surah);
      const target = resumeSeekTarget(saved, status.duration);
      if (target > 0) player.seekTo(target);
      player.setActiveForLockScreen(true, {
        title,
        artist: tr('audio.lockScreenArtist'),
      });
      startedRef.current = true;
      setStarted(true);
    }
    player.play();
  };

  const busy = started && (status.isBuffering || !status.isLoaded);

  return (
    <View
      style={[styles.card, { backgroundColor: t.bgSurface, borderColor: t.border }]}
      testID="surah-audio-bar"
    >
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={status.playing ? tr('audio.pause') : tr('audio.play')}
          testID="surah-audio-toggle"
          onPress={toggle}
          hitSlop={12}
          style={[styles.playButton, { backgroundColor: t.accent }]}
        >
          {busy ? (
            <ActivityIndicator size="small" color={t.textOnAccent} />
          ) : (
            <IconSymbol
              name={status.playing ? 'pause.fill' : 'play.fill'}
              size={22}
              color={t.textOnAccent}
            />
          )}
        </Pressable>
        <View style={styles.meta}>
          <ThemedText type="defaultSemiBold" numberOfLines={1}>
            {tr('audio.listen')}
          </ThemedText>
          <ThemedText type="caption" style={{ color: t.textSecondary }} testID="surah-audio-time">
            {started || status.currentTime > 0
              ? `${formatClock(status.currentTime)} / ${formatClock(status.duration)}`
              : tr('audio.streamed')}
          </ThemedText>
        </View>
      </View>
      <View style={[styles.track, { backgroundColor: t.border }]}>
        <View
          style={[
            styles.trackFill,
            {
              backgroundColor: t.accent,
              width: `${progressFraction(status.currentTime, status.duration) * 100}%`,
            },
          ]}
        />
      </View>
      {source.placeholder && (
        <ThemedText type="caption" style={{ color: t.ochre }} testID="audio-dev-badge">
          {tr('audio.devBadge')}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.m,
    marginBottom: spacing.m,
    gap: spacing.s,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.m },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: { flex: 1, gap: 2 },
  track: { height: 3, borderRadius: 1.5, overflow: 'hidden' },
  trackFill: { height: 3 },
});
