#!/bin/bash
cd /Users/zohaibkhawaja/Desktop/Khavion/deendawn
SP="$(dirname "$0")"; OUT="docs/screens/final"
SE3=FAAE143F-D22B-49AA-BF13-584F6E938917; P16E=CCF8CC66-EFE5-4605-A7BD-28D9FEEAA682
AIR=E341EC27-839A-4174-80B1-E1C09C5F45E1; PMAX=AF40CAC5-D279-41DB-8788-33E34469F4C0
MINI=83F559AE-7C9D-40E2-8EE7-150AAB1C8B99; AIR11=E71B0359-41C2-4C2C-9F4E-7D1D67D62083
PRO13=E62B7DC6-CEE9-47D2-9D4E-C784EEB949A1
ALL="today quran ask qibla more surah/1 surah/2?ayah=255 bookmarks calendar tasbih zakat library thinker/ghazali work/1 about"
KEY="today quran surah/2?ayah=255 more zakat tasbih"
kv() { local C=$(xcrun simctl get_app_container "$1" com.khavion.deendawn data); sqlite3 "$C/Documents/SQLite/user.db" "INSERT INTO kv(key,value) VALUES('$2','$3') ON CONFLICT(key) DO UPDATE SET value='$3';"; }
prep() { xcrun simctl ui "$1" appearance "$2"; xcrun simctl ui "$1" content_size "$3"; xcrun simctl terminate "$1" com.khavion.deendawn 2>/dev/null; }
for pair in "$SE3:a-se3-18" "$P16E:a-16e" "$AIR:a-air" "$PMAX:a-17promax" "$MINI:a-ipadmini" "$AIR11:a-ipadair11" "$PRO13:a-ipadpro13"; do
  U="${pair%%:*}"; N="${pair##*:}"
  prep "$U" light large
  bash "$SP/sweep.sh" "$U" "$OUT/$N" $ALL
done
prep "$PRO13" dark large; bash "$SP/sweep.sh" "$PRO13" "$OUT/d-dark-ipad13" $KEY
prep "$SE3" light accessibility-extra-extra-extra-large
bash "$SP/sweep.sh" "$SE3" "$OUT/e-dt-se3" today quran "surah/1" more zakat tasbih qibla calendar
xcrun simctl ui "$SE3" content_size large
prep "$PRO13" light accessibility-extra-extra-extra-large
bash "$SP/sweep.sh" "$PRO13" "$OUT/e-dt-ipad13" today quran "surah/2?ayah=255" zakat more
xcrun simctl ui "$PRO13" content_size large
prep "$MINI" light large; kv "$MINI" language.v1 ar
bash "$SP/sweep.sh" "$MINI" "$OUT/f-ar-ipadmini" today quran "surah/2?ayah=282" more zakat about
kv "$MINI" language.v1 en; xcrun simctl terminate "$MINI" com.khavion.deendawn 2>/dev/null
echo RESWEEP_DONE
