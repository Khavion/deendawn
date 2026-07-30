#!/usr/bin/env bash
# Seed the RELEASE build past onboarding on a ROOTABLE google_apis AVD:
# installs the APK, boots the app once (creates the DB), then root-writes the
# three KV rows the iOS prime.sh seeds (onboarded flag, Houston settings,
# language). No-root AVDs (Play image) must onboard via Maestro instead.
# usage: prime.sh <apk> [language]     (language: en|ur|ar, default en)
set -euo pipefail
cd "$(dirname "$0")/../../.."
source scripts/android/env.sh

APK="${1:?usage: prime.sh <apk> [language]}"
LANG_CODE="${2:-en}"
DB=/data/data/$APP_ID/files/SQLite/user.db

adb root >/dev/null; adb wait-for-device
adb install -r "$APK" >/dev/null
adb shell am start -n "$APP_ID/.MainActivity" >/dev/null
sleep 10
adb shell am force-stop "$APP_ID"

SETTINGS='{"location":{"type":"manual","cityId":"houston-us"},"method":"auto","madhab":"shafi","highLatRule":"auto"}'
adb shell "sqlite3 $DB \"
CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);
INSERT OR REPLACE INTO kv (key, value) VALUES ('onboarded.v1','true');
INSERT OR REPLACE INTO kv (key, value) VALUES ('settings.v1','$SETTINGS');
INSERT OR REPLACE INTO kv (key, value) VALUES ('language.v1','$LANG_CODE');
\""
echo "primed: $LANG_CODE / Houston (db=$DB)"
