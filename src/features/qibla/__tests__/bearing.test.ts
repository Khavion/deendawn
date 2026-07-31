/**
 * @jest-environment node
 */
import { Coordinates, Qibla } from 'adhan';

import { angleDelta, KAABA, lowPassAngle, qiblaBearing, relativeQibla } from '../bearing';
import { CITIES } from '../../settings/cities';

describe('qiblaBearing', () => {
  // Cities on both hemispheres (N/S and E/W of the Kaaba).
  const SAMPLE = [
    'nyc-us', // NW hemisphere
    'houston-us',
    'london-gb',
    'stockholm-se',
    'karachi-pk', // east of Kaaba
    'jakarta-id', // SE hemisphere
    'sydney-au', // far SE
    'johannesburg-za', // south
    'sao-paulo-br', // SW hemisphere
    'tokyo-jp',
  ];

  test.each(SAMPLE)('%s matches the adhan reference implementation to 0.01°', (id) => {
    const city = CITIES.find((c) => c.id === id)!;
    expect(city).toBeDefined();
    const ours = qiblaBearing({ latitude: city.latitude, longitude: city.longitude });
    const reference = Qibla(new Coordinates(city.latitude, city.longitude));
    expect(Math.abs(angleDelta(reference, ours))).toBeLessThan(0.01);
  });

  test('every bundled city yields a bearing in [0, 360)', () => {
    for (const c of CITIES) {
      const b = qiblaBearing({ latitude: c.latitude, longitude: c.longitude });
      expect(b).toBeGreaterThanOrEqual(0);
      expect(b).toBeLessThan(360);
    }
  });

  test('due south of the Kaaba the bearing is north (~0°), due north it is south (~180°)', () => {
    expect(
      Math.abs(angleDelta(qiblaBearing({ latitude: 0, longitude: KAABA.longitude }), 0))
    ).toBeLessThan(0.5);
    expect(
      Math.abs(angleDelta(qiblaBearing({ latitude: 45, longitude: KAABA.longitude }), 180))
    ).toBeLessThan(0.5);
  });
});

describe('angle helpers', () => {
  test('angleDelta shortest paths incl. wraparound', () => {
    expect(angleDelta(350, 10)).toBe(20);
    expect(angleDelta(10, 350)).toBe(-20);
    expect(angleDelta(0, 180)).toBe(180);
    expect(angleDelta(90, 90)).toBe(0);
  });

  test('lowPassAngle smooths across the 359→0 boundary without spinning the long way', () => {
    const smoothed = lowPassAngle(359, 1, 0.5);
    expect(smoothed).toBeCloseTo(0, 5);
    // Never takes the 358° detour:
    expect(Math.abs(angleDelta(359, smoothed))).toBeLessThan(2);
  });

  test('relativeQibla direction + alignment window', () => {
    expect(relativeQibla(100, 100)).toMatchObject({ aligned: true, direction: 'ahead' });
    expect(relativeQibla(100, 97.5)).toMatchObject({ aligned: true });
    expect(relativeQibla(100, 90)).toMatchObject({ aligned: false, direction: 'right' });
    expect(relativeQibla(100, 110)).toMatchObject({ aligned: false, direction: 'left' });
    // Wraparound: heading 350, qibla 10 -> turn +20 (right)
    expect(relativeQibla(10, 350)).toMatchObject({ direction: 'right' });
  });
});

describe('handoff additions', () => {
  const { alignedWithHysteresis, distanceToKaabaKm, compassPoint } = require('../bearing');

  test('hysteresis: enter at ±3, exit only past ±5', () => {
    expect(alignedWithHysteresis(false, 2.9)).toBe(true);
    expect(alignedWithHysteresis(false, 4)).toBe(false);
    expect(alignedWithHysteresis(true, 4)).toBe(true); // holds inside exit band
    expect(alignedWithHysteresis(true, 5.1)).toBe(false); // re-arms
    expect(alignedWithHysteresis(true, -4.5)).toBe(true);
  });

  test('distance to Kaaba matches known city figures', () => {
    // Lahore → Makkah ≈ 3,600 km great-circle (the handoff's example rounds
    // to 3,620); zero at the Kaaba itself.
    const lahore = distanceToKaabaKm({ latitude: 31.5204, longitude: 74.3587 });
    expect(lahore).toBeGreaterThan(3550);
    expect(lahore).toBeLessThan(3650);
    const makkahLocal = distanceToKaabaKm({ latitude: 21.4225, longitude: 39.8262 });
    expect(makkahLocal).toBeCloseTo(0, 5);
  });

  test('compassPoint maps bearings to 8-point words incl. wraparound', () => {
    expect(compassPoint(0)).toBe('n');
    expect(compassPoint(261)).toBe('w');
    expect(compassPoint(226)).toBe('sw');
    expect(compassPoint(359)).toBe('n');
    expect(compassPoint(292.6)).toBe('nw');
  });
});
