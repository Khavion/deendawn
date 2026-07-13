import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ask, AskResponse } from '../router';
import { AyahRow } from '../../quran/repo';
import { ThemedText } from '@/components/themed-text';
import { fonts, fontSize, radius, spacing } from '@/src/lib/theme/tokens';
import { useTokens } from '@/src/lib/theme/useTokens';

export function AskScreen() {
  const insets = useSafeAreaInsets();
  const t = useTokens();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const db = useSQLiteContext();
  const [input, setInput] = useState('');
  const [response, setResponse] = useState<AskResponse | null>(null);

  const submit = () => {
    const q = input.trim();
    setResponse(q ? ask(db, q) : null);
  };

  const openRef = (row: AyahRow) => router.push(`/surah/${row.surah}?ayah=${row.ayah}`);

  const refChips = (rows: AyahRow[]) => (
    <View style={styles.chips}>
      {rows.map((row) => (
        <Pressable
          key={row.id}
          accessibilityRole="button"
          testID={`ref-${row.surah}-${row.ayah}`}
          onPress={() => openRef(row)}
          style={[styles.chip, { backgroundColor: t.accentSoft }]}
        >
          <ThemedText type="defaultSemiBold" style={{ color: t.textOnAccentSoft }}>
            {row.surah}:{row.ayah}
          </ThemedText>
        </Pressable>
      ))}
    </View>
  );

  const verseRows = (rows: AyahRow[]) => (
    <View style={styles.verseList}>
      {rows.map((row) => (
        <Pressable
          key={row.id}
          accessibilityRole="button"
          testID={`verse-${row.surah}-${row.ayah}`}
          onPress={() => openRef(row)}
          style={[styles.verseRow, { borderBottomColor: t.border }]}
        >
          <ThemedText type="defaultSemiBold" style={{ color: t.accent }}>
            {row.surah}:{row.ayah}
          </ThemedText>
          <ThemedText type="serifBody" numberOfLines={2} style={{ color: t.textSecondary }}>
            {row.text_translation}
          </ThemedText>
        </Pressable>
      ))}
    </View>
  );

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: t.bgCanvas, paddingTop: insets.top + spacing.m },
      ]}
    >
      <ThemedText type="title" style={styles.title}>
        {tr('ask.title')}
      </ThemedText>
      <TextInput
        testID="ask-input"
        value={input}
        onChangeText={setInput}
        onSubmitEditing={submit}
        returnKeyType="search"
        placeholder={tr('ask.placeholder')}
        placeholderTextColor={t.icon}
        autoCorrect={false}
        maxFontSizeMultiplier={1.4}
        style={[styles.input, { color: t.textPrimary, borderColor: t.border }]}
      />

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {response === null && (
          <ThemedText type="serifBody" style={[styles.hint, { color: t.textSecondary }]}>
            {tr('ask.hint')}
          </ThemedText>
        )}

        {response?.kind === 'count' && (
          <View testID="ask-count">
            <ThemedText style={[styles.countAnswer, { color: t.textPrimary }]}>
              {tr('ask.countAnswer', { count: response.count, term: response.term })}
            </ThemedText>
            {refChips(response.refs)}
          </View>
        )}

        {response?.kind === 'verses' && <View testID="ask-verses">{verseRows(response.refs)}</View>}

        {response?.kind === 'rulingRedirect' && (
          <View testID="ask-redirect">
            <View style={[styles.redirectCard, { backgroundColor: t.ochreSoft }]}>
              <ThemedText type="serifBody" style={{ color: t.ochre }}>
                {tr('ask.redirect')}
              </ThemedText>
            </View>
            {response.refs.length > 0 && verseRows(response.refs)}
          </View>
        )}

        {response?.kind === 'empty' && (
          <ThemedText testID="ask-empty" style={[styles.hint, { color: t.textSecondary }]}>
            {tr('ask.empty')}
          </ThemedText>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: spacing.xl },
  title: { marginBottom: spacing.s },
  input: {
    borderWidth: 1,
    borderRadius: radius.control,
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.m,
    fontSize: fontSize.body,
    marginBottom: spacing.l,
  },
  scroll: { paddingBottom: spacing.xxl },
  hint: { textAlign: 'center', marginTop: spacing.xl, opacity: 0.9 },
  countAnswer: {
    fontFamily: fonts.serifMedium,
    fontSize: fontSize.h2,
    lineHeight: 30,
    marginBottom: spacing.l,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.s },
  chip: {
    borderRadius: radius.control,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    minHeight: 40,
    justifyContent: 'center',
  },
  verseList: { gap: 0 },
  verseRow: {
    paddingVertical: spacing.m,
    gap: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  redirectCard: {
    borderRadius: radius.card,
    padding: spacing.l,
    marginBottom: spacing.l,
  },
});
