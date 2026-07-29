import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, PixelRatio, useWindowDimensions } from 'react-native';

/**
 * Adaptive quality tier — the "sense the hardware and act accordingly" signal
 * (docs/RICH_DESIGN_SPEC.md). Rich effects render fully on `radiant`, simplify
 * on `smooth`, and fall back to flat/instant on `essential`. Reduce Motion
 * always forces `essential`.
 *
 * One provider owns the single AccessibilityInfo subscription and the window
 * dimensions (reactive — iPad windows resize); every `useDeviceTier()` call
 * reads shared state instead of registering its own native listener (there
 * were dozens: 13 components plus every Skeleton and every useHaptics).
 */
export type DeviceTier = 'radiant' | 'smooth' | 'essential';

export interface DeviceTierState {
  tier: DeviceTier;
  reduceMotion: boolean;
  /** Convenience: gradients render flat, motion is skipped. */
  flat: boolean;
}

function heuristicTier(shortest: number): DeviceTier {
  const density = PixelRatio.get();
  // 3x-density modern-sized phones → full richness; 2x mid → smooth; else lean.
  if (density >= 3 && shortest >= 380) return 'radiant';
  if (density >= 2 && shortest >= 340) return 'smooth';
  return 'essential';
}

const DeviceTierContext = createContext<DeviceTierState | null>(null);

export function DeviceTierProvider({ children }: { children: React.ReactNode }) {
  const { width, height } = useWindowDimensions();
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

  const shortest = Math.min(width, height);
  const value = useMemo<DeviceTierState>(() => {
    const tier: DeviceTier = reduceMotion ? 'essential' : heuristicTier(shortest);
    return { tier, reduceMotion, flat: tier === 'essential' };
  }, [reduceMotion, shortest]);

  return <DeviceTierContext.Provider value={value}>{children}</DeviceTierContext.Provider>;
}

export function useDeviceTier(): DeviceTierState {
  const ctx = useContext(DeviceTierContext);
  const { width, height } = useWindowDimensions();
  if (ctx) return ctx;
  // Provider-less fallback (component tests render screens bare): same
  // heuristic, no subscriptions, Reduce Motion assumed off.
  const tier = heuristicTier(Math.min(width, height));
  return { tier, reduceMotion: false, flat: tier === 'essential' };
}
