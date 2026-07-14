import {
  buildWidgetSnapshot,
  isSnapshotStale,
  nextFromSnapshot,
  WIDGET_PRAYER_KEYS,
} from '../widgetData';
import type { DayPrayerTimes } from '../../prayer-times/types';

const day = (h: Record<string, string>): DayPrayerTimes =>
  ({
    fajr: new Date(h.fajr),
    sunrise: new Date(h.sunrise),
    dhuhr: new Date(h.dhuhr),
    asr: new Date(h.asr),
    maghrib: new Date(h.maghrib),
    isha: new Date(h.isha),
  }) as DayPrayerTimes;

const today = day({
  fajr: '2026-07-14T10:14:00Z',
  sunrise: '2026-07-14T11:30:00Z',
  dhuhr: '2026-07-14T18:28:00Z',
  asr: '2026-07-14T22:03:00Z',
  maghrib: '2026-07-15T01:24:00Z',
  isha: '2026-07-15T02:40:00Z',
});
const tomorrowFajr = new Date('2026-07-15T10:15:00Z');

describe('buildWidgetSnapshot', () => {
  it('emits the five daily prayers plus tomorrow fajr, chronological', () => {
    const s = buildWidgetSnapshot(today, tomorrowFajr, 'Houston', 'America/Chicago', new Date());
    expect(s.prayers).toHaveLength(6);
    expect(s.prayers.slice(0, 5).map((p) => p.key)).toEqual([...WIDGET_PRAYER_KEYS]);
    expect(s.prayers[5]).toEqual({ key: 'fajr', iso: tomorrowFajr.toISOString() });
    const times = s.prayers.map((p) => new Date(p.iso).getTime());
    expect(times).toEqual([...times].sort((a, b) => a - b));
    expect(s.cityLabel).toBe('Houston');
    expect(s.timeZone).toBe('America/Chicago');
  });
});

describe('nextFromSnapshot', () => {
  const s = buildWidgetSnapshot(today, tomorrowFajr, 'Houston', 'America/Chicago', new Date());

  it('picks the first prayer strictly after now', () => {
    expect(nextFromSnapshot(s, new Date('2026-07-14T12:00:00Z'))?.key).toBe('dhuhr');
    expect(nextFromSnapshot(s, new Date('2026-07-14T09:00:00Z'))?.key).toBe('fajr');
  });

  it('rolls over to tomorrow fajr after isha', () => {
    const next = nextFromSnapshot(s, new Date('2026-07-15T03:00:00Z'));
    expect(next?.key).toBe('fajr');
    expect(next?.iso).toBe(tomorrowFajr.toISOString());
  });

  it('treats an exactly-equal time as already passed (strictly after)', () => {
    expect(nextFromSnapshot(s, new Date('2026-07-14T18:28:00Z'))?.key).toBe('asr');
  });

  it('returns null and reads stale once fully exhausted', () => {
    const late = new Date('2026-07-16T00:00:00Z');
    expect(nextFromSnapshot(s, late)).toBeNull();
    expect(isSnapshotStale(s, late)).toBe(true);
    expect(isSnapshotStale(s, new Date('2026-07-14T12:00:00Z'))).toBe(false);
  });
});
