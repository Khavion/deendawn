#!/bin/bash
# DeenDawn evidence sweep — capture a set of routes on one device.
# usage: sweep.sh <udid> <outdir> <routes...>   (route "today" = plain launch)
UDID="$1"; OUT="$2"; shift 2
mkdir -p "$OUT"
for route in "$@"; do
  name=$(echo "$route" | tr '/?=&:' '-----')
  if [ "$route" = "today" ]; then
    xcrun simctl terminate "$UDID" com.khavion.deendawn 2>/dev/null
    xcrun simctl launch "$UDID" com.khavion.deendawn >/dev/null 2>&1
    sleep 5
  else
    xcrun simctl openurl "$UDID" "deendawn://$route" 2>/dev/null
    sleep 2.5
  fi
  xcrun simctl io "$UDID" screenshot "$OUT/$name.png" >/dev/null 2>&1
done
echo "SWEEP DONE: $OUT ($# routes)"
