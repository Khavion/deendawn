#!/usr/bin/env bash
# scripts/e2e-ios.sh — iOS Maestro driver. The flows carry NO env defaults
# (Maestro 2.6.1 lets a flow-file `env:` block override `-e`, so all
# runner-controlled values are injected here; labels come from the locale
# JSON files — the single source of truth). Android equivalent:
# scripts/e2e-android.sh (which also handles reverses/animations/airplane).
#
# usage: e2e-ios.sh [suite ...]     default: smoke onboarding ask locales
# Prereqs unchanged from the historical bare runs: booted simulator with the
# app installed; audio suite needs scripts/dev-audio-server.mjs on :8083;
# offline suite needs a RELEASE build and no servers.
set -uo pipefail
cd "$(dirname "$0")/.."

SUITES=("$@")
[ ${#SUITES[@]} -eq 0 ] && SUITES=(smoke onboarding ask locales)

EN_TODAY=$(node -p "require('./src/lib/i18n/locales/en.json').tabs.today")
EN_QURAN=$(node -p "require('./src/lib/i18n/locales/en.json').tabs.quran")
EN_ASK=$(node -p "require('./src/lib/i18n/locales/en.json').tabs.ask")
EN_QIBLA=$(node -p "require('./src/lib/i18n/locales/en.json').tabs.qibla")
EN_MORE=$(node -p "require('./src/lib/i18n/locales/en.json').tabs.more")
UR_MORE=$(node -p "require('./src/lib/i18n/locales/ur.json').tabs.more")
AR_MORE=$(node -p "require('./src/lib/i18n/locales/ar.json').tabs.more")

FAILED=0
for SUITE in "${SUITES[@]}"; do
  echo "[e2e-ios] suite: $SUITE"
  if ! maestro test \
      -e "SCREENS_DIR=docs/screens" \
      -e "TAB_TODAY=$EN_TODAY" -e "TAB_QURAN=$EN_QURAN" -e "TAB_ASK=$EN_ASK" \
      -e "TAB_QIBLA=$EN_QIBLA" -e "TAB_MORE=$EN_MORE" \
      -e "TAB_MORE_UR=$UR_MORE" -e "TAB_MORE_AR=$AR_MORE" \
      "e2e/$SUITE.yaml"; then
    echo "[e2e-ios] FAILED: $SUITE"
    FAILED=1
  fi
done
exit $FAILED
