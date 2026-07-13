import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, type TextProps } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';
import { fonts, fontSize, MAX_FONT_SCALE, URDU_LINE_HEIGHT_FACTOR } from '@/src/lib/theme/tokens';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link' | 'serifBody' | 'caption';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');
  const tint = useThemeColor({}, 'tint');
  const { i18n } = useTranslation();
  // Nastaliq hangs far below the baseline — swap family and open the leading.
  const urdu =
    i18n.language === 'ur'
      ? { fontFamily: fonts.nastaliq, lineHeight: lineHeightFor(type) * URDU_LINE_HEIGHT_FACTOR }
      : undefined;

  return (
    <Text
      maxFontSizeMultiplier={MAX_FONT_SCALE}
      style={[
        { color },
        type === 'default' ? styles.default : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'link' ? [styles.link, { color: tint }] : undefined,
        type === 'serifBody' ? styles.serifBody : undefined,
        type === 'caption' ? styles.caption : undefined,
        urdu,
        style,
      ]}
      {...rest}
    />
  );
}

function lineHeightFor(type: NonNullable<ThemedTextProps['type']>): number {
  switch (type) {
    case 'title':
      return 36;
    case 'subtitle':
      return 28;
    case 'serifBody':
      return 26;
    case 'caption':
      return 18;
    default:
      return 24;
  }
}

const styles = StyleSheet.create({
  default: {
    fontFamily: fonts.sans,
    fontSize: fontSize.body,
    lineHeight: 24,
  },
  defaultSemiBold: {
    fontFamily: fonts.sansSemiBold,
    fontSize: fontSize.body,
    lineHeight: 24,
  },
  title: {
    fontFamily: fonts.serifSemiBold,
    fontSize: fontSize.title,
    lineHeight: 36,
  },
  subtitle: {
    fontFamily: fonts.serifMedium,
    fontSize: fontSize.h2,
    lineHeight: 28,
  },
  link: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSize.body,
    lineHeight: 24,
  },
  /** Long-form reading content (translations, editorial passages). */
  serifBody: {
    fontFamily: fonts.serif,
    fontSize: fontSize.body,
    lineHeight: 26,
  },
  caption: {
    fontFamily: fonts.sans,
    fontSize: fontSize.caption,
    lineHeight: 18,
  },
});
