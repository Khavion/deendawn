import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';

import { TipsScreen } from '../components/TipsScreen';
import { hasTipped, markTipped } from '../tipsService';
import type { TipsBackend } from '../tipsService';
import { createMemoryKVStore, KVStore } from '@/src/lib/kvStore';

let mockStore: KVStore = createMemoryKVStore();
jest.mock('@/src/features/settings/SettingsContext', () => ({
  useSettings: () => ({ store: mockStore }),
}));

jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

const fakeBackend = (overrides: Partial<TipsBackend> = {}): TipsBackend => ({
  loadOptions: jest.fn(async () => [
    { id: 'tip_small', priceLabel: '$4.99' },
    { id: 'tip_medium', priceLabel: '$9.99' },
    { id: 'tip_large', priceLabel: '$19.99' },
  ]),
  purchase: jest.fn(async () => true),
  restore: jest.fn(async () => false),
  ...overrides,
});

describe('TipsScreen', () => {
  beforeEach(() => {
    mockStore = createMemoryKVStore();
  });

  it('shows the honest unavailable state without a backend', async () => {
    const { getByTestId } = await render(<TipsScreen backend={null} />);
    expect(getByTestId('tips-unavailable')).toBeTruthy();
  });

  it('lists tip options cheapest-first once loaded', async () => {
    const { getByTestId } = await render(<TipsScreen backend={fakeBackend()} />);
    await waitFor(() => expect(getByTestId('tip-tip_small')).toBeTruthy());
    expect(getByTestId('tip-tip_large')).toBeTruthy();
  });

  it('completed purchase persists the thank-you state', async () => {
    const backend = fakeBackend();
    const { getByTestId } = await render(<TipsScreen backend={backend} />);
    await waitFor(() => expect(getByTestId('tip-tip_small')).toBeTruthy());
    await fireEvent.press(getByTestId('tip-tip_small'));
    await waitFor(() => expect(getByTestId('tips-thanks')).toBeTruthy());
    expect(hasTipped(mockStore)).toBe(true);
  });

  it('cancelled purchase returns to the options', async () => {
    const backend = fakeBackend({ purchase: jest.fn(async () => false) });
    const { getByTestId } = await render(<TipsScreen backend={backend} />);
    await waitFor(() => expect(getByTestId('tip-tip_small')).toBeTruthy());
    await fireEvent.press(getByTestId('tip-tip_small'));
    await waitFor(() => expect(getByTestId('tip-tip_small')).toBeTruthy());
    expect(hasTipped(mockStore)).toBe(false);
  });

  it('restore surfaces the thank-you state when a tip exists', async () => {
    const backend = fakeBackend({ restore: jest.fn(async () => true) });
    const { getByTestId } = await render(<TipsScreen backend={backend} />);
    await waitFor(() => expect(getByTestId('tips-restore')).toBeTruthy());
    await fireEvent.press(getByTestId('tips-restore'));
    await waitFor(() => expect(getByTestId('tips-thanks')).toBeTruthy());
  });

  it('opens straight to thanks when the user already tipped', async () => {
    markTipped(mockStore);
    const { getByTestId, queryByTestId } = await render(<TipsScreen backend={fakeBackend()} />);
    expect(getByTestId('tips-thanks')).toBeTruthy();
    expect(queryByTestId('tips-loading')).toBeNull();
  });

  it('backend failure degrades to the unavailable state', async () => {
    const backend = fakeBackend({
      loadOptions: jest.fn(async () => {
        throw new Error('no offerings');
      }),
    });
    const { getByTestId } = await render(<TipsScreen backend={backend} />);
    await waitFor(() => expect(getByTestId('tips-unavailable')).toBeTruthy());
  });
});
