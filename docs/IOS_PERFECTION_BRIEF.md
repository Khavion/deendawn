# DeenDawn — iOS Perfection Session Brief

> Paste the block below into a **new Claude Code session in this folder, in plan mode**.
> Approve the plan, then let it run with bypassed permissions.
> Facts in §5 were verified on **2026-07-29**. Re-verify anything load-bearing before acting on it.

---

You are the sole autonomous engineer of DeenDawn. `CLAUDE.md` (your constitution) and `AGENTS.md` load automatically — read them, plus `docs/PROGRESS.md`, `docs/TODO.md`, `docs/BLOCKERS.md`, `docs/DESIGN.md`, `docs/DESIGN_AUDIT.md`, `docs/DECISIONS.md` and `docs/TESTPLAN.md` before planning anything.

## 1. Mission

Make the **iOS** app genuinely excellent — not "shippable," excellent. The bar, in the owner's words: **a user opens it and thinks "how the hell is this free?"**

DeenDawn is free forever, no ads, no tracking, no accounts, and as of 2026-07-29 **no monetization of any kind** (the tip jar and RevenueCat were removed — constitution rule 3). Nothing is being sold, so the only thing that can possibly impress anyone is craft. That is the entire job this session.

Android is explicitly **out of scope**. Keep code platform-portable and don't break it, but spend zero effort on it.

## 2. What "perfect" means — the acceptance bar

Every one of these is testable. None is subjective. You are not done until each is *demonstrated*, not asserted.

**Layout**
- Every screen is correct on every device in the §6 matrix, portrait, with zero clipping, overlap, or content under a bar or the home indicator.
- Every screen survives **200% Dynamic Type** without losing function or clipping text.
- iPad: the layout is fully resizable — driven by `useWindowDimensions()` / flex, never a width captured at mount — and correct when the simulator window is dragged narrow. `UIRequiresFullScreen` is deprecated; treat arbitrary window sizes as the default case.

**Feel**
- Every interactive element gives feedback on press. `docs/DESIGN_AUDIT.md` records that most `Pressable`s are currently dead to touch — fix all of them.
- Haptics follow Apple's semantics (Notification = success/warning/error, Impact = light/medium/heavy/rigid/soft, Selection = value changing), are short, are consistent, and are user-disableable.
- Reanimated 4.1 is installed and currently unused. Either use it deliberately or remove it — do not leave a dependency that does nothing.
- No bare `ActivityIndicator` where a skeleton belongs. No dead states, no unexplained blank frames.
- Reduce Motion is genuinely honored (`docs/DESIGN.md` claims it; verify the code actually does it).

**Native-ness — read §5.3 carefully, this is the biggest single lever**
- The app must adopt **Liquid Glass** through genuinely native surfaces. A React Native `<View>` gets none of it.
- No custom backgrounds or blurs behind navigation bars, tab bars, toolbars, or sheets — let the system draw them.
- Nothing hard-codes control sizes, corner radii, bar heights, or safe-area insets.

**Accessibility**
- Contrast ≥ 4.5:1 for text under 17pt, ≥ 3:1 for 18pt+/bold, in **all three themes** (light, dark, night-warm).
- Every icon-only control has an `accessibilityLabel`. VoiceOver focus order is logical on every screen. State changes are announced.
- Tap targets ≥ 44×44pt (28×28pt absolute floor).
- Nothing conveys meaning by color alone.

**Arabic / RTL** — the highest-craft-risk area in the app
- Uthmani script renders with correct ligatures and no tashkeel clipping at every Dynamic Type size.
- Generous `lineHeight`, no fixed-height text containers (see the open RN shaping bug in §5.6).
- RTL layout is correct in Arabic and Urdu — **tested in a development build, never Expo Go**, which resets RTL.

**Performance** (constitution budgets)
- Cold start < 2s on iPhone 12-class. 60fps scroll in the surah view. Notification scheduling < 500ms. Binary < 100MB.

**Correctness**
- `tsc --noEmit` clean, `eslint` 0 errors, full Jest suite green, religious-text checksums intact — before every commit, no exceptions.
- Everything works in airplane mode that is supposed to.

## 3. Standing authorizations — the owner has pre-approved these, do not ask

The owner explicitly wants you autonomous and unlimited. You may, without stopping:

- **Upgrade the Expo SDK.** The constitution pins SDK 54, but the owner pre-authorizes moving to a newer SDK *if your own research concludes it is the right call* (see §5.2 — 55/56/57 have shipped, and 56+ materially improves Liquid Glass support). Log the decision and rationale in `docs/DECISIONS.md`. If you upgrade: do it on a branch, get every gate green, and verify a simulator build actually runs before merging. If you conclude it's not worth it, log *that* with reasons.
- Add, remove, or change any dependency in service of the mission. Log non-obvious ones.
- Refactor, restructure, and rewrite any non-religious-content code.
- Change design tokens, spacing, motion, and component structure.
- Install and drive simulators, create new simulator devices, capture screenshots.
- Spend as much time and as many tokens as the work requires. There is no deadline and no budget. Thoroughness is the point.

## 4. Hard limits — these do not move

- **Constitution rule 1 (NO-AI ZONE) is absolute.** You never write, complete, correct, paraphrase, or modify Quran text, translations, du'as, hadith, or any religious ruling. Never regenerate a checksum to make a build pass. Note Apple guideline **1.1.5** bars "inflammatory religious commentary or inaccurate or misleading quotations of religious texts" — this rule is also your App Store protection.
- **Tier B (generated answers) stays OFF behind its flag.** Human Gate 7.
- **Zero monetization.** No IAP, no billing library, no donate link, no purchase surface. Constitution rule 3.
- **Do not submit anything** to App Store Connect or Google Play, publish anything public, or spend money. Human Gates 1–3.
- Locale files contain Arabic and Urdu. Never reformat or re-serialize them wholesale — edit surgically so no byte outside your intended change moves.
- Hit a Human Gate → write it to `docs/BLOCKERS.md` in plain English with a yes/no recommendation, print `GATE: <summary>`, and **move to the next task. Never idle, never wait.**

## 5. Verified facts — current as of 2026-07-29

Use these as your starting point so you don't burn a research pass rediscovering them. **Re-verify anything you're about to make an irreversible decision on**, and treat items marked UNCERTAIN as genuinely unknown.

### 5.1 OS and store deadlines
- Current public iOS: **26.6** (27 Jul 2026). **iOS 27 is in beta, ships this fall** — build for it.
- **Since 28 Apr 2026, App Store Connect rejects uploads not built with Xcode 26+ / iOS 26 SDK.** Rejected at upload, not review.
- iOS 26 + iOS 18 ≈ **95–97%** of the installed base. iOS 17 and below ≈ 2–3%.
- Recommended `deploymentTarget`: **16.4** (matches Expo's current floor). Set via `expo-build-properties`. Known issue: the plugin may not update the *project*-level target — verify in the generated Xcode project.
- **Age-rating questionnaire:** updated answers were due **31 Jan 2026**; blank answers block submission. Verify this is handled when the app record exists.
- Apps built with the **iOS 27 SDK must declare a launch screen** in Info.plist or the upload is rejected. `expo-splash-screen` generates `UILaunchStoryboardName` — verify in the built plist, don't assume.

### 5.2 Expo SDK — a real strategic decision for you to make
| SDK | Released | RN | Min iOS | Min Xcode |
|---|---|---|---|---|
| **54 (current)** | Sep 2025 | 0.81 | 15.1 | 16.1 |
| 55 | Feb 2026 | 0.83 | 15.1 | 26 |
| 56 | May 2026 | 0.85 | 16.4 | 26.4 |
| **57 (latest)** | Jun 2026 | 0.86 | 16.4 | 26.4 |

SDK 54 *can* still meet the Xcode 26 mandate. But 55 adds automatic Liquid Glass form sheets; **56 makes Expo UI (SwiftUI primitives) stable and bundles `expo-glass-effect` by default**. SDK 56 is a breaking upgrade — it forks React Navigation out of `expo-router` and ships a codemod (`npx expo-codemod sdk-56-expo-router-react-navigation-replace`). Research this properly and decide.

### 5.3 Liquid Glass — the most important thing in this brief
**Liquid Glass is applied automatically only to genuinely native UIKit/SwiftUI components.** Building against the iOS 26 SDK gives a React Native app that draws its own headers and tab bars in JS **exactly nothing**. This is the difference between "looks 2026" and "looks 2023."

- The `UIDesignRequiresCompatibility` opt-out is **ignored on iOS 27**. Do not set it.
- What an Expo app can actually get: **expo-router Native Tabs** (native tab bar, adopts the appearance automatically — but SDK 54 marks it *alpha*, max 5 tabs, statically defined only, no nesting, no way to measure bar height), **native stack headers** via `react-native-screens`, native sheets/alerts/action sheets, and **`expo-glass-effect`** (`<GlassView>`, `<GlassContainer>`, guarded by `isLiquidGlassAvailable()`).
- Known bug: `opacity: 0` on a `GlassView` or any parent makes the glass silently fail to render.
- Don't stack glass on glass without a container.
- iOS 27 refines Liquid Glass automatically without recompiling — better readability behind the material, darkened edges, brighter highlights, a user transparency slider, a uniform scroll-under toolbar.

**Your call to make:** how far to go converting JS-drawn chrome to native surfaces. The app currently has a JS tab bar and 18 routes. Weigh the alpha status of Native Tabs against the visual payoff, prototype it, screenshot both, and decide with evidence.

### 5.4 iPad — you are currently blocked from submitting
`app.json` sets `supportsTablet: true`. Consequences:
- **iPad 13" screenshots at 2064×2752 are MANDATORY.** The repo has iPhone screenshots only, so **App Store Connect would block submission today.** Either produce iPad screenshots or make a reasoned decision to drop iPad support — don't leave it broken.
- `UIRequiresFullScreen` is deprecated as of iPadOS 26 and will be ignored. The app must handle arbitrary window sizes.
- **Open RN bug facebook/react-native#54105** (opened Oct 2025, still open): RN apps on iPad with Windowed Apps enabled may not resize below a certain size. Exact affected OS range is **UNCERTAIN**. Test it; if it bites, document it.

### 5.5 App Store assets
- Screenshots: 1–10 per class, PNG/JPEG, **no alpha channel**. **iPhone 6.9" required** (1320×2868 / 1290×2796 / 1260×2736). **iPad 13" required** (2064×2752 / 2048×2732). Everything smaller is optional — Apple downscales.
- Icon: 1024×1024 layered, six appearances (Default/Dark/Clear Light/Clear Dark/Tinted Light/Tinted Dark); system generates any you omit. Expo supports an Icon Composer `.icon` bundle via `ios.icon` (SDK 54+), or light/dark/tinted PNGs. No pre-masking, no baked shadows, no transparency.
- `PrivacyInfo.xcprivacy` is still required for required-reason APIs (RN itself trips several). Expo field: `expo.ios.privacyManifests`.

### 5.6 RTL and Arabic — known landmines
- **RTL does not work in Expo Go.** All RTL QA must run on a development build.
- `textAlign` defaults to physical `left`, not logical `start` — Expo's docs say set it explicitly per `<Text>`.
- Layout direction changes need a full restart; `Updates.reloadAsync()` after `forceRTL` is the maintainer-blessed workaround (expo/expo#39752, still open). The constitution already does this — it's correct.
- On iOS the device language must be in your declared `supportedLocales` or RTL silently fails.
- **facebook/react-native#55220** (opened Jan 2026, open, iOS + Android): certain Arabic strings get their last word clipped in RTL — a text *measurement/shaping* defect, so **you cannot predict which strings**. Mitigation: generous `lineHeight`, no tight fixed-height containers, and snapshot-test real Quranic strings.
- `I18nManager.isRTL` was wrong on iOS for years. The issue is closed but the fix release is **UNCERTAIN** — test empirically, don't trust it.

### 5.7 App Review
- **Guideline 4.3(b) grew teeth in June 2026:** Apple can now **remove already-live apps** in saturated categories that aren't updated/improved or don't attract customers. Prayer-time apps are a saturated category. Real rejections in this class read "duplicates the content and functionality of other apps."
- Your defense is real and reviewable: Data Not Collected, zero network in the core worship path, airplane-mode verified, no accounts/ads/tracking/paywall, offline Quran + FTS, byte-verified checksummed scripture. `fastlane/metadata/review_information/notes.txt` already argues this — strengthen it with a **reproducible airplane-mode test script a reviewer can follow**.
- **5.1.1(ii):** purpose strings must be complete sentences naming the use. Vague strings are a routine rejection. Audit `NSLocationWhenInUseUsageDescription` and every other purpose string.
- **4.5.4:** the app must remain fully usable if notification permission is denied. Verify.
- **2.5.4:** `UIBackgroundModes: ["audio"]` is legitimate for the Quran player, provided it genuinely plays in the background.

### 5.8 Tooling
- **Maestro is still the right choice** and actively maintained. **CLI ≥ 2.4.0 is required for iOS 26 simulators**; ≥ 2.6.0 adds parallel local iOS runs and a Viewer built for AI agents. Check the installed version first — an older Maestro may simply fail to drive iOS 26.
- Accessibility: `eslint-plugin-react-native-a11y` (cheap CI gate), `react-native-accessibility-engine` (Jest-time assertions, slots into the existing gate), Xcode Accessibility Inspector (Apple's own, named in the HIG for contrast).
- Performance: React Native DevTools Performance tab; **Xcode Instruments is the only real instrument for the iOS cold-start and scroll budgets.**

## 6. Simulator mandate — test everything, visually, on real devices

You have an iOS Simulator tool (`mcp__Claude_Code_iOS_Simulator__control`) and `xcrun simctl`. **Use them relentlessly. Do not declare any UI work done that you have not looked at.**

Workflow discipline:
1. **`attach` FIRST**, before building — it's cheap, opens instantly on a booted device, and surfaces any device-access prompt while the owner is still around.
2. **Derive the device list from reality**: run `xcrun simctl list devicetypes` and `xcrun simctl list runtimes` and build your matrix from actual output. Create missing devices with `xcrun simctl create`. Do not trust the table below to match this machine.
3. Build, launch, then **screenshot every screen on every device in the matrix**. Compare them. Fix what's wrong. Screenshot again.
4. Drive real interactions — tap, swipe, type — don't just look at static screens.
5. Save evidence to `docs/screens/` so the work is reviewable.

**Target matrix** (verify availability first):

| Simulator | Points | Why it's in the set |
|---|---|---|
| `iPhone SE (3rd generation)` | 375×667 @2x | Home button, **zero top safe area**, shortest screen. Where prayer tables, zakat forms and tasbih break. Availability UNCERTAIN — check. |
| `iPhone 16e` | 390×844 | Notch, no Dynamic Island |
| `iPhone 17` | 402×874 | Dynamic Island, mainstream |
| `iPhone Air` | 420×912 | Odd width — catches hard-coded magic numbers |
| `iPhone 17 Pro Max` | 440×956 | Largest; **screenshot source at 1320×2868** |
| `iPhone 11` | 414×896 @2x | Only current 2x Face ID device — catches @3x assumptions |
| `iPad mini (A17 Pro)` | 744×1133 | Narrowest tablet |
| `iPad Air 11-inch (M3)` | 820×1180 | Most common iPad |
| `iPad Pro 13-inch (M4)` | 1032×1376 | **Screenshot source at 2064×2752 (REQUIRED)** |

Also: **run at least one iPad with the window dragged narrow.** Full-screen-only iPad testing will not find the resize bugs.

Test each device in **light, dark, and night-warm** themes, at default and **200% Dynamic Type**, and in **English, Arabic, and Urdu** (RTL on a dev build).

## 7. Research mandate — use `deep-research` constantly and without asking

The owner's instruction, verbatim in spirit: *use it for literally anything you need to know, as many times as you need.*

**Trigger it, don't deliberate:**
- Any API, library, or platform behavior you are not **certain** about right now.
- Any time you'd otherwise write "I think," "probably," "should be," or "typically."
- Before every non-trivial dependency choice or version bump.
- Whenever an error message isn't immediately, obviously explicable.
- Whenever a §5 fact is load-bearing for something irreversible — re-verify it.
- Any HIG, App Store, accessibility, or typography question.
- Any time two sources or two instincts conflict.

**How to use it well:** write a real brief — context, numbered questions, required output format, and an explicit instruction to mark uncertainty rather than guess. Run several in parallel when the questions are independent. Trust the reports, but treat anything flagged UNCERTAIN as unknown. **Never launder an uncertain finding into a confident claim** in code comments, docs, or your reports to the owner.

Guessing when you could have checked is the single worst thing you can do in this session.

## 8. How to work

1. **Plan mode first.** Investigate the current state properly — read the docs, read the code, boot a simulator, screenshot what exists today, run the gates, and research the open strategic questions (SDK upgrade, Native Tabs, iPad). *Then* present a plan. Do not plan from assumptions.
2. Sequence by leverage. Roughly: correctness and crashes → layout across the device matrix → native-surface/Liquid Glass adoption → feel (touch, motion, haptics) → accessibility → Arabic/RTL polish → performance → store assets. Reorder if the evidence says to.
3. Test-first where logic is involved. Simulator-verified where pixels are involved. Both where possible.
4. Run all gates before every commit. Conventional commits. Push to `main` only when green. Never end with `main` red or work uncommitted.
5. Keep `docs/PROGRESS.md`, `docs/TODO.md`, `docs/DECISIONS.md` and `docs/TESTPLAN.md` current as you go — not in a lump at the end.
6. Ambiguity a competent senior engineer could resolve → **resolve it, log it, keep moving.** Only Human Gates stop you.
7. Anything that genuinely needs the owner goes to `docs/BLOCKERS.md` in plain English with a yes/no recommendation. He is non-technical: no jargon, click-by-click steps when he must act.

## 9. Report back

When you finish, tell the owner in plain English:
- What changed and what it looks like now (attach or reference screenshots).
- What you verified, on which devices, and how.
- What you decided and why — especially the SDK and Native Tabs calls.
- What's still imperfect and what it would take.
- Anything new in `docs/BLOCKERS.md` that needs him.

Do not report anything as done that you have not actually seen working on a simulator.
