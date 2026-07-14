# Store screenshots (DRAFTS)

`en-US/01-today`, `02-quran`, `03-ask`, `04-calendar` are draft hero shots
captured from the iOS Simulator (iPhone 17, English, default text size). They
show the shipping layout for the App Store listing.

**Size caveat for submission:** these are 1206×2796-class (6.3" display). App
Store Connect's _primary_ required size is 6.9" (iPhone 17 Pro Max, 1320×2868).
Regenerate the final set on a 6.9" simulator right before submission (they must
come from the release build anyway). The Maestro capture flow is reusable —
boot an iPhone 17 Pro Max sim, install the release build, and re-run the same
navigation. This is step 9 on the READY FOR HUMAN SUBMIT checklist in
docs/BLOCKERS.md.

Chosen hero screens and why:

1. Today — prayer times + countdown (the daily-use core).
2. Quran — Uthmani Arabic + translation (the reading experience).
3. Ask — "60 verses match 'patience'…" with tappable references (the honest,
   on-device, no-cloud differentiator; guideline 4.3).
4. Calendar — hijri dual-date grid with the "calculated" disclaimer.
