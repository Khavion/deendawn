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

## 2026-07-13 — Tip jar behind a backend interface (E11 / v1 feature 10)

- `TipsBackend` interface isolates RevenueCat: the screen, purchase/restore/thank-you flows, and all 11 tests run without the API key (BLOCKERS item 1). `getTipsBackend()` returns null without `EXPO_PUBLIC_REVENUECAT_IOS_KEY` → honest "not set up in this build" state; no dead buttons, no fake products. react-native-purchases is lazy-required so importing the service never touches native code.
- Rule 3 is enforced by a copy-audit test (`tipsCopyAudit.test.ts`): tips + more.tips strings in all three locales fail the build if they contain charity/zakat/sadaqah framing (EN words + UR/AR script patterns); the footnote is REQUIRED to disclaim donation framing ("not a donation to any charitable cause") in every locale.
- Thank-you strings use devotional courtesy phrases (JazakAllahu khayran) — flagged in SCHOLAR_REVIEW like all religious-adjacent copy.
- Maestro note for future flows: rows reached by scrollUntilVisible need `centerElement: true` — otherwise the found row can sit behind the tab bar and the tap lands on a tab.

## 2026-07-13 — E9 native session: op-sqlite forces RN build-from-source (+ fmt fix)

- Adding @op-engineering/op-sqlite (with `"op-sqlite": {"sqliteVec": true}` in package.json) breaks SDK 54's precompiled React-Core XCFramework at link time (`undefined: facebook::react::Sealable` from ExpoModulesCore/RNScreens static libs). Root cause: op-sqlite links React internals the prebuilt framework doesn't export. Fix: build RN from source via `plugins/withRNFromSource.js` (writes `ios.buildReactNativeFromSource=true` into Podfile.properties.json — an app.json ios key does NOT map there; the Podfile only reads podfile properties).
- Building from source then hits fmt 11.0.2 consteval errors under Apple Clang 21 (Xcode 26.x) — known ecosystem issue (facebook/react-native#55601). A `FMT_USE_CONSTEVAL=0` preprocessor define CANNOT fix it (fmt's header guard redefines the macro unconditionally). Working fix: compile only the fmt pod as C++17 (`plugins/withFmtConstevalFix.js`), and the patch must be inserted AFTER `react_native_post_install`, which resets CLANG_CXX_LANGUAGE_STANDARD to c++20 on every pod target. Remove both plugins when RN ≥ 0.83.9 / SDK 56 (bundles fmt 12).
- Cost accepted: clean iOS builds go from ~2 min (prebuilt) to ~15-25 min (from source). EAS builds inherit the plugins automatically.
- vectors.db (op-sqlite + sqlite-vec, rowid = ayah id, 384-dim MiniLM) is a separate file from quran.db (expo-sqlite) by constitutional design; VectorStore interface has a brute-force cosine memory implementation so all Tier B logic stays testable without native code.

## 2026-07-13 — llama.rn lands cleanly on the from-source stack

- llama.rn 0.12.6 (MIT) added after op-sqlite: pods + codegen + xcodebuild green with no extra patches once RN builds from source. Full E9 native stack (op-sqlite 17.1.2 + sqlite-vec + llama.rn) now compiles; smoke flow green on the new binary.
- `llamaRuntime.ts` adapts llama.rn to the tested LlmRuntime contract (n_ctx 2048, temperature 0.2 — faithful paraphrase, not creativity; Metal via n_gpu_layers with CPU fallback). Model files remain download-only artifacts (model.lock, BLOCKERS A) — nothing bundled.
- E9 remaining is model-blocked: verse-embedding generation, on-device inference checks, and Tier B end-to-end. UI (TierBCard) and vector store are built and tested; AskScreen wiring stays dormant behind gate 7.

## 2026-07-13 — FlashList scroll pass + Maestro hang root-cause

- All five scrolling lists migrated FlatList -> @shopify/flash-list v2 (SurahList, SurahScreen ayahs, LibraryScreen, WorkReader, CityPickerModal). v2 is JS-only on the new architecture — no pod install, no native rebuild; dropped now-unneeded FlatList perf props (initialNumToRender, onScrollToIndexFailed). Added `@shopify/flash-list` to jest transformIgnorePatterns (ships untranspiled `import` in dist). All 5 verified live on-device (smoke: SurahList+SurahScreen; onboarding: CityPicker; libcheck flow: LibraryScreen+WorkReader); 339 tests green.
- Maestro "2-hour hang" root-caused (NOT the app, NOT FlashList): the iOS Simulator had been booted ~16.5h with dozens of installs; its accessibility service degraded and the XCUITest driver began returning HTTP 500 `kAXErrorInvalidUIElement` on `viewHierarchy`, then the failure-screenshot call to the same wedged driver never returned, freezing the JVM. Three runs (13:58/15:29/19:11) all died at the identical `ScreenshotUtils.takeScreenshot` line; earlier runs cleaned up normally. A sim reboot (`simctl shutdown`+`boot`) fully cleared it — onboarding/smoke/ask/libcheck all green afterward on the same code.
- PROCESS FIX (adopted): every Maestro invocation now runs foreground-bounded with an in-shell watchdog (`( sleep N; pkill -9 -f maestro.cli.AppKt ) &`) so a wedged driver fails in <200s instead of hanging. NEVER wrap Maestro waits in unbounded `until ...; do sleep; done` background loops — those spun for hours after the driver wedged. When a viewHierarchy/kAXError signature appears, reboot the sim before retrying rather than re-running into the same wedged driver.

## 2026-07-13 — Accessibility audits: Dynamic Type + RTL (both pass, no fixes)

- Dynamic Type: audited at `content_size accessibility-extra-large`. The app-wide `maxFontSizeMultiplier: 1.4` cap plus flex layouts hold — Today (countdown + rows), Ask (new Quran/Books toggle), Tips (longest body copy wraps + card grows), Zakat (label column wraps e.g. "Business inventory & assets" while value fields stay right-aligned at fixed width). No clipping/overlap. No code changes needed.
- RTL: switched to Arabic via the picker (bilingual restart Alert -> reloadAsync). Verified correct mirroring on the screens added since the E1 RTL pass: Ask source toggle (Quran/Books reverse order, selected chip on the right), SurahAudioBar (play button moves to the right, "Listen"/caption + "not recitation" dev badge right-aligned, English translation correctly stays LTR inside the RTL page), plus Today/More/restart-dialog. Reset back to English afterward.
- Maestro selector gotchas logged for future RTL runs: (1) tab labels localize, so match by Arabic label or tap by position — and the tab ORDER reverses (More is far-left, Today far-right in RTL); (2) the bilingual restart button's accessibility string is current-language-first, so `Restart now.*` matches only when English is current — use `.*Restart now.*` (or tap by position) when Arabic is current; (3) `Restart.*` is ambiguous (matches the "Restart required" title) — use `Restart now`.

## 2026-07-14 — Dual-SQLite collapse: op-sqlite removed, precompiled RN restored (research Rec #1)

- Acting on the pre-launch research pass: SDK 54's `expo-sqlite` bundles the `sqlite-vec` xcframework and loads it via `bundledExtensions['sqlite-vec']` + `loadExtensionAsync` (enabled with the `withSQLiteVecExtension` config-plugin flag; verified in the installed expo-sqlite 16.0.10). This makes `@op-engineering/op-sqlite` unnecessary — the vector store (`vectorStore.ts`) now runs on the SAME expo-sqlite stack as the content DBs, in its own `vectors.db` file, via `createExpoSqliteVectorStore()`.
- Removing op-sqlite removed the reason RN had to build from source (op-sqlite referenced React internals the SDK-54 prebuilt core doesn't export → the `Sealable` link error). With it gone, `plugins/withRNFromSource.js` and `plugins/withFmtConstevalFix.js` were DELETED and precompiled RN is restored (`Building from source: false`). The fmt-11/Clang-21 consteval patch is moot once nothing builds fmt from source.
- Net: one fewer native dependency, two fewer build patches, no dual-SQLite risk, and clean iOS builds return toward the fast prebuilt path. llama.rn is retained (the only remaining extra native module); Tier B stays gated OFF and model-blocked. On-device vector-query validation remains a physical-device task (unchanged — it was never simulator-validatable).
- Embedding note (recommendation, NOT yet baked in): the research recommends multilingual-e5-small (MIT, 384-dim — same dimension as all-MiniLM-L6-v2, so `EMBEDDING_DIM` would be unchanged) over the English-only MiniLM for Arabic+English recall. `model.lock` is left as-is (all PENDING-UPLOAD); swap the pinned embedding artifact when embeddings are actually generated + uploaded (BLOCKERS A), with owner awareness.
