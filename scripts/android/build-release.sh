#!/usr/bin/env bash
# Android release build + gates. Always builds from a FRESH prebuild (never
# from a stale generated android/), producing:
#   - app-release.apk  (all-ABI, emulator-installable — the sweep artifact)
#   - app-release.aab  (the Play deliverable; gates run against it)
# Then runs the 16 KB alignment gate + the merged-manifest permission gate
# and prints download-size estimates. Local release signing uses the debug
# keystore (fine for emulator QA; EAS owns the upload key).
# usage: build-release.sh [--skip-prebuild]
set -euo pipefail
cd "$(dirname "$0")/../.."
source scripts/android/env.sh

if [ "${1:-}" != "--skip-prebuild" ]; then
  npx expo prebuild -p android
fi
# The generated gradle.properties caps metaspace at 512m — lintVitalRelease
# exhausts it on this project (verified 2026-07-30). Override per-invocation;
# lives here so it survives prebuild without touching global config.
export GRADLE_OPTS="-Dorg.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1536m"
(cd android && ./gradlew :app:assembleRelease :app:bundleRelease)

APK=android/app/build/outputs/apk/release/app-release.apk
AAB=android/app/build/outputs/bundle/release/app-release.aab
ls -la "$APK" "$AAB"

WORK=$(mktemp -d); trap 'rm -rf "$WORK"' EXIT
echo "== download-size estimate (Play split APKs) =="
bundletool build-apks --bundle="$AAB" --output="$WORK/split.apks" >/dev/null
bundletool get-size total --apks="$WORK/split.apks" || true
bundletool build-apks --bundle="$AAB" --output="$WORK/u.apks" --mode=universal >/dev/null
unzip -o -q "$WORK/u.apks" universal.apk -d "$WORK"

scripts/android/check-16kb-alignment.sh "$AAB"
scripts/android/check-manifest.sh "$WORK/universal.apk"
echo "RELEASE BUILD + GATES: DONE"
