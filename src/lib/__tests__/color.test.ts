/**
 * @jest-environment node
 */
import { parseColor, withAlpha } from '../color';

describe('withAlpha', () => {
  test('applies a stated alpha to a hex token', () => {
    expect(withAlpha('#C69B5F', 0.24)).toBe('rgba(198, 155, 95, 0.24)');
  });

  test('handles shorthand hex', () => {
    expect(withAlpha('#fff', 0.5)).toBe('rgba(255, 255, 255, 0.5)');
  });

  test('replaces (not multiplies) an existing alpha', () => {
    expect(withAlpha('rgba(198, 155, 95, 0.5)', 0.1)).toBe('rgba(198, 155, 95, 0.1)');
  });

  test('clamps alpha into [0, 1]', () => {
    expect(withAlpha('#000000', 2)).toBe('rgba(0, 0, 0, 1)');
    expect(withAlpha('#000000', -1)).toBe('rgba(0, 0, 0, 0)');
  });

  test('round-trips through parseColor', () => {
    const out = parseColor(withAlpha('#274D3D', 0.35));
    expect(out).toEqual({ r: 39, g: 77, b: 61, a: 0.35 });
  });
});
