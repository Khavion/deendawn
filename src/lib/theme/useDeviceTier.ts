import { useEffect, useState } from 'react';
import { AccessibilityInfo, Dimensions, PixelRatio } from 'react-native';

/**
 * Adaptive quality tier — the "sense the hardware and act accordingly" signal
 * (docs/RICH_DESIGN_SPEC.md). Rich effects render fully on `radiant`, simplify
 * on `smooth`, and fall back to flat/instant on `essential`. Reduce Motion
 * always forces `essential`.
 *
 * This is a core-RN heuristic (screen density + size + Reduce Motion) so it
 * needs no native module; expo-device / Low-Power-Mode can refine it later.
 */
export type DeviceTier = 'radiant' | 'smooth' | 'essential';

export interface DeviceTierState {
  tier: DeviceTier;
  reduceMotion: boolean;
  /** Convenience: gradients render flat, motion is skipped. */
  flat: boolean;
}

function heuristicTier(): DeviceTier {
  const { width, height } = Dimensions.get('window');
  const shortest = Math.min(width, height);
  const density = PixelRatio.get();
  // 3x-density modern-sized phones → full richness; 2x mid → smooth; else lean.
  if (density >= 3 && shortest >= 380) return 'radiant';
  if (density >= 2 && shortest >= 340) return 'smooth';
  return 'essential';
}

export function useDeviceTier(): DeviceTierState {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      if (active) setReduceMotion(v);
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (v) =>
      setReduceMotion(v)
    );
    return () => {
      active = false;
      sub?.remove?.();
    };
  }, []);

  const tier: DeviceTier = reduceMotion ? 'essential' : heuristicTier();
  return { tier, reduceMotion, flat: tier === 'essential' };
}
