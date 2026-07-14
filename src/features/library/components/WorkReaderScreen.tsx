import { FlashList } from '@shopify/flash-list';
import { Stack, useLocalSearchParams } from 'expo-router';
import { SQLiteDatabase } from 'expo-sqlite';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { openLibraryDb } from '../libraryDb';
import { getWork, listSections, SectionRow, WorkRow } from '../repo';
import { AppText } from '@/src/components/ui';
import { spacing } from '@/src/lib/theme/tokens';
import { useTokens } from '@/src/lib/theme/useTokens';

export function WorkReaderScreen() {
  const t = useTokens();
  const { t: tr } = useTranslation();
  const params = useLocalSearchParams<{ id: string; section?: string }>();
  const workId = Number(params.id);
  const [work, setWork] = useState<WorkRow | null>(null);
  const [sections, setSections] = useState<SectionRow[]>([]);

  useEffect(() => {
    let mounted = true;
    void openLibraryDb().then((db: SQLiteDatabase) => {
      if (!mounted) return;
      setWork(getWork(db, workId));
      setSections(listSections(db, workId));
    });
    return () => {
      mounted = false;
    };
  }, [workId]);

  const initialIndex = params.section
    ? Math.max(
        0,
        sections.findIndex((s) => s.section_index === Number(params.section))
      )
    : 0;

  return (
    <View style={[styles.container, { backgroundColor: t.bgCanvas }]}>
      <Stack.Screen options={{ title: work?.title ?? '' }} />
      <FlashList
        data={sections}
        keyExtractor={(s) => String(s.id)}
        initialScrollIndex={initialIndex > 0 ? initialIndex : undefined}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          work ? (
            <AppText variant="caption" style={[styles.attribution, { color: t.textSecondary }]}>
              {tr('library.translatedBy', { translator: work.translator, year: work.year })} ·{' '}
              {tr('library.publicDomain')}
            </AppText>
          ) : null
        }
        renderItem={({ item }) => (
          <View style={styles.sectionBlock} testID={`section-${item.section_index}`}>
            <AppText variant="caption" style={{ color: t.accent }}>
              {item.section_index}
            </AppText>
            <AppText variant="reading">{item.body}</AppText>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: spacing.xl, paddingBottom: spacing.xxl },
  attribution: { marginBottom: spacing.l, textAlign: 'center' },
  sectionBlock: { gap: spacing.xs, marginBottom: spacing.l },
});
