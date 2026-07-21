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
import { AppText, GoldFrameCard, SectionRule } from '@/src/components/ui';
import {
  dimOnFeatured,
  elevation,
  featuredGradient,
  fonts,
  fontSize,
  radius,
  richMode,
  spacing,
  textOnFeatured,
} from '@/src/lib/theme/tokens';
import { useThemeMode } from '@/src/lib/theme/ThemeProvider';
import { useTokens } from '@/src/lib/theme/useTokens';
import { useDeviceTier } from '@/src/lib/theme/useDeviceTier';

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
  const mode = useThemeMode();
  const rm = richMode(mode);
  const { flat } = useDeviceTier();
  const { t: tr, i18n } = useTranslation();
  const elevatedCard = [
    styles.groupCard,
    { backgroundColor: t.bgSurface, borderColor: t.border },
    flat ? undefined : elevation[rm].e2,
  ];
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
      <AppText style={[styles.fieldLabel, { color: t.textSecondary }]}>
        {tr(`zakat.fields.${key}`)}
      </AppText>
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
        <GoldFrameCard
          gradientColors={featuredGradient[rm]}
          style={styles.resultCard}
          testID="zakat-result"
        >
          {result.status === 'due' ? (
            <>
              <AppText variant="bodyStrong" style={{ color: dimOnFeatured[rm] }}>
                {tr('zakat.due')}
              </AppText>
              <AppText style={[styles.resultAmount, { color: textOnFeatured[rm] }]}>
                {fmt(result.zakatDue)}
              </AppText>
            </>
          ) : (
            <AppText
              variant="bodyStrong"
              style={{ color: textOnFeatured[rm], textAlign: 'center' }}
            >
              {tr(result.status === 'needPrices' ? 'zakat.needPrices' : 'zakat.belowNisab')}
            </AppText>
          )}
          {result.nisabThreshold !== null && (
            <AppText variant="caption" style={{ color: dimOnFeatured[rm] }}>
              {tr('zakat.nisabLine', { amount: fmt(result.nisabThreshold) })}
            </AppText>
          )}
        </GoldFrameCard>

        <SectionRule label={tr('zakat.assets')} style={styles.sectionRule} />
        <View style={elevatedCard}>{ASSET_FIELDS.map(field)}</View>

        <SectionRule label={tr('zakat.liabilitiesSection')} style={styles.sectionRule} />
        <View style={elevatedCard}>{field('liabilities')}</View>

        <SectionRule label={tr('zakat.prices')} style={styles.sectionRule} />
        <AppText variant="caption" style={[styles.note, { color: t.textSecondary }]}>
          {tr('zakat.pricesNote', { gold: NISAB_GOLD_GRAMS, silver: NISAB_SILVER_GRAMS })}
        </AppText>
        <View style={elevatedCard}>{PRICE_FIELDS.map(field)}</View>

        <View
          style={[
            styles.disclaimer,
            { backgroundColor: t.ochreSoft, borderLeftColor: t.ochre },
          ]}
        >
          <AppText variant="caption" style={{ color: t.ochre }}>
            {tr('zakat.disclaimer')}
          </AppText>
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
  sectionRule: { marginTop: spacing.l, marginBottom: spacing.s },
  note: { marginBottom: spacing.s },
  groupCard: {
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.xs,
  },
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
  disclaimer: {
    marginTop: spacing.xl,
    borderRadius: radius.control,
    borderLeftWidth: 3,
    padding: spacing.m,
  },
});
