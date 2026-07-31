import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppPressable } from './AppPressable';
import { AppText } from './AppText';
import { Marker } from './Marker';
import { radius, spacing } from '@/src/lib/theme/tokens';
import { useTokens } from '@/src/lib/theme/useTokens';

/**
 * RadioRow / CheckRow (handoff §5 gap 23): a ListRow whose control is the
 * 9px diamond — filled when selected, outline otherwise — with REAL
 * radio/checkbox semantics so screen readers announce the checked state.
 * A selected row may take the quiet ochre wash. Used by: method pickers,
 * notification style, theme pick, zakat asset types.
 */
type SelectionRowBaseProps = {
  label: string;
  /** Secondary line under the label ("suggested for Pakistan"). */
  sub?: string;
  selected: boolean;
  onPress: () => void;
  /** Apply the ochreSoft wash when selected (onboarding-style pickers). */
  washed?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

function SelectionRow({
  role,
  label,
  sub,
  selected,
  onPress,
  washed = true,
  style,
  testID,
}: SelectionRowBaseProps & { role: 'radio' | 'checkbox' }) {
  const t = useTokens();
  return (
    <AppPressable
      accessibilityRole={role}
      accessibilityState={{ checked: selected }}
      accessibilityLabel={sub ? `${label}, ${sub}` : label}
      haptic="select"
      onPress={onPress}
      style={[
        styles.row,
        washed && selected && { backgroundColor: t.ochreSoft, borderRadius: radius.control },
        style,
      ]}
      testID={testID}
    >
      <Marker size={9} tone="ochre" variant={selected ? 'filled' : 'outline'} />
      <View style={styles.textCol}>
        <AppText variant={selected ? 'bodyStrong' : 'body'}>{label}</AppText>
        {sub ? (
          <AppText variant="caption" color={t.textSecondary}>
            {sub}
          </AppText>
        ) : null}
      </View>
    </AppPressable>
  );
}

export function RadioRow(props: SelectionRowBaseProps) {
  return <SelectionRow role="radio" {...props} />;
}

export function CheckRow(props: SelectionRowBaseProps) {
  return <SelectionRow role="checkbox" {...props} />;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    paddingVertical: spacing.m,
    paddingHorizontal: spacing.m,
    gap: spacing.m,
  },
  textCol: { flex: 1, gap: 2 },
});
