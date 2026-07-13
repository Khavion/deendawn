import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { CalendarScreen } from '../CalendarScreen';
import { createMemoryKVStore } from '../../../../lib/kvStore';
import { SettingsProvider } from '../../../settings/SettingsContext';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
}));

// Fixed viewpoint: 20 Feb 2026 = 3 Ramadan 1447 (verified in hijri tests).
const FIXED = new Date(2026, 1, 20);

const renderCalendar = async (initial: Record<string, string> = {}) => {
  const store = createMemoryKVStore(initial);
  return render(
    <SettingsProvider store={store}>
      <CalendarScreen initialDate={FIXED} />
    </SettingsProvider>
  );
};

describe('CalendarScreen', () => {
  test('shows dual dates, hijri header, today line, and the disclaimer', async () => {
    const view = await renderCalendar();
    expect(view.getByText(/February 2026/)).toBeOnTheScreen();
    expect(view.getAllByText(/Ramadan 1447/).length).toBeGreaterThanOrEqual(1);
    expect(view.getByText(/Today: 3 Ramadan 1447/)).toBeOnTheScreen();
    expect(view.getByText(/may differ from local moonsighting/)).toBeOnTheScreen();
    // Feb 18 2026 = 1 Ramadan -> key-date dot on that cell.
    expect(view.getByTestId('key-18')).toBeOnTheScreen();
    expect(view.getByText('Ramadan begins')).toBeOnTheScreen();
  });

  test('navigates months and spans hijri months in the header', async () => {
    const view = await renderCalendar();
    await fireEvent.press(view.getByTestId('next-month'));
    expect(view.getByText(/March 2026/)).toBeOnTheScreen();
    // March 2026 spans Ramadan -> Shawwal 1447 (Eid al-Fitr expected).
    expect(view.getByText(/Shawwal 1447/)).toBeOnTheScreen();
    expect(view.getByText('Eid al-Fitr')).toBeOnTheScreen();
  });

  test('hijri offset shifts the calendar (+1 makes Feb 17 the first of Ramadan)', async () => {
    const view = await renderCalendar({
      'settings.v1': JSON.stringify({
        location: null,
        method: 'auto',
        madhab: 'shafi',
        highLatRule: 'auto',
        hijriOffset: 1,
        suhoorReminderMinutes: null,
      }),
    });
    expect(view.getByText(/Today: 4 Ramadan 1447/)).toBeOnTheScreen();
    expect(view.getByTestId('key-17')).toBeOnTheScreen();
  });
});
