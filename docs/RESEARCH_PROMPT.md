# Copy-paste prompt for Claude chat's Research feature

Paste everything below the line into Claude's **Research** feature, then attach
the screenshots from `docs/audit-screens/` (or the key ones). It frames the
audit so the research comes back as concrete, sourced, actionable technical
recommendations.

---

I'm building **DeenDawn**, a privacy-first, free, no-ads Islamic iPhone app
(Expo / React Native). It's feature-complete and I want a technical research
pass to find the highest-impact improvements before I ship to testers. Below is
a full audit of the current state. Please research and come back with
**specific, sourced, actionable recommendations** — name libraries, models,
data sources, licenses (with URLs), and concrete trade-offs. Prioritize by
impact-vs-effort and flag anything that would compromise the app's absolute
rules: **privacy (no tracking, no accounts, works offline), no ads, and never
letting an AI author or alter Quranic/religious text.**

Focus your research on these areas (details in the audit):

1. **Quran reading** — licensed tajweed color-coding and word-by-word data;
   mushaf-accurate page layout feasibility; better OFL Uthmani fonts.
2. **On-device AI** — best small instruct models for citation-grounded
   paraphrase on an iPhone A14+ (quantization/latency/RAM trade-offs); the
   right Arabic-aware embedding model and hybrid retrieval; reliable on-device
   refusal behavior.
3. **Recitation audio** — full-Quran recitation sets I can legally ship in a
   free app that also has a tip jar (reciter, host, exact license/permission
   URL, attribution); same for <30s adhan clips; verse-timing data for
   word-highlighted playback and its licensing.
4. **Platform features** — a prayer-countdown Home Screen widget, Live
   Activity / Dynamic Island, and Apple Watch complication in Expo/RN without
   ejecting; a safe OTA update strategy.
5. **Product & growth without tracking** — how privacy-first apps learn what to
   improve with zero telemetry; App Store guideline 4.3(b) differentiation and
   ASO for a no-ads Islamic app; monetization headroom within Apple 3.2.1 for a
   non-charity entity.
6. **Engineering hardening** — supply-chain hardening for model/audio downloads
   beyond SHA-256; cleaner alternatives to my dual-SQLite + build-React-Native-
   from-source + fmt patches, and what breaks at Expo SDK 55/56; on-device
   performance-regression testing in CI.

Please also point out anything important I haven't thought to ask about.

--- (paste the contents of docs/AUDIT.md here) ---
