import * as Location from 'expo-location';
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
  requestPermission: () => void;
}

const ALPHA = 0.25; // low-pass responsiveness
const MIN_INTERVAL_MS = 66; // ~15Hz UI updates

/** Compass heading via expo-location, smoothed and throttled for the UI. */
export function useHeading(): HeadingState {
  const [permission, setPermission] = useState<HeadingState['permission']>('undetermined');
  const [heading, setHeading] = useState<number | null>(null);
  const [trueNorth, setTrueNorth] = useState(false);
  const [accuracy, setAccuracy] = useState(0);
  const smoothed = useRef<number | null>(null);
  const lastEmit = useRef(0);
  const [requestNonce, setRequestNonce] = useState(0);

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
    requestPermission: () => setRequestNonce((n) => n + 1),
  };
}
