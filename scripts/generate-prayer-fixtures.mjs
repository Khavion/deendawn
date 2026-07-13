// Generates the committed prayer-time fixture matrix DIRECTLY from the adhan
// reference implementation (not through src/features/prayer-times), so wrapper
// bugs cannot bake into fixtures. Run once; regeneration requires a reason
// logged in docs/DECISIONS.md. Fixtures are flagged in docs/BLOCKERS.md for a
// one-time human spot-check against published timetables.
import { Coordinates, CalculationMethod, HighLatitudeRule, Madhab, PrayerTimes } from 'adhan';
import { writeFileSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = path.join(HERE, '..', 'src', 'features', 'prayer-times', 'fixtures');
const { cities, dates, highLatCities } = JSON.parse(
  readFileSync(path.join(FIXTURES_DIR, 'cities.json'), 'utf8')
);

const METHODS = [
  'MuslimWorldLeague',
  'Egyptian',
  'Karachi',
  'UmmAlQura',
  'Dubai',
  'MoonsightingCommittee',
  'NorthAmerica',
  'Kuwait',
  'Qatar',
  'Singapore',
  'Tehran',
  'Turkey',
];
const MADHABS = ['shafi', 'hanafi'];
const RULES = ['auto', 'middleofthenight', 'seventhofthenight', 'twilightangle'];
const PRAYERS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

const hhmm = (d, tz) =>
  new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: tz,
  }).format(d);

function computeReference(city, dateId, method, madhab, rule) {
  const [y, m, d] = dateId.split('-').map(Number);
  const coordinates = new Coordinates(city.latitude, city.longitude);
  const params = CalculationMethod[method]();
  params.madhab = madhab === 'hanafi' ? Madhab.Hanafi : Madhab.Shafi;
  params.highLatitudeRule = rule === 'auto' ? HighLatitudeRule.recommended(coordinates) : rule;
  const t = new PrayerTimes(coordinates, new Date(y, m - 1, d, 12), params);
  const entry = {
    city: city.id,
    date: dateId,
    method,
    madhab,
    highLatRule: rule,
    times: {},
    local: {},
  };
  for (const p of PRAYERS) {
    const valid = !Number.isNaN(t[p].getTime());
    entry.times[p] = valid ? t[p].toISOString() : null;
    entry.local[p] = valid ? hhmm(t[p], city.timeZone) : null;
  }
  return entry;
}

const fixtures = [];
// Main matrix: every city × date × method × madhab, high-lat rule 'auto'.
for (const city of cities)
  for (const date of dates)
    for (const method of METHODS)
      for (const madhab of MADHABS)
        fixtures.push(computeReference(city, date.id, method, madhab, 'auto'));

// High-latitude matrix: all four rules exercised where they matter.
for (const cityId of highLatCities) {
  const city = cities.find((c) => c.id === cityId);
  for (const date of dates)
    for (const method of ['MuslimWorldLeague', 'NorthAmerica'])
      for (const rule of RULES.filter((r) => r !== 'auto'))
        fixtures.push(computeReference(city, date.id, method, 'shafi', rule));
}

const out = {
  generator: 'scripts/generate-prayer-fixtures.mjs',
  adhanVersion: JSON.parse(
    readFileSync(path.join(HERE, '..', 'node_modules', 'adhan', 'package.json'), 'utf8')
  ).version,
  count: fixtures.length,
  fixtures,
};
writeFileSync(path.join(FIXTURES_DIR, 'prayer-fixtures.json'), JSON.stringify(out) + '\n');
console.log(`wrote ${fixtures.length} fixtures (adhan ${out.adhanVersion})`);
