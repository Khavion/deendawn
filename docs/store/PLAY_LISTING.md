# Google Play — listing + Data Safety (prepared)

Everything needed to fill out the Play Console listing. Store text lives in
`fastlane/metadata/android/en-US/` (title, short_description, full_description).

## Listing text (ready)
- **App name (≤30):** `Deen Dawn: Prayer & Quran` (25)
- **Short description (≤80):** `Prayer times, adhan, Quran, qibla — free forever, no ads, no tracking.` (72)
- **Full description (≤4000):** see `fastlane/metadata/android/en-US/full_description.txt` (~1.9k)
- **Category:** Lifestyle (or Books & Reference). **Tags:** prayer, quran, islam.
- **Contact email:** apps@khavion.com
- **Privacy policy URL (REQUIRED):** `https://khavion.com/apps/deendawn/privacy.html`
- **Support/website URL:** `https://khavion.com/apps/deendawn/support.html`
  (both hosted from the khavion.com Next.js site — see `docs/legal/README.md`)

## Graphic assets (Play requirements)
| Asset | Requirement | Status |
| --- | --- | --- |
| App icon | 512×512 32-bit PNG | Have 1024×1024 (`assets/images/icon.png`) — export/downscale a 512 for Play |
| Feature graphic | 1024×500 PNG/JPEG (no alpha) | **TODO** — a simple branded banner (green ground, "Deen Dawn", tagline) |
| Phone screenshots | 2–8, 16:9 or 9:16, 320–3840px/side | Capture from the release build (badge-free) at 1080×2400 |

## Data Safety form answers (mandatory — the app collects NO data)
Google requires this form for every app, even when nothing is collected. "Collection"
in Play's definition = **transmitting data off the device**. Deen Dawn transmits none.

- **Does your app collect or share any of the required user data types?** → **No.**
  - No personal info, no location, no financial info, no messages, no photos, no contacts,
    no app activity/analytics, no device identifiers — nothing is transmitted off the device.
  - **Location note:** the app *accesses* location on-device (qibla + prayer times) but **never
    transmits or stores it**, so under Play's definition it is **not collected**. Manual city
    entry is a full alternative.
  - **Payments note:** there are none. The app has no in-app purchases, no billing integration,
    and no payment path of any kind, so it is not a "merchant" account for Play's purposes —
    which is also why the developer's full address is not published on the listing.
- **Is all user data encrypted in transit?** → N/A (no data collected). The only network call
  (recitation audio you choose to play) is HTTPS.
- **Do you provide a way to request data deletion?** → N/A (no data collected; all app data lives
  on the device and is removed when the app is uninstalled).
- **Result:** the Data Safety card shows **"No data collected · No data shared."** This must match
  the privacy policy (it does — see docs/legal/privacy.html).

## Content rating (IARC questionnaire)
- No violence, no sexual content, no profanity, no gambling, no user-generated content, no ads.
- References religious content (the Quran) — answer the religion/ideology question truthfully;
  expected rating: **Everyone / PEGI 3**.

## Target API level
- Play requires new apps target **Android 15 (API 35)+** now; **API 36 by 31 Aug 2026**.
- Expo SDK 54 / RN 0.81 targets a recent API — verify the built `targetSdkVersion` is ≥ 35 before
  submitting (check `android/app/build.gradle` / EAS build output).

## Permissions (already trimmed for privacy)
The store build requests only: INTERNET (audio), ACCESS_FINE/COARSE_LOCATION (qibla/prayer times),
MODIFY_AUDIO_SETTINGS, VIBRATE. We explicitly BLOCK the microphone (RECORD_AUDIO), draw-over-apps
(SYSTEM_ALERT_WINDOW), and external storage — see `app.json` → `android.blockedPermissions`. This
keeps the Data Safety story clean and avoids review scrutiny.

## Foreground-service declaration (Play Console → App content, required for target API 34+)

Type declared in the manifest: **mediaPlayback** (from expo-audio's
AudioControlsService — Quran recitation streaming with lock-screen controls).

- **What it does:** continues Quran audio playback the user started when the
  app is backgrounded or the screen locks, with lock-screen/notification
  media controls.
- **User impact if deferred/interrupted:** recitation stops mid-surah the
  moment the screen locks — the core listening experience breaks.
- **Use case selection:** "Continue audio or video playback from the
  background, including streaming."
- **Demo video:** screen recording showing: open a surah → play → press
  home → audio continues → lock screen → media card with controls. (Record
  from the release build during store prep; attach the unlisted link.)

## Feature graphic

`docs/store/feature-graphic-1024x500.png` — brand gradient + dawn mark,
center-safe (Play crops promo surfaces to 16:9). Final pass adds the
"Deen Dawn" wordmark + one-line tagline before submission.

## Exact alarms (reviewer note, no declaration form needed)

The app declares SCHEDULE_EXACT_ALARM (user-granted "Alarms & reminders"
special access) for on-time adhan reminders. USE_EXACT_ALARM is NOT declared.
No sensitive-permission declaration applies.

## Upcoming (Oct 28, 2026): location-permissions declaration

Google's updated Location Permissions policy adds a Console declaration +
review for any app requesting location. Deen Dawn's case: when-in-use
foreground location, processed entirely on-device for prayer times + qibla
(core functionality), never transmitted; manual city entry is a full
alternative. File the declaration when the Console form appears.

## Screenshot source (prepared 2026-07-30)

The Android evidence set (docs/screens/android/final/, release build) is the
screenshot source. NOTE the Play constraint: max dimension ≤ 2× min — the raw
1080×2400 frames must be cropped to 1080×2160 (or reframed 1080×1920) for
upload. Suggested store set: a-light/today (hero), a-light/quran,
a-light/qibla, b-dark/today, f-ar/today (RTL proof), + a home-screen shot
with the widget. Final curation (badge-free, cropped, possibly device-framed)
happens at the store pass alongside the demo video.

## Demo video note

The mediaPlayback FGS demo video should show REAL recitation — recording it
waits for the gate-5 recordings (the release build hides the audio player
without a configured source; a dev-build video with the placeholder tone is
the fallback if the declaration is needed sooner).
