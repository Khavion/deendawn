#!/bin/zsh
# Accessibility audit helper: captures key screens at a given Dynamic Type
# size (and optionally in a given locale already set in the app) into
# docs/screens/audit/. Usage: scripts/audit-screens.sh <tag> [content_size]
# content_size: one of extra-small..extra-extra-extra-large or accessibility-medium.. etc.
set -e
TAG="${1:-default}"
SIZE="${2:-}"
OUT="docs/screens/audit"
APP="com.khavion.deendawn"
mkdir -p "$OUT"

if [ -n "$SIZE" ]; then
  xcrun simctl ui booted content_size "$SIZE"
fi

shot() {
  sleep 2
  xcrun simctl io booted screenshot "$OUT/$TAG-$1.png" >/dev/null 2>&1
}

open_url() {
  xcrun simctl terminate booted "$APP" 2>/dev/null || true
  xcrun simctl launch booted "$APP" >/dev/null
  sleep 8
  if [ -n "$1" ]; then
    xcrun simctl openurl booted "deendawn://$1"
    sleep 3
  fi
}

open_url ""            && shot today
open_url "surah/2"     && shot surah
open_url "tips"        && shot tips
open_url "zakat"       && shot zakat
open_url "calendar"    && shot calendar
open_url "library"     && shot library

echo "audit screenshots in $OUT/ (tag: $TAG)"
