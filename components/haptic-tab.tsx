import { BottomTabBarButtonProps } from "expo-router/js-tabs";
import { PlatformPressable } from "expo-router/react-navigation";

import { useHaptics } from '@/src/lib/haptics';

export function HapticTab(props: BottomTabBarButtonProps) {
  const h = useHaptics();
  return (
    <PlatformPressable
      {...props}
      onPressIn={(ev) => {
        if (process.env.EXPO_OS === 'ios') {
          // Soft press feedback on tab-down (silenced under Reduce Motion).
          h.press();
        }
        props.onPressIn?.(ev);
      }}
    />
  );
}
