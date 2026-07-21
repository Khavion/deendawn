import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet } from 'react-native';

import { getAyahByOrdinal, getSurah } from '../repo';
import { verseOfDayOrdinal } from '../verseOfDay';
import { AppText, SectionRule } from '@/src/components/ui';
import { elevation, fonts, radius, richMode, spacing } from '@/src/lib/theme/tokens';
import { useThemeMode } from '@/src/lib/theme/ThemeProvider';
import { useTokens } from '@/src/lib/theme/useTokens';
import { useDeviceTier } from '@/src/lib/theme/useDeviceTier';

/**
 * A gentle daily verse on the Today screen. The verse is picked purely by the
 * date (verseOfDayOrdinal) — never curated — and its Arabic is left undecorated
 * (reverence): it sits in a plain elevated card, not the featured gold frame.
 * Tapping opens the full verse in the reader.
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
    ? `${surah.name_transliteration} ${ayah.surah}:${ayah.ayah}`
    : `${ayah.surah}:${ayah.ayah}`;

  return (
    <>
      <SectionRule label={tr('today.verseOfDay')} style={styles.rule} />
      <Pressable
        accessibilityRole="button"
        testID="verse-of-day"
        onPress={() => router.push(`/surah/${ayah.surah}?ayah=${ayah.ayah}`)}
        style={[
          styles.card,
          { backgroundColor: t.bgSurface, borderColor: t.border },
          flat ? undefined : elevation[rm].e2,
        ]}
      >
        <AppText accessibilityLanguage="ar" style={[styles.arabic, { color: t.textPrimary }]}>
          {ayah.text_uthmani}
        </AppText>
        <AppText
          variant="reading"
          numberOfLines={3}
          style={[styles.translation, { color: t.textSecondary }]}
        >
          {ayah.text_translation}
        </AppText>
        <AppText variant="caption" style={{ color: t.accent }}>
          {citation}
        </AppText>
      </Pressable>
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
  arabic: {
    fontFamily: fonts.quran,
    fontSize: 24,
    lineHeight: 46,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  translation: {},
});
