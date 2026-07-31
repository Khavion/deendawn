import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { TasbihScreen } from '../TasbihScreen';
import { createMemoryKVStore } from '../../../../lib/kvStore';
import { setStreakEnabled } from '../../tasbihState';
import { SettingsProvider } from '../../../settings/SettingsContext';

jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn(async () => {}),
  impactAsync: jest.fn(async () => {}),
  notificationAsync: jest.fn(async () => {}),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' },
  NotificationFeedbackType: { Success: 'success' },
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  useFocusEffect: (cb: () => void | (() => void)) => {
    const React = jest.requireActual('react');
    React.useEffect(cb, []);
  },
}));

const renderTasbih = async (setup?: (store: ReturnType<typeof createMemoryKVStore>) => void) => {
  const store = createMemoryKVStore();
  setup?.(store);
  const view = await render(
    <SettingsProvider store={store}>
      <TasbihScreen />
    </SettingsProvider>
  );
  return { store, view };
};

const tapN = async (view: Awaited<ReturnType<typeof renderTasbih>>['view'], n: number) => {
  for (let i = 0; i < n; i++) await fireEvent.press(view.getByTestId('tasbih-tap'));
};

beforeEach(() => jest.clearAllMocks());

describe('TasbihScreen', () => {
  test('taps count with a selection tick each time', async () => {
    const Haptics = jest.requireMock('expo-haptics');
    const { view } = await renderTasbih();
    await tapN(view, 2);
    expect(view.getByTestId('tasbih-count').props.children).toBe('2');
    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(2);
  });

  test('starts on the guided set: SubhanAllah round 1 of 3, target 33', async () => {
    const { view } = await renderTasbih();
    expect(view.getByText(/SubhanAllah · Round 1 of 3/)).toBeOnTheScreen();
    expect(view.getByText('of 33')).toBeOnTheScreen();
    expect(view.getByText('SubhanAllah — Glory be to Allah')).toBeOnTheScreen();
  });

  test('33 completes the round: ONE detent, Continue button, no auto-advance', async () => {
    const Haptics = jest.requireMock('expo-haptics');
    const { view } = await renderTasbih();
    await tapN(view, 33);
    expect(view.getByText(/SubhanAllah · Complete/)).toBeOnTheScreen();
    expect(Haptics.impactAsync).toHaveBeenCalledTimes(1);
    expect(Haptics.notificationAsync).not.toHaveBeenCalled();
    // Held: further taps do not advance anything.
    await tapN(view, 3);
    expect(view.getByTestId('tasbih-count').props.children).toBe('33');
    // Continue moves to Alhamdulillah.
    await fireEvent.press(view.getByTestId('tasbih-continue'));
    expect(view.getByText(/Alhamdulillah · Round 2 of 3/)).toBeOnTheScreen();
    expect(view.getByTestId('tasbih-count').props.children).toBe('0');
  });

  test('"keep tapping toward 99" carries progress into the free 99', async () => {
    const { view } = await renderTasbih();
    await tapN(view, 33);
    await fireEvent.press(view.getByTestId('tasbih-keep-tapping'));
    expect(view.getByText('of 99')).toBeOnTheScreen();
    expect(view.getByTestId('tasbih-count').props.children).toBe('33');
  });

  test('segmented row switches modes; reset clears', async () => {
    const { view } = await renderTasbih();
    await tapN(view, 5);
    await fireEvent.press(view.getByTestId('target-99'));
    expect(view.getByText('of 99')).toBeOnTheScreen();
    expect(view.getByTestId('tasbih-count').props.children).toBe('0');
    await tapN(view, 4);
    await fireEvent.press(view.getByTestId('tasbih-reset'));
    expect(view.getByTestId('tasbih-count').props.children).toBe('0');
  });

  test('custom opens the sheet and applies a target', async () => {
    const { view } = await renderTasbih();
    await fireEvent.press(view.getByTestId('target-custom'));
    await fireEvent.changeText(view.getByTestId('tasbih-custom-input'), '500');
    await fireEvent.press(view.getByTestId('tasbih-custom-apply'));
    expect(view.getByText('of 500')).toBeOnTheScreen();
  });

  test('history card shows the week total and streak-off caption by default', async () => {
    const { view } = await renderTasbih();
    await tapN(view, 3);
    expect(view.getByText('3 this week')).toBeOnTheScreen();
    expect(view.getByText(/today 3 · streak off/)).toBeOnTheScreen();
    expect(view.getByTestId('tasbih-weekbars')).toBeOnTheScreen();
  });

  test('opt-in streak shows the quiet kept caption', async () => {
    const { view } = await renderTasbih((store) => setStreakEnabled(store, true));
    await tapN(view, 1);
    expect(view.getByText(/kept/)).toBeOnTheScreen();
  });
});
