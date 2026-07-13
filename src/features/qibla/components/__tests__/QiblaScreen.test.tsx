import { act, fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { QiblaScreen } from '../QiblaScreen';
import { createMemoryKVStore } from '../../../../lib/kvStore';
import { SettingsProvider } from '../../../settings/SettingsContext';

let mockHeadingCb:
  ((h: { trueHeading: number; magHeading: number; accuracy: number }) => void) | null = null;
const mockRemove = jest.fn();
let mockPermission = 'granted';

jest.mock('expo-location', () => ({
  getForegroundPermissionsAsync: jest.fn(async () => ({
    status: mockPermission,
    canAskAgain: true,
  })),
  requestForegroundPermissionsAsync: jest.fn(async () => ({ status: mockPermission })),
  watchHeadingAsync: jest.fn(async (cb: typeof mockHeadingCb) => {
    mockHeadingCb = cb;
    return { remove: mockRemove };
  }),
}));
jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn(async () => {}),
  notificationAsync: jest.fn(async () => {}),
  NotificationFeedbackType: { Success: 'success' },
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const HOUSTON_SETTINGS = JSON.stringify({
  location: { type: 'manual', cityId: 'houston-us' },
  method: 'auto',
  madhab: 'shafi',
  highLatRule: 'auto',
});
// Houston qibla bearing ≈ 43.2° (verified against the adhan reference in bearing tests).

const renderQibla = async (initial: Record<string, string> = {}) => {
  const store = createMemoryKVStore(initial);
  const view = await render(
    <SettingsProvider store={store}>
      <QiblaScreen />
    </SettingsProvider>
  );
  return { store, view };
};

const emit = async (h: { trueHeading: number; magHeading: number; accuracy: number }) => {
  await act(async () => {
    mockHeadingCb?.(h);
    // Real compasses report over time; respect the hook's ~15Hz UI throttle.
    await new Promise((r) => setTimeout(r, 70));
  });
};

beforeEach(() => {
  mockHeadingCb = null;
  mockPermission = 'granted';
  jest.clearAllMocks();
});

describe('QiblaScreen', () => {
  test('without a location shows the choose-city state', async () => {
    const { view } = await renderQibla();
    expect(view.getByTestId('qibla-choose-city')).toBeOnTheScreen();
  });

  test('turn guidance updates with the mocked heading stream and aligns with haptics', async () => {
    const Haptics = jest.requireMock('expo-haptics');
    const { view } = await renderQibla({ 'settings.v1': HOUSTON_SETTINGS });
    expect(mockHeadingCb).not.toBeNull();

    // Facing north (0°): qibla ≈ 43° to the right.
    await emit({ trueHeading: 0, magHeading: 0, accuracy: 3 });
    expect(view.getByTestId('qibla-status').props.children).toMatch(/right/);
    expect(Haptics.selectionAsync).not.toHaveBeenCalled();

    // Rotate straight at the qibla — smoothing needs a few samples to converge.
    for (let i = 0; i < 24; i++) await emit({ trueHeading: 43, magHeading: 43, accuracy: 3 });
    expect(view.getByTestId('qibla-status').props.children).toMatch(/Facing the qibla/);
    expect(Haptics.selectionAsync).toHaveBeenCalled();
    expect(Haptics.notificationAsync).toHaveBeenCalledTimes(1);

    // Overshoot far right: guidance flips to the left.
    for (let i = 0; i < 40; i++) await emit({ trueHeading: 100, magHeading: 100, accuracy: 3 });
    expect(view.getByTestId('qibla-status').props.children).toMatch(/left/);
    // Success haptic stays once-per-session.
    expect(Haptics.notificationAsync).toHaveBeenCalledTimes(1);
  });

  test('magnetic fallback shows the caveat chip; calibration chip on low accuracy', async () => {
    const { view } = await renderQibla({ 'settings.v1': HOUSTON_SETTINGS });
    await emit({ trueHeading: -1, magHeading: 120, accuracy: 1 });
    expect(view.getByTestId('magnetic-caveat')).toBeOnTheScreen();
    expect(view.getByTestId('calibration-chip')).toBeOnTheScreen();
  });

  test('denied permission shows the privacy-honest request state', async () => {
    mockPermission = 'denied';
    const { view } = await renderQibla({ 'settings.v1': HOUSTON_SETTINGS });
    expect(view.getByTestId('qibla-grant')).toBeOnTheScreen();
  });

  test('subscription is cleaned up on unmount', async () => {
    const { view } = await renderQibla({ 'settings.v1': HOUSTON_SETTINGS });
    await act(async () => view.unmount());
    expect(mockRemove).toHaveBeenCalled();
  });
});
