import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';

import { AppPressable, type AppPressableProps } from './AppPressable';
import { AppText } from './AppText';
import { Divider } from './Divider';
import { Marker } from './Marker';
import { elevation, radius, richMode, spacing } from '@/src/lib/theme/tokens';
import { useThemeMode } from '@/src/lib/theme/ThemeProvider';
import { useTokens } from '@/src/lib/theme/useTokens';
import { useDeviceTier } from '@/src/lib/theme/useDeviceTier';

/**
 * ListCard + ListRow (handoff §5 gap 05) — the one list idiom for the whole
 * app: prayer times, methods, assets, observances, settings. A Card with
 * zero padding holding rows separated by inset hairlines; rows carry a
 * leading Marker slot, a label, and a trailing value.
 *
 * Row states: `marked` (the next prayer — ochreSoft wash, control radius,
 * bodyStrong, value in ochre, 7px diamond), `past` (icon color both sides),
 * `default`. All rows ≥48pt.
 */
export type ListRowState = 'default' | 'marked' | 'past';

export type ListRowProps = {
  label: string;
  /** Trailing text (a time, a setting's current value). */
  value?: string;
  state?: ListRowState;
  /** Custom leading node; `marked` shows the diamond when omitted. */
  leading?: React.ReactNode;
  /** Custom trailing node (chevron, switch); wins over `value`. */
  trailing?: React.ReactNode;
  onPress?: AppPressableProps['onPress'];
  haptic?: AppPressableProps['haptic'];
  accessibilityLabel?: string;
  accessibilityRole?: AppPressableProps['accessibilityRole'];
  accessibilityState?: AppPressableProps['accessibilityState'];
  style?: StyleProp<ViewStyle>;
  testID?: string;
  children?: React.ReactNode;
};

export function ListRow({
  label,
  value,
  state = 'default',
  leading,
  trailing,
  onPress,
  haptic = 'press',
  accessibilityLabel,
  accessibilityRole,
  accessibilityState,
  style,
  testID,
  children,
}: ListRowProps) {
  const t = useTokens();

  const labelColor = state === 'past' ? t.icon : t.textPrimary;
  const valueColor = state === 'marked' ? t.ochre : state === 'past' ? t.icon : t.textSecondary;
  const lead = leading ?? (state === 'marked' ? <Marker size={7} tone="ochre" /> : null);

  const body = (
    <>
      {lead ? <View style={styles.leading}>{lead}</View> : null}
      <AppText
        variant={state === 'marked' ? 'bodyStrong' : 'body'}
        color={labelColor}
        style={styles.label}
        numberOfLines={1}
      >
        {label}
      </AppText>
      {trailing ??
        (value !== undefined ? (
          <AppText variant={state === 'marked' ? 'bodyStrong' : 'body'} color={valueColor}>
            {value}
          </AppText>
        ) : null)}
      {children}
    </>
  );

  const rowStyle = [
    styles.row,
    state === 'marked' && { backgroundColor: t.ochreSoft, borderRadius: radius.control },
    style,
  ];

  if (!onPress) {
    return (
      <View
        style={rowStyle}
        testID={testID}
        accessible
        accessibilityLabel={accessibilityLabel}
        accessibilityState={accessibilityState}
      >
        {body}
      </View>
    );
  }
  return (
    <AppPressable
      onPress={onPress}
      haptic={haptic}
      accessibilityRole={accessibilityRole ?? 'button'}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={accessibilityState}
      style={rowStyle}
      testID={testID}
    >
      {body}
    </AppPressable>
  );
}

/**
 * The zero-padding surface that hosts ListRows, drawing inset hairlines
 * between (not after) its visible children.
 */
export function ListCard({ style, children, ...rest }: ViewProps) {
  const t = useTokens();
  const mode = useThemeMode();
  const { flat } = useDeviceTier();
  const rm = richMode(mode);
  const items = React.Children.toArray(children).filter(Boolean);
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: t.bgSurface, borderColor: t.border },
        flat ? undefined : elevation[rm].e2,
        style,
      ]}
      {...rest}
    >
      {items.map((child, i) => (
        <React.Fragment key={(React.isValidElement(child) && child.key) || i}>
          {i > 0 ? <Divider inset /> : null}
          {child}
        </React.Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    paddingVertical: spacing.m,
    paddingHorizontal: spacing.m,
    gap: spacing.s,
  },
  leading: { minWidth: 14, alignItems: 'center' },
  label: { flex: 1 },
});
