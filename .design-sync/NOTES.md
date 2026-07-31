# design-sync notes — DeenDawn

Repo shape: a React Native APP (not a packaged library) — components bundle
for the browser via react-native-web. Everything below is wired through
`.design-sync/ds-web/` and config; no lib forks.

- Build command (no dist): the converter runs with
  `--entry ./src/components/ui/index.ts` (synth from source). Discovery
  found no `.d.ts` exports → all 11 components are pinned in
  `cfg.componentSrcMap`; a NEW ui primitive must be added there AND to
  `src/components/ui/index.ts`.
- Web aliasing lives in `.design-sync/ds-web/tsconfig.json` paths:
  `react-native` → react-native-web's dist entry, plus stubs for
  `expo-sqlite`, `expo-haptics`, and `react-native-safe-area-context`
  (that one deep-imports RN Flow internals for native codegen; browser has
  no notches, so plain Views are honest).
- `DSPreviewRoot` (ds-web/preview-support.tsx, via `extraEntries`) supplies
  the REAL ThemeContext with the real palette. It does NOT use
  AppThemeProvider because that calls `Appearance.setColorScheme` — an
  RN-only API missing from react-native-web 0.21 (throws, empty roots).
  preview-support also re-exports the design tokens onto the bundle
  (palette/spacing/radius/fonts/fontSize/duration/featuredGradient/
  textOnFeatured) — previews and the design agent depend on those exports.
- RNW injects `<style id="react-native-stylesheet">`, which the render
  check's `[id^="r"]` root selector matches first → every card reads
  rootEmpty. DSPreviewRoot renames it to `x-rn-stylesheet` on mount. If
  cards ever all go "root empty" again, check this first.
- Tokens CSS is GENERATED: `node .design-sync/ds-web/gen-tokens.mjs`
  (reads src/lib/theme/tokens.ts → ds-web/tokens.css, wired as
  `cfg.cssEntry`). RE-RUN IT whenever tokens.ts changes — it does not run
  automatically.
- Fonts: ds-web/fonts.css @font-faces point at @expo-google-fonts packages
  + assets/fonts; family names must equal the exact strings in tokens.ts
  `fonts` (RNW passes fontFamily through verbatim).
- Guidelines scoped to `docs/DESIGN.md` (`cfg.guidelinesGlob`) — the
  default glob swept 21 internal docs (BLOCKERS etc.) into the project.
- Playwright: repo has none; `.ds-sync` uses playwright@1.58.0 to match
  the machine's cached chromium-1208.
- The NO-AI-ZONE guard hook blocks raw Arabic script outside
  src/lib/i18n/locales/ — previews therefore use Latin content only. Do
  not try to add Arabic sample text to preview .tsx files.

## Known render warns

(none — 11/11 clean, no thin/variantsIdentical warns recorded)

## Re-sync risks

- `ds-web/tokens.css` silently goes stale when `src/lib/theme/tokens.ts`
  changes (generated file, manual step) — re-run gen-tokens.mjs before any
  re-sync; a color drift here ships wrong values to every design.
- The safe-area/haptics/sqlite stubs and the RNW stylesheet rename track
  upstream internals (RNW 0.21, expo SDK 57); a package bump can break
  previews in the "all cards empty" or Flow-parse ways documented above.
- `componentSrcMap` is a full enumeration by necessity — new components
  won't appear until added there.
- Verified on the package shape with authored previews for all 11; nothing
  was skipped or floor-carded.
