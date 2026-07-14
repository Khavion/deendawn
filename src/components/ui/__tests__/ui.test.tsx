import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { AppText, Button, Card, Divider, Screen } from '..';

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));

describe('AppText', () => {
  it('renders every variant in one tree', async () => {
    const { getByText } = await render(
      <>
        <AppText variant="display">display</AppText>
        <AppText variant="displayAccent">displayAccent</AppText>
        <AppText variant="title">title</AppText>
        <AppText variant="body">body</AppText>
        <AppText variant="eyebrow">eyebrow</AppText>
        <AppText variant="caption">caption</AppText>
      </>
    );
    for (const label of ['display', 'displayAccent', 'title', 'body', 'eyebrow', 'caption']) {
      expect(getByText(label)).toBeTruthy();
    }
  });

  it('applies an explicit color override', async () => {
    const { getByText } = await render(<AppText color="#123456">Tinted</AppText>);
    expect(JSON.stringify(getByText('Tinted').props.style)).toContain('#123456');
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
