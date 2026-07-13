import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { OnboardingScreen } from '../components/OnboardingScreen';
import { isOnboarded, markOnboarded } from '../onboardingState';
import { createMemoryKVStore } from '../../../lib/kvStore';
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

describe('onboarding state', () => {
  test('flag round-trips', () => {
    const store = createMemoryKVStore();
    expect(isOnboarded(store)).toBe(false);
    markOnboarded(store);
    expect(isOnboarded(store)).toBe(true);
  });
});

describe('OnboardingScreen', () => {
  test('walks welcome -> city -> notifications, enables reminders, marks done', async () => {
    const store = createMemoryKVStore();
    const view = await render(
      <SettingsProvider store={store}>
        <OnboardingScreen />
      </SettingsProvider>
    );
    expect(view.getByTestId('step-welcome')).toBeOnTheScreen();
    await fireEvent.press(view.getByTestId('ob-begin'));
    expect(view.getByTestId('step-city')).toBeOnTheScreen();

    await fireEvent.press(view.getByTestId('ob-city'));
    await fireEvent.changeText(view.getByTestId('city-search'), 'karachi');
    await fireEvent.press(view.getByTestId('city-karachi-pk'));
    expect(view.getByTestId('step-notifications')).toBeOnTheScreen();
    expect(JSON.parse(store.get('settings.v1')!)).toMatchObject({
      location: { type: 'manual', cityId: 'karachi-pk' },
    });

    await fireEvent.press(view.getByTestId('ob-reminders'));
    const service = jest.requireMock('../../notifications/service');
    expect(service.ensurePermission).toHaveBeenCalledWith(true);
    expect(isOnboarded(store)).toBe(true);
    expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
  });

  test('skip finishes without requesting permission', async () => {
    const store = createMemoryKVStore();
    const view = await render(
      <SettingsProvider store={store}>
        <OnboardingScreen />
      </SettingsProvider>
    );
    await fireEvent.press(view.getByTestId('ob-begin'));
    await fireEvent.press(view.getByTestId('ob-city'));
    await fireEvent.changeText(view.getByTestId('city-search'), 'london');
    await fireEvent.press(view.getByTestId('city-london-gb'));
    await fireEvent.press(view.getByTestId('ob-skip'));
    const service = jest.requireMock('../../notifications/service');
    expect(service.ensurePermission).not.toHaveBeenCalled();
    expect(isOnboarded(store)).toBe(true);
  });
});
