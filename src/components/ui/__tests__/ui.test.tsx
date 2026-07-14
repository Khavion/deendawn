import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { AppText, Button, Card, Divider, Screen } from '..';
import { fonts, palette } from '@/src/lib/theme/tokens';

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));

const VARIANTS = [
  'display',
  'displayAccent',
  'title',
  'subtitle',
  'reading',
  'body',
  'bodyStrong',
  'link',
  'eyebrow',
  'caption',
] as const;

describe('AppText', () => {
  it('renders every variant in one tree', async () => {
    const { getByText } = await render(
      <>
        {VARIANTS.map((v) => (
          <AppText key={v} variant={v}>
            {v}
          </AppText>
        ))}
      </>
    );
    for (const v of VARIANTS) {
      expect(getByText(v)).toBeTruthy();
    }
  });

  it('applies an explicit color override', async () => {
    const { getByText } = await render(<AppText color="#123456">Tinted</AppText>);
    expect(JSON.stringify(getByText('Tinted').props.style)).toContain('#123456');
  });

  it('carries the legacy faces: reading is serif, bodyStrong is semibold sans', async () => {
    const { getByText } = await render(
      <>
        <AppText variant="reading">reads</AppText>
        <AppText variant="bodyStrong">strong</AppText>
      </>
    );
    expect(JSON.stringify(getByText('reads').props.style)).toContain(fonts.serif);
    expect(JSON.stringify(getByText('strong').props.style)).toContain(fonts.sansSemiBold);
  });

  it('link defaults to the primary/accent color', async () => {
    // No ThemeProvider in this tree → useTokens resolves the light palette.
    const { getByText } = await render(<AppText variant="link">tap</AppText>);
    expect(JSON.stringify(getByText('tap').props.style)).toContain(palette.light.accent);
  });
});

describe('Button', () => {
  it('fires onPress and is a button', async () => {
    const onPress = jest.fn();
    const { getByText } = await render(<Button title="Begin" onPress={onPress} />);
    await fireEvent.press(getByText('Begin'));
    expect(onPress).toHaveBeenCalled();
  });

  it('does not fire when disabled', async () => {
    const onPress = jest.fn();
    const { getByText } = await render(<Button title="Nope" onPress={onPress} disabled />);
    await fireEvent.press(getByText('Nope'));
    expect(onPress).not.toHaveBeenCalled();
  });
});

describe('Card / Divider / Screen', () => {
  it('mount without error', async () => {
    const { getByText } = await render(
      <Screen>
        <Card>
          <AppText>In a card</AppText>
        </Card>
        <Divider />
      </Screen>
    );
    expect(getByText('In a card')).toBeTruthy();
  });
});
