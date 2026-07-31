import { render } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';

import { ProgressRing } from '../ProgressRing';

describe('ProgressRing', () => {
  it('exposes progress as an accessibility value', async () => {
    const { getByTestId } = await render(
      <ProgressRing size={96} progress={0.48} accessibilityLabel="Playback" testID="ring" />
    );
    expect(getByTestId('ring').props.accessibilityValue).toEqual({ min: 0, max: 100, now: 48 });
    expect(getByTestId('ring').props.accessibilityRole).toBe('progressbar');
  });

  it('clamps out-of-range progress', async () => {
    const { getByTestId } = await render(
      <ProgressRing size={96} progress={1.7} accessibilityLabel="x" testID="ring" />
    );
    expect(getByTestId('ring').props.accessibilityValue.now).toBe(100);
  });

  it('buffering drops the determinate accessibility value', async () => {
    const { getByTestId } = await render(
      <ProgressRing size={96} progress={0} state="buffering" accessibilityLabel="x" testID="ring" />
    );
    expect(getByTestId('ring').props.accessibilityValue).toBeUndefined();
  });

  it('renders the center child slot', async () => {
    const { getByText } = await render(
      <ProgressRing size={252} progress={0.5}>
        <Text>33</Text>
      </ProgressRing>
    );
    expect(getByText('33')).toBeTruthy();
  });
});
