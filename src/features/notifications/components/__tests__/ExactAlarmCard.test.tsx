import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { ExactAlarmCard } from '../ExactAlarmCard';

let mockShowCard = false;
const mockOpenSettings = jest.fn().mockResolvedValue(undefined);
jest.mock('../../useExactAlarm', () => ({
  useExactAlarm: () => ({ showCard: mockShowCard, openSettings: mockOpenSettings }),
}));
jest.mock('expo-localization', () => ({ getLocales: () => [{ languageTag: 'en-US' }] }));

describe('ExactAlarmCard', () => {
  beforeEach(() => {
    mockShowCard = false;
    mockOpenSettings.mockClear();
  });

  test('renders nothing when granted or not applicable', async () => {
    const view = await render(<ExactAlarmCard />);
    expect(view.queryByTestId('exact-alarm-card')).toBeNull();
  });

  test('denied: renders the card with the honest caveat; button opens settings', async () => {
    mockShowCard = true;
    const view = await render(<ExactAlarmCard />);
    expect(view.getByTestId('exact-alarm-card')).toBeOnTheScreen();
    expect(view.getByText('Make adhan times exact')).toBeOnTheScreen();
    expect(view.getByText(/a few minutes late/i)).toBeOnTheScreen();
    fireEvent.press(view.getByTestId('exact-alarm-open-settings'));
    expect(mockOpenSettings).toHaveBeenCalledTimes(1);
  });
});
