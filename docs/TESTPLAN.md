# TESTPLAN — DeenDawn

## Automated (this environment)

- Commit gates: `tsc --noEmit`, `eslint`, `jest` (affected), religious-text checksum test.
- Unit: prayer fixture matrix, scheduler math, qibla bearings, zakat math, hijri conversion.
- Golden: quran.db hashes vs content.lock, ayah counts, first/last ayah byte-equality.
- Component: RTL layout, translation toggle, bookmark flows.
- Accessibility audits (2026-07-13, on-device, no defects): Dynamic Type at accessibility-extra-large (Today/Ask/Tips/Zakat — 1.4x cap holds) and RTL/Arabic mirroring of the newer screens (Ask source toggle, surah audio bar). Method + Maestro RTL selector gotchas in DECISIONS.
- E2E (Maestro, iOS Simulator): onboarding, view times, change method, open surah, play audio (dev set), tasbih, zakat, airplane-mode offline suite. (`e2e/tips.yaml` deleted 2026-07-29 with the tip jar.)
- Offline suite (e2e/offline.yaml): runs against a RELEASE build with Metro and the dev audio server stopped — the simulator cannot toggle airplane mode, so "no servers of any kind" is the automated proxy; the flow covers onboarding → prayer times → Quran text → Ask counts → qibla → tasbih → zakat → calendar plus five offline cold starts, and asserts the audio bar is absent in release builds without a configured source.

## Device pass (human)

Checks that cannot run in the simulator; verify on a physical iPhone before external TestFlight:

- [ ] Qibla compass against a known bearing (real magnetometer + declination): needle within ±3° of a reference compass app; calibration chip appears when waving near metal; figure-8 clears it; true-north vs magnetic chip behavior with Location Services off.
- [ ] Qibla haptics on device: selection tick entering the ±3° window, single success buzz per session (simulator never fires haptics).
- [ ] Adhan notification fires with sound on a locked device; silent-switch and Focus behavior.
- [ ] Notification rescheduling after device reboot.
- [ ] Background audio continues under screen lock; lock-screen controls work.
- [x] ~~IAP sandbox purchase + restore on device.~~ N/A from 2026-07-29 — the app has no in-app purchases. Instead, verify the negative once on device: no purchase UI anywhere, and the App Store page shows no "In-App Purchases" badge.
- [ ] Cold start < 2s on iPhone 12-class hardware.
- [ ] Navigation frame profile on oldest supported hardware: open al-Baqara from the surah list, switch all tabs, language-switch restart — no visible hitching (E7).
- [ ] Prayer-countdown widget (docs/WIDGET.md): add to Home Screen, confirm next prayer + live countdown, verify timeline flips at a prayer boundary and across midnight without opening the app.
- [ ] True airplane-mode pass on device: enable airplane mode, run through prayer times, Quran, Ask, qibla, tasbih, zakat, calendar (mirrors e2e/offline.yaml).
- [ ] VoiceOver (iOS) / TalkBack (Android) pass: the code-level a11y props are in place (Arabic tagged `accessibilityLanguage="ar"`, every control labeled incl. all TextInputs/Switches, decorative icons hidden on BOTH platforms, selected states + live tasbih value, announcements for qibla alignment / tasbih round / reading-size changes) and asserted in unit tests — but actual speech must be heard on a device. Verify: Quran ayah is pronounced in Arabic (not spelled in English), bookmark announces "Add/Remove bookmark", calendar arrows announce Previous/Next month, settings options announce "selected", tasbih counter re-announces the count as you tap, verse reading order is Arabic → translation → citation, and **focus order is logical top-to-bottom on Today, reader, Ask, More, onboarding** (JSX order matches visual order — no absolute-positioned traps — but the swipe order must be heard to be signed off). Note whether tajweed colors (when enabled) need a non-color affordance for color-blind users.
