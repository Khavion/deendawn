/**
 * @jest-environment node
 */
import { buildWidgetTimeline } from '../timeline';
import { buildWidgetSnapshot } from '../widgetData';
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
  fajr: '2026-07-31T10:14:00Z',
  sunrise: '2026-07-31T11:30:00Z',
  dhuhr: '2026-07-31T18:28:00Z',
  asr: '2026-07-31T22:03:00Z',
  maghrib: '2026-08-01T01:24:00Z',
  isha: '2026-08-01T02:40:00Z',
});
const tomorrowFajr = new Date('2026-08-01T10:15:00Z');

const LABELS = (hijriLabel: string) => ({
  hijriLabel,
  prayerName: (k: string) => k.toUpperCase(),
  formatTime: (iso: string) => iso.slice(11, 16),
});

describe('buildWidgetTimeline', () => {
  it('emits one entry per remaining prayer boundary, chained', () => {
    const now = new Date('2026-07-31T12:00:00Z');
    const snap = buildWidgetSnapshot(today, tomorrowFajr, 'Houston', 'America/Chicago', now);
    const entries = buildWidgetTimeline(snap, LABELS('17 Safar 1448'), now);
    // Remaining: dhuhr, asr, maghrib, isha, tomorrow fajr.
    expect(entries.map((e) => e.props.prayerKey)).toEqual([
      'dhuhr',
      'asr',
      'maghrib',
      'isha',
      'fajr',
    ]);
    expect(entries[0].date).toEqual(now);
    // Each entry starts when the previous prayer fires.
    expect(entries[1].date.toISOString()).toBe('2026-07-31T18:28:00.000Z');
    expect(entries[4].props.prayerIso).toBe(tomorrowFajr.toISOString());
    expect(entries[0].props.strip).toHaveLength(5);
    expect(entries[0].props.strip[0]).toMatchObject({ key: 'fajr', name: 'FAJR', time: '10:14' });
    expect(entries[0].props.prayerName).toBe('DHUHR');
    expect(entries[0].props.hijriLabel).toBe('17 Safar 1448');
  });

  it('high latitude: skipped invalid prayers never produce entries', () => {
    const stockholm = day({
      fajr: 'invalid',
      sunrise: '2026-06-21T01:30:00Z',
      dhuhr: '2026-06-21T10:52:00Z',
      asr: '2026-06-21T15:20:00Z',
      maghrib: '2026-06-21T20:08:00Z',
      isha: 'invalid',
    });
    const now = new Date('2026-06-21T09:00:00Z');
    const snap = buildWidgetSnapshot(stockholm, new Date('2026-06-22T00:45:00Z'), 'Stockholm', 'Europe/Stockholm', now);
    const entries = buildWidgetTimeline(snap, LABELS('6 Muharram 1448'), now);
    expect(entries.map((e) => e.props.prayerKey)).toEqual(['dhuhr', 'asr', 'maghrib', 'fajr']);
  });

  it('after isha only tomorrow fajr remains (midnight-crossing safe)', () => {
    const now = new Date('2026-08-01T03:00:00Z');
    const snap = buildWidgetSnapshot(today, tomorrowFajr, 'Houston', 'America/Chicago', now);
    const entries = buildWidgetTimeline(snap, LABELS('18 Safar 1448'), now);
    expect(entries).toHaveLength(1);
    expect(entries[0].props.prayerKey).toBe('fajr');
  });
});
