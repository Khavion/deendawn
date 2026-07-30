import { act, fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { FullAdhanPlayer, wantsFullAdhan } from '../../FullAdhanPlayer';

let mockResponseCb: ((r: unknown) => void) | null = null;
let mockLastResponse: unknown = null;
const mockPlayer = { play: jest.fn(), pause: jest.fn(), remove: jest.fn() };

jest.mock('expo-notifications', () => ({
  addNotificationResponseReceivedListener: jest.fn((cb: (r: unknown) => void) => {
    mockResponseCb = cb;
    return { remove: jest.fn() };
  }),
  getLastNotificationResponseAsync: jest.fn(() => Promise.resolve(mockLastResponse)),
}));
jest.mock('expo-audio', () => ({
  createAudioPlayer: jest.fn(() => mockPlayer),
  setAudioModeAsync: jest.fn(async () => {}),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const response = (data: Record<string, unknown>, identifier = 'test-id') => ({
  notification: { request: { identifier, content: { data } } },
});

beforeEach(() => {
  mockResponseCb = null;
  mockLastResponse = null;
  jest.clearAllMocks();
});

describe('wantsFullAdhan', () => {
  test('extracts the prayer only when the full-adhan flag is set', () => {
    expect(wantsFullAdhan(response({ fullAdhan: true, prayer: 'fajr' }) as never)).toBe('fajr');
    expect(wantsFullAdhan(response({ fullAdhan: false, prayer: 'fajr' }) as never)).toBeNull();
    expect(wantsFullAdhan(response({}) as never)).toBeNull();
  });
});

describe('FullAdhanPlayer', () => {
  test('plays on a full-adhan response and stops on tap', async () => {
    const Audio = jest.requireMock('expo-audio');
    const view = await render(<FullAdhanPlayer />);
    expect(view.queryByTestId('full-adhan-banner')).toBeNull();

    await act(async () => {
      mockResponseCb?.(response({ fullAdhan: true, prayer: 'maghrib' }));
      await Promise.resolve();
    });

    expect(Audio.setAudioModeAsync).toHaveBeenCalledWith({ playsInSilentMode: true });
    expect(mockPlayer.play).toHaveBeenCalled();
    expect(view.getByTestId('full-adhan-banner')).toBeOnTheScreen();
    expect(view.getByText(/Maghrib/)).toBeOnTheScreen();

    await fireEvent.press(view.getByTestId('stop-adhan'));
    expect(mockPlayer.pause).toHaveBeenCalled();
    expect(view.queryByTestId('full-adhan-banner')).toBeNull();
  });

  test('ignores ordinary notification taps', async () => {
    const view = await render(<FullAdhanPlayer />);
    await act(async () => {
      mockResponseCb?.(response({ prayer: 'asr', plannedId: 'asr-2026-07-13' }));
      await Promise.resolve();
    });
    expect(mockPlayer.play).not.toHaveBeenCalled();
    expect(view.queryByTestId('full-adhan-banner')).toBeNull();
  });

  test('cold start: the launch response plays via getLastNotificationResponseAsync', async () => {
    mockLastResponse = response({ fullAdhan: true, prayer: 'fajr' }, 'fajr-2026-07-30');
    const view = await render(<FullAdhanPlayer />);
    await act(async () => {});
    expect(mockPlayer.play).toHaveBeenCalledTimes(1);
    expect(view.getByTestId('full-adhan-banner')).toBeOnTheScreen();
  });

  test('the same response delivered warm AND as last-response plays once (dedupe)', async () => {
    mockLastResponse = response({ fullAdhan: true, prayer: 'fajr' }, 'fajr-2026-07-30');
    await render(<FullAdhanPlayer />);
    await act(async () => {});
    await act(async () => {
      mockResponseCb?.(response({ fullAdhan: true, prayer: 'fajr' }, 'fajr-2026-07-30'));
      await Promise.resolve();
    });
    expect(mockPlayer.play).toHaveBeenCalledTimes(1);
  });

  test('distinct notifications are not deduped', async () => {
    mockLastResponse = response({ fullAdhan: true, prayer: 'fajr' }, 'fajr-2026-07-30');
    await render(<FullAdhanPlayer />);
    await act(async () => {});
    await act(async () => {
      mockResponseCb?.(response({ fullAdhan: true, prayer: 'dhuhr' }, 'dhuhr-2026-07-30'));
      await Promise.resolve();
    });
    expect(mockPlayer.play).toHaveBeenCalledTimes(2);
  });
});
