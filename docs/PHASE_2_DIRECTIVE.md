# PHASE_2_DIRECTIVE — DeenDawn Expansion (archived)

Received from Zohaib 2026-07-12, authored by his research assistant; the
CLAUDE.md amendments were confirmed by Zohaib directly in-session and now live
in CLAUDE.md itself (Rule 1 rewrite, Rule 1.5, Gates 7–9, stack additions).
This file archives the cross-cutting rules and epic specs — the working
reference for E1–E11.

## Cross-cutting rules (§2)

- Every new screen consumes the existing token system and theme provider. No inline hex, radius, or duration. Dark + night-warm variants for every new surface.
- Every new string goes through i18n keys from the moment E1 lands. No hardcoded user-facing strings anywhere, including new epics.
- Device floor discipline: iPhone 8/SE-2016 and Android Go 2GB get full functionality of everything except Tier B. Capability gate: getTotalMemory() >= 3.5GB AND not a low-RAM device AND (iOS: A14-class or newer via device-model map) -> Tier B eligible. One deviceTier value threaded through the theme/config, computed once.
- Privacy label stays "Data Not Collected." Model downloads hit only our R2 domain, carry no identifiers, and default to Wi-Fi-only.

## E1. Localization foundation (EN / UR / AR) — FIRST

- react-i18next + expo-localization; namespaces per feature; typed key access; missing-key detection test that fails CI if any rendered string bypasses i18n or any key lacks all three locales (UR/AR values may be @draft — gate 8 — but must exist).
- Extract ALL existing screens' strings into en.json. Draft ur.json and ar.json (machine-drafted, flagged in docs/TRANSLATION_REVIEW.md).
- Arabic plural rules (6 CLDR forms) via i18next; test plurals explicitly.
- Language picker in Settings, each option in its own script. Selecting UR/AR sets I18nManager RTL and prompts a one-tap restart (Updates.reloadAsync) with a bilingual confirm dialog. Persist choice.
- RTL audit: logical properties everywhere (start/end), mirrored directional icons, numbers LTR inside RTL runs, existing screens verified in AR via Maestro flow.
- Fonts: Noto Nastaliq Urdu for UR content surfaces (line-height ~1.9–2.1 documented in tokens); Source Sans for Latin.
- Interim glossary (flagged SCHOLAR_REVIEW): prayer names stay Arabic-derived in all locales.
- Acceptance: app fully usable in all three locales; RTL correct on Quran reader, Today, Settings; CI missing-key test green; screenshots of all three locales in docs/screens/.

## E2. Qibla compass

- Great-circle initial bearing to Kaaba 21.4225 N 39.8262 E; unit-test against known-good bearings for >=8 cities on both hemispheres.
- expo-location watchHeadingAsync; prefer trueHeading when >=0, else magHeading with "magnetic north" caveat chip. Low-pass filter with circular wraparound (359->0); update throttle ~10–16Hz.
- Calibration UX: accuracy indicator; below threshold show figure-8 prompt. Haptic selection tick within +/-3 degrees, single Success haptic on first alignment per session, then quiet.
- Accessibility: VoiceOver announces "Qibla is N degrees to your left/right" on demand; reduce-motion = no needle spring.
- Simulator has no magnetometer: unit-test math, Maestro with mocked heading stream, device checks in TESTPLAN.
- Design: single lapis needle on quiet canvas; night-warm variant.

## E3. Adhan notification sound options

- Per-prayer: Silent / Ping (system) / Adhan clip (<30s) / Full adhan. Persist per prayer.
- iOS: bundle short clips via expo-notifications config plugin (caf, -16 LUFS, fade-in, pipeline test hard-verifies <30s). Full adhan on iOS plays only when app opened from the notification — say exactly that in the picker UI.
- Android: channels are immutable after creation — pre-create one channel per sound option; migrate via new channel IDs if sounds change; alarm-usage audio attributes.
- Full adhan: in-app playback on open-from-notification with stop control. Android foreground-service autoplay deferred (never-list).
- Audio files are pipeline artifacts: checksummed, license-logged, normalized. Blocked on cleared recordings — build against a silent placeholder so the epic is testable now.
- Acceptance: scheduler tests updated for channel routing; sound-length pipeline test; Maestro picker flow; honesty copy present.

## E4. Hijri calendar + Ramadan mode

- Month grid, dual Gregorian/Hijri per cell, Umm al-Qura conversion, +/-1 day offset in Settings, persistent "Calculated — may differ from local moonsighting" label.
- Key dates marked (Ramadan start, Eid al-Fitr, Eid al-Adha, Dhul-Hijjah 1–10, Ashura, white days); all labels i18n keys + SCHOLAR_REVIEW flags.
- Ramadan mode: Hijri month 9 -> Today surfaces Suhoor ends (=Fajr) and Iftar (=Maghrib); optional pre-Fajr reminder on existing scheduler.
- Acceptance: conversion unit tests incl. offset; Ramadan-mode Maestro flow with mocked date.

## E5. Tasbih counter

As CLAUDE.md, i18n-native. Haptics: selection tick per count, Medium impact at 33, Success at 99; visual cue paired with every haptic.

## E6. Zakat calculator

As CLAUDE.md, i18n-native; long-currency layout tests in all three locales.

## E7. Navigation feel pass

- Native stack everywhere; enableScreens + enableFreeze at root; freezeOnBlur for tabs; dark ThemeProvider at root (no white flash).
- 200–280ms, standard easing; reduce-motion honored globally (tested); tab switches instant or cross-fade only.
- NO shared-element transitions (unstable on New Architecture in SDK 54); no full-screen animated gradients/blur on any tier; deviceTier gates enhancements.
- Defer heavy work past transitions (InteractionManager); profile Quran reader open specifically.
- Acceptance: no dropped-frame warnings on oldest simulator profile; reduce-motion Maestro flow.

## E8. Ask — Tier A (universal deterministic retrieval)

- Ask tab: single input over existing FTS (AR diacritic-insensitive + EN), lexical synonym-expansion map (engineering-authored, expandable). No external topic datasets.
- Query router: count/list/locate patterns -> exact FTS answer ("4 verses match 'bribery' in the bundled translation [1][2][3][4]") with deep-links; topical -> ranked verse list; ruling-seeking -> fixed redirect + related verses. Router unit-tested against fixtures.
- Terse answers are the product: no padding, citations tappable to exact ayah.
- Eval harness v1: docs/eval/ask_fixtures.json >=60 questions with expected counts/verse IDs/refusals; jest asserts exact matches. Gates E9.
- Acceptance: harness green; Maestro ask -> tap citation -> correct ayah; airplane-mode on floor tier.

## E9. Ask — Tier B (optional local LLM), built but ships OFF (gate 7)

- llama.rn + config plugin; Metal on real devices (unsupported in iOS simulator — mock in CI, device checks in TESTPLAN).
- op-sqlite + sqlite-vec in vectors.db (separate from quran.db; static-libraries approach; verify iOS build after adding op-sqlite). Ayah-level embeddings with surah context; hybrid retrieval = FTS union vector top-k, deduped, simply re-ranked. Embeddings precomputed OFFLINE in the pipeline, shipped as pinned artifact in the download bundle (model.lock).
- Download manager: R2-only URLs from config; Wi-Fi-only default with ~1.1 GB size warning; resumable; SHA-256 verify before first load; store in Documents; delete option frees everything.
- Generation contract: pinned prompt template; structured {answer, citations[]}; post-processor enforces Rule 1.5(a–d); violation -> Tier A fallback. Low temperature; context = retrieved ayat + translation only.
- Capability gate per §2; ineligible devices never see the offer.
- Eval harness v2: grounding suite, refusal suite, style suite (blocklist absent, <=40 words). All green before requesting gate 7.
- Acceptance: E8 harness still green with Tier B on (counts stay deterministic); download/delete Maestro flow with stub artifact.

## E10. Philosophers & scholars library

- content-pipeline/philosophers/: per-work verified-public-domain source (Gutenberg / archive.org per-item verification), license+provenance logged, hash-pinned like all content, normalized into library.db with FTS.
- Starter corpus (only what verifies PD in the US): Claud Field's al-Ghazali translations; Whinfield's abridged Masnavi (1898); F. Hadland Davis's Rumi volume (1907); other pre-1930 verifications. NEVER: Nicholson Rumi, Rosenthal Muqaddimah, SEP, Wikipedia text.
- Thinker pages (15–20): era, school, major works, 3–5 key ideas as neutral one-liners — original copy, every page flagged SCHOLAR_REVIEW (gate 9). No figurative imagery.
- Ask integration: Tier A search over library.db with source filter; Tier B may retrieve library passages cited as [Work, section] deep-links, same guardrails.
- Acceptance: pipeline verification tests (license log completeness, checksums); reader with editorial typography; search deep-links; gate-9 flags logged.

## E11. Resume remaining v1 backlog

Recitation audio (blocked on dev set), tip jar, onboarding + About, store prep — i18n-native and token-native.

## §4 Testing additions

- i18n: missing-key CI test; AR plural-form tests (6 forms); RTL Maestro flows.
- Pipeline: sound-length (<30s) test; model.lock checksum test; philosophers license-log completeness test; embedding-artifact checksum test.
- Ask: E8 fixture harness + E9 grounding/refusal/style harness in every CI run once built.
- Performance: profiled navigation pass on oldest simulator profile per release candidate.

## §5 Out of scope this phase (do not scaffold)

Word-by-word tap translation; hadith; Android foreground-service full adhan; sunset-auto theme switching (stays opt-in manual); any cloud inference; any new outbound domain.
