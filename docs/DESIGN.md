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
- Screen-reader (VoiceOver/TalkBack) pass.
