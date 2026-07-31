import type { BottomTabBarProps } from 'expo-router/js-tabs';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppPressable } from './AppPressable';
import { AppText } from './AppText';
import { Marker } from './Marker';
import { spacing } from '@/src/lib/theme/tokens';
import { useTokens } from '@/src/lib/theme/useTokens';

/**
 * The custom tab bar (handoff §5 gap 03) — pixel-identical on both platforms
 * by design (§2 "same pixels"; decided over native bars, DECISIONS
 * 2026-07-31): 66pt + safe area on bgSurface with a top hairline. No icons —
 * the geometric icon set is Gate-#5 blocked, so the 7px ochre diamond above
 * the label is the only active mark. RTL mirrors via flex row for free.
 *
 * Height is exported so scroll insets and docked bars (ListenBar,
 * FullAdhanPlayer) can clear it exactly instead of guessing.
 */
export const TAB_BAR_HEIGHT = 66;

/** Reserved space above the label so activation never shifts the layout. */
const MARKER_SLOT = 13;

export function TabBar({ state, descriptors, navigation, insets }: BottomTabBarProps) {
  const t = useTokens();

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: t.bgSurface,
          borderTopColor: t.border,
          height: TAB_BAR_HEIGHT + insets.bottom,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.title ?? route.name;
        const focused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        return (
          <AppPressable
            key={route.key}
            haptic="select"
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={typeof label === 'string' ? label : undefined}
            testID={options.tabBarButtonTestID}
            onPress={onPress}
            style={styles.item}
          >
            <View style={styles.markerSlot}>{focused ? <Marker size={7} tone="ochre" /> : null}</View>
            <AppText variant="caption" color={focused ? t.textPrimary : t.icon} numberOfLines={1}>
              {label}
            </AppText>
          </AppPressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.xs,
    minHeight: TAB_BAR_HEIGHT,
  },
  markerSlot: {
    height: MARKER_SLOT,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
