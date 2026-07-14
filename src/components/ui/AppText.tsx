import { useTranslation } from 'react-i18next';
import { Text, type TextProps } from 'react-native';

import { fonts, latinType, MAX_FONT_SCALE, URDU_LINE_HEIGHT_FACTOR } from '@/src/lib/theme/tokens';
import { useTokens } from '@/src/lib/theme/useTokens';

export type AppTextVariant =
  | 'display'
  | 'displayAccent'
  | 'title'
  | 'subtitle'
  | 'reading'
  | 'body'
  | 'bodyStrong'
  | 'link'
  | 'eyebrow'
  | 'caption';

export type AppTextProps = TextProps & {
  variant?: AppTextVariant;
  /** Override the token-derived color. */
  color?: string;
};

/**
 * The app's Latin text primitive (Khavion type system). Variants map to the
 * `latinType` scale in tokens; color comes from the theme unless overridden.
 * `displayAccent` is the green italic serif accent word for headlines; `link`
 * defaults to the primary/accent color.
 *
 * Arabic precedence: when the UI language is Urdu, the Nastaliq face and its
 * opened leading take over (Quranic/Arabic content renders via its own Amiri
 * components, never through AppText).
 */
export function AppText({ variant = 'body', color, style, ...rest }: AppTextProps) {
  const t = useTokens();
  const { i18n } = useTranslation();
  const spec = latinType[variant];

  const defaultColor =
    variant === 'displayAccent' || variant === 'link'
      ? t.accent
      : variant === 'eyebrow'
        ? t.textSecondary
        : t.textPrimary;

  const urdu =
    i18n.language === 'ur'
      ? { fontFamily: fonts.nastaliq, lineHeight: spec.lineHeight * URDU_LINE_HEIGHT_FACTOR }
      : undefined;

  return (
    <Text
      maxFontSizeMultiplier={MAX_FONT_SCALE}
      style={[spec, { color: color ?? defaultColor }, urdu, style]}
      {...rest}
    />
  );
}
