/* global jest */
// Reanimated 4 under Jest: mock the worklets runtime AND reanimated itself
// (each package ships its own mock; worklets' isn't exposed at the root).
// Animated components render as plain views; shared values are plain objects.
jest.mock('react-native-worklets', () => require('react-native-worklets/lib/module/mock'));
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

// Global i18n bootstrap for component tests: English, initialized once.
jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageTag: 'en-US', languageCode: 'en' }],
}));
require('./src/lib/i18n').initI18n('en');

// Skia under Jest: draw nothing, keep the component tree shape. The official
// web mock needs CanvasKit; a tiny manual mock is enough for our components
// (ProgressRing, celebration bloom, dial ray) — geometry math is unit-tested
// separately where it matters.
jest.mock('@shopify/react-native-skia', () => {
  const React = require('react');
  const { View } = require('react-native');
  const Noop = ({ children, ...props }) =>
    React.createElement(View, { testID: props.testID }, children);
  const path = () => ({
    addArc: () => {},
    copy: () => path(),
    op: () => path(),
  });
  return {
    Canvas: Noop,
    Path: () => null,
    Group: Noop,
    Skia: {
      Path: { Make: path },
      PathBuilder: {
        Make: () => {
          const b = { addArc: () => b, detach: () => path() };
          return b;
        },
      },
      XYWHRect: (x, y, width, height) => ({ x, y, width, height }),
      PathEffect: { MakeDash: () => null },
    },
  };
});
