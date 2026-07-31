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

/**
 * Alignment with hysteresis (handoff gap 17): enter at ±3°, exit only past
 * ±5°, so the celebration never flutters at the boundary and the detent
 * re-arms only after a real departure.
 */
export function alignedWithHysteresis(
  wasAligned: boolean,
  turn: number,
  enter = 3,
  exit = 5
): boolean {
  const abs = Math.abs(turn);
  return wasAligned ? abs <= exit : abs <= enter;
}

const EARTH_RADIUS_KM = 6371;

/** Great-circle distance from `from` to the Kaaba, in km (haversine). */
export function distanceToKaabaKm(from: GeoCoordinates): number {
  const phi1 = rad(from.latitude);
  const phi2 = rad(KAABA.latitude);
  const dPhi = rad(KAABA.latitude - from.latitude);
  const dLon = rad(KAABA.longitude - from.longitude);
  const a =
    Math.sin(dPhi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

export type CompassPoint = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';

/** Nearest 8-point compass word for a bearing (no-compass guidance text). */
export function compassPoint(bearing: number): CompassPoint {
  const points: CompassPoint[] = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];
  return points[Math.round((((bearing % 360) + 360) % 360) / 45) % 8];
}
