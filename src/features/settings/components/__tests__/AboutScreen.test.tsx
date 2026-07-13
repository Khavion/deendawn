import { render } from '@testing-library/react-native';
import React from 'react';

import { AboutScreen } from '../AboutScreen';

jest.mock('expo-router', () => ({ Stack: { Screen: () => null } }));
jest.mock('expo-constants', () => ({ expoConfig: { version: '1.0.0' } }));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

describe('AboutScreen', () => {
  test('renders required attributions (Tanzil clause), privacy promise, dev-only badge', async () => {
    const view = await render(<AboutScreen />);
    // Tanzil attribution is a license REQUIREMENT — this test keeps it visible.
    expect(view.getAllByText(/Tanzil/).length).toBeGreaterThanOrEqual(2);
    expect(view.getByText(/Pickthall/)).toBeOnTheScreen();
    expect(view.getByText(/Claud Field/)).toBeOnTheScreen();
    expect(view.getAllByText(/SIL OFL/).length).toBeGreaterThanOrEqual(3);
    expect(view.getByText(/never transmitted/)).toBeOnTheScreen();
    expect(view.getAllByText(/Development placeholder/).length).toBeGreaterThanOrEqual(1);
  });
});
