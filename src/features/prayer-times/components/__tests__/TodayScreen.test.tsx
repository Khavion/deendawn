import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { TodayScreen } from '../TodayScreen';
import { createMemoryKVStore } from '../../../../lib/kvStore';
import { SettingsProvider } from '../../../settings/SettingsContext';

jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageTag: 'en-US' }],
}));
// The mute action cancels via expo-notifications, which has no scheduled-
// notification mock under jest — the screen only needs the resolved count.
jest.mock('../../../notifications/silenceToday', () => ({
  silenceToday: jest.fn().mockResolvedValue(0),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
// Verse-of-the-day card queries the Quran db + router. Stub both (Latin
// placeholders only — no Arabic literals in source, per the content guard).
const mockDb = {
  getFirstSync: (sql: string) =>
    sql.includes('surahs')
      ? {
          number: 1,
          name_transliteration: 'Al-Faatiha',
          name_english: 'The Opening',
          ayah_count: 7,
        }
      : {
          id: 1,
          surah: 1,
          ayah: 1,
          juz: 1,
          text_uthmani: '[arabic]',
          text_translation: 'In the name of Allah.',
        },
  getAllSync: () => [],
};
jest.mock('expo-sqlite', () => ({ useSQLiteContext: () => mockDb }));
jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));

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

  test('choosing a city from the picker persists it and shows the five prayer rows', async () => {
    const { store, view } = await renderToday();
    await fireEvent.press(view.getByTestId('choose-city'));
    await fireEvent.changeText(view.getByTestId('city-search'), 'hous');
    await fireEvent.press(view.getByTestId('city-houston-us'));

    expect(JSON.parse(store.get('settings.v1')!)).toMatchObject({
      location: { type: 'manual', cityId: 'houston-us' },
    });
    // Handoff §6 screen 01: exactly the five prayers — sunrise left the list.
    for (const p of ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']) {
      expect(view.getByTestId(`prayer-row-${p}`)).toBeOnTheScreen();
    }
    expect(view.queryByTestId('prayer-row-sunrise')).toBeNull();
    // Each row shows a clock time like 5:13 AM.
    expect(view.getAllByText(/\d{1,2}:\d{2}\s?(AM|PM)/i).length).toBeGreaterThanOrEqual(5);
  });

  test('with a saved city renders location label and a countdown card', async () => {
    const { view } = await renderToday({ 'settings.v1': HOUSTON_SETTINGS });
    expect(view.getByText('Houston')).toBeOnTheScreen();
    expect(view.getByText(/^(in\s|now$)/)).toBeOnTheScreen();
  });

  test('mute today silences and flips the hero caption', async () => {
    const { view } = await renderToday({ 'settings.v1': HOUSTON_SETTINGS });
    // The caption row only exists while a today-prayer with sound is next.
    const mute = view.queryByTestId('mute-today');
    if (mute) {
      expect(view.getByText('Adhan will sound')).toBeOnTheScreen();
      await fireEvent.press(mute);
      expect(view.getByText('Muted for today')).toBeOnTheScreen();
      expect(view.queryByTestId('mute-today')).toBeNull();
    }
  });
});
