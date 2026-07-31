# TRANSLATION REVIEW — machine-drafted UI strings (Human Gate #8)

Every Urdu (ur) and Arabic (ar) UI string is machine-drafted by the engineering
agent and may NOT ship to users until a human reviewer clears it. English ships
freely. Status values: `@draft` (machine-drafted, unreviewed) → `approved`.

Reviewer: NOT YET NAMED — see docs/BLOCKERS.md.

| Locale | Namespace | Status | Notes                             |
| ------ | --------- | ------ | --------------------------------- |
| ur     | (all)     | @draft | Drafted with E1; pending reviewer |
| ar     | (all)     | @draft | Drafted with E1; pending reviewer |

Interim glossary defaults (flagged in SCHOLAR_REVIEW.md): EN "Prayer", UR "نماز",
AR "الصلاة"; prayer names stay Arabic-derived in all locales (Fajr, Dhuhr, Asr,
Maghrib, Isha).

Added 2026-07-30 (Android phase): `more.notificationsHint_android`,
`more.exactAlarmTitle/Body/Button/Caveat`, `more.fullAdhanHonesty_android` —
ur + ar machine-drafted, covered by the blanket `@draft` rows above.

Added 2026-07-30 (polish pass): `qibla.eastMarker/southMarker/westMarker`
(compass cardinal words), `qibla.noCompass` (no-magnetometer state), and
SHORTENED `quran.searchPlaceholder`, `library.searchPlaceholder`,
`ask.placeholder`, `tasbih.labelPlaceholder` (font-scale-2.0 clipping fix) —
ur + ar machine-drafted, covered by the blanket `@draft` rows above.

Added 2026-07-31 (tab-lineup change): `tabs.tasbih` — ur "تسبیح" / ar
"التسبيح", trimmed from the already-drafted `more.tasbih` compound ("Tasbih
counter"); machine-drafted, covered by the blanket `@draft` rows above.
