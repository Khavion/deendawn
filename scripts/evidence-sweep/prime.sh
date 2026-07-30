#!/bin/bash
# Boot + install release app + create container + seed user data (Houston, onboarded).
UDID="$1"; APP="$2"
xcrun simctl bootstatus "$UDID" -b >/dev/null 2>&1
xcrun simctl install "$UDID" "$APP" || exit 1
xcrun simctl launch "$UDID" com.khavion.deendawn >/dev/null 2>&1
sleep 6
xcrun simctl terminate "$UDID" com.khavion.deendawn 2>/dev/null
CONT=$(xcrun simctl get_app_container "$UDID" com.khavion.deendawn data)
DB="$CONT/Documents/SQLite/user.db"
if [ ! -f "$DB" ]; then echo "NO user.db at $DB"; exit 1; fi
sqlite3 "$DB" "INSERT INTO kv(key,value) VALUES('onboarded.v1','true') ON CONFLICT(key) DO UPDATE SET value='true';"
sqlite3 "$DB" "INSERT INTO kv(key,value) VALUES('settings.v1','{\"location\":{\"type\":\"manual\",\"cityId\":\"houston-us\"}}') ON CONFLICT(key) DO UPDATE SET value='{\"location\":{\"type\":\"manual\",\"cityId\":\"houston-us\"}}';"
sqlite3 "$DB" "INSERT INTO kv(key,value) VALUES('language.v1','en') ON CONFLICT(key) DO UPDATE SET value='en';"
echo "PRIMED $UDID"
