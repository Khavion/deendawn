# Dark-mode appearance oscillation on RN 0.86 — research report (2026-07-29)

Deep-research findings for the open Phase-2 bug: with the OS in dark mode, `useColorScheme()` /
`Appearance.getColorScheme()` alternate between 'light' and 'dark' across appearance events while the
OS appearance never changes; JS-themed content and the natively drawn tab bar disagree. Reproduced
with the plain JS tab bar too (pre-NativeTabs), so it is not a NativeTabs regression.

## Headline

**The oscillation is unreported upstream and unfixed in every RN 0.86.x patch** (0.86.1 was burned;
0.86.2's fix list contains nothing appearance-related; 0.87-rc changes Appearance *types* only).
The mechanism, however, is fully explained by RN 0.86 source:

- `RCTRootView` and `RCTSurfaceHostingView` both post `RCTUserInterfaceStyleDidChangeNotification`
  from `traitCollectionDidChange:` on **every** trait change (no previous-vs-new style comparison),
  each with **its own** traitCollection.
- `RCTAppearance.appearanceChanged:` recomputes the cached color scheme from the **poster's** traits
  with no window filtering (`sUseKeyWindowForSystemStyle` defaults to NO).
- Therefore any second RN surface living in a different trait environment poisons the cache each time
  its traits tick, flipping the scheme back and forth. A confirmed candidate second surface exists in
  dev builds: LogBox is a `UIWindow` hosting an `RCTSurfaceHostingView` with no
  `overrideUserInterfaceStyle` set. (expo-dev-menu overlay windows are additional unexamined
  candidates.) The native tab bar reads real window traits — hence JS vs native disagreement.
- iOS 26 has independently documented trait-propagation flakiness (Apple forums 802028, 806665),
  which plausibly multiplies spurious `traitCollectionDidChange` calls.

Consequence: the bug very likely correlates with **dev builds** (the poisoning surfaces are dev-only
windows); release-build behavior is publicly untested. `RCTKeyWindowValuesProxy` (window *size*
observation) is not the vector.

## Fix adopted (Phase 4.5 of the session plan)

1. **Pref-split appearance pinning in `AppThemeProvider`** — plan-review caught that blanket
   `Appearance.setColorScheme(...)` pinning would freeze system tracking (overriding every window
   suppresses the trait-change events that feed `Appearance`, and `getColorScheme()` reads back the
   app's own override):
   - explicit prefs (light/dark/nightWarm): `setColorScheme('light'|'dark')` — in RN 0.86 this also
     sets `overrideUserInterfaceStyle` on every window, re-aligning native chrome (tab bar, sheets,
     alerts) with the app theme;
   - system pref: `setColorScheme(null)` — clears all overrides, restores live OS tracking.
2. **Key-window hardening for system mode** — config plugin calling the public
   `RCT_EXTERN void RCTUseKeyWindowForSystemStyle(BOOL)` with YES at launch, so `RCTAppearance`
   always derives the scheme from the key window's traits regardless of which surface posted.
3. **Dependency hygiene** — expo-router → 57.0.9 (≥ 57.0.3 ships the swipe-back white-flash fix,
   the only shipped fix in the adjacent NativeTabs flash family) and RN → 0.86.2 (no appearance fix;
   hygiene only).

## Distinct from the NativeTabs "dark flash" family

expo/expo #39969 / #44033 / #40389 / #47084 are view/stack **background colors during transitions**,
not wrong Appearance API values; our plain-JS-tab-bar repro proves the distinction. The one shipped
fix in that family is expo-router 57.0.3's swipe-back flash fix (hence the bump above).

## Upstream

This oscillation would make a strong first report against facebook/react-native (repro +
the no-delta-check posting analysis). Filing a public issue is Human Gate 2 — draft to be prepared
and offered in BLOCKERS, never posted autonomously.

## Key sources (all fetched 2026-07-29)

- RN 0.86.2 source: `React/CoreModules/RCTAppearance.{h,mm}`, `React/Base/RCTRootView.m`,
  `React/Base/Surface/SurfaceHostingView/RCTSurfaceHostingView.mm`, `React/CoreModules/RCTLogBoxView.mm`
- RN CHANGELOG (0.86.1 burned, 0.86.2 2026-07-27, 0.87-rc Appearance type changes)
- expo-router CHANGELOG sdk-57 (57.0.3 swipe-back flash fix; latest 57.0.9)
- facebook/react-native #49330, #35972 (backgrounding inversion family), #54959/#54993
  (`'unspecified'` regression), #49605 (KeyWindowValuesProxy = size, not appearance)
- expo/expo #39969, #44033, #40389, #47084/#47081 (NativeTabs flash family)
- Apple Developer forums 802028 (iOS 26 nav-bar light-in-dark, FB20370553), 806665 (iPadOS 26.1
  stale traitCollection)
- Issue-search sweeps on both repos returned zero matches for this oscillation (absence verified)
