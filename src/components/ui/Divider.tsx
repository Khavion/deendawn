import React from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { useTokens } from '@/src/lib/theme/useTokens';

/** Hairline rule in the line/border token. */
export function Divider({ style, ...rest }: ViewProps) {
  const t = useTokens();
  return <View style={[styles.line, { backgroundColor: t.border }, style]} {...rest} />;
}

const styles = StyleSheet.create({ line: { height: StyleSheet.hairlineWidth, width: '100%' } });
