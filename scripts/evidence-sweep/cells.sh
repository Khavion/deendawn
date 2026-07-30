#!/bin/bash
# All main evidence cells. Assumes devices primed + scheme prompts cleared.
SP="$(dirname "$0")"; OUT="docs/screens/final"
SE3=FAAE143F-D22B-49AA-BF13-584F6E938917; P16E=CCF8CC66-EFE5-4605-A7BD-28D9FEEAA682
P17=455809F0-521A-42A3-AD27-27AFEB7625CB; AIR=E341EC27-839A-4174-80B1-E1C09C5F45E1
PMAX=AF40CAC5-D279-41DB-8788-33E34469F4C0; MINI=83F559AE-7C9D-40E2-8EE7-150AAB1C8B99
AIR11=E71B0359-41C2-4C2C-9F4E-7D1D67D62083; PRO13=E62B7DC6-CEE9-47D2-9D4E-C784EEB949A1
ALL="today quran ask qibla more surah/1 surah/2?ayah=255 bookmarks calendar tasbih zakat library thinker/ghazali work/1 about"
KEY="today quran surah/2?ayah=255 more zakat tasbih"
AR="today quran ask more surah/2?ayah=282 zakat calendar tasbih library about"
kv() { # kv <udid> <key> <value>
  local C=$(xcrun simctl get_app_container "$1" com.khavion.deendawn data)
  sqlite3 "$C/Documents/SQLite/user.db" "INSERT INTO kv(key,value) VALUES('$2','$3') ON CONFLICT(key) DO UPDATE SET value='$3';"
}
prep() { xcrun simctl ui "$1" appearance "$2"; xcrun simctl ui "$1" content_size "$3"; xcrun simctl terminate "$1" com.khavion.deendawn 2>/dev/null; }

echo "== CELL A: 8 devices / EN light default =="
for pair in "$SE3:a-se3-18" "$P16E:a-16e" "$P17:a-17" "$AIR:a-air" "$PMAX:a-17promax" "$MINI:a-ipadmini" "$AIR11:a-ipadair11" "$PRO13:a-ipadpro13"; do
  U="${pair%%:*}"; N="${pair##*:}"
  prep "$U" light large
  bash "$SP/sweep.sh" "$U" "$OUT/$N" $ALL
done

echo "== CELL B: iPhone 17 dark =="
prep "$P17" dark large; bash "$SP/sweep.sh" "$P17" "$OUT/b-dark-17" $ALL

echo "== CELL D: iPad Pro 13 dark =="
prep "$PRO13" dark large; bash "$SP/sweep.sh" "$PRO13" "$OUT/d-dark-ipad13" $KEY

echo "== CELL C: night-warm reader (iPhone 17, light) =="
prep "$P17" light large; kv "$P17" quran.nightWarm.v1 true
bash "$SP/sweep.sh" "$P17" "$OUT/c-nightwarm-17" today "surah/1" "surah/2?ayah=255"
kv "$P17" quran.nightWarm.v1 false

echo "== CELL E: 200% Dynamic Type =="
prep "$SE3" light accessibility-extra-extra-extra-large
bash "$SP/sweep.sh" "$SE3" "$OUT/e-dt-se3" today quran "surah/1" more zakat tasbih qibla calendar
prep "$P17" light accessibility-extra-extra-extra-large
bash "$SP/sweep.sh" "$P17" "$OUT/e-dt-17" $ALL
prep "$PRO13" light accessibility-extra-extra-extra-large
bash "$SP/sweep.sh" "$PRO13" "$OUT/e-dt-ipad13" today quran "surah/2?ayah=255" zakat more
xcrun simctl ui "$SE3" content_size large; xcrun simctl ui "$PRO13" content_size large

echo "== CELL F: Arabic =="
prep "$P17" light large; kv "$P17" language.v1 ar
bash "$SP/sweep.sh" "$P17" "$OUT/f-ar-17" $AR
prep "$MINI" light large; kv "$MINI" language.v1 ar
bash "$SP/sweep.sh" "$MINI" "$OUT/f-ar-ipadmini" today quran "surah/2?ayah=282" more zakat about
kv "$MINI" language.v1 en

echo "== CELL G: Urdu (iPhone 17) =="
prep "$P17" light large; kv "$P17" language.v1 ur
bash "$SP/sweep.sh" "$P17" "$OUT/g-ur-17" today quran "surah/1" more zakat calendar

echo "== CELL H: compound ar + 200% + dark (iPhone 17) =="
xcrun simctl ui "$P17" appearance dark; xcrun simctl ui "$P17" content_size accessibility-extra-extra-extra-large
kv "$P17" language.v1 ar; xcrun simctl terminate "$P17" com.khavion.deendawn 2>/dev/null
bash "$SP/sweep.sh" "$P17" "$OUT/h-compound-17" today quran "surah/2?ayah=282" more zakat tasbih

echo "== restore iPhone 17 defaults =="
xcrun simctl ui "$P17" appearance light; xcrun simctl ui "$P17" content_size large
kv "$P17" language.v1 en; xcrun simctl terminate "$P17" com.khavion.deendawn 2>/dev/null
echo CELLS_DONE
