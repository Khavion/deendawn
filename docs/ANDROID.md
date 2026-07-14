# Testing DeenDawn on the Android emulator

The app runs on an Android emulator on your Mac — **no Apple account needed**.
This is the quickest way for you to play with DeenDawn today.

## Playing with it right now

The emulator is a phone window on your screen. Use it like a phone with your
mouse: **click** to tap, **click-drag** to scroll, and type with your keyboard.
Try: tap **Begin**, pick a city, then explore the tabs (Today, Quran, Ask,
Qibla, More). Everything works except the two known gaps (real recitation audio
and the tip jar, which need setup).

## If you close it and want it back later

Two things have to be running: the **emulator** and **Metro** (the thing that
serves the app's code, since this is a development build). From the project
folder (`~/Desktop/Khavion/deendawn`) in Terminal:

```sh
# 1. Start Metro (leave this window open)
npx expo start

# 2. In a SECOND Terminal window — set the tools up and boot the phone:
export ANDROID_HOME=/opt/homebrew/share/android-commandlinetools
export PATH="$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator"
emulator -avd deendawn_pixel &
# wait ~30s for the phone to boot, then:
adb reverse tcp:8081 tcp:8081
adb shell am start -n com.khavion.deendawn/.MainActivity
```

The app is already installed on the emulator, so you don't rebuild — just launch
it. (If you ever wipe the emulator, rebuild + install with
`npx expo run:android`.)

## What this is / isn't

- It **is** a real, complete build of the app: same code, same design, same
  features as the iOS version. Great for trying the experience and giving
  feedback.
- It is **not** the final Play Store build. Android is officially a
  "fast-follow" after iOS TestFlight (per the project plan), so a few
  Android-only polish items (notification channels, exact-alarm handling) are
  deferred. The core worship features all work.
- Tajweed colors: turn them on in **More → Tajweed colors** (they're visible in
  this development build, watermarked "pending review").

## How it was set up (for the record)

- Android SDK command-line tools + platform 35 + build-tools + an arm64 system
  image + NDK 27 (for the on-device AI library's native code), via `sdkmanager`.
- Build uses Android Studio's bundled JDK 21 (the system Java 25 is too new for
  the Android build tools): `JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"`.
- AVD: `deendawn_pixel` (Pixel 7, Android 15). Debug APK ≈ 291 MB (a release
  build is far smaller — debug bundles every CPU architecture).
- First build surfaced + fixed a real portability bug: Android forbids hyphens
  in resource names, so the placeholder sound files were renamed to underscores.
