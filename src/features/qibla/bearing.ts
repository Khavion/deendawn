import { GeoCoordinates } from '../prayer-times/types';

/** Kaaba coordinates (CLAUDE.md acceptance criterion). */
export const KAABA = { latitude: 21.4225, longitude: 39.8262 } as const;

const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

/**
 * Great-circle initial bearing from `from` toward the Kaaba, degrees
 * clockwise from true north in [0, 360). Implemented independently and
 * verified against the adhan reference implementation in tests.
 */
export function qiblaBearing(from: GeoCoordinates): number {
  const phi1 = rad(from.latitude);
  const phi2 = rad(KAABA.latitude);
  const dLon = rad(KAABA.longitude - from.longitude);
  const y = Math.sin(dLon) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLon);
  return (deg(Math.atan2(y, x)) + 360) % 360;
}

/** Shortest signed angular difference a→b in (-180, 180]. */
export function angleDelta(a: number, b: number): number {
  let d = (b - a) % 360;
  if (d > 180) d -= 360;
  if (d <= -180) d += 360;
  return d;
}

/**
 * Circular exponential low-pass: smooths compass jitter without the 359→0
 * wraparound jump. `alpha` in (0,1]; higher follows the raw value faster.
 */
export function lowPassAngle(prev: number, next: number, alpha: number): number {
  return (prev + alpha * angleDelta(prev, next) + 360) % 360;
}

export interface RelativeQibla {
  /** Degrees the user must rotate; positive = clockwise (to the right). */
  turn: number;
  direction: 'left' | 'right' | 'ahead';
  aligned: boolean;
}

/** How far the device heading is from the qibla, for UI + accessibility. */
export function relativeQibla(bearing: number, heading: number, tolerance = 3): RelativeQibla {
  const turn = angleDelta(heading, bearing);
  const aligned = Math.abs(turn) <= tolerance;
  return {
    turn,
    aligned,
    direction: aligned ? 'ahead' : turn > 0 ? 'right' : 'left',
  };
}
