import { render } from '@testing-library/react-native';
import React from 'react';

import { Marker } from '../Marker';
import { palette } from '@/src/lib/theme/tokens';

describe('Marker', () => {
  it('renders a filled rotated square in the tone color', async () => {
    const view = await render(<Marker size={9} tone="ochre" />);
    const style = JSON.stringify(view.toJSON());
    expect(style).toContain('"width":9');
    expect(style).toContain(palette.light.ochre);
    expect(style).toContain('45deg');
  });

  it('outline variant draws a border instead of a fill', async () => {
    const view = await render(<Marker variant="outline" tone="border" />);
    const style = JSON.stringify(view.toJSON());
    expect(style).toContain('"borderWidth":1');
    expect(style).toContain(palette.light.border);
    expect(style).not.toContain('backgroundColor');
  });

  it('accepts an explicit color override (onFeatured contexts)', async () => {
    const view = await render(<Marker color="#ABCDEF" />);
    expect(JSON.stringify(view.toJSON())).toContain('#ABCDEF');
  });

  it('is hidden from the accessibility tree (decorative)', async () => {
    const view = await render(<Marker />);
    const json = JSON.stringify(view.toJSON());
    expect(json).toContain('"accessibilityElementsHidden":true');
    expect(json).toContain('"importantForAccessibility":"no"');
  });
});
