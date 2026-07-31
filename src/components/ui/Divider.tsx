import React from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { onFeaturedTokens, spacing } from '@/src/lib/theme/tokens';
import { useTokens } from '@/src/lib/theme/useTokens';

export type DividerProps = ViewProps & {
  /**
   * `onFeatured` renders the gold-dark hairline for filled featured cards.
   * (Inside a GoldFrameCard's content tone, `default` already resolves to
   * that hairline via the provided tokens — this exists for opted-out
   * callers.)
   */
  tone?: 'default' | 'onFeatured';
  /** Start-inset hairline for rows inside a ListCard (logical, RTL-safe). */
  inset?: boolean;
};

/** Hairline rule in the line/border token. */
export function Divider({ tone = 'default', inset = false, style, ...rest }: DividerProps) {
  const t = useTokens();
  return (
    <View
      style={[
        styles.line,
        { backgroundColor: tone === 'onFeatured' ? onFeaturedTokens.border : t.border },
        inset && styles.inset,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  line: { height: StyleSheet.hairlineWidth, width: '100%' },
  inset: { marginStart: spacing.l, width: 'auto', alignSelf: 'stretch' },
});
