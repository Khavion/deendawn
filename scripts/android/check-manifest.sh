#!/usr/bin/env bash
# Merged-manifest permission gate. Asserts the BUILT artifact (universal APK
# or APK) against scripts/android/manifest-policy.txt.
# usage: check-manifest.sh path/to/app.apk
set -uo pipefail
cd "$(dirname "$0")/../.."
source scripts/android/env.sh

APK="${1:?usage: check-manifest.sh path/to/app.apk}"
BUILD_TOOLS="$ANDROID_HOME/build-tools/36.0.0"
POLICY="scripts/android/manifest-policy.txt"
FAIL=0

PERMS=$("$BUILD_TOOLS/aapt2" dump permissions "$APK" | grep -oE "name='[^']+'" | cut -d"'" -f2 | sort -u)

while IFS= read -r line; do
  case "$line" in
    forbid:*)
      p="${line#forbid:}"
      if echo "$PERMS" | grep -qx "$p"; then
        echo "FAIL forbidden permission present: $p"
        FAIL=1
      fi
      ;;
    require:*)
      p="${line#require:}"
      if ! echo "$PERMS" | grep -qx "$p"; then
        echo "FAIL required permission missing: $p"
        FAIL=1
      fi
      ;;
  esac
done < <(grep -vE '^#|^$' "$POLICY")

echo "-- merged permissions --"
echo "$PERMS"
if [ "$FAIL" -ne 0 ]; then echo "MANIFEST GATE: FAILED"; exit 1; fi
echo "MANIFEST GATE: PASSED"
