import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { StyleSheet, Text } from 'react-native';

import { AppPressable } from '../AppPressable';
import { setHapticsEnabled } from '@/src/lib/haptics';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  selectionAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));
const Haptics = jest.requireMock('expo-haptics');

afterEach(() => {
  setHapticsEnabled(true);
  jest.clearAllMocks();
});

describe('AppPressable', () => {
  it('preserves caller LAYOUT styles on the pressable node itself', async () => {
    // Regression guard for the release-only defect where the animated wrapper
    // dropped flexDirection from every converted row (commit 52883bb).
    const view = await render(
      <AppPressable testID="p" style={{ flexDirection: 'row', gap: 12, paddingVertical: 8 }}>
        <Text>a</Text>
        <Text>b</Text>
      </AppPressable>
    );
    const flat = StyleSheet.flatten(view.getByTestId('p').props.style);
    expect(flat.flexDirection).toBe('row');
    expect(flat.gap).toBe(12);
    expect(flat.paddingVertical).toBe(8);
    // And it must be a plain Pressable-rendered view — no transform injected
    // at rest (the old animated wrapper always carried one).
    expect(flat.transform).toBeUndefined();
  });

  it('merges function styles from callers without losing them', async () => {
    const view = await render(
      <AppPressable
        testID="p"
        style={({ pressed }) => [{ flexDirection: 'row' }, pressed && { opacity: 0.5 }]}
      >
        <Text>x</Text>
      </AppPressable>
    );
    const flat = StyleSheet.flatten(view.getByTestId('p').props.style);
    expect(flat.flexDirection).toBe('row');
  });

  it('fires its haptic verb through the user-setting gate', async () => {
    const onPress = jest.fn();
    const view = await render(
      <AppPressable testID="p" haptic="select" onPress={onPress}>
        <Text>x</Text>
      </AppPressable>
    );
    await fireEvent.press(view.getByTestId('p'));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);

    setHapticsEnabled(false);
    await fireEvent.press(view.getByTestId('p'));
    expect(onPress).toHaveBeenCalledTimes(2);
    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1); // still 1 — gated
  });

  it('never fires haptics without an explicit verb', async () => {
    const view = await render(
      <AppPressable testID="p" onPress={() => {}}>
        <Text>x</Text>
      </AppPressable>
    );
    await fireEvent.press(view.getByTestId('p'));
    expect(Haptics.selectionAsync).not.toHaveBeenCalled();
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
    expect(Haptics.notificationAsync).not.toHaveBeenCalled();
  });
});
