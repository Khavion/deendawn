import { fireEvent, render, within } from '@testing-library/react-native';
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

describe('CalendarScreen (hijri-primary, handoff screen 08)', () => {
  test('pages by hijri month: title, Gregorian range caption, observances', async () => {
    const view = await renderCalendar();
    // Hijri month is the primary title now.
    expect(view.getByTestId('hijri-month-title').props.children.join('')).toContain(
      'Ramadan 1447'
    );
    // Gregorian range rides the caption (Ramadan 1447 spans Feb–Mar 2026).
    expect(view.getByText(/February/)).toBeOnTheScreen();
    expect(view.getByText(/may differ from local moonsighting/)).toBeOnTheScreen();
    // 1 Ramadan carries a filled observance on hijri cell 1.
    expect(view.getByTestId('cell-1')).toBeOnTheScreen();
    expect(view.getByText('Ramadan begins')).toBeOnTheScreen();
    // Today (3 Ramadan) exists as a cell.
    expect(view.getByTestId('cell-3')).toBeOnTheScreen();
  });

  test('navigates hijri months with labeled arrows and the Today jump', async () => {
    const view = await renderCalendar();
    expect(view.getByTestId('prev-month').props.accessibilityLabel).toBe('Previous month');
    expect(view.getByTestId('next-month').props.accessibilityLabel).toBe('Next month');
    await fireEvent.press(view.getByTestId('next-month'));
    expect(view.getByTestId('hijri-month-title').props.children.join('')).toContain(
      'Shawwal 1447'
    );
    expect(view.getByText('Eid al-Fitr')).toBeOnTheScreen();
    await fireEvent.press(view.getByTestId('calendar-today'));
    expect(view.getByTestId('hijri-month-title').props.children.join('')).toContain(
      'Ramadan 1447'
    );
  });

  test('hijri offset shifts the mapping (+1: 1 Ramadan falls on Feb 17)', async () => {
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
    // Cell 1 of Ramadan shows Gregorian day 17 as its secondary numeral.
    expect(within(view.getByTestId('cell-1')).getByText('17')).toBeOnTheScreen();
    expect(view.getByTestId('hijri-month-title').props.children.join('')).toContain(
      'Ramadan 1447'
    );
  });

  test('accessibility: one label per cell with hijri day, weekday', async () => {
    const view = await renderCalendar();
    const label = view.getByTestId('cell-3').props.accessibilityLabel as string;
    expect(label).toContain('3 Ramadan');
    expect(label).toContain('today');
  });
});
