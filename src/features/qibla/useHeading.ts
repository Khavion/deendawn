import * as Location from 'expo-location';
import { Magnetometer } from 'expo-sensors';
import { useEffect, useRef, useState } from 'react';

import { lowPassAngle } from './bearing';

export interface HeadingState {
  /** Smoothed heading in degrees from north, or null before the first fix. */
  heading: number | null;
  /** True when the OS supplied true north (declination-corrected). */
  trueNorth: boolean;
  /** expo-location calibration level: 0 (none) … 3 (high). */
  accuracy: number;
  permission: 'undetermined' | 'granted' | 'denied';
  /**
   * Magnetometer hardware presence: false = no compass on this device (show
   * the explicit unavailable state, never a forever-"calibrating" dial);
   * null = still probing (treated as available).
   */
  available: boolean | null;
  requestPermission: () => void;
}

const ALPHA = 0.25; // low-pass responsiveness
const MIN_INTERVAL_MS = 66; // ~15Hz UI updates

/**
 * Compass heading via expo-location, smoothed and throttled for React state.
 * `onRaw` (optional) fires at FULL sensor rate with the smoothed heading —
 * for driving native-thread rotation (Reanimated) without re-rendering.
 */
export function useHeading(onRaw?: (smoothedDeg: number) => void): HeadingState {
  const [permission, setPermission] = useState<HeadingState['permission']>('undetermined');
  const [heading, setHeading] = useState<number | null>(null);
  const [trueNorth, setTrueNorth] = useState(false);
  const [accuracy, setAccuracy] = useState(0);
  const smoothed = useRef<number | null>(null);
  const onRawRef = useRef(onRaw);
  useEffect(() => {
    onRawRef.current = onRaw;
  }, [onRaw]);
  const lastEmit = useRef(0);
  const [requestNonce, setRequestNonce] = useState(0);
  const [available, setAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    Magnetometer.isAvailableAsync().then(
      (ok) => {
        if (!cancelled) setAvailable(ok);
      },
      // Probe failure ≠ missing hardware — stay optimistic (null).
      () => undefined
    );
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let sub: Location.LocationSubscription | null = null;
    let cancelled = false;

    (async () => {
      const current = await Location.getForegroundPermissionsAsync();
      let status = current.status;
      if (status !== 'granted' && (current.canAskAgain || requestNonce > 0)) {
        status = (await Location.requestForegroundPermissionsAsync()).status;
      }
      if (cancelled) return;
      setPermission(status === 'granted' ? 'granted' : 'denied');
      if (status !== 'granted') return;

      sub = await Location.watchHeadingAsync((h) => {
        const useTrue = h.trueHeading >= 0;
        const raw = useTrue ? h.trueHeading : h.magHeading;
        smoothed.current =
          smoothed.current === null ? raw : lowPassAngle(smoothed.current, raw, ALPHA);
        onRawRef.current?.(smoothed.current);
        const now = Date.now();
        if (now - lastEmit.current >= MIN_INTERVAL_MS) {
          lastEmit.current = now;
          setHeading(smoothed.current);
          setTrueNorth(useTrue);
          setAccuracy(h.accuracy);
        }
      });
    })();

    return () => {
      cancelled = true;
      sub?.remove();
    };
  }, [requestNonce]);

  return {
    heading,
    trueNorth,
    accuracy,
    permission,
    available,
    requestPermission: () => setRequestNonce((n) => n + 1),
  };
}
