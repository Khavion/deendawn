import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { addBecomingNoisyListener } from '../becomingNoisy';
import type { AudioSource } from '../config';
import { getAudioSource } from '../config';
import { formatClock, progressFraction, resumeSeekTarget } from '../playerLogic';
import { clearResumePosition, getResumePosition, saveResumePosition } from '../resumeStore';
import { reciterName } from '../reciters';
import {
  nextRateChoice,
  nextSleepChoice,
  sleepDeadline,
  sleepExpired,
  type RateChoice,
  type SleepChoice,
} from '../sleepTimer';
import {
  deleteSurahAudio,
  downloadBytes,
  ensureSurahAudio,
  isMarkedDownloaded,
  markDownloaded,
  type AudioDownloadState,
} from '../downloads/downloadManager';
import { resolvePlayableUri } from '../downloads/resolveSource';
import { surahAudioUrl } from '../urls';
import {
  AppPressable,
  AppText,
  ListenBar,
  PeriodEyebrow,
  ProgressRing,
  Sheet,
  TransportMark,
} from '@/src/components/ui';
import { useSettings } from '@/src/features/settings/SettingsContext';
import { spacing } from '@/src/lib/theme/tokens';
import { useTokens } from '@/src/lib/theme/useTokens';

const SAVE_INTERVAL_SECONDS = 5;
const SKIP_SECONDS = 15;

/** Documents dir via lazy expo-file-system (absent in jest — downloads off). */
function getDocumentsDir(): string | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- lazy native
    const { Paths } = require('expo-file-system');
    return String(Paths.document.uri).replace(/\/+$/, '');
  } catch {
    return null;
  }
}

/**
 * Streaming player for one surah (handoff §6 screens 02/03): the collapsed
 * ListenBar docked in the reader, expanding into the Sheet player. Renders
 * nothing when no audio source is configured (rule 2: R2 is the only
 * production audio domain) — no dead UI.
 *
 * Seeking is ±15s, NOT by ayah: the bucket serves per-surah files and no
 * per-ayah timing artifact exists yet (DECISIONS 2026-07-31 — the deck's
 * ayah-seek and "Reciting" follow land with the pinned QUL segments
 * artifact, if adopted).
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
  // Local-first: a kept-offline surah plays from its verified file.
  const documentsDir = getDocumentsDir();
  const url = documentsDir
    ? resolvePlayableUri(source, surah, store, documentsDir).uri
    : surahAudioUrl(source.baseUrl, source.reciterId, surah, source.fileExt);
  const player = useAudioPlayer({ uri: url });
  const status = useAudioPlayerStatus(player);
  const [started, setStarted] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showRemaining, setShowRemaining] = useState(false);
  const [repeatOn, setRepeatOn] = useState(false);
  const [rate, setRate] = useState<RateChoice>(1);
  const [sleep, setSleep] = useState<SleepChoice>(0);
  const [kept, setKept] = useState(() => isMarkedDownloaded(store, source.reciterId, surah));
  const [dl, setDl] = useState<AudioDownloadState>({ phase: 'idle' });
  const sleepAtRef = useRef<Date | null>(null);
  const startedRef = useRef(false);
  const lastSavedRef = useRef(0);
  const positionRef = useRef(0);
  useEffect(() => {
    positionRef.current = status.currentTime;
  }, [status.currentTime]);

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
      try {
        player.clearLockScreenControls();
      } catch {
        // expo-modules-core releases the native player BEFORE this cleanup
        // runs (its internal effect registers first), so this call can hit a
        // freed shared object — a hard crash on plain back-navigation after
        // playing (reproduced live on iOS, review finding). The OS tears the
        // lock-screen controls down with the player, so swallowing is
        // correct; the resume-position save above is JS-only and always
        // lands first.
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Headphone/Bluetooth disconnect pauses playback (Android — expo-audio
  // 57.0.x never will; see becomingNoisy.ts). Subscribed only while playing.
  useEffect(() => {
    if (!status.playing) return;
    const sub = addBecomingNoisyListener(() => {
      player.pause();
      if (positionRef.current > 0) {
        saveResumePosition(store, source.reciterId, surah, positionRef.current);
      }
    });
    return () => sub.remove();
  }, [status.playing, player, store, source.reciterId, surah]);

  // Sleep timer: checked on the status cadence (~every playback tick).
  useEffect(() => {
    if (!status.playing) return;
    if (sleepExpired(sleepAtRef.current, new Date())) {
      sleepAtRef.current = null;
      setSleep(0);
      player.pause();
    }
  }, [status.playing, status.currentTime, player]);

  useEffect(() => {
    if (!status.didJustFinish) return;
    clearResumePosition(store, source.reciterId, surah);
    lastSavedRef.current = 0;
    if (repeatOn) {
      player.seekTo(0);
      player.play();
      return;
    }
    positionRef.current = 0;
    startedRef.current = false;
    // expo-audio surfaces track-finish only as a status flag (no event/callback
    // API), so resetting the session UI in response to it is the supported
    // pattern; didJustFinish is not affected by the reset, so it cannot cascade.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStarted(false);
  }, [status.didJustFinish, store, source.reciterId, surah, repeatOn, player]);

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
        // Real recitation credits the reciter on the lock screen; the dev
        // tone credits the app so it can never read as recitation (rule 1).
        artist: reciterName(source.reciterId) ?? tr('audio.lockScreenArtist'),
      });
      startedRef.current = true;
      setStarted(true);
    }
    player.play();
  };

  const skip = (dir: 1 | -1) => {
    const target = Math.max(
      0,
      Math.min(status.duration || 0, status.currentTime + dir * SKIP_SECONDS)
    );
    player.seekTo(target);
  };

  const cycleRate = () => {
    const next = nextRateChoice(rate);
    setRate(next);
    player.setPlaybackRate(next);
  };

  const cycleSleep = () => {
    const next = nextSleepChoice(sleep);
    setSleep(next);
    sleepAtRef.current = sleepDeadline(next, new Date());
  };

  // Keep offline (owner decision: streaming + saved copies). Consent is the
  // size shown in the control itself; the download verifies against the
  // pinned audio.lock hash before it is ever marked kept.
  const dir = getDocumentsDir();
  const canDownload = !!dir && !source.placeholder && downloadBytes(source.reciterId, surah) !== null;
  const sizeMb = Math.max(1, Math.round((downloadBytes(source.reciterId, surah) ?? 0) / 1_000_000));
  const toggleOffline = async () => {
    if (!dir) return;
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- lazy native
    const { expoAudioDownloadPlatform } = require('../downloads/platform');
    if (kept) {
      await deleteSurahAudio(source.reciterId, surah, { documentsDir: dir }, expoAudioDownloadPlatform, store);
      setKept(false);
      setDl({ phase: 'idle' });
      return;
    }
    const final = await ensureSurahAudio(
      source.reciterId,
      surah,
      { baseUrl: source.baseUrl, documentsDir: dir, allowCellular: true },
      expoAudioDownloadPlatform,
      setDl
    );
    if (final.phase === 'ready') {
      markDownloaded(store, source.reciterId, surah, true);
      setKept(true);
    }
  };

  const busy = started && (status.isBuffering || !status.isLoaded);
  const credit = reciterName(source.reciterId) ?? tr('audio.lockScreenArtist');
  const progress = progressFraction(status.currentTime, status.duration);
  const positionLabel =
    started || status.currentTime > 0
      ? tr('audio.positionOf', {
          position: showRemaining
            ? `−${formatClock(Math.max(0, status.duration - status.currentTime))}`
            : formatClock(status.currentTime),
          duration: formatClock(status.duration),
        })
      : undefined;

  return (
    <>
      <View testID="surah-audio-bar">
        <ListenBar
          title={title}
          subtitle={
            source.placeholder ? `${credit} · ${tr('audio.devBadge')}` : credit
          }
          positionLabel={positionLabel}
          progress={progress}
          state={busy ? 'buffering' : status.playing ? 'playing' : 'paused'}
          bufferingLabel={tr('audio.preparing')}
          onToggle={toggle}
          onExpand={() => setExpanded(true)}
          toggleAccessibilityLabel={status.playing ? tr('audio.pause') : tr('audio.play')}
          expandAccessibilityLabel={tr('audio.expand')}
          testID="listen-bar"
        />
      </View>

      <Sheet
        visible={expanded}
        onClose={() => setExpanded(false)}
        accessibilityLabel={tr('audio.nowPlaying')}
        testID="player-sheet"
      >
        <View style={styles.sheetBody}>
          <PeriodEyebrow label={tr('audio.nowPlaying')} />
          <AppText variant="title" numberOfLines={1}>
            {title}
          </AppText>
          <AppText variant="caption" color={t.textSecondary}>
            {credit}
          </AppText>

          <View style={styles.transportRow}>
            <AppPressable
              accessibilityRole="button"
              accessibilityLabel={tr('audio.skipBack')}
              testID="player-skip-back"
              haptic="press"
              onPress={() => skip(-1)}
              style={styles.transportTarget}
            >
              <TransportMark kind="prev" size={16} color={t.textSecondary} />
            </AppPressable>
            <ProgressRing
              size={96}
              strokeWidth={3}
              progress={progress}
              state={busy ? 'buffering' : 'determinate'}
              accessibilityLabel={tr('audio.nowPlaying')}
              testID="player-ring"
            >
              <AppPressable
                accessibilityRole="button"
                accessibilityLabel={status.playing ? tr('audio.pause') : tr('audio.play')}
                testID="player-toggle"
                haptic="press"
                onPress={toggle}
                style={[
                  styles.playCore,
                  { backgroundColor: busy ? t.accentSoft : t.accent },
                ]}
              >
                <TransportMark
                  kind={status.playing ? 'pause' : 'play'}
                  size={22}
                  color={busy ? t.textOnAccentSoft : t.textOnAccent}
                />
              </AppPressable>
            </ProgressRing>
            <AppPressable
              accessibilityRole="button"
              accessibilityLabel={tr('audio.skipForward')}
              testID="player-skip-forward"
              haptic="press"
              onPress={() => skip(1)}
              style={styles.transportTarget}
            >
              <TransportMark kind="next" size={16} color={t.textSecondary} />
            </AppPressable>
          </View>

          {positionLabel ? (
            <AppPressable
              accessibilityRole="button"
              testID="player-position"
              hitSlop={8}
              onPress={() => setShowRemaining((v) => !v)}
            >
              <AppText variant="caption" color={t.textSecondary}>
                {busy ? `${tr('audio.preparing')} · ${positionLabel}` : positionLabel}
              </AppText>
            </AppPressable>
          ) : null}

          <View style={styles.quietRow}>
            <AppPressable
              accessibilityRole="button"
              accessibilityState={{ selected: repeatOn }}
              testID="player-repeat"
              haptic="select"
              hitSlop={8}
              onPress={() => setRepeatOn((v) => !v)}
            >
              <AppText variant="caption" color={repeatOn ? t.ochre : t.textSecondary}>
                {tr('audio.repeatSurah')}
              </AppText>
            </AppPressable>
            <AppPressable
              accessibilityRole="button"
              testID="player-rate"
              haptic="select"
              hitSlop={8}
              onPress={cycleRate}
            >
              <AppText variant="caption" color={rate !== 1 ? t.ochre : t.textSecondary}>
                {tr('audio.speed', { rate: rate.toFixed(rate === 1 ? 1 : 2) })}
              </AppText>
            </AppPressable>
            <AppPressable
              accessibilityRole="button"
              testID="player-sleep"
              haptic="select"
              hitSlop={8}
              onPress={cycleSleep}
            >
              <AppText variant="caption" color={sleep !== 0 ? t.ochre : t.textSecondary}>
                {sleep === 0 ? tr('audio.sleepOff') : tr('audio.sleepMin', { count: sleep })}
              </AppText>
            </AppPressable>
          </View>

          {canDownload && (
            <AppPressable
              accessibilityRole="button"
              accessibilityState={{ selected: kept }}
              testID="player-keep-offline"
              haptic="select"
              hitSlop={8}
              onPress={() => void toggleOffline()}
            >
              <AppText variant="caption" color={kept ? t.ochre : t.textSecondary}>
                {dl.phase === 'downloading'
                  ? tr('audio.downloadingPct', {
                      pct: dl.totalBytes > 0 ? Math.round((dl.receivedBytes / dl.totalBytes) * 100) : 0,
                    })
                  : dl.phase === 'failed'
                    ? tr('audio.downloadFailed')
                    : kept
                      ? `${tr('audio.keptOffline')} · ${tr('audio.removeDownload')}`
                      : tr('audio.keepOffline', { size: sizeMb })}
              </AppText>
            </AppPressable>
          )}
        </View>
      </Sheet>
    </>
  );
}

const styles = StyleSheet.create({
  sheetBody: { alignItems: 'center', gap: spacing.s, paddingBottom: spacing.m },
  transportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
    marginTop: spacing.m,
  },
  transportTarget: {
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playCore: {
    width: 78,
    height: 78,
    borderRadius: 39,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quietRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
    marginTop: spacing.m,
  },
});
