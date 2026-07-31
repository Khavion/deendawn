import { act, fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';

import { Sheet } from '../Sheet';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 20, left: 0, right: 0 }),
}));

describe('Sheet', () => {
  it('renders children and the grabber when visible', async () => {
    const { getByText, getByTestId } = await render(
      <Sheet visible onClose={() => {}} testID="sheet">
        <Text>content</Text>
      </Sheet>
    );
    expect(getByText('content')).toBeTruthy();
    expect(getByTestId('sheet-grabber')).toBeTruthy();
  });

  it('renders nothing when not visible', async () => {
    const { queryByText } = await render(
      <Sheet visible={false} onClose={() => {}}>
        <Text>hidden</Text>
      </Sheet>
    );
    expect(queryByText('hidden')).toBeNull();
  });

  it('scrim press requests close (after the settle animation)', async () => {
    jest.useFakeTimers();
    const onClose = jest.fn();
    const { getByTestId } = await render(
      <Sheet visible onClose={onClose} testID="sheet">
        <Text>x</Text>
      </Sheet>
    );
    await fireEvent.press(getByTestId('sheet-scrim'));
    await act(async () => {
      jest.runAllTimers();
    });
    expect(onClose).toHaveBeenCalled();
    jest.useRealTimers();
  });

  it('hardware back requests close', async () => {
    jest.useFakeTimers();
    const onClose = jest.fn();
    const { getByTestId } = await render(
      <Sheet visible onClose={onClose} testID="sheet">
        <Text>x</Text>
      </Sheet>
    );
    await fireEvent(getByTestId('sheet'), 'requestClose');
    await act(async () => {
      jest.runAllTimers();
    });
    expect(onClose).toHaveBeenCalled();
    jest.useRealTimers();
  });
});
