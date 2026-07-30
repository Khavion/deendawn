import { renderHook } from '@testing-library/react-native';

import { haptic, setHapticsEnabled, useHaptics } from '../haptics';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  selectionAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));

const Haptics = jest.requireMock('expo-haptics');

afterEach(() => setHapticsEnabled(true));

describe('haptic vocabulary', () => {
  beforeEach(() => jest.clearAllMocks());

  it('maps each verb to the right expo-haptics call', () => {
    haptic.press();
    haptic.detent();
    haptic.select();
    haptic.success();
    haptic.warning();
    haptic.error();
    expect(Haptics.impactAsync).toHaveBeenCalledWith('light');
    expect(Haptics.impactAsync).toHaveBeenCalledWith('medium');
    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);
    expect(Haptics.notificationAsync).toHaveBeenCalledWith('success');
    expect(Haptics.notificationAsync).toHaveBeenCalledWith('warning');
    expect(Haptics.notificationAsync).toHaveBeenCalledWith('error');
  });
});

describe('useHaptics (user-setting gate)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('fires real haptics by default (setting on)', async () => {
    const { result } = await renderHook(() => useHaptics());
    result.current.select();
    result.current.success();
    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);
    expect(Haptics.notificationAsync).toHaveBeenCalledWith('success');
  });

  it('silences every verb the instant the user setting turns off', async () => {
    const { result } = await renderHook(() => useHaptics());
    setHapticsEnabled(false);
    result.current.press();
    result.current.detent();
    result.current.select();
    result.current.success();
    result.current.warning();
    result.current.error();
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
    expect(Haptics.selectionAsync).not.toHaveBeenCalled();
    expect(Haptics.notificationAsync).not.toHaveBeenCalled();
  });

  it('re-enabling restores feedback without re-rendering consumers', async () => {
    const { result } = await renderHook(() => useHaptics());
    setHapticsEnabled(false);
    result.current.select();
    setHapticsEnabled(true);
    result.current.select();
    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);
  });
});
