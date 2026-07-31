import { act, render } from '@testing-library/react-native';
import React from 'react';
import { AccessibilityInfo } from 'react-native';

import { Countdown } from '../Countdown';

const MIN = 60_000;

describe('Countdown', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-07-31T12:00:00Z'));
  });
  afterEach(() => {
    // Fake-timer state bleeds between tests in one file otherwise — a stale
    // re-arm timeout from a prior test fires into the next render's act.
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('renders the minute form under an hour', async () => {
    const target = new Date(Date.now() + 41 * MIN);
    const { getByText } = await render(<Countdown target={target} />);
    expect(getByText('in 41 minutes')).toBeTruthy();
  });

  it('singular minute', async () => {
    const target = new Date(Date.now() + MIN);
    const { getByText } = await render(<Countdown target={target} />);
    expect(getByText('in 1 minute')).toBeTruthy();
  });

  it('renders the hours form at and above the hour', async () => {
    const target = new Date(Date.now() + (2 * 60 + 14) * MIN);
    const { getByText } = await render(<Countdown target={target} />);
    expect(getByText('in 2 h 14 min')).toBeTruthy();
  });

  it('renders "now" under a minute', async () => {
    const target = new Date(Date.now() + 30_000);
    const { getByText } = await render(<Countdown target={target} />);
    expect(getByText('now')).toBeTruthy();
  });

  it('ticks across a minute boundary on its own timer', async () => {
    const target = new Date(Date.now() + 2 * MIN + 5_000);
    const { getByText } = await render(<Countdown target={target} />);
    expect(getByText('in 3 minutes')).toBeTruthy();
    await act(async () => {
      jest.advanceTimersByTime(6_000);
    });
    expect(getByText('in 2 minutes')).toBeTruthy();
  });

  it('announces politely at the configured minute marks', async () => {
    const announce = jest
      .spyOn(AccessibilityInfo, 'announceForAccessibility')
      .mockImplementation(() => {});
    const target = new Date(Date.now() + 10 * MIN);
    await render(<Countdown target={target} announceAtMinutes={[10]} />);
    // Assert membership, not position: React can replay a prior test tree's
    // deferred passive effect into this act flush under fake timers.
    expect(announce).toHaveBeenCalledWith('in 10 minutes');
    announce.mockRestore();
  });

  it('is a polite live region', async () => {
    const target = new Date(Date.now() + 5 * MIN);
    const { getByText } = await render(<Countdown target={target} />);
    expect(getByText('in 5 minutes').props.accessibilityLiveRegion).toBe('polite');
  });
});
