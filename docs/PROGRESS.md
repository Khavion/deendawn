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

## Session 2026-07-12 (cont. 4) — simulator smoke run

Done: Maestro installed; e2e/smoke.yaml green twice on iPhone 17 sim (Today -> More -> Quran -> surah, id-based assertions — Maestro text matching vs RN accessibility labels is unreliable, use testIDs). Screenshots in docs/screens/. Background-refresh registration now availability-checked (no dev toast). Visual QA passed: Amiri Uthmani ligatures, RTL, countdown card, toggles.

## Session 2026-07-12 (cont. 5) — Phase 2 adopted + E1 localization

- PHASE_2_DIRECTIVE received from Zohaib (research-assistant authored); constitutional amendments explicitly confirmed by him in-session and applied verbatim (Rule 1 rewrite, Rule 1.5 generated-answers layer, Gates 7–9, stack additions). Directive archived at docs/PHASE_2_DIRECTIVE.md; epics E1–E11 merged into TODO; owner items in BLOCKERS (plain English); guard hook gained the Gate-8 locale-files exception (self-tested).
- E1 in flight: react-i18next + intl-pluralrules wired; en/ur/ar locale files (UR/AR @draft, Gate 8); all screens + tabs + notification content through t(); jsx-no-literals lint gate ON; language picker with bilingual RTL-restart flow; NotoNastaliqUrdu pinned + ThemedText Urdu family/leading swap; i18n jest suite (key parity, AR 6 plural forms, draft flags).
- E1 ACCEPTED 2026-07-13: EN/UR/AR verified on simulator with screenshots (docs/screens/locale-*.png); RTL layout confirmed (tab order, rows, highlighted state); Urdu in Nastaliq with compensated leading; Arabic localized dates; language switch round-trip EN->UR->AR->EN green via Maestro. Root-caused two real bugs on-device: React Compiler drops side-effectful useMemo (init moved to module scope, comment left) and i18next v26 sync-init needs initAsync:false.

## Session 2026-07-13 — E2 qibla compass

- Independent great-circle bearing implementation, verified to 0.01° against the adhan reference for 10 cities on all hemispheres; angle helpers (shortest delta, circular low-pass) unit-tested incl. 359→0 wraparound.
- useHeading hook: expo-location watchHeadingAsync, true-north preference with magnetic fallback, low-pass alpha 0.25, ~15Hz throttle, permission lifecycle + re-request.
- Screen: lapis needle + rotating rose on quiet ring; aligned state (success color + soft fill), ±3° haptic tick edge-triggered + one Success per session; magnetic-north and figure-8 calibration chips (ochre); privacy-honest permission state; city empty state; all copy i18n in en/ur/ar (@draft).
- 20 qibla tests incl. mocked heading-stream component tests (turn guidance right→aligned→left, haptic once-per-session, cleanup).
- expo-location plugin + when-in-use copy stating on-device-only use.

## Session 2026-07-13 (cont.) — E3 adhan sound options

- SoundKey extended (default/silent/clip/fullAdhan) through scheduler, prefs (defensive parse + setPrayerSound), service (clip filename + fullAdhan data flag — full adhan plays in-app on open-from-notification, banner with Stop, expo-audio playsInSilentMode).
- More screen: per-prayer sound picker with the iOS honesty copy in en/ur/ar; placeholder silent WAVs generated by scripts/generate-placeholder-sounds.mjs pending cleared recordings (BLOCKERS B); WAV-header duration test hard-gates <30s clips.
- 30 notification tests; FullAdhanPlayer component-tested (plays on flagged response, ignores plain taps, stop releases player).

## Session 2026-07-13 (cont. 2) — E4 hijri + Ramadan

- @umalqura/core (MIT) wrapped in src/features/hijri: toHijri/fromHijri with ±1 offset, Ramadan detection, key-date map (Ashura, Ramadan start, both Eids, Dhul-Hijjah 1–10, white days). Conversions verified against published Umm al-Qura anchors incl. 1 Ramadan 1447 = 2026-02-18; 12 unit tests.
- Scheduler: suhoor pre-Fajr reminders (suhoor-YYYY-MM-DD ids) inside the same 60-cap rolling plan, Ramadan-gated + offset-aware; 14 scheduler tests.
- UI: dual-date month grid + legend + persistent disclaimer (/calendar via More), hijri date line on Today, ochre Ramadan card (suhoor ends / iftar), settings rows (calendar, ±1 adjustment, reminder Off/20/30/45/60), i18n ×3, SCHOLAR_REVIEW rows added.
- Gotcha fixed: expo-asset needed as a direct dependency once bundled audio landed (Cannot find native module ExpoAsset).

## Session 2026-07-13 (cont. 3) — E5 tasbih

- Pure state module (tap/reset/target/label/history, 366-day rolling daily totals, defensive parsing) + screen with the spec haptic grammar (tick per count, Medium at 33-detents, Success on round completion, each paired with a ring-color flash), 33/99 targets, user-entered label only. 10 tests. Reached via More (tab layout revisited at E8 when Ask needs a slot).

## Session 2026-07-13 (cont. 4) — E6 zakat

- computeZakat pure module: assets − liabilities floored at 0, nisab = lower of available metal thresholds (85g gold / 595g silver — SCHOLAR-REVIEW flagged with the 2.5% rate), needPrices/belowNisab/due states, cent rounding, NaN/negative clamping. 6 math tests.
- Form screen: grouped inputs, live lapis result card, privacy note (user-entered prices only), ochre disclaimer; Arabic-Indic digits + both decimal separators parsed (escapes only — the guard hook blocked digit literals in code twice, correctly). 4 component tests incl. AR-locale long-value render.
- Route /zakat via More.

## Session 2026-07-13 (cont. 5) — E7 navigation feel

- enableScreens/enableFreeze + freezeOnBlur; reader ayah load deferred via InteractionManager (push stays clean on long surahs); native push retained (system easing + automatic Reduce Motion); no custom motion exists by design. Device-profiling item added to TESTPLAN.

## Session 2026-07-13 (cont. 6) — E8 Ask Tier A

- Router: intent detection (count/list/ruling incl. escaped Arabic patterns/topical), scaffolding-stripping term extraction, conservative engineering-authored synonym expansion, injection-safe OR-joined FTS, exact counts phrased as verifiable corpus facts, fixed ruling redirect (flagged SCHOLAR_REVIEW), fixed empty response.
- Eval harness: 64 fixtures GENERATED from the committed db (ground truth = corpus; regeneration requires DECISIONS entry) + router-internals tests = 72 green. This harness gates E9 per the directive.
- UI: 5th tab (Ask), terse serif count sentence + tappable [s:a] chips deep-linking into the reader, verse rows for topicals, ochre redirect card. i18n ×3 with AR count plurals across all 6 forms. Maestro flow green on sim (count + redirect paths, screenshots in docs/screens).
- Lesson reinforced: assumed 2:188 contains "bribe" in Pickthall — it does not; test now derives refs from the corpus (never assume religious-text facts).

## Session 2026-07-13 (cont. 7) — E9 Tier B core

- Full Rule-1.5 enforcement pipeline built pure + 26 tests green (see DECISIONS: E9 core-first sequencing). Gate 7 flag committed OFF with a do-not-flip comment. Native llama.rn/op-sqlite wiring deferred to a dedicated fresh session (dual-sqlite build risk + nothing validatable until model uploads).

## Session 2026-07-13 (cont. 8) — E10 corpus + thinker data

- Three works license-verified per-item on their Gutenberg pages (Public domain in the USA) and pinned: Claud Field's Confessions of Al-Ghazali (1909, #58977), F. Hadland Davis's Persian Mystics: Rumi (1907, #45159), Syed Nawab Ali's Teachings of Al-Ghazali (1920, #73140). Whinfield Masnavi not on Gutenberg — skipped rather than sourced loosely.
- Pipeline: gutenberg-txt format (marker + metadata + public-domain-license structural checks in verify), library.db build (works + ~1200-char paragraph sections + FTS, meta hashes) — 3 works / 308 sections; golden tests enforce license-log completeness, pre-1930 years, gutenberg-host allowlist, checksums.
- 16 thinker pages drafted (era/school/works/neutral key-idea one-liners) in a data file, Gate 9 flagged as a whole; UR/AR versions deferred to the same review cycle.

## Session 2026-07-13 (cont. 9) — E10b Library UI

- libraryDb opener (expo-asset -> Documents/SQLite copy, size-compared refresh on bundle updates) + repo (works/sections/FTS w/ injection-safe tokens) tested against the real committed library.db (5 tests).
- Screens: Library (thinker list + book FTS search + gate-9 pending-review banner), Thinker (era/school/key ideas/major works + read-in-app cards), WorkReader (serif sections, PD attribution line, section deep-links from search). Routes /library, /thinker/[key], /work/[id]; More row; i18n chrome ×3. Thinker content stays EN data pending gate 9 review.
- expo-file-system added (new File/Directory API).

## Session 2026-07-13 (cont. 10) — E11: About/attribution

- About screen renders the pipeline-generated attribution manifest (all 10 artifacts w/ licenses; Tanzil visible-attribution requirement now guarded by a test), the privacy promise (i18n ×3), version, and dev-only badges for placeholder content. /about via More.

## Session 2026-07-13 (cont. 11) — E11: Onboarding first-run flow

- Three-step onboarding (welcome → city → reminders): `onboarded.v1` kv flag, Today route redirects until set, city picked via the existing CityPickerModal (persists settings), reminders step calls ensurePermission(true) + rescheduleAll, skip path honored. i18n ×3, 3 RTL tests, Maestro e2e/onboarding.yaml drives the whole flow with clearState and asserts onboarding does NOT reappear on relaunch. Screenshots in docs/screens/onboarding-*.

## Session 2026-07-13 (cont. 12) — E11: Recitation streaming player

- Full expo-audio player: Listen bar on the surah screen (play/pause, progress clock + track, buffering state), background-audio mode + lock-screen metadata, per-reciter/surah resume positions (skip-first-10s/last-5s policy, cleared on finish, saved every 5s + on pause/unmount). Source rule: EXPO_PUBLIC_AUDIO_BASE_URL → R2 in production; unset release build hides the feature entirely; dev builds stream a synthesized tone from `npm run dev:audio` (localhost:8083, HTTP-range server) with a persistent "not recitation" badge. 21 unit/component tests + e2e/audio.yaml green against the live stream. UIBackgroundModes audio added; real recordings remain BLOCKERS 2 / gate 5.

## Session 2026-07-13 (cont. 13) — E11: Tip jar

- Tips screen (/tips via More): strictly support-development framing, options load cheapest-first, purchase → persisted thank-you, cancelled → back to options, restore, and — key part — an honest "Tips are not set up in this build yet" state because the RevenueCat key doesn't exist (BLOCKERS 1, plain-English signup steps added). Rule 3 enforced by a copy-audit test across en/ur/ar (charity/zakat/sadaqah framing fails the build; footnote must disclaim donation framing). react-native-purchases installed (pods repo-update needed); 11 new tests; e2e/tips.yaml green (scrollUntilVisible needs centerElement — logged in DECISIONS).

## Session 2026-07-13 (cont. 14) — E11: Offline E2E suite (release build)

- First Release-configuration build (BUILD SUCCEEDED, bundled JS) — also our first pre-TestFlight release verification. e2e/offline.yaml runs with Metro AND the dev audio server killed: onboarding from a wiped container, prayer times, Quran text, Ask exact counts, qibla, tasbih, zakat, hijri calendar, five offline cold starts, and the audio bar is asserted ABSENT in release (no configured source → no dead UI). Sim can't toggle airplane mode, so "no servers of any kind" is the documented proxy; true airplane-mode device pass added to TESTPLAN. Also: BLOCKERS item 2 updated with recitation-licensing research (Alafasy explicitly not free; EveryAyah NC-only vs our tip jar → recommend written-permission route; research prompt ready for Zohaib).

## Session 2026-07-13 (cont. 15) — E11: Store prep (drafts only, nothing submitted)

- fastlane/metadata drafted: name/subtitle/keywords (≤100 chars), full description (honest privacy framing), promotional text, reviewer notes (4.3 differentiation = Data Not Collected + offline-first + deterministic on-device Ask; 3.2.1 tip framing), privacy_answers_draft.md (Data Not Collected rationale + RevenueCat re-check note), copyright. support_url/privacy_url marked PENDING-HUMAN (Zohaib needs public pages — gate 2). READY FOR HUMAN SUBMIT checklist added to BLOCKERS: Apple keys are the single item between Zohaib and TestFlight on his phone.
- GATE: store metadata drafted; TestFlight upload + listing publication await Apple keys and Zohaib's go-ahead.

## Next: E9 native session (dedicated): op-sqlite static-libs FIRST + verify xcodebuild, then llama.rn, vectors.db, Tier B UI, Ask source filter. Design backlog: FlashList pass, Dynamic Type + RTL audits.

## Next: start here

1. Qibla epic: great-circle bearing (adhan Qibla()) + magnetometer heading (expo-sensors) + declination correction, calibration UX. Bearing unit tests vs known city bearings. Needs npx expo install expo-sensors expo-location, then prebuild + pod install + xcodebuild.
2. Tasbih/hijri/zakat cluster (pure logic + screens).
3. Audio (needs R2 dev set — blocked), tips (needs RevenueCat key — blocked), onboarding/about/attribution screens, offline E2E suite.
4. To put the app on Zohaib's phone: TestFlight internal needs the Apple keys (BLOCKERS #1) — prepare click-by-click walkthrough when he is ready.
