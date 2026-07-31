import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppText } from './AppText';
import { Marker } from './Marker';
import {
  fonts,
  fontScaleCaps,
  fontSize,
  MAX_ARABIC_EFFECTIVE_SCALE,
  quranType,
  spacing,
} from '@/src/lib/theme/tokens';
import { useTokens } from '@/src/lib/theme/useTokens';

/**
 * AyahBlock (handoff §5 gap 08) — THE mushaf rendering vessel. Every ayah in
 * the app (reader cards, verse of the day) passes through here: Amiri Quran
 * at ≥26pt with double leading, RTL writing direction, accessibilityLanguage
 * "ar", an optional ayah-number Marker header, and the translation
 * subordinate beneath in the reading face.
 *
 * NO-AI ZONE (CLAUDE.md rule 1): `text` must be the byte-verbatim string
 * from assets/db/quran.db — this component never transforms it, and it
 * deliberately accepts NO style/color/weight overrides so scripture cannot
 * be decorated. Tajweed runs arrive pre-split with resolved colors (the
 * flag-gated mapping lives in the quran feature, not here).
 */
export type AyahRun = { text: string; color?: string };

export type AyahBlockProps = {
  /** Byte-verbatim Quranic text from the bundled database. */
  text: string;
  /** Optional pre-split tajweed runs; when set, they replace `text` visually
   * (their concatenation must equal `text` — the caller's golden tests own
   * that invariant). */
  runs?: readonly AyahRun[];
  /** Translation rendered beneath in the reading face; omit to hide. */
  translation?: string;
  /** Renders the header row: 7px Marker + this localized ayah number. */
  ayahNumber?: string;
  /** `reciting` turns the header Marker gold (audio follow). */
  markerState?: 'idle' | 'reciting';
  /** Reader A−/A+ scale product; the Arabic cap keeps scale × Dynamic Type
   * under MAX_ARABIC_EFFECTIVE_SCALE. */
  scale?: number;
  /** `reader` = full size (28pt base), `card` = preview size (24pt base). */
  size?: 'reader' | 'card';
  testID?: string;
};

export function AyahBlock({
  text,
  runs,
  translation,
  ayahNumber,
  markerState = 'idle',
  scale = 1,
  size = 'reader',
  testID,
}: AyahBlockProps) {
  const t = useTokens();
  const arabicCap = Math.min(fontScaleCaps.content, MAX_ARABIC_EFFECTIVE_SCALE / scale);
  const arabicSize = (size === 'reader' ? quranType.ayahSize : quranType.cardAyahSize) * scale;
  const arabicLineHeight =
    (size === 'reader' ? quranType.ayahLineHeight : quranType.cardAyahLineHeight) * scale;

  return (
    <View testID={testID}>
      {ayahNumber !== undefined ? (
        <View style={styles.header}>
          <Marker size={7} tone={markerState === 'reciting' ? 'ochre' : 'border'} />
          <AppText variant="caption" color={markerState === 'reciting' ? t.ochre : t.textSecondary}>
            {ayahNumber}
          </AppText>
        </View>
      ) : null}
      <AppText
        accessibilityLanguage="ar"
        maxFontSizeMultiplier={arabicCap}
        style={[
          styles.arabic,
          { color: t.textPrimary, fontSize: arabicSize, lineHeight: arabicLineHeight },
        ]}
      >
        {runs
          ? runs.map((run, i) =>
              run.color ? (
                <Text key={i} style={{ color: run.color }}>
                  {run.text}
                </Text>
              ) : (
                run.text
              )
            )
          : text}
      </AppText>
      {translation !== undefined ? (
        <AppText
          variant="reading"
          maxFontSizeMultiplier={arabicCap}
          color={t.textSecondary}
          style={{
            fontSize: fontSize.body * scale,
            lineHeight: 26 * scale,
            marginTop: spacing.s,
          }}
          testID={testID ? `${testID}-translation` : undefined}
        >
          {translation}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    marginBottom: spacing.s,
  },
  arabic: {
    fontFamily: fonts.quran,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
