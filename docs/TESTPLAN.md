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

## Android — emulator truth-testing matrix (repeatable; release build)

Run against `scripts/android/build-release.sh` output on a rootable
google_apis AVD (deendawn_pixel / deendawn_api36), app primed via
`scripts/evidence-sweep/android/prime.sh`. `PKG=com.khavion.deendawn`.

- [ ] **Channels**: `adb shell dumpsys notification --noredact | grep -E "adhan\.|suhoor\.|nextprayer\."`
      → only active channel ids, correct `sound=` URIs, names localized; change a
      prayer's sound in-app → old channel deleted, new created.
- [ ] **Exact-alarm matrix**: `adb shell appops set $PKG SCHEDULE_EXACT_ALARM deny` →
      relaunch → "Make adhan times exact" card visible in More; `dumpsys alarm | grep -A3 $PKG`
      shows `window=+1h`; grant via the card's system screen (or `appops … allow` + foreground)
      → card gone, all alarms `window=0`. (Proven live 2026-07-30.)
- [ ] **Firing + channel sound (clock jump, root)**: `adb root`, note next `when=` in
      `dumpsys alarm`, `adb shell "date MMDDhhmmYYYY.ss; am broadcast -a android.intent.action.TIME_SET"`
      to 1 min before → adhan fires at the right minute, correct per-prayer sound, "Silence
      today" button present; pressing it cancels the rest of today only (`dumpsys alarm`).
- [ ] **Doze**: `dumpsys battery unplug && dumpsys deviceidle force-idle` → clock-jump past the
      next prayer → still fires (exact granted); repeat denied → may drift (inexact) but fires.
      `deviceidle unforce && dumpsys battery reset` after.
- [ ] **Reboot**: `adb reboot` → after boot, `dumpsys alarm | grep $PKG` shows the full set
      re-registered WITHOUT opening the app (expo-notifications BOOT_COMPLETED receiver).
- [ ] **Timezone**: `adb shell setprop persist.sys.timezone "Asia/Karachi"` (root) → foreground
      the app → full re-registration (`cancelled==scheduled==pending` in the reschedule log),
      times match the new zone.
- [ ] **Sticky next prayer**: toggle on in More → silent ongoing notification in the shade's
      Silent section with branded icon; clock-jump past a prayer → content updates on the next
      reschedule trigger. (Posted-state proven live 2026-07-30.)
- [ ] **Notification-launch (full adhan)**: schedule a fullAdhan prayer, fire via clock jump,
      tap the notification with the app KILLED → app opens and plays the full clip once
      (cold-start dedupe). RELEASE build only (debug splash quirk).
- [ ] **App shortcuts cold start**: long-press launcher icon → Qibla/Tasbih/Continue reading;
      invoke each with the app killed (known upstream flake expo-quick-actions#54 — verify).
- [ ] **Offline constitutional proof**: `scripts/e2e-android.sh -b release offline` (wiped
      state, reverses removed, airplane mode) — all worship features green.

## Android — device pass (human; no emulator equivalent)

- [ ] Real-magnetometer qibla: needle within ±3° of a reference compass; calibration chip on
      interference; figure-8 clears it.
- [ ] OEM battery killers: adhan still fires 3+ days after install without opening the app, on
      at least one Samsung (Sleeping apps) and one Xiaomi/Redmi (Autostart) device — the
      in-app "Adhan not playing?" steps must match what those devices actually show.
- [ ] Overnight real-Doze: Fajr adhan on time after a full idle night (forced deviceidle only
      proves logic, not real maintenance-window latency).
- [ ] Alarm-stream audibility: adhan channels ride USAGE_ALARM — verify alarm volume governs
      them and a muted MEDIA stream does NOT silence the adhan (and vice versa reads sanely).
- [ ] Haptic feel: tasbih detents/success and qibla alignment tick feel right on a real motor.
- [ ] Background audio: ≥15-min screen-off recitation stream (no wake lock is taken — watch
      for OEM kills); Bluetooth route + headphone-unplug behavior (upstream fix lands
      post-expo-audio 57.0.3 — re-test after the patch bump).
- [ ] Real-device cold start < 2s (iPhone-12-class equivalent Android hardware) + 60fps surah
      scroll — emulator numbers in docs/reports/android-perf/ are trends only.
- [ ] TalkBack pass: same checklist as VoiceOver (labels/order asserted in code), spoken on a
      real device; Arabic ayat announced as Arabic.
- [ ] Widget on a real launcher: add/resize/theme both modes; updates at prayer boundaries
      without opening the app; RTL layout under an ar/ur device language.
