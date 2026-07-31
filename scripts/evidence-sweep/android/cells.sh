#!/usr/bin/env bash
# The Android release-evidence matrix (mirrors the iOS 20-cell philosophy).
# Capture helper, not a gate. Prereqs: a booted rootable AVD, the release APK
# built (scripts/android/build-release.sh), Metro NOT needed (release).
# Language cells use the REAL in-app switch via Maestro (exercises the
# I18nManager restart path); root kv seeding is only the initial state.
# usage: cells.sh <apk> [cell ...]      cells default to the full set
set -uo pipefail
cd "$(dirname "$0")/../../.."
source scripts/android/env.sh

APK="${1:?usage: cells.sh <apk> [cell...]}"; shift || true
BASE=docs/screens/android/final
SWEEP=scripts/evidence-sweep/android/sweep.sh
KEY_ROUTES=(today quran "surah/2?ayah=255" more qibla zakat)

CELLS=("$@")
[ ${#CELLS[@]} -eq 0 ] && CELLS=(a-light b-dark e-fs20 e2-fs13 k-fs085 f-ar g-ur h-compound)

set_scale() { adb shell settings put system font_scale "$1"; }
set_night() { adb shell cmd uimode night "$1"; }
switch_language() { # in-app switch via Maestro (labels from locale JSON)
  local code="$1"
  local cur more_label flow
  cur=$(adb shell "sqlite3 /data/data/$APP_ID/files/SQLite/user.db \"SELECT value FROM kv WHERE key='language.v1'\"" | tr -d '\r')
  [ -z "$cur" ] && cur=en
  more_label=$(node -p "require('./src/lib/i18n/locales/${cur}.json').tabs.more")
  flow=$(mktemp /tmp/deendawn-lang-XXXX.yaml)
  cat > "$flow" << 'FLOW'
appId: com.khavion.deendawn
---
- launchApp:
    stopApp: true
- extendedWaitUntil:
    visible:
      id: 'prayer-row-fajr'
    timeout: 30000
- tapOn: ${TAB_MORE_CUR}
- extendedWaitUntil:
    visible:
      id: 'setting-language'
    timeout: 10000
- tapOn:
    id: 'setting-language'
- tapOn:
    id: ${OPTION}
- runFlow:
    when:
      visible:
        text: '.*Restart now.*'
    commands:
      - tapOn:
          text: '.*Restart now.*'
FLOW
  maestro --device "$(adb get-serialno)" test \
    -e "TAB_MORE_CUR=$more_label" -e "OPTION=option-$code" "$flow"
  rm -f "$flow"
  sleep 10
}
scripts/evidence-sweep/android/prime.sh "$APK" en

for CELL in "${CELLS[@]}"; do
  echo "=== cell: $CELL ==="
  set_scale 1.0; set_night no
  case "$CELL" in
    a-light)   "$SWEEP" "$BASE/$CELL" ;;
    b-dark)    set_night yes; "$SWEEP" "$BASE/$CELL" ;;
    e-fs20)    set_scale 2.0; "$SWEEP" "$BASE/$CELL" ;;
    e2-fs13)   set_scale 1.3; "$SWEEP" "$BASE/$CELL" "${KEY_ROUTES[@]}" ;;
    k-fs085)   set_scale 0.85; "$SWEEP" "$BASE/$CELL" "${KEY_ROUTES[@]}" ;;
    f-ar)      switch_language ar; "$SWEEP" "$BASE/$CELL" today quran "surah/2?ayah=255" more qibla calendar zakat tasbih about "quran/ask"
               switch_language en ;;
    g-ur)      switch_language ur; "$SWEEP" "$BASE/$CELL" "${KEY_ROUTES[@]}"
               switch_language en ;;
    h-compound) switch_language ar; set_night yes; set_scale 2.0
               "$SWEEP" "$BASE/$CELL" "${KEY_ROUTES[@]}"
               set_night no; set_scale 1.0; switch_language en ;;
    *) echo "unknown cell $CELL" ;;
  esac
done
set_scale 1.0; set_night no
echo "SWEEP CELLS DONE -> $BASE"
