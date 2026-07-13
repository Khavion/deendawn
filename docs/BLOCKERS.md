# BLOCKERS — items waiting on Zohaib

Format: date, context, recommendation, status.

## 2026-07-12 — `.env` missing at repo root

Context: CLAUDE.md assumes `.env` with ASC_KEY_ID, ASC_ISSUER_ID, ASC_KEY_PATH, R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, REVENUECAT_IOS_KEY. Not present.
Impact: blocks (later) EAS submit prep, R2 dev-audio verification, RevenueCat wiring. Does NOT block content pipeline, prayer engine, UI, or tests.
Recommendation: create `.env` from the template in `.env.example` when convenient.
Status: OPEN

## 2026-07-12 — Dev audio set not yet on R2

Context: Audio epic needs 2–3 surahs from one reciter uploaded to the R2 bucket by Zohaib (CLAUDE.md audio policy).
Recommendation: upload dev set (e.g. 1, 112–114) as `audio/<reciter>/<surah>.mp3`; I'll build the player against mocked URLs until then.
Status: OPEN

## 2026-07-12 — One-time human spot-check of prayer-time fixtures

Context: `src/features/prayer-times/fixtures/prayer-fixtures.json` (1,680 entries) was generated once from the adhan 4.4.4 reference implementation per the testing policy. The policy requires a one-time human spot-check against published timetables before external TestFlight.
Recommendation: pick 2–3 rows and compare with published timetables, e.g. Houston 2026-07 vs a local masjid's ISNA table, Karachi vs a University of Islamic Sciences table, London vs a MWL-based table. The `local` field in each fixture is already in the city's local time (24h HH:mm).
Status: OPEN (not release-blocking until external TestFlight)
