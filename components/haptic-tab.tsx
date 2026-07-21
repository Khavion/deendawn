import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable } from '@react-navigation/elements';

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
