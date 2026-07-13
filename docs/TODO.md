# TODO — DeenDawn

Epics in build order. Top unblocked item is always the current task.

## PHASE 2 (owner-confirmed 2026-07-12 — specs in docs/PHASE_2_DIRECTIVE.md, takes priority over remaining v1 backlog below)

- [x] E1. Localization foundation EN/UR/AR — DONE 2026-07-13 (i18n keys everywhere, jsx-no-literals lint gate, key-parity + AR 6-plural tests, language picker + bilingual RTL restart, Nastaliq pinned + line-height compensation, UR/AR @draft per gate 8, 3-locale screenshots in docs/screens). Pending gate 8: human review of UR/AR strings.
- [x] E2. Qibla compass — DONE 2026-07-13 (independent bearing math verified vs adhan reference to 0.01°, heading hook w/ low-pass + true-north fallback, calibration + magnetic chips, ±3° haptics, a11y label, i18n en/ur/ar, permission states; real-magnetometer checks on device pass list)
- [x] E3. Adhan sound options — DONE 2026-07-13 (per-prayer Silent/Ping/Clip/Full picker w/ honesty copy in 3 locales; clip bundled via expo-notifications plugin; <30s WAV-header pipeline test; full-adhan plays in-app on open-from-notification w/ stop banner; SILENT PLACEHOLDERS until cleared recordings — BLOCKERS item B; Android channels deferred w/ v1 constitution)
- [x] E4. Hijri calendar + Ramadan mode — DONE 2026-07-13 (@umalqura/core conversion verified vs published anchors, ±1 offset setting, dual-date month grid + key-date dots + legend + persistent disclaimer, hijri date on Today, Ramadan suhoor/iftar card, pre-Fajr reminder in the rolling scheduler, i18n en/ur/ar, SCHOLAR_REVIEW flags logged)
- [x] E5. Tasbih counter — DONE 2026-07-13 (giant tap ring, selection tick per count, Medium detent at 33s, Success at round completion with visual flash pairing, 33/99 targets, user-typed label only — no Arabic dhikr text pending scholar gate, 7-day history, corrupt-storage-safe, i18n ×3)
- [ ] E6. Zakat calculator (CURRENT)
- [ ] E7. Navigation feel pass — native stack, freeze, durations 200–280ms, reduce-motion, no shared-element transitions, profile reader open
- [ ] E8. Ask Tier A — deterministic retrieval, query router (count/list/ruling-redirect), synonym map, eval harness ≥60 fixtures (gates E9)
- [ ] E9. Ask Tier B — llama.rn + op-sqlite/sqlite-vec vectors.db, R2-only model downloads w/ model.lock, generation contract + post-processor, grounding/refusal/style harnesses, SHIPS OFF (gate 7)
- [ ] E10. Philosophers library — PD-verified corpus via pipeline, library.db + FTS, thinker pages (gate 9), Ask integration
- [ ] E11. Remaining v1 backlog below (audio, tips, onboarding, store prep), i18n-native

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
