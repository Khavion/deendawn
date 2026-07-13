# DeenDawn — Comprehensive Status Report (2026-07-12)

Prepared as context for external research. Snapshot of the app as of commit c56e734.

## 1. What DeenDawn is

DeenDawn is a privacy-first Islamic companion app for iOS (Android to follow from the same codebase). Core promise: **free forever, no ads, no accounts, no tracking, works offline.** The only revenue is an optional "support the developer" tip jar. Target App Store privacy label: "Data Not Collected." The app is built by an autonomous AI engineer under a strict human-approved constitution; all religious text is imported byte-for-byte from verified scholarly sources and is cryptographically checksummed — the AI never writes, edits, or paraphrases scripture, and the build fails if a single byte of religious text changes.

## 2. Non-negotiable constraints (any research/ideas must fit these)

- **Religious content integrity:** Quran text, translations, du'as, hadith, and religious rulings enter the app only through a verified content pipeline with SHA-256 pinning. No AI-generated religious content, citations, or attributions, ever. Any UI sentence stating a religious position requires scholar review before shipping.
- **Privacy:** No accounts, no analytics/tracking SDKs, no servers. Location is used on-device only; manual city entry is always available. The ONLY permitted network traffic is streaming recitation audio from the project's own storage bucket. Any new outbound network domain requires explicit owner sign-off.
- **Offline-first:** prayer times, Quran text, qibla, tasbih, hijri dates, zakat calculator must all work in airplane mode.
- **Monetization:** tip jar only (one-time in-app purchases ~$4.99/$9.99/$19.99 via Apple). Never framed as charity/zakat/sadaqah collection (Apple guideline 3.2.1 prohibits in-app charity fundraising). No paywalls on any worship feature. Zakat _calculator_ is in scope; zakat _payment_ is permanently out of scope.
- **Adhkar (remembrance collections) are excluded from v1** until a scholar-review process clears the dataset.
- **Performance budgets:** cold start < 2s on iPhone 12-class, app under 100 MB (audio streamed, never bundled), 60fps scrolling, notification scheduling under 500ms.

## 3. Technology (for implementation-feasibility judgments)

Expo SDK 54 / React Native 0.81 / TypeScript strict / expo-router. Data: SQLite on device (a read-only bundled Quran database + a user-data store). Prayer engine: the open-source `adhan` library (MIT). Notifications: expo-notifications (iOS local notifications; 64-pending-notification OS cap). Audio (planned): expo-audio streaming from Cloudflare R2. IAP (planned): RevenueCat. No error-reporting/analytics services (privacy). All fonts and religious texts are pinned artifacts with recorded hashes.

## 4. What is BUILT and working today (verified on iPhone simulator)

### Prayer times ("Today" tab)

- Calculates all five daily prayers + sunrise for any location on Earth using 12 selectable calculation authorities (ISNA, Muslim World League, Umm al-Qura, Karachi, Egyptian, Moonsighting Committee, Dubai, Kuwait, Qatar, Singapore, Tehran, Turkey/Diyanet). Default follows device region (ISNA for US, MWL otherwise).
- Asr madhab toggle (standard/Hanafi). High-latitude night rules (auto-recommended, middle-of-night, seventh-of-night, twilight-angle) for places like Alaska/Scandinavia where the sun barely sets.
- Location via a bundled offline list of 135 world cities with smart search (no GPS required, no network). GPS option deliberately deferred to onboarding polish.
- Hero card counts down live to the next prayer, correctly rolling to tomorrow's Fajr after Isha. Daylight-saving-time correctness verified.
- Accuracy: engine output is verified to the minute against 1,680 committed reference values spanning 8 cities × 8 dates (solstices, equinox, both US and EU DST transitions, Ramadan window) × all methods × both madhabs.

### Adhan notifications

- Per-prayer on/off switches. A rolling scheduler keeps 7+ days of reminders queued within iOS's 64-notification cap, and self-refreshes when the app opens, when settings change, after each notification fires, and via a twice-daily background task. Currently uses the system notification sound; licensed adhan audio clips are a researched-but-not-yet-sourced item.
- In-app honesty note that the iPhone silent switch and Focus modes can mute reminders.

### Quran reader

- Complete Quran: 114 surahs, 6,236 ayahs in Uthmani script (Tanzil project text, checksummed), rendered in the Amiri Quran typeface at large size with correct right-to-left layout, ligatures, and full diacritics.
- English translation under each verse — currently Pickthall 1930 (public domain), clearly badged as a development placeholder; the shipping translation is an owner decision pending scholar input. Translation can be toggled off ("Arabic only").
- Full-text search in Arabic (diacritic-insensitive) and English, with results deep-linking to the exact verse. Bookmarks, share-verse-with-citation, automatic "continue where you left off."
- Opt-in "night reading" mode: amber-toned palette for pre-dawn use.

### Settings ("More" tab)

- Location, calculation method, Asr madhab, high-latitude rule, per-prayer notification toggles, night-reading toggle. All copy in plain language. Everything persists locally.

### Design system (from the owner's "warm editorial" research brief)

- Manuscript-derived palette: warm ivory canvas, deep lapis blue accent, gold-ochre highlights; warm dark mode (no pure black/white); amber night-reading variant.
- Type system: Literata (serif, reading content), Source Sans 3 (UI), Amiri Quran (Arabic) — all SIL OFL licensed, pinned artifacts.
- Tokens-first architecture; WCAG 2.2 AA contrast is enforced by automated tests on every palette (builds fail if a color combination becomes unreadable). One radius family, one spacing scale, capped font scaling.

### Quality infrastructure

- 116 automated tests: prayer-math fixture matrix, scheduler math, content checksums (Quran byte-integrity), search-normalization parity, UI component tests, color-contrast enforcement.
- Automated UI test (Maestro) taps through the real app on a simulator. Native iOS build verified. Everything in version control with a documented decision log.

## 5. Planned but NOT yet built (current roadmap order)

1. **Qibla compass** — great-circle bearing to the Kaaba + device compass with true-north correction and calibration UX (bearing math library already available).
2. **Tasbih counter** — large tap target, haptic detents at 33/99, daily history. (No Arabic dhikr text until scholar review — numbers and user-entered labels only.)
3. **Hijri calendar** — Umm al-Qura calculation, labeled "calculated — may differ from local moonsighting," user-adjustable ±1 day.
4. **Suhoor/Iftar Ramadan mode** — Fajr/Maghrib surfaced as suhoor-ends/iftar during Ramadan, optional pre-fajr reminder.
5. **Zakat calculator** — assets/liabilities form, nisab from user-entered gold/silver prices (no live price feed in v1 for privacy), 2.5% math, disclaimer + scholar-review flag.
6. **Recitation audio** — per-ayah/per-surah streaming, background playback, lock-screen controls, resume position. Blocked on uploading a licensed 2–3 surah dev set to storage; full reciter catalog is an owner sign-off.
7. **Tip jar** — RevenueCat one-time purchases, restore, thank-you state.
8. **Onboarding + About** — location permission flow with manual-city path, attribution screen (already generated from the content manifest), local privacy policy.
9. **Store prep** — App Store metadata, screenshots, "Data Not Collected" privacy answers; submission itself is owner-gated.
10. **Design backlog** — manuscript-art editorial moments (CC0 sources only: Met/Smithsonian; aniconism-safe geometric/illumination content; scholar sign-off), list-performance pass for long surahs, Dynamic Type and RTL audits.

## 6. Currently blocked on the owner (not blocking development)

- Apple Developer account keys (needed only when the app goes to TestFlight/his phone).
- Licensed recitation audio dev set uploaded to storage.
- Final selections: shipping translation, reciter catalog, any scholar-reviewed copy.
- Five-minute human spot-check of prayer times vs a published timetable before external testers.

## 7. Positioning context

The competitive field (Muslim Pro et al.) is criticized for clutter, ads, accounts, and data-sharing scandals; the identified whitespace is **calm, warm-editorial design + world-class Arabic typography + genuine privacy**, executed with the craft discipline of apps like Things 3. DeenDawn's differentiators so far: verifiable scripture integrity (checksummed text), zero data collection, offline-first, and a designed-not-generated aesthetic.

## 8. Guidance for producing research this project can act on

The most useful research output format (proven by the prior design brief): concrete claims with sources; subjective calls labeled as recommendations with reasoning; licensing verified for any suggested content/assets (CC0/public-domain strongly preferred; NonCommercial licenses are unusable); implementation notes in React Native/Expo terms where relevant; religious-sensitivity items explicitly flagged for scholar review; and a short "decisions the owner must make" list. Any proposed feature must respect §2 (especially: no servers/accounts/analytics, offline-first, no new network domains without sign-off, no AI-generated religious content, tip-jar-only monetization).
