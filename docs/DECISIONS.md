# DECISIONS — non-obvious choices with rationale

## 2026-07-12 — Phase 2 blocked/never list (from PHASE_2_DIRECTIVE §1e, owner-confirmed)

Word-by-word Quran data: QUL/hablullah WBW is CC BY-NC-ND — unusable (tip jar = commercial-adjacent; ND blocks derivatives). Feature deferred until a permissive dataset is sourced. corpus.quran.com morphology is GPL — do not link or bundle. Hadith remains out of scope pending a sunnah.com agreement. Wikipedia bios (CC BY-SA), Nicholson Rumi translations (Gibb Trust copyright), Rosenthal's Muqaddimah (1958, copyrighted), Stanford Encyclopedia of Philosophy: never bundle. Android full-adhan foreground service: deferred to post-v1 (new permission surface); do not scaffold.

## 2026-07-12 — E1 i18n implementation choices

- react-i18next with bundled JSON resources, synchronous init at root (no async splash dependency); `intl-pluralrules` polyfill because Hermes lacks Intl.PluralRules (needed for Arabic's 6 CLDR plural forms — tested explicitly).
- Missing-key enforcement is two-layered: a jest suite diffs flattened key sets across en/ur/ar (plural-suffix-aware) and rejects empty values; eslint `react/jsx-no-literals` (scoped to app/ and feature components, locale-neutral symbols allowlisted) makes any hardcoded JSX string a lint ERROR — the "bypassed i18n" CI gate.
- UR/AR drafts live only in `src/lib/i18n/locales/` — the guard hook's Gate-8 exception allows Arabic script exactly there and in the two review logs, nowhere else. Each draft file self-declares `meta.status: @draft`; a test asserts the flag until a reviewer clears it.
- Native language names come from each locale's own file (`meta.nativeName`) so the picker renders each option in its own script without Arabic literals in code.
- RTL switch: persisted language + I18nManager.forceRTL applied for NEXT start; bilingual (current+target) confirm dialog; Updates.reloadAsync with DevSettings.reload fallback in dev.
- Urdu rendering: NotoNastaliqUrdu v4.000 pinned from the official notofonts release; ThemedText swaps family and multiplies line-height ×1.55 when language is ur (Nastaliq's deep descenders clip at Latin leading).
- Notification content localizes at schedule time via i18n.t — reschedule-on-language-change comes free because the language picker lives in Settings whose changes already trigger rescheduleAll.

## 2026-07-13 — E2 qibla implementation choices

- Bearing math implemented independently (great-circle initial bearing) and unit-tested to 0.01° against the adhan reference (10 cities, all hemispheres) — avoids circular testing while satisfying the known-good requirement.
- Heading via expo-location watchHeadingAsync (no expo-sensors needed): trueHeading when >=0 else magnetic + honesty chip; circular exponential low-pass (alpha 0.25) + ~15Hz UI throttle; calibration chip at accuracy <=1 (expo scale 0–3).
- No needle springs at all (floor discipline + Reduce Motion trivially honored); rotation is direct transform at throttled rate.
- Night-warm stays reader-scoped by design (it is a reading mode, not an app theme); qibla ships light+dark via tokens.
- Location permission copy states on-device-only use explicitly; the screen has a dedicated denied state with re-request.

## 2026-07-13 — E4 hijri choices

- @umalqura/core (MIT, pure TS) chosen over hand-rolling the Umm al-Qura table or Intl islamic-umalqura (Hermes Intl calendar support unreliable). Verified against published anchors in tests; the ±1 user offset applies before all display/detection.
- Suhoor reminders live inside the SAME rolling plan/cap as adhans (deterministic suhoor-<date> ids) so the 64-notification budget stays one accounting.
- expo-asset added as a direct dependency: autolinking missed it once require()d audio assets shipped (runtime "Cannot find native module ExpoAsset").

## 2026-07-13 — E7 navigation feel choices

- enableScreens + enableFreeze at root, freezeOnBlur on tabs; navigation chrome already tokenized (no white flash — DarkTheme pure-black never used). Native iOS push kept (system-standard timing/easing beats custom 200–280ms reimplementations and respects Reduce Motion automatically).
- Zero custom motion exists app-wide by design (floor discipline): the only "animations" are color flashes (tasbih milestones), which Reduce Motion guidance permits. If motion is ever added, gate via AccessibilityInfo.isReduceMotionEnabled.
- Reader open (the profile target): ayah materialization deferred past the push via InteractionManager; FlatList initialNumToRender 10. Real-device frame profiling added to the TESTPLAN device pass (simulators do not exhibit real thermals/frame pacing).

## 2026-07-13 — E9 core-first sequencing

- Built the entire Tier B safety core PURE and fully tested (26 tests): generation contract enforcing Rule 1.5a–d (citations ⊆ retrieved, INSUFFICIENT honored, ≤40 words/2 sentences, filler blocklist, one regeneration then Tier A fallback, empty retrieval never reaches the model), capability gate (3.5GB + non-low-RAM + A14+/iPhone13,x map), hybrid merge (both>vector-by-score>fts, deduped), download manager (R2-only, Wi-Fi default, hash-verify-or-delete, resumable interface, delete-all), model.lock with PENDING-UPLOAD hashes so Tier B is provably inert until BLOCKERS item A lands.
- llama.rn + op-sqlite native installation DEFERRED to a dedicated session: the directive itself flags the dual-SQLite iOS build conflict as a known risk; with zero model files uploaded there is nothing end-to-end to validate, and destabilizing a green build for an untestable path is bad sequencing. The LlmRuntime/DownloadPlatform/VectorStore interfaces are the exact seams the native impls plug into. First task of that session: add op-sqlite with the static-libraries approach and verify xcodebuild BEFORE any other change.
- Tier B UI surface (download offer, settings row, answer card) lands with the native session so it can be driven end-to-end against the stub artifact.

## 2026-07-12 — Phase 2 directive adopted

Zohaib pasted the research assistant's PHASE_2_DIRECTIVE (archived at docs/PHASE_2_DIRECTIVE.md) and explicitly confirmed the CLAUDE.md amendments — including Rule 1.5 (generated answers layer) and Human Gates 7–9 — via a direct yes in-session. Epic order: E1 i18n → E2 qibla → E3 adhan sounds → E4 hijri/Ramadan → E5 tasbih → E6 zakat → E7 navigation feel → E8 Ask Tier A → E9 Ask Tier B (ships OFF, gate 7) → E10 philosophers library → E11 remaining v1 backlog.

## 2026-07-12 — Scaffold via default@sdk-54 template

Chose `create-expo-app --template default@sdk-54` (not blank) to pin Expo SDK 54 / RN 0.81.5 per constitution, keeping expo-router, TS strict, and eslint-config-expo from the official template. Template's example tab screens will be replaced as features land.

## 2026-07-12 — Kept template AGENTS.md

The SDK 54 template ships an AGENTS.md pointing at versioned Expo docs. Kept it as subordinate API guidance; CLAUDE.md (constitution) explicitly wins on conflict.

## 2026-07-12 — Content sources pinned (first fetch)

Recorded in `content-pipeline/content.lock` in the same commit as the data files:

| Artifact                                             | URL                                                                                  | License                                                                    | Fetched    |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------- | ---------- |
| Quran text, Uthmani (`quran-uthmani.txt`)            | https://tanzil.net/pub/download/index.php?quranType=uthmani&outType=txt-2&agree=true | CC BY 3.0 / Tanzil terms (verbatim, attribution, copyright block retained) | 2026-07-12 |
| DEV translation, Pickthall 1930 (`en.pickthall.txt`) | https://tanzil.net/trans/en.pickthall                                                | Public domain (first published 1930), via Tanzil                           | 2026-07-12 |
| Surah/juz metadata (`quran-data.xml`)                | https://tanzil.net/res/text/metadata/quran-data.xml                                  | Tanzil metadata, attribution required                                      | 2026-07-12 |

Notes: `outType=txt-2` is the machine-readable `sura|aya|text` format (plain `txt` has no ayah keys). Verified: 114 surahs, 6236 ayahs (Hafs/Kufan), strict mushaf-order numbering, UTF-8, no U+FFFD, Tanzil copyright block present.

## 2026-07-12 — Pickthall as DEV translation

Constitution requires "one clearly-redistributable translation from Tanzil's collection" for development. Pickthall (1930) is public domain by age — the least license risk of any option. Marked `devOnly: true` in sources.json and the attribution manifest; every screen rendering it gets the `__DEV__` badge. Shipping translation remains Human Gate #5.

## 2026-07-12 — quran.db design

- Source columns (`text_uthmani`, `text_translation`) hold verified bytes untouched; FTS5 (`unicode61 remove_diacritics 2`) indexes DERIVED normalized columns only (harakat/annotation marks stripped, alef/ya/ta-marbuta folding, via `\uXXXX` escapes — no Arabic literals in AI-authored code, consistent with the guard hook).
- `content.lock` also pins per-ayah spot hashes (1:1, 114:6) and full-corpus concat hashes; `content:build` self-checks the emitted db against them, and golden Jest tests re-verify independently (own parser + hasher, no pipeline imports) so a pipeline bug can't mask a content defect.
- `pin.mjs` refuses to overwrite an existing lock entry — changed bytes are investigated, never re-pinned.
- `better-sqlite3` is a devDependency (build/test only); the app reads the bundled db via expo-sqlite.
- db is 5.3 MB (budget: <25 MB), committed to git for reproducible app builds + golden tests.

## 2026-07-12 — Prayer fixture matrix design

- Fixtures generated ONCE by `scripts/generate-prayer-fixtures.mjs` directly from adhan 4.4.4 (the reference implementation), NOT through the app wrapper — wrapper bugs cannot bake into fixtures. Committed as `prayer-fixtures.json` (1,680 entries, ~700 KB).
- Matrix: full product of 8 cities × 8 dates × 12 methods × 2 madhabs with high-lat rule `auto` (1,536), plus a dedicated high-latitude matrix ({Anchorage, Stockholm, London} × 8 dates × {MWL, ISNA} × all 3 explicit rules, 144). Full 5-way product would add ~3k redundant rows where high-lat rules are no-ops at mid latitudes; the trimmed matrix still exercises every value of every dimension where it has an effect.
- Dates cover both US and EU DST transitions (Mar 8 / Nov 1, Mar 29 / Oct 25 2026), both solstices, March equinox, and a Ramadan-1447-window date (2026-02-18, calculated approximation used as a test label only, not a religious assertion).
- Each fixture stores UTC instants AND city-zone-local `HH:mm` (via Intl); the test asserts both to the minute, which is what makes the DST-correctness criterion executable.
- Calendar-day interpretation: engine constructs dates at local noon (`new Date(y, m-1, d, 12)`); adhan derives the calendar day from local getters, so results are machine-timezone-independent for the same calendar date.
- Uncomputable prayers at extreme latitude (adhan returns Invalid Date for e.g. Moonsighting isha in Anchorage midsummer) are stored as `null` and asserted as such — honest behavior, surfaced to UI later.

## 2026-07-12 — App identity + architecture choices (app shell session)

- Initial bundle id `com.khavion.deendawn`, name `DeenDawn`, slug `deendawn`. This is the FIRST setting (prebuild requires one), not a change; renaming later is Human Gate #6. `ITSAppUsesNonExemptEncryption=false` set (standard HTTPS only) to skip the export-compliance prompt.
- User data lives in a single sqlite-backed key-value table (`user.db`) behind a `KVStore` interface; tests inject an in-memory impl so no native module in jest. Settings parse defensively field-by-field (a corrupt value resets that field, not everything).
- expo-localization added (on-device locale read only — no privacy surface) for the ISNA-if-US default.
- ios/ and android/ are gitignored (Expo continuous native generation): `npx expo prebuild` regenerates them; CocoaPods needs `LANG=en_US.UTF-8`.
- Notification design: deterministic ids (`fajr-2026-07-13`) enable minimal diffing against the OS queue, so the frequent reschedule calls (foreground/fire/settings) are no-ops when nothing changed. Cap 60 of iOS's 64 to leave headroom for the future pre-fajr suhoor reminder. Custom adhan sounds deferred until legally-redistributable clips are sourced through the content pipeline; until then iOS default sound with 'silent' option, marked time-sensitive.
- RTL (@testing-library/react-native) v14 has an async render/fireEvent API — all component tests await them; `screen` singleton unused (returned queries instead).

## 2026-07-12 — Quran reader design

- Amiri Quran 1.003 pinned through the content pipeline like the text artifacts (zip sha256 in content.lock; extraction to assets/fonts happens in content:build via system unzip). Font integrity matters for Quran rendering, so it gets the same drift protection. Amiri chosen over Scheherazade New (purpose-built Quran typeface) and over KFGQPC (license prohibits modification; OFL permits subsetting later for size).
- quran.db ships as a metro asset (`assetExts += db`) opened read-only by expo-sqlite's SQLiteProvider assetSource; repo functions take a minimal sync db interface so node tests exercise identical SQL against the identical committed bytes via better-sqlite3.
- Search-query folding duplicated in TS (escape-sequence regexes) because the pipeline lib is ESM-with-import.meta (unloadable under babel-jest); a parity test guarantees byte-identical behavior against the built index, which is stronger than sharing code.
- FTS user input is tokenized and each token double-quoted — FTS5 operators (OR, NEAR, *) cannot be injected.
- Last-read updates on viewability (60% threshold) rather than scroll offset — cheap and restores to the right ayah via `/surah/[id]?ayah=n` deep links (also used by search results).

## 2026-07-12 — Warm-editorial design system (Zohaib's brief, docs/DESIGN.md)

- Tokens-first: `src/lib/theme/tokens.ts` is the only place hexes/radii/durations live; WCAG contrast enforced by jest (7:1 body, 4.5:1 secondary/interactive, 3:1 large accents) across light/dark/night-warm — palette edits that break readability fail CI.
- Fonts chosen from the brief's options: Literata (reading serif — bookish over Newsreader's newsy voice), Source Sans 3 (UI sans). Both SIL OFL, pinned as content-pipeline artifacts (Literata 3.103 zip from googlefonts, Source Sans 3.052R TTF zip from adobe-fonts) with extraction in content:build, same drift protection as the Quran text.
- Accent identity moved green -> lapis (#1F3A5F light / #7FA8D8 dark) per the manuscript-palette brief; ochre reserved for sparse highlights (bookmark stars, DEV badge); green now means success only. Old template green retired.
- Dark mode: #121212 canvas with warm-tinted elevations, off-white (never pure white) text, desaturated accents; navigation chrome tokenized (stock DarkTheme uses pure black — banned by the halation rule).
- Night-warm reading mode: opt-in switch in More, amber palette applied to the Quran reader only.
- Arabic ayah body raised to 28pt at 2.0 line-height (tashkeel clearance per brief). `maxFontSizeMultiplier` capped at 1.4 app-wide.
- Deferred from the brief (tracked in TODO/DESIGN): FlashList perf pass, manuscript-art CC0 editorial moments (scholar gate), haptics (tasbih epic), Dynamic Type + RTL audits.

## 2026-07-13 — Recitation audio: player built now, recordings later (E11 / v1 feature 5)

- The streaming player (expo-audio 1.1.1) is fully built and tested against a dev tone server (`npm run dev:audio`, localhost:8083, HTTP range support) because licensed recordings don't exist yet (BLOCKERS item 2 / gate 5). The dev source serves a synthesized tone that is NEVER presented as recitation — the player shows a persistent "DEV audio — placeholder tone, not recitation" badge on every dev build (rule 1 discipline, same pattern as the DEV translation watermark).
- Source selection: `EXPO_PUBLIC_AUDIO_BASE_URL` (build-time) → production R2 (the only allowed audio domain, rule 2); unset in release → the Listen bar renders nothing (no dead UI); unset in dev → localhost tone server. Bucket layout `{base}/{reciterId}/{NNN}.mp3` (dev uses .m4a because macOS afconvert encodes AAC, not MP3).
- Resume positions are keyed per reciter+surah (`audio.resume.v1.*`) so a later reciter change never resumes into the wrong recording; resume skips the first 10s and last 5s (restart beats mid-word jumps); position cleared on finish.
- Lock-screen controls via `setActiveForLockScreen` with surah transliteration as title; background playback via UIBackgroundModes audio + `shouldPlayInBackground`. Real-device verification is on TESTPLAN's device pass.
