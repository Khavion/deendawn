# DESIGN — Deen Dawn (Khavion brand system)

Working summary; the operative rules live in `src/lib/theme/tokens.ts` (every
component derives from tokens — never hardcode a hex, radius, or duration
inline). Contrast is enforced by `src/lib/theme/__tests__/contrast.test.ts`.

> **Supersession (2026-07-14):** this Khavion brand palette replaces the earlier
> "warm-editorial" lapis/ochre + Literata/Source Sans system. Brand source: the
> Khavion site (reference HTML was not available in-repo, so colors/radii/fonts
> come from the brief's explicit values; the Latin type scale is derived).

## Direction

Calm, editorial, trustworthy: a **forest-green** primary with a **bronze/gold**
accent on warm-ivory (light) and cool near-black (dark) grounds. Newsreader
display serif (with a single italic accent word in headlines) over Public Sans
for UI and reading. Amiri Quran / Noto Nastaliq for Arabic/Urdu — unchanged, and
always takes precedence for Quranic/Arabic content. Disciplined restraint; no
heavy shadows, one radius family, tokens-first.

## Palette (light / dark)

| Role | Light | Dark |
|---|---|---|
| bg (canvas) | `#F7F6F2` | `#15181D` |
| surface | `#FFFFFF` | `#1B1F25` |
| text | `#20242A` | `#F4F3EE` |
| muted (secondary) | `#6B675C` | `#9AA1AA` |
| faint (icon) | `#8B8677` | `#8E96A0` |
| line (border) | `#DCD9D0` | `#343A43` |
| **primary** (`accent` token, forest/sage) | `#274D3D` | `#6FA28B` |
| primarySoft (`accentSoft`) | `#B9CDC2` | `#24352E` |
| onPrimary (`textOnAccent`) | `#F7F6F2` | `#15181D` |
| **accent** (`ochre` token, bronze/gold) | `#8A6430` | `#C69B5F` |

Token-name mapping (kept so existing screens work): `accent` = the dominant
PRIMARY (forest/sage); `ochre` = the brand ACCENT (bronze/gold). `primary` /
`onPrimary` / `primarySoft` are added as clearer aliases for new primitives.

**Night-warm** (third theme, reading mode): rebuilt on the dark base, warm-
shifted (`#16130D` canvas, `#ECE3D2` text) with the gold family (`#C69B5F`).

## Type & metrics

- Latin display serif: **Newsreader** (300–700 + italic for the accent word).
- Latin UI/body sans: **Public Sans** (400–700).
- Arabic: **Amiri Quran** (Quranic) + **Noto Nastaliq** (Urdu, ~1.55× leading) — unchanged.
- Latin type scale (`latinType` in tokens): display 32, title 22, body 16, caption 13, eyebrow 12 (uppercase, letterSpacing ~1.9 = the brief's 0.14–0.16em at 12pt). Arabic ayah body ≥28pt at ~2.0 line-height (tashkeel clearance).
- Radii: **8 (cards) / 6 (controls)** only. Spacing: 4/8/12/16/24/32/48.
- Borders: `StyleSheet.hairlineWidth` in the line token. No shadows beyond subtle surface elevation.
- Motion: 200–300 ms, ease-in-out, transform/opacity only; honor Reduce Motion.

## Theming

- `AppThemeProvider` (`src/lib/theme/ThemeProvider.tsx`) resolves the persisted preference (`system` | `light` | `dark` | `nightWarm`) + system appearance into the active palette; `useTheme()` exposes `{mode, pref, setPref, tokens}`; `useTokens()` follows it (an explicit override still wins for the reader). Nav chrome + status bar derive from the resolved mode.
- Web→native adaptations: hover → pressed state (opacity 0.85); tap targets ≥48pt; WCAG AA in all three themes (contrast test).

## Primitives

`src/components/ui/`: **Screen** (safe-area + canvas), **AppText**, **Button**
(primary filled / secondary outline), **Card** (surface + hairline, radius 8),
**Divider**. A dev-only `app/theme-preview.tsx` renders every token + component
across all three themes.

`AppText` is the single Latin text primitive — it replaced the template's
`ThemedText`, which has been removed. Ten variants: `display` / `displayAccent`
(green italic accent word) / `title` / `subtitle` (serif headings), `reading`
(editorial Newsreader serif for translations + long-form), `body` / `bodyStrong`
/ `link` / `caption` (Public Sans), `eyebrow` (tracked uppercase label). Urdu
Nastaliq takes precedence when the UI language is `ur`; Quranic/Arabic content
renders through its own Amiri components, never AppText.

## Still to apply (tracked in TODO)

- Manuscript-art editorial moments (onboarding, empty states) — CC0 only, aniconism-safe, scholar sign-off (Gate #5).
- Screen-reader: code-level pass DONE (Arabic `accessibilityLanguage`, icon-only labels, decorative-icon hiding, selected states, live tasbih value; asserted in unit tests). On-device VoiceOver/TalkBack speech verification remains a device-pass item (docs/TESTPLAN.md).

## Handoff design system (2026-07-31 — the Claude Design spec, implemented)

The eight screens now follow `DeenDawn-Handoff.html` (§2 register, §3 tokens,
§5 component register, §6 screen specs, §7 verbatim copy). The register in
force: at most ONE GoldFrameCard per screen; the rotated-square diamond
(`Marker`) is the only mark (no icon set until Gate #5); celebration = glow +
bloom + ONE detent, ≤300ms, never particles/sound; copy tells the truth and
never guilts; night mutes the featured fill; identical pixels on both
platforms (custom TabBar; only the OS's own chrome remains).

New tokens (`src/lib/theme/tokens.ts`): `withAlpha()` / `flattenOver()`
(src/lib/color.ts — the only sanctioned way to derive washes/tracks/scrims),
`periodWash` (dawn 11% / dusk 15%→11% light per AA / night 9%, keyed by the
prayer-named DayPeriod), `heroWash` (17/22/10% on the featured fill),
`celebration` (glow 46px gold @55%, bloom 24%→0 @460px, maxDuration 300),
`latinType.numeral` (Newsreader Light 88/92, −1, tabular), `onFeaturedTokens`
(the palette a filled GoldFrameCard provides to its subtree — AA-proven on
the gradient). All contrast-tested; deviations logged in DECISIONS.

Component inventory (`src/components/ui/`, all in the design-sync map):
AppPressable · AppText (11 variants incl. numeral) · AyahBlock (the ONLY
mushaf vessel — closed prop surface) · BrandMark (dawn arc) · Button ·
CalendarGrid/DayCell · Card · CompassDial · Countdown (shared
countdownFormat thresholds with the widgets) · Divider (+onFeatured/inset) ·
Gradient · GoldFrameCard (+contentTone, night fill-drop) · ListCard/ListRow
(marked/past states) · ListenBar · Marker · MoneyText · PeriodEyebrow ·
ProgressRing (Skia; RTL counter-clockwise; dashed buffering) · RadioRow/
CheckRow · Screen · SectionRule · SegmentedRow · Sheet (in-house) ·
Skeleton · TabBar (66pt, diamond active mark) · TransportMark
(GATE-5-PLACEHOLDER) · WeekBars.

Motion vocabulary (current): 200–300ms ease-in-out, transform/opacity only,
Reduce Motion + flat-tier degrade everywhere. Sheet settles ≤300ms with
swipe/scrim dismiss; reader chrome hides on scroll-down past 24pt and
returns on scroll-up (250ms, off the a11y tree while hidden); ProgressRing
buffering rotates at duration.slow (opacity pulse under Reduce Motion);
celebration follows the §2 grammar (steady glow while a state holds, one
detent on entry, hysteresis re-arm on the qibla). The Skia ANIMATION polish
layer (dawn-arc path reveal, hero SkSL shader, tasbih bead pulse, countdown
digit roll, pull-to-refresh arc, verse-share cards) is DECISIONS-deferred to
a dedicated motion session — the geometry and tokens it will animate are in
place.
