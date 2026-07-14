# Rich design spec — "Direction 1c (Rich)"

Implementation contract for the owner-approved design **Deen Dawn — Rich Screens**
(source saved at `docs/design-source/rich-screens.dc.html`; reference renders in
`docs/design-screens/`). A faithful *evolution* of the current app — same palette,
fonts (Newsreader + Public Sans + Amiri), radii 8/6, hairline borders. Every value
below is extracted from the design's rendered DOM.

## The seven rich elements

1. **Prayer-period ambient gradient** — a soft, time-of-day "dawn-sky" gradient behind the top of a screen *where a prayer period applies* (Home). Fajr = dawn peach, Isha = night. Never behind Quranic text.
2. **Two-layer soft depth + 3-step elevation scale** (below). Featured cards cast a subtly **green-tinted** shadow.
3. **Fine gold frame on the ONE featured card per screen** — 1px gold border + small gold corner brackets.
4. **Illuminated gold hairline section rules** — a gold gradient line (fades in/out) beside section eyebrows (e.g. "TODAY'S TIMES").
5. **≤6% girih texture** — tiny geometric SVG tiling, very low opacity, only in ambient/gradient areas.
6. **Reverence holds** — Quranic ayat are NEVER decorated (only calm section rules between them); the **reader, qibla, and prayer surfaces stay quiet** (no gradient/texture over sacred or focus content).
7. Locked palette + type + radius 8/6 + hairline borders throughout.

## Elevation scale (two-layer, extracted)

| Step | Light | Dark |
|---|---|---|
| **E1** subtle | `rgba(32,36,42,.04) 0 1px 2px` | `rgba(0,0,0,.25) 0 1px 2px` |
| **E2** card | `rgba(32,36,42,.05) 0 2px 4px, rgba(32,36,42,.06) 0 8px 20px` | `rgba(0,0,0,.30) 0 1px 3px` + `0 12px 44px rgba(0,0,0,.30)` |
| **E3** featured (green-tinted) | `rgba(32,36,42,.06) 0 2px 4px, rgba(28,55,44,.14) 0 10px 24px` → strongest `rgba(28,55,44,.16) 0 16px 34px` | `rgba(0,0,0,.34) 0 2px 6px, rgba(0,0,0,.44) 0 18px 40px` |

`rgba(28,55,44)` = `#1C372C` (forest green) — featured cards glow faintly green.

## Gold frame (featured card)

- Border: `1px solid #8A6430` (light) / `#C69B5F` (dark).
- Corner brackets: short L-shaped gold strokes at the 4 corners (SVG).
- `border-left: 3px solid #8A6430` variant used for inline callouts (e.g. DEV badge).

## Gradients (extracted, palette-only)

- **Dawn ambient (Fajr, light)**: `linear-gradient(177deg, #F0D8BE 0%, #F3E5D4 30%, #F6F0E7 56%, #F7F6F2 84%)`.
- **Night ambient (Isha, dark)**: `linear-gradient(180deg, #222836 0%, #191E27 44%, #15181D 82%)`; lighter variants `#1D222B/#1E242F/#1F2530 → #15181D`.
- **Warm card fills (light)**: `#F3E6D6 → #F7F6F2`, `#F4E7D7 → #F7F6F2`, `#F4EBE0 → #F7F6F2`.
- **Featured green card**: `linear-gradient(180deg, #2C5646 0%, #23402F 100%)` (deep, light-mode) / `#78AB93 → #66997F` (sage, dark-mode).
- **Gold hairline rule**: `linear-gradient(90deg, transparent, rgba(138,100,48,.35–.45), transparent)` (light) / `rgba(198,155,95,.38–.5)` (dark).
- **Radial gold glow** (behind hero): `radial-gradient(circle at 50% 42%, rgba(198,155,95,.12–.14), transparent)`.

### Prayer-period ambient palette (derive the top gradient from the current period)

| Period | Light top → | Dark top → |
|---|---|---|
| Fajr / dawn | `#F0D8BE → #F7F6F2` (peach) | `#232A38 → #15181D` |
| Sunrise–Dhuhr / day | `#F4EBE0 → #F7F6F2` (pale warm) | `#1E242F → #15181D` |
| Asr / afternoon | `#F4E7D7 → #F7F6F2` | `#1F2530 → #15181D` |
| Maghrib / dusk | `#F3E6D6 → #F7F6F2` (amber) | `#222836 → #15181D` |
| Isha / night | `#F4E7D7 → #F7F6F2` (quiet) | `#222836 → #191E27 → #15181D` (deep night) |

## Per-screen treatment

- **01 Home** — ambient period gradient + girih at top; gold "FAJR · DAWN" period eyebrow (diamond marker); NEXT-PRAYER = the featured card (green gradient + gold frame + corners + E3 green shadow); "TODAY'S TIMES" gold section rule; prayer list is an **elevated card** (E2) with the next row sage-filled + gold left accent.
- **02 Quran list** — search + continue-reading (featured, gold frame); surah rows in an elevated card; gold section rule under the header. Arabic names quiet.
- **03 Quran reader** — **quiet**. Ayat undecorated. Only the **audio player** is the featured gold-framed card (E2). Calm hairline rules between ayat (not gold-heavy). Tajweed legend unchanged.
- **04 Qibla** — **quiet**. Sensor needle refined; gold Kaaba marker; the compass dial is the featured element but restrained (no busy texture over the focus surface).
- **05 Tasbih** — counter ring featured; detent chips 33/99; history as an elevated card. Ring gets a faint gold-glow at completion (tier-gated).
- **06 Calendar** — month grid in an elevated card; today ringed; white-days as gold dots; disclaimer callout with gold left border.
- **07 Zakat** — the total ("ZAKAT DUE 2.5%") is the featured green gold-framed card; form rows in elevated cards; section rules.
- **08 Settings/More** — grouped rows in elevated cards; section rules; the About/privacy card featured.

## Adaptive tiering (how Rich scales — the owner's "sense the hardware" ask)

Rich renders fully on capable devices and steps down automatically. One `useDeviceTier()` signal (chip/RAM via expo-device + refresh rate + Low Power + Reduce Motion) → `radiant | smooth | essential`.

| Effect | radiant | smooth | essential |
|---|---|---|---|
| Ambient gradient | full | full | flat tint (single color) |
| Girih texture | yes (≤6%) | yes | off |
| Radial glow | yes | subtle | off |
| Elevation | E1–E3 two-layer | two-layer | single soft shadow |
| Gold corner brackets | yes | yes | border only |
| Motion (later phases) | springs 120fps | 60fps | crossfade/instant |

Reduce Motion or Low Power → force `essential`. 60fps floor always.

## Build order

1. **Foundation** — deps (expo-linear-gradient, react-native-svg, expo-device); tokens (elevation, gradients, period palette, gold frame); `useDeviceTier()`; primitives (`Gradient`, `Surface`/elevation, `GoldFrameCard`, `SectionRule`, `GirihTexture`, `PeriodEyebrow`).
2. **Home** (hero) — prove the whole system on one screen.
3. Quran list · Tasbih · Calendar · Zakat · Settings (rich chrome).
4. Reader · Qibla (restrained featured cards only — reverence).
5. Motion pass (springs, press feedback, signature moments) per the audit.
