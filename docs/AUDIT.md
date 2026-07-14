# DeenDawn — Technical Audit (2026-07-13)

A privacy-first, free, no-ads Islamic iOS app (Android fast-follow). This
document is a full technical snapshot for external review. It is written for a
technical reader; the goal is to surface where an outside research pass could
most improve the app. The last section is a list of concrete research
questions.

Repo state at audit: `main` clean, all commit gates green, ~255 test cases
across 39 files. iOS builds and runs on iPhone 17 simulator (iOS 26.5).

---

## 1. What the app is

Eleven feature areas, all implemented:

| Area | What it does |
|---|---|
| Prayer times | All `adhan-js` methods, Asr madhab toggle, high-latitude rule auto/override, manual city (offline 135-city dataset) or on-device location. |
| Adhan notifications | Per-prayer on/off + sound, rolling 8-day scheduler under the iOS 64-notification cap, reschedules on foreground/background/fire. |
| Qibla | Great-circle bearing to the Kaaba + magnetometer heading with true-north correction and calibration UX. |
| Quran | 114 surahs, Uthmani script (Amiri Quran font), Pickthall DEV translation, bookmarks, last-read, full-text search, share-with-citation, streamed audio, night-warm reading mode. |
| Ask | Deterministic search-answers over the Quran text + a bundled philosophy library; optional (gated-off) on-device LLM paraphrase layer. See §5. |
| Tasbih | Counter with haptics, 33/99 targets, 7-day history, user-entered labels only. |
| Hijri calendar | Umm al-Qura conversion, dual-date grid, key-date markers, ±1 day offset, "calculated" disclaimer. |
| Suhoor/Iftar | Fajr/Maghrib surfaced during Ramadan + optional pre-Fajr reminder. |
| Zakat | 2.5% calculator, min-of-metals nisab from user-entered prices (no live price API), disclaimer. |
| Tips | Optional developer tip via RevenueCat, strictly "support development" framing (never charity/zakat). |
| Onboarding/Settings | First-run welcome→city→reminders, method/madhab/high-lat pickers, language, About/attribution, privacy screen. |

---

## 2. Stack & architecture

- **Expo SDK 54**, React Native **0.81.5**, React **19.1**, TypeScript **5.9** strict, `expo-router` (typed routes), **React Compiler** enabled, New Architecture (Fabric).
- **Data**: `expo-sqlite` (bundled read-only `quran.db` 5.3 MB + `library.db` 1.0 MB; user data in a separate `user.db`). A second SQLite stack (`@op-engineering/op-sqlite` + `sqlite-vec`) backs the optional AI vector store in its own `vectors.db`.
- **Prayer engine**: `adhan` 4.4.4 (MIT), wrapped; an independent bearing implementation for qibla verified to 0.01° against the reference.
- **Notifications**: `expo-notifications`. **Audio**: `expo-audio` (streaming, background, lock-screen). **Sensors**: `expo-sensors`/`expo-location`.
- **AI (optional, off)**: `llama.rn` (Qwen3 GGUF), `all-MiniLM-L6-v2` embeddings, `sqlite-vec`.
- **IAP**: `react-native-purchases` (RevenueCat). **Lists**: `@shopify/flash-list` v2. **i18n**: `react-i18next` + `intl-pluralrules`.
- **Source size**: ~7,080 LOC app/src (excl. tests), ~3,420 LOC tests. Feature-sliced under `src/features/<feature>/` with pure logic separated from components and tested against real data.

Design principle throughout: **pure logic is isolated from native/UI and unit-tested; native modules are lazy-required so importing a module never touches native code** (keeps tests fast and hermetic, and lets whole features degrade gracefully when a capability is absent).

---

## 3. Content pipeline — the "NO-AI ZONE"

Religious text is never authored, corrected, or paraphrased into storage by the
model. It enters only through `content-pipeline/` scripts, byte-for-byte from
pinned sources, with a SHA-256 for every artifact in `content.lock` (10
artifacts). A checksum mismatch fails the build.

- Quran text: Tanzil Uthmani (CC BY 3.0, attribution retained + rendered in-app).
- DEV translation: Pickthall 1930 (public domain), watermarked "DEV — pending review" on every screen behind `__DEV__`.
- Library: 3 public-domain Gutenberg works (al-Ghazali ×2, Rumi), per-page license verified, 308 FTS sections, pre-1930 gate.
- Fonts: Amiri Quran, Literata, Source Sans 3, Noto Nastaliq Urdu (all SIL OFL), pinned as artifacts and extracted at build.
- FTS normalization happens only in derived columns; source text is immutable. Two `PreToolUse` guard hooks hard-block edits to Arabic religious text and to `content.lock`/`assets/db` outside a pipeline run.

Golden tests assert db hashes vs `content.lock`, exact ayah counts (6236),
and first/last-ayah byte-equality.

---

## 4. Privacy & security posture (target: "Data Not Collected")

- No accounts, no analytics SDK, no ad SDK, no crash reporter.
- Location used on-device only, never transmitted; manual city entry is a full alternative.
- Only outbound network: recitation audio streaming (our R2 bucket) and optional AI-model downloads (R2 only, SHA-256-verified). Everything worship-related works in airplane mode — proven by an offline E2E suite run against a **release** build with all servers stopped.
- No secrets in the repo; `.env` gitignored, EAS secrets for builds.
- Info.plist: `NSAllowsArbitraryLoads=false`, ATS on; `UIBackgroundModes=[audio]`.

---

## 5. The "Ask" feature (the novel/risky part)

Two tiers with hard, tested constraints (constitution Rule 1.5):

- **Tier A (universal, on by default)**: deterministic retrieval only — full-text-search matches, exact counts, verse lists with deep-links. **No generation.** Count answers are phrased as verifiable corpus facts ("60 verses match 'patience' in the bundled translation [1][2]…"), never theological claims. Counting/"which verses" queries are always Tier A. Ruling-seeking queries (halal/haram/should-I patterns, incl. Arabic) get a fixed redirect-to-scholars response, never an opinion. Cross-source: the same discipline searches the philosophy library ("Books").
- **Tier B (optional, capability-gated, SHIPS OFF behind a flag)**: a small local LLM that may only paraphrase the passages retrieved for the current query, with citations. **No cloud API, ever.** Post-processor rejects answers whose citations are empty or reference content outside the retrieved set; a style blocklist strips filler; empty retrieval → fixed refusal; model file is SHA-256-pinned in `model.lock` and downloaded from R2 only. Native stack (op-sqlite + sqlite-vec + llama.rn) compiles and the management UI/controller are wired, but the whole thing renders nothing until a human + scholar sign-off flips `TIER_B_ENABLED`. Currently inert: model hashes are `PENDING-UPLOAD`.

---

## 6. Testing

- Gates on every commit: `tsc --noEmit`, ESLint (incl. a `jsx-no-literals` rule forcing all UI copy through i18n), Jest, religious-text checksum test.
- **Unit**: prayer fixture matrix (1,680 fixtures: 8 cities × 8 dates incl. both DST transitions/solstices/equinox/Ramadan × 12 methods × 2 madhabs + high-lat rules, to-the-minute); scheduler math; qibla bearings; zakat math; hijri conversion; Ask router (72-test harness); Tier B contract/grounding/refusal; vector store; download state machine.
- **DB-backed**: node tests run the app's real SQL against the committed `quran.db`/`library.db` via `better-sqlite3` (no mocks of the corpus).
- **Component** (React Testing Library): RTL layout, translation toggle, bookmarks, audio bar, tips flow, Tier B card states.
- **E2E** (Maestro on simulator): onboarding, smoke, locales (EN→UR→AR RTL restart), audio (against a local range-request tone server), tips, ask, and an **offline release-build** suite (zero servers).
- **Copy audits** as tests: the tip-jar wording fails the build if it ever uses charity/zakat/sadaqah framing in any of the three locales (Apple 3.2.1).

---

## 7. Performance & budgets

Targets from the constitution and current status:

| Budget | Target | Status |
|---|---|---|
| Cold start | < 2 s (iPhone 12-class) | Device pass pending (simulator only so far). |
| App binary | < 100 MB (audio streamed, never bundled) | Assets total 9.5 MB (dbs 6.3 MB, fonts 2.6 MB); binary TBD on device. |
| `quran.db` | < 25 MB | 5.3 MB. |
| Scroll | 60 fps in surah view | FlashList v2 migration done across all 5 lists; on-device fps profile pending. |
| Notification scheduling | < 500 ms | Pure scheduler; device timing pending. |

Deliberate perf choices: reader row materialization deferred past the nav
transition (`InteractionManager`); `freezeOnBlur` tabs; `enableScreens`.

---

## 8. Design system, accessibility, i18n

- **Tokens-first**: one `tokens.ts` holds every color/radius/spacing; WCAG contrast enforced by a Jest test (7:1 body, 4.5:1 secondary, 3:1 large) across light/dark/night-warm — a palette edit that breaks readability fails CI. Warm-editorial identity (lapis accent, ochre highlights, ivory canvas, Literata serif + Source Sans UI + Amiri Arabic). Dark mode is warm-tinted (never pure black).
- **Dynamic Type**: `maxFontSizeMultiplier: 1.4` cap app-wide; audited at accessibility-extra-large — no clipping on Today/Ask/Tips/Zakat (see screenshots).
- **RTL**: full mirroring via `I18nManager` + restart; audited in Arabic (tab order reverses, toggles/audio-bar mirror, English translation stays LTR inside the RTL page).
- **i18n**: EN/UR/AR, typed keys, key-parity + AR 6-form plural tests. UR/AR are machine-drafted and marked `@draft` — they do not ship to users until a human reviewer clears them (English ships freely).

---

## 9. Native build specifics (worth a reviewer's eye)

- Adding op-sqlite broke SDK 54's **precompiled** React core at link time (op-sqlite references React internals the prebuilt framework doesn't export). Fix: **build RN from source** (`plugins/withRNFromSource.js`). This then hit the known **fmt 11 / Apple Clang 21 consteval** breakage; fix: compile the fmt pod as C++17 after `react_native_post_install` (`plugins/withFmtConstevalFix.js`). Both plugins are documented as removable at SDK 56 / fmt 12. Trade-off accepted: clean iOS builds went from ~2 min (prebuilt) to ~15-25 min (from source).
- Dual-SQLite (expo-sqlite + op-sqlite) coexist by keeping the vector DB in a separate file and the AI feature off; this is a known risk area worth independent validation once Tier B is exercised on-device.

---

## 10. Known limitations & technical debt (honest list)

1. **No real recitation audio.** The full streaming player is built but plays a labeled placeholder tone in dev and hides itself in release until license-cleared recordings exist. Research found the popular reciters are not free to use; recommendation is written permission.
2. **No real adhan notification sounds** — silent placeholders pending cleared recordings.
3. **Tier B is inert** — model files unuploaded; on-device inference latency/quality unmeasured; the real download/delete handlers on the card are stubs.
4. **DEV translation** (Pickthall 1930) is a placeholder; the shipping translation is a human decision (Saheeh Intl / Clear Quran are copyrighted and excluded).
5. **Simulator-only validation** for sensors (magnetometer), push delivery, IAP receipts, cold-start timing, and 60fps — all on a device-pass checklist.
6. **No OTA update strategy chosen** yet (expo-updates is present but unused).
7. **No home-screen widget / Live Activity / watch app** (prayer countdown is an obvious candidate).
8. **Android deferred** — code is platform-guarded but unbuilt; exact-alarm and notification-channel strategy documented but not implemented.
9. **9 scholar-review items** pending (nisab constants, calendar labels, zakat/ruling wording, 16 philosopher bios, glossary) and **UR/AR strings** pending human review.
10. **Analytics-free by design** means no funnel/retention insight — improving the product without telemetry is an open problem.

---

## 11. Human-gated / blocked (needs the owner or a reviewer, not more engineering)

- Apple Developer keys → first TestFlight build (the only thing between the owner and testing on a real phone).
- Public support + privacy policy URLs (required for the store listing).
- RevenueCat key (tip jar goes live) — optional for v1.
- License-cleared recitation + adhan recordings.
- UR/AR reviewer; scholar sign-offs incl. enabling Tier B.
- 5-minute human spot-check of prayer times vs a published timetable.

---

## 12. Screenshot index (`docs/audit-screens/`)

Onboarding (00, 00b); light mode: Today (01), Quran list (02), Surah reader
(03), Ask count (04), Ask ruling-redirect (05), Ask Books/library (06), Qibla
(07), More top (08), More notifications (09), Tasbih (10), Zakat (11), Calendar
(12), Library list (13), Thinker page (14), Work reader (15), About (16), Tips
(17); dark mode: Today (18), Ask (19), Surah (20), More (21); night-warm reader
(22); Arabic RTL: Today (23), Surah (24).

---

## 13. Open technical questions for research

Where an outside pass would help most. Grouped by area.

**Prayer times & astronomy**
- Best-practice handling for extreme latitudes (Anchorage/Stockholm/polar) beyond `adhan`'s high-lat rules — which methods do the most-trusted apps use, and are there reference timetables to validate against?
- Is there a defensible, offline way to detect and warn about DST/timezone database staleness on-device?

**Quran rendering & reading experience**
- On-device tajweed color-coding and word-by-word translation: data sources with clear licensing, and rendering approaches that keep 60fps with the Uthmani script.
- Mushaf-style fixed-page layout (matching a printed Madani mushaf) vs. reflowing text — feasibility and licensing of page-accurate glyph data.
- Better Uthmani fonts than Amiri Quran for ligature/tashkeel fidelity that remain OFL and subsettable.

**On-device AI (Tier B)**
- Best small instruct models for faithful, citation-grounded paraphrase of short passages on an iPhone (A14+): Qwen3-1.7B vs alternatives, quantization (Q4 vs Q5/Q6) quality/latency/RAM trade-offs, and expected tokens/sec via `llama.rn` on device.
- Embedding model + retrieval strategy for a ~6k-verse corpus: is `all-MiniLM-L6-v2` the right pick, or is a multilingual/Arabic-aware embedder worth the size? Hybrid FTS+vector weighting that maximizes citation precision.
- Techniques to make an on-device LLM refuse cleanly on ruling-seeking or out-of-corpus queries with high reliability.

**Audio**
- Concrete, license-cleared full-Quran recitation sets suitable for a free app that also has a tip jar (i.e. commercial-adjacent) — reciter, host, exact license/permission URL, attribution terms. Same for <30s adhan clips.
- Gapless/word-highlighted playback synced to ayah timings — data sources (e.g. verse-by-verse timing files) and their licensing.

**Platform features that fit a privacy-first app**
- Prayer-countdown Home Screen widget + Live Activity / Dynamic Island, and an Apple Watch complication — implementation cost in Expo/RN and what's genuinely possible without ejecting.
- OTA update strategy (expo-updates) that never ships religious content out-of-band of the checksum pipeline.

**Product insight without tracking**
- How do privacy-first apps learn what to improve with zero telemetry? (opt-in local-only feedback, TestFlight, review mining, community channels) — patterns that respect "Data Not Collected."

**Store & growth (within Apple rules)**
- Guideline 4.3(b) differentiation framing for a crowded category; ASO for a no-ads/no-tracking Islamic app; screenshot/store-copy best practices.
- Monetization headroom beyond a tip jar that stays inside Apple 3.2.1 for a non-charity entity.

**Engineering hardening**
- Supply-chain hardening for the R2 model/audio downloads (signing beyond SHA-256, pinning, integrity on-device).
- The op-sqlite + expo-sqlite dual-stack and the from-source RN + fmt patches — are there cleaner or more future-proof approaches, and what breaks at SDK 55/56?
- On-device performance-regression testing for RN (cold start, scroll fps) that can run in CI or a device farm.
