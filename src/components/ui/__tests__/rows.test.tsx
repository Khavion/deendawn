import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { ListCard, ListRow } from '../ListRow';
import { CheckRow, RadioRow } from '../SelectionRow';
import { SegmentedRow } from '../SegmentedRow';
import { palette } from '@/src/lib/theme/tokens';

describe('ListRow', () => {
  it('marked row takes the ochre wash, strong label, ochre value, diamond', async () => {
    const view = await render(<ListRow label="Asr" value="5:04 PM" state="marked" testID="r" />);
    const json = JSON.stringify(view.toJSON());
    expect(json).toContain(palette.light.ochreSoft);
    expect(json).toContain(palette.light.ochre);
  });

  it('past row renders both sides in the icon color', async () => {
    const view = await render(<ListRow label="Fajr" value="5:27 AM" state="past" />);
    expect(JSON.stringify(view.toJSON())).toContain(palette.light.icon);
  });

  it('is pressable with a button role when onPress is given', async () => {
    const onPress = jest.fn();
    const { getByTestId } = await render(
      <ListRow label="Method" value="Karachi" onPress={onPress} testID="row" />
    );
    await fireEvent.press(getByTestId('row'));
    expect(onPress).toHaveBeenCalled();
    expect(getByTestId('row').props.accessibilityRole).toBe('button');
  });
});

describe('ListCard', () => {
  it('draws inset dividers between rows, not after the last', async () => {
    const view = await render(
      <ListCard>
        <ListRow label="a" />
        <ListRow label="b" />
        <ListRow label="c" />
      </ListCard>
    );
    const json = JSON.stringify(view.toJSON());
    // Two hairlines for three rows.
    const dividers = json.split(`"marginStart":16`).length - 1;
    expect(dividers).toBe(2);
  });
});

describe('RadioRow / CheckRow', () => {
  it('announces a real radio role with checked state', async () => {
    const { getByTestId } = await render(
      <RadioRow label="Karachi" sub="suggested" selected onPress={() => {}} testID="radio" />
    );
    const row = getByTestId('radio');
    expect(row.props.accessibilityRole).toBe('radio');
    expect(row.props.accessibilityState.checked).toBe(true);
    expect(row.props.accessibilityLabel).toBe('Karachi, suggested');
  });

  it('checkbox role for CheckRow', async () => {
    const { getByTestId } = await render(
      <CheckRow label="Translation" selected={false} onPress={() => {}} testID="check" />
    );
    expect(getByTestId('check').props.accessibilityRole).toBe('checkbox');
    expect(getByTestId('check').props.accessibilityState.checked).toBe(false);
  });
});

describe('SegmentedRow', () => {
  const options = [
    { key: 'a' as const, label: 'Silver', testID: 'seg-a' },
    { key: 'b' as const, label: 'Gold', testID: 'seg-b' },
  ];

  it('marks the active cell checked and fires onChange for the other', async () => {
    const onChange = jest.fn();
    const { getByTestId } = await render(
      <SegmentedRow options={options} value="a" onChange={onChange} />
    );
    expect(getByTestId('seg-a').props.accessibilityState.checked).toBe(true);
    await fireEvent.press(getByTestId('seg-b'));
    expect(onChange).toHaveBeenCalledWith('b');
    onChange.mockClear();
    await fireEvent.press(getByTestId('seg-a'));
    expect(onChange).not.toHaveBeenCalled();
  });
});
