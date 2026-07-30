import { useWindowDimensions } from 'react-native';

/**
 * Live window signals for layouts that BRANCH on width (disc sizing, column
 * counts). Pure measure caps don't need this — apply the `measure` tokens as
 * static maxWidth styles instead. Always driven by useWindowDimensions so
 * iPad window resizing (Split View, windowed apps) re-renders correctly.
 */
export function useLayout() {
  const { width, height } = useWindowDimensions();
  return {
    width,
    height,
    /** Tablet-class width (either orientation) — never a cached device check. */
    wide: width >= 700,
  };
}
