# Current design reference — screenshots

The single folder to point a design tool at. Captured **2026-07-14** from the
**current green Khavion design** (after the design-system + AppText migrations +
accessibility pass), on **both platforms** from the same codebase:

- **iOS** — iPhone 17 simulator (iOS 26). Files with **no platform prefix**.
- **Android** — Pixel 7 emulator (API 35). Files prefixed **`android-`**.

All three themes are shown for iOS (light / dark / night-warm); Android is shown
in light to demonstrate cross-platform parity ("same look, native feel").

> These **supersede** `docs/screens/` and `docs/audit-screens/`, which predate
> the green palette (old lapis look) and are kept only as E2E / store-prep /
> external-audit evidence.

## iOS — light (warm ivory ground, forest-green primary)

| File | Screen |
|---|---|
| `01-today-light.png` | Today — prayer times + next-prayer countdown |
| `02-quran-list-light.png` | Quran — surah list + search |
| `03-surah-reader-light.png` | Surah reader — Arabic (Amiri) + translation |
| `04-ask-light.png` | Ask — deterministic Quran/library search |
| `05-qibla-light.png` | Qibla — compass / permission state |
| `06-more-light.png` | More — settings, method/madhab, links |
| `07-calendar-light.png` | Hijri calendar — dual dates, month grid |
| `08-tasbih-light.png` | Tasbih — counter ring, 33/99, history |
| `09-zakat-light.png` | Zakat calculator — form |
| `10-library-light.png` | Philosophers library — thinker list |
| `11-tips-light.png` | Tips — support-the-developer jar |
| `12-about-light.png` | About — version, attribution, privacy |

## iOS — dark (cool near-black ground, sage primary)

`13-today-dark.png` · `14-surah-reader-dark.png` · `15-tasbih-dark.png` ·
`16-qibla-dark.png` · `17-ask-dark.png` · `18-more-dark.png`

## iOS — night-warm (warm near-black ground, gold accent — low-light reading mode)

`20-today-nightwarm.png` · `21-quran-list-nightwarm.png` ·
`22-surah-reader-nightwarm.png` · `23-tasbih-nightwarm.png` ·
`24-calendar-nightwarm.png` · `25-more-nightwarm.png`

## Design system on one screen

`19-theme-preview-all.png` — the wordmark, full type scale, buttons, card, and
all three palettes in one view. **Best single image for a quick read of the system.**

## Android — light (Pixel 7, same codebase)

| File | Screen |
|---|---|
| `android-01-today.png` | Today |
| `android-02-quran-list.png` | Quran list |
| `android-03-surah-reader.png` | Surah reader |
| `android-04-ask.png` | Ask |
| `android-05-qibla.png` | Qibla |
| `android-06-more.png` | More |
| `android-07-calendar.png` | Calendar |
| `android-08-tasbih.png` | Tasbih |
| `android-09-zakat.png` | Zakat |
| `android-10-library.png` | Library |
| `android-11-tips.png` | Tips |
| `android-12-about.png` | About |

_The Android chrome (status bar, back arrow, nav gesture bar) is the platform's
own; everything inside the app is the shared design — that parity is the point._
