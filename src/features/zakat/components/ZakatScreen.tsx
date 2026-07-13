import { Stack } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import {
  computeZakat,
  EMPTY_INPUTS,
  NISAB_GOLD_GRAMS,
  NISAB_SILVER_GRAMS,
  ZakatInputs,
} from '../zakat';
import { ThemedText } from '@/components/themed-text';
import { fonts, fontSize, radius, spacing } from '@/src/lib/theme/tokens';
import { useTokens } from '@/src/lib/theme/useTokens';

type FieldKey = keyof ZakatInputs;

const ASSET_FIELDS: FieldKey[] = [
  'cash',
  'goldGrams',
  'silverGrams',
  'businessAssets',
  'receivables',
];
const PRICE_FIELDS: FieldKey[] = ['goldPricePerGram', 'silverPricePerGram'];

/**
 * Accept Western and Arabic-Indic digits (U+0660-U+0669) plus either decimal
 * separator (comma or U+060C). Escapes only - no Arabic literals in code.
 */
export function parseAmount(text: string): number {
  const western = text
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[,\u060C]/g, '.');
  const n = Number.parseFloat(western);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export function ZakatScreen() {
  const t = useTokens();
  const { t: tr, i18n } = useTranslation();
  const [raw, setRaw] = useState<Record<FieldKey, string>>(
    Object.fromEntries(Object.keys(EMPTY_INPUTS).map((k) => [k, ''])) as Record<FieldKey, string>
  );

  const inputs = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(raw).map(([k, v]) => [k, parseAmount(v)])
      ) as unknown as ZakatInputs,
    [raw]
  );
  const result = useMemo(() => computeZakat(inputs), [inputs]);

  const fmt = (n: number) =>
    new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 2 }).format(n);

  const field = (key: FieldKey) => (
    <View style={styles.fieldRow} key={key}>
      <ThemedText style={[styles.fieldLabel, { color: t.textSecondary }]}>
        {tr(`zakat.fields.${key}`)}
      </ThemedText>
      <TextInput
        testID={`zakat-${key}`}
        value={raw[key]}
        onChangeText={(text) => setRaw((prev) => ({ ...prev, [key]: text }))}
        keyboardType="decimal-pad"
        placeholder="0"
        placeholderTextColor={t.icon}
        maxFontSizeMultiplier={1.4}
        style={[styles.fieldInput, { color: t.textPrimary, borderColor: t.border }]}
      />
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: t.bgCanvas }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen options={{ title: tr('zakat.title') }} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={[styles.resultCard, { backgroundColor: t.accent }]} testID="zakat-result">
          {result.status === 'due' ? (
            <>
              <ThemedText type="defaultSemiBold" style={{ color: t.textOnAccent, opacity: 0.85 }}>
                {tr('zakat.due')}
              </ThemedText>
              <ThemedText style={[styles.resultAmount, { color: t.textOnAccent }]}>
                {fmt(result.zakatDue)}
              </ThemedText>
            </>
          ) : (
            <ThemedText
              type="defaultSemiBold"
              style={{ color: t.textOnAccent, textAlign: 'center' }}
            >
              {tr(result.status === 'needPrices' ? 'zakat.needPrices' : 'zakat.belowNisab')}
            </ThemedText>
          )}
          {result.nisabThreshold !== null && (
            <ThemedText type="caption" style={{ color: t.textOnAccent, opacity: 0.85 }}>
              {tr('zakat.nisabLine', { amount: fmt(result.nisabThreshold) })}
            </ThemedText>
          )}
        </View>

        <ThemedText type="subtitle" style={styles.section}>
          {tr('zakat.assets')}
        </ThemedText>
        {ASSET_FIELDS.map(field)}

        <ThemedText type="subtitle" style={styles.section}>
          {tr('zakat.liabilitiesSection')}
        </ThemedText>
        {field('liabilities')}

        <ThemedText type="subtitle" style={styles.section}>
          {tr('zakat.prices')}
        </ThemedText>
        <ThemedText type="caption" style={[styles.note, { color: t.textSecondary }]}>
          {tr('zakat.pricesNote', { gold: NISAB_GOLD_GRAMS, silver: NISAB_SILVER_GRAMS })}
        </ThemedText>
        {PRICE_FIELDS.map(field)}

        <View style={[styles.disclaimer, { backgroundColor: t.ochreSoft }]}>
          <ThemedText type="caption" style={{ color: t.ochre, textAlign: 'center' }}>
            {tr('zakat.disclaimer')}
          </ThemedText>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: spacing.xl, paddingBottom: spacing.xxl },
  resultCard: {
    borderRadius: radius.card,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.l,
  },
  resultAmount: { fontFamily: fonts.serifSemiBold, fontSize: fontSize.display, lineHeight: 44 },
  section: { marginTop: spacing.l, marginBottom: spacing.s },
  note: { marginBottom: spacing.s },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.m,
    paddingVertical: spacing.xs,
  },
  fieldLabel: { flex: 1 },
  fieldInput: {
    borderWidth: 1,
    borderRadius: radius.control,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    minWidth: 120,
    textAlign: 'right',
    fontSize: fontSize.body,
  },
  disclaimer: { marginTop: spacing.xl, borderRadius: radius.control, padding: spacing.m },
});
