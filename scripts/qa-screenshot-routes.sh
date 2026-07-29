#!/bin/bash
# QA helper: walk the app's routes on a booted simulator and screenshot each.
# Usage: qa-screenshot-routes.sh <udid> <outdir> [prefix]
# Assumes the app is installed, onboarded, and idle on the Today tab.
set -euo pipefail
UDID="$1"
OUT="$2"
PREFIX="${3:-}"
mkdir -p "$OUT"

shot() { # shot <name> — screenshot the current screen
  xcrun simctl io "$UDID" screenshot "$OUT/${PREFIX}${1}.png" >/dev/null
}
open_route() { # open_route <route> <name> [settle-seconds]
  xcrun simctl openurl "$UDID" "deendawn://$1" >/dev/null
  sleep "${3:-1.6}"
  shot "$2"
}

open_route "" "01-today" 2.2
open_route "quran" "02-quran-list"
open_route "surah/2" "03-reader-baqara" 2.5
open_route "surah/1" "04-reader-fatiha" 2.0
open_route "ask" "05-ask"
open_route "qibla" "06-qibla"
open_route "more" "07-more"
open_route "bookmarks" "08-bookmarks"
open_route "calendar" "09-calendar"
open_route "tasbih" "10-tasbih"
open_route "zakat" "11-zakat"
open_route "library" "12-library"
open_route "about" "13-about" 2.0
open_route "work/1" "14-work-reader" 2.2
echo "done: $OUT"
