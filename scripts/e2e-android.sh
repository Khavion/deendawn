#!/usr/bin/env bash
# scripts/e2e-android.sh — Android Maestro driver. Unlike the iOS capture
# helpers, this IS a gate: it exits nonzero on any suite failure.
#
# usage: e2e-android.sh [-a AVD] [-b debug|release|none] [suite ...]
#   -a  AVD name (default deendawn_pixel)
#   -b  build+install first: debug | release | none (default none = use installed app)
#   suites: smoke onboarding ask locales audio offline   (default: smoke onboarding ask locales)
#
# Suite/build matrix:
#   smoke/onboarding/ask/locales — debug or release
#   audio   — DEBUG ONLY (dev badge + localhost source); starts the dev audio
#             server and reverses :8083
#   offline — RELEASE ONLY; wipes app state, removes all reverses, enables
#             airplane mode for the run (the offline constitutional proof)
#
# Localized labels (locales suite): read from src/lib/i18n/locales/*.json at
# runtime and passed as Maestro env — Arabic-script literals must never be
# committed outside the locale files (NO-AI ZONE guard hook).
# iOS equivalent incantation for the locales suite:
#   maestro test e2e/locales.yaml \
#     -e TAB_MORE_UR="$(node -p "require('./src/lib/i18n/locales/ur.json').tabs.more")" \
#     -e TAB_MORE_AR="$(node -p "require('./src/lib/i18n/locales/ar.json').tabs.more")"
set -uo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"
# shellcheck source=scripts/android/env.sh
source scripts/android/env.sh

AVD=deendawn_pixel
BUILD=none
while getopts "a:b:" opt; do
  case "$opt" in
    a) AVD="$OPTARG" ;;
    b) BUILD="$OPTARG" ;;
    *) echo "usage: $0 [-a avd] [-b debug|release|none] [suite...]" >&2; exit 2 ;;
  esac
done
shift $((OPTIND - 1))
# Default order: onboarding FIRST — its clearState resets both the container
# and the language, so later suites start from onboarded EN state (a prior
# aborted locales run can leave the app in UR/AR otherwise).
SUITES=("$@")
[ ${#SUITES[@]} -eq 0 ] && SUITES=(onboarding smoke ask locales)

# --- device ---
if ! adb get-state >/dev/null 2>&1; then
  echo "[e2e-android] booting $AVD..."
  (emulator -avd "$AVD" -no-snapshot-load >/dev/null 2>&1 &)
  adb wait-for-device
fi
adb shell 'while [ "$(getprop sys.boot_completed)" != 1 ]; do sleep 2; done'

# --- animations off (restored on exit) ---
# transition_animation_scale is DELIBERATELY left at its current value:
# at 0 it kills every NativeTabs tab switch on Android (verified on emulator
# 2026-07-30 — the fragment transition never completes, all tabs dead).
# Product-level investigation tracked in DECISIONS; window+animator at 0 keep
# most of the anti-flake value.
PREV_WIN=$(adb shell settings get global window_animation_scale | tr -d '\r')
PREV_ANM=$(adb shell settings get global animator_duration_scale | tr -d '\r')
adb shell settings put global window_animation_scale 0
adb shell settings put global animator_duration_scale 0

AUDIO_PID=""
AIRPLANE=0
cleanup() {
  adb shell settings put global window_animation_scale "${PREV_WIN:-1}" 2>/dev/null
  adb shell settings put global animator_duration_scale "${PREV_ANM:-1}" 2>/dev/null
  [ -n "$AUDIO_PID" ] && kill "$AUDIO_PID" 2>/dev/null
  [ "$AIRPLANE" = 1 ] && adb shell cmd connectivity airplane-mode disable 2>/dev/null
}
trap cleanup EXIT

# --- build/install ---
case "$BUILD" in
  debug)
    (cd android && ./gradlew :app:assembleDebug) || exit 1
    adb install -r android/app/build/outputs/apk/debug/app-debug.apk || exit 1
    ;;
  release)
    (cd android && ./gradlew :app:assembleRelease) || exit 1
    adb install -r android/app/build/outputs/apk/release/app-release.apk || exit 1
    ;;
  none) ;;
  *) echo "unknown -b '$BUILD'" >&2; exit 2 ;;
esac

# --- localized labels (single source of truth: the locale JSON files) ---
# Maestro 2.6.1: a flow-file `env:` block OVERRIDES `-e` (verified 2026-07-30),
# so the flows carry NO env defaults — every runner-controlled value is
# injected here. iOS equivalent: scripts/e2e-ios.sh.
EN_TODAY=$(node -p "require('./src/lib/i18n/locales/en.json').tabs.today")
EN_QURAN=$(node -p "require('./src/lib/i18n/locales/en.json').tabs.quran")
EN_TASBIH=$(node -p "require('./src/lib/i18n/locales/en.json').tabs.tasbih")
EN_QIBLA=$(node -p "require('./src/lib/i18n/locales/en.json').tabs.qibla")
EN_MORE=$(node -p "require('./src/lib/i18n/locales/en.json').tabs.more")
UR_MORE=$(node -p "require('./src/lib/i18n/locales/ur.json').tabs.more")
AR_MORE=$(node -p "require('./src/lib/i18n/locales/ar.json').tabs.more")

SCREENS_DIR=docs/screens/android/e2e
REPORT_DIR=docs/reports/android-e2e
mkdir -p "$SCREENS_DIR" "$REPORT_DIR"
STAMP=$(date +%Y%m%d-%H%M)

FAILED=0
for SUITE in "${SUITES[@]}"; do
  EXTRA=()
  case "$SUITE" in
    audio)
      adb reverse tcp:8081 tcp:8081
      adb reverse tcp:8083 tcp:8083
      node scripts/dev-audio-server.mjs >/dev/null 2>&1 &
      AUDIO_PID=$!
      sleep 1
      ;;
    offline)
      adb shell pm clear "$APP_ID" >/dev/null
      adb reverse --remove-all
      adb shell cmd connectivity airplane-mode enable
      AIRPLANE=1
      ;;
    locales)
      adb reverse tcp:8081 tcp:8081 2>/dev/null
      EXTRA+=(-e "TAB_MORE_UR=$UR_MORE" -e "TAB_MORE_AR=$AR_MORE")
      ;;
    *)
      adb reverse tcp:8081 tcp:8081 2>/dev/null
      ;;
  esac

  echo "[e2e-android] suite: $SUITE"
  SERIAL=$(adb get-serialno)
  if ! maestro --device "$SERIAL" test \
      -e "SCREENS_DIR=$SCREENS_DIR" \
      -e "TAB_TODAY=$EN_TODAY" -e "TAB_QURAN=$EN_QURAN" -e "TAB_TASBIH=$EN_TASBIH" \
      -e "TAB_QIBLA=$EN_QIBLA" -e "TAB_MORE=$EN_MORE" \
      "${EXTRA[@]+"${EXTRA[@]}"}" \
      --format junit --output "$REPORT_DIR/$STAMP-$SUITE.xml" \
      "e2e/$SUITE.yaml"; then
    echo "[e2e-android] FAILED: $SUITE"
    FAILED=1
  fi

  case "$SUITE" in
    audio)
      [ -n "$AUDIO_PID" ] && kill "$AUDIO_PID" 2>/dev/null; AUDIO_PID=""
      ;;
    offline)
      adb shell cmd connectivity airplane-mode disable; AIRPLANE=0
      ;;
  esac
done

exit $FAILED
