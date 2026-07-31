import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { getAyahByOrdinal, getSurah } from '../repo';
import { verseOfDayOrdinal } from '../verseOfDay';
import { AppPressable, AppText, AyahBlock, SectionRule } from '@/src/components/ui';
import { elevation, radius, richMode, spacing } from '@/src/lib/theme/tokens';
import { useThemeMode } from '@/src/lib/theme/ThemeProvider';
import { useTokens } from '@/src/lib/theme/useTokens';
import { useDeviceTier } from '@/src/lib/theme/useDeviceTier';

/**
 * A gentle daily verse on the Today screen (handoff §6 screen 01). The verse
 * is picked purely by the date (verseOfDayOrdinal) — never curated — and its
 * Arabic renders through AyahBlock in a plain elevated card, not the featured
 * gold frame (the hero owns the screen's one gold object). The caption row
 * carries the reference and the "Open in reader" link.
 */
export function VerseOfDayCard({ date }: { date: Date }) {
  const db = useSQLiteContext();
  const t = useTokens();
  const mode = useThemeMode();
  const rm = richMode(mode);
  const { flat } = useDeviceTier();
  const { t: tr } = useTranslation();
  const router = useRouter();

  const ordinal = verseOfDayOrdinal(date);
  const ayah = useMemo(() => getAyahByOrdinal(db, ordinal), [db, ordinal]);
  const surah = useMemo(() => (ayah ? getSurah(db, ayah.surah) : null), [db, ayah]);

  if (!ayah) return null;
  const citation = surah
    ? `${surah.name_transliteration} · ${ayah.surah}:${ayah.ayah}`
    : `${ayah.surah}:${ayah.ayah}`;

  return (
    <>
      <SectionRule label={tr('today.verseOfDay')} style={styles.rule} />
      <AppPressable
        accessibilityRole="button"
        testID="verse-of-day"
        onPress={() => router.push(`/surah/${ayah.surah}?ayah=${ayah.ayah}`)}
        style={[
          styles.card,
          { backgroundColor: t.bgSurface, borderColor: t.border },
          flat ? undefined : elevation[rm].e2,
        ]}
      >
        <AyahBlock text={ayah.text_uthmani} translation={ayah.text_translation} size="card" />
        <View style={styles.captionRow}>
          <AppText variant="caption" color={t.textSecondary}>
            {citation}
          </AppText>
          <AppText variant="link" style={styles.link}>
            {tr('today.openInReader')}
          </AppText>
        </View>
      </AppPressable>
    </>
  );
}

const styles = StyleSheet.create({
  rule: { marginTop: spacing.l, marginBottom: spacing.s },
  card: {
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.l,
    gap: spacing.m,
  },
  captionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.m,
  },
  link: { fontSize: 13, lineHeight: 18 },
});
