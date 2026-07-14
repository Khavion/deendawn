import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { TasbihScreen } from '../TasbihScreen';
import { createMemoryKVStore } from '../../../../lib/kvStore';
import { SettingsProvider } from '../../../settings/SettingsContext';

jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn(async () => {}),
  impactAsync: jest.fn(async () => {}),
  notificationAsync: jest.fn(async () => {}),
  ImpactFeedbackStyle: { Medium: 'medium' },
  NotificationFeedbackType: { Success: 'success' },
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('expo-router', () => ({ Stack: { Screen: () => null } }));

const renderTasbih = async () => {
  const store = createMemoryKVStore();
  const view = await render(
    <SettingsProvider store={store}>
      <TasbihScreen />
    </SettingsProvider>
  );
  return { store, view };
};

beforeEach(() => jest.clearAllMocks());

describe('TasbihScreen', () => {
  test('taps count with a selection tick each time', async () => {
    const Haptics = jest.requireMock('expo-haptics');
    const { view } = await renderTasbih();
    await fireEvent.press(view.getByTestId('tasbih-tap'));
    await fireEvent.press(view.getByTestId('tasbih-tap'));
    expect(view.getByTestId('tasbih-count').props.children).toBe(2);
    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(2);
  });

  test('33-target round completes with Success haptic and wraps to zero display of full round first', async () => {
    const Haptics = jest.requireMock('expo-haptics');
    const { view } = await renderTasbih();
    for (let i = 0; i < 33; i++) await fireEvent.press(view.getByTestId('tasbih-tap'));
    expect(Haptics.notificationAsync).toHaveBeenCalledTimes(1);
    // Milestone flash shows the full round momentarily.
    expect(view.getByTestId('tasbih-count').props.children).toBe(33);
  });

  test('99-target hits the Medium detent at 33 and 66', async () => {
    const Haptics = jest.requireMock('expo-haptics');
    const { view } = await renderTasbih();
    await fireEvent.press(view.getByTestId('target-99'));
    for (let i = 0; i < 66; i++) await fireEvent.press(view.getByTestId('tasbih-tap'));
    expect(Haptics.impactAsync).toHaveBeenCalledTimes(2);
    expect(Haptics.notificationAsync).not.toHaveBeenCalled();
  });

  test('reset zeroes the count; label persists user text', async () => {
    const { store, view } = await renderTasbih();
    await fireEvent.press(view.getByTestId('tasbih-tap'));
    await fireEvent.press(view.getByTestId('tasbih-reset'));
    expect(view.getByTestId('tasbih-count').props.children).toBe(0);
    await fireEvent.changeText(view.getByTestId('tasbih-label'), 'Morning dhikr');
    expect(JSON.parse(store.get('tasbih.v1')!)).toMatchObject({ label: 'Morning dhikr' });
  });

  test('announces the selected target and a live, bounded counter value', async () => {
    const { view } = await renderTasbih();
    // Default target 33 is selected; 99 is not — screen readers hear the choice.
    expect(view.getByTestId('target-33').props.accessibilityState).toEqual({ selected: true });
    expect(view.getByTestId('target-99').props.accessibilityState).toEqual({ selected: false });
    // The counter exposes a live value (announced on change), not baked into its name.
    expect(view.getByTestId('tasbih-tap').props.accessibilityValue).toEqual({
      now: 0,
      min: 0,
      max: 33,
    });
    await fireEvent.press(view.getByTestId('tasbih-tap'));
    expect(view.getByTestId('tasbih-tap').props.accessibilityValue.now).toBe(1);
    // Selecting 99 moves the selection and the counter's upper bound.
    await fireEvent.press(view.getByTestId('target-99'));
    expect(view.getByTestId('target-99').props.accessibilityState).toEqual({ selected: true });
    expect(view.getByTestId('target-33').props.accessibilityState).toEqual({ selected: false });
    expect(view.getByTestId('tasbih-tap').props.accessibilityValue.max).toBe(99);
  });

  test('daily history shows after taps', async () => {
    const { view } = await renderTasbih();
    await fireEvent.press(view.getByTestId('tasbih-tap'));
    await fireEvent.press(view.getByTestId('tasbih-tap'));
    await fireEvent.press(view.getByTestId('tasbih-tap'));
    // Today's row shows 3.
    const today = new Date();
    const key = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    expect(view.getByText(key)).toBeOnTheScreen();
    expect(view.getAllByText('3').length).toBeGreaterThanOrEqual(1);
  });
});
