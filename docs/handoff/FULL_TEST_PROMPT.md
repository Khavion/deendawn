# DEENDAWN — FULL-DEPTH TEST & HARDENING PHASE

You are the sole autonomous engineer of DeenDawn, working in
`~/Desktop/Khavion/deendawn`. Read `CLAUDE.md` first — it is your
constitution and every rule in it (NO-AI ZONE, privacy invariants, zero
monetization, human gates, pinned stack) remains fully in force. This prompt
authorizes a single mission: **make this the most thoroughly tested,
provably correct prayer app on either store.** You run autonomously in
bypass-permissions mode; take all the time you need; never idle — when one
path blocks, log it in docs/BLOCKERS.md and advance another.

## Read these before writing any code (in order)

1. `CLAUDE.md` — constitution. `AGENTS.md` — Expo docs pointer.
2. `docs/reviews/CODEBASE_REVIEW_2026-07-31.md` — a 5-agent verified defect
   worklist: 2 open blockers, ~9 majors, ~20 minors, and a ranked
   untested-areas list. **This is your Phase 1 backlog.** Every finding was
   verified by reading real code paths; two were reproduced live. Trust the
   file/line pointers but re-verify each claim before fixing (code may have
   drifted).
3. `docs/research/EXCELLENCE_RESEARCH.md` — 10 deep-research reports with
   live-web citations (2026-07-31). The sections `e2e-testing`,
   `rn-accessibility`, `rn-performance`, `ios-review-pitfalls`, and
   `store-conversion` are YOUR briefing; the design-flavored sections belong
   to a parallel design session — do not implement design features from
   them.
4. `docs/PROGRESS.md`, `docs/DECISIONS.md`, `docs/TESTPLAN.md`,
   `docs/BLOCKERS.md` — current state. The Android side already has: five
   Maestro suites green on release, an 8-cell locale×theme×font evidence
   sweep, notification truth-tests (exact firing, Doze, reboot), 16KB +
   manifest hard gates, and a perf baseline. iOS has build gates and a
   smoke pass. Your job includes bringing iOS to full parity.

## Ground rules (non-negotiable)

- Stack is PINNED: Expo SDK 57, RN 0.86.0 EXACT, React 19.2.3. Never run
  `expo install --fix`, never bump RN/minor versions. Patch bumps of expo-*
  packages only with a DECISIONS entry. reanimated must stay 4.5.x
  (≥4.5.3 has RN-0.86 crash fixes — check the current installed patch).
- Gates on EVERY commit: `npx tsc --noEmit`, `npx eslint .`, `npx jest`,
  `node content-pipeline/verify.mjs`. Android release changes also re-run
  `scripts/android/build-release.sh` (16KB + manifest gates). iOS native
  changes re-run prebuild + xcodebuild (export LANG=en_US.UTF-8 first —
  CocoaPods crashes under the default C locale on this machine).
- Conventional commits, push to main only when green
  (`git -c credential.helper='!gh auth git-credential' push origin main` —
  plain push 403s on this machine).
- Test-first for every defect fix: write the failing regression test, then
  fix, then green. A fix without a test is not done.
- Android emulator (`source scripts/android/env.sh`; AVDs deendawn_pixel,
  deendawn_tablet, deendawn_resizable, ummah_api24_low, UmmahPlayTest) and
  iOS simulators (SE3-18.6, iPhone 16e/16 Pro Max, iPad if present) are
  yours to use freely and autonomously — boot, install, drive, screenshot,
  LOOK at the result. "It compiles" is never verification.
- Known harness traps (hard-won, do not rediscover): Maestro flows carry NO
  env defaults — drivers inject everything via `-e` BEFORE the flow path;
  transition_animation_scale=0 kills NativeTabs switching (zero only
  window+animator scales); never run `uiautomator dump` loops while Maestro
  is connecting (it steals the UiAutomation connection and the driver times
  out); the NO-AI ZONE guard hook blocks Arabic script outside
  `src/lib/i18n/locales/` — e2e/scripts must derive Arabic labels from the
  locale JSON at runtime; kill stale Metro on 8081 before starting a new
  one; `adb reverse` for 8081/8083 on Android, none needed on iOS sim.

## Phase 1 — Fix the verified defect worklist (highest value first)

Work `docs/reviews/CODEBASE_REVIEW_2026-07-31.md` top-down:

1. The two open BLOCKERS: silence-today resurrection (persist the silenced
   date; filter in planNotifications; cover warm + killed-state paths) and
   the high-latitude widget crash (isValidTime filter in
   buildWidgetSnapshot).
2. The notification majors as one coherent sub-project — the iOS
   trigger-parse churn (move fireMs into content.data; fix the test mocks
   that mask it), the silence-action-plays-adhan bug (actionIdentifier
   check), the revoke→re-grant ghost window (force re-registration per cold
   start on Android), and the suhoor cross-midnight edge (rides the fireMs
   fix). Then re-run the Android notification truth-test matrix from
   docs/TESTPLAN.md on the emulator (exact firing, silence-today
   persistence through a background reschedule, Doze, reboot) and prove the
   iOS queue is now a no-op diff on foreground (log counts before/after).
3. The calculation majors: midnight-crossing isha (offset −1 planning +
   nextPrayer), zakat parseAmount (grouping commas, U+066B, U+06F0-06F9),
   then the zakat/hijri/period/compass/calendar minors.
4. The content/media majors: quran.db update-versioning (KV hash vs
   content.lock + forceOverwrite — this is also a rule-1 integrity check),
   AskScreen race + rejection handling, the rule-1.5 count-honesty fix
   (constitutional — the phrased claim must be exactly verifiable), and
   widgetTaskHandler failure containment.
5. The quality majors: language-cancel persistence, MoreScreen stale-state
   re-sync. Then the minors and dead-code cleanups as small commits.
6. Security-audit hardening: blockedPermissions ACTIVITY_RECOGNITION,
   NSMotionUsageDescription override, jest→devDependencies, `__DEV__`-gate
   the theme-preview route, optional ATS local-networking strip. The
   time-sensitive entitlement is a decision to SURFACE in BLOCKERS (gate 6:
   entitlement change + an App-ID portal click for Zohaib), with your
   recommendation — do not silently add it.

## Phase 2 — Close the ranked test gaps

From the review's untested-areas ranking: the notifications glue layer
(AppState/background-task/listener wiring), the language Alert flow, the
audio unmount/becoming-noisy lifecycle, widgetTaskHandler headless failure
modes, and a self-test suite for `content-pipeline/verify.mjs` (tampered
byte → nonzero exit; wrong counts, empty ayah, mojibake fixtures → each
rejected). The constitutional gate deserves its own guard.

## Phase 3 — Test-infrastructure upgrades (research-backed)

Per `docs/research/EXCELLENCE_RESEARCH.md` § e2e-testing:

- Stay Maestro-only (Detox does not support RN 0.86; Appium is the wrong
  fit). Pin Maestro ≥2.7.0 locally for the iOS reliability fixes; check
  what's installed.
- Build `scripts/e2e-ios.sh` parity with the Android driver and get ALL six
  flows green on the iOS simulator (they are env-parameterized already);
  then wire the audio flow to include play→back (the crash regression) on
  both platforms.
- Add visual regression with react-native-owl OR a zero-dependency
  pixelmatch script over the existing sweep captures (research recommends
  starting local + free; Chromatic mobile is early-access — do not adopt).
  Baseline the 8-cell Android sweep and a new iOS sweep.
- Build the iOS evidence sweep to Android parity:
  `scripts/evidence-sweep/ios/` driving locale (en/ur/ar with real restart
  path), theme × Dynamic Type (incl. AX sizes), on SE-class + Pro-Max-class
  + iPad simulators. Review every capture; fix what you find; write the
  MANIFEST.
- Add a Node-side SQLite contract suite: open the built
  `assets/db/quran.db` with better-sqlite3 in Jest and pin the query
  contracts the app relies on (FTS matches for known terms incl. the
  Ask-count honesty cases, verse counts, metadata joins, first/last ayah
  bytes).
- Evaluate-and-decide (DECISIONS entry either way, do not churn
  blindly): RNTL v14 migration (async render everywhere; requires Node
  22.13+ — check CI reality) vs staying on v13 until after TestFlight.
- Offline constitutional proof on iOS: wiped simulator, airplane-mode
  equivalent (disable network), release-configuration build — prayer
  times, Quran, qibla UI, tasbih, hijri, zakat all functional.

## Phase 4 — Accessibility audit (research § rn-accessibility)

Execute the checklist from the research report on BOTH platforms:
VoiceOver and TalkBack full-app passes (every screen reachable and
operable; the compass dial, counter ring, and audio player have correct
roles/values/announcements — some exist, verify all), Dynamic Type to AX5
where the app must degrade gracefully (the fs2.0 Android sweep already
passed; iOS AX sizes are unverified), reduced-motion honored by every
animation (grep reanimated usage; add useReducedMotion gates where
missing), RTL VoiceOver order in ar/ur, and contrast re-verification of
any UI you touched. Log device-only items (real TalkBack gestures, braille)
to TESTPLAN's device pass.

## Phase 5 — Performance verification (research § rn-performance)

Re-baseline after all fixes: Android `scripts/android/perf-baseline.sh`
(cold start was 493ms / 0.22% jank — do not regress), and build the iOS
equivalent (simctl launch timing + Instruments if available). Check the
Hermes V1 + reanimated memory regression note (25-30% on SDK 56/57)
against a long audio-playback session on the emulator — if it bites, the
research documents the worklets Bundle Mode workaround (production-only).
Verify FlashList v2 behavior in the 6236-row surah/ayah lists at fs2.0.
Budgets from the constitution: cold start <2s on iPhone-12-class, 60fps
scroll, scheduling job <500ms.

## Phase 6 — Store-readiness re-verification

- Re-run the full Android release battery at HEAD: build-release.sh gates,
  five Maestro suites on release, the 8-cell sweep re-capture if UI
  changed, notification truth-tests if the scheduler changed.
- iOS: prebuild + xcodebuild green; ensure zero new entitlements/plist
  changes slipped in beyond what BLOCKERS documents; verify the privacy
  answers still hold ("Data Not Collected" was re-verified 2026-07-31 —
  keep it true; any new dependency must be audited for network calls).
- Research § ios-review-pitfalls: write the 4.3(b) defense paragraph into
  `fastlane/metadata` review notes (original engine, zero-collection
  evidence, no template lineage) and pre-write the Play data-safety note
  about inert Firebase classes (from the security audit).
- Update BLOCKERS' two READY FOR HUMAN SUBMIT checklists with anything
  this phase changed. End state: both checklists accurate, everything
  above them green, a printed `GATE:` line for anything new that needs
  Zohaib.

## Operating loop

Same as the constitution: plan in PROGRESS.md, failing tests first, fix,
gates, conventional commit, push when green, update PROGRESS/TODO/
DECISIONS, loop. Blocked → BLOCKERS.md with a plain-English recommendation
Zohaib can approve with yes/no → next task. Zohaib is non-technical: every
line addressed to him is jargon-free with click-by-click steps.

Definition of done: review worklist empty (fixed or explicitly
DECISIONS-deferred with rationale), test-gap list closed, six Maestro flows
green on BOTH platforms' release-configuration builds, iOS evidence sweep
reviewed + manifested, a11y checklist executed with findings fixed, perf
re-baselined with no regression, store checklists refreshed, working tree
clean, main green.
