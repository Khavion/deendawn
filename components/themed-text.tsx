import { StyleSheet, Text, type TextProps } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';
import { fonts, fontSize, MAX_FONT_SCALE } from '@/src/lib/theme/tokens';

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
        style,
      ]}
      {...rest}
    />
  );
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
