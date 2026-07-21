# Store screenshots (DRAFTS)

`en-US/01-today`, `02-quran`, `03-ask`, `04-calendar` are draft hero shots
captured from the iOS Simulator (iPhone 17, English, default text size). They
show the shipping layout for the App Store listing.

**Status (2026-07-21):** the 6.9" capture pipeline is verified. `01-today.png`
is now a correct-size **1320×2868** (6.9", iPhone 17 Pro Max) hero. `02-quran`,
`03-ask`, `04-calendar` are still the older 1206×2622 (6.3") drafts.

**Before submission:** regenerate the FULL set at 6.9" from the **release build**
(the release build hides the `__DEV__` "DEV translation / DEV audio" badges that
appear on the reader + audio bar in dev builds — those screens can't be used for
the store until then). To capture: boot an iPhone 17 Pro Max sim, install the
release build, navigate, and `xcrun simctl io <device> screenshot`. This is
step 9 on the READY FOR HUMAN SUBMIT checklist in docs/BLOCKERS.md. Non-reader
screens (Today, Qibla, Calendar, Tasbih, Zakat, Quran list) are already
badge-free and store-ready in any build.

Chosen hero screens and why:

1. Today — prayer times + countdown (the daily-use core).
2. Quran — Uthmani Arabic + translation (the reading experience).
3. Ask — "60 verses match 'patience'…" with tappable references (the honest,
   on-device, no-cloud differentiator; guideline 4.3).
4. Calendar — hijri dual-date grid with the "calculated" disclaimer.
