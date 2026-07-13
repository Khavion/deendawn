# App Privacy answers (draft — entered in App Store Connect UI, not via fastlane)

Target label: **Data Not Collected.**

App Store Connect → App Privacy → "Get started":

1. "Do you or your third-party partners collect data from this app?" → **No, we do not collect data from this app.**

That single answer produces the "Data Not Collected" label. It holds because:

- No accounts, no analytics SDKs, no ad SDKs, no crash reporters (constitution rule 2).
- Location is processed on-device only and never transmitted.
- Recitation-audio streaming requests to our R2 bucket carry no identifiers beyond a bare HTTPS request; nothing is logged or linked to identity (verify bucket logging stays off before shipping audio).
- RevenueCat (tip jar): purchases are processed by Apple; when the key ships, re-verify the answer against RevenueCat's then-current data-collection docs — if their SDK's purchase handling counts as "Purchases" data collection, the label must change to Purchases → Not linked to identity → No tracking, and this file plus the review notes must be updated. Until the key exists the SDK is never configured, so "Data Not Collected" is accurate for TestFlight.

Also in ASC:

- Content rights: app streams only recitation audio we have documented rights to (gate 5).
- Age rating questionnaire: no objectionable content → 4+.
- Encryption: `ITSAppUsesNonExemptEncryption` already false in Info.plist (standard HTTPS only).
