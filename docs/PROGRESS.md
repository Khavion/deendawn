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

## Session 2026-07-13 (cont. 16) — E9 native stack lands

- op-sqlite 17.1.2 (+sqliteVec) broke the SDK 54 precompiled React core at link time → RN now builds from source (plugins/withRNFromSource.js), which surfaced the known fmt-11/Apple-Clang-21 consteval breakage → fixed by compiling the fmt pod as C++17 AFTER react_native_post_install (plugins/withFmtConstevalFix.js). llama.rn 0.12.6 then landed with zero extra patches. Full stack builds; smoke/onboarding/audio flows green on the new binary. Clean builds now ~20 min (from-source) until SDK 56.
- VectorStore (memory + sqlite-vec impls, 384-dim, rowid=ayahId, vectors.db separate from quran.db), llamaRuntime adapter for the tested LlmRuntime contract, TierBCard download/manage UI (gate-7 invisible; all states tested), ask.tierb i18n ×3. 333 tests green.

## Session 2026-07-13 (cont. 17) — Ask cross-source library filter (closes E10 remainder)

- Ask gains a Quran/Books source toggle: Books searches the philosopher library's FTS sections with the same Tier A discipline (deterministic only, ruling queries still get the fixed scholar redirect, no synonym expansion on translated literary text). Results show work title + match-centered snippet and deep-link into the work reader at the exact section. askLibrary + snippet windowing unit-tested against the real committed library.db; Maestro ask flow extended and green; i18n ×3. 339 tests green.

## Session 2026-07-13 (cont. 18) — FlashList scroll pass + Maestro hang fix

- All 5 lists moved FlatList->FlashList v2 (JS-only, no native rebuild); verified live on a freshly-rebooted sim (onboarding/smoke/ask/libcheck all green, 339 unit tests green).
- Diagnosed the recurring Maestro "2-hour hang": stale XCUITest accessibility service after ~16.5h sim uptime (viewHierarchy -> HTTP 500 kAXErrorInvalidUIElement -> failure-screenshot call hangs the JVM). App itself was always healthy. Fix = reboot sim; process fix = all Maestro runs now foreground-bounded with a watchdog (never unbounded until-loops). Details in DECISIONS.

## Session 2026-07-13 (cont. 19) — Accessibility audits (Dynamic Type + RTL)

- Both audits passed with NO code changes. Dynamic Type at accessibility-extra-large: Today/Ask-toggle/Tips/Zakat all reflow cleanly (1.4x cap + flex). RTL/Arabic: the new Ask source toggle and surah audio bar mirror correctly (play button flips right, dev badge right-aligned, English translation stays LTR), plus Today/More/bilingual-restart-dialog. Switched back to English after. Maestro RTL selector gotchas recorded in DECISIONS.
- Also: diagnosed + fixed the recurring Maestro "hang" (stale XCUITest a11y service after ~16.5h sim uptime -> viewHierarchy 500 kAXError -> screenshot call wedges the JVM); every Maestro run is now foreground-bounded with a 120-240s watchdog.

## Session 2026-07-14 (cont. 2) — Android emulator: app running for owner testing

- Owner has no Apple keys yet and asked to test on Android. Set up the Android toolchain (SDK 35 + build-tools + arm64 system image + NDK 27, JBR 21 for Gradle), created the deendawn_pixel AVD, and got DeenDawn building + running on the emulator. First Android build surfaced + fixed a real portability bug (hyphens illegal in Android resource names → renamed placeholder sounds to underscores; committed) and set android.package=com.khavion.deendawn. assembleDebug green in 5m34s incl. llama.cpp native compile; app installed + launched, Metro-connected, no crashes. Verified on Android via Maestro: onboarding flow 19/19 (incl. relaunch persistence), Today (correct Houston prayer engine), Quran reader (Amiri Uthmani RTL intact), qibla — all cross-platform. Reopen instructions in docs/ANDROID.md. (Note: iOS tab labels are "X, tab, N of 5"; Android tabs match on plain text — use platform-appropriate selectors in cross-platform e2e.)

## Session 2026-07-14 (cont.) — Research follow-ups: reciter email, download signing, tajweed, widget

- Acted on the pre-launch research across four fronts (owner picked "all"): (1) reciter permission email drafted (docs/RECITER_OUTREACH.md) to unblock the recitation-audio gap; (2) Ed25519 signed-manifest verifier (tweetnacl, 10 tests) for authenticated post-launch model updates; (3) TAJWEED COLOR-CODING — regenerated cpfair/quran-tajweed (CC BY 4.0) annotations against our own text via their classifier (their precomputed offsets mis-anchored 2.58%), 0 mismatches across 6236 ayahs under a golden test, reader renders nested-Text color runs with Arabic shaping preserved (verified on-device), ships OFF behind **DEV** + scholar gate; (4) prayer widget — app-side data layer built + tested, full native SwiftUI package staged in docs/WIDGET.md (device-gated). 376 tests green throughout.

## Session 2026-07-14 — Dual-SQLite collapse (research Rec #1): op-sqlite out, precompiled RN back

- Acted on the pre-launch research's #1 recommendation. Confirmed SDK 54 expo-sqlite bundles sqlite-vec (vec.xcframework) + FTS5; ported the Tier B vector store to expo-sqlite's `bundledExtensions['sqlite-vec']` + `loadExtensionAsync`, removed `@op-engineering/op-sqlite`, and DELETED both native-build plugins (`withRNFromSource.js`, `withFmtConstevalFix.js`). Precompiled RN restored — llama.rn links cleanly against the prebuilt core; clean iOS build back to ~2.4 min (was 15-25 min). 349 tests green, TSC clean, smoke E2E green on the new binary. `withSQLiteVecExtension` flag left OFF (vec-framework search-path wrinkle) until the on-device Tier B session — harmless since the vector store is gated + physical-device-only. Docs (AUDIT §2/§5/§9, DECISIONS) updated.

## Session 2026-07-13 (cont. 20) — Tier B dormant wiring (gate-7 invisible)

- Pure `tierbController` (selectArtifacts by device tier, formatBytes, aggregateDownloadState, initialControllerState) wires the tested pieces (deviceTier + downloadManager + model.lock) into the {state, sizeLabel} the TierBCard needs — no native imports. TierBCard now rendered at the bottom of More, self-gated on TIER_B_ENABLED so it shows nothing today; when models land + gate flips it correctly reads `blocked: pendingUpload` until then. 14 controller tests (incl. an explicit "ships inert / never idle while PENDING-UPLOAD" guard); 349 tests green; smoke over the modified More green.

## Next: E9 is now fully wired but model-blocked (BLOCKERS A: upload Qwen3 + MiniLM + generate ayah-embeddings). The app is feature-complete for TestFlight pending human gates (Apple keys #1, recordings #2, UR/AR review #8, scholar queue #5/7/9).

## Next: start here

1. Qibla epic: great-circle bearing (adhan Qibla()) + magnetometer heading (expo-sensors) + declination correction, calibration UX. Bearing unit tests vs known city bearings. Needs npx expo install expo-sensors expo-location, then prebuild + pod install + xcodebuild.
2. Tasbih/hijri/zakat cluster (pure logic + screens).
3. Audio (needs R2 dev set — blocked), tips (needs RevenueCat key — blocked), onboarding/about/attribution screens, offline E2E suite.
4. To put the app on Zohaib's phone: TestFlight internal needs the Apple keys (BLOCKERS #1) — prepare click-by-click walkthrough when he is ready.

## Session 2026-07-14 (cont.) — ThemedText → AppText migration

Plan:

1. Map the 7 ThemedText types to AppText variants; add the 4 carry-over faces (bodyStrong/reading/subtitle/link) to latinType so the swap is non-regressive.
2. Scripted swap across all 19 feature screens; hand-fix dynamic `type={…}` props + the one lightColor/darkColor badge.
3. Retire ThemedText: migrate the dead collapsible, delete themed-text.tsx, update docs.

Done:

- 3 commits: (1) `feat(ui): add subtitle/reading/bodyStrong/link variants`, (2) `refactor(ui): migrate all 19 feature screens ThemedText -> AppText`, (3) `refactor(ui): retire ThemedText`. AppText is now the single Latin text primitive; components/themed-text.tsx deleted.
- `serifBody → reading` preserved the Newsreader serif for translations/long-form; verified live on iOS (Al-Fatiha translation in serif, Arabic Amiri pixel-identical; Today next-prayer row correctly bold via dynamic bodyStrong).
- Gates green: tsc clean, expo lint 0 errors, 392 tests (46 suites). DECISIONS.md logged.
- Next: resume the operating loop from TODO.md (device-pass items + owner-gated: Apple keys, reciter audio, scholar sign-offs).

## Session 2026-07-14 (cont.) — screen-reader accessibility pass

Plan:

1. Tag Arabic text with accessibilityLanguage so VoiceOver reads it as Arabic.
2. Give icon-only controls accessible names; hide decorative icons.
3. Announce selected states + a live tasbih counter value.

Done:

- 3 commits (a11y): Arabic language tagging (ayah + surah name, db-guarded); accessible names (IconSymbol hidden globally, bookmark + calendar-arrow labels, en/ur/ar keys); selected states (settings pickers, tasbih targets) + live tasbih counter value (name/value split).
- Closes the last accessibility item (audit v2 §9); on-device VoiceOver/TalkBack speech verification added to TESTPLAN device pass. Gates green: tsc, expo lint 0 errors, 393 tests. DECISIONS/DESIGN/AUDIT/TESTPLAN updated.
- Next: resume operating loop — remaining autonomous polish (e.g. verse-row grouping, FlashList long-surah perf measurement) or owner-gated items.

## Session 2026-07-21 — Perpetual mandate begins · Cycle 1: TestFlight near-one-click

Plan (near-term mandate item (a) — make the TestFlight path near-one-click + rank the Apple keys #1 for the owner):

1. Add `eas.json` (development / preview / production build profiles + a headless, still-GATED `submit.production.ios` referencing the ASC API key via env), per current SDK 54 EAS docs.
2. Round out `app.json` for submission (ios.buildNumber, android.versionCode baseline); leave gated/locked brand + bundle config untouched.
3. Rewrite `docs/BLOCKERS.md` with the mandated ranked "WHAT NEEDS YOU" header — Apple Developer account + App Store Connect API key as #1, written as a full plain-English click-by-click; demote weeks-away AI-model upload below testing-unlock items; refresh the stale 324 test count.
4. Log EAS/versioning decisions in DECISIONS.md; keep gates green (tsc, lint, affected jest, checksum); print the GATE line and roll straight into Cycle 2 (Rich design).

Done:

- `eas.json` created (repo had none): `development` (dev-client + `ios.simulator:true` → no-Apple-credentials simulator build), `preview` (internal), `production` (store + `autoIncrement`); `appVersionSource: remote` (EAS owns build numbers — correct since `/ios` `/android` are gitignored/prebuilt). `submit.production.ios` prepared with an honest `ascAppId` placeholder; the API key stays out of the repo (EAS reads `EXPO_ASC_*` env). Chose remote versioning over adding buildNumber/versionCode to app.json (they'd be ignored under remote) — so app.json's gated brand config was left untouched.
- `.env.example` extended: `EXPO_TOKEN` (headless builds) + `EXPO_ASC_*` aliases mapped to the constitution's `ASC_*` names, so a headless store upload needs no renaming.
- `docs/BLOCKERS.md` rewritten into the mandated **ranked "WHAT NEEDS YOU"** shape: item #1 is the full plain-English, click-by-click Apple setup (free Expo token → $99 Developer enrollment → App Store Connect API key: Users and Access ▸ Integrations ▸ + ▸ App Manager ▸ download .p8 once ▸ copy Key ID + Issuer ID). Weeks-away AI-model upload demoted to #8. Clarified that TestFlight **internal** upload is allowed autonomously (only external/App-Review is gated), so the moment keys land the path is one command on my side. Test count refreshed 324 → 397.
- DECISIONS.md + TODO.md logged. Gates green: tsc clean (baseline), expo lint 0 errors, eas.json/app.json parse-valid, 397 tests green (no source changed — config/docs only).
- GATE: Apple Developer account + App Store Connect API key — see BLOCKERS.md #1. Rolling straight into Cycle 2 (Rich design step 3: rich chrome on Quran list / Tasbih / Calendar / Zakat / Settings).

## Session 2026-07-21 (cont.) — Cycle 2: Rich design step 3 (5 more screens)

Plan (mandate item (b) — extend the proven Home rich pattern to the next screens per docs/RICH_DESIGN_SPEC.md build order 3):

1. Study TodayScreen's use of the rich primitives (Gradient / GoldFrameCard / PeriodEyebrow / SectionRule / useDeviceTier / elevation tokens) as the reference; keep the pure-JS, no-native-rebuild approach.
2. Apply rich chrome to the five screens, one featured element each per spec: Quran list (continue-reading featured + gold header rule + elevated surah card), Tasbih (counter ring featured), Calendar (elevated month grid + gold-left disclaimer), Zakat (ZAKAT-DUE featured green gold-framed card), Settings/More (grouped elevated rows + featured About/privacy card). Reverence holds — no gradient/texture over Quranic/Arabic content.
3. Per screen: extend existing tests for the new chrome; keep tsc + lint + jest green; commit incrementally.
4. Verify on the iOS simulator (screenshots) once the batch is in; log design calls in DECISIONS.md.

Done:

- Rich chrome applied to all five step-3 screens, one featured element each, in 4 commits (Zakat+Calendar, Tasbih, Quran list, More):
  - **Zakat** — "Zakat due" total → featured gold-framed green card; asset/liability/price rows → elevated (e2) cards under gold SectionRules; gold-left-border disclaimer.
  - **Calendar** — month grid → elevated card; disclaimer → gold-left-border.
  - **Tasbih** — soft ambient day-gradient behind the counter; ring gains a tier-gated gold/success completion glow (the specced "gold-glow at completion"); history → elevated card.
  - **Quran list** — continue-reading → featured gold card (Pressable-wrapped to stay tappable); gold SectionRule header; surah/search rows → elevated card. New UI key `quran.surahsSection` (en + ur/ar gate-8 drafts).
  - **More/Settings** — settings/notifications/reading groups → elevated cards under gold SectionRules; privacy note → featured GoldFrameCard.
- **Legacy-theme migration:** SurahListScreen, MoreScreen + its PickerModal moved off ThemedView/Colors[scheme]/useColorScheme to useTokens() + useThemeMode/useDeviceTier; raw px → spacing/radius tokens. (TodayScreen was already migrated; only these two remained on the legacy path.)
- **Reverence held:** no gradient/texture over Quranic/Arabic content — surah Arabic names untouched and still accessibilityLanguage="ar"; all effects tier-gated via `flat` (nothing on essential tier / Reduce Motion).
- Gates green throughout: tsc clean, expo lint 0 errors, full suite **397/397** (47 suites); every screen's existing testIDs + a11y semantics preserved.
- Remaining Rich roadmap: step 4 (Reader/Qibla restrained featured cards) + step 5 (motion/haptics/skeletons) — next cycles.

## Session 2026-07-21 (cont.) — Reliability: cross-platform visual verification of the rich screens

- Owner opened the emulators for me. Ran the app on BOTH the iOS Simulator (iPhone 17 Pro, iOS 26.3) and the Android emulator (deendawn_pixel) against live Metro — reused the existing dev build + debug APK (JS-only changes, served via fast refresh; no native rebuild, so the Ruby/CocoaPods blocker never came up).
- Visually verified all five step-3 screens plus Today on iOS, and Today + Quran list on Android:
  - Featured gold-framed cards render with crisp gold corner brackets (Today next-prayer, Quran continue-reading, Zakat total, More privacy).
  - Gold SectionRules (Quran SURAHS, Zakat WHAT-YOU-OWN/OWE/PRICES, More ADHAN-NOTIFICATIONS/READING) render with the fading gold hairline.
  - Elevated grouped cards (times, surah list, settings/notifications/reading, zakat form, calendar grid, tasbih history) render with the e2 shadow + hairline border.
  - Gold-left-border disclaimers (Calendar, Zakat) confirmed via zoom.
  - Ambient gradients (Today, Tasbih) render soft and calm; reverence held — Arabic surah names untouched, correct RTL.
  - **iOS ⇄ Android parity confirmed** — the design reads identically on both.
- **No bugs / layout breaks / jank / overflow found.** The only friction was the iOS Simulator's hardware-keyboard accent-popup during city text entry — a test-harness quirk, not an app defect (discrete key presses worked). No code change needed.
- Verdict: rich design step 3 is production-quality on both platforms. Clean device screenshots captured in scratchpad; formal store-size captures remain gate 9.

## Session 2026-07-21 (cont.) — Cycle: Rich design step 4 (Reader + Qibla, restrained)

Plan (spec build-order step 4 — the reverence-critical screens):

1. Reader: make ONLY the audio player the featured gold-framed card; leave every ayah and its calm hairline rule untouched (reverence hold).
2. Qibla: give the compass dial a restrained elevated surface (e2, no gradient/brackets); keep it calm.
3. Add a `mode` override to GoldFrameCard so the reader's night-warm theme frames correctly.

Done:

- **GoldFrameCard** gained an optional `mode?: ThemeMode` prop — when set, it themes the frame/elevation from that mode (via `useTokens(mode)` + `richMode`) instead of the app mode. Default behavior unchanged. Lets the night-warm reader frame its audio card in the right gold.
- **Reader (SurahAudioBar)** — the audio player is now the ONE featured `GoldFrameCard` (gold frame + corner brackets + e3), passing `mode` from the reader's `nightWarm`. Verified live on iOS: gold-framed "Listen" card at top, DEV placeholder badge intact; **the ayat are completely untouched** — Uthmani script, calm hairline separators, no decoration (reverence held). `testID="surah-audio-bar"` + all audio testIDs preserved.
- **Qibla** — the compass dial ring now sits on a restrained elevated surface (`bgSurface` + tier-gated `elevation.e2`); aligned state still swaps to `accentSoft`+success. Caveat/calibration chips adopt the gold-left-border treatment. Verified live on iOS: dial reads as a clean elevated disc, calm — no gradient or gold brackets (reverent). All qibla testIDs + haptics semantics preserved.
- Gates green: tsc clean, expo lint 0 errors, full suite **397/397** (47 suites). Reverence invariant intact — no decorative element touches Quranic/Arabic content on either screen.
- Rich roadmap: steps 2–4 complete. Remaining: step 5 (motion/haptics vocabulary/skeletons) + the tab-bar-reads-raw-scheme fix.

## Session 2026-07-21 (cont.) — Cycle: Rich design step 5 (motion · haptics · skeletons) — ROADMAP COMPLETE

Plan (final Rich step — the "signature feel" layer, all pure-JS since Reanimated isn't wired):

1. Haptics vocabulary (one named verb per meaning), Reduce-Motion-aware, refactor the 3 ad-hoc sites onto it.
2. Fix the tab bar reading the raw OS scheme instead of the app ThemeProvider.
3. Press-scale micro-interaction via built-in Animated (no native rebuild), wired into Button.
4. Skeleton loaders replacing bare spinners; tier-gated shimmer.

Done (4 commits):

- **Haptics** — `src/lib/haptics.ts`: press/detent/select/success/warning verbs mapped once to expo-haptics; `useHaptics()` silences them under Reduce Motion only (low-end phones keep feedback → tasbih/qibla call-count tests stay green). Refactored Tasbih, Qibla, HapticTab. 3 new tests.
- **Tab-bar bug** — `app/(tabs)/_layout.tsx` switched from `Colors[useColorScheme()]` (raw OS scheme, no night-warm entry) to `useTokens()`: active tint = accent, inactive = icon, bar bg/border tokenized. Verified live on iOS — green active tab, grey inactive, correct surface. Now correct in every theme incl. night-warm.
- **Motion** — `src/lib/theme/usePressScale.ts`: reusable press-scale on the Animated native driver, timed to `duration.fast`, disabled on essential tier / Reduce Motion. Wired into Button (Pressable stays the a11y node; presses/labels unchanged).
- **Skeletons** — `src/components/ui/Skeleton.tsx`: content-shaped placeholder, opacity-pulse on capable tiers / static on essential, a11y-hidden. Tips loading shows three tip-pill skeletons (was a bare ActivityIndicator).
- Reanimated is installed but NOT wired (no babel.config.js / worklets plugin) — deliberately used built-in `Animated` for all motion so nothing needs a native rebuild. Motion `duration` tokens (previously unconsumed) now drive press-scale (fast) + shimmer (slow).
- Gates green: tsc clean, expo lint 0 errors, full suite **400/400** (48 suites). Reader relaunch + tab bar verified live on iOS.

**Rich design (Direction 1c) steps 2–5 are now all complete.** Remaining design backlog: manuscript-art editorial moments (scholar gate), Dynamic-Type/RTL device audits, and adopting `usePressScale`/`Skeleton` more widely as screens are touched.

## Session 2026-07-21 (cont.) — Net-new feature: Bookmarks browser

With the Rich design roadmap complete, started net-new features. Picked the Bookmarks browser — bookmarks were write-only (star an ayah in the reader, but no way to see saved stars), a visible dead-end reusing the existing storage/routing/test infra.

Done:

- **BookmarksScreen** (`src/features/quran/components/BookmarksScreen.tsx`): newest-first list of saved verses — surah-name citation + Uthmani Arabic (undecorated, reverence) + translation snippet; tap → deep-link into the reader at that ayah; star to remove; honest empty state. Route `app/bookmarks.tsx` + Stack registration.
- **repo.getAyahsByRefs()**: order-preserving batch fetch of ayah rows for a list of refs (drops any not found). Reuses `loadBookmarks`/`toggleBookmark` — no new persistence.
- Entry point: a "★ Bookmarks" link in the Quran-tab header (its natural home). New i18n keys `quran.bookmarksTitle`/`bookmarksEmpty` (en + ur/ar gate-8 drafts, covered by the blanket TRANSLATION_REVIEW status).
- 4 new tests against the real shipped quran.db (empty, list+citation, deep-link, remove). Gates green: tsc, expo lint 0 errors, **404/404** (49 suites).
- **Verified live on BOTH emulators:** iOS full flow (empty → star a verse in reader → browse with citation/Arabic/translation → row deep-links back to the reader → remove); Android (header link + empty state + navigation). Cross-platform parity confirmed.

## Session 2026-07-21 (cont.) — Net-new feature: adjustable reading font size

Second net-new feature. Quran/translation sizing was hardcoded (no accessibility control) — a genuine gap.

Done:

- **readerState**: `READING_SCALES` (0.85, 1, 1.15, 1.3, 1.5), `loadReadingScale`/`saveReadingScale` (validated to the allowed set, defaults 1.0), `stepReadingScale` (clamped stepping through the set).
- **SurahScreen**: applies the scale to BOTH the Uthmani Arabic (28/56 base) and the translation (16/26 base) — fontSize + lineHeight only; the text bytes are never touched (reverence intact). Scale threaded into FlashList `extraData`.
- **More → Reading**: a "Reading size" row with an A−/A+ stepper (small/large "A" glyphs) + a live "%" readout, buttons disabled at the ends, accessible labels.
- i18n `more.readingSize`/`Desc`/`Smaller`/`Larger` (en + ur/ar gate-8 drafts).
- 9 tests: scale math (default, validate, clamp), the More stepper (100%→115%, persists 1.15), and a reader assertion that the Arabic (36.4) + translation (20.8) actually scale at 1.3x.
- Gates green: tsc, expo lint 0 errors, **409/409** (50 suites).
- **Verified live on BOTH emulators**: iOS and Android — stepped 100%→130% in More, opened a surah, confirmed the Arabic + translation enlarge (translation wraps to two lines). Cross-platform parity.

## Session 2026-07-21 (cont.) — Net-new feature: Verse of the Day + deep-link scroll fix

Third net-new feature, plus a reliability fix found while testing it.

Done — Verse of the Day:

- `verseOfDay.ts`: pure `verseOfDayOrdinal(date)` — the daily verse is picked PURELY by the calendar day (never curated; hand-choosing scripture would break Rule 1), advancing one per day over all 6236 ayat (~17-year cycle). Unit-tested (range, determinism, daily-advance, wrap).
- `repo.getAyahByOrdinal()`: fetch the ayah at a 0-based mushaf ordinal.
- `VerseOfDayCard`: elevated card (NOT the featured gold frame — Today already has one), Arabic undecorated (reverence), translation + surah-name citation, tap deep-links into the reader. Memoized by ordinal so the 1-second Today re-render doesn't re-query. Placed below Today's prayer times.
- i18n `today.verseOfDay` (en + ur/ar drafts). 7 tests. Verified live on iOS + Android — identical verse (An-Nahl 16:47) both platforms.

Done — deep-link scroll fix (found via verse-of-day testing; also fixes bookmarks + search):

- Deep-linking to an ayah opened the reader at the TOP because rows load after the transition (E7) → initial index computed as 0. Fix: when a target ayah is in params, load rows synchronously at mount; scroll to the exact ayah via a FlashList ref + `scrollToIndex` in `onLoad` (measures variable-height rows; `initialScrollIndex` only estimates and overshot ~30 ayat). Ordinary opens keep the deferred load + smooth push.
- Verified live on iOS: verse-of-day (An-Nahl 16:47) now opens with 16:47 at the top. 2 tests prove the synchronous deep-link load.
- Gates green: tsc, expo lint 0 errors, **418/418** (53 suites).

## Session 2026-07-21 (cont.) — Continue-reading reliability (tracking + chip freshness)

Followed the deep-link scroll fix with the two remaining continue-reading gaps (both real bugs found while testing):

1. **Position clobbered on deep-link open**: `onViewableItemsChanged` saved last-read from the FIRST visible verse, so a deep-link open recorded the top-of-surah render BEFORE `scrollToIndex` ran — briefly overwriting the deep-linked position (lost if you backed out fast). Fix: tracking stays OFF until the initial deep-link scroll settles (`onLoad → scrollToIndex.finally`). Extracted the decision into a pure `recordReadingPosition(store, first, tracking)` with unit tests (on/off/empty).
2. **Stale chip**: the "Continue reading" chip memoized `lastRead` for the tab's lifetime → showed the old position until an app reload. Fix: read `lastRead` fresh + `useFocusEffect` bump so it re-reads on tab focus.
- Verified live on iOS AND Android: read Al-Baqara, back → chip instantly shows the new position (2:4 iOS / 2:6 Android); continue-reading lands on the exact ayah; saved position survives.
- Gates green: tsc, expo lint 0 errors, **421/421** (53 suites).
