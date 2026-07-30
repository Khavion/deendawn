# Android release-evidence MANIFEST

Captured 2026-07-30 on the RELEASE build (scripts/android/build-release.sh; both hard
gates passed) via scripts/evidence-sweep/android/cells.sh. Language cells use the REAL
in-app switch (I18nManager restart path). Reviewed by an 8-agent parallel pass; the one
blocker found (Qibla status-bar inset) plus gradient seams were fixed and re-captured;
polish backlog in docs/TODO.md.

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
