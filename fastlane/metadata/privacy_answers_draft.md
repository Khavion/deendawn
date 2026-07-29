# App Privacy answers (draft — entered in App Store Connect UI, not via fastlane)

Target label: **Data Not Collected.**

App Store Connect → App Privacy → "Get started":

1. "Do you or your third-party partners collect data from this app?" → **No, we do not collect data from this app.**

That single answer produces the "Data Not Collected" label. It holds because:

- No accounts, no analytics SDKs, no ad SDKs, no crash reporters (constitution rule 2).
- Location is processed on-device only and never transmitted.
- Recitation-audio streaming requests to our R2 bucket carry no identifiers beyond a bare HTTPS request; nothing is logged or linked to identity (verify bucket logging stays off before shipping audio).
- No purchases at all: the tip jar and the RevenueCat SDK were removed on 2026-07-29 (owner decision — see DECISIONS.md). With no IAP there is no "Purchases" data category to declare and no payment-processor SDK in the binary, so this answer is now unconditional rather than pending a key.

Also in ASC:

- Content rights: app streams only recitation audio we have documented rights to (gate 5).
- Age rating questionnaire: no objectionable content → 4+.
- Encryption: `ITSAppUsesNonExemptEncryption` already false in Info.plist (standard HTTPS only).
