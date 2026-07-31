#!/usr/bin/env bash
# Android evidence sweep — per-cell route capture (adb sibling of the iOS
# simctl sweep.sh; capture helper, not a gate). Routes deep-link via the
# deendawn:// scheme; "today" is a cold start.
# usage: sweep.sh <outdir> [route ...]     (default: the full route set)
set -uo pipefail
cd "$(dirname "$0")/../../.."
source scripts/android/env.sh

OUT="${1:?usage: sweep.sh <outdir> [route ...]}"; shift || true
mkdir -p "$OUT"
ROUTES=("$@")
[ ${#ROUTES[@]} -eq 0 ] && ROUTES=(
  today quran "surah/1" "surah/2?ayah=255" "quran/ask" qibla more
  tasbih zakat calendar about bookmarks library "adhan-help"
)

for route in "${ROUTES[@]}"; do
  name=$(echo "$route" | tr '/?=' '---')
  if [ "$route" = "today" ]; then
    adb shell am force-stop "$APP_ID"
    adb shell am start -W -n "$APP_ID/.MainActivity" >/dev/null
    sleep 6
  else
    adb shell am start -W -a android.intent.action.VIEW -d "deendawn://$route" "$APP_ID" >/dev/null
    sleep 3
  fi
  adb exec-out screencap -p > "$OUT/$name.png"
  echo "captured $OUT/$name.png"
done
