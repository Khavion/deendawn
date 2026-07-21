import { Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import type { TipOption, TipsBackend } from '../tipsService';
import { getTipsBackend, hasTipped, markTipped } from '../tipsService';
import { AppText, Skeleton } from '@/src/components/ui';
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
        <AppText variant="title" style={styles.center}>
          {tr('tips.heading')}
        </AppText>
        <AppText variant="reading" style={[styles.center, { color: t.textSecondary }]}>
          {tr('tips.body')}
        </AppText>

        {phase === 'loading' && (
          <View style={styles.options} testID="tips-loading">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} width={88} height={48} radius={radius.card} />
            ))}
          </View>
        )}

        {phase === 'unavailable' && (
          <View style={[styles.card, { backgroundColor: t.bgSurface, borderColor: t.border }]}>
            <AppText style={{ color: t.textSecondary }} testID="tips-unavailable">
              {tr('tips.unavailable')}
            </AppText>
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
                <AppText variant="bodyStrong" style={{ color: t.textOnAccent }}>
                  {o.priceLabel}
                </AppText>
              </Pressable>
            ))}
          </View>
        )}

        {phase === 'thanks' && (
          <View style={[styles.card, { backgroundColor: t.accentSoft }]} testID="tips-thanks">
            <AppText variant="bodyStrong" style={{ color: t.textOnAccentSoft }}>
              {tr('tips.thanksTitle')}
            </AppText>
            <AppText variant="reading" style={{ color: t.textOnAccentSoft }}>
              {tr('tips.thanksBody')}
            </AppText>
          </View>
        )}

        {phase !== 'unavailable' && phase !== 'thanks' && (
          <Pressable
            accessibilityRole="button"
            testID="tips-restore"
            onPress={() => void restore()}
            hitSlop={8}
          >
            <AppText variant="link">{tr('tips.restore')}</AppText>
          </Pressable>
        )}

        <AppText variant="caption" style={[styles.center, { color: t.textSecondary }]}>
          {tr('tips.footnote')}
        </AppText>
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
