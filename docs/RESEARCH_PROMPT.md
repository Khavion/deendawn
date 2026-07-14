# Copy-paste prompt for Claude chat's Research feature — Round 2

Paste everything below the line into Claude's **Research** feature, then paste
the contents of `docs/AUDIT.md` where indicated (and attach a few screenshots
from `docs/audit-screens/` if you like). This round is framed so the assistant
builds on the first research pass instead of repeating it.

---

I'm building **DeenDawn**, a privacy-first, free, no-ads Islamic app (Expo /
React Native) that now runs on **both iOS and Android**. It is feature-complete
and I'm heading toward a beta/launch. You (or a previous research pass) already
helped me once — this is **round 2**, so please do NOT re-litigate what's
already resolved; focus on the still-open frontier below.

**Absolute rules the app must never break** (flag anything that would):
privacy (no accounts, no analytics, no ad SDKs, works fully offline, "Data Not
Collected"), no ads ever, and an AI may never author or alter Quranic/religious
text (retrieval + citation only, rulings redirected to scholars).

**Already resolved in round 1 — do NOT repeat these:** collapsing the database
stack to speed up builds (done); tajweed color data licensing + alignment
(done — I regenerated it against my own text); Ed25519 signing for model
downloads (done); the on-device model choice = Qwen3 + GBNF-constrained output
(confirmed); the App Store 4.3(b) differentiation notes (done); the fact that
mainstream reciter audio and word-by-word English translation lack free
licenses (understood — reciter-permission email is drafted). A full status
table is in the audit I'm pasting below.

**Please research and return specific, sourced, actionable recommendations**
(name libraries, APIs, data sources, licenses with URLs, rights-holders,
concrete trade-offs, prioritized by impact vs effort) on these **round-2**
topics:

1. **Android on-time adhan reliability (top priority).** How do the most
   reliable prayer-time apps deliver notifications/adhan on time on Android
   despite Doze, battery optimization, and aggressive OEM process-killing
   (Samsung, Xiaomi, etc.)? I need a concrete strategy: `SCHEDULE_EXACT_ALARM` /
   `USE_EXACT_ALARM` (API 31+) vs `setAlarmClock`, notification channels for
   per-prayer sounds, foreground-service vs AlarmManager for playing a full
   adhan, requesting battery-optimization exemption with minimal UX friction,
   and any Play Store policy implications.

2. **A shippable English Quran translation (this gates launch).** Beyond the
   known licensing dead-ends, which specific translations are actually good AND
   obtainable — strong public-domain options better than Pickthall 1930, or
   modern translations licensable at reasonable terms for a free app that has a
   tip jar? Name candidates, rights-holders, and how one actually licenses them.
   Briefly, the same for a shippable Urdu translation.

3. **Adhkar / du'a — the obvious next feature.** A cleanly-licensed source for
   morning/evening adhkar and common du'as with authenticated grading (e.g.,
   what is the actual licensing of Hisn al-Muslim / "Fortress of the Muslim,"
   and are there permissively-licensed or public-domain alternatives?), plus the
   safest scholar-review workflow to add it.

4. **Running a beta + launching with ZERO telemetry.** How to run a genuinely
   useful closed beta (TestFlight + Google Play internal testing) and gather
   actionable feedback with no analytics — opt-in in-app feedback patterns,
   community channels, review mining. And distribution for a free no-ads Islamic
   app: how comparable projects reached users (masjid/community partnerships,
   the niche's dynamics) without paid acquisition.

5. **Legal / entity for launch.** Appropriate privacy-policy + minimal ToS
   content for a "Data Not Collected" app; the entity question for receiving
   Apple/Google tip payments (sole proprietor vs LLC — tax/liability); and the
   GDPR / CCPA / COPPA posture for a 4+ app that collects nothing.

6. **On-device AI, measured.** Realistic Qwen3-1.7B Q4 latency for a ≤2k-token
   paraphrase on an A14-class iPhone via llama.rn (tokens/sec), whether the
   arm64 Android emulator is a valid early proxy to measure it, and the fallback
   UX if it's too slow.

7. **Reproducible derived-content + Android release size.** How to make my
   tajweed-annotation regeneration (currently a manual Python run) reproducible
   and auditable in CI without heavy deps; and the expected Android release AAB
   size with ABI splits given the native AI library, plus whether to gate the AI
   model download by device ABI.

8. **Accessibility.** A VoiceOver/TalkBack screen-reader pass for a bilingual,
   right-to-left religious app — how Arabic is announced, the reading order for
   verse + translation + citation, and whether tajweed colors need a non-color
   affordance.

Finally: **what am I missing?** Given the audit below, what would a polished,
shipped v1 of a privacy-first Islamic app include that I haven't mentioned?

--- (paste the contents of docs/AUDIT.md here) ---
