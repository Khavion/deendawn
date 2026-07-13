# DESIGN — DeenDawn "Warm Editorial" system

Source: research brief provided by Zohaib on 2026-07-12. This file is the working
summary; the operative rules live in `src/lib/theme/tokens.ts` (every component
derives from tokens — never hardcode a hex, radius, or duration inline).

## Direction

Warm editorial: serif reading face + humanist UI sans + unmodified Amiri Quran
for Arabic; manuscript-derived palette (lapis, gold ochre, ivory) tokenized for
light / dark / night-warm; disciplined restraint. Anti-goals ("AI slop"):
Inter-everywhere, purple/indigo gradients, uniform radii, shadows on
everything, centered-everything, bounce easing, cards-within-cards.

## Decisions taken (Zohaib can veto on sight; see docs/DECISIONS.md)

- Reading serif: **Literata** (bookish, built for long-form screen reading — fits scripture more than the newsy Newsreader). SIL OFL, pinned artifact.
- UI sans: **Source Sans 3** (quiet humanist, pairs well under a serif). SIL OFL, pinned artifact.
- Arabic: **Amiri Quran** stays default (both-fonts user setting deferred).
- Night-warm reading mode: **opt-in toggle**, reader surfaces only.
- Accent balance: lapis = primary accent/interactive; ochre = sparse highlights (bookmarks, badges); vermilion ≈ unused for now; green = success only.
- Manuscript imagery (Met/Smithsonian CC0): deferred to a dedicated pass with aniconism-safe scope (geometry/illumination only) + scholar sign-off (Gate #5).

## Token rules

- Palettes: light (ivory canvas), dark (#121212 warm-tinted elevations, desaturated accents, off-white text — never pure white on pure black), night-warm (amber-shifted reader).
- Contrast: enforced by `src/lib/theme/__tests__/contrast.test.ts` — 7:1 body, 4.5:1 secondary/interactive text, 3:1 large accents. A palette change that breaks ratios fails CI.
- Spacing: 4/8/12/16/24/32/48/64 only. Radius: 12 (cards) / 8 (controls) only.
- Type scale (pt): 34/28/24/20/17/15/13/11. Arabic ayah body ≥28pt at ~2.0 line-height (tashkeel clearance).
- Motion: 200–300 ms, ease-in-out; transform/opacity only; honor Reduce Motion.
- Haptics: only where one sentence explains what it confirms (tasbih detents 33/99, adhan moment, tip success).

## Still to apply (tracked in TODO)

- FlashList for long surah lists (perf pass).
- Dynamic Type audit (`maxFontSizeMultiplier` set; test at large sizes).
- RTL primitives audit (`paddingStart`/`marginEnd`).
- Manuscript-art editorial moments (onboarding, empty states) — CC0 only, license log per file.
- Adhan audio at −16 LUFS when audio epic lands.
