# Design & Motion Audit — Deen Dawn (2026-07-14)

Owner-requested full design audit (colour, depth, motion, transitions, touch,
cross-platform parity) + a premium roadmap + a research-assistant prompt.
Visual report published as a private Claude artifact for Zohaib; this file is
the canonical repo record and the spec I implement from.

**Direction confirmed by Zohaib (AskUserQuestion, 2026-07-14):**

- Aesthetic: **Warmer & richer** — keep the calm editorial identity, add depth, subtle gradients, tasteful decorative moments.
- Motion: **Showcase on high-end** — expressive/fluid on capable phones, auto-simplified on older ones (the adaptive-hardware idea).
- Platforms: **Same look, native feel** — identical visual design + motion on iOS/Android, but honour each OS's native gestures/feedback.
- Workflow: **Recommend the workflow** (done below).

## Current-state snapshot (grounded in the code)

- **Reanimated 4.1 installed but unused** — screen transitions are OS defaults; nothing hand-crafted. Motion tokens (`duration` in tokens.ts) defined but never consumed.
- **Haptics in 3 places only**: tabs (`HapticTab`), qibla, tasbih. ~16 other screens are silent to touch.
- **Most Pressables have NO press feedback** (no opacity/scale/ripple) — only `Button` dims to 0.85 and tabs/qibla/tasbih react. Taps feel "dead."
- **No hardware awareness** — `expo-device` not installed; no refresh-rate / Low Power / Reduce-Motion handling anywhere (DESIGN.md claims Reduce Motion but code doesn't do it).
- **Flat surfaces** — no gradients/blur/elevation (`expo-linear-gradient`, `expo-blur`, `react-native-svg` all absent). Countdown is a solid green block.
- **Loading = plain `ActivityIndicator`** (audio, tips); no skeletons.
- **Tab bar reads the raw system colour scheme**, not the app `ThemeProvider` — so it ignores manual theme (e.g. night-warm). Small bug to fix.
- **Strengths to protect:** 3 contrast-tested themes, Newsreader+Public Sans type, `enableFreeze`/`freezeOnBlur`, native lists, fast builds.

## The foundation — one app, three experiences (adaptive tiers)

Measure the device once at launch (chip class, RAM, refresh rate, Low Power Mode, Reduce Motion) → pick a tier. Design is identical across all three; only motion/richness flexes. Can step down live (Low Power flips a flagship to Smooth). **Reduce Motion / Low Power always force Essential.**

- **Radiant** (iPhone 13+/flagship Android, 120 Hz): spring transitions @120fps, dawn gradients + soft depth/blur, animated countdown & tasbih, full haptics, parallax/list reveals.
- **Smooth** (mid-range, 60 Hz): same transitions timed for 60fps, depth kept + heavy blur simplified, key moments animate/rest cross-fades, core haptics.
- **Essential** (older/low-RAM, or Reduce Motion on): instant cross-fades only, flat depth, snappy state, minimal haptics, rock-solid 60fps.

## Seven moves (current → premium)

1. **Warmer, richer surfaces** — layered elevation, soft depth, a signature **dawn gradient** (night→gold→ivory, built from palette colours) on the Today countdown & prayer-arrival. Gold as warm light, not just a dot.
2. **A real motion system** — turn dormant motion tokens into a shared spring/curve library; crafted shared-axis screen transitions instead of raw OS slide.
3. **Tactility** — press state (scale + light) + matched haptic on every interactive element; one helper maps press/select/success/arrival, tier- & battery-aware.
4. **Signature moments** — rolling tasbih counter with a tick, dhikr-completion bloom, graceful prayer-time arrival. Calm, worship-appropriate.
5. **Same look, native feel** — identical design/motion both platforms; honour iOS swipe-back spring + Android predictive-back/ripple under our press state. Every divergence documented.
6. **Loading that feels instant** — skeletons mirroring content shape + shimmer (capable phones), simple placeholder on the rest.
7. **The adaptive engine** — a single `useMotion()` "how much can this phone afford right now?" signal every component reads; build once, moves 1–6 scale themselves. Add `expo-device`.

## Reference table (area · today · premium · tier-gated)

| Area | Today | Premium | Tier-gated |
|---|---|---|---|
| Screen transitions | OS default slide | Shared-axis glide + fade | Yes |
| Buttons | Opacity 0.85 | Scale-in + haptic; primary soft depth | Partly |
| Lists | Static, no press feedback | Press state + first-load reveal | Yes |
| Today countdown | Solid green, static | Living dawn gradient + count animation | Partly |
| Tasbih counter | Instant swap | Rolling number, tick, completion bloom | Yes |
| Tab bar | Reads system theme | Follows app theme; icon animates | No · **fix** |
| Cards/surfaces | Flat + hairline | Tonal elevation, optional blur | Yes |
| Loading | Spinner | Skeleton + shimmer | Yes |
| Haptics | 3 screens | Full mapped vocabulary | Yes |
| Theme switch | Hard swap | Gentle cross-fade | Yes |
| Reduce Motion | Not handled | First-class → forces Essential | Always |

## Roadmap

1. **Foundation** — adaptive engine + motion library + haptics helper + press feedback everywhere + Reduce-Motion/Low-Power wiring. (Biggest felt jump.)
2. **Warmth** — depth/elevation, dawn gradient, reworked countdown hero.
3. **Signature** — crafted transitions + tasbih/dhikr/prayer-arrival moments.
4. **Polish** — skeletons, theme cross-fade, native-feel platform niceties, device-matrix test pass.

Each phase ships green (tests + both platforms) before the next.

## Guardrails

- **Reverence over flash** — Quranic/Arabic content stays serene & still; motion lives only in the chrome around it.
- **Never janky** — 60fps floor; if a phone can't afford an effect it doesn't get it.
- **Accessibility first** — Reduce Motion always wins; keep the screen-reader work intact; motion never traps focus.
- **Battery & privacy** — back off in Low Power; hardware detection is fully on-device, transmits nothing.

## Recommended workflow (Zohaib chose "recommend")

No separate design tool needed. Strongest path for a solo founder + AI engineer:
use **Claude (claude.ai) as the design studio** — feed it reference apps, have it
generate mockups + a structured motion spec, hand those back to me to build in
React Native. Optional Figma sanity-check later. The research prompt below
validates this and returns ready-to-paste design-generation instructions.

## Research-assistant prompt (paste into Claude chat → Research)

> I'm the non-technical founder of "Deen Dawn," a privacy-first, free, no-ads Islamic app (prayer times, Quran reader, qibla, tasbih, hijri calendar, zakat) built in React Native / Expo. It ships on iOS and Android from one codebase.
>
> My engineer (an AI coding agent) will implement whatever design specs I bring back, in React Native using Reanimated 4 and Expo. I need YOU to research and hand me a concrete, validated DESIGN WORKFLOW plus copy-paste instructions.
>
> DESIGN GOALS
> - Aesthetic: keep a calm, editorial, trustworthy Islamic identity, but make it "warmer & richer" — subtle gradients, gentle depth/elevation, tasteful decorative moments. Premium, never flashy or gaudy. Reverent.
> - Motion: expressive and fluid on high-end phones (120Hz), automatically simplified on older ones. Respect Reduce Motion and Low Power Mode.
> - Platforms: identical visual design on iOS and Android, but honor each OS's native gestures/feedback (iOS swipe-back, Android predictive back + ripple).
> - Existing brand: forest-green primary (#274D3D) + bronze/gold accent (#8A6430) on warm-ivory (#F7F6F2) / cool-near-black (#15181D); Newsreader serif + Public Sans; Amiri/Nastaliq for Arabic/Urdu.
>
> PLEASE RESEARCH AND RETURN, WITH SOURCES:
> 1. The best way for a NON-DESIGNER to produce premium mobile UI + motion specs that an engineer can implement — compare: (a) using Claude/AI chat to generate mockups + specs, (b) Figma + AI plugins, (c) reference-driven teardowns. Recommend one primary workflow and say why.
> 2. How to prompt an AI (Claude) to generate high-fidelity mobile mockups AND a structured MOTION SPEC (durations, easing/springs, what animates, per-tier fallbacks) that a React Native engineer can build from. What exactly should I include? What reference images help most?
> 3. The current best practices for "adaptive quality tiers" in React Native / Expo: detecting device capability (expo-device), reading screen refresh rate (120Hz ProMotion), Low Power Mode, and Reduce Motion — and scaling animation richness accordingly. Any known libraries or patterns.
> 4. What "premium" mobile motion actually looks like in 2026 for calm, content-first apps (not games): specific interaction patterns worth copying, and 4–6 named reference apps (ideally including respectful/faith or wellness apps) whose feel I should point Claude at.
> 5. Motion norms for RELIGIOUS/worship apps specifically — what's considered respectful vs. distracting, so nothing I add feels inappropriate.
>
> FORMAT YOUR ANSWER AS:
> A) A recommended workflow (numbered steps I can follow).
> B) A ready-to-paste "design generation" prompt/instructions I can drop straight into a fresh Claude chat to generate the mockups + motion spec (fill it with the goals above). This is the thing I hand back to my engineer.
> C) A short list of reference apps + why, with links.
> D) Any adaptive-tier technical notes my engineer should know.
