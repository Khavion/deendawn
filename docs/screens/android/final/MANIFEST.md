# Android release-evidence MANIFEST

FULLY RE-SWEPT 2026-07-30 (evening) on the RELEASE build at HEAD after the polish
backlog cleared — all 76 captures below are fresh: shortened placeholders, Arabic
surah-name paint fix, ar Arabic-Indic digit unification, Arabic-primary surah rows
in ar/ur, qibla cardinal marks + no-compass state, More-tab 'pending' icon. Both
hard gates passed on this build; smoke/onboarding/ask/locales/offline Maestro
suites green on it. Language cells use the REAL in-app switch (I18nManager restart
path). (First sweep same day was reviewed by an 8-agent pass; its Qibla-inset
blocker + gradient seams were fixed then, the polish items now.)

| cell | config | captures |
| ---- | ------ | -------- |
| a-light | deendawn_pixel · EN · light · 1.0 | 14 |
| b-dark | deendawn_pixel · EN · dark · 1.0 | 14 |
| e-fs20 | deendawn_pixel · EN · light · font 2.0 | 14 |
| e2-fs13 | deendawn_pixel · EN · light · font 1.3 (key routes) | 6 |
| k-fs085 | deendawn_pixel · EN · light · font 0.85 (key routes) | 6 |
| f-ar | deendawn_pixel · AR (RTL, in-app switch) · light | 10 |
| g-ur | deendawn_pixel · UR (Nastaliq, RTL) · light (key routes) | 6 |
| h-compound | deendawn_pixel · AR · dark · font 2.0 (stress cell) | 6 |

Total: 76 captures.

Adjacent evidence: docs/screens/android/e2e/ (Maestro suite frames incl. the UR/AR
round trip), docs/reports/android-perf/BASELINE.md (trend numbers).
