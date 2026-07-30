#!/usr/bin/env bash
# 16 KB page-size gate (Google Play requirement, in force since 2025-11-01,
# extension expired 2026-05-31). Two independent checks:
#   1. AAB config: bundletool dump config -> PAGE_ALIGNMENT_16K
#   2. Universal APK derived from the AAB: zip alignment of uncompressed .so
#      (zipalign -c -P 16, build-tools >= 35) + ELF LOAD-segment alignment
#      >= 2**14 for every 64-bit lib (llvm-objdump). 32-bit ABIs are exempt
#      (16 KB devices are 64-bit only) and skipped.
# usage: check-16kb-alignment.sh path/to/app-release.aab
set -uo pipefail
cd "$(dirname "$0")/../.."
source scripts/android/env.sh

AAB="${1:?usage: check-16kb-alignment.sh path/to/app-release.aab}"
BUILD_TOOLS="$ANDROID_HOME/build-tools/36.0.0"
NDK_BIN="$ANDROID_HOME/ndk/27.1.12297006/toolchains/llvm/prebuilt/darwin-x86_64/bin"
WORK="$(mktemp -d)"; trap 'rm -rf "$WORK"' EXIT
FAIL=0

echo "== Check 0: bundle page-alignment config =="
CONFIG=$(bundletool dump config --bundle="$AAB")
echo "$CONFIG" | grep -io '"pageAlignment": *"[A-Z0-9_]*"' || true
if ! echo "$CONFIG" | grep -q "PAGE_ALIGNMENT_16K"; then
  echo "FAIL: AAB config lacks PAGE_ALIGNMENT_16K"
  FAIL=1
fi

echo "== Deriving universal APK =="
bundletool build-apks --bundle="$AAB" --output="$WORK/app.apks" --mode=universal >/dev/null
unzip -o -q "$WORK/app.apks" universal.apk -d "$WORK"
APK="$WORK/universal.apk"

echo "== Check 1: zip alignment (zipalign -c -P 16 4) =="
if "$BUILD_TOOLS/zipalign" -c -P 16 4 "$APK" >/dev/null 2>&1; then
  echo "PASS: zip alignment"
else
  echo "FAIL: zipalign -P 16 verification"
  "$BUILD_TOOLS/zipalign" -c -v -P 16 4 "$APK" 2>&1 | grep -iE "lib/.*\.so" | grep -iv "OK" | head -10
  FAIL=1
fi

echo "== Check 2: ELF LOAD alignment (64-bit .so, >= 2**14) =="
unzip -o -q "$APK" 'lib/arm64-v8a/*' 'lib/x86_64/*' -d "$WORK/apk" 2>/dev/null || true
while IFS= read -r -d '' so; do
  align=$("$NDK_BIN/llvm-objdump" -p "$so" | awk '/LOAD/{print $NF}' | sort -u | tr '\n' ' ')
  if echo "$align" | grep -Eq '2\*\*(1[0-3]|[0-9])( |$)'; then
    echo "UNALIGNED: ${so#"$WORK"/apk/} ($align)"
    FAIL=1
  fi
done < <(find "$WORK/apk/lib" -name '*.so' -print0 2>/dev/null)
[ "$FAIL" -eq 0 ] && echo "PASS: all 64-bit ELF LOAD segments >= 2**14"

if [ "$FAIL" -ne 0 ]; then echo "16KB GATE: FAILED"; exit 1; fi
echo "16KB GATE: PASSED"
