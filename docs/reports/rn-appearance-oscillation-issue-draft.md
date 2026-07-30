# DRAFT — upstream issue for facebook/react-native (DO NOT POST without owner sign-off — Human Gate 2)

Status: draft only. Owner decision tracked in docs/BLOCKERS.md. If approved, file at
https://github.com/facebook/react-native/issues/new (Bug Report template) and strip this header.

---

**Title:** iOS: `useColorScheme()`/`Appearance` oscillates between light and dark when a second RN
window is present (per-poster traitCollection poisons the cached scheme)

## Description

With the OS appearance static (dark), `Appearance.getColorScheme()` / `useColorScheme()` alternate
between `'light'` and `'dark'` across appearance-change events. JS-themed content and natively drawn
chrome (e.g. a `UITabBarController` tab bar) visibly disagree and flip.

## Root-cause analysis (from 0.86.2 source)

1. Both root-view classes post `RCTUserInterfaceStyleDidChangeNotification` from
   `traitCollectionDidChange:` on **every** trait change — there is no comparison of
   `previousTraitCollection.userInterfaceStyle` vs the current one — and each posts **its own**
   `traitCollection` in userInfo:
   - `React/Base/RCTRootView.m`
   - `React/Base/Surface/SurfaceHostingView/RCTSurfaceHostingView.mm`
2. `RCTAppearance.appearanceChanged:` recomputes the cached scheme from the **poster's** traits.
   `sUseKeyWindowForSystemStyle` defaults to `NO`, so there is no key-window filtering.
3. Therefore any second RN surface living in a different trait environment re-poisons the cached
   scheme every time its traits tick. `RCTLogBoxView` is such a surface in dev builds: a `UIWindow`
   hosting an `RCTSurfaceHostingView`, with no `overrideUserInterfaceStyle`.

## Steps to reproduce

1. Dev build of any RN 0.86 app (New Architecture), `UIUserInterfaceStyle` = Automatic.
2. iOS 26 simulator (observed on 26.3/26.5), OS set to dark.
3. Trigger anything that makes a second RN window exist (LogBox has warnings collapsed is enough).
4. Log `Appearance.addChangeListener` values / render `useColorScheme()`: values alternate between
   'light' and 'dark' while Settings ▸ Appearance never changes.

Observed on: RN 0.86.0 and 0.86.2 (Expo SDK 57), iOS 26.3/26.5 simulators, New Architecture.
Not a NativeTabs/expo-router issue: reproduced with a plain JS tab bar as well.

## Expected behavior

The color scheme reported to JS tracks the application window's trait environment; posts from
auxiliary windows (LogBox, overlays) in a different trait environment do not flip it.

## Workarounds that exist today

- `RCTUseKeyWindowForSystemStyle(YES)` (public since 0.7x) fixes it by deriving from the key window.
- `Appearance.setColorScheme('light'|'dark')` pins app-wide (also sets
  `overrideUserInterfaceStyle` on every window), at the cost of live system tracking.

## Suggested fix

Either (a) make `traitCollectionDidChange:` in both root views post only when
`userInterfaceStyle` actually changed, or (b) ignore posts in `RCTAppearance` whose posting view is
not in the key window (or flip `sUseKeyWindowForSystemStyle` default). (a) is the smallest diff and
also cuts redundant notification traffic.
