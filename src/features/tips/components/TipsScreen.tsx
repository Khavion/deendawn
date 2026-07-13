import { Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import type { TipOption, TipsBackend } from '../tipsService';
import { getTipsBackend, hasTipped, markTipped } from '../tipsService';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useSettings } from '@/src/features/settings/SettingsContext';
import { radius, spacing } from '@/src/lib/theme/tokens';
import { useTokens } from '@/src/lib/theme/useTokens';

type Phase = 'loading' | 'ready' | 'unavailable' | 'purchasing' | 'thanks';

/**
 * Tip jar (constitution rule 3): strictly "support development" framing —
 * never charity/zakat/sadaqah (Apple 3.2.1). Worship features never depend
 * on this screen. Without a RevenueCat key it states plainly that tips
 * aren't set up in this build.
 */
export function TipsScreen({ backend = getTipsBackend() }: { backend?: TipsBackend | null }) {
  const t = useTokens();
  const { t: tr } = useTranslation();
  const { store } = useSettings();
  const [phase, setPhase] = useState<Phase>(() =>
    hasTipped(store) ? 'thanks' : backend ? 'loading' : 'unavailable'
  );
  const [options, setOptions] = useState<TipOption[]>([]);

  useEffect(() => {
    if (!backend || phase !== 'loading') return;
    let alive = true;
    backend
      .loadOptions()
      .then((opts) => {
        if (!alive) return;
        setOptions(opts);
        setPhase(opts.length > 0 ? 'ready' : 'unavailable');
      })
      .catch(() => {
        if (alive) setPhase('unavailable');
      });
    return () => {
      alive = false;
    };
  }, [backend, phase]);

  const tip = async (optionId: string) => {
    if (!backend) return;
    setPhase('purchasing');
    try {
      const done = await backend.purchase(optionId);
      if (done) {
        markTipped(store);
        setPhase('thanks');
      } else {
        setPhase('ready');
      }
    } catch {
      setPhase('ready');
    }
  };

  const restore = async () => {
    if (!backend) return;
    try {
      const restored = await backend.restore();
      if (restored) {
        markTipped(store);
        setPhase('thanks');
      }
    } catch {
      // Nothing to restore or network issue — stay put; retry is one tap away.
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: t.bgCanvas }]}>
      <Stack.Screen options={{ title: tr('tips.title') }} />
      <View style={styles.body}>
        <IconSymbol name="sun.max.fill" size={44} color={t.ochre} />
        <ThemedText type="title" style={styles.center}>
          {tr('tips.heading')}
        </ThemedText>
        <ThemedText type="serifBody" style={[styles.center, { color: t.textSecondary }]}>
          {tr('tips.body')}
        </ThemedText>

        {phase === 'loading' && <ActivityIndicator color={t.accent} testID="tips-loading" />}

        {phase === 'unavailable' && (
          <View style={[styles.card, { backgroundColor: t.bgSurface, borderColor: t.border }]}>
            <ThemedText style={{ color: t.textSecondary }} testID="tips-unavailable">
              {tr('tips.unavailable')}
            </ThemedText>
          </View>
        )}

        {(phase === 'ready' || phase === 'purchasing') && (
          <View style={styles.options}>
            {options.map((o) => (
              <Pressable
                key={o.id}
                accessibilityRole="button"
                testID={`tip-${o.id}`}
                disabled={phase === 'purchasing'}
                onPress={() => void tip(o.id)}
                style={[styles.tipButton, { backgroundColor: t.accent }]}
              >
                <ThemedText type="defaultSemiBold" style={{ color: t.textOnAccent }}>
                  {o.priceLabel}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        )}

        {phase === 'thanks' && (
          <View style={[styles.card, { backgroundColor: t.accentSoft }]} testID="tips-thanks">
            <ThemedText type="defaultSemiBold" style={{ color: t.textOnAccentSoft }}>
              {tr('tips.thanksTitle')}
            </ThemedText>
            <ThemedText type="serifBody" style={{ color: t.textOnAccentSoft }}>
              {tr('tips.thanksBody')}
            </ThemedText>
          </View>
        )}

        {phase !== 'unavailable' && phase !== 'thanks' && (
          <Pressable
            accessibilityRole="button"
            testID="tips-restore"
            onPress={() => void restore()}
            hitSlop={8}
          >
            <ThemedText type="link">{tr('tips.restore')}</ThemedText>
          </Pressable>
        )}

        <ThemedText type="caption" style={[styles.center, { color: t.textSecondary }]}>
          {tr('tips.footnote')}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    gap: spacing.l,
  },
  center: { textAlign: 'center' },
  options: { flexDirection: 'row', gap: spacing.m },
  tipButton: {
    borderRadius: radius.card,
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.m,
    minWidth: 88,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'transparent',
    padding: spacing.l,
    gap: spacing.s,
  },
});
