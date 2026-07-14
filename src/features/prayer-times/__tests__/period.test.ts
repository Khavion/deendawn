import { currentPeriod, periodPrayer, periodWord, type PeriodTimes } from '../period';

const times: PeriodTimes = {
  fajr: new Date('2026-07-14T05:15:00'),
  sunrise: new Date('2026-07-14T06:31:00'),
  asr: new Date('2026-07-14T17:03:00'),
  maghrib: new Date('2026-07-14T20:24:00'),
  isha: new Date('2026-07-14T21:40:00'),
};
const at = (h: number, m: number) =>
  new Date(`2026-07-14T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`);

describe('currentPeriod', () => {
  it('maps each part of the day to the right sky period', () => {
    expect(currentPeriod(at(3, 0), times)).toBe('isha'); // pre-dawn night
    expect(currentPeriod(at(5, 30), times)).toBe('fajr'); // dawn (after fajr, before sunrise)
    expect(currentPeriod(at(7, 0), times)).toBe('day');
    expect(currentPeriod(at(13, 0), times)).toBe('day'); // midday, before asr
    expect(currentPeriod(at(17, 30), times)).toBe('asr'); // afternoon
    expect(currentPeriod(at(20, 30), times)).toBe('maghrib'); // dusk
    expect(currentPeriod(at(22, 0), times)).toBe('isha'); // night
  });

  it('is exclusive on the lower boundary (a prayer starts its own window)', () => {
    expect(currentPeriod(times.fajr, times)).toBe('fajr');
    expect(currentPeriod(times.isha, times)).toBe('isha');
  });

  it('falls through to night when boundary times are invalid (high latitude)', () => {
    const invalid: PeriodTimes = { ...times, fajr: new Date(NaN), sunrise: new Date(NaN) };
    expect(currentPeriod(at(4, 0), invalid)).toBe('day');
  });
});

describe('period lookups', () => {
  it('maps periods to their prayer and word', () => {
    expect(periodPrayer('fajr')).toBe('fajr');
    expect(periodPrayer('day')).toBe('dhuhr');
    expect(periodPrayer('maghrib')).toBe('maghrib');
    expect(periodWord('fajr')).toBe('dawn');
    expect(periodWord('isha')).toBe('night');
    expect(periodWord('asr')).toBe('afternoon');
  });
});
