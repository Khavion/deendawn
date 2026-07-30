#!/usr/bin/env bash
# Seed the RELEASE build past onboarding on a ROOTABLE google_apis AVD:
# installs the APK, boots the app once (creates the DB), then root-writes the
# KV rows the iOS prime.sh seeds. SQL travels as a PUSHED FILE — nested
# shell quoting eats the JSON's double quotes otherwise (found 2026-07-30:
# settings.v1 arrived quote-stripped and unparseable).
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

TMP=$(mktemp); trap 'rm -f "$TMP"' EXIT
cat > "$TMP" << SQL
CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);
INSERT OR REPLACE INTO kv (key, value) VALUES ('onboarded.v1','true');
INSERT OR REPLACE INTO kv (key, value) VALUES ('settings.v1','{"location":{"type":"manual","cityId":"houston-us"},"method":"auto","madhab":"shafi","highLatRule":"auto"}');
INSERT OR REPLACE INTO kv (key, value) VALUES ('language.v1','$LANG_CODE');
SQL
adb push "$TMP" /data/local/tmp/deendawn-seed.sql >/dev/null
adb shell "sqlite3 $DB < /data/local/tmp/deendawn-seed.sql"
adb shell rm /data/local/tmp/deendawn-seed.sql
STORED=$(adb shell "sqlite3 $DB \"SELECT substr(value,1,20) FROM kv WHERE key='settings.v1'\"" | tr -d '\r')
case "$STORED" in
  '{"location":{"type"'*) echo "primed: $LANG_CODE / Houston (verified JSON intact)" ;;
  *) echo "PRIME FAILED — stored: $STORED"; exit 1 ;;
esac
