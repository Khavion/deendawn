import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { TodayScreen } from '../TodayScreen';
import { createMemoryKVStore } from '../../../../lib/kvStore';
import { SettingsProvider } from '../../../settings/SettingsContext';

jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageTag: 'en-US' }],
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const renderToday = async (initial: Record<string, string> = {}) => {
  const store = createMemoryKVStore(initial);
  const view = await render(
    <SettingsProvider store={store}>
      <TodayScreen />
    </SettingsProvider>
  );
  return { store, view };
};

const HOUSTON_SETTINGS = JSON.stringify({
  location: { type: 'manual', cityId: 'houston-us' },
  method: 'auto',
  madhab: 'shafi',
  highLatRule: 'auto',
});

beforeEach(() => {
  jest.useFakeTimers();
});
afterEach(() => {
  jest.useRealTimers();
});

describe('TodayScreen', () => {
  test('without a location shows the welcome empty state, never times', async () => {
    const { view } = await renderToday();
    expect(view.getByTestId('choose-city')).toBeOnTheScreen();
    expect(view.getByText(/As-salamu alaykum/i)).toBeOnTheScreen();
    expect(view.queryByTestId('prayer-row-fajr')).toBeNull();
  });

  test('choosing a city from the picker persists it and shows all six times', async () => {
    const { store, view } = await renderToday();
    await fireEvent.press(view.getByTestId('choose-city'));
    await fireEvent.changeText(view.getByTestId('city-search'), 'hous');
    await fireEvent.press(view.getByTestId('city-houston-us'));

    expect(JSON.parse(store.get('settings.v1')!)).toMatchObject({
      location: { type: 'manual', cityId: 'houston-us' },
    });
    for (const p of ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']) {
      expect(view.getByTestId(`prayer-row-${p}`)).toBeOnTheScreen();
    }
    // Each row shows a clock time like 5:13 AM.
    expect(view.getAllByText(/\d{1,2}:\d{2}\s?(AM|PM)/i).length).toBeGreaterThanOrEqual(6);
  });

  test('with a saved city renders location label and a countdown card', async () => {
    const { view } = await renderToday({ 'settings.v1': HOUSTON_SETTINGS });
    expect(view.getByText('Houston')).toBeOnTheScreen();
    expect(view.getByText(/^in\s/)).toBeOnTheScreen();
  });
});
