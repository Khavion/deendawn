# Evidence sweep tooling (Phase-9 style release-build QA)

Reusable scripts behind `docs/screens/final/` (see its MANIFEST.md):

- `prime.sh <udid> <app>` — boot, install the release .app, create the container,
  seed user data (onboarded + Houston + en).
- `sweep.sh <udid> <outdir> <routes...>` — deep-link every route and screenshot.
- `cells.sh` — the full phone matrix (8 devices × theme/type/locale cells).
- `m3-*.yaml` — Maestro flows for the iPad cells: iPads re-prompt the
  "Open in Deen Dawn?" scheme dialog on EVERY deep link, so captures must
  dismiss + settle per link (phones persist the approval).
- `manifest.py` — regenerates docs/screens/final/MANIFEST.md.

Hard-won rules (full detail in DECISIONS 2026-07-30):
- Sweep the RELEASE build — three shipped-pixel defects were invisible on dev.
- `simctl ui <udid> appearance` can silently stop applying on a long-booted
  sim; reboot the sim when captures disagree with the setting.
- Maestro element taps land offset inside iOS 26 native pageSheets — drive
  sheet selection via the keyboard (the city picker's return key exists for
  exactly this) and never assert on tab labels with ", tab" regexes
  (NativeTabs exposes plain labels).
