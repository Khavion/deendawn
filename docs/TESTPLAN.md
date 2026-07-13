# TESTPLAN — DeenDawn

## Automated (this environment)

- Commit gates: `tsc --noEmit`, `eslint`, `jest` (affected), religious-text checksum test.
- Unit: prayer fixture matrix, scheduler math, qibla bearings, zakat math, hijri conversion.
- Golden: quran.db hashes vs content.lock, ayah counts, first/last ayah byte-equality.
- Component: RTL layout, translation toggle, bookmark flows.
- E2E (Maestro, iOS Simulator): onboarding, view times, change method, open surah, play audio (dev set), tasbih, zakat, tip sheet (sandbox), airplane-mode offline suite.

## Device pass (human)

Checks that cannot run in the simulator; verify on a physical iPhone before external TestFlight:

- [ ] Qibla compass against a known bearing (real magnetometer + declination).
- [ ] Adhan notification fires with sound on a locked device; silent-switch and Focus behavior.
- [ ] Notification rescheduling after device reboot.
- [ ] Background audio continues under screen lock; lock-screen controls work.
- [ ] IAP sandbox purchase + restore on device.
- [ ] Cold start < 2s on iPhone 12-class hardware.
