import { Stack, useRouter } from 'expo-router';
import { SQLiteDatabase } from 'expo-sqlite';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlashList } from '@shopify/flash-list';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { openLibraryDb } from '../libraryDb';
import { searchSections } from '../repo';
import { THINKERS } from '../thinkers';
import { AppText } from '@/src/components/ui';
import { radius, spacing } from '@/src/lib/theme/tokens';
import { useTokens } from '@/src/lib/theme/useTokens';

export function LibraryScreen() {
  const t = useTokens();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const [db, setDb] = useState<SQLiteDatabase | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let mounted = true;
    void openLibraryDb().then((d) => mounted && setDb(d));
    return () => {
      mounted = false;
    };
  }, []);

  const results = useMemo(
    () => (db && query.trim().length >= 3 ? searchSections(db, query, 25) : []),
    [db, query]
  );
  const searching = query.trim().length >= 3;

  return (
    <View style={[styles.container, { backgroundColor: t.bgCanvas }]}>
      <Stack.Screen options={{ title: tr('library.title') }} />
      <TextInput
        testID="library-search"
        value={query}
        onChangeText={setQuery}
        placeholder={tr('library.searchPlaceholder')}
        placeholderTextColor={t.icon}
        autoCorrect={false}
        maxFontSizeMultiplier={1.4}
        style={[styles.input, { color: t.textPrimary, borderColor: t.border }]}
      />
      {searching ? (
        <FlashList
          data={results}
          keyExtractor={(s) => String(s.id)}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <AppText style={[styles.hint, { color: t.textSecondary }]}>
              {tr('library.noMatches')}
            </AppText>
          }
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              testID={`hit-${item.id}`}
              onPress={() => router.push(`/work/${item.work_id}?section=${item.section_index}`)}
              style={[styles.row, { borderBottomColor: t.border }]}
            >
              <AppText variant="bodyStrong" style={{ color: t.accent }}>
                {item.title} · {item.section_index}
              </AppText>
              <AppText variant="reading" numberOfLines={2} style={{ color: t.textSecondary }}>
                {item.body}
              </AppText>
            </Pressable>
          )}
        />
      ) : (
        <FlashList
          data={THINKERS}
          keyExtractor={(th) => th.key}
          ListHeaderComponent={
            <View style={[styles.reviewNote, { backgroundColor: t.ochreSoft }]}>
              <AppText variant="caption" style={{ color: t.ochre, textAlign: 'center' }}>
                {tr('library.reviewPending')}
              </AppText>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              testID={`thinker-${item.key}`}
              onPress={() => router.push(`/thinker/${item.key}`)}
              style={[styles.row, { borderBottomColor: t.border }]}
            >
              <AppText variant="bodyStrong">{item.name}</AppText>
              <AppText variant="caption" style={{ color: t.textSecondary }}>
                {item.era} · {item.school}
              </AppText>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: spacing.xl },
  input: {
    borderWidth: 1,
    borderRadius: radius.control,
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.m,
    fontSize: 17,
    marginVertical: spacing.l,
  },
  hint: { textAlign: 'center', marginTop: spacing.xl },
  row: {
    paddingVertical: spacing.m,
    gap: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  reviewNote: { borderRadius: radius.control, padding: spacing.s, marginBottom: spacing.m },
});
