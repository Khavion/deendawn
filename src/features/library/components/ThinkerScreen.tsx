import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SQLiteDatabase } from 'expo-sqlite';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { openLibraryDb } from '../libraryDb';
import { WorkRow, worksByAuthor } from '../repo';
import { THINKERS } from '../thinkers';
import { ThemedText } from '@/components/themed-text';
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
        <ThemedText>{tr('library.notFound')}</ThemedText>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: t.bgCanvas }]}>
      <Stack.Screen options={{ title: thinker.name }} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <ThemedText type="title">{thinker.name}</ThemedText>
        <ThemedText type="caption" style={{ color: t.textSecondary }}>
          {thinker.era}
        </ThemedText>
        <ThemedText type="caption" style={{ color: t.textSecondary }}>
          {thinker.school}
        </ThemedText>

        <View style={[styles.reviewNote, { backgroundColor: t.ochreSoft }]}>
          <ThemedText type="caption" style={{ color: t.ochre, textAlign: 'center' }}>
            {tr('library.reviewPending')}
          </ThemedText>
        </View>

        <ThemedText type="subtitle" style={styles.section}>
          {tr('library.keyIdeas')}
        </ThemedText>
        {thinker.keyIdeas.map((idea) => (
          <View key={idea} style={styles.ideaRow}>
            <View style={[styles.dot, { backgroundColor: t.ochre }]} />
            <ThemedText type="serifBody" style={styles.ideaText}>
              {idea}
            </ThemedText>
          </View>
        ))}

        <ThemedText type="subtitle" style={styles.section}>
          {tr('library.majorWorks')}
        </ThemedText>
        {thinker.majorWorks.map((w) => (
          <ThemedText key={w} type="serifBody" style={{ color: t.textSecondary }}>
            {w}
          </ThemedText>
        ))}

        {works.length > 0 && (
          <>
            <ThemedText type="subtitle" style={styles.section}>
              {tr('library.readInApp')}
            </ThemedText>
            {works.map((w) => (
              <Pressable
                key={w.id}
                accessibilityRole="button"
                testID={`work-${w.id}`}
                onPress={() => router.push(`/work/${w.id}`)}
                style={[styles.workCard, { backgroundColor: t.accentSoft }]}
              >
                <ThemedText type="defaultSemiBold" style={{ color: t.textOnAccentSoft }}>
                  {w.title}
                </ThemedText>
                <ThemedText type="caption" style={{ color: t.textOnAccentSoft }}>
                  {tr('library.translatedBy', { translator: w.translator, year: w.year })}
                </ThemedText>
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
