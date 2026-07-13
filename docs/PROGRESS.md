# PROGRESS — DeenDawn

## Session 2026-07-12 (bootstrap)

Plan:

1. Scaffold Expo SDK 54 (TS strict, expo-router) into repo; add jest-expo + RTL + prettier.
2. Seed docs/, folder layout, .claude/settings.json permissions, PreToolUse guard hooks.
3. Commit `chore: bootstrap DeenDawn`.
4. Start content-pipeline epic: sources.json (pinned Tanzil URLs), fetch/verify/build scripts, content.lock, golden tests.

Done:

- Bootstrap committed (`chore: bootstrap DeenDawn`): SDK 54 scaffold, TS strict, jest-expo + RTL, prettier/eslint with NO-AI-ZONE exemptions, guard hooks, seeded docs.
- Content pipeline epic complete: sources pinned (Tanzil Uthmani txt-2, Pickthall DEV translation, quran-data.xml), fetch/pin/verify/build scripts, content.lock with spot + concat hashes, quran.db (5.3 MB) + attribution.json emitted, 11 golden Jest tests green. All commit gates green.
- Next: prayer-times epic (adhan engine wrapper + fixture matrix).

## Session 2026-07-12 (cont.) — prayer-times epic

Plan:

1. Engine wrapper (types/methods/engine/format) over adhan 4.4.4: all 12 methods, madhab toggle, high-lat auto via recommended() + manual override, locale default ISNA(US)/MWL.
2. Fixture generator using adhan DIRECTLY (reference impl, not the wrapper) → committed JSON matrix: 8 cities × 8 dates (US+EU DST pairs, solstices, equinox, Ramadan window) × 12 methods × 2 madhabs, + dedicated high-lat rule matrix; instants + per-city-zone local HH:mm.
3. Jest: fixture matrix to-the-minute, defaults, next-prayer (midnight rollover), madhab/high-lat behavioral tests.
4. Gates green → commit + push. BLOCKERS entry: human spot-check of fixtures vs published timetables.

Done:

- Prayer engine wrapper complete: computeDayTimes (all 12 methods, madhab, high-lat auto/override), nextPrayer with midnight rollover + invalid-time skipping, locale defaults (ISNA US / MWL), zone-aware formatting.
- 1,680-fixture reference matrix committed + 18 engine tests; 29 tests green repo-wide; all gates green.
- Manual-city fallback: bundled 135-city offline dataset (curated geographic facts, cross-checked against verified fixture-city coords in tests) + ranked diacritic-folding search. 39 tests green repo-wide.
- Remaining in epic: Today screen UI (needs user-settings store on expo-sqlite user db + tab scaffold replacement) — top task for next session.

## Session 2026-07-12 (cont. 2) — app shell, Today screen, notifications

Zohaib directives this session (persisted to memory + CLAUDE.md): plain-English communication only; research autonomously; keep building without pausing until the app is testable by him.

Done:

- User-data KV store on expo-sqlite (`src/lib/kvStore.ts`) with injectable memory impl for tests; settings store (location/method/madhab/high-lat) with defensive parsing + React context.
- Replaced template with DeenDawn shell: Today / Quran / Qibla / More tabs, green theme, app identity (name DeenDawn, slug deendawn, bundle id com.khavion.deendawn — initial selection, change is gated).
- Today screen: next-prayer countdown card, six daily times with next highlighted, city header, welcome empty state -> offline city picker (modal, ranked search). Component-tested (RTL v14 async API).
- More screen: location/method/madhab/high-lat pickers + per-prayer adhan notification toggles with permission request; silent-mode/Focus caveat text.
- Notifications epic: pure rolling scheduler (8 days, cap 60/64, deterministic ids, minimal diff) + expo-notifications service (idempotent rescheduleAll, foreground handler, time-sensitive alerts) + reschedule triggers (mount, settings change, foreground, notification fire, 12h background task). 26 notification tests incl. mocked-OS service tests.
- iOS native build green via prebuild + xcodebuild (first full compile of the app). ios/ stays gitignored (regenerated on demand).
- 75 tests green repo-wide; all gates green.

## Session 2026-07-12 (cont. 3) — Quran reader

Done:

- Amiri Quran font (SIL OFL 1.1) pinned as a content-pipeline artifact (Amiri-1.003.zip from aliftype GitHub releases, sha in content.lock); build extracts AmiriQuran.ttf + OFL.txt into assets/fonts. Loaded at runtime via useFonts.
- metro.config.js bundles .db as asset; quran.db opens read-only via SQLiteProvider assetSource at root.
- Quran repo (surahs/ayahs/FTS search/share text) behind a sync db interface — node tests run the SAME queries against the REAL committed quran.db via better-sqlite3.
- TS Arabic query folding parity-tested byte-identical to the pipeline-built FTS index (no Arabic authored: source rows normalized and compared to derived column).
- Screens: surah list (114, Arabic names in Amiri, search bar switching to FTS results with ayah deep-links, continue-reading chip), surah reader (RTL Uthmani text, translation toggle persisted + DEV badge, bookmarks, share with citation, last-read tracking via viewability).
- 17 quran tests; repo-wide suite green.

## Next: start here

1. Qibla epic: great-circle bearing (adhan Qibla()) + magnetometer heading (expo-sensors) + declination correction (expo-location true heading), calibration UX. Bearing unit tests vs known city bearings.
2. Simulator smoke run + screenshots into docs/screens/ for Zohaib (Today, Quran list, surah view, More).
3. Then tasbih/hijri/zakat cluster (pure logic + small screens), then audio (needs R2 dev set — still blocked), tips, onboarding polish.
