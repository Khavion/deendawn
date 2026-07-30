#!/usr/bin/env bash
# Emulator perf TRENDS (never budget sign-off — emulator numbers are only
# comparable to themselves on the same host; real-device numbers live on the
# TESTPLAN device pass). Captures:
#   - cold start: am start -S -W x3, median TotalTime (to first frame; the
#     app doesn't call reportFullyDrawn, so JS-ready is later)
#   - scroll jank: gfxinfo framestats during a fixed-cadence surah scroll
# Animations are restored to 1 for the run (0 would fake the numbers).
# usage: perf-baseline.sh [build-label]
set -uo pipefail
cd "$(dirname "$0")/../.."
source scripts/android/env.sh

LABEL="${1:-local}"
OUT="docs/reports/android-perf"
mkdir -p "$OUT"
STAMP=$(date +%Y%m%d-%H%M)

for s in window_animation_scale transition_animation_scale animator_duration_scale; do
  adb shell settings put global "$s" 1
done

echo "== cold start x3 =="
TIMES=()
for i in 1 2 3; do
  adb shell am force-stop "$APP_ID"; sleep 2
  T=$(adb shell am start -S -W -n "$APP_ID/.MainActivity" | grep TotalTime | grep -oE '[0-9]+')
  TIMES+=("$T"); echo "run $i: ${T}ms"
  sleep 3
done
MEDIAN=$(printf '%s\n' "${TIMES[@]}" | sort -n | sed -n '2p')

echo "== scroll jank (surah 2) =="
adb shell am start -W -a android.intent.action.VIEW -d "deendawn://surah/2" "$APP_ID" >/dev/null
sleep 4
adb shell dumpsys gfxinfo "$APP_ID" reset >/dev/null
for i in $(seq 1 10); do adb shell input swipe 540 1600 540 400 300; sleep 0.4; done
adb shell dumpsys gfxinfo "$APP_ID" > "$OUT/$STAMP-gfxinfo.txt"
JANKY=$(grep -m1 "Janky frames" "$OUT/$STAMP-gfxinfo.txt" | sed 's/^ *//')
P90=$(grep -m1 "90th percentile" "$OUT/$STAMP-gfxinfo.txt" | sed 's/^ *//')
P95=$(grep -m1 "95th percentile" "$OUT/$STAMP-gfxinfo.txt" | sed 's/^ *//')

[ -f "$OUT/BASELINE.md" ] || cat > "$OUT/BASELINE.md" << 'HEADER'
# Android perf baseline (emulator trends — NOT budget numbers)

| date | build | cold start p50 | janky | p90 | p95 |
| ---- | ----- | -------------- | ----- | --- | --- |
HEADER
echo "| $STAMP | $LABEL | ${MEDIAN}ms | $JANKY | $P90 | $P95 |" >> "$OUT/BASELINE.md"
tail -3 "$OUT/BASELINE.md"
