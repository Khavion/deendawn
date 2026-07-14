import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SQLiteDatabase } from 'expo-sqlite';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { openLibraryDb } from '../libraryDb';
import { WorkRow, worksByAuthor } from '../repo';
import { THINKERS } from '../thinkers';
import { AppText } from '@/src/components/ui';
import { radius, spacing } from '@/src/lib/theme/tokens';
import { useTokens } from '@/src/lib/theme/useTokens';

export function ThinkerScreen() {
  const t = useTokens();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const { key } = useLocalSearchParams<{ key: string }>();
  const thinker = useMemo(() => THINKERS.find((th) => th.key === key), [key]);
  const [works, setWorks] = useState<WorkRow[]>([]);

  useEffect(() => {
    let mounted = true;
    if (thinker?.libraryAuthorKey) {
      void openLibraryDb().then(
        (db: SQLiteDatabase) => mounted && setWorks(worksByAuthor(db, thinker.libraryAuthorKey!))
      );
    }
    return () => {
      mounted = false;
    };
  }, [thinker]);

  if (!thinker) {
    return (
      <View style={[styles.center, { backgroundColor: t.bgCanvas }]}>
        <AppText>{tr('library.notFound')}</AppText>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: t.bgCanvas }]}>
      <Stack.Screen options={{ title: thinker.name }} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <AppText variant="title">{thinker.name}</AppText>
        <AppText variant="caption" style={{ color: t.textSecondary }}>
          {thinker.era}
        </AppText>
        <AppText variant="caption" style={{ color: t.textSecondary }}>
          {thinker.school}
        </AppText>

        <View style={[styles.reviewNote, { backgroundColor: t.ochreSoft }]}>
          <AppText variant="caption" style={{ color: t.ochre, textAlign: 'center' }}>
            {tr('library.reviewPending')}
          </AppText>
        </View>

        <AppText variant="subtitle" style={styles.section}>
          {tr('library.keyIdeas')}
        </AppText>
        {thinker.keyIdeas.map((idea) => (
          <View key={idea} style={styles.ideaRow}>
            <View style={[styles.dot, { backgroundColor: t.ochre }]} />
            <AppText variant="reading" style={styles.ideaText}>
              {idea}
            </AppText>
          </View>
        ))}

        <AppText variant="subtitle" style={styles.section}>
          {tr('library.majorWorks')}
        </AppText>
        {thinker.majorWorks.map((w) => (
          <AppText key={w} variant="reading" style={{ color: t.textSecondary }}>
            {w}
          </AppText>
        ))}

        {works.length > 0 && (
          <>
            <AppText variant="subtitle" style={styles.section}>
              {tr('library.readInApp')}
            </AppText>
            {works.map((w) => (
              <Pressable
                key={w.id}
                accessibilityRole="button"
                testID={`work-${w.id}`}
                onPress={() => router.push(`/work/${w.id}`)}
                style={[styles.workCard, { backgroundColor: t.accentSoft }]}
              >
                <AppText variant="bodyStrong" style={{ color: t.textOnAccentSoft }}>
                  {w.title}
                </AppText>
                <AppText variant="caption" style={{ color: t.textOnAccentSoft }}>
                  {tr('library.translatedBy', { translator: w.translator, year: w.year })}
                </AppText>
              </Pressable>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: spacing.xl, paddingBottom: spacing.xxl, gap: spacing.xs },
  section: { marginTop: spacing.xl, marginBottom: spacing.s },
  ideaRow: {
    flexDirection: 'row',
    gap: spacing.s,
    alignItems: 'flex-start',
    marginBottom: spacing.s,
  },
  dot: { width: 6, height: 6, borderRadius: 3, marginTop: 9 },
  ideaText: { flex: 1 },
  reviewNote: { borderRadius: radius.control, padding: spacing.s, marginTop: spacing.l },
  workCard: { borderRadius: radius.card, padding: spacing.l, gap: 2, marginBottom: spacing.s },
});
