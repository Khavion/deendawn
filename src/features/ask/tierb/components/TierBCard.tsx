import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import type { DownloadState } from '../downloadManager';
import { TIER_B_ENABLED } from '../flags';
import { ThemedText } from '@/components/themed-text';
import { radius, spacing } from '@/src/lib/theme/tokens';
import { useTokens } from '@/src/lib/theme/useTokens';

export interface TierBCardProps {
  state: DownloadState;
  /** Total download size, human-formatted upstream (e.g. "1.1 GB"). */
  sizeLabel: string;
  onDownload: () => void;
  onDelete: () => void;
}

/**
 * Tier B (on-device AI paraphrase) management card. GATE 7: invisible until
 * TIER_B_ENABLED flips with Zohaib + scholar sign-off; built and tested ahead
 * of that so the native session only wires inference. Honest states only —
 * no spinners pretending, no hidden downloads (Rule 1.5f: R2-only, opt-in).
 */
export function TierBCard(props: TierBCardProps) {
  if (!TIER_B_ENABLED) return null;
  return <TierBCardInner {...props} />;
}

export function TierBCardInner({ state, sizeLabel, onDownload, onDelete }: TierBCardProps) {
  const t = useTokens();
  const { t: tr } = useTranslation();

  return (
    <View
      style={[styles.card, { backgroundColor: t.bgSurface, borderColor: t.border }]}
      testID="tierb-card"
    >
      <ThemedText type="defaultSemiBold">{tr('ask.tierb.title')}</ThemedText>
      <ThemedText type="caption" style={{ color: t.textSecondary }}>
        {tr('ask.tierb.body')}
      </ThemedText>

      {state.phase === 'blocked' && state.reason === 'ineligibleDevice' && (
        <ThemedText type="caption" style={{ color: t.textSecondary }} testID="tierb-ineligible">
          {tr('ask.tierb.ineligible')}
        </ThemedText>
      )}

      {state.phase === 'blocked' && state.reason === 'pendingUpload' && (
        <ThemedText type="caption" style={{ color: t.textSecondary }} testID="tierb-pending">
          {tr('ask.tierb.pendingUpload')}
        </ThemedText>
      )}

      {state.phase === 'blocked' && state.reason === 'cellular' && (
        <ThemedText type="caption" style={{ color: t.ochre }} testID="tierb-wifi">
          {tr('ask.tierb.wifiOnly')}
        </ThemedText>
      )}

      {state.phase === 'idle' && (
        <Pressable
          accessibilityRole="button"
          testID="tierb-download"
          onPress={onDownload}
          style={[styles.button, { backgroundColor: t.accent }]}
        >
          <ThemedText type="defaultSemiBold" style={{ color: t.textOnAccent }}>
            {tr('ask.tierb.download', { size: sizeLabel })}
          </ThemedText>
        </Pressable>
      )}

      {state.phase === 'downloading' && (
        <View style={styles.progressRow} testID="tierb-progress">
          <View style={[styles.track, { backgroundColor: t.border }]}>
            <View
              style={[
                styles.trackFill,
                {
                  backgroundColor: t.accent,
                  width: `${
                    state.totalBytes > 0
                      ? Math.min(100, (state.receivedBytes / state.totalBytes) * 100)
                      : 0
                  }%`,
                },
              ]}
            />
          </View>
          <ThemedText type="caption" style={{ color: t.textSecondary }}>
            {tr('ask.tierb.downloading')}
          </ThemedText>
        </View>
      )}

      {state.phase === 'verifying' && (
        <ThemedText type="caption" style={{ color: t.textSecondary }} testID="tierb-verifying">
          {tr('ask.tierb.verifying')}
        </ThemedText>
      )}

      {state.phase === 'failed' && (
        <ThemedText type="caption" style={{ color: t.ochre }} testID="tierb-failed">
          {state.reason === 'hashMismatch' ? tr('ask.tierb.hashMismatch') : tr('ask.tierb.failed')}
        </ThemedText>
      )}

      {state.phase === 'ready' && (
        <View style={styles.readyRow} testID="tierb-ready">
          <ThemedText type="caption" style={{ color: t.success }}>
            {tr('ask.tierb.ready')}
          </ThemedText>
          <Pressable
            accessibilityRole="button"
            testID="tierb-delete"
            onPress={onDelete}
            hitSlop={8}
          >
            <ThemedText type="link">{tr('ask.tierb.delete')}</ThemedText>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.l,
    gap: spacing.s,
  },
  button: {
    borderRadius: radius.control,
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.m,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRow: { gap: spacing.xs },
  track: { height: 3, borderRadius: 1.5, overflow: 'hidden' },
  trackFill: { height: 3 },
  readyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
