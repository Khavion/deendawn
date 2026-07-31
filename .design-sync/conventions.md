# DeenDawn conventions

DeenDawn is a privacy-first, free-forever Islamic app (prayer times, Quran,
qibla, tasbih). The register is **quiet reverence**: restraint reads as
premium here. One featured `GoldFrameCard` per screen at most; everything
else sits on plain `Card`/canvas. Never decorate or animate Quranic text.

## Setup and wrapping

Components are React Native (rendered via react-native-web here). They read
the theme from context and **fall back to the light palette when no provider
is present**, so bare compositions render correctly. To control the theme,
wrap the tree in `DSPreviewRoot` (exported from the bundle) — it supplies
the real ThemeContext. There is no CSS-class theming.

## Styling idiom: JS tokens via the `style` prop — no CSS classes

This system has **no class vocabulary**. Style layout glue with inline
`style` objects using the exported tokens (never hand-typed hex/px):

- `palette.light` / `palette.dark` / `palette.nightWarm` — color tokens:
  `bgCanvas`, `bgSurface`, `bgElevated`, `textPrimary`, `textSecondary`,
  `accent` (forest green), `onPrimary`, `ochre` (bronze gold), `ochreSoft`,
  `accentSoft`, `textOnAccentSoft`, `border`, `icon`, `success`.
- `spacing.xs/s/m/l/xl/xxl` (4/8/12/16/24/32), `radius.card` (8) /
  `radius.control` (6), `fontSize`, `duration`.
- `featuredGradient.light|dark` + `textOnFeatured.light|dark` — the featured
  card fill and its text color.
- `fonts.*` — font-family names, but prefer `AppText` variants over raw
  text styling.

All text goes through `AppText` (`variant`: `display`, `displayAccent`,
`title`, `subtitle`, `reading`, `body`, `bodyStrong`, `link`, `eyebrow`,
`caption`; optional `color`). Newsreader serif carries display/title/reading;
Public Sans carries body/UI — never restyle families by hand. Everything
tappable goes through `AppPressable` (or `Button` for actions) — it carries
the pressed-state dim and the haptic verb (`haptic`: `press`, `select`,
`detent`, `success`, `warning`, `error`).

## Where the truth lives

Read `styles.css` → `_ds_bundle.css` for every token as a CSS custom
property (`--color-*`, `--spacing-*`, `--radius-*`; dark and night-warm
under `[data-theme="dark"]` / `[data-theme="nightWarm"]`). Per-component
API: each `<Name>.d.ts`; usage: each `<Name>.prompt.md`;
design rationale: `guidelines/docs/DESIGN.md`.

## Idiomatic build snippet

```tsx
import { AppText, AppPressable, Card, Divider, SectionRule, palette, spacing } from 'deendawn';

const t = palette.light;
<SectionRule label="TODAY'S TIMES" />
<Card style={{ padding: 0, marginTop: spacing.m }}>
  {[['Fajr', '5:27 AM'], ['Dhuhr', '1:29 PM']].map(([name, time], i) => (
    <React.Fragment key={name}>
      {i > 0 && <Divider />}
      <AppPressable haptic="press"
        style={{ flexDirection: 'row', justifyContent: 'space-between', padding: spacing.l }}>
        <AppText variant="body">{name}</AppText>
        <AppText variant="body" color={t.textSecondary}>{time}</AppText>
      </AppPressable>
    </React.Fragment>
  ))}
</Card>
```

Layout is flexbox via `View` with `style` objects (RNW): `flexDirection`,
`gap`, `padding` — no CSS files, no className.
