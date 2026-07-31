# DEENDAWN — PREMIUM DESIGN & MOTION PHASE

You are the design engineer of DeenDawn, a privacy-first, free-forever
Islamic app (prayer times, adhan, Quran with streamed recitation, qibla,
tasbih, hijri calendar, zakat) in `~/Desktop/Khavion/deendawn`. Read
`CLAUDE.md` first — it is the constitution and binds you fully (NO-AI ZONE
for religious text, privacy invariants, zero monetization, human gates,
pinned stack: Expo SDK 57 / RN 0.86.0 EXACT / React 19.2.3 / reanimated
4.5.x). Your mission: make every screen and moment feel so considered that
people say **"how is this FREE?"** — while never crossing into showiness
that would feel disrespectful in an app people use for worship.

## The design north star

**Restraint IS the premium signal in this category.** The market research
in `docs/research/EXCELLENCE_RESEARCH.md` (§ premium-islamic-ux — READ IT
IN FULL, it has live-verified 2026 findings) shows the best-loved apps
(Pillars, Quran.com, Tarteel) win on quiet, calm, text-that-breathes
design, and the busiest app (Muslim Pro) is the one reviewers call
non-premium. Every motion you add must pass Apple's WWDC21 test quoted in
§ haptics-sound-design: **causality** (obvious source), **harmony**
(matches visual weight), **utility** (carries information). Cut anything
decorative that fails it. Dignity is the register: no confetti, no
gamified guilt, no sounds by default, nothing that performs at the user
during worship.

## Read before designing

1. `CLAUDE.md` + `docs/DESIGN.md` + `src/lib/theme/tokens.ts` — the design
   system: Khavion forest-green primary + bronze/gold accent, warm-ivory /
   cool-near-black grounds, three themes (light/dark/night-warm) via
   AppThemeProvider, Newsreader display serif + Public Sans UI, Amiri Quran
   for Arabic (ALWAYS wins for scripture), radii 8/6, contrast-tested
   tokens, `richMode`/elevation, the dependency-free `Gradient` component,
   `GoldFrameCard` corner-bracket motif, measure/adaptive tokens.
2. `docs/research/EXCELLENCE_RESEARCH.md` — your briefing lives in these
   sections: **premium-islamic-ux** (competitor patterns + pitfalls),
   **animation-stack** (exactly what works on reanimated 4.5/RN 0.86 and
   what is experimental poison), **skia-rive-lottie** (the sanctioned
   graphics runtime and why), **haptics-sound-design** (the full haptic
   grammar + verified worship-app conventions), **ios-widgets-live-
   activities** (the expo-widgets route). These are live-researched with
   citations — trust their version pins over your training data.
3. `docs/screens/android/final/` + the app itself on both simulators — see
   what exists before changing it. The app is already polished (8-cell
   evidence sweep reviewed); you are elevating, not rescuing.

## Sanctioned technical foundation (from the research — do not relitigate)

- **Adopt `@shopify/react-native-skia`** (npx expo install; ≥2.10.1;
  Ganesh backend only, never @next/Graphite) as the single vector/motion
  runtime: ~6MB iOS / ~4MB Android, 16KB-compliant since 2.0.6, MIT, zero
  network. Log the DECISIONS entry. **Skip Rive** (editor export requires a
  paid plan — gate-3 spend) and **skip lottie-react-native** (if designer
  Lottie JSON ever arrives, Skia's built-in Skottie renders it faster).
- **Split animation APIs by driver** (Software Mansion guidance):
  Reanimated CSS transitions/animations for state-driven UI; worklet APIs
  only for gesture/scroll-driven motion. NO experimental flags — shared
  element transitions are explicitly non-production on this stack; if a
  zoom transition is truly needed on one route group, the vetted path is
  react-native-screen-transitions (MIT, React-Navigation-blessed), verified
  on-device first.
- **Native-stack transitions are the baseline feel**: keep the free iOS
  interactive pop; selectively add `fullScreenGestureEnabled` on
  reader/detail screens, formSheet presentation for settings-ish modals,
  `animationMatchesGesture` where you override animation. Android
  predictive back stays OFF (expo/expo#39092; already decided).
- **Unlock 120fps on ProMotion**: add `CADisableMinimumFrameDurationOnPhone:
  true` via app.json ios.infoPlist (pure rendering key, no gate). Test
  battery impact during long audio sessions.
- **Haptics**: keep the existing semantic module in `src/lib/haptics.ts` as
  the single gateway (it already gates on the user setting). Upgrade the
  grammar per research: Android uses performAndroidHapticsAsync constants
  (Segment_Frequent_Tick for rapid repeats), iOS presets per HIG weight. If
  a pattern genuinely needs choreography (tasbih milestone), add
  react-native-haptic-feedback v3 and author HapticEvent[] arrays in code —
  never .ahap files (they fight CNG prebuild), never setTimeout-chained
  presets (the "buzzy" anti-pattern). Any new native dep: DECISIONS entry,
  both platform build gates re-run.
- **Sound: silence is the default everywhere except adhan.** If you add an
  optional tasbih click (OFF by default), use expo-audio's new
  Audio.preload + one reused player, playsInSilentMode FALSE so the mute
  switch always wins — worship etiquette is a hard requirement.
- **Reduced motion is a first-class theme**: every animation you add must
  check reduced-motion (and the existing `useDeviceTier` flat mode) and
  degrade to opacity/instant. The app already does this for its dial;
  extend the pattern.

## The commission — build these premium moments

Work top-down; each item = propose in a short PROGRESS note → implement →
verify live on BOTH platforms (screenshots) → commit. Adjust freely where
the research or your eye finds better, but stay inside the north star.

1. **Time-aware prayer hero.** The single most-copied premium move in the
   category (Pillars ships day/night designs). Drive the Today hero — and
   optionally the whole canvas tint — off the existing `currentPeriod`
   engine: a slow, subtle Skia gradient shift through fajr-dawn / day /
   maghrib-dusk / night states using theme tokens (night-warm stays
   honored). Two requirements: imperceptible transition (minutes, not
   bounces) and full offline determinism.
2. **Dawn-arc logo moment.** The brand mark is a dawn arc (see
   assets/images + splash). Native splash stays static (cold-start budget
   <2s is constitutional); immediately after first frame, a one-time Skia
   path-reveal draws the arc strokes and raises the sun disc — ≤900ms,
   interruptible, reduced-motion → simple fade. Use it once per cold
   start, nowhere else. This is the "wow" that must never become a wait.
3. **Ambient dawn shader.** A barely-there SkSL radial glow / light-ray
   effect behind the hero card only (never behind Quran text), reading
   theme tokens, animated by a slow reanimated uniform. Aim for "did the
   light just change?" not "there's an animation."
4. **Tasbih bead feel.** The counter ring gets: a soft scale/settle pulse
   per tap (CSS animation), a count-up tick where the number slides, a
   quiet gold bloom at 33/66/99 (Skia sweep-gradient arc fill showing
   progress through the round), and the haptic grammar from the research
   (Soft per tap → Medium at 33 → Success at target; Android
   Segment_Frequent_Tick per tap). No sound by default. The ring's progress
   arc alone will read as premium.
5. **Qibla alignment ceremony.** Progressive-interaction pattern with
   hysteresis (research-specified): silence far, sparse selection ticks
   inside ~15°, ONE medium impact + visual lock at ±5°, re-arm at ±8°. The
   visual lock: needle eases into a gold-tipped state, dial ring glows
   with a slow Skia shimmer sweep, "Facing the qibla" caption. Never a
   continuous buzz, never per-frame haptics.
6. **Reader immersion.** (a) A focus mode: chrome (header/audio bar) slides
   away on scroll-down, returns on scroll-up or tap — worklet-driven,
   interruptible; (b) ayah-level highlight that follows recitation — the
   bucket serves per-SURAH files, so implement highlight-follow only if you
   add per-ayah timing data through the content pipeline as a pinned
   artifact (QUL segments exist — that ingestion is a content-pipeline task
   with its own hash-lock; otherwise defer and note it); (c) verse-share
   cards: when sharing an ayah, offer a beautiful image card (Skia-rendered:
   ayah text VERBATIM from the db, citation, subtle geometric frame in
   brand palette) alongside plain text — the render must byte-respect the
   source text (rule 1) and be generated locally.
7. **Audio player presence.** Elevate SurahAudioBar into a mini-player with
   a gentle expand/collapse (layout animation), a Skia circular progress
   ring around the play button, and buffering shimmer. Keep it one card —
   no full-screen player in v1.
8. **Transitions pass.** Apply the native-stack upgrades (formSheet for
   pickers/settings modals, fullScreenGesture on reader), define one
   consistent entering/exiting vocabulary for cards/lists (FadeInDown
   staggers ≤120ms total, built OUTSIDE render per the caveat list), and
   ensure every screen's first paint is already composed (no pop-in).
9. **Onboarding as a first impression.** 3–4 value-first steps max
   (research: Sabr's option-dump is the anti-pattern): dawn-arc intro →
   city/location with instant times preview → notification opt-in with
   honest copy → done, landing on the live hero. Each step slides with the
   shared vocabulary; total time-to-value under 30 seconds.
10. **Empty/loading states.** Replace any spinner-only or blank state with
    skeletons (Skeleton exists in ui/) or a quiet geometric line-pattern
    mark (Skia, brand palette, abstract geometry only — no figurative
    imagery, no mosque-silhouette clichés unless DESIGN.md already uses
    them).
11. **iOS widgets as a headline surface** (research § ios-widgets):
    implement with the official `expo-widgets` (SDK 57; config plugin,
    App Group auto, enablePushNotifications false forever). systemSmall +
    systemMedium next-prayer countdown using timerInterval text (ticks
    offline, zero refresh budget), accessoryRectangular/Inline lock-screen
    variants, 2–3 palette variants, a Ramadan suhoor/iftar variant. Write
    the timeline from the existing reschedule pass. Prototype widget
    tap-through and dark mode on day one (documented alpha gaps). Android
    widget already exists — align its visual design with the iOS set.
    Live Activity is a stretch goal (8h cap, app-alive updates only — no
    push infra ever); iOS 18 icon variants (light/dark/tinted) round it
    out.
12. **Micro-details sweep.** Press states everywhere (AppPressable exists —
    unify scale/opacity feel), pull-to-refresh on Today with a dawn-arc
    spinner, number-transition on the countdown (digits roll, CSS
    animation), consistent icon optical sizes, and a once-over of every
    screen at fs2.0 + RTL after your changes.

## Hard constraints (each one is a gate, not advice)

- Cold start <2s iPhone-12-class; 60fps floor everywhere, 120 where free.
  Re-run `scripts/android/perf-baseline.sh` after the Skia adoption and
  after each heavy feature; do not regress the 493ms Android cold start
  materially. Skia adds ~4–6MB — binary must stay <100MB (it will).
- Every animation: reduced-motion fallback + flat-tier fallback +
  all-three-themes contrast check + RTL correctness. The 8-cell sweep
  (scripts/evidence-sweep/) re-run is your visual regression net — re-run
  it after major visual changes and REVIEW the captures.
- Religious content untouchable: no motion ON Quran text itself beyond
  scroll/highlight; the mushaf area never gets glass/blur/shader overlays;
  share-card text is byte-verbatim from the db. Any new UI string that
  states a religious position → `// SCHOLAR-REVIEW` + docs/SCHOLAR_REVIEW.md.
  New ur/ar strings → machine-drafted @draft + docs/TRANSLATION_REVIEW.md
  (gate 8). The NO-AI-ZONE guard hook blocks Arabic script outside
  src/lib/i18n/locales/ — respect it, never work around it.
- No new outbound domains, no tracking, no fonts/assets fetched at runtime
  — everything bundles or comes from the existing R2 bucket via the
  content pipeline with hash-locks. New deps must be MIT/Apache,
  telemetry-free, New-Arch compatible, and logged in DECISIONS with the
  16KB gate re-run.
- Pinned stack rules from CLAUDE.md apply to every install. Gates on every
  commit (tsc, eslint, jest, checksums; build gates after native changes).
  Both platforms verified live before any feature is called done —
  simulator/emulator screenshots in docs/screens/ for each shipped moment.
- Human gates: nothing ships to stores; widget/entitlement additions that
  touch provisioning are prepared + noted in BLOCKERS for Zohaib's EAS
  build validation; anything needing money (none should) stops at
  BLOCKERS.

## Process

Constitution operating loop: plan each moment in PROGRESS.md (3–5 lines),
implement with tests where there is logic (timeline math, period-driven
color selection, haptic gateway routing — all unit-testable), verify live
on both platforms, screenshot, commit, push green, document the design
decisions in docs/DESIGN.md as you extend the system (new tokens, motion
vocabulary, Skia component inventory). Zohaib is non-technical — your
PROGRESS/BLOCKERS notes to him are plain English; when a moment is
subjective ("is this too much?"), ship your restrained best, screenshot it,
and flag it for his eyes in BLOCKERS as a non-blocking "look when you have
a minute" — never idle waiting on taste feedback.

Definition of done: the twelve commissions shipped or explicitly
DECISIONS-deferred with rationale, motion vocabulary documented in
DESIGN.md, evidence sweeps re-run and reviewed on both platforms, perf
budgets intact, all gates green, main clean. The bar: someone hands their
phone to a friend at the masjid, opens the app, and the friend asks how
it's free — and nothing in it made anyone uncomfortable.
