import { fireEvent, render } from '@testing-library/react-native';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import React from 'react';

import { TabBar, TAB_BAR_HEIGHT } from '../TabBar';

/**
 * Minimal BottomTabBarProps stand-ins: the component only reads state.routes,
 * state.index, descriptors[key].options, navigation.emit/navigate, insets.
 */
function makeProps(activeIndex = 0) {
  const routes = [
    { key: 'index-1', name: 'index' },
    { key: 'quran-1', name: 'quran' },
    { key: 'qibla-1', name: 'qibla' },
    { key: 'tasbih-1', name: 'tasbih' },
    { key: 'more-1', name: 'more' },
  ];
  const titles: Record<string, string> = {
    index: 'Today',
    quran: 'Quran',
    qibla: 'Qibla',
    tasbih: 'Tasbih',
    more: 'More',
  };
  const navigate = jest.fn();
  const emit = jest.fn(() => ({ defaultPrevented: false }));
  return {
    props: {
      state: { index: activeIndex, routes },
      descriptors: Object.fromEntries(
        routes.map((r) => [
          r.key,
          { options: { title: titles[r.name], tabBarButtonTestID: `tab-${r.name}` } },
        ])
      ),
      navigation: { emit, navigate },
      insets: { top: 0, bottom: 20, left: 0, right: 0 },
    } as unknown as BottomTabBarProps,
    navigate,
    emit,
  };
}

describe('TabBar', () => {
  it('renders all five labels with tab roles and marks the active one selected', async () => {
    const { props } = makeProps(0);
    const { getByTestId, getByText } = await render(<TabBar {...props} />);
    for (const label of ['Today', 'Quran', 'Qibla', 'Tasbih', 'More']) {
      expect(getByText(label)).toBeTruthy();
    }
    expect(getByTestId('tab-index').props.accessibilityState.selected).toBe(true);
    expect(getByTestId('tab-quran').props.accessibilityState.selected).toBe(false);
  });

  it('navigates on pressing an inactive tab, not the active one', async () => {
    const { props, navigate } = makeProps(0);
    const { getByTestId } = await render(<TabBar {...props} />);
    await fireEvent.press(getByTestId('tab-tasbih'));
    expect(navigate).toHaveBeenCalledWith('tasbih', undefined);
    navigate.mockClear();
    await fireEvent.press(getByTestId('tab-index'));
    expect(navigate).not.toHaveBeenCalled();
  });

  it('respects a prevented tabPress event', async () => {
    const { props, navigate, emit } = makeProps(0);
    emit.mockReturnValueOnce({ defaultPrevented: true });
    const { getByTestId } = await render(<TabBar {...props} />);
    await fireEvent.press(getByTestId('tab-quran'));
    expect(navigate).not.toHaveBeenCalled();
  });

  it('sizes to the exported height plus the bottom inset', async () => {
    const { props } = makeProps(0);
    const view = await render(<TabBar {...props} />);
    const style = JSON.stringify(view.toJSON());
    expect(style).toContain(`"height":${TAB_BAR_HEIGHT + 20}`);
    expect(style).toContain('"paddingBottom":20');
  });
});
