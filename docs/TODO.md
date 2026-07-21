# TODO — DeenDawn

Epics in build order. Top unblocked item is always the current task.

## PHASE 2 (owner-confirmed 2026-07-12 — specs in docs/PHASE_2_DIRECTIVE.md, takes priority over remaining v1 backlog below)

- [x] E1. Localization foundation EN/UR/AR — DONE 2026-07-13 (i18n keys everywhere, jsx-no-literals lint gate, key-parity + AR 6-plural tests, language picker + bilingual RTL restart, Nastaliq pinned + line-height compensation, UR/AR @draft per gate 8, 3-locale screenshots in docs/screens). Pending gate 8: human review of UR/AR strings.
- [x] E2. Qibla compass — DONE 2026-07-13 (independent bearing math verified vs adhan reference to 0.01°, heading hook w/ low-pass + true-north fallback, calibration + magnetic chips, ±3° haptics, a11y label, i18n en/ur/ar, permission states; real-magnetometer checks on device pass list)
- [x] E3. Adhan sound options — DONE 2026-07-13 (per-prayer Silent/Ping/Clip/Full picker w/ honesty copy in 3 locales; clip bundled via expo-notifications plugin; <30s WAV-header pipeline test; full-adhan plays in-app on open-from-notification w/ stop banner; SILENT PLACEHOLDERS until cleared recordings — BLOCKERS item B; Android channels deferred w/ v1 constitution)
- [x] E4. Hijri calendar + Ramadan mode — DONE 2026-07-13 (@umalqura/core conversion verified vs published anchors, ±1 offset setting, dual-date month grid + key-date dots + legend + persistent disclaimer, hijri date on Today, Ramadan suhoor/iftar card, pre-Fajr reminder in the rolling scheduler, i18n en/ur/ar, SCHOLAR_REVIEW flags logged)
- [x] E5. Tasbih counter — DONE 2026-07-13 (giant tap ring, selection tick per count, Medium detent at 33s, Success at round completion with visual flash pairing, 33/99 targets, user-typed label only — no Arabic dhikr text pending scholar gate, 7-day history, corrupt-storage-safe, i18n ×3)
- [x] E6. Zakat calculator — DONE 2026-07-13 (pure 2.5% math w/ min-of-metals nisab + needPrices/belowNisab states, user-entered prices only, Arabic-Indic numeral input parsing, live result card, disclaimer + nisab constants flagged SCHOLAR-REVIEW, i18n ×3 incl. AR long-value layout test)
- [x] E7. Navigation feel pass — DONE 2026-07-13 (enableScreens/enableFreeze, freezeOnBlur tabs, tokenized nav chrome pre-existing, native push kept for system Reduce Motion, reader load deferred past transition; real-device profile on TESTPLAN)
- [x] E8. Ask Tier A — DONE 2026-07-13 (query router count/list/ruling/topical incl. Arabic patterns, conservative synonym expansion, exact FTS counts phrased as corpus facts, fixed ruling redirect (SCHOLAR flag), 64 ground-truth fixtures derived from the committed db, 72-test harness that gates E9, terse UI w/ tappable citation deep-links, 5th tab, Maestro flow green, i18n ×3 incl. AR 6-form count plurals)
- [~] E9. Ask Tier B — CORE DONE 2026-07-13 (contract+harness, gate-7 flag OFF, capability gate, hybrid merge, R2-only download manager, inert model.lock); NATIVE STACK DONE 2026-07-13 (op-sqlite+sqlite-vec+llama.rn compile via RN-from-source + fmt C++17 plugins; VectorStore w/ memory+sqlite-vec impls; llamaRuntime adapter; TierBCard UI states tested); DORMANT WIRING DONE 2026-07-13 (tierbController + card rendered in More behind gate-7, ships inert/pendingUpload; Ask cross-source Books filter also done). REMAINING (model-blocked, BLOCKERS A): generate ayah-embeddings, on-device inference checks, real download/delete handlers on the card, gate-7 flip after scholar sign-off
- [x] E10. Philosophers library — CORPUS+DATA DONE 2026-07-13 (3 PD-verified Gutenberg works pinned w/ per-page license verification: Field/Ghazali #58977, Davis/Rumi #45159, Nawab Ali/Ghazali #73140; library.db 308 FTS sections + golden tests incl. license-log completeness + pre-1930 gate; 16 thinker pages drafted + Gate 9 flagged). Library UI shipped as E10b; Ask cross-source filter DONE 2026-07-13 (Quran/Books toggle, deterministic section search + redirect discipline, deep-links, tests vs real db)
- [x] E10b. Library UI — DONE 2026-07-13 (thinker list w/ pending-review banner, thinker pages w/ key ideas + linked bundled works, serif work reader w/ section deep-links + PD attribution line, FTS search over books, /library via More, i18n chrome ×3, library.db opened via expo-asset copy + size-compare refresh). Ask cross-source filter deferred to E9 native session
- [~] E11. IN PROGRESS — About/attribution/privacy screen DONE 2026-07-13; onboarding first-run flow DONE 2026-07-13 (welcome→city→reminders steps, kv flag `onboarded.v1`, redirect from Today, Maestro e2e/onboarding.yaml incl. relaunch-persistence assert, i18n ×3); recitation streaming player DONE 2026-07-13 (expo-audio, R2-or-hidden source rule, per-reciter resume store, lock-screen metadata + background mode, honest DEV-tone badge, 21 tests + e2e/audio.yaml vs local range-request server; REAL recordings still gate 5/BLOCKERS 2); tip jar DONE 2026-07-13 (TipsBackend interface, key-less honest unavailable state, purchase/restore/thanks flows, rule-3 copy-audit test ×3 locales, e2e/tips.yaml; live products await RevenueCat key + ASC — BLOCKERS 1); offline E2E suite DONE 2026-07-13 (e2e/offline.yaml vs RELEASE build w/ zero servers: onboarding→times→Quran→Ask→qibla→tasbih→zakat→calendar + 5 offline cold starts + release-hides-audio assert; device airplane pass on TESTPLAN); store prep DONE 2026-07-13 (fastlane/metadata drafts: name/subtitle/description/keywords/promo/review-notes/privacy-answers, READY FOR HUMAN SUBMIT checklist in BLOCKERS; submission itself = gates 1-2). E11 COMPLETE except items waiting on humans (recordings, RevenueCat key, reviews)

## RICH DESIGN (Direction 1c — mandate item (b))

- [x] Step 2 Home/hero — DONE (prior session).
- [x] Step 3 rich chrome — DONE 2026-07-21: Zakat, Calendar, Tasbih, Quran list, More (featured cards / elevated groups / gold rules / tier-gated accents). Legacy ThemedView/Colors path fully retired (SurahList + More migrated). 397/397 green.
- [x] Step 4 — Reader + Qibla — DONE 2026-07-21. Reader: audio player is the one featured GoldFrameCard (gold frame + brackets), ayat untouched with calm hairlines (reverence held); GoldFrameCard gained a `mode` prop for the night-warm reader. Qibla: dial on a restrained elevated surface (e2, no gradient/brackets), chips gold-left-border. Verified live on iOS; 397/397 green.
- [x] Step 5 — Motion/haptics/skeletons — DONE 2026-07-21. Haptics vocabulary (src/lib/haptics.ts, Reduce-Motion-aware); press-scale (src/lib/theme/usePressScale.ts, built-in Animated, wired into Button); Skeleton (src/components/ui/Skeleton.tsx) replacing bare spinners in Tips; tab-bar-reads-raw-scheme bug fixed. All pure-JS (Reanimated not wired). 400/400 green, tab bar verified live.
- [x] **Rich design (Direction 1c) steps 2–5 COMPLETE** 2026-07-21.
- [ ] Adopt usePressScale / Skeleton more widely as screens are touched (continue-reading card, tip buttons, etc.).
- [x] Cleanup: migrated CityPickerModal to useTokens and DELETED the whole dead legacy theme chain (collapsible, themed-view, use-theme-color, use-color-scheme(.web), constants/theme) — DONE 2026-07-21. One theming source now.
- [ ] Add missing spec primitives when a native rebuild is available: Surface/elevation wrapper, GirihTexture (needs react-native-svg) — currently deferred (pure-JS approach).
- [x] On-device iOS Simulator + Android emulator visual pass over the step-3 screens — DONE 2026-07-21. All featured cards / gold rules / elevated groups / gold-left disclaimers / ambient gradients render correctly on both platforms; iOS⇄Android parity confirmed; reverence held; no layout breaks or jank found.

## NET-NEW FEATURES (mandate item (d))

- [x] Bookmarks browser — DONE 2026-07-21. Dedicated screen to see/revisit saved verses (was write-only); deep-links into the reader; remove; empty state. repo.getAyahsByRefs; ★ Bookmarks link in Quran header; en+ur/ar(draft) keys; 4 tests; verified iOS+Android.
- [x] Reading font size — DONE 2026-07-21. Adjustable Quran+translation text scale (0.85–1.5); More → Reading A−/A+ stepper with % readout; readerState scale prefs; reader applies it to Arabic+translation (reverence intact); en+ur/ar(draft) keys; 9 tests; verified iOS+Android.
- [ ] Candidate backlog: Quran audio full reciter catalog (gated on recordings); prayer-time notification richness; verse-of-the-day (deterministic, no curation); reading-size control also surfaced in the reader header (currently only in Settings).

## STORE / TESTFLIGHT (mandate item (a))

- [x] EAS pipeline — DONE 2026-07-21. `eas.json` at repo root: `development` (dev-client + `ios.simulator:true`, no-credentials sim build), `preview` (internal), `production` (store, `autoIncrement`). `appVersionSource: remote`. `submit.production.ios` prepared with `ascAppId` placeholder; API key via `EXPO_ASC_*` env (documented in `.env.example`, aliased to constitution `ASC_*`, plus headless `EXPO_TOKEN`). BLOCKERS.md rewritten into ranked "WHAT NEEDS YOU" with full Apple/ASC-key click-by-click as #1. DECISIONS.md logged.
- [ ] After owner keys land (BLOCKERS #1): `eas login`/token → `eas init` (writes `extra.eas.projectId`) → `eas build -p ios --profile production` → `eas submit` to TestFlight **internal** (allowed autonomously). Then store screenshots at Apple sizes (gate 9).
- [ ] Optional later: EAS Update (OTA) channels — expo-updates installed but URL/runtimeVersion not configured; not needed for first builds.

## v1 backlog (superseded ordering — E-epics above absorb qibla/tasbih/hijri/zakat specs)

## 1. Content pipeline (DONE 2026-07-12)

- [x] `content-pipeline/sources.json` with pinned URLs: Tanzil Uthmani text, one redistributable DEV translation, surah/juz metadata
- [x] `npm run content:fetch` — download pinned sources byte-for-byte
- [x] `npm run content:verify` — SHA-256 vs `content.lock`; structural validation (114 surahs, 6236 ayahs, no empty ayahs, UTF-8, spot-string checks for 1:1 and 114:6)
- [x] `npm run content:build` — emit `assets/db/quran.db` (source columns immutable, FTS on derived normalized columns) + attribution manifest
- [x] `content.lock` recorded in same commit as first fetch; source URL + license + date in DECISIONS.md
- [x] Golden Jest tests: db hashes vs content.lock, ayah counts, first/last ayah byte-equality

## 2. Prayer times (CURRENT)

- [x] Install `adhan`; engine wrapper in `src/features/prayer-times/`
- [x] All calculation methods selectable; ISNA default for US locale, MWL otherwise
- [x] Asr madhab toggle (Shafi/Hanafi)
- [x] High-latitude rule auto via `recommended()` + manual override
- [x] Manual city fallback data+logic (bundled offline 135-city dataset, diacritic-folding ranked search; picker UI lands with settings epic)
- [x] Fixture matrix tests: 8 cities × 8 dates × 12 methods × 2 madhabs + high-lat rule matrix, to-the-minute (1,680 fixtures)
- [x] BLOCKERS.md task: human spot-check fixtures vs published timetables
- [x] Today screen UI: next prayer countdown, today's times, city header, empty state with picker

## 3. Adhan notifications

- [x] Rolling scheduler (≥7 days, cap 60 of 64 iOS notifications) as pure tested math + minimal diffing
- [x] Per-prayer on/off + sound plumbing ('default'/'silent'; custom adhan clip files still to source — see below)
- [x] Reschedule on foreground, background task (expo-background-task), after fire, on settings change
- [x] In-app caveats: silent mode, Focus modes (More screen)
- [ ] Adhan sound clips: research legally-redistributable adhan recordings, convert to <30s caf, pin like other content

## 4. Quran reader

- [x] Surah list + ayah view from quran.db (read-only, SQLiteProvider assetSource; repo tested against real db bytes)
- [x] Uthmani rendering: RTL + Amiri Quran font (pinned OFL artifact via content pipeline); visual ligature QA on simulator still pending
- [x] Translation toggle with `__DEV__` "DEV translation" badge
- [x] Bookmarks + last-read (user db) + continue-reading chip
- [x] FTS search on normalized derived columns (Arabic folding parity-tested byte-identical to the index)
- [x] Share-as-text with citation
- [ ] Visual QA on simulator: ligatures, long surahs scroll perf (60fps budget)

## 4b. Design system (brief from Zohaib, 2026-07-12 — docs/DESIGN.md)

- [x] Tokens (light/dark/night-warm) + jest contrast enforcement
- [x] Literata + Source Sans 3 pinned/extracted; type roles (serif reading, sans UI)
- [x] Lapis/ochre/ivory identity applied: Today, reader, city picker, More, nav chrome, tab bar
- [x] Night-warm reader mode (opt-in toggle)
- [ ] FlashList perf pass for long surahs (measure first)
- [ ] Manuscript-art editorial moments (Met/Smithsonian CC0 only, aniconism-safe, scholar sign-off) — onboarding + empty states
- [ ] Haptics per spec (tasbih detents 33/99, adhan moment, tip success) — with respective epics
- [ ] Dynamic Type large-size audit; RTL primitives audit

## 5. Qibla

- [ ] Great-circle bearing to Kaaba (21.4225, 39.8262), unit-tested vs known city bearings
- [ ] Magnetometer heading + declination correction (true north)
- [ ] Calibration UX: accuracy indicator, figure-8 prompt

## 6. Audio

- [ ] expo-audio streaming from R2 (dev set: 2–3 surahs, 1 reciter — needs Zohaib upload; BLOCKERS if missing)
- [ ] Background playback (UIBackgroundModes audio), lock-screen controls
- [ ] Resume position; per-ayah/per-surah playback

## 7. Tasbih / Hijri / Suhoor-Iftar / Zakat

- [ ] Tasbih: counter + haptics, presets WITHOUT Arabic text (numbers + user labels), daily history
- [ ] Hijri: Umm al-Qura conversion + "calculated" label + ±1 day offset setting; unit tests
- [ ] Suhoor/Iftar: fajr/maghrib surfaced during Ramadan (hijri-detected), optional pre-fajr reminder
- [ ] Zakat: assets/liabilities form, user-entered nisab prices, 2.5% math unit-tested, disclaimer + SCHOLAR-REVIEW

## 8. Tips

- [ ] RevenueCat sandbox one-time products $4.99/$9.99/$19.99
- [ ] Restore purchases, thank-you state
- [ ] ASC product definitions prepared-not-submitted

## 9. Settings / Onboarding

- [ ] Location permission flow with manual-city path
- [ ] Method/madhab pickers, notification setup
- [ ] Attribution screen (from content manifest), privacy policy screen (static local)

## 10. Store prep (prepare, never submit)

- [ ] fastlane/metadata drafts; privacy = Data Not Collected; 4.3(b) review notes
- [ ] Screenshots via simctl into docs/screens/
- [ ] `READY FOR HUMAN SUBMIT` checklist in BLOCKERS.md
