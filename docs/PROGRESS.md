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

## Next session: start here

1. `src/lib/userDb.ts` — expo-sqlite user-data db (settings, bookmarks, tasbih history tables), thin repository with pure logic testable in node.
2. Replace template tab screens with DeenDawn tabs (Today / Quran / Qibla / More); Today screen: next-prayer countdown + day times from engine, empty state when no location set (manual city picker sheet using searchCities).
3. Then epic 3 (notification scheduler math as pure tested functions).
