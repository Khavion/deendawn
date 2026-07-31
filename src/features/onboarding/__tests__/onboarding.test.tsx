import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { OnboardingScreen } from '../components/OnboardingScreen';
import { isOnboarded, markOnboarded } from '../onboardingState';
import { createMemoryKVStore } from '../../../lib/kvStore';
import { loadNotificationPrefs } from '../../notifications/prefsStore';
import { SettingsProvider } from '../../settings/SettingsContext';

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ replace: mockReplace }) }));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('../../notifications/service', () => ({
  ensurePermission: jest.fn(async () => true),
  rescheduleAll: jest.fn(async () => {}),
}));

beforeEach(() => jest.clearAllMocks());

const renderOnboarding = async () => {
  const store = createMemoryKVStore();
  const view = await render(
    <SettingsProvider store={store}>
      <OnboardingScreen />
    </SettingsProvider>
  );
  return { store, view };
};

describe('onboarding state', () => {
  test('flag round-trips', () => {
    const store = createMemoryKVStore();
    expect(isOnboarded(store)).toBe(false);
    markOnboarded(store);
    expect(isOnboarded(store)).toBe(true);
  });
});

describe('OnboardingScreen', () => {
  test('walks the three steps: brand intro, city+method+preview, adhan ask', async () => {
    const { store, view } = await renderOnboarding();
    expect(view.getByTestId('step-welcome')).toBeOnTheScreen();
    expect(view.getByTestId('brand-mark')).toBeOnTheScreen();
    await fireEvent.press(view.getByTestId('ob-begin'));
    expect(view.getByTestId('step-city')).toBeOnTheScreen();

    await fireEvent.press(view.getByTestId('ob-city'));
    await fireEvent.changeText(view.getByTestId('city-search'), 'karachi');
    await fireEvent.press(view.getByTestId('city-karachi-pk'));
    expect(JSON.parse(store.get('settings.v1')!)).toMatchObject({
      location: { type: 'manual', cityId: 'karachi-pk' },
    });
    // Live preview appears once a city is chosen (§6 step 2).
    expect(view.getByTestId('ob-preview')).toBeOnTheScreen();

    await fireEvent.press(view.getByTestId('ob-city-next'));
    expect(view.getByTestId('step-notifications')).toBeOnTheScreen();

    // Default choice = adhan at every prayer; Finish applies it.
    await fireEvent.press(view.getByTestId('ob-finish'));
    const service = jest.requireMock('../../notifications/service');
    expect(service.ensurePermission).toHaveBeenCalledWith(true);
    const prefs = loadNotificationPrefs(store);
    expect(prefs.enabled.fajr).toBe(true);
    expect(prefs.sound.fajr).toBe('clip');
    expect(isOnboarded(store)).toBe(true);
    expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
  });

  test('the no-notifications choice finishes without requesting permission', async () => {
    const { store, view } = await renderOnboarding();
    await fireEvent.press(view.getByTestId('ob-begin'));
    await fireEvent.press(view.getByTestId('ob-city'));
    await fireEvent.changeText(view.getByTestId('city-search'), 'london');
    await fireEvent.press(view.getByTestId('city-london-gb'));
    await fireEvent.press(view.getByTestId('ob-city-next'));
    await fireEvent.press(view.getByTestId('ob-skip'));
    await fireEvent.press(view.getByTestId('ob-finish'));
    const service = jest.requireMock('../../notifications/service');
    expect(service.ensurePermission).not.toHaveBeenCalled();
    expect(loadNotificationPrefs(store).enabled.fajr).toBe(false);
    expect(isOnboarded(store)).toBe(true);
  });

  test('the quiet-chime choice enables with the default sound', async () => {
    const { store, view } = await renderOnboarding();
    await fireEvent.press(view.getByTestId('ob-begin'));
    await fireEvent.press(view.getByTestId('ob-city'));
    await fireEvent.changeText(view.getByTestId('city-search'), 'karachi');
    await fireEvent.press(view.getByTestId('city-karachi-pk'));
    await fireEvent.press(view.getByTestId('ob-city-next'));
    await fireEvent.press(view.getByTestId('ob-chime'));
    await fireEvent.press(view.getByTestId('ob-finish'));
    const prefs = loadNotificationPrefs(store);
    expect(prefs.enabled.isha).toBe(true);
    expect(prefs.sound.isha).toBe('default');
  });
});
