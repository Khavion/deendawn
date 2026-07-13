# DECISIONS — non-obvious choices with rationale

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
