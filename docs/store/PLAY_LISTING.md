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
  - **Payments note:** the optional tip is processed entirely by Google Play Billing; the app
    never receives or stores payment data.
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
