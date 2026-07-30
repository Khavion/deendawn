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

## 2026-07-14 — Ed25519 signed-model-manifest verifier (research Rec #8)

- Honest scoping first: `model.lock`'s in-binary SHA-256 already makes downloads integrity-AND-authenticity-safe for the CURRENT design (a compromised R2 can't substitute a different file with the same hash baked into the app). So Ed25519 signing is NOT needed to protect today's fixed model set.
- What it DOES add (the reason to build it): a `verifyManifest()` (tweetnacl, pure JS, Hermes-safe) that authenticates a manifest fetched from R2, so the downloadable model set can be updated/rotated post-launch WITHOUT an app release, without ever trusting the bucket. `manifestToArtifacts()` maps a verified manifest straight into the existing `ensureArtifact` flow.
- Fails closed: placeholder `EMBEDDED_PUBLIC_KEY = 'PENDING-KEYGEN'` → every verify returns null until the real keypair is generated (private key offline, public key embedded) alongside the model upload (BLOCKERS A). Rejects tampering, wrong-key, malformed base64, structural violations, absolute/`..` paths, and re-serialized bytes (the signed bytes must be presented verbatim). 10 tests.
- Dormant like the rest of Tier B; nothing fetches a manifest yet.

## 2026-07-14 — Tajweed color-coding (research Rec #2)

- Data source: cpfair/quran-tajweed rule trees (CC BY 4.0). Its PRECOMPUTED offsets are keyed to a 2017 Tanzil snapshot; verified against our quran.db they mis-anchor 2.58% of hamzat-wasl marks (Tanzil encoding drifted) — unacceptable for scripture. So I did NOT use their offsets: I ran their deterministic classifier (`tajweed_classifier.py` + `rule_trees/`, pure Python stdlib) against OUR pinned Tanzil Uthmani text, which produces annotations aligned to our text by construction. Re-verified: 0 order mismatches, 0 out-of-bounds, 0 hamzat-wasl/lam-shamsiyyah semantic mismatches across all 6236 ayahs and 60,024 annotations.
- Stored compactly (723 KB) at `assets/tajweed.json` with a provenance header (classifier commit 496f71c, CC BY 4.0, run date). NOT sacred source text (derived annotations), so it lives outside quran.db and content.lock; its integrity gate is a GOLDEN TEST that re-verifies every span against quran.db (bounds + semantic anchors) on every commit — stronger than a hash because it catches text/data drift, not just byte changes.
- Rendering: `toColoredRuns` (pure, tested) assigns each codepoint the highest-priority rule color then coalesces runs; the reader renders runs as nested `<Text>` color spans inside one parent `<Text>`, which preserves Arabic shaping/ligatures (verified on-device — ligatures intact across color boundaries). Colors in `tokens.tajweedColors` (light/dark).
- GATE: rule→color mapping + precedence are religious-presentation choices → flagged SCHOLAR_REVIEW. Feature ships OFF: `TAJWEED_ENABLED = __DEV__`, watermarked "draft, pending scholarly review", with a CC BY credit at point of use. Flip to a plain user setting after sign-off. Constitution-safe: no AI authored any tajweed data; detection is cpfair's published classifier, colors are a presentation layer.

## 2026-07-14 — Prayer widget: app-side built + tested, native staged (research Rec #3/#12)

- The widget's data contract + "next prayer" logic live in `src/features/widget/widgetData.ts` (pure, 5 tests) — the single source of truth the SwiftUI TimelineProvider mirrors.
- The native target (SwiftUI widget, @bacons/apple-targets config, App Group, the one write call site) is fully written up in docs/WIDGET.md but NOT wired into the build. Rationale: a widget is an app-extension target whose defining behaviors (Home Screen presence, timeline refresh across prayer boundaries) cannot be validated in the simulator via automation, and adding an unverifiable native extension + App Group entitlement would risk the freshly-simplified precompiled build. Staged for a short pass during the device/TestFlight phase. Owner note logged: the widget adds an App Group entitlement + an extension target to the App Store submission (not privacy-affecting, not a Human Gate).

## 2026-07-14 — Khavion brand design system (supersedes lapis/warm-editorial)

- Owner directive: rebuild the visual system from the Khavion brand (display name "Deen Dawn", publisher "Khavion Apps"). Reference HTML (design/reference/khavion-site.html) was NOT in the repo — owner confirmed (via AskUserQuestion) to proceed with the brief's explicit tokens and derive the Latin type scale. Also confirmed: rebuild in place at `src/lib/theme/` (not a new `src/theme/`) so the 17 existing token consumers keep working with zero import churn.
- Palette: forest-green PRIMARY + bronze/gold ACCENT on warm-ivory/cool-near-black (see docs/DESIGN.md). Mapped onto the existing token keys — `accent` = primary green (what consumers already use as the dominant color), `ochre` = bronze accent — so re-valuing propagated app-wide for free; added `primary`/`onPrimary`/`primarySoft` aliases for the new primitives. 24 WCAG contrast tests pass.
- Fonts: Latin swapped to Newsreader (display) + Public Sans (UI) via @expo-google-fonts, loaded alongside the unchanged Amiri/Nastaliq. Because ThemedText reads `fonts.serif`/`fonts.sans`, remapping those two propagated the new faces everywhere. Literata/Source Sans assets remain in assets/fonts (content-pipeline artifacts, in content.lock) but are no longer loaded — candidate for a future pipeline removal (touching content.lock is guarded, so left in place).
- Radii 12/8 → 8/6. Type scale re-based (display 32, title 22, body 16). `AppThemeProvider` + `useTheme` add a persisted system/light/dark/night preference; useTokens follows it; nav chrome derives from the resolved mode.
- New primitives in `src/components/ui/` (Screen, AppText, Button, Card, Divider). Dev-only theme-preview verified on iOS in all three themes.
- App display name set to "Deen Dawn" (owner-directed — the app-name Human Gate is satisfied by the direct instruction); slug `deendawn` and bundle/package IDs unchanged. "A Khavion Apps product" added to About (×3 locales).
- NOT done this pass (deliberately, to keep commits small): mechanically swapping ThemedText→AppText across every existing screen — they already render the new palette + fonts through the tokens.

## 2026-07-14 — ThemedText → AppText migration (completes the design system)

- Owner directive: do the full AppText migration across all screens. Swapped the legacy template `ThemedText` for the Khavion `AppText` across all 19 feature screens, then deleted `components/themed-text.tsx` (zero importers remain) so there is ONE Latin text primitive.
- The 6-variant AppText couldn't express four `ThemedText` faces still in use (defaultSemiBold ×35, serifBody ×20, subtitle ×10, link ×5). Rather than map them lossily to the 6 (which would force inline font hardcoding at ~70 call sites — forbidden by the tokens-first rule), I added them to `latinType` + AppText as named variants: `bodyStrong`, `reading`, `subtitle`, `link`. Their metrics are the EXACT values those ThemedText styles already used — not new values — so the migration is visually non-regressive (the one intended change, title line-height 36→28, was already baked into the approved design system).
- `serifBody → reading` kept the editorial **Newsreader serif** for long-form content (Quran translations, philosopher work bodies, privacy/onboarding copy) rather than flattening to Public Sans. This resolves a doc inconsistency (DESIGN.md said "Public Sans for reading"; tokens.ts said "Newsreader … reading") in favor of serif-for-reading, matching the existing UX. Verified live: Al-Fatiha translation renders in Newsreader while the Arabic (Amiri, RTL, tashkeel, tajweed colors) is pixel-identical and untouched — it renders through its own Amiri components, never AppText.
- The one `lightColor/darkColor` call site (continue-reading chip) now uses the semantic `t.textOnAccent` token instead of two hardcoded hexes (`#fff`/`#10201A`).
- Verified on iOS sim: Today (dynamic `bodyStrong` bolds the next-prayer row correctly) + Quran reader (reading serif preserved, Arabic unchanged, green `link` toggle). tsc + expo lint + 392 tests green across 3 commits.

## 2026-07-14 — Screen-reader (VoiceOver/TalkBack) accessibility pass

- The last open accessibility item (audit v2 §9, DESIGN.md). Done at the code level in three commits; only actual on-device speech verification remains (added to TESTPLAN device pass — VoiceOver behavior can't be automated in the simulator).
- **Arabic pronunciation:** tagged the two Arabic surfaces (ayah in SurahScreen, surah name in SurahListScreen) with `accessibilityLanguage="ar"` so iOS VoiceOver uses the Arabic voice instead of spelling it in English. Only two surfaces — Ask/Calendar/Library render translations, not Arabic. Guarded against the shipped db bytes in unit tests.
- **Icon-only controls:** `IconSymbol` now hides its glyph from a11y (`accessibilityElementsHidden` + `importantForAccessibility="no"`) because every icon in this app is decorative (meaning carried by adjacent text or a labeled parent) — one change silences all decorative icons. The two genuinely icon-only buttons (bookmark ★/☆, calendar ‹/› arrows) got i18n'd `accessibilityLabel`s; the audio play/pause already had one.
- **States & values:** settings pickers + tasbih 33/99 targets announce `accessibilityState.selected`; settings toggles already use native `Switch` (accessible for free). The tasbih counter follows the name/value split — a stable `accessibilityLabel` plus `accessibilityValue={{now,min,max}}` — so VoiceOver re-announces the count on each tap (a value change re-announces; a label change does not). `tasbih.tapArea` was simplified to a stable name in all 3 locales.
- New a11y label keys (quran.bookmarkAdd/Remove, calendar.prevMonth/nextMonth) added in en/ur/ar; UR/AR machine-drafted under the blanket gate-8 `@draft` status. Not treated as new SCHOLAR items (UI chrome, not religious positions).

## 2026-07-14 — Rich design implementation (Direction 1c) — pure-JS, no native rebuild

- Owner delivered the approved design (Claude Design → "Deen Dawn Rich Screens"); source saved at docs/design-source/rich-screens.dc.html, spec at docs/RICH_DESIGN_SPEC.md, reference renders in docs/design-screens/. It's a faithful *evolution*: same palette/type/radii + soft depth, dawn-sky ambient gradients, a gold frame on the one featured card per screen, gold section rules.
- **Toolchain blocker (native rebuild unavailable):** this machine has no CocoaPods-compatible Ruby — Homebrew Ruby 4.0.1 crashes CocoaPods 1.16 (`unicode_normalize` gemified out); system Ruby 2.6.10 is too old (CocoaPods' `ffi` needs Ruby 3.0+). No rbenv/rvm. Installing a Ruby 3.x is a machine-environment change, out of autonomous scope. So `pod install` / adding native modules is blocked until that's fixed. Logged for the owner (non-urgent — only matters when a native rebuild is next needed).
- **Decision: implement the whole Rich design with CORE React Native + pure-JS primitives**, no native modules — so it hot-reloads onto the current build and never blocks on the Ruby issue. `expo-linear-gradient`/`react-native-svg`/`expo-device` were installed then reverted; they become an optional smoothness upgrade later behind the same call sites.
  - `Gradient` (src/components/ui): a dependency-free linear gradient — interpolated color bands (src/lib/color.ts). Ships the signature dawn-sky gradient now; swap internals for expo-linear-gradient later without touching call sites.
  - Elevation = core RN `shadow*`/`elevation` (3-step scale in tokens; E3 featured card casts a green-tinted shadow). Gold frame + corner brackets = plain Views. Girih texture deferred (needs svg/an asset).
  - `useDeviceTier()` = the "sense the hardware" signal via a core-RN heuristic (density + size + Reduce Motion → radiant/smooth/essential); expo-device can refine it later. Reduce Motion forces essential; `flat` flattens gradients + drops corners.
  - `useThemeMode()` added (graceful mode with system fallback, mirrors useTokens) so rich screens/primitives don't force every test to wrap in AppThemeProvider.
- Home (hero) done first end-to-end and verified live on iOS: period eyebrow, ambient period gradient (currentPeriod logic, tested), gold-framed green-gradient countdown card, gold section rule, elevated prayer-list card with a gold-accented next row. 397 tests green.

## 2026-07-21 — EAS Build/Submit pipeline configured (TestFlight near-one-click)

- Perpetual-mandate item (a): make the TestFlight path near-one-click. Added `eas.json` at repo root (there was none) with three build profiles + a submit profile. Config-only; no native rebuild, so the Ruby/CocoaPods blocker (2026-07-14) is irrelevant — EAS builds run on Expo's cloud machines which prebuild from scratch.
- **`appVersionSource: "remote"`** (EAS-owned build numbers, the recommended default since EAS CLI 12.0.0). Chosen over `local` because `/ios` and `/android` are gitignored (generated via prebuild), so there is no committed native version to be the source of truth, and `autoIncrement` on the `production` profile then works with zero commit friction in CI. Consequence: intentionally did NOT add `ios.buildNumber`/`android.versionCode` to app.json — under remote they are ignored/confusing (only an initial seed). app.json's gated brand/bundle config left untouched.
- **Profiles:** `development` (dev client, internal, `ios.simulator: true` → a no-Apple-credentials simulator build for local checks); `preview` (internal distribution, ad-hoc device testing); `production` (store/TestFlight, `autoIncrement: true`).
- **Submit stays a controlled step, not blocked:** `submit.production.ios` carries a clearly-marked `ascAppId` placeholder (the numeric App Store Connect app id is only known after the gated app-record creation). The API key itself is never in the repo — EAS Submit auto-reads `EXPO_ASC_KEY_ID`/`EXPO_ASC_ISSUER_ID`/`EXPO_ASC_API_KEY_PATH` from the environment. Documented those (aliased to the constitution's `ASC_*` names) plus a headless `EXPO_TOKEN` in `.env.example`. Per the constitution's Human Gates, uploading builds to **TestFlight internal is allowed autonomously**; only external TestFlight + App Review submission are gated — so once keys land I build + submit to internal without waiting.
- Did NOT add `eas-cli` as a dependency (it's a build-time CLI run via `npx eas-cli@latest` / global install; keeps the app's dep tree lean). No `channel`/EAS Update config yet — expo-updates is installed but OTA isn't set up; adding it is a separate future task, and builds don't need it.
- No secrets touched; `.gitignore` already covers `*.p8`/`.env`. Rewrote `docs/BLOCKERS.md` into the mandated ranked "WHAT NEEDS YOU" shape with the full Apple Developer + ASC API-key click-by-click as item #1.

## 2026-07-21 — Rich design (Direction 1c) step 3: five more screens

- Extended the Home rich pattern to Zakat, Calendar, Tasbih, Quran list, and More per RICH_DESIGN_SPEC build order 3, reusing the pure-JS primitives (GoldFrameCard/Gradient/SectionRule/PeriodEyebrow) proven on TodayScreen — no native modules, so the Ruby/CocoaPods native-rebuild blocker stays irrelevant. Every effect gated by `useDeviceTier().flat` (essential tier / Reduce Motion gets flat fills, no shadows, no brackets).
- "One featured element per screen" resolved as: Zakat total (gradient gold card), Quran continue-reading (gradient gold card, Pressable-wrapped since GoldFrameCard renders a non-pressable View), More privacy note (non-gradient gold card). Calendar + Tasbih have no rectangular hero, so they use elevation + a signature accent instead (Tasbih: tier-gated ring completion glow; Calendar: elevated grid) rather than forcing a gold card — matches the spec's per-screen treatment.
- **Legacy theme retirement:** SurahListScreen and MoreScreen (incl. its PickerModal) were the last screens on the old ThemedView/Colors[scheme]/useColorScheme path; migrated to useTokens()/useThemeMode/useDeviceTier so the whole app now reads one token source. Raw px replaced with spacing/radius tokens in the touched styles.
- New i18n key `quran.surahsSection` (gold header rule label) — UI chrome, English ships freely; ur/ar added as gate-8 machine drafts alongside the existing draft strings (key-parity test enforces all three).
- Reverence hold verified: no gradient/texture placed over Quranic/Arabic surfaces; surah Arabic names remain untouched and accessibilityLanguage-tagged. FlashList surah/search rows sit inside an elevated card container (the list stays virtualized; the card is a bordered wrapper, not per-row).

## 2026-07-21 — Rich design step 4: Reader + Qibla (reverence-restrained)

- The two spec-designated "quiet" screens. Guiding rule: reverence (spec element #6) — nothing decorative may touch Quranic/Arabic content, so the featured treatment goes on the surrounding CONTROLS, never the ayat.
- **Reader:** the audio player is the ONE featured card (spec: "only the audio player is the featured gold-framed card"). Implemented by making `SurahAudioBar`'s outer container a `GoldFrameCard` (gold frame + corner brackets + e3). The ayah blocks and their hairline separators are left exactly as they were — calm, undecorated. Verified live: gold-framed Listen card over untouched Uthmani text.
- **GoldFrameCard `mode` prop:** the reader themes locally via `useTokens(nightWarm ? 'nightWarm' : ...)`, but GoldFrameCard read the *app* mode — so in night-warm the frame color/elevation would mismatch. Added an optional `mode?: ThemeMode` prop (defaults to app mode, fully backward-compatible) that the audio card passes through. Small reusable primitive improvement.
- **Qibla:** "dial featured but restrained." Chose elevation over ornament — the compass ring gets `bgSurface` + tier-gated `elevation.e2` so it reads as an elevated disc, with NO gradient and NO gold corner brackets (those would be too loud for a worship-facing surface). Aligned state still swaps to accentSoft+success. Caveat/calibration chips adopt the gold-left-border pattern for consistency with the Calendar/Zakat disclaimers.
- Both verified on the iOS Simulator; all existing testIDs, a11y, and haptics semantics preserved; 397/397 green.

## 2026-07-21 — Rich design step 5: motion / haptics / skeletons (all pure-JS)

- **Reanimated deliberately NOT used.** react-native-reanimated ~4.1 is in package.json and side-effect-imported in app/_layout.tsx, but there is NO babel.config.js wiring `react-native-worklets/plugin`, and zero Reanimated hooks are used anywhere. Reanimated 4 worklets would fail/silently-degrade without that Babel config, and adding it is a config prerequisite + cache-clear that cuts against the "no native rebuild" constraint. So all step-5 motion uses the built-in React Native `Animated` API on the native driver (transform/opacity only) — no plugin, no rebuild. Mirrors the earlier dependency-free `Gradient` decision. If we later want spring-based shared-axis transitions, adding the babel plugin + verifying a rebuild is the gate.
- **Haptics gated on Reduce Motion, not the device tier.** `useHaptics()` silences verbs only under Reduce Motion (which also forces the essential tier). Rationale: haptics are physical, not visual jank — even an essential-tier phone has a taptic engine and users expect touch feedback. Gating on the full `flat` signal would have (a) removed feedback on low-end phones and (b) broken the tasbih/qibla haptic call-count tests (which render at whatever tier jest resolves). Reduce Motion is the correct accessibility gate.
- **Haptic vocabulary:** press (Light impact) · detent (Medium impact) · select (selection) · success (Success notif) · warning (Warning notif). Maps the three prior ad-hoc sites 1:1 (tab press, tasbih select/detent/success, qibla select+success) so behavior — and the tests asserting exact call counts — is unchanged.
- **Press-scale** to 0.97 over `duration.fast`, disabled on essential/Reduce-Motion. Lives in a reusable `usePressScale` hook so any Pressable can adopt it; wired into Button first. Button keeps its Pressable as the outer accessibility node (Animated.View only wraps the label) so role/text/disabled behavior and its by-text tests are unaffected.
- **Skeleton** breathes via opacity pulse (`duration.slow`) on capable tiers, static muted fill on essential/Reduce-Motion; a11y-hidden. Used for the Tips loading state (three pills matching the real buttons). Audio's small buffering spinner intentionally left as ActivityIndicator — it's a transient buffer indicator inside a button, not a content-shaped load.
- **Tab bar theming fix:** was reading `Colors[useColorScheme()]` (raw OS appearance; `Colors` has only light/dark, no night-warm) → a manual theme override left the tab tint wrong. Now `useTokens()` (active=accent, inactive=icon, bg=bgSurface, border=border), matching every other screen and fixing night-warm. Same latent legacy-`useColorScheme` pattern still exists in CityPickerModal and components/ui/collapsible.tsx — logged for a later cleanup, not in this scope.

## 2026-07-21 — Recitation audio plan (deep-research) + book-reader deep-link scroll

- **Book-reader section deep-link scroll:** WorkReaderScreen had the same "opens at the top" bug the Quran reader had — Ask/Library section deep-links (`/work/:id?section=N`) landed at the top because `initialScrollIndex` estimates variable-height section bodies and overshoots. Applied the identical fix: FlashList ref + `scrollToIndex(index, animated:false)` in `onLoad` (the list only mounts once sections load behind the skeleton `loaded` flag, so the index is exact); dropped `initialScrollIndex`. Verified live on iOS (`deendawn://work/1?section=8` → section 8 at top).
- **Recitation audio (BLOCKERS #5 / Human Gate 5):** deep-research concluded NO full-Quran recitation set carries an explicit written license clearly covering a commercial-adjacent (tip-jar) free app. Decisions:
  - **Chosen source: QUL (qul.tarteel.ai)** — the only source with a written commercial-use statement (per-resource terms still to be confirmed) AND it bundles ayah-level segment/timestamp data (JSON+SQLite; per-surah gapless 114 files + per-ayah gapped 6236 files; ms timings for 59 reciters) needed for ayah highlighting.
  - **Chosen reciter: Sheikh Mahmoud al-Husary (Hafs, murattal)**, fallback **Abdul Basit**. RULED OUT: Mishary Alafasy (disallows free use); live radio streams (no relay permission + violates the no-third-party-domain privacy invariant).
  - **Delivery:** per-surah gapless audio + QUL segment timings for smooth playback with accurate highlighting; per-ayah files kept as a "repeat this ayah" fallback. Self-host on R2 (existing plan; no new outbound domain). expo-audio streams HTTPS with range requests; `useAudioPlayerStatus().currentTime` drives ayah highlighting.
  - **Gate:** do NOT ship real recitation until (a) the chosen recording's specific QUL license is read/confirmed and (b) a one-line written permission is on file. Drafted the permission email at `docs/AUDIO_PERMISSION_EMAIL.md` for the owner to send (sending is owner's call). Listen feature stays on the honest stand-in tone meanwhile.

## 2026-07-21 — Publication prep (both stores) + current-rules research

- Owner directed: publish (without recitation) so people can download it and see it's free / no data collection. Actual publication stays a Human Gate (developer accounts + final submit sign-off); everything else prepped to near-one-click.
- **Publishing-rules research (verified 2026):** Apple = $99/yr, no tester gate, ~1–2 day review → **fastest public path (~1–3 days)**. Google Play new **personal** account = $25 once but must run a **12-tester × 14-continuous-day** closed test before production (~2–4 weeks); **organization** account (needs free D-U-N-S) is exempt. Decision: recommend **Apple first**, Android optional via the organization route. Documented in BLOCKERS #1/#1b.
- **Android permissions trimmed for privacy + Play review:** `app.json` → `android.blockedPermissions` removes RECORD_AUDIO (microphone — we only play), SYSTEM_ALERT_WINDOW (draw-over-apps), READ/WRITE_EXTERNAL_STORAGE. Verified via `expo prebuild -p android` that the merged manifest marks them `tools:node="remove"`; store build ships only INTERNET, ACCESS_FINE/COARSE_LOCATION, MODIFY_AUDIO_SETTINGS, VIBRATE. Keeps the "no data collected" Data Safety story clean.
- **eas.json:** added `submit.production.android` (serviceAccountKeyPath placeholder, track `internal`) alongside the iOS submit block.
- **Brand name reconciled:** store name.txt "DeenDawn" → "Deen Dawn" (matches app.json display name + constitution); description body "DeenDawn" → "Deen Dawn".
- **Web pages written** (`docs/legal/privacy-policy.html`, `support.html`) — ready to host (GitHub Pages / Netlify Drop), one email placeholder each. Publishing them is the owner's call.
- **Play listing prepped:** `fastlane/metadata/android/en-US/` (title 25c, short 72c, full ~1.9k) + `docs/store/PLAY_LISTING.md` (Data Safety = No data collected, content rating, target-API note, asset requirements).
- **Kept `supportsTablet: true`** (no reduction of reach) — means the App Store listing also needs iPad screenshots; I'll capture both iPhone 6.9" and iPad sizes in the screenshot pass rather than dropping iPad support.
- **Screenshots:** current fastlane shots are the wrong size (1206×2622); Apple needs 6.9" (1320×2868). Final store screenshots should come from a badge-free RELEASE build; I can capture the badge-free screens (Today/Qibla/Calendar/Tasbih/Zakat/Quran-list) now from the dev build since DEV badges are Quran-reader-only.

## 2026-07-29 — Personal store accounts + ZERO monetization (owner decision, supersedes prior monetization + account-type plans)

**Owner decision, made after being shown the trade-offs twice and reaffirming both times.** Publish
under **personal/individual** developer accounts on both stores, and remove **all** monetization.
Constitution rule 3 amended accordingly; the earlier "tip jar is the only revenue surface" rule is
void.

**What was verified before deciding** (Apple/Google primary sources, 2026-07-29):
- Apple forces an individual enrollment's public seller name to the enrollee's **legal personal
  name**; trade names ("Khavion Apps") are organization-only, and the name is set once at first
  app-record creation and is not editable afterwards. Escape hatches are unreliable: a Jan-2026
  forum report says an individual→organization conversion left the personal name in place, and the
  fallback (app transfer to a second account) permanently destroys promo-code generation.
- Google publishes a personal developer's **full address** only for "merchant" accounts, i.e. those
  monetizing via paid apps or IAP — and personal-account verification rejects PO boxes / virtual
  offices. **Removing the tip jar is therefore what keeps the owner's home address off the listing.**
- Google's **12-tester × 14-continuous-day** closed-test gate applies to all personal accounts
  created after 2023-11-13, regardless of monetization. It does NOT go away by dropping the tip jar;
  it is now the long pole on Android (~3 weeks from account creation).
- With zero monetization the app declares **non-trader** under the EU DSA, so Apple publishes no
  address or phone on EU product pages. (Non-trader apps stay in the EU; users see a notice that EU
  consumer-protection rules don't apply. Only *failing to declare* causes EU removal.)

**Trade-offs the owner explicitly accepted:** legal name public on the App Store permanently; no
revenue from this app ever; re-adding any purchase surface later would republish the home address on
Play and is treated as a one-way door.

**Implementation:** deleted `app/tips.tsx`, `src/features/tips/**`, `e2e/tips.yaml`, the
`react-native-purchases` dependency, `REVENUECAT_IOS_KEY`, and the `tips`/`more.tips` keys in all
three locales (surgical line-range deletion, not a JSON re-serialize, to avoid touching Arabic/Urdu
bytes — rule 1). Store copy, review notes, privacy answers and PLAY_LISTING updated to state there
are no purchases. 412 tests green (was 423; the 11 tip tests went with the feature).

**Kept deliberately:** `fastlane/metadata/copyright.txt` still reads "2026 Khavion LLC" — the LLC can
own the copyright regardless of who holds the store account, and Apple does not verify that field.
Flagged to the owner; trivial to change to his personal name if he prefers them to match.

**⚠️ Two earlier decisions were justified by "the tip jar makes us commercial-adjacent" and that
premise is now false. Both need re-checking — neither is assumed reversed:**
1. **Recitation audio (2026-07-21, above):** Mishary Alafasy and other non-commercial-only sets were
   ruled out on commercial grounds. A free, ad-free, revenue-free app is a materially stronger
   non-commercial claim. Re-run that research; written permission is still required either way.
   Flagged in BLOCKERS #5.
2. **Word-by-word Quran data (2026-07-12, top of this file):** QUL/hablullah WBW is CC BY-NC-**ND**.
   The **NC** objection is resolved by zero monetization, but **ND** (no derivatives) independently
   blocks building a restructured/indexed database from it, so the conclusion probably still stands.
   Re-read the licence before acting; do not assume either way.

## 2026-07-29 — eslint: Node globals for the Node-only directories (lint gate was red on main)

`npx eslint .` had been failing with 9 `'Buffer' is not defined` (`no-undef`) errors across
`content-pipeline/{build,fetch,verify}.mjs` and `scripts/{dev-audio-server,generate-placeholder-sounds}.mjs`
— pre-existing, present at 9e3d787 and earlier, so the constitution's per-commit `eslint` gate was
technically red.

Cause: `eslint-config-expo/flat` grants Node globals to `**/metro.config.js` **only**; every other
file gets the browser/RN global set (1175 keys, no `Buffer`). Our pipeline and scripts run under
Node, not the RN runtime.

Fix: a scoped flat-config override giving `scripts/**` and `content-pipeline/**` (`.js`/`.mjs`/`.cjs`)
`globals.node`. Rejected alternatives: file-level `eslint-disable` comments (hides the class of bug
in files that legitimately use Node APIs) and relaxing `no-undef` globally (loses the rule
everywhere).

- `globals` promoted from a transitive dep to an explicit devDependency, pinned `^14.0.0` to match
  the version already resolved in the tree so it dedupes rather than adding a second copy.
- Scoping verified in both directions with throwaway probe files: a `.mjs` **outside** the globs
  still errors on `Buffer`; the same file **inside** `scripts/` passes. Probes deleted.
- Note `no-undef` is `off` for `**/*.ts(x)` in the expo config (typescript-eslint's standard
  posture — TS catches undefined identifiers itself), so a `.ts` probe proves nothing here.

Result: eslint 0 errors / 6 warnings (the 6 are pre-existing and unchanged), tsc clean, 412 tests green.

## 2026-07-29 — iOS perfection Phase 0: toolchain re-proven + pre-upgrade config wins

- **CocoaPods works again on this machine.** `npx expo prebuild --clean -p ios` + `pod install`
  succeeded end-to-end (Homebrew cocoapods 1.16.2_2 bundles its own gem home; the July-14
  Ruby-4/unicode_normalize breakage no longer reproduces). The 2026-07-14 "native rebuild blocked"
  constraint is lifted; the stale `ios/` tree (which still contained RevenueCat pods and placeholder
  purpose strings) was regenerated from scratch.
- **Purpose-string fix at the plugin level, not infoPlist:** expo-audio and expo-location inject
  placeholder `NSMicrophoneUsageDescription` / `NSLocationAlways*` strings by default — an App Review
  5.1.1(ii) rejection vector for permissions we don't use. Disabled via plugin config
  (`microphonePermission: false`, `locationAlwaysPermission: false`,
  `locationAlwaysAndWhenInUsePermission: false`). Verified gone from the generated Info.plist; only
  the real when-in-use sentence remains.
- **Locales declared:** `CFBundleLocalizations [en, ur, ar]` + `CFBundleAllowMixedLocalizations` —
  without this iOS can silently refuse RTL layout for ar/ur (the app supports both). This was the
  single highest-value missing config key.
- **deploymentTarget 16.4** via expo-build-properties (was unset → SDK 54's 15.1 floor). Matches
  Expo's current floor and the planned SDK 57 minimum; verified in the generated pbxproj.
- **Privacy manifest: no `ios.privacyManifests` needed.** RN's pod install auto-generates
  `PrivacyInfo.xcprivacy` with all four required-reason categories (FileTimestamp, UserDefaults,
  DiskSpace, SystemBootTime) aggregated from pods. Our own code calls none of those APIs directly.
  Re-check if a future dependency adds one.
- **Splash controlled + tokened:** `preventAutoHideAsync` at module scope, `hideAsync` when the
  navigation subtree mounts (fonts + quran.db Suspense both resolved), 200ms fade. Splash bg colors
  moved off pure white/black to the canvas tokens (`#F7F6F2` / `#15181D`) — pure black violated the
  app's own halation rule.

## 2026-07-30 — Post-session ultra review: 9 confirmed findings, all resolved

An 8-dimension multi-agent review of the session diff (every finding adversarially verified by two
independent lenses; 12 raw → 9 confirmed / 3 plausible / 0 fabricated) caught real residue:
- **Tasbih counts could be silently dropped** — the new ScrollView's pan recognizer cancels
  in-flight ring presses after ~10pt of finger travel. Fixed: the screen scrolls ONLY when content
  actually overflows (onLayout/onContentSizeChange gate + no bounce); static and press-safe at
  default sizes, scrollable at large type where it's needed.
- **The reader's own verse rows missed the FlashList RTL fix** (footer row LTR under ar/ur) — the
  one virtualized list the c9dd7eb pass skipped. Fixed with listCellDirection().
- **SectionRule's RTL stop-reversal was a latent double-flip** — the band row already mirrors
  natively (which is why the ar evidence looked right: the JS reversal never actually ran, being
  keyed on the stale isRTL constant). Reversal removed; native mirroring is the mechanism.
- Ask + Library headers now share the 640pt measure with their lists on iPad (banner/input no
  longer span wider than the column they feed); Bookmarks re-reads the reader text-size pref on
  focus (it stays mounted under the reader).
- Coverage: AppPressable gained direct regression tests (plain-Pressable layout preservation — the
  52883bb class — and haptic gating) and listCellDirection a unit test. 432 tests.
- Plausible-tier items handled as docs: Android inset fallback tracked in TODO; evidence-sweep
  scripts' silent-failure caveat in their README; the appearance plugin's verification method
  remains prebuild + pbxproj/file grep (each prebuild exercises it; no jest harness exists for
  dangerous-mods worth the maintenance).

## 2026-07-30 — Performance numbers (Phase 10) + brand assets (Phase 11)

- **Cold start**: ~1.8s app-attributable to first meaningful paint (median 2.05s measured minus
  ~0.25s per-poll screenshot overhead; 3 runs, RELEASE build, iPhone 17 sim, pixel-probe on the
  featured card region — method in scripts/evidence-sweep/README). xctrace App Launch hung against
  this simulator twice and was abandoned. The constitution's "<2s on iPhone 12-class" stays a
  device-pass item (sims aren't hardware-honest); the sim number plus the controlled splash
  (no blank frames) is the pre-device evidence.
- **Binary**: unsigned device archive .app = **66.4MB** (JS bundle 6.0MB, assets 9.6MB) — under
  the 100MB budget before App Store compression/thinning. Scheduling <500ms: enforced by the
  existing scheduler test. 60fps scroll: TESTPLAN device pass (sim GPU ≠ device GPU).
- **Brand assets**: the app had shipped the Expo TEMPLATE icon and splash unnoticed. New identity:
  gold dawn (half-sun + horizon + concentric arcs) on forest green, from the token palette;
  light/dark/tinted via `ios.icon`; splash = the gold mark alone with true alpha. Tooling gotcha:
  qlmanage white-backs transparent SVG renders — opaque art survives it, transparent marks need
  Pillow (venv in scripts pipeline). SVG sources in assets/design-source/.

## 2026-07-30 — What the release-build evidence sweep caught (and dev spot-checks never would)

The Phase-9 sweep ran every screen on a RELEASE build across 8 devices × theme/type/locale cells
(205 archived captures, docs/screens/final/ + MANIFEST.md). Three real defects surfaced, all
invisible on dev builds:

1. **Animated Pressable wrappers drop caller layout styles on release.**
   `Animated.createAnimatedComponent(Pressable)` + an animated transform merged into a
   function-style lost `flexDirection` on every converted row. AppPressable is now a PLAIN
   Pressable with instant pressed-state feedback (native list-highlight idiom; state not motion,
   survives Reduce Motion); Button keeps its animated flourish on an inner Animated.View.
   **Rule: never wrap Pressable in createAnimatedComponent for shared primitives.**
2. **`aspectRatio` inside virtualized list cells explodes** (resolves against an indefinite size,
   fills the cell). Min-dims only inside FlashList rows; the tasbih ring (column context) keeps it.
3. **FlashList v2 cells do not inherit RTL.** Every virtualized row rendered LTR under ar/ur —
   and the historical RTL verification predated the FlatList→FlashList migration, so it was never
   caught. Fixed with an explicit `direction` on each renderItem root, derived from the app
   LANGUAGE (`src/lib/theme/direction.ts`) — the JS-side `I18nManager.isRTL` constant proved
   stale on the New Architecture while the native tree was already mirrored.

Also hardened the e2e layer for the current stack: NativeTabs selectors (plain labels, not the old
"X, tab, N of 5" regexes), a debounce-wait before city-row taps, and city selection via the return
key — which shipped as a real affordance (return picks the top match) because Maestro element taps
land offset inside iOS 26 native pageSheets. All five suites (smoke/ask/locales/offline/onboarding)
pass on the release build.

## 2026-07-29 — Feel: AppPressable everywhere, haptics as a user setting, theme picker

- **AppPressable** is the one interactive primitive (press-scale on the node itself so caller
  layout survives; asymmetric 80/140ms timing; opt-in haptic verb; Android ripple = the entire
  Android feel budget). All 41 dead Pressables converted. Haptic placement rule: verbs fire where a
  VALUE changes (steppers, toggles, stars, target/source/city/month/option selection), never on
  plain navigation — Apple's semantics, and it keeps lists quiet.
- **Haptics moved off the Reduce-Motion gate onto a user setting** (More ▸ Appearance & feel,
  default on). Motion is visual, haptics are physical — Apple treats them as separate accessibility
  choices; the old gate silenced feedback for exactly the users who may rely on it. Implementation:
  a module-level fire-time flag synced by SettingsProvider (instant app-wide effect, no re-render
  round trip, no per-fire storage read). `error` verb added; every Switch now ticks on toggle.
- **Theme picker shipped** (System / Light / Dark row in More): `setPref` finally has a shipping
  caller — it previously existed only in the dev-only theme-preview screen. Reader night-warm stays
  its own reader-scoped toggle (two competing "night" switches would confuse; the global nightWarm
  pref value remains dev-only). Nullable ThemeContext in MoreScreen keeps provider-less screen
  tests valid.
- **a11y tooling: BOTH named tools are era-incompatible; enforcement is handwritten.**
  eslint-plugin-react-native-a11y pins eslint ≤8 (repo runs 9 — adopting would force repo-wide
  legacy-peer-deps). react-native-accessibility-engine 3.2.0 was then trialed and REMOVED: it
  renders probes through react-test-renderer in ways React 19.2 rejects ("Can't access .root on
  unmounted test renderer") even after mocking its module-scope probe. The automated gate is
  instead: (a) the extended jest contrast suite (which caught a real dark-mode featured-card
  defect), (b) per-component label/role/state assertions across the suites, (c) the device
  VoiceOver pass in TESTPLAN. Re-evaluate both packages when they ship eslint-9 / React-19 support.
- New i18n keys (appearance/theme×4/haptics×2): en ships; ur/ar machine-drafted under the blanket
  gate-8 @draft status in TRANSLATION_REVIEW.md.

## 2026-07-29 — Dark-mode oscillation: root cause + fix (and an RN version-pin lesson)

- **Root cause (research, source-verified):** RN 0.86 recomputes the JS color scheme from whichever
  RN surface posted the trait-change notification (no key-window filtering, no changed-style check),
  so a second window in a different trait environment — the dev-only LogBox window qualifies —
  flips `useColorScheme()` between light/dark while the OS never changes. Unreported upstream; no
  fix in any 0.86.x. Full report: docs/reports/darkmode-oscillation-research.md; unposted upstream
  issue draft (Human Gate 2): docs/reports/rn-appearance-oscillation-issue-draft.md, BLOCKERS #9.
- **Fix, split by preference** (plan-review catch — blanket pinning would freeze system tracking):
  explicit prefs call `Appearance.setColorScheme('light'|'dark')` (nightWarm→dark), which in RN 0.86
  also sets `overrideUserInterfaceStyle` on every window so NATIVE chrome (tab bar/sheets/alerts)
  follows the app theme — fixing the latent "manual theme never moved native chrome" wart;
  `'system'` sets `'unspecified'` (RN 0.86's clear value; its old state-update bug was fixed
  upstream Feb 2026, pre-0.86-branch) so live OS tracking survives. Plus
  `plugins/withAppearanceHardening.js`: an ObjC `+load` calling the public
  `RCTUseKeyWindowForSystemStyle(YES)` so system-mode always derives from the key window.
- **RN patch versions are LOCKED on SDK 57's precompiled stack.** Bumping react-native 0.86.0→0.86.2
  ("hygiene") aborted at startup with a Fabric `ConcreteComponentDescriptor<ExpoViewShadowNode>::
  adopt()` assert inside the precompiled ExpoModulesCore XCFramework — built against 0.86.0
  headers. Reverted to 0.86.0. Rule: never bump the RN patch inside an SDK unless Expo ships
  matching prebuilts. (expo-router 57.0.8→57.0.9 kept — pure JS, carries the swipe-back flash fix.)

## 2026-07-29 — Dynamic Type: per-role caps + the deliberate exceptions

- `fontScaleCaps` (content 2.0 / heading 1.6 / label 1.4) replaces the global 1.4 cap. Content
  reaches Apple's 200% accessibility sizes; chrome scales less (HIG: prioritize content). iOS
  Fabric multiplies lineHeight with the font multiplier, so leading survives scaling.
- **Deliberate label-cap (1.4) exceptions on content-adjacent text**, each because the information
  is duplicated at full scale elsewhere or the element is a giant display numeral:
  - PeriodEyebrow ("Fajr · Dawn" status on Today) — the featured card repeats it at content scale.
  - Tasbih count numeral — 80pt base; 1.4 → 112pt stays enormous while keeping the ring circular
    (ring is now min-dims + aspectRatio so it grows instead of clipping).
  - Surah-list Arabic names + number badges — navigation chrome; the reader is the reading surface.
- Compound rule: reader A−/A+ × system Dynamic Type on Quranic text is clamped at
  `MAX_ARABIC_EFFECTIVE_SCALE` 2.6 (28pt base → ~73pt ceiling), in the reader AND bookmarks.
- Button labels now wrap instead of truncating (numberOfLines removed; minHeight grows).

## 2026-07-29 — Expo SDK 54 → 57 in one jump (owner pre-authorized; research-backed)

- **Why:** SDK 57 (RN 0.86) is the current SDK; 56 carries the one breaking change (expo-router
  forks React Navigation) and 57 adds none on top, so one jump = one migration. The upgrade's
  concrete win for this session: expo-router Native Tabs on a maintained API (alpha, stabilizing
  ~SDK 58), precompiled Expo modules (faster clean builds), and staying inside Expo's support
  window. System Liquid Glass (headers/sheets/alerts) was already free on Xcode 26 builds of 54.
- **The gate that made it safe:** llama.rn 0.12.8 had zero *reported* RN 0.86 issues but zero
  positive confirmation either — treated as the go/no-go. It compiled + registered + the app ran
  cleanly on both form factors. Full gates green (tsc/eslint/jest 412 + checksums/xcodebuild).
- **Reanimated removal REVERSED:** the plan (brief §2: "use it deliberately or remove it") assumed
  reanimated was removable dead weight. It is not removable — expo-router 57 hard-depends on it via
  react-native-drawer-layout. Kept at the SDK pin (4.5.0). "Use it deliberately" remains open for
  the qibla needle (Phase 3), which is the one genuine candidate.
- **FlashList pinned DOWN 2.3.2 → 2.0.2 by `expo install --fix`** (Expo's known-good pin for 57).
  Deep-link scrollToIndex precision re-verified live (2:255 lands exactly) — the behavior the app
  cares most about survives. Left at Expo's pin; revisit only if list QA shows regressions.
- **TypeScript 6.0.3 (SDK pin) stops auto-including `@types/*`** — `types: ["jest"]` added to
  tsconfig. Remember this when adding any new global-types package.
- **react-test-renderer must equal react's exact version** (19.2.3). Its caret range floating to
  19.2.8 broke npm's whole tree layout (expo-modules-core failed to hoist → jest-expo unresolvable).
  If react bumps, bump react-test-renderer in the same commit.
- **New React Compiler lint rules (eslint-config-expo 57) adopted, not silenced.** They flagged five
  real issues (render-scope component in onboarding, ref-during-render ×3, complex memo dep) — all
  fixed properly; one justified inline suppression (expo-audio exposes finish only as a status flag).

## 2026-07-30 — Android perfection phase: constitution corrections + Phase 0 hygiene

- **Android phase activated by direct owner instruction (2026-07-30)** — supersedes CLAUDE.md's
  "Android deferred until iOS TestFlight". Each previously-deferred Android item is re-decided on
  the merits with research and logged here as it lands.
- **CLAUDE.md stack text corrected (owner-authorized)**: SDK 54/RN 0.81 → SDK 57/RN 0.86.0
  (exact, patch-locked to Expo's precompiled ExpoModulesCore — a 0.86.2 bump aborts at startup;
  see 2026-07-29 entry). Nothing else in CLAUDE.md changed.
- **app.json hygiene (research-verified against the SDK 57 schema)**: deleted `newArchEnabled`
  (New Architecture is mandatory since SDK 55; key removed from schema) and
  `android.edgeToEdgeEnabled` (edge-to-edge is unconditional at target 36; key removed in SDK 55).
  Added expo-audio `recordAudioAndroid: false` — belt-and-braces with the existing
  `blockedPermissions` RECORD_AUDIO entry, keeps the mic permission out at the plugin source.
- **Predictive back stays OFF** (`predictiveBackGestureEnabled: false`): expo/expo#39092 (back
  gesture jumps to home with expo-router) is still open as of today; react-native-screens
  maintainers state fragment-level predictive back will never land in screens v4; the only
  supported path is the alpha ExperimentalStack (4 screen options, no modals) — not shippable.
  Re-test at the next SDK upgrade.
- **JDK pin**: local Android builds use the Android Studio JBR (JDK 21) via
  `scripts/android/env.sh` (`DEENDAWN_JDK` overrides). Gradle 9.3.1 (SDK 57) supports 17–25, but
  AGP 8.12/Kotlin 2.1.20 are tested on 17/21 and EAS's sdk-57 image is JDK 17 — system Temurin 25
  stays off the build path. NDK stays at RN 0.86's pinned 27.1.12297006 (RN injects the 16 KB
  alignment flag for it; forcing NDK 28.x is a known crash pattern — skia #3392).

## 2026-07-30 — "Pristine" design pass: Claude Design mega-prompt (owner directive, parallel session)

- **Owner asked for a comprehensive Claude Design prompt** covering every screen/loading/empty/error
  state on both platforms, "pristine, professional, perfect, but not over the top so as to not breach
  islamic traditions." Deliverable: `docs/CLAUDE_DESIGN_PROMPT.md` (repo copy holds placeholders —
  see below) + the filled copy handed to Zohaib directly. Grounded in: full code inventory (routes,
  states, exact i18n strings, primitives), the release-capture sweep, and three deep-research reports.
- **Religious-text handling**: the prompt's §11 sample block (ayahs 1:1–1:3, surah names 1–5, native
  language names) is injected MECHANICALLY from `assets/db/quran.db` + locale `meta.nativeName` —
  never typed by hand (rule 1; the guard hook correctly blocked a hand-written draft). Regenerate the
  filled copy with: python3 sqlite3 read-only on quran.db → replace `[[AR_SAMPLES]]`,
  `[[SURAH_ROWS]]`, `[[LANG_NAMES]]` in the repo doc. The filled copy is NOT committed (keeps
  hand-off files with Arabic out of the repo; db remains the single source).
- **Key research verdicts baked into the prompt** (deep-research, 2026-07-30): Pillars is NOT an
  Apple Design Award finalist (folklore — corrected); scripture never on widgets/lock-screen/
  notifications (wallpaper-adab rulings) and never as background texture ("reminding, not
  adornment"); no melodic chimes anywhere (bells hadith — silence+haptics only); zero
  worship-gamification (riya sensitivity); flat stylized Kaaba glyph is acceptable qibla iconography
  (prayer-rug precedent), no 3D/photoreal; countdown = minutes granularity, seconds only in the final
  five minutes (anxiety research); M3 motion tokens + iOS spring numbers embedded (350ms push,
  standard/emphasized beziers, ≤15% bounce); Android splash is icon-only (fade is iOS-only);
  predictive back stays off (matches existing decision); Moti avoided (broken on Reanimated 4);
  Tier-B download must use the new `File.createDownloadTask` API (legacy FileSystem API throws on
  SDK 57); app nisab constants confirmed 85g/595g and quoted as-is. Hijri sample date 16 Safar 1448
  verified against three Umm al-Qura sources.
- The prompt ends with an implementation-kickoff prompt for the follow-on build session (expects the
  design saved at `docs/design-source/pristine.dc.html`).

## 2026-07-30 — Android phase 0 findings (emulator-verified)

- **library.db wiped-container race (REAL BUG, fixed, was latent on iOS too):**
  expo-file-system's `File.copy()` became ASYNC in SDK 57; `openLibraryDb` fired it without
  await → `openDatabaseSync` created an EMPTY library.db first, every Books query failed
  ("NativeDatabase.prepareSync rejected"), and the late copy rejected "Destination already
  exists". Fixed: awaited `copy(dest, { overwrite: true })` + single-flight promise cache +
  5 regression tests. Found because Android's timing loses the race deterministically from a
  wiped container; iOS had been winning it by luck.
- **NativeTabs Android icons:** expo-router 57.0.9 has NO `md` prop (docs describe a newer
  version); the supported channels are `sf` (iOS), `drawable` (needs res assets), and `src`.
  Adopted the official `NativeTabs.Trigger.VectorIcon family={MaterialIcons}` as `src`,
  Android-only — same glyph names as icon-symbol.tsx, zero bundled assets, bar applies its
  own tint. Verified rendering on emulator (light theme; dark pending the insets sweep).
- **`role="search"` on the Ask trigger is now iOS-only.** Kept from the iOS 26 design; on
  Android it contributed to tab-switch failures under animation-scale changes and has no
  Material affordance. (Removing it did not fix the deadness below — gating it is hygiene,
  not the fix.)
- **NativeTabs tab switching dies when `transition_animation_scale=0` on Android** (all five
  tabs, deterministic, dev build): the fragment transition seemingly never completes. This is
  what users with the "Remove animations" accessibility setting would hit. OPEN INVESTIGATION:
  re-test on a release build during Phase 3; if it reproduces, escalate upstream
  (expo-router/react-native-screens) with a repro. Harness workaround: the e2e driver zeroes
  only window+animator scales.
- **Maestro 2.6.1 env precedence:** a flow-file `env:` block OVERRIDES both `-e` CLI params
  and a wrapper flow's env (verified empirically) — so flows now carry NO env defaults, and
  ALL runner-controlled values (screenshot dir, localized tab labels from the locale JSON)
  are injected by scripts/e2e-android.sh / scripts/e2e-ios.sh. This also satisfies the
  NO-AI-ZONE hook (no Arabic literals in YAML). Locales suite now does the full
  EN→UR→AR→EN round trip incl. both RTL restarts — PASSING on Android emulator; the
  in-process Updates.reloadAsync restart survives a Maestro session as designed.
- **expo-modules-core EventEmitter SIGSEGV (intermittent, dev-only so far):** hit twice
  during early Android e2e (null-deref in EventEmitter::Listeners::call on the JS thread).
  Research verdict: no known fix upstream (matching report closed unfixed); Android emit path
  lacks the runtime-teardown guard iOS got in 57.0.4; likeliest trigger is an event landing
  during dev-reload teardown. Mitigation: Phase 3 e2e/evidence runs on RELEASE builds; if it
  ever reproduces on release, build expo-modules-core from source for symbols and file
  upstream with the tombstone. NOT upgrading to expo 57.0.9/RN 0.86.2: no fix exists there,
  and the iOS precompiled stack locks RN at 0.86.0 (`npx expo install --fix` is FORBIDDEN —
  it would bump RN and break iOS; see 2026-07-29 entry).
- **FlashList 2.0.2 → 2.3.2** (above Expo's pin, deliberate): 2.3.2 disables
  removeClippedSubviews to prevent a known Android crash; JS-only package so the precompiled
  native lock doesn't apply. Full suite green; deep-link scrollToIndex re-verify happens in
  the Phase 1 list QA pass; revert only on regression.
- **Android channel model (notification arch commit 1):** pure `channels.ts` —
  `{stream}.{prayer}.{soundFamily}.v{N}` IDs, fullAdhan→clip mapping (zero churn), per-family
  version table for the future real-recordings swap, IMPORTANCE_HIGH everywhere, ALARM usage
  on audible channels, prefix-guarded deletes. 16 tests. Wiring lands in the next commits.

## 2026-07-30 — Exact-alarm strategy for Android adhan (THE entry CLAUDE.md's Android section references)

- **Permission: `SCHEDULE_EXACT_ALARM`, never `USE_EXACT_ALARM`.** Play policy restricts
  USE_EXACT_ALARM to alarm/timer/calendar apps (re-verified against the live policy page and
  the Oct 28 2026 preview — unchanged); a prayer app's eligibility is undocumented, no
  precedent exists either way, and a policy flag risks the whole listing on a brand-new
  personal account. SCHEDULE_EXACT_ALARM needs no Play declaration form, and the leading
  open-source prayer app (Al-Azan) ships the same choice. Added additively via
  `expo.android.permissions` (verified in the merged manifest alongside the intact
  blockedPermissions set).
- **Mechanics (source-verified in expo-notifications sdk-57):** with the permission granted,
  the existing DATE triggers automatically use `AlarmManagerCompat.setExactAndAllowWhileIdle`;
  denied → silent inexact `setAndAllowWhileIdle` fallback (still fires in Doze, may drift
  minutes). Android 12/13 auto-grant on install; Android 14+ default-DENY for new installs.
- **UX contract:** a plain-English "Make adhan times exact" card (More ▸ notifications
  section) appears only when applicable-and-denied; deep-links to the system "Alarms &
  reminders" screen via expo-intent-launcher (REQUEST_SCHEDULE_EXACT_ALARM); when denied we
  show the honest "may arrive a few minutes late" caveat rather than nagging. No
  battery-optimization exemption request in v1 (Play-sensitive surface; the permission-free
  settings deep-link lives in the troubleshooting screen instead).
- **State machine (the correctness core):** grant state is KV-persisted; ANY observed
  transition forces full re-registration of the pending queue. Revoke: Android stops the app
  and cancels its alarms, but expo-notifications' store still lists them — an ordinary diff
  would "keep" ghosts that never fire. Grant: exactness is fixed at registration time, so
  only re-registration upgrades pending alarms to exact.
- **Detection:** expo-notifications exposes no JS API for `canScheduleExactAlarms()` (none
  through 57.0.8 — changelog-verified) → tiny local Expo module `modules/exact-alarm`
  (android-only) wrapping the AlarmManager check + a context-registered receiver for
  ACTION_SCHEDULE_EXACT_ALARM_PERMISSION_STATE_CHANGED while the app runs; plus re-checks on
  every AppState-active via the existing scheduling hook. Notification small icon (96×96
  white silhouette of the brand dawn mark, generated by scripts/generate-notification-icon.mjs
  from the real splash mark — NOT the stale pre-brand monochrome asset) + brand-green tint
  land in the same commit so Android adhans stop showing the grey generic glyph.

## 2026-07-30 — Phase 2 Android excellence decisions

- **Material You dynamic color: deliberately NOT adopted.** The brand's three-theme system
  (forest/gold light/dark/night-warm) is semantic and static by design; M3 itself treats
  brand schemes as first-class, and RN has no native dynamic-color bridge anyway. Our
  Material-You answer is the monochrome themed launcher icon (shipped — the launcher's
  themed-icon path renders the dawn mark) + full edge-to-edge + ripple. Revisit only if a
  future Android release makes dynamic color a store-quality signal.
- **Widget v1 renders in the system font.** The brand TTFs live in node_modules
  (@expo-google-fonts) and the widget font plugin wants file paths — deferred as polish;
  Roboto at 11-13sp reads clean in the RemoteViews context. Revisit with the store-asset
  pass.
- **Full-adhan background playback via FGS: stays deferred post-v1 (re-decided with
  research).** The Al-Azan pattern (exact alarm → mediaPlayback FGS with a Stop action)
  works, but a SECOND user-facing FGS flow means more Play-declaration surface (demo video
  covers the audio FGS already, but adhan-triggered background service start is a separate
  review story) on a brand-new personal account. v1 ships clip-at-fire +
  tap-opens-app-plays-full, honestly explained per platform. Escalation path documented in
  the handover research (react-native-notify-kit).
- **Two-way per-app-locale sync (in-app picker → system Settings row): deferred.** The only
  library is stale (late-2024); the correct primitive is a ~30-line local module calling
  AppCompatDelegate.setApplicationLocales. One-way (system → app) ships now via
  supportedLocales; two-way is polish, tracked for a later pass.
- **expo-quick-actions launcher-popup verification deferred to the sweep**: registration is
  dumpsys-proven; synthetic long-press input kept grabbing the adjacent widget. Cold-start
  invocation (upstream issue #54) is on the truth-test matrix in TESTPLAN.
- **Release builds need MaxMetaspaceSize=1536m** (lintVitalAnalyzeRelease exhausts the
  generated 512m cap) — set per-invocation via GRADLE_OPTS in scripts/android/build-release.sh
  so it survives prebuild and never touches machine-global config.

## 2026-07-30 — Locale digit policy + surah-row hierarchy (polish pass)

- **Digits**: Arabic UI renders Eastern Arabic-Indic digits everywhere
  (`ar-u-nu-arab` via `src/lib/i18n/format.ts` + an i18next interpolation
  formatter that localizes every interpolated number). Urdu pins Latin digits
  (`ur-u-nu-latn`) — the dominant convention in Pakistani apps; the pre-fix
  screens mixed digit systems inside a single line (sweep finding). Time
  strings pass a display locale to `formatTimeInZone`; its default stays
  `en-US` because fixtures treat that form as canonical.
- **Surah rows**: in ar/ur the calligraphic Arabic surah name is the primary
  title (transliteration + verse count as the sub-line, English translation
  name dropped — we have no reviewed ur/ar translations of the meaning-names
  and will not machine-generate any, rule 1). English keeps
  transliteration-primary with the Arabic name trailing; that trailing name
  no longer flex-shrinks (fs2.0 clipped it letter-by-letter) — it wraps.
- **About/attribution screens stay English in all locales**: license and
  attribution notices are quoted legal text; translating them is riskier than
  the mixed-language seam (also gate-8 cost for zero user value).
- **Tasbih/compass extras**: history dates localize via `formatDayKey`;
  compass card gains E/S/W cardinal words + an explicit no-magnetometer state
  (Magnetometer.isAvailableAsync) instead of a forever-"calibrating" dial.

## 2026-07-30 — Recitation audio source: Islamic Network collection, re-hosted on R2 (Alafasy first)

Zohaib directed full recitation using openly-licensed audio. A 9-agent
research workflow (4 sweeps + adversarial license verification per candidate)
established, with live page fetches:

- **QUL / Tarteel** (qul.tarteel.ai): superb catalog, but NO per-recitation
  license is published anywhere on the site; upstream QuranicAudio.com terms
  are personal-use-only. Every re-hosting claim was adversarially REFUTED.
- **QuranicAudio.com**: personal use only, admits mixed chain-of-title. No.
- **archive.org full-set items**: CC/PD tags are anonymous uploader
  assertions, plainly invalid for rights-managed recordings. No.
- **tvQuran**: all rights reserved. **mp3quran/Quran Central**: unverifiable
  (bot-blocked). **EveryAyah**: per-ayah only + dead license page.
- **Islamic Network (alquran.cloud / cdn.islamic.network)** — the ONE source
  with a published permission statement, fetched verbatim 2026-07-30:
  recitations are "licensed to us by the reciters or their estates for free,
  non-commercial redistribution at the bitrates we publish", download
  explicitly permitted, even commercial bundling permitted, with a
  reciter-takedown caveat we will honor. Full quote pinned in
  content-pipeline/audio/sources.json and rendered in About.

DECISION: fetch the per-surah 128 kbps sets from cdn.islamic.network,
verify + hash-lock them (audio.lock, same discipline as content.lock), and
re-host on OUR R2 bucket — rule 2 requires the only audio domain be ours,
and re-hosting keeps user IPs away from any third party. Starting reciter:
**Mishary Rashid Alafasy (Murattal, ~1.6 GB)** — the most widely loved
voice; the bucket layout ({reciterId}/NNN.mp3) already supports adding more.
Final reciter sign-off remains Human Gate #5 (BLOCKERS), and emailing
Islamic Network for a one-line re-hosting confirmation is recommended there.

R2 serving facts (verified): free tier 10 GB + 10M reads/month, egress $0 at
any volume; r2.dev is dev-only (rate-limited) — production needs a custom
domain on a Cloudflare zone; Range requests supported (single range — fine
for expo-audio). Enabling R2 requires a card on file → human gate; the
click-by-click is in BLOCKERS.

expo-audio: 57.0.3 is the newest SDK-57 patch (verified changelog). The
Android headphone-unplug pause fix (#48151) is merged upstream but will not
ship in 57.0.x — logged in TODO as an app-side polish candidate (tiny local
module listening for ACTION_AUDIO_BECOMING_NOISY).

## 2026-07-30 — Human Gate #5 (audio half) CLOSED: Alafasy approved

Zohaib approved in-session: "Approved: Alafasy". The shipping reciter set is
Mishary Rashid Alafasy (Murattal, Hafs), Islamic Network collection, as
pinned in content-pipeline/audio/sources.json + audio.lock. The translation
half of gate #5 remains open.
