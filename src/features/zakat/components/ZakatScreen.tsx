import { Stack } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Share,
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
  type NisabBasis,
} from '../zakat';
import { buildExportText, saveCalculation } from '../zakatStore';
import {
  AppText,
  Button,
  Divider,
  GoldFrameCard,
  ListCard,
  ListRow,
  MoneyText,
  PeriodEyebrow,
  SectionRule,
  SegmentedRow,
  Sheet,
  formatMoney,
} from '@/src/components/ui';
import { useSettings } from '@/src/features/settings/SettingsContext';
import { localizeNumber } from '@/src/lib/i18n/format';
import {
  featuredGradient,
  fonts,
  fontScaleCaps,
  fontSize,
  measure,
  radius,
  spacing,
} from '@/src/lib/theme/tokens';
import { useScrollInsets } from '@/src/lib/theme/useScrollInsets';
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

/**
 * The result card's interior — a child of the GoldFrameCard so its hooks
 * resolve the onFeatured palette (handoff gap 02); no hand-passed colors.
 */
function ZakatResultBody({
  result,
  inputs,
  fmt,
  onSave,
}: {
  result: ReturnType<typeof computeZakat>;
  inputs: ZakatInputs;
  fmt: (n: number) => string;
  onSave: () => void;
}) {
  const { t: tr, i18n } = useTranslation();
  const t = useTokens();
  const basisLabel = tr(result.basisUsed === 'gold' ? 'zakat.basisGold' : 'zakat.basisSilver');
  const basisGrams = result.basisUsed === 'gold' ? NISAB_GOLD_GRAMS : NISAB_SILVER_GRAMS;
  const basisPrice =
    result.basisUsed === 'gold' ? inputs.goldPricePerGram : inputs.silverPricePerGram;
  return (
    <>
      <PeriodEyebrow label={tr('zakat.dueEyebrow')} labelColor={t.textSecondary} />
      {result.status === 'due' ? (
        <>
          <AppText style={styles.resultAmount} color={t.textPrimary} testID="zakat-amount">
            {fmt(result.zakatDue)}
          </AppText>
          <Divider style={styles.resultRule} />
          <AppText variant="caption" color={t.textSecondary} style={styles.resultCentered}>
            {tr('zakat.workingLine', {
              wealth: fmt(result.zakatableWealth),
              basis: basisLabel,
              nisab: result.nisabThreshold !== null ? fmt(result.nisabThreshold) : '—',
              grams: localizeNumber(basisGrams, i18n.language),
              price: fmt(basisPrice),
            })}
          </AppText>
        </>
      ) : (
        <>
          <AppText variant="bodyStrong" style={styles.resultCentered}>
            {tr(result.status === 'needPrices' ? 'zakat.needPrices' : 'zakat.belowNisab')}
          </AppText>
          {result.nisabThreshold !== null && (
            <AppText variant="caption" color={t.textSecondary}>
              {tr('zakat.nisabLine', { amount: fmt(result.nisabThreshold) })}
            </AppText>
          )}
        </>
      )}
      {result.status === 'due' && (
        <>
          <Button title={tr('zakat.saveCalc')} testID="zakat-save" onPress={onSave} />
          <AppText variant="caption" color={t.textSecondary}>
            {tr('zakat.keptOnDevice')}
          </AppText>
        </>
      )}
    </>
  );
}

export function ZakatScreen() {
  const t = useTokens();
  const androidInsets = useScrollInsets({ top: false, bottom: 'nav', baseBottom: spacing.l });
  const { t: tr, i18n } = useTranslation();
  const { store } = useSettings();
  const [raw, setRaw] = useState<Record<FieldKey, string>>(
    Object.fromEntries(Object.keys(EMPTY_INPUTS).map((k) => [k, ''])) as Record<FieldKey, string>
  );
  const [basis, setBasis] = useState<NisabBasis>('silver');
  const [editing, setEditing] = useState<FieldKey | null>(null);
  const [aboutOpen, setAboutOpen] = useState(false);

  const inputs = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(raw).map(([k, v]) => [k, parseAmount(v)])
      ) as unknown as ZakatInputs,
    [raw]
  );
  const result = useMemo(() => computeZakat(inputs, basis), [inputs, basis]);

  const fmt = (n: number) => formatMoney(n, i18n.language);

  const onSave = () => {
    const saved = saveCalculation(store, { basis, inputs, result });
    const text = buildExportText(
      saved,
      {
        title: tr('zakat.exportTitle'),
        wealth: tr('zakat.whatYouHold'),
        nisab: tr('zakat.aboutNisab'),
        due: tr('zakat.due'),
        ratesNote: tr('zakat.ratesByHand'),
      },
      fmt
    );
    void Share.share({ message: text });
  };

  const metalRowValue = (gramsKey: 'goldGrams' | 'silverGrams') => {
    const priceKey = gramsKey === 'goldGrams' ? 'goldPricePerGram' : 'silverPricePerGram';
    const grams = inputs[gramsKey];
    const price = inputs[priceKey];
    if (grams > 0 && price > 0) {
      return tr('zakat.goldWorking', {
        grams: localizeNumber(grams, i18n.language),
        price: fmt(price),
      });
    }
    return localizeNumber(grams, i18n.language);
  };

  const assetRow = (key: FieldKey) => (
    <ListRow
      key={key}
      label={tr(`zakat.fields.${key}`)}
      onPress={() => setEditing(key)}
      haptic="select"
      testID={`zakat-${key}`}
      trailing={
        key === 'goldGrams' || key === 'silverGrams' ? (
          <AppText variant="bodyStrong" color={t.textSecondary}>
            {metalRowValue(key)}
          </AppText>
        ) : key === 'liabilities' ? (
          <MoneyText
            amount={inputs[key]}
            signed={inputs[key] > 0}
            variant="body"
            color={t.textSecondary}
          />
        ) : (
          <MoneyText amount={inputs[key]} variant="bodyStrong" />
        )
      }
    />
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: t.bgCanvas }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen options={{ title: tr('zakat.title') }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.scroll, androidInsets]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerRow}>
          <AppText variant="subtitle">{tr('zakat.title')}</AppText>
          <AppText
            variant="link"
            onPress={() => setAboutOpen(true)}
            accessibilityRole="button"
            testID="zakat-about"
          >
            {tr('zakat.aboutNisab')}
          </AppText>
        </View>
        <AppText variant="caption" color={t.textSecondary} style={styles.privacyLine}>
          {tr('zakat.privacyLine')}
        </AppText>

        <SectionRule label={tr('zakat.whatYouHold')} style={styles.sectionRule} />
        <ListCard>{ASSET_FIELDS.map(assetRow)}</ListCard>

        <SectionRule label={tr('zakat.liabilitiesSection')} style={styles.sectionRule} />
        <ListCard>{assetRow('liabilities')}</ListCard>

        <SectionRule label={tr('zakat.prices')} style={styles.sectionRule} />
        <AppText variant="caption" style={[styles.note, { color: t.textSecondary }]}>
          {tr('zakat.pricesNote', { gold: NISAB_GOLD_GRAMS, silver: NISAB_SILVER_GRAMS })} ·{' '}
          {tr('zakat.ratesByHand')}
        </AppText>
        <ListCard>{PRICE_FIELDS.map(assetRow)}</ListCard>

        <SegmentedRow<NisabBasis>
          options={[
            { key: 'silver', label: tr('zakat.nisabSilverSeg'), testID: 'nisab-silver' },
            { key: 'gold', label: tr('zakat.nisabGoldSeg'), testID: 'nisab-gold' },
          ]}
          value={basis}
          onChange={setBasis}
          accessibilityLabel={tr('zakat.aboutNisab')}
          style={styles.segmented}
        />

        <GoldFrameCard
          gradientColors={featuredGradient.light}
          style={styles.resultCard}
          testID="zakat-result"
        >
          <ZakatResultBody result={result} inputs={inputs} fmt={fmt} onSave={onSave} />
        </GoldFrameCard>

        <View
          style={[styles.disclaimer, { backgroundColor: t.ochreSoft, borderStartColor: t.ochre }]}
        >
          <AppText variant="caption" style={{ color: t.ochre }}>
            {tr('zakat.disclaimer')}
          </AppText>
        </View>
      </ScrollView>

      <Sheet
        visible={editing !== null}
        onClose={() => setEditing(null)}
        accessibilityLabel={tr('zakat.editTitle')}
        testID="zakat-edit-sheet"
      >
        <AppText variant="subtitle" style={styles.sheetTitle}>
          {editing ? tr(`zakat.fields.${editing}`) : tr('zakat.editTitle')}
        </AppText>
        {editing && (
          <TextInput
            testID="zakat-edit-input"
            autoFocus
            value={raw[editing]}
            onChangeText={(text) => setRaw((prev) => ({ ...prev, [editing]: text }))}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor={t.icon}
            accessibilityLabel={tr(`zakat.fields.${editing}`)}
            maxFontSizeMultiplier={fontScaleCaps.content}
            style={[styles.sheetInput, { color: t.textPrimary, borderColor: t.border }]}
          />
        )}
        <Button
          title={tr('zakat.apply')}
          testID="zakat-edit-done"
          onPress={() => setEditing(null)}
        />
      </Sheet>

      <Sheet
        visible={aboutOpen}
        onClose={() => setAboutOpen(false)}
        accessibilityLabel={tr('zakat.aboutNisab')}
        testID="zakat-about-sheet"
      >
        <AppText variant="subtitle" style={styles.sheetTitle}>
          {tr('zakat.aboutNisab')}
        </AppText>
        {/* SCHOLAR-REVIEW: nisab explainer (docs/SCHOLAR_REVIEW.md) */}
        <AppText variant="reading" color={t.textSecondary} style={styles.aboutBody}>
          {tr('zakat.aboutNisabBody')}
        </AppText>
      </Sheet>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    padding: spacing.xl,
    paddingBottom: spacing.l,
    maxWidth: measure.content,
    width: '100%',
    alignSelf: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.m,
  },
  privacyLine: { marginTop: spacing.xs },
  sectionRule: { marginTop: spacing.l, marginBottom: spacing.s },
  note: { marginBottom: spacing.s },
  segmented: { marginTop: spacing.l },
  resultCard: {
    borderRadius: radius.card,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.m,
    marginTop: spacing.l,
  },
  resultAmount: { fontFamily: fonts.serifSemiBold, fontSize: fontSize.display, lineHeight: 44 },
  resultRule: { width: '100%' },
  resultCentered: { textAlign: 'center' },
  disclaimer: {
    borderRadius: radius.control,
    borderStartWidth: 3,
    padding: spacing.m,
    marginTop: spacing.l,
  },
  sheetTitle: { marginBottom: spacing.m },
  sheetInput: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.control,
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.m,
    marginBottom: spacing.m,
    fontSize: 16,
  },
  aboutBody: { paddingBottom: spacing.l },
});
