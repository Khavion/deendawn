import { renderHook } from '@testing-library/react-native';

import { haptic, useHaptics } from '../haptics';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  selectionAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning' },
}));

let mockReduceMotion = false;
jest.mock('../theme/useDeviceTier', () => ({
  useDeviceTier: () => ({ tier: 'radiant', reduceMotion: mockReduceMotion, flat: false }),
}));

const Haptics = jest.requireMock('expo-haptics');

describe('haptic vocabulary', () => {
  beforeEach(() => jest.clearAllMocks());

  it('maps each verb to the right expo-haptics call', () => {
    haptic.press();
    haptic.detent();
    haptic.select();
    haptic.success();
    haptic.warning();
    expect(Haptics.impactAsync).toHaveBeenCalledWith('light');
    expect(Haptics.impactAsync).toHaveBeenCalledWith('medium');
    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);
    expect(Haptics.notificationAsync).toHaveBeenCalledWith('success');
    expect(Haptics.notificationAsync).toHaveBeenCalledWith('warning');
  });
});

describe('useHaptics', () => {
  beforeEach(() => jest.clearAllMocks());

  it('fires real haptics when Reduce Motion is off', async () => {
    mockReduceMotion = false;
    const { result } = await renderHook(() => useHaptics());
    result.current.select();
    result.current.success();
    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);
    expect(Haptics.notificationAsync).toHaveBeenCalledWith('success');
  });

  it('silences every verb when Reduce Motion is on', async () => {
    mockReduceMotion = true;
    const { result } = await renderHook(() => useHaptics());
    result.current.press();
    result.current.detent();
    result.current.select();
    result.current.success();
    result.current.warning();
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
    expect(Haptics.selectionAsync).not.toHaveBeenCalled();
    expect(Haptics.notificationAsync).not.toHaveBeenCalled();
  });
});
