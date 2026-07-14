# DeenDawn — Technical Audit v2 (2026-07-14)

A privacy-first, free, no-ads Islamic app, now running on **both iOS and
Android**. This is a full technical snapshot for external review, written for a
technical reader; the goal is to surface where an outside research pass would
most improve the app before launch. §13 is a list of concrete research
questions, and §0 closes the loop on the first audit so the reviewer doesn't
repeat it.

Repo state: `main` clean, all commit gates green, **381 tests across 44 files**,
~7,590 LOC (excl. tests). Builds and runs on the iPhone 17 simulator (iOS 26.5)
AND a Pixel 7 emulator (Android 15) — the same codebase, verified on both via
the same Maestro flows.

---

## 0. What changed since the v1 audit (2026-07-13) — loop closure

The first audit's research pass produced excellent, actionable recommendations.
Status of each, so this round can build on it rather than repeat it:

| v1 research rec | Status now |
|---|---|
| #1 Collapse dual-SQLite → expo-sqlite bundled sqlite-vec; drop from-source RN + fmt patches | **DONE.** op-sqlite removed, precompiled RN restored, both build plugins deleted. Clean iOS build 15-25 min → **~2.4 min**. |
| #2 Tajweed color-coding (cpfair, CC BY 4.0) | **DONE (gated).** Their precomputed offsets mis-anchored 2.58% vs our text, so I re-ran their classifier against our text (0 mismatches, golden-tested) and built the reader renderer. Ships OFF pending scholar review of the colors. |
| #8 Ed25519 manifest signing | **DONE.** Verifier + 10 tests (tweetnacl, pure JS); enables authenticated post-launch model updates. |
| #3/#12 Prayer widget + Live Activity | **App side built + tested;** full native SwiftUI package staged in docs/WIDGET.md, device-gated. |
| #9 4.3(b) App Review differentiation notes | **DONE.** Strengthened in fastlane review notes. |
| #6 Embeddings → multilingual-e5-small (MIT) | Noted; applied when embeddings are actually generated (model-blocked). |
| #5 Qwen3 + GBNF + classifier-first refusal | Design confirmed; still model-blocked + physical-device-only to validate. |
| Recitation audio (written permission) | Outreach email drafted (docs/RECITER_OUTREACH.md) — owner action. |
| #11 UR/AR human review | Still pending a reviewer (gate 8). |
| WBW English translation | Deferred (no permissive dataset exists). |
| **Beyond the research:** got the app **building + running on Android** | **DONE** (see §7); first Android build fixed a real portability bug. |

---

## 1. What the app is (12 feature areas, all implemented)

Prayer times · adhan notifications · qibla · Quran reader (Uthmani + Amiri font,
translation, search, bookmarks, streamed audio, night-warm mode, **tajweed
colors [gated]**) · Ask (deterministic Quran/library search + gated on-device
LLM) · tasbih · hijri calendar · suhoor/iftar · zakat calculator · tips
(RevenueCat) · onboarding/settings · philosophy library (3 public-domain works).

---

## 2. Stack & architecture

- **Expo SDK 54**, React Native **0.81.5**, React **19.1**, TypeScript **5.9** strict, expo-router (typed routes), React Compiler, New Architecture (Fabric). **Precompiled RN** (fast builds) on both platforms.
- **Data**: `expo-sqlite` for everything — bundled read-only `quran.db` (5.3 MB) + `library.db` (1.0 MB); user data in `user.db`; the optional AI vector store via expo-sqlite's bundled `sqlite-vec`. Total bundled assets ~11 MB (incl. `tajweed.json` 723 KB, fonts 2.6 MB).
- **Prayer engine** `adhan` 4.4.4; qibla bearing implemented independently, verified to 0.01°.
- **AI (optional, OFF)**: `llama.rn` (Qwen3 GGUF) + sqlite-vec + all-MiniLM/e5-small embeddings. **Security**: `tweetnacl` Ed25519 for signed model manifests.
- **IAP** react-native-purchases · **Audio** expo-audio (stream/background/lock-screen) · **Lists** @shopify/flash-list v2 · **i18n** react-i18next (EN/UR/AR).
- Design principle: pure logic isolated from native/UI and unit-tested; native modules lazy-required so importing never touches native code (tests stay hermetic, features degrade gracefully).

---

## 3. Content pipeline — the "NO-AI ZONE"

Religious text is never authored/altered by the model — it enters only via
`content-pipeline/` scripts, byte-for-byte from pinned sources, SHA-256 in
`content.lock` (10 artifacts), checksum mismatch fails the build. Tanzil Uthmani
Quran (CC BY 3.0); Pickthall 1930 DEV translation (public domain, watermarked);
3 public-domain Gutenberg works; OFL fonts. Tajweed annotations are DERIVED
(cpfair's deterministic classifier run on our text, CC BY 4.0) and guarded by a
golden alignment test, not authored. Two PreToolUse guard hooks hard-block
Arabic-text and content.lock/assets-db edits outside the pipeline.

---

## 4. Privacy & security (target: "Data Not Collected")

No accounts, analytics, ad SDKs, or crash reporters. Location on-device only.
Only outbound network: R2 audio streaming + optional R2 model downloads (SHA-256
verified, now also Ed25519-signable). Offline E2E suite proves every worship
feature works with all servers stopped (release build). No secrets in repo; ATS
on. **Open flags for launch:** Cloudflare R2 access logs (IP) should be
minimized to keep the "not tracking" claim airtight; RevenueCat, once keyed, may
require a "Purchases" label line.

---

## 5. The "Ask" feature

**Tier A (on):** deterministic retrieval only — FTS counts/verses phrased as
verifiable corpus facts, ruling-seeking queries redirected to scholars, same
discipline over the philosophy library. **Tier B (OFF, gated):** local-only LLM
that may only paraphrase retrieved passages with citations; post-processor
rejects uncited/out-of-set answers; empty retrieval → fixed refusal. Native
stack compiles; inert (model hashes PENDING-UPLOAD); ships off until human +
scholar sign-off.

---

## 6. Testing

- Every-commit gates: tsc, ESLint (incl. jsx-no-literals forcing i18n), Jest, religious-text checksum.
- 381 tests: prayer fixture matrix (1,680), scheduler, qibla, zakat, hijri, Ask router (72), Tier B contract, Ed25519 manifest, tajweed golden alignment (all 6236 ayahs) + pure render logic, widget snapshot, vector store, download state machine, tip-jar copy audit (charity-framing fails the build in 3 locales).
- DB-backed tests run the app's real SQL against the committed dbs (no corpus mocks).
- E2E (Maestro): onboarding, smoke, locales (RTL restart), audio, tips, ask, offline release-build suite — green on **both** iOS and Android.

---

## 7. Platforms & build

- **iOS**: precompiled RN, ~2.4 min clean build; runs on iPhone 17 sim.
- **Android (NEW)**: builds via `expo prebuild` + Gradle (JBR 21; system Java 25 too new), `assembleDebug` green in 5m34s incl. llama.cpp native compile; runs on Pixel 7 / API 35. Onboarding 19/19, Today (correct engine), Quran (Amiri RTL), qibla all verified. Debug APK ~291 MB (all ABIs; release AAB much smaller). Package `com.khavion.deendawn`.
- Per constitution, Android is a "fast-follow" after iOS TestFlight; Android-only polish (notification channels, exact-alarm, Material You) is deferred.

---

## 8. Performance & budgets

Cold start <2s, binary <100 MB (audio streamed), quran.db <25 MB (at 5.3), 60fps
scroll (FlashList v2), notification job <500ms — all **pending on-device
measurement** (simulator/emulator only so far). Deliberate: reader row
materialization deferred past nav transition; freezeOnBlur tabs.

---

## 9. Design, accessibility, i18n

Tokens-first (one `tokens.ts`, WCAG contrast enforced by test across
light/dark/night-warm). Dynamic Type capped at 1.4× (audited, no clipping). RTL
fully mirrored (audited in Arabic). EN/UR/AR typed keys, key-parity + AR
6-plural tests; UR/AR machine-drafted, `@draft`, human-review-gated.
Screen-reader: code-level pass DONE (Arabic tagged `accessibilityLanguage`,
icon-only controls labeled, decorative icons hidden, selected states + a live
tasbih counter value; unit-asserted). On-device VoiceOver/TalkBack speech
verification remains a device-pass item.

---

## 10. Known limitations & technical debt (honest)

1. **No real recitation audio** — player built; placeholder tone in dev, hidden in release; needs licensed recordings (email drafted).
2. **No real adhan notification sounds** — silent placeholders.
3. **Tier B inert** — models unuploaded; on-device latency/quality unmeasured; download/delete handlers are stubs.
4. **DEV translation** (Pickthall 1930) is a placeholder — shipping translation is an open decision.
5. **Tajweed ships OFF** — needs scholar review of the rule→color mapping.
6. **Widget native** not wired (device-gated); Live Activity/Watch not built.
7. **Android notification reliability** unaddressed — Doze/battery-optimization/exact-alarms make on-time adhan on Android genuinely hard.
8. **Simulator/emulator-only** for sensors, push delivery, IAP receipts, cold-start, fps, on-device AI.
9. **10 scholar-review items** + UR/AR strings pending human review.
10. **No telemetry by design** → improving the product & running a beta without analytics is an open problem.
11. **Content-pipeline reproducibility**: the tajweed regeneration was a manual Python run — not yet reproducible in CI.

---

## 11. Human-gated / blocked (needs the owner or a reviewer)

Apple Developer keys → TestFlight (the only blocker for iOS testing; Android
already testable). Public support + privacy URLs. RevenueCat key (tips).
License-cleared recitation + adhan audio. UR/AR reviewer. Scholar sign-offs
(tajweed colors, Tier B enable, zakat/calendar/ruling wording, 16 philosopher
bios). 5-min prayer-time spot-check.

---

## 12. Screenshots

`docs/audit-screens/` (26 iOS: light/dark/night-warm/Arabic-RTL across every
screen). Android verified live (Today, Quran reader, onboarding, qibla).

---

## 13. Open questions for research (round 2)

The app is feature-complete and cross-platform; the frontier has shifted toward
**launch, the two hardest content gaps, and Android**. Grouped by area.

**Android notification reliability (highest new priority)**
- How do the most reliable prayer-time apps guarantee on-time adhan on Android despite Doze, battery optimization, and OEM kills (Samsung/Xiaomi/etc.)? Concrete strategy for `SCHEDULE_EXACT_ALARM`/`USE_EXACT_ALARM` (API 31+) vs `setAlarmClock`, notification channels for per-prayer sounds, and requesting battery-optimization exemption — with the least-intrusive UX.
- Foreground-service vs AlarmManager for a full-adhan sound at prayer time on Android; Play policy implications of each.

**The shippable Quran translation (a launch-gating decision)**
- Round 1 established the licensing dead-ends. Now: which specific English translations are actually good AND obtainable — either strong public-domain options beyond Pickthall 1930, or modern translations licensable at reasonable terms for a free app with a tip jar? Name candidates, rights-holders, and how to license. Same question, briefly, for a shippable Urdu translation.

**Adhkar / du'a (the obvious next feature, excluded from v1)**
- A cleanly-licensed source for morning/evening adhkar and common du'as (e.g., Hisn al-Muslim / "Fortress of the Muslim" — what's its actual licensing, and are there permissively-licensed alternatives with authenticated grading?), and the scholar-review workflow to add it safely.

**Beta + launch without telemetry**
- How to run a genuinely useful closed beta (TestFlight + Google Play internal testing) and gather actionable feedback when you collect zero analytics — structured in-app opt-in feedback, community channels, review mining. What signals matter and how to capture them privately.
- Distribution for a free, no-ads Islamic app: how comparable projects reached users (masjid partnerships, community orgs, the specific dynamics of this niche) without paid UA.

**Legal / entity for launch**
- Privacy policy + minimal ToS content appropriate for a "Data Not Collected" app; the legal entity question for receiving Apple/Google tip payments (sole proprietor vs LLC, tax/liability); GDPR/CCPA/COPPA posture for a 4+ app that collects nothing.

**On-device AI, measured**
- Can llama.rn tokens/sec be meaningfully measured on the arm64 Android emulator as an early proxy before a physical iPhone? What's a realistic Qwen3-1.7B Q4 latency budget for a ≤2k-token paraphrase on an A14-class phone, and the fallback UX if it's too slow?

**Engineering hardening & reproducibility**
- Making derived-content generation (the tajweed regeneration) reproducible/auditable in CI without heavy Python deps — vendoring the classifier, pinning it, or a lightweight port.
- Android release size: expected AAB size with ABI splits / Play's per-device delivery, given llama.rn's native libs, and whether to gate the AI download by ABI.

**Accessibility**
- A screen-reader (VoiceOver/TalkBack) pass for a bilingual RTL religious app: how Arabic is announced, reading order for verse+translation+citation, and whether tajweed colors need a non-color affordance.

**And: what's missing?** A pre-launch completeness review — what would a shipped, polished v1 of a privacy-first Islamic app have that this audit doesn't mention?
