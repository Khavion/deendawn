import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ask, AskResponse, extractTerms } from '../router';
import { askLibrary, LibraryAskResponse, sectionSnippet } from '../libraryAsk';
import { openLibraryDb } from '../../library/libraryDb';
import { AyahRow, QuranDb } from '../../quran/repo';
import { ThemedText } from '@/components/themed-text';
import { fonts, fontSize, radius, spacing } from '@/src/lib/theme/tokens';
import { useTokens } from '@/src/lib/theme/useTokens';

type AskSource = 'quran' | 'library';

export function AskScreen() {
  const insets = useSafeAreaInsets();
  const t = useTokens();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const db = useSQLiteContext();
  const [input, setInput] = useState('');
  const [source, setSource] = useState<AskSource>('quran');
  const [response, setResponse] = useState<AskResponse | null>(null);
  const [libResponse, setLibResponse] = useState<LibraryAskResponse | null>(null);

  const submit = () => {
    const q = input.trim();
    if (source === 'library') {
      setResponse(null);
      if (!q) {
        setLibResponse(null);
        return;
      }
      void openLibraryDb().then((libDb) => {
        setLibResponse(askLibrary(libDb as unknown as QuranDb, q));
      });
      return;
    }
    setLibResponse(null);
    setResponse(q ? ask(db, q) : null);
  };

  const switchSource = (next: AskSource) => {
    setSource(next);
    setResponse(null);
    setLibResponse(null);
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

      <View style={styles.sourceRow}>
        {(['quran', 'library'] as const).map((s) => (
          <Pressable
            key={s}
            accessibilityRole="button"
            testID={`ask-source-${s}`}
            onPress={() => switchSource(s)}
            style={[
              styles.sourceChip,
              source === s
                ? { backgroundColor: t.accent }
                : { borderColor: t.border, borderWidth: 1 },
            ]}
          >
            <ThemedText
              type="defaultSemiBold"
              style={{ color: source === s ? t.textOnAccent : t.textSecondary }}
            >
              {tr(s === 'quran' ? 'ask.sourceQuran' : 'ask.sourceLibrary')}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {response === null && libResponse === null && (
          <ThemedText type="serifBody" style={[styles.hint, { color: t.textSecondary }]}>
            {tr(source === 'library' ? 'ask.hintLibrary' : 'ask.hint')}
          </ThemedText>
        )}

        {libResponse?.kind === 'sections' && (
          <View testID="ask-sections" style={styles.verseList}>
            {libResponse.refs.map((ref) => (
              <Pressable
                key={ref.id}
                accessibilityRole="button"
                testID={`book-section-${ref.id}`}
                onPress={() => router.push(`/work/${ref.work_id}?section=${ref.section_index}`)}
                style={[styles.verseRow, { borderBottomColor: t.border }]}
              >
                <ThemedText type="defaultSemiBold" style={{ color: t.accent }}>
                  {ref.title}
                </ThemedText>
                <ThemedText type="serifBody" numberOfLines={3} style={{ color: t.textSecondary }}>
                  {sectionSnippet(ref.body, extractTerms(input))}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        )}

        {libResponse?.kind === 'rulingRedirect' && (
          <View
            testID="ask-redirect-library"
            style={[styles.redirectCard, { backgroundColor: t.ochreSoft }]}
          >
            <ThemedText type="serifBody" style={{ color: t.ochre }}>
              {tr('ask.redirect')}
            </ThemedText>
          </View>
        )}

        {libResponse?.kind === 'empty' && (
          <ThemedText testID="ask-empty-library" style={[styles.hint, { color: t.textSecondary }]}>
            {tr('ask.empty')}
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
  sourceRow: { flexDirection: 'row', gap: spacing.s, marginBottom: spacing.l },
  sourceChip: {
    borderRadius: radius.control,
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.s,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
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
