# Codebase review — 2026-07-31 (5 parallel review agents, findings verified)

Every finding below was verified by the reviewing agent reading the actual code
paths (and, where noted, the installed node_modules native sources). Two were
additionally **reproduced live** the same day. This file is the canonical
defect worklist for the full-test session (docs/handoff/FULL_TEST_PROMPT.md).

Severity: **B** = blocker, **M** = major, m = minor, i = info.

## Confirmed-live findings (already fixed)

- ✅ **B — play-then-back crash** (`SurahAudioBar.tsx:79`): expo-modules-core
  releases the native player before the unmount cleanup;
  `clearLockScreenControls` threw on a freed shared object. Reproduced on the
  iOS simulator, fixed in commit cbc3425 (try/catch; resume save lands first).
  REMAINING: regression coverage — a component test that unmounts after play
  with a throwing mock, and a Maestro play→back step in the audio flow.
- ✅ i — `secrets/` gitignored ahead of the Play service-account key (81e9975).

## Notifications subsystem (agent 1)

1. **B — "Silence today" resurrects itself.** `silenceToday.ts:29` only
   cancels pending OS notifications; nothing persists the silenced date. Any
   `rescheduleAll` (app foreground, notification-received, AppState-active on
   Android, or the 12h background task — i.e. WITHOUT opening the app)
   re-plans today's remaining prayers and re-arms them. Fix: persist
   `notifications.silencedDate.v1` from both the warm listener and
   killed-state task; filter that date in `planNotifications`; clear on date
   change. Test: `silenceToday(now)` then `rescheduleAll(now+1h)` leaves
   today's ids absent, tomorrow's intact.
2. **M — iOS diff never matches → full ~40-notification churn every
   foreground.** `service.ts:163` parses trigger `{type:'date', value}` —
   the ANDROID shape; iOS serializes `timeInterval`/`seconds` (verified in
   NotificationRecords.swift). `fireMs` is always undefined on iOS → every
   run cancels + re-schedules everything; a mid-loop schedule rejection
   leaves the queue partially empty. Fix: write `fireMs` into `content.data`
   in `toContent` and read it back in `pendingPlanned` (keep the Android
   trigger read as legacy fallback). Fix the test mock that masks this
   (service.test.ts:24 mocks the Android shape for iOS paths).
3. **M — Android "Silence today" action PLAYS the full adhan.**
   `FullAdhanPlayer.tsx:48` never checks `response.actionIdentifier`, and
   action presses reach the response listener too — so pressing the silence
   button on a fullAdhan notification silences the day AND starts playback;
   `getLastNotificationResponseAsync` can replay it on cold start. Fix: bail
   unless `actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER`.
4. **M — exact-alarm revoke→re-grant while app dead = up to 8 days of
   silent misses.** Revoke cancels AlarmManager alarms but expo's store
   still lists them; re-grant before next launch → stored=true,
   current=true → no force → ghost entries never re-registered. Fix: force
   full re-registration once per cold start on Android (cheap, deterministic
   ids), per `exactAlarmState.ts:45` + `service.ts:126`.
5. m — `rescheduleAll` has no in-flight serialization (two concurrent full
   syncs per AppState-active on Android 12+; three with
   notification-received). Add a module-level in-flight latch with trailing
   re-run.
6. m — Full adhan has no didJustFinish handling: banner stays forever and
   the player is never released until Stop (`FullAdhanPlayer.tsx:56`).
7. m — `interruptionLevel: 'timeSensitive'` is set (`service.ts:63,89`) but
   the time-sensitive ENTITLEMENT is absent from app.json → iOS silently
   demotes it and adhans won't break through Focus. Fix: add
   `ios.entitlements` + note the App-ID capability click for Zohaib in
   BLOCKERS (gate 6 adjacent — surface, don't silently change entitlements).
8. m — Suhoor reminder that fires late tonight for tomorrow's fajr is not
   cancelled by "Silence today" (id keyed to fajr's day, fires "today").
   Fix rides finding 2's `fireMs` (cancel by fire-time range).
9. i — verified clean: channel-deletion ordering, 64-cap math (≤48 planned,
   capped 60), EventEmitter compat shim, inexact fallback, package name.

## Calculation correctness (agent 2)

1. **B — widget crashes at high latitudes.** `widgetData.ts:45` calls
   `.toISOString()` on engine output without validity checks; extreme
   latitudes return Invalid Date (documented in engine.ts) →
   RangeError on every widget refresh for Stockholm/Anchorage-class users.
   Fix: filter with `isValidTime` in `buildWidgetSnapshot` (rows already
   guard — the snapshot five lines earlier doesn't). Test with high-lat
   fixtures.
2. **M — midnight-crossing isha is cancelled minutes before firing.**
   Fixed-interval isha (Umm al-Qura +90/+120min) at high latitude fires
   after local midnight; `planNotifications` starts at offset 0 (today), so
   after midnight the pending `isha-<yesterday>` is missing from the plan
   and `diffPlans` CANCELS it. `nextPrayer` has the same blind spot. Fix:
   start the plan loop at offset −1; check yesterday's isha in
   `nextPrayer`.
3. **M — zakat `parseAmount` misparses money.** (a) `"10,000"` → 10.0
   (comma unconditionally becomes decimal — 1000× understatement);
   (b) Arabic decimal separator U+066B drops decimals; (c) Urdu/Persian
   digits U+06F0–06F9 parse to 0. Fix per ZakatScreen.tsx:54 suggestion;
   tests for all three.
4. m — hijri ±1 offset uses ±86,400,000 ms → wrong across DST transitions
   (`hijri.ts:22,30`); use calendar-component arithmetic on a noon anchor.
5. m — `currentPeriod` falls into the NEXT window (not night) on invalid
   boundaries; the "falls through to night" test asserts the bug
   (`period.ts:17`, period.test.ts:29).
6. m — `round2(1.005)` → 1 (binary float); use `Number.EPSILON` or integer
   cents (`zakat.ts:50`).
7. m — grams with missing price for that metal silently valued at 0 while
   status still reads due/belowNisab (`zakat.ts:58`); return a
   needs-price signal per metal.
8. m — `useHeading` low-pass blends magnetic + true frames across samples
   when iOS transiently reports trueHeading −1 (up to ~20° declination
   error); reset the filter on frame change (`useHeading.ts:74`).
9. m — CalendarScreen paging past @umalqura/core's range (1900-04→2077-11)
   throws an uncaught RangeError; clamp `move()` + disable arrows.

## Content + media features (agent 3)

1. ✅ **B — released-player crash** (fixed, see top; regression tests still
   owed).
2. **M — bundled quran.db is never refreshed on app update.**
   `app/_layout.tsx:147` uses assetSource without forceOverwrite/version
   marker → the Human-Gate-5 translation swap (or any pipeline fix) would
   never reach existing installs. Fix: version the on-device copy (KV hash
   from content.lock; forceOverwrite when changed). Also doubles as a rule-1
   integrity check at startup.
3. **M — AskScreen library race + unhandled rejection.** Stale
   `openLibraryDb().then(setLibResponse)` renders library sections after
   switching to Quran; a copy failure rejects unhandled and the UI silently
   resets (`AskScreen.tsx:44-58`). Fix: request-id guard + `.catch` error
   state.
4. **M — rule-1.5 honesty: count answers overstate.** `router.ts:81-113`
   counts synonym-EXPANDED matches but phrases the claim with the
   un-expanded term ("N verses match 'charity'" while counting alms too).
   Fix: count un-expanded terms exactly (keep expansion for refs), or
   disclose the matched set in the phrase. This is a constitutional
   honesty requirement.
5. **M — widgetTaskHandler has no failure containment** (headless throw →
   widget stranded stale; only the location-missing case is handled). Wrap
   the tree build; render PrayerTimesWidgetEmpty + log on failure.
6. m — stale-closure unmount save keys resume position to mount-time
   surah/reciter (`SurahAudioBar.tsx:73`); currently latent (router.push
   always remounts) but a "next surah" button would corrupt positions. Use
   refs.
7. m — "No matches" flashes during the 150ms search debounce
   (`SurahListScreen.tsx:60,102`); derive `searching` from debouncedQuery.
8. m — Ask snippets highlight against the LIVE input, not the submitted
   query (`AskScreen.tsx:192`).
9. m — library.db staleness check is size-only (`libraryDb.ts:34`); use a
   sidecar hash/build marker.

## Security + privacy audit (agent 4)

**Verdict: the app satisfies "Data Not Collected" today.** Zero telemetry
SDKs in the lockfile; zero fetch/XHR/WebSocket call sites in app code;
expo-updates compiled DISABLED; logging is an in-memory ring buffer;
location never leaves the device (no geocode calls — the city list is
bundled); Tier B downloads are R2-only, Ed25519-gated, and fail closed.

- m — `ACTIVITY_RECOGNITION` ships in the release manifest (expo-sensors
  Pedometer path, unused) — add to `android.blockedPermissions`.
- m — `NSMotionUsageDescription` ships Expo's boilerplate — override with an
  accurate privacy-worded string in `ios.infoPlist`.
- m/i — firebase-messaging + installreferrer classes are compiled in
  (expo-notifications/expo-application transitive) but INERT (no
  google-services.json, zero call sites). Play's SDK scanner may still ask —
  pre-write the data-safety note; optionally strip the two permissions via a
  config plugin.
- i — `NSAllowsLocalNetworking` is true in release (dev-server exception);
  optional hardening to strip for release.
- i — move `jest` from dependencies → devDependencies.
- i — production EAS profile deliberately has no audio URL until the custom
  domain exists — re-confirm before store submission.
- ✅ `secrets/` gitignore fixed same day.

## Code quality + test gaps (agent 5)

1. **M — language change persists even when the user cancels the RTL
   restart.** `MoreScreen.tsx:209` saves BEFORE the confirm Alert; Cancel
   leaves `language.v1` set → next cold start boots AR/UR strings in an LTR
   layout. Fix: save inside the Restart handler; add the Cancel test.
2. **M — MoreScreen holds stale KV copies that other screens mutate**
   (enableFreeze keeps it mounted; reader-side readingScale changes get
   overwritten from stale state). Fix: `useFocusEffect` re-read like
   BookmarksScreen, or a small prefs context.
3. m — `useNotificationScheduling` reschedules on EVERY settings change
   (depend on the prayer-relevant slice).
4. m — no ErrorBoundary anywhere in `app/`; a failed quran.db copy = eternal
   splash. Export ErrorBoundary from the root layout with retry +
   hideAsync.
5. m — 734-line MoreScreen: extract PickerModal to ui/, split sections.
6. m — duplicated reading-scale stepper (SurahScreen + MoreScreen) → one
   hook + component.
7. m — `askLibrary(libDb as unknown as QuranDb, ...)` double-cast — return a
   typed adapter instead.
8. i — dead code: `components/external-link.tsx`, `cancelAllAdhans`
   (service.ts:219 — wire for the all-off fast path + sticky dismissal +
   widget refresh, or delete), `goldRuleGradient`, `isMethodKey`.
9. i — `theme-preview` route is deep-linkable in release; gate behind
   `__DEV__`.
10. i — content-column style copy-pasted 9× → shared style/Screen prop.
11. i — Tier B card in MoreScreen wires no-op handlers + stale comment;
    real controller exists and is tested — wire before Gate 7. Keygen for
    `EMBEDDED_PUBLIC_KEY = 'PENDING-KEYGEN'` still pending.

### Ranked untested areas (importance × gap)

1. Notifications GLUE layer (useNotificationScheduling, backgroundRefresh,
   notificationTasks, channelSync, useExactAlarm) — zero tests; the math
   below it is well covered.
2. Language apply/restart Alert flow (Cancel path fails today — quality 1).
3. becomingNoisy + SurahAudioBar unmount lifecycle (crash class above).
4. widgetTaskHandler + PrayerTimesWidget tree (only widgetData is tested);
   headless failure modes.
5. content-pipeline `verify.mjs` failure paths (the constitutional gate has
   no self-test: tampered byte, wrong counts, mojibake fixtures must each
   fail).
6. iOS-shaped trigger serialization in service tests (masks notif finding 2).
7. Silence-today durability across reschedule (masks notif finding 1).
8. FullAdhanPlayer actionIdentifier paths (masks notif finding 3).
9. zakat parseAmount digit-system/grouping cases; round2 half-cent;
   per-metal missing-price.
10. High-latitude widget snapshot + midnight-isha scheduler fixtures.
