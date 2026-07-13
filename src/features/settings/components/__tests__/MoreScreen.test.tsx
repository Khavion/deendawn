import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { MoreScreen } from '../MoreScreen';
import { createMemoryKVStore } from '../../../../lib/kvStore';
import { SettingsProvider } from '../../SettingsContext';

jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageTag: 'en-US' }],
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('../../../notifications/service', () => ({
  ensurePermission: jest.fn(async () => true),
  rescheduleAll: jest.fn(async () => {}),
}));

const renderMore = async (initial: Record<string, string> = {}) => {
  const store = createMemoryKVStore(initial);
  const view = await render(
    <SettingsProvider store={store}>
      <MoreScreen />
    </SettingsProvider>
  );
  return { store, view };
};

describe('MoreScreen', () => {
  test('shows the four prayer settings with friendly defaults', async () => {
    const { view } = await renderMore();
    expect(view.getByText('Location')).toBeOnTheScreen();
    expect(view.getByText('Not set')).toBeOnTheScreen();
    expect(view.getByText('Calculation method')).toBeOnTheScreen();
    expect(view.getByText('Automatic')).toBeOnTheScreen();
    expect(view.getByText('Asr time (madhab)')).toBeOnTheScreen();
    expect(view.getByText('High-latitude nights')).toBeOnTheScreen();
  });

  test('changing madhab persists and updates the row', async () => {
    const { store, view } = await renderMore();
    await fireEvent.press(view.getByTestId('setting-madhab'));
    await fireEvent.press(view.getByTestId('option-hanafi'));
    expect(JSON.parse(store.get('settings.v1')!)).toMatchObject({ madhab: 'hanafi' });
    expect(view.getByText(/Hanafi \(later Asr\)/)).toBeOnTheScreen();
  });

  test('changing method to a specific authority persists it', async () => {
    const { store, view } = await renderMore();
    await fireEvent.press(view.getByTestId('setting-method'));
    await fireEvent.press(view.getByTestId('option-UmmAlQura'));
    expect(JSON.parse(store.get('settings.v1')!)).toMatchObject({ method: 'UmmAlQura' });
  });

  test('adhan notification toggles persist per prayer and trigger a reschedule', async () => {
    const { store, view } = await renderMore();
    const service = jest.requireMock('../../../notifications/service');
    await fireEvent(view.getByTestId('notif-fajr'), 'valueChange', false);
    expect(JSON.parse(store.get('notificationPrefs.v1')!)).toMatchObject({
      enabled: { fajr: false, dhuhr: true },
    });
    expect(service.rescheduleAll).toHaveBeenCalled();
    await fireEvent(view.getByTestId('notif-fajr'), 'valueChange', true);
    expect(JSON.parse(store.get('notificationPrefs.v1')!)).toMatchObject({
      enabled: { fajr: true },
    });
    expect(service.ensurePermission).toHaveBeenCalledWith(true);
  });

  test('setting location through the city picker persists the city', async () => {
    const { store, view } = await renderMore();
    await fireEvent.press(view.getByTestId('setting-city'));
    await fireEvent.changeText(view.getByTestId('city-search'), 'karachi');
    await fireEvent.press(view.getByTestId('city-karachi-pk'));
    expect(JSON.parse(store.get('settings.v1')!)).toMatchObject({
      location: { type: 'manual', cityId: 'karachi-pk' },
    });
    expect(view.getByText('Karachi')).toBeOnTheScreen();
  });
});
