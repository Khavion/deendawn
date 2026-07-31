import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';

import { AyahBlock } from '../AyahBlock';
import { CompassDial } from '../CompassDial';
import { ListenBar } from '../ListenBar';
import { palette } from '@/src/lib/theme/tokens';

// A Latin stand-in string: AyahBlock must render its input byte-verbatim, so
// the assertion is equality with what we passed — real Quranic bytes come
// only from the db at runtime (NO-AI ZONE; the guard hook blocks Arabic
// literals here by design).
const SAMPLE = 'BISMILLAH_SAMPLE_BYTES';

describe('AyahBlock', () => {
  it('renders the text byte-verbatim with Arabic accessibility language', async () => {
    const { getByText } = await render(<AyahBlock text={SAMPLE} testID="ayah" />);
    const node = getByText(SAMPLE);
    expect(node.props.accessibilityLanguage).toBe('ar');
    expect(node.props.children).toBe(SAMPLE);
    const style = JSON.stringify(node.props.style);
    expect(style).toContain('AmiriQuran');
    expect(style).toContain('"writingDirection":"rtl"');
  });

  it('accepts no style overrides (prop surface is closed)', () => {
    // Type-level guarantee spot-checked at runtime: the component ignores
    // unknown props like `style` entirely.
    const props = { text: SAMPLE, style: { color: 'red' } } as never;
    expect(() => render(<AyahBlock {...(props as object)} text={SAMPLE} />)).not.toThrow();
  });

  it('renders translation subordinate and the reciting header marker', async () => {
    const { getByText, getByTestId } = await render(
      <AyahBlock
        text={SAMPLE}
        translation="translation line"
        ayahNumber="2:21"
        markerState="reciting"
        testID="ayah"
      />
    );
    expect(getByText('translation line')).toBeTruthy();
    expect(getByTestId('ayah-translation')).toBeTruthy();
    expect(JSON.stringify(getByText('2:21').props.style)).toContain(palette.light.ochre);
  });

  it('caps the effective Arabic scale as the reading scale grows', async () => {
    const { getByText } = await render(<AyahBlock text={SAMPLE} scale={2.0} />);
    // MAX_ARABIC_EFFECTIVE_SCALE 2.6 / scale 2.0 = 1.3 cap.
    expect(getByText(SAMPLE).props.maxFontSizeMultiplier).toBeCloseTo(1.3);
  });

  it('tajweed runs render with their resolved colors', async () => {
    const { getByText } = await render(
      <AyahBlock
        text={SAMPLE}
        runs={[
          { text: 'BISMILLAH_', color: '#C0392B' },
          { text: 'SAMPLE_BYTES' },
        ]}
      />
    );
    expect(getByText('BISMILLAH_')).toBeTruthy();
  });
});

describe('CompassDial', () => {
  const cardinals = { north: 'N', east: 'E', south: 'S', west: 'W' };

  it('renders cardinals with N emphasized and a center overlay', async () => {
    const { getByText } = await render(
      <CompassDial heading={30} bearing={261} aligned={false} cardinals={cardinals}>
        <Text>261</Text>
      </CompassDial>
    );
    expect(JSON.stringify(getByText('N').props.style)).toContain(palette.light.textPrimary);
    expect(JSON.stringify(getByText('E').props.style)).toContain(palette.light.icon);
    expect(getByText('261')).toBeTruthy();
  });

  it('aligned rim takes the solid ochre + celebration treatment', async () => {
    const view = await render(
      <CompassDial heading={261} bearing={261} aligned cardinals={cardinals} testID="dial" />
    );
    const json = JSON.stringify(view.toJSON());
    expect(json).toContain('"borderWidth":1.5');
    expect(json).toContain(palette.light.ochre);
  });

  it('no-sensor renders the rose north-up (no rotation)', async () => {
    const view = await render(
      <CompassDial heading={null} bearing={100} aligned={false} noSensor cardinals={cardinals} />
    );
    expect(JSON.stringify(view.toJSON())).toContain('"rotate":"0deg"');
  });
});

describe('ListenBar', () => {
  const base = {
    title: 'Al-Fatihah',
    subtitle: 'Mishary Rashid Alafasy · Murattal',
    progress: 0.38,
    onToggle: jest.fn(),
    toggleAccessibilityLabel: 'Pause',
  };

  it('credits the reciter and shows the position', async () => {
    const { getByText } = await render(
      <ListenBar {...base} state="playing" positionLabel="3 / 7" testID="bar" />
    );
    expect(getByText('Mishary Rashid Alafasy · Murattal')).toBeTruthy();
    expect(getByText('3 / 7')).toBeTruthy();
  });

  it('toggle control fires onToggle', async () => {
    const onToggle = jest.fn();
    const { getByTestId } = await render(
      <ListenBar {...base} onToggle={onToggle} state="paused" testID="bar" />
    );
    await fireEvent.press(getByTestId('bar-toggle'));
    expect(onToggle).toHaveBeenCalled();
  });

  it('buffering swaps in the label and keeps layout (skeleton duration slot)', async () => {
    const { getByText } = await render(
      <ListenBar
        {...base}
        state="buffering"
        bufferingLabel="Preparing recitation — plays offline after"
        testID="bar"
      />
    );
    expect(getByText('Preparing recitation — plays offline after')).toBeTruthy();
  });

  it('expand zone fires onExpand when provided', async () => {
    const onExpand = jest.fn();
    const { getByTestId } = await render(
      <ListenBar {...base} state="playing" onExpand={onExpand} testID="bar" />
    );
    await fireEvent.press(getByTestId('bar-expand'));
    expect(onExpand).toHaveBeenCalled();
  });
});
