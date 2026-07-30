# Android Research Handover — 2026-07-30

Six parallel research reports produced on 2026-07-30 to seed the Android perfection phase.
Five are deep-web-research briefs (current official sources, cited inline); the sixth is a
repo audit mapping the actual Android state of this codebase on that date.

## READ THIS FIRST — two corrections that govern how you use this file

1. **The five web-research briefs were written against Expo SDK 54 / RN 0.81 (the stack
   CLAUDE.md still pins), but the repo actually runs Expo SDK 57 / RN 0.86 / React 19.2.3**
   (upgrade commit `b556e8c`; confirmed in package.json and by report 6 below). Treat every
   Expo/RN *version-specific* claim in reports 1–5 (Gradle/AGP/JDK numbers, expo-* API
   surfaces, config-plugin options, default flags like predictive back) as UNVERIFIED for
   SDK 57 — re-research each one before acting on it. Android OS behavior, Google Play
   policy, emulator/adb techniques, and category/market findings are version-independent
   and remain valid.
2. **The applicationId is `com.khavion.deendawn`** — a couple of command snippets in the
   emulator report guessed `com.khavionapps.deendawn`; substitute the real id.

Contents:
1. Expo/RN on Android — platform requirements and known issues (SDK 54-anchored; re-verify)
2. Google Play publishing on a personal account (mid-2026 rules)
3. Reliable adhan notifications on Android (architecture + test plan)
4. Android emulator testing — capabilities, adb cookbook, device matrix, Maestro
5. The "how is this free?!" Android excellence bar (prioritized work items)
6. Repo audit — actual Android state of this codebase (2026-07-30)

---



# Report 1. Expo/RN on Android — platform requirements and known issues

## Answer

Expo SDK 54 / RN 0.81 on Android compiles and targets API 36 (Android 16) with minSdk 24, which makes edge-to-edge mandatory (no opt-out) and puts the app squarely under Google Play's 16 KB page-size requirement — fully in force as of today (the May 31, 2026 extension window has passed). The toolchain is Gradle 8.14.3 + AGP 8.11.0 + Kotlin 2.1.20 + NDK r27, and it will NOT run on the machine's Temurin JDK 25 (Gradle 8.14 tops out at Java 24) — install and pin JDK 17, which is what Expo docs and EAS build images use. llama.rn and op-sqlite both already pass the 16 KB flexible-page-size flag in their Android builds, and there is no documented Android equivalent of the iOS dual-SQLite static-library conflict; the main verify-at-build items are the prebuilt sqlite-vec/llama.rn `.so` alignment (check the APK) and expo-notifications exact-alarm behavior.

## Findings

### 1. SDK levels in Expo SDK 54 / RN 0.81

- Expo SDK 54 ships React Native 0.81 and targets **Android 16 (API 36)** — targetSdkVersion moved from 35 to 36. (https://expo.dev/changelog/sdk-54, https://reactnative.dev/blog/2025/08/12/react-native-0.81)
- RN 0.81 template values (verified in the 0.81-stable template `android/build.gradle`): `compileSdkVersion = 36`, `targetSdkVersion = 36`, `minSdkVersion = 24`, `buildToolsVersion = "36.0.0"`, `ndkVersion = "27.1.12297006"`, `kotlinVersion = "2.1.20"`. (https://raw.githubusercontent.com/react-native-community/template/0.81-stable/template/android/build.gradle)
- expo-build-properties SDK 54 defaults match: compileSdk 36 / targetSdk 36 / buildTools 36.0.0 / Kotlin 2.1.20, minSdk 24. (https://docs.expo.dev/versions/latest/sdk/build-properties/)

Gotchas:
- Targeting 36 (not 35) is what triggers both the edge-to-edge no-opt-out rule and predictive-back default-on behavior below — don't "fix" issues by dropping targetSdk; Play's target-API policy will catch up with you anyway.

### 2. Android 15/16 behavior changes affecting this app

**Edge-to-edge (mandatory):**
- Android 16 official docs: "For apps targeting Android 16 (API level 36), `R.attr#windowOptOutEdgeToEdgeEnforcement` is deprecated and disabled, and your app can't opt-out of going edge-to-edge." (https://developer.android.com/about/versions/16/behavior-changes-16)
- RN 0.81: edge-to-edge required, `<SafeAreaView>` deprecated in favor of `react-native-safe-area-context`; new Gradle property `edgeToEdgeEnabled` extends edge-to-edge to pre-16 Android. (https://reactnative.dev/blog/2025/08/12/react-native-0.81)
- Expo SDK 54: "Edge-to-edge will be enabled in all Android apps, and cannot be disabled." `react-native-edge-to-edge` is no longer a dependency of `expo`; app.json `android.edgeToEdgeEnabled` defaults true and "will be removed in SDK 55" (confirmed removed in SDK 55). New app.json `androidNavigationBar.enforceContrast` (default true) replaces the plugin's contrast option. (https://expo.dev/changelog/sdk-54, https://docs.expo.dev/versions/v54.0.0/config/app/, https://expo.dev/changelog/sdk-55)

**16 KB page size:**
- Play requirement: "Starting November 1st, 2025, all new apps and updates to existing apps submitted to Google Play and targeting Android 15+ devices must support 16 KB page sizes on 64-bit devices." (https://developer.android.com/guide/practices/page-sizes)
- A Play Console extension existed to **May 31, 2026** — that date has passed, so as of July 2026 compliance is unconditional for any upload targeting API 35+. (https://android-developers.googleblog.com/2025/05/prepare-play-apps-for-devices-with-16kb-page-size.html, https://support.google.com/googleplay/android-developer/thread/368982598)
- "React Native is already 16KB page size compliant. Ensure all your native code and third-party libraries are compliant as well." (https://reactnative.dev/blog/2025/08/12/react-native-0.81)
- NDK r28+ compiles 16 KB-aligned by default; r27 (what RN 0.81/EAS use) needs `-Wl,-z,max-page-size=16384` or `ANDROID_SUPPORT_FLEXIBLE_PAGE_SIZES=ON`; AGP ≥ 8.5.1 required for correct zip alignment of uncompressed libs (AGP 8.11 qualifies). Verify final APKs with APK Analyzer's Alignment column, `check_elf_alignment.sh APK_NAME.apk`, or `zipalign -v -c -P 16 4 APK_NAME.apk`. (https://developer.android.com/guide/practices/page-sizes)
- It DOES affect the custom native libs — see section 5 for llama.rn/op-sqlite/sqlite-vec status.

**Predictive back gesture:**
- Android 16 docs: "For apps targeting Android 16 (API level 36) or higher and running on an Android 16 or higher device, the predictive back system animations ... are enabled by default. Additionally, `onBackPressed` is not called and `KeyEvent.KEYCODE_BACK` is not dispatched anymore." Temporary opt-out: `android:enableOnBackInvokedCallback="false"` on `<application>`/`<activity>`. (https://developer.android.com/about/versions/16/behavior-changes-16)
- Expo SDK 54 **opts out by default**: app.json `android.predictiveBackGestureEnabled` defaults to `false` ("disabled by default in all projects in SDK 54"); Expo plans to flip the default in SDK 55/56. Adoption in expo-router is just the config flag — no code change required:
  ```json
  { "expo": { "android": { "predictiveBackGestureEnabled": true } } }
  ```
  (https://expo.dev/changelog/sdk-54, https://docs.expo.dev/versions/v54.0.0/config/app/)

**Foreground service types (Android 14+, applies since API 34):**
- "If your app targets Android 14, it must specify appropriate foreground service types" via `android:foregroundServiceType` on each `<service>`, plus the matching normal permission (e.g. `FOREGROUND_SERVICE_MEDIA_PLAYBACK` for `mediaPlayback`). Missing type → `MissingForegroundServiceTypeException`; missing permission → `SecurityException`. Play Console also requires declaring FGS types in the app-content policy section. (https://developer.android.com/about/versions/14/changes/fgs-types-required)
- Relevant to DeenDawn only via expo-audio's playback notification service (next section) — the expo-audio config plugin handles the manifest entries.

Gotchas:
- Edge-to-edge on Android means every screen must handle insets via safe-area-context — audit any screen still assuming an opaque status/navigation bar; translucent-nav-bar contrast is now controlled by `androidNavigationBar.enforceContrast`.
- Predictive back: enabling it means the JS `BackHandler`/`hardwareBackPress` interception paths stop receiving events on Android 16 devices in some flows — test tasbih/reader back behavior before flipping the flag; leaving it `false` (SDK 54 default) is safe for the first Android release.
- 16 KB: your emulator matrix should include an API 36 emulator with the 16 KB page-size image to catch runtime crashes, not just alignment warnings.

### 3. Known Android bugs/limitations per module

**expo-notifications:**
- CALENDAR trigger is iOS-only ("a calendar date match on iOS"); on Android use DAILY/WEEKLY/MONTHLY/YEARLY/DATE/TIME_INTERVAL triggers. (https://raw.githubusercontent.com/expo/expo/sdk-54/docs/pages/versions/v54.0.0/sdk/notifications.mdx, https://github.com/expo/expo/pull/35245)
- Exactness: "Starting from Android 12 (API level 31), to schedule a notification that triggers at an exact time, you need to add `<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM"/>`" to the manifest. On Android 14+ that permission is denied by default for non-clock/calendar apps, so alarms silently fall back to inexact and can drift unless the user enables "Alarms & reminders" in settings; `USE_EXACT_ALARM` is restricted by Play policy to clock/calendar apps. This is the single biggest adhan-punctuality risk on Android. (expo docs above; https://developer.android.com/about/versions/12/behavior-changes-12#exact-alarm-permission)
- Custom sounds: on Android 8.0+ the sound lives on the **notification channel** (`NotificationChannelInput.sound`), files in `res/raw/` (config plugin `sounds` array handles this), `.wav` recommended; a channel's sound/importance is immutable after creation unless you create a new channel ID. `setNotificationChannelAsync` must be called before getting push tokens on Android 13+. (https://docs.expo.dev/versions/v54.0.0/sdk/notifications/)
- Known dev-build quirk: launching via notification in Android debug builds breaks the splash "about 70% of the time" — test notification launches with `npx expo run:android --variant release`. (https://docs.expo.dev/versions/v54.0.0/sdk/notifications/)
- SDK 54 removed the long-deprecated function exports. (https://expo.dev/changelog/sdk-54)

**expo-audio (SDK 54 ships 1.1.x after patch updates):**
- Background playback: `setAudioModeAsync({ shouldPlayInBackground: true })`; on Android the config plugin adds `FOREGROUND_SERVICE` + `FOREGROUND_SERVICE_MEDIA_PLAYBACK` and declares a media-playback foreground service (`AudioControlsService`), satisfying the Android 14 FGS-type rule. (https://docs.expo.dev/versions/v54.0.0/sdk/audio/, https://github.com/expo/expo — expo-audio changelog)
- Lock-screen/notification controls on Android exist via `player.setActiveForLockScreen(active, metadata, options)` with `AudioLockScreenOptions` (`showSeekForward`/`showSeekBackward`) — but this landed late: 0.4.8 (2025-07-03) was iOS-only; the Android side plus fixes ("[Android] Use correct method to start foreground service on android 14+", notification race-condition fix) arrived in **1.1.0 (2025-12-11)** / 1.1.1 (2025-12-17). Keep expo-audio at the latest SDK 54 patch and treat Android media controls as young code. (https://raw.githubusercontent.com/expo/expo/sdk-54/packages/expo-audio/CHANGELOG.md)

**expo-sqlite:** Android 16 KB page-size support was merged into the SDK 54 line (expo PR #37446 "[av][core][gl][sqlite] support android 16kb page size"). One open exception: the **SQLCipher** variant is not 16 KB-compliant (issue #39792) — DeenDawn doesn't use SQLCipher, so not affected. SDK 54 also added extension loading and localStorage support. (https://github.com/expo/expo/pull/37446, https://github.com/expo/expo/issues/39792, https://expo.dev/changelog/sdk-54)

**expo-location:** `getHeadingAsync`/`watchHeadingAsync` ARE available on Android in v54; `LocationHeadingObject` = `{ magHeading, trueHeading, accuracy }` where `accuracy` is 0–3 calibration level and `trueHeading` "needs location permissions, will return -1 if not given." This is the API that gives you a heading-accuracy signal on Android for the qibla calibration UX. (https://docs.expo.dev/versions/v54.0.0/sdk/location/)

**expo-sensors magnetometer:** `MagnetometerMeasurement` is only `{x, y, z, timestamp}` in μT — **no accuracy field** on either platform; and on Android 12+ "the system has a 200ms limit for each sensor updates" (5 Hz cap) unless the `HIGH_SAMPLING_RATE_SENSORS` permission is added. So on Android, derive accuracy from expo-location's heading `accuracy`, not from expo-sensors. (https://docs.expo.dev/versions/v54.0.0/sdk/magnetometer/)

**expo-splash-screen:** Since SDK 52, Android uses the Android 12+ SplashScreen API: the splash is a roughly-circular icon on a flat background — full-bleed splash images do not work; Expo Go and dev builds cannot faithfully render it (dev builds show the app icon), so QA splash only in release builds. Open cosmetic bug: logo can render tiny then "flash" to the correct size (#39695). (https://docs.expo.dev/develop/user-interface/splash-screen-and-app-icon/, https://github.com/expo/expo/issues/34586, https://github.com/expo/expo/issues/39695)

**FlashList v2:** "FlashList v2.x has been designed to be new architecture only and will not run on old architecture." Android-specific open issue: infinite render loop ("Exceeded max renders without commit") on some Android devices when nested in a ScrollView (#1966). RTL on Android has a long bug history (multi-column layouts broken: #544, #842, #1207, #1377 — mostly v1-era); the official troubleshooting doc warns against `contentContainerStyle` padding with RTL horizontal lists or `initialScrollIndex`. Your existing explicit-layout-direction fix for cells is the right pattern — re-run the RTL sweep on Android specifically. (https://github.com/Shopify/flash-list, https://github.com/Shopify/flash-list/issues/1966, https://shopify-flash-list.mintlify.app/troubleshooting)

**New Architecture in RN 0.81 / SDK 54:** Legacy Architecture was code-frozen in RN 0.80; **SDK 54 is the final Expo release supporting Legacy Architecture** — SDK 55 (Feb 25, 2026, RN 0.83) removed it and the `newArchEnabled` flag. Since DeenDawn already runs llama.rn (New Arch required since v0.10) and FlashList v2 (New Arch only), the Android build must simply keep New Architecture on — which is the SDK 54 default. (https://expo.dev/changelog/sdk-55, https://docs.expo.dev/guides/new-architecture/, https://github.com/mybigday/llama.rn)

Gotchas:
- Adhan exactness on Android 14+/16 is a UX problem, not a code problem: without the user granting "Alarms & reminders," scheduled adhans drift under Doze. Plan an in-app explainer + deep link to the setting (mirrors your existing DECISIONS.md exact-alarm strategy).
- Channel immutability: pick your channel IDs and sounds carefully before first release; changing a sound later requires new channel IDs.
- Never QA splash or notification-launch behavior in debug builds on Android.

### 4. Build toolchain and JDK

- Verified versions shipped by RN 0.81 (what `npx expo prebuild` generates): **Gradle 8.14.3** (`distributionUrl=https\://services.gradle.org/distributions/gradle-8.14.3-bin.zip`), **AGP 8.11.0**, **Kotlin 2.1.20**, **NDK 27.1.12297006**, build-tools 36.0.0. (https://raw.githubusercontent.com/react-native-community/template/0.81-stable/template/android/gradle/wrapper/gradle-wrapper.properties, https://raw.githubusercontent.com/facebook/react-native/0.81-stable/packages/gradle-plugin/gradle/libs.versions.toml)
- **Temurin JDK 25 will fail**: Java 25 is only supported by Gradle 9.1.0+ ("Gradle 9.0.0 had a maximum compatible JVM version of 24"); Gradle 8.14.x cannot run on it, and Kotlin toolchains also lag JDK 25. Do not try to upgrade Gradle past what RN pins. (https://docs.gradle.org/9.1.0/release-notes.html, https://github.com/gradle/gradle/issues/35062)
- What to use: **JDK 17**. Expo's environment-setup docs prescribe OpenJDK 17 (Azul Zulu example) with `JAVA_HOME`, and every current EAS Android build image is JDK 17: SDK 54 builds default to image `ubuntu-24.04-jdk-17-ndk-r27b` (JDK 17, NDK 27.1.12297006). (https://github.com/expo/expo/blob/main/docs/scenes/get-started/set-up-your-environment/instructions/_androidStudioEnvironmentInstructions.mdx, https://docs.expo.dev/build-reference/infrastructure/)
- Local pinning on this Mac (keeps JDK 25 installed for other things, uses 17 for Android):
  ```sh
  brew install --cask zulu@17        # or temurin@17
  # in ~/.zshrc:
  export JAVA_HOME=$(/usr/libexec/java_home -v 17)
  ```
  or per-project in `android/gradle.properties`: `org.gradle.java.home=/Library/Java/JavaVirtualMachines/zulu-17.jdk/Contents/Home`. (Expo env-setup docs above)

Gotchas:
- With JDK 25 as the default `java`, `expo run:android` dies inside Gradle with a JVM-compatibility error before any RN code compiles — pin JAVA_HOME first, before diagnosing anything else.
- Match EAS: since EAS uses JDK 17 + NDK r27b, using the same locally eliminates "works on EAS, fails locally" drift.

### 5. llama.rn + op-sqlite + sqlite-vec together on Android

- **No documented Android equivalent of the iOS dual-SQLite static-library conflict.** op-sqlite's docs warn generically that "If you have other packages that are dependent on sqlite you will have issues," but every documented remedy (static-library Podfile hook, `expo.updates.useThirdPartySQLitePod`, `iosSqlite` flag) is iOS/CocoaPods-specific. On Android each library builds its own `.so` via its own CMake/prefab, so the duplicate-symbol problem doesn't arise the same way; keep the two DB files separate as you already do, and smoke-test both DBs opening in one process on the emulator. (https://op-engineering.github.io/op-sqlite/docs/installation/)
- **sqlite-vec in op-sqlite**: enabled via package.json — `"op-sqlite": { "sqliteVec": true }`; on Android op-sqlite adds a bundled `src/main/libsqlitevec` jniLibs dir (a prebuilt library), gated by `-DUSE_SQLITE_VEC`. (https://op-engineering.github.io/op-sqlite/docs/installation/, https://raw.githubusercontent.com/OP-Engineering/op-sqlite/main/android/build.gradle)
- **16 KB compliance status of the three libs**:
  - llama.rn `android/build.gradle` passes `-DANDROID_SUPPORT_FLEXIBLE_PAGE_SIZES=ON` to CMake (the official NDK switch for 16 KB pages), builds only arm64-v8a/x86_64, requires New Arch since v0.10, and uses prebuilt libs by default (`rnllamaBuildFromSource=true` in `android/gradle.properties` forces source builds). Current release v0.12.8 (2026-07-28). (https://raw.githubusercontent.com/mybigday/llama.rn/main/android/build.gradle, https://github.com/mybigday/llama.rn, https://github.com/mybigday/llama.rn/releases)
  - op-sqlite `android/build.gradle` also passes `-DANDROID_SUPPORT_FLEXIBLE_PAGE_SIZES=ON`; current release 17.1.3 (2026-07-27). (https://raw.githubusercontent.com/OP-Engineering/op-sqlite/main/android/build.gradle, https://github.com/OP-Engineering/op-sqlite/releases)
  - sqlite-vec upstream: the op-sqlite maintainer's PR adding `-Wl,-z,max-page-size=16384` to sqlite-vec (asg017/sqlite-vec#254, "Users cannot submit app updates until all libraries and binaries have been updated") was **still unmerged as of Jan 2026** — which means the alignment of the sqlite-vec binary op-sqlite ships depends on op-sqlite's own build of it, not upstream. Unverified either way. (https://github.com/asg017/sqlite-vec/pull/254)
  - expo-sqlite: compliant per expo PR #37446 (section 3).
- Because llama.rn ships prebuilts and op-sqlite bundles a sqlite-vec lib, the only trustworthy compliance check is on your own artifact: run `check_elf_alignment.sh app-release.apk` or `zipalign -v -c -P 16 4` and inspect `librnllama*.so`, `libop-sqlite.so`, and any `libsqlite_vec*.so` before the first Play upload. (https://developer.android.com/guide/practices/page-sizes)

Gotchas:
- The Play Console hard-blocks non-16KB-aligned uploads targeting API 35+ as of now — make APK alignment verification a CI gate before the closed-test upload (remember the personal-account 14-day/12-tester closed test lead time).
- llama.rn supports 64-bit only (arm64-v8a/x86_64) — fine for Play (64-bit mandate) but your Tier-B capability gate should also check ABI on Android.
- llama.rn OpenCL path is Adreno-only with Q4_0/Q6_K types, and state save/load is limited under OpenCL (`kv_unified: true`, `flash_attn_type: 'off'` workarounds) — for Qwen3 Q4 GGUF, plan CPU inference as the baseline on Android.
- Add the llama.rn proguard rule for release builds: `-keep class com.rnllama.** { *; }`.

## Sources

1. https://expo.dev/changelog/sdk-54 (Sept 2025)
2. https://reactnative.dev/blog/2025/08/12/react-native-0.81 (Aug 12, 2025)
3. https://docs.expo.dev/versions/v54.0.0/config/app/
4. https://developer.android.com/about/versions/16/behavior-changes-16
5. https://developer.android.com/guide/practices/page-sizes
6. https://android-developers.googleblog.com/2025/05/prepare-play-apps-for-devices-with-16kb-page-size.html (May 2025)
7. https://support.google.com/googleplay/android-developer/thread/368982598 (16 KB deadline/extension clarification)
8. https://raw.githubusercontent.com/react-native-community/template/0.81-stable/template/android/build.gradle and .../gradle-wrapper.properties
9. https://raw.githubusercontent.com/facebook/react-native/0.81-stable/packages/gradle-plugin/gradle/libs.versions.toml
10. https://docs.gradle.org/9.1.0/release-notes.html and https://github.com/gradle/gradle/issues/35062
11. https://github.com/expo/expo/blob/main/docs/scenes/get-started/set-up-your-environment/instructions/_androidStudioEnvironmentInstructions.mdx
12. https://docs.expo.dev/build-reference/infrastructure/
13. https://docs.expo.dev/versions/v54.0.0/sdk/notifications/ and https://raw.githubusercontent.com/expo/expo/sdk-54/docs/pages/versions/v54.0.0/sdk/notifications.mdx
14. https://github.com/expo/expo/pull/35245 (CALENDAR trigger iOS-only docs fix)
15. https://docs.expo.dev/versions/v54.0.0/sdk/audio/ and https://raw.githubusercontent.com/expo/expo/sdk-54/packages/expo-audio/CHANGELOG.md (1.1.1, Dec 17, 2025)
16. https://developer.android.com/about/versions/14/changes/fgs-types-required
17. https://github.com/expo/expo/pull/37446 and https://github.com/expo/expo/issues/39792 (expo-sqlite 16 KB)
18. https://docs.expo.dev/versions/v54.0.0/sdk/location/ and https://docs.expo.dev/versions/v54.0.0/sdk/magnetometer/
19. https://docs.expo.dev/develop/user-interface/splash-screen-and-app-icon/; https://github.com/expo/expo/issues/34586; https://github.com/expo/expo/issues/39695; https://github.com/expo/expo/issues/39648
20. https://github.com/Shopify/flash-list (README); https://github.com/Shopify/flash-list/issues/1966; issues #544/#842/#1207/#1377; https://shopify-flash-list.mintlify.app/troubleshooting
21. https://expo.dev/changelog/sdk-55 (Feb 25, 2026) and https://docs.expo.dev/guides/new-architecture/
22. https://github.com/mybigday/llama.rn (README); https://github.com/mybigday/llama.rn/releases (v0.12.8, Jul 28, 2026); https://raw.githubusercontent.com/mybigday/llama.rn/main/android/build.gradle
23. https://op-engineering.github.io/op-sqlite/docs/installation/; https://github.com/OP-Engineering/op-sqlite/releases (17.1.3, Jul 27, 2026); https://raw.githubusercontent.com/OP-Engineering/op-sqlite/main/android/build.gradle
24. https://github.com/asg017/sqlite-vec/pull/254

## Confidence and gaps

**Well supported (multiple primary sources fetched this session):** SDK/target/compile/min versions; Gradle 8.14.3/AGP 8.11.0/Kotlin 2.1.20/NDK r27; edge-to-edge no-opt-out at target 36; predictive back default-on at target 36 but Expo-default-off flag; 16 KB Play requirement and verification tooling; JDK 17 recommendation and JDK 25 incompatibility with Gradle 8.14; CALENDAR trigger iOS-only; exact-alarm constraints; FlashList v2 new-arch-only; SDK 54 = last legacy-arch release; llama.rn and op-sqlite passing `ANDROID_SUPPORT_FLEXIBLE_PAGE_SIZES=ON`.

**Medium confidence:** expo-audio Android lock-screen controls timeline (v54 docs document `setActiveForLockScreen` cross-platform and the 1.1.0 changelog shows heavy Android notification work in Dec 2025, but I could not pin the exact version where the Android media-session/`AudioControlsService` first shipped — an Oct 2025 GitHub discussion said it initially missed SDK 54, so it arrived via the 1.1.x patch line); the claim that the expo-audio config plugin adds `FOREGROUND_SERVICE_MEDIA_PLAYBACK` (from docs-adjacent summaries, not quoted verbatim from the v54 plugin docs); the May 31, 2026 extension end-date (Google community threads + blog, not restated on the main developer page).

**Could not verify:** whether llama.rn's default **prebuilt** Android `.so`s and op-sqlite's bundled sqlite-vec library are actually 16 KB-aligned in current releases (upstream sqlite-vec PR #254 was unmerged as of Jan 2026; no release notes mention alignment either way) — treat APK alignment verification (`check_elf_alignment.sh` / `zipalign -P 16`) as a required CI step before any Play upload; and whether any runtime (not link-time) issue exists running expo-sqlite and op-sqlite in one Android process — no reports found, but no explicit "supported" statement either, so cover it with an emulator smoke test.

---


# Report 2. Google Play publishing on a personal account (mid-2026)

## Answer

Publishing DeenDawn on a personal Google Play account in mid-2026 means: target API 36 (Expo SDK 54 already does), run a closed test with 12 opted-in testers for 14 consecutive days before you can even apply for production, declare "No data collected" on the Data safety form (on-device location is explicitly not "collection"), declare non-trader for the EU DSA (which keeps the home address off the listing — only legal name, country, and developer email are public for a non-monetizing personal account), and submit an .aab via `eas submit` with a Google Cloud service-account JSON. Full findings below, numbered per the brief.

---

## 1. Target API level policy (July/August 2026)

- **Deadline passed (Aug 31, 2025):** new apps and updates had to target Android 15 (API 35). **Deadline upcoming (Aug 31, 2026):** new apps and app updates must target **Android 16 (API 36)** or higher. Extension requestable to **Nov 1, 2026**. ([Play Console Help — Target API level requirements](https://support.google.com/googleplay/android-developer/answer/11926878?hl=en), [Android Developers](https://developer.android.com/google/play/requirements/target-sdk))
- Existing (non-updated) apps must target ≥ API 35 or they "stop being available to all new users whose devices run Android OS versions higher than" the app's target level.
- Exceptions: Wear OS / Android Automotive → API 35; Android TV / XR → API 34.
- **DeenDawn impact: none.** Expo SDK 54 / RN 0.81 sets `compileSdkVersion 36` / `targetSdkVersion 36` by default ([Expo SDK 54 changelog](https://expo.dev/changelog/sdk-54)), so you meet the strictest 2026 requirement out of the box. Practical note: if your first production rollout slips past Aug 31, 2026, nothing changes for you — you're already at 36.

## 2. Personal-account closed-testing requirement (the 12-testers rule)

Official page: [App testing requirements for new personal developer accounts](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en).

- **Still applies in 2026.** Applies to **personal accounts created after November 13, 2023** ("Developers with personal accounts created after 13 November 2023 will need to test their apps before those apps are eligible to be published"). Organization accounts are not subject to it. The threshold was reduced from 20 to 12 testers in Dec 2024 (reduction date via unofficial sources: [PrimeTestLab](https://primetestlab.com/blog/google-play-changed-20-to-12-testers), [testfi](https://www.testfi.app/blog/google-play-closed-testing-requirement-explained)).
- **Exact rule:** at least **"12 testers who have been opted-in for at least the last 14 days continuously"** on a **closed testing** track.
- **"Continuous" is measured per tester and is strict:** official wording — "we won't count testers who opted in, tested for less than 14 days, and then opted out. Even if they opt back in so that they are opted in for a total of 14 days, these 14 days must be consecutive." So a tester opting out **resets that tester's clock**; you need 12 testers whose individual unbroken opt-in windows all cover the last 14 days.
- **What counts as a tester:** a Google account that accepted the closed-test invite (opted in via the opt-in link) and installed the app; invited-but-not-joined does not count ([Play community guide](https://support.google.com/googleplay/android-developer/community-guide/255621488/everything-about-the-12-testers-requirement?hl=en), unofficial summaries).
- **Applying afterwards:** Play Console **Dashboard → "Apply for production"**, a 3-section form: (1) about your closed test (how you recruited, tester engagement, feedback summary), (2) about your app (audience, value, projected first-year installs), (3) production readiness (what you changed from feedback). Review "usually takes 7 days or less, but may occasionally take longer." Rejection reasons Google names: fewer than 12 opted-in testers at review time, or insufficient tester engagement.
- **Practical tips** (mix of official tips + community consensus — marked unofficial where so): recruit **15–20 testers** as buffer so drop-outs don't break the floor (unofficial, widely advised); tell testers explicitly to stay opted in and keep the app installed for the whole period **and through the review window**; have them actually open and use the app several times (Google checks "engagement," not just enrollment); write real, specific answers in the application (generic answers are a reported rejection cause — unofficial); keep the closed test running while the application is reviewed. For DeenDawn: friends/family with Android phones + the emulator won't help — testers must be real opted-in Google accounts.

## 3. Data safety form for a zero-collection app

Official page: [Provide information for Google Play's Data safety section](https://support.google.com/googleplay/android-developer/answer/10787469?hl=en).

- **Definition:** "Collect" = "transmitting data from your app off a user's device." **On-device-only use is explicitly not collection:** "User data accessed by your app that is only processed locally on the user's device and not sent off device does **not** need to be disclosed." → **DeenDawn's on-device location for prayer times/qibla is NOT "collected"** and is not declared.
- **How to answer:** "Does your app collect or share any of the required user data types?" → **No**. Result: the listing shows **"No data collected"**. You must still complete the whole form — "Even developers with apps that do not collect any user data must complete this form and provide a link to their privacy policy." Privacy policy URL is **mandatory for all apps**.
- **Streaming audio / IP addresses in CDN logs:** Google does not blanket-exempt IPs — "you should disclose your collection, use and sharing of IP addresses based on their particular usage and practices." However, the **ephemeral** standard applies: data "accessed and used while the data is only stored in memory and retained for no longer than necessary to service the specific request in real-time" must be included in your form answers but "will **not** be disclosed in your app's Data safety section." Practical reading (my assessment, consistent with industry practice): ordinary HTTPS range requests to your own R2 bucket, where you don't use or retain request logs to identify users, do not require declaring a collected data type; the listing stays "No data collected." To be airtight: don't enable/retain identifying access logs on the R2 bucket, and mention transient CDN processing in the privacy policy. The exact treatment of infrastructure logs is the one genuinely gray area — flagged in Confidence below.
- Other sections when you answer "No" collection: the security-practices questions (encryption, deletion) collapse away; you just confirm and submit.

## 4. EU DSA trader / non-trader declaration and public info

- **Everyone must declare** trader or non-trader status to keep distributing in the EU (DSA, in force Feb 17, 2024; enforcement for app updates/new apps from Feb 17, 2025 — dates via [webtonative](https://www.webtonative.com/blog/eu-digital-services-act-compliance-ios-app) and [makaka.org 2026 tutorial](https://makaka.org/unity-tutorials/trader-status), unofficial). With zero monetization and no professional app income, **declaring non-trader is truthful and correct** for Zohaib. The declaration lives in Play Console under account/app compliance details; I could not locate a single dedicated Play Console Help article for it this session (see gaps).
- **What non-trader does:** no trader verification of address/phone, and none of the trader contact details (address, phone, email) are added to the listing. EU users instead see a notice that consumer-protection rights don't apply — Google's own wording for the parallel Chrome Web Store program: "consumers will be informed that consumer rights stemming from consumer protection laws do not apply to any contracts between the developer and the consumer" ([Google — Trader/Non-Trader disclosure](https://developer.chrome.com/docs/webstore/program-policies/trader-disclosure)). Exact Play-listing notice text: not verified this session.
- **What IS public for a personal, non-merchant account** ([Required information to create a Play Console developer account](https://support.google.com/googleplay/android-developer/answer/13628312?hl=en)): Google displays **"your legal name, your country (as per your legal address), and developer email address on Google Play."** Contact email and contact phone are NOT shown (Google-only). **Full home address is shown only if you monetize:** "If you decide to monetize on Google Play then Google will display your full address." → **Zero monetization + non-trader = no public home address in 2026.** This confirms the CLAUDE.md posture: legal name and a developer email are public; keep the developer email a dedicated address, not a personal one.

## 5. Store listing requirements 2026

Assets ([Add preview assets](https://support.google.com/googleplay/android-developer/answer/9866151?hl=en)):
- **App icon (required):** 512×512, 32-bit PNG with alpha, ≤1024 KB, per Play icon design spec.
- **Feature graphic (required):** 1024×500, JPEG or 24-bit PNG (no alpha).
- **Phone screenshots:** minimum **2** to publish; each JPEG/24-bit PNG, min dimension 320px, max 3840px, max dimension ≤ 2× min. For **promotion/featuring eligibility**: at least **4** screenshots at ≥1080px in 16:9 (landscape, min 1920×1080) or 9:16 (portrait).
- **7-inch and 10-inch tablet screenshots:** upload slots exist; needed (min 4, up to 7680px, 16:9 or 9:16) for large-screen listing quality and featuring. The help page frames the 4-screenshot large-screen set as a promotion/quality requirement rather than a hard publish blocker; in practice you can publish with phone screenshots only (assessment — Console enforces the minimum-2 rule).
- **Video:** optional YouTube URL, public/unlisted, ads disabled.

Declarations (all under Play Console → App content):
- **Privacy policy URL:** required for every app (see §3).
- **Content rating (IARC):** mandatory questionnaire before publishing; pick a category (for DeenDawn: Reference/Utility-type app, not a game), answer content questions (violence, sexuality, language, gambling, user interaction, etc.). No special question or category for religious content on the official page. A Quran/prayer app with no user-generated content should rate Everyone / PEGI 3 (expectation, not an official guarantee). ([Content ratings](https://support.google.com/googleplay/android-developer/answer/9859655?hl=en))
- **Ads declaration:** answer **No** — no "Contains ads" label. ([Ads policy](https://support.google.com/googleplay/android-developer/answer/9857753?hl=en))
- **App access:** since nothing in DeenDawn is behind login, declare that all functionality is available without special access; the credentials requirement only applies "If your entire app or parts of your app are restricted based on login credentials… memberships, location, or other forms of authentication." Because prayer times are location-dependent, optionally use the instructions field to tell reviewers the manual-city path works without granting location. ([Prepare your app for review](https://support.google.com/googleplay/android-developer/answer/9859455?hl=en))
- **Financial features declaration — required for ALL apps:** "Even developers with apps that do not offer any financial features must complete this form." The zakat **calculator** (user-entered numbers, no products/transactions) does not match any listed financial feature (loans, payments, trading, insurance, etc.) → select **"My app doesn't provide any financial features."** ([Financial features declaration](https://support.google.com/googleplay/android-developer/answer/13849271?hl=en-GB))
- **Advertising ID declaration:** the App content section also asks whether the app uses advertising ID; with no ad/analytics SDKs, declare No — but first check the merged AndroidManifest for `com.google.android.gms.permission.AD_ID` (some transitive libs add it; a mismatch between manifest and declaration causes rejections). (Existence of this form verified only via community threads this session — treat as near-certain but check in Console.)
- **Exact alarms:** ([Permissions and APIs that Access Sensitive Information](https://support.google.com/googleplay/android-developer/answer/16558241)) — `USE_EXACT_ALARM` is **policy-restricted**: only "an alarm or timer app" or "a calendar app that shows event notifications" may declare it, and it requires a **Play Console declaration** of core functionality. `SCHEDULE_EXACT_ALARM` is the broader, **user-granted** alternative with no restricted-permission declaration form. **Recommendation for DeenDawn:** ship with `SCHEDULE_EXACT_ALARM` only (prompt the user to enable "Alarms & reminders" for adhan precision) and make sure `USE_EXACT_ALARM` is NOT in the merged manifest — claiming DeenDawn is "an alarm app" is arguable but risks a policy flag on a brand-new personal account. Also verify what expo-notifications injects into the manifest.
- **Location:** foreground/when-in-use `ACCESS_FINE_LOCATION` needs **no** Play Console declaration form; only **background** location triggers the sensitive-permission declaration (and video requirement). DeenDawn uses when-in-use only → nothing to file.
- **Religious apps:** no dedicated policy area or declaration. Relevant general policies are hate speech and sensitive events, which a devotional app doesn't touch (assessment). No equivalent of Apple's 4.3 spam concern was found for this category on Play.
- **One extra 2024+ personal-account requirement found:** new personal accounts must **verify access to a real Android device** via the Play Console mobile app (non-rooted, Android 10+) before publishing. ([Play Console Help — device verification](https://support.google.com/googleplay/android-developer/answer/14316361?hl=en))

## 6. Pre-launch report

Official page: [About pre-launch reports](https://support.google.com/googleplay/android-developer/answer/9842757?hl=en).

- Generated **automatically** when you upload an app bundle to a testing track (and when saving a production release), device-lab capacity permitting. An automated **robo crawler** installs the app on real test-lab devices (phones, tablets, Wear, Chromebooks) and "automatically launch[es] and crawl[s] your app for several minutes," doing "basic actions such as typing, tapping, and swiping."
- Reports: **stability (crashes/ANRs), Android compatibility, performance, accessibility**, plus screenshots and stack traces. It issues "a launch recommendation" — **advisory, not blocking** (the page describes no blocking behavior).
- **No accounts = no setup needed.** The credentials feature exists only for apps with login; DeenDawn skips it. The crawler will hit your permission dialogs (location, notifications) and may deny/grant arbitrarily — your manual-city and permission-denied paths should not crash (they're already tested).
- **No documented opt-out** — the help page contains no disable option. Treat it as unavoidable and useful: fix any crash it finds before applying for production, since low stability can feed the "production readiness" review. Privacy note: the crawler's traffic comes from Google's lab; since the app transmits nothing, there's no data-safety implication; it may stream a few seconds of audio from R2, which is fine.

## 7. AAB / Play App Signing + EAS build & submit

- **New apps must upload an .aab** (Expo docs: "New apps must submit as **.aab** (not .apk)"), and at first release you configure **Play App Signing** — choose the **Google-generated app signing key** (default, recommended); EAS creates and manages your **upload keystore** automatically. ([Expo — submit to Google Play](https://docs.expo.dev/submit/android/), [Play Console Help — Play App Signing](https://support.google.com/googleplay/android-developer/answer/9859152?hl=en))
- `eas build --platform android --profile production` produces the .aab (production profile defaults to app-bundle; only `android.buildType: "apk"` profiles make APKs).
- `eas submit --platform android` (or `eas build -p android --auto-submit`) uploads it; the **default submit profile targets the internal testing track**, and per current Expo docs the first submission "works out of the box" — but the release sits **in draft until you complete the store listing and setup tasks** in Play Console. Change tracks/`releaseStatus` in the `submit` profile of `eas.json`. For the 12-tester phase you'll want `"track": "internal"` first, then promote (or submit) to a **closed** track.

**Click-by-click: create the Google service account key (for Zohaib or to be done by the agent where possible)** — from Expo's official guide ([expo/fyi — creating-google-service-account.md](https://github.com/expo/fyi/blob/main/creating-google-service-account.md)):
1. Go to **console.cloud.google.com** in a browser, signed in with the same Google account as Play Console. Click **Create Project**, name it (e.g. "deendawn-play"), click **Create**.
2. In the left menu choose **IAM & Admin → Service Accounts**, click **Create Service Account**. Name it something memorable (e.g. "deendawn-eas-submit"), click **Create and continue**, then **Done** (no roles needed here).
3. On the Service Accounts list, **copy the service account's email address** (looks like `deendawn-eas-submit@…iam.gserviceaccount.com`) — you'll paste it into Play Console in step 6.
4. Still on that row, click the three-dots **⋮ → Manage keys → Add key → Create new key → JSON → Create**. A `.json` file downloads. **Keep this file secret** — move it somewhere safe outside the git repo (it is a password to your Play account).
5. Open **https://console.cloud.google.com/apis/library/androidpublisher.googleapis.com**, make sure your new project is selected at the top, click **Enable** (this turns on the "Google Play Android Developer API").
6. Go to **play.google.com/console → Users and permissions → Invite new users**. Paste the service-account email from step 3.
7. On the **App permissions** tab, select the DeenDawn app. Under account/app permissions grant: **View app information (read-only)**; **Edit and delete draft apps**; **Release to production, exclude devices, and use Play App Signing**; **Release apps to testing tracks**; **Manage testing tracks and edit tester lists**; **Manage store presence**. Click **Invite user → Send invitation**.
8. Back in the terminal: run `eas submit --platform android` once — it will ask for the path to the JSON key and upload it to EAS servers (or pre-set it: EAS dashboard → project → Credentials → Android → Service Credentials, or `eas credentials --platform android`). After that it's stored; future submits don't ask.
9. Note: the **app record itself** (name "Deen Dawn", package name, free/paid = Free — irreversible) must be created once by clicking **Create app** in Play Console; do this before the first submit so the upload has somewhere to land (first upload can also be done manually via Play Console if `eas submit` complains).

---

## Confidence and gaps

- **Well supported (official Google/Expo pages fetched this session):** API 35/36 deadlines and Nov 1, 2026 extension; 12-testers/14-continuous-days wording, application sections, 7-day review; data-safety "collect" definition and on-device exemption; privacy-policy-for-all-apps; personal-account public info (legal name, country, developer email; address only if monetizing); asset pixel specs; financial-features declaration for all apps; USE_EXACT_ALARM restriction + declaration vs SCHEDULE_EXACT_ALARM; foreground location needing no form; pre-launch report mechanics and absence of an opt-out; EAS service-account steps and AAB requirement; Expo SDK 54 targeting API 36; device-verification requirement for new personal accounts.
- **Thin / unofficial:** the 20→12 reduction date (Dec 11, 2024) and DSA enforcement date (Feb 17, 2025) come from reputable but unofficial blogs; "testers must remain opted in through review" is community consensus beyond the official "at least the last 14 days" wording.
- **Could not verify:** a dedicated Play Console Help article for the DSA trader declaration (the flow exists in Console under account details; the exact non-trader notice text shown on EU Play listings is inferred from Google's Chrome Web Store equivalent); exact IARC questionnaire questions; whether Play treats retained CDN access logs as "collection" (recommendation: keep R2 logs off/anonymous); the advertising-ID declaration page (existence confirmed only via community threads).

## Sources

1. https://support.google.com/googleplay/android-developer/answer/11926878?hl=en (Target API level requirements)
2. https://developer.android.com/google/play/requirements/target-sdk
3. https://support.google.com/googleplay/android-developer/answer/14151465?hl=en (App testing requirements, personal accounts)
4. https://support.google.com/googleplay/android-developer/community-guide/255621488/everything-about-the-12-testers-requirement?hl=en
5. https://www.testfi.app/blog/google-play-closed-testing-requirement-explained (unofficial)
6. https://primetestlab.com/blog/google-play-changed-20-to-12-testers (unofficial)
7. https://support.google.com/googleplay/android-developer/answer/10787469?hl=en (Data safety)
8. https://support.google.com/googleplay/android-developer/answer/13628312?hl=en (Required account info / public display)
9. https://developer.chrome.com/docs/webstore/program-policies/trader-disclosure (Google trader/non-trader disclosure wording)
10. https://makaka.org/unity-tutorials/trader-status (unofficial, 2026)
11. https://www.webtonative.com/blog/eu-digital-services-act-compliance-ios-app (unofficial, 2026)
12. https://support.google.com/googleplay/android-developer/answer/9866151?hl=en (Preview assets)
13. https://support.google.com/googleplay/android-developer/answer/9859655?hl=en (Content ratings / IARC)
14. https://support.google.com/googleplay/android-developer/answer/9857753?hl=en (Ads policy)
15. https://support.google.com/googleplay/android-developer/answer/9859455?hl=en (Prepare your app for review / app access)
16. https://support.google.com/googleplay/android-developer/answer/13849271?hl=en-GB (Financial features declaration)
17. https://support.google.com/googleplay/android-developer/answer/16558241 (Sensitive permissions incl. exact alarms, location)
18. https://support.google.com/googleplay/android-developer/answer/9842757?hl=en (Pre-launch reports)
19. https://support.google.com/googleplay/android-developer/answer/9859152?hl=en (Play App Signing)
20. https://support.google.com/googleplay/android-developer/answer/14316361?hl=en (Device verification for new personal accounts)
21. https://docs.expo.dev/submit/android/ (EAS submit, Android)
22. https://github.com/expo/fyi/blob/main/creating-google-service-account.md (service account guide)
23. https://expo.dev/changelog/sdk-54 (SDK 54 targets API 36)

---

## Personal-account publish checklist (in order)

1. **Account prereqs:** Play Console personal account verified (identity + payment profile); complete the **Android device verification** in the Play Console mobile app; confirm developer email shown publicly is a dedicated address; confirm legal name on the payments profile is what Zohaib accepts being public.
2. **Create the app record** in Play Console: name "Deen Dawn", default language, App (not game), **Free** (irreversible), accept declarations.
3. **Build config sanity:** targetSdk 36 (Expo SDK 54 default — OK); merged manifest has `SCHEDULE_EXACT_ALARM` but **not** `USE_EXACT_ALARM` and **not** `AD_ID`; no background-location permission.
4. **Service account:** Google Cloud project → service account → JSON key → enable Android Publisher API → invite in Play Console with release permissions → store key with EAS (`eas credentials -p android`).
5. **First build + upload:** `eas build -p android --profile production` (.aab) → `eas submit -p android` to the **internal** track; Play App Signing enrolls with a Google-generated key at first release.
6. **App content declarations (all before any review):** privacy policy URL; Data safety → "No" collection/sharing → listing shows "No data collected"; Ads → No; App access → all functionality available without restrictions (+ note the manual-city path); Content rating (IARC) questionnaire; Target audience (13+/18+ selection avoids Families policy overhead); Financial features → "My app doesn't provide any financial features"; Advertising ID → not used; **EU DSA trader status → non-trader**.
7. **Store listing:** icon 512×512 PNG, feature graphic 1024×500, ≥4 phone screenshots at ≥1080px (9:16), 7"/10" tablet sets (≥4, reuse tablet-sized captures), short + full description.
8. **Closed test:** create a closed track, upload/promote the build, add a tester email list, send the opt-in link, get **15–20 people opted in and installed** (buffer above 12); tell them: stay opted in, keep it installed, open the app a few times a week.
9. **Wait 14 continuous days** — verify the tester count never dips below 12 (a tester who opts out resets their own 14-day clock); fix anything the **pre-launch report** flags (crashes especially).
10. **Apply for production** (Dashboard → Apply for production): specific, honest answers in all 3 sections; keep the closed test running during the ~7-day review.
11. **After approval:** create the production release (promote the tested build), complete rollout — GATE: actual production submission is Zohaib's click per the constitution.
12. **Post-launch hygiene:** keep R2 access logs off/anonymized to protect the "No data collected" declaration; any future update after Aug 31, 2026 must stay on target API 36+ (already true).

---


# Report 3. Reliable adhan notifications on Android

# BRIEF 3 Report — Reliable adhan notifications on Android (mid-2026)

## Answer

expo-notifications on Android already schedules via `AlarmManagerCompat.setExactAndAllowWhileIdle` — but only if the app holds the exact-alarm permission, which expo-notifications does **not** declare; without it, it silently falls back to inexact `setAndAllowWhileIdle` (verified in SDK 54 source). The correct posture for DeenDawn: declare `SCHEDULE_EXACT_ALARM` (user-grantable, no Play declaration form) rather than `USE_EXACT_ALARM` (Play-restricted to "alarm/timer or calendar" apps — a prayer app's eligibility is unproven and risky), prompt via the system "Alarms & reminders" screen, keep the 7-day rolling scheduler (Android's only cap is 500 pending alarms per app, so you are at <10% of it), use channel-per-sound channel IDs for the fixed sound set, and defer full-adhan background playback to a foreground-service phase modeled on the open-source Al-Azan app. Note that notifee was archived by Invertase in April 2026; its recommended successor is `react-native-notify-kit`.

## 1. Exact alarms: OS behavior, Play policy, and the Expo reality

**OS timeline (verified against official docs):**
- **Android 12 (API 31):** `SCHEDULE_EXACT_ALARM` introduced; required for `setExact()`, `setExactAndAllowWhileIdle()`, `setAlarmClock()` (they throw `SecurityException` without it). Auto-granted on install on 12/13; user-revocable anytime via Settings → Apps → Special app access → **Alarms & reminders**. [developer.android.com/develop/background-work/services/alarms](https://developer.android.com/develop/background-work/services/alarms)
- **Android 13 (API 33):** `USE_EXACT_ALARM` added — a *normal* permission, granted at install, **not revocable by the user**, but restricted by Play policy (below). [developer.android.com/develop/background-work/services/alarms](https://developer.android.com/develop/background-work/services/alarms)
- **Android 14:** `SCHEDULE_EXACT_ALARM` is **denied by default** for newly installed apps targeting API 33+ (also denied after backup-and-restore transfer to a new device). Apps must check `alarmManager.canScheduleExactAlarms()` and send the user to settings with `Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM`. If the user revokes it, **the app is stopped and all its exact alarms are cancelled**; you must listen for `ACTION_SCHEDULE_EXACT_ALARM_PERMISSION_STATE_CHANGED` and reschedule. Exempt: calendar/alarm-clock apps (USE_EXACT_ALARM holders) and apps on the battery-optimization allowlist. [developer.android.com/about/versions/14/changes/schedule-exact-alarms](https://developer.android.com/about/versions/14/changes/schedule-exact-alarms)
- **Android 15 and 16:** no further exact-alarm behavior changes in the official behavior-changes lists (verified: the Android 15 page has none; Android 16's alarm-adjacent change is that apps targeting API 36 must explicitly request `USE_FULL_SCREEN_INTENT` for full-screen intents — only relevant if you ever build an alarm-style full-screen adhan UI). [developer.android.com/about/versions/15/behavior-changes-15](https://developer.android.com/about/versions/15/behavior-changes-15), [developer.android.com/about/versions/16/behavior-changes-16](https://developer.android.com/about/versions/16/behavior-changes-16)
- Target-SDK context: new apps/updates must target **API 35 now**, and **API 36 by Aug 31, 2026** — so the Android 14/15/16 behavior changes all apply to DeenDawn's release. [support.google.com/googleplay/android-developer/answer/11926878](https://support.google.com/googleplay/android-developer/answer/11926878)

**Play policy on USE_EXACT_ALARM:** Only two acceptable app types: "The app is an alarm or timer app" or "a calendar app that shows event notifications." Declaration happens via a Play Console form ("Complete Play Console declaration to indicate app functionality"); apps failing the criteria "will be disallowed from publishing on Google Play." A prayer-times app is **not explicitly listed**; whether Play review accepts "adhan alarm = alarm app" is undocumented and I found no verified acceptance/rejection precedent for prayer apps. Notably, **Al-Azan (the leading open-source RN prayer app) uses `SCHEDULE_EXACT_ALARM`, not `USE_EXACT_ALARM`** (verified in its manifest). Treat USE_EXACT_ALARM as a risk, not an entitlement. [support.google.com/googleplay/android-developer/answer/13161072](https://support.google.com/googleplay/android-developer/answer/13161072), [Al-Azan manifest](https://github.com/meypod/al-azan/blob/main/android/app/src/main/AndroidManifest.xml)

**What expo-notifications actually does on Android (verified in SDK 54 source, `ExpoSchedulingDelegate.kt`):**

```kotlin
if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S || alarmManager.canScheduleExactAlarms()) {
  AlarmManagerCompat.setExactAndAllowWhileIdle(...)
} else {
  AlarmManagerCompat.setAndAllowWhileIdle(...)   // inexact fallback
}
```

- It is **AlarmManager, not WorkManager** — one alarm per scheduled notification, persisted in SharedPreferences and rescheduled by its `NotificationsService` broadcast receiver on `BOOT_COMPLETED`/package-replaced (verified in the module's AndroidManifest, which declares only `RECEIVE_BOOT_COMPLETED` and `POST_NOTIFICATIONS`). [github.com/expo/expo sdk-54 ExpoSchedulingDelegate.kt](https://github.com/expo/expo/blob/sdk-54/packages/expo-notifications/android/src/main/java/expo/modules/notifications/service/delegates/ExpoSchedulingDelegate.kt), [module AndroidManifest.xml](https://github.com/expo/expo/blob/sdk-54/packages/expo-notifications/android/src/main/AndroidManifest.xml)
- **The exact-alarm permission is NOT added automatically** — the Expo docs tell you to add `SCHEDULE_EXACT_ALARM` yourself (in Expo CNG: `expo.android.permissions` in app.json; USE_EXACT_ALARM could be added the same way). So today, DeenDawn's Android notifications are silently **inexact** on Android 12+ unless you add and obtain the permission. [docs.expo.dev/versions/v54.0.0/sdk/notifications](https://docs.expo.dev/versions/v54.0.0/sdk/notifications/)
- expo-notifications exposes **no JS API** for `canScheduleExactAlarms()` or the settings intent. Options: (i) ~15-line local Expo native module wrapping `canScheduleExactAlarms()`, plus `expo-intent-launcher` firing `android.settings.REQUEST_SCHEDULE_EXACT_ALARM`; (ii) `react-native-notify-kit` (notifee successor), whose notifee-inherited API surfaces exact-alarm permission state via `getNotificationSettings` and supports AlarmManager trigger types (`SET_EXACT_AND_ALLOW_WHILE_IDLE`, `SET_ALARM_CLOCK`). [notifee.app/react-native/docs/triggers](https://notifee.app/react-native/docs/triggers/)
- **notifee is archived** (Invertase archived the repo April 7, 2026; last release v9.1.8, Dec 2024). Its README recommends expo-notifications or the community fork **react-native-notify-kit** (v10.5.0, Expo CNG config plugin, foreground-service support) as a drop-in replacement. [github.com/invertase/notifee](https://github.com/invertase/notifee), [registry.npmjs.org/react-native-notify-kit](https://www.npmjs.com/package/react-native-notify-kit)
- **expo-alarm-module is dead weight**: bare-workflow only, "tested with RN 0.64 to 0.72", Android-only — not viable for SDK 54 / RN 0.81. [registry.npmjs.org/expo-alarm-module](https://www.npmjs.com/package/expo-alarm-module)

## 2. Notification channels and custom sounds

Verified from official docs ([developer.android.com/develop/ui/views/notifications/channels](https://developer.android.com/develop/ui/views/notifications/channels)):
- After a channel is created, **importance, sound, vibration, and lights are locked**; only name/description can change programmatically. Re-creating a channel with the same ID is a **no-op** (it does not reset user changes or take your new sound).
- Deleting channels works, but Settings **displays a "deleted channels" count** as spam prevention — so unbounded delete/recreate churn is user-visible.
- Recommended importance for time-sensitive alerts: `IMPORTANCE_HIGH` (sound + heads-up).
- You can read back user-modified channel settings (`getNotificationChannel`) and deep-link users to the channel's settings screen if they've muted it.

**Strategies when the user changes the adhan sound:**
- **Channel-per-sound (recommended for DeenDawn):** the sound set is small and fixed (Silent / Ping / short Clip / Full-opens-app), so create channel IDs like `adhan.fajr.ping` lazily on first use and point the notification at the right channel; delete the previously active one. Bounded churn, deterministic IDs, no version counters.
- **Versioned recreate (`adhan.fajr.v3`)** — needed only when sounds are arbitrary/user-supplied; increments the deleted-channels counter each change.
- **Bypass channels entirely** — channel is silent; the app itself plays audio from a service (Al-Azan's approach, section 5). Sound becomes fully dynamic, but requires a foreground service.

**expo-notifications channel surface (SDK 54):** `setNotificationChannelAsync` / `getNotificationChannelsAsync` / `deleteNotificationChannelAsync`, `AndroidImportance` enum, `sound` on the channel (file staged into `res/raw` by the config plugin's `sounds` array). On Android 8+, the per-notification `sound` field is ignored — the channel's sound wins. [docs.expo.dev/versions/v54.0.0/sdk/notifications](https://docs.expo.dev/versions/v54.0.0/sdk/notifications/)

## 3. Doze, App Standby, battery optimization, OEM killers

Verified from [developer.android.com/training/monitoring-device-state/doze-standby](https://developer.android.com/training/monitoring-device-state/doze-standby):
- In Doze, plain `setExact()`/`setWindow()` alarms are **deferred to maintenance windows** (which grow progressively rarer — hours apart in deep Doze).
- `setAndAllowWhileIdle()` and `setExactAndAllowWhileIdle()` **do fire in Doze**, but are rate-limited to **once per 9 minutes per app** — irrelevant for 5–6 prayer alarms/day. The inexact `setAndAllowWhileIdle` fallback still has no timing guarantee (can drift; official guidance for inexact windows is ≥10 min granularity).
- `setAlarmClock()` alarms fire on time regardless of Doze (system exits Doze beforehand) — the nuclear option; also shows an alarm-clock status icon.
- **Play policy on battery-optimization exemption:** apps may not request direct exemption (`ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS`, gated behind the `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS` permission) "unless the core function of the app is adversely affected" and it cannot use FCM high-priority messages. A serverless, no-internet adhan app genuinely cannot use FCM, so the case is defensible — and Al-Azan ships this permission on Play/F-Droid — but it is a sensitive-permission review surface. The *settings-list* intent (`ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS`), which just opens the list without pre-selecting your app, needs **no permission** and carries no policy risk.
- **OEM killers:** Samsung ("never sleeping apps", adaptive battery), Xiaomi/MIUI (Autostart + "No restrictions"), Oppo/Vivo have aggressive process killers beyond AOSP Doze; Muslim Pro maintains per-OEM support articles telling users to whitelist the app, and [dontkillmyapp.com](https://dontkillmyapp.com/xiaomi) documents per-vendor steps. **None of this is testable on the stock-AOSP emulator** — it must go into `docs/TESTPLAN.md` "Device pass (human)" and into an in-app "Adhan not playing?" troubleshooting screen (Samsung/Xiaomi steps, silent-mode/Focus caveats), mirroring [Muslim Pro's support docs](https://support.muslimpro.com/hc/en-us/articles/115001314591-The-adhan-notifications-are-not-working-Xiaomi-devices).

## 4. Android scheduling limits

- The only hard cap: **500 pending alarms per UID** — exceeding it throws `IllegalStateException: Maximum limit of concurrent alarms 500 reached for uid`, enforced on Android 12+ (and earlier on Samsung). Not in the prose docs; well-evidenced in the wild: [notifee #349](https://github.com/invertase/notifee/issues/349), [eclipse-paho #468](https://github.com/eclipse-paho/paho.mqtt.android/issues/468).
- There is **no iOS-style 64-notification cap**. Your existing 7-day window (5 prayers + pre-Fajr ≈ 42–56 alarms) is at ~10% of the limit; even 30 days (~180) would fit. Keep 7–14 days anyway — the real constraints are correctness ones: recompute on DST shifts, timezone changes, method/madhab changes, and hijri-drift for Ramadan logic. One caveat found in source: expo-notifications reschedules on **boot** but has no `TIMEZONE_CHANGED`/`TIME_SET` receiver — RTC alarms are epoch-anchored, so after a timezone change the wall-clock times are wrong until your app next reschedules (do it on every foreground, as on iOS).

## 5. Full adhan (~2–4 min) on Android

- **No OS length limit** exists for Android notification/channel sounds (the 30-second limit is iOS-only). But a long channel sound is fragile: the sound **stops when the user pulls down the notification shade or when another app's notification sounds**, plays on the notification volume stream, and offers no stop/pause control. Verified via Muslim Pro/Muslim Toolbox support docs: [support.muslimtoolbox.com — "Why can't I hear the full adhan?"](https://support.muslimtoolbox.com/en/knowledgebase/7-prayer-times/docs/17-notifications-why-i-can-t-hear-the-full-adhan), [support.muslimpro.com — full adhan article](https://support.muslimpro.com/hc/en-us/articles/200588785-The-app-is-not-playing-the-full-Adhan-iOS-Android).
- **The robust pattern is: exact alarm → foreground service (`mediaPlayback`) → app plays the adhan with a Stop action.** Starting an FGS from the background is explicitly permitted when "your app invokes an exact alarm to complete an action that the user requests" (and also when the user has disabled battery optimization). [developer.android.com/develop/background-work/services/fgs/restrictions-bg-start](https://developer.android.com/develop/background-work/services/fgs/restrictions-bg-start)
- **Verified real-world implementation — Al-Azan** (open-source React Native prayer app, F-Droid + Play): notifee-fork `ForegroundService` with `foregroundServiceType="mediaPlayback"`, plus `SCHEDULE_EXACT_ALARM`, `WAKE_LOCK`, `USE_FULL_SCREEN_INTENT`, `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS`; custom adhan audio, different audio for Fajr. [github.com/meypod/al-azan](https://github.com/meypod/al-azan), [f-droid.org listing](https://f-droid.org/en/packages/com.github.meypod.al_azan/). Muslim Pro's own docs confirm the closed-source mainstream apps have the same failure modes (full adhan guaranteed only when app is running; users told to whitelist battery settings) — I could not verify Muslim Pro/Athan/Pillars internals beyond their support pages.
- **Costs of the FGS route:** targeting Android 14+, every FGS type must be declared in the manifest AND in a Play Console declaration **with a demo video** ([support.google.com/googleplay/android-developer/answer/13392821](https://support.google.com/googleplay/android-developer/answer/13392821)); Android 15+ forbids launching a `mediaPlayback` FGS directly from `BOOT_COMPLETED` (fine — only launch from the alarm). [developer.android.com/about/versions/15/behavior-changes-15](https://developer.android.com/about/versions/15/behavior-changes-15)

## 6. Persistent "next prayer" ongoing notification

- It is an established pattern in this category — Al-Azan ships "notification widgets" (sticky prayer-times notification + countdown) — though I could not verify Athan/Pillars specifics from official sources.
- **Build it without a foreground service:** post `ongoing: true` (expo-notifications: `sticky`) on a **silent, `IMPORTANCE_LOW` channel**, and re-render it from the same AlarmManager chain that fires prayer alarms (each adhan alarm + one midnight-refresh alarm updates the content). WorkManager's 15-min periodic minimum makes it wrong for countdown text; alarm-driven "update at each prayer boundary" is exact and free.
- **Android 14+ reality:** users can now swipe away `FLAG_ONGOING_EVENT` notifications (exceptions: CallStyle, media-session, DPC); they stay only on lock screen or via "Clear all" protection — so treat the sticky notification as dismissible and re-post it at the next alarm. [developer.android.com/about/versions/14/behavior-changes-all](https://developer.android.com/about/versions/14/behavior-changes-all)
- **Play policy:** a plain ongoing notification has no policy surface. A *persistent FGS* just to keep a notification alive would need an FGS-type declaration and would likely fail review ("specialUse" scrutiny) — avoid.

## 7. Emulator testing (adb / dumpsys)

All core commands verified against official docs ([dumpsys](https://developer.android.com/tools/dumpsys), [doze-standby testing](https://developer.android.com/training/monitoring-device-state/doze-standby)); items marked (unofficial) are community-documented.

- **Inspect scheduled alarms:** `adb shell dumpsys alarm | grep -B2 -A8 com.khavion.deendawn` — shows each PendingIntent with `when=`, window, and whether it's exact ([testyour.app guide](https://testyour.app/blog/android-alarm-manager/)).
- **Doze:** `adb shell dumpsys battery unplug` → `adb shell dumpsys deviceidle force-idle` (repeat/step to reach deep idle; check `adb shell dumpsys deviceidle get deep`) → observe whether the alarm still fires → `adb shell dumpsys deviceidle unforce` and `adb shell dumpsys battery reset`.
- **App Standby:** `adb shell dumpsys battery unplug` → `adb shell am set-inactive com.khavion.deendawn true` → verify with `am get-inactive`; also `adb shell am set-standby-bucket com.khavion.deendawn restricted` to simulate the worst bucket (bucket command is standard on API 28+; medium confidence on exact output).
- **Toggle the exact-alarm grant without UI:** `adb shell appops set com.khavion.deendawn SCHEDULE_EXACT_ALARM deny` / `allow` (unofficial but widely used), or via Settings → Special app access → Alarms & reminders as the docs suggest.
- **Fire scheduled notifications faster (clock jump):** on a non-Play AOSP image: `adb root`, then `adb shell date 073018292026.50` (MMDDhhmmYYYY.ss format for toybox `date`) followed by `adb shell am broadcast -a android.intent.action.TIME_SET`. Jumping past an alarm's `when=` fires it within seconds. ([riptutorial adb date](https://riptutorial.com/android/example/16607/set-date-time-via-adb), [gist](https://gist.github.com/indiejoseph/420a41dab5559010521b2a8dd3c2931b))
- **Timezone:** `adb shell setprop persist.sys.timezone "Asia/Karachi"` (root) then restart the app — verifies your reschedule-on-foreground logic; `adb shell cmd alarm set-timezone <tz>` exists on some API levels (run `adb shell cmd alarm` to see supported subcommands on your image — medium confidence, version-dependent).
- **Channels/sound audit:** `adb shell dumpsys notification --noredact | grep -A6 "com.khavion.deendawn"` lists each `NotificationChannel` with importance and `sound=` URI (output format is version-dependent; medium confidence). Audible check: a dev-only screen that calls `scheduleNotificationAsync` with a 5-second time-interval trigger per channel.
- **Boot rescheduling:** cold-boot the emulator (`adb reboot`, or Device Manager → Cold Boot), wait for boot, then `dumpsys alarm | grep deendawn` to confirm expo-notifications re-registered everything from its store.

---

## (a) Recommended target architecture for DeenDawn Android

**Phase A — ship v1 on expo-notifications alone (no new native deps):**
1. **Keep the existing rolling 7-day scheduler** unchanged (42–56 alarms; the Android cap is 500). Reschedule on: app foreground, each notification received/response, and boot (automatic via expo-notifications). Add an explicit reschedule when device timezone ≠ last-scheduled timezone, since expo-notifications has no TIMEZONE_CHANGED receiver.
2. **Add `"android.permission.SCHEDULE_EXACT_ALARM"` to `expo.android.permissions`** in app.json. Do **not** declare `USE_EXACT_ALARM` — Play restricts it to alarm/timer/calendar apps, prayer-app eligibility is unproven, and a rejection risks the whole personal-account listing; `SCHEDULE_EXACT_ALARM` needs no Play declaration form. With the permission granted, expo-notifications automatically uses `setExactAndAllowWhileIdle`.
3. **Write a ~15-line local Expo module** (`src/features/notifications/native/exact-alarm`) exposing `canScheduleExactAlarms(): boolean`; pair it with `expo-intent-launcher` opening `android.settings.REQUEST_SCHEDULE_EXACT_ALARM`. Surface it as a plain-English "Make adhan times exact" card in notification settings/onboarding (Android 14+ denies by default). When not granted, show a gentle "times may arrive a few minutes late" caveat — the inexact fallback still fires in Doze via `setAndAllowWhileIdle`.
4. **Channels — channel-per-(prayer × sound):** stable IDs like `adhan.fajr.ping`, created lazily via `setNotificationChannelAsync` with `IMPORTANCE_HIGH` and the sound baked in (clips staged through the config plugin `sounds` array into `res/raw`); on sound change, point new notifications at the new channel ID and `deleteNotificationChannelAsync` the old one. `Silent` = separate `IMPORTANCE_LOW`, null-sound channel. Sticky next-prayer notification (optional toggle) = `ongoing/sticky: true` on a silent LOW channel, updated by the existing alarm chain plus a midnight refresh alarm — no foreground service, and treat it as user-dismissible (Android 14 behavior).
5. **Full-adhan mode v1 = short clip channel sound + tap-opens-app-plays-full-adhan** (parity with the iOS design), with an in-app caveat that Android stops notification sounds when the shade is pulled.
6. **Battery optimization:** no exemption prompt in v1 (protects the zero-sensitive-permissions posture). Ship an "Adhan not playing?" troubleshooting screen: deep-link to `ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS` (permission-free), plus Samsung/Xiaomi whitelist steps sourced from dontkillmyapp — and log these as device-only checks in `docs/TESTPLAN.md`.

**Phase B — true background full adhan (post-v1, gated decision):** adopt **`react-native-notify-kit`** (the Invertase-endorsed notifee fork, v10.5.x, Expo CNG config plugin) for its foreground-service runner: exact alarm fires → `mediaPlayback` FGS plays the full adhan with a Stop action (the Al-Azan pattern; exact-alarm firing is an explicit FGS background-start exemption). Costs to accept before starting: a new native dependency, `FOREGROUND_SERVICE` + `FOREGROUND_SERVICE_MEDIA_PLAYBACK` permissions, and a Play Console FGS declaration **with demo video**. Do not launch the FGS from BOOT_COMPLETED (Android 15 ban).

**Explicitly rejected:** `expo-alarm-module` (RN 0.64–0.72 era, bare-only), `@notifee/react-native` direct (archived April 2026), WorkManager for prayer timing (15-min minimum, Doze-deferred), `setAlarmClock()` everywhere (status-bar alarm icon + battery cost; revisit only if field reports show `setExactAndAllowWhileIdle` misses).

## (b) Concrete emulator test plan

Run on the API 35 arm64 AOSP image (adb root works; repeat smoke pass on API 36).

```bash
# 0. Baseline: install release build, complete onboarding, enable all 5 prayers + pre-Fajr
adb shell dumpsys alarm | grep -B2 -A8 com.khavion.deendawn   # EXPECT: ~1 alarm per pending notification, exact

# 1. Exact-permission matrix (Android 14+ denies by default)
adb shell appops set com.khavion.deendawn SCHEDULE_EXACT_ALARM deny
#   relaunch app -> EXPECT: "Make adhan times exact" card visible; dumpsys alarm shows inexact windows
adb shell appops set com.khavion.deendawn SCHEDULE_EXACT_ALARM allow
#   foreground the app -> EXPECT: card gone; alarms re-registered exact

# 2. Fire notifications fast via clock jump (root, AOSP image)
adb root
adb shell dumpsys alarm | grep -A4 deendawn      # note next 'when='
adb shell "date 073018292026.50; am broadcast -a android.intent.action.TIME_SET"   # jump to 1 min before Maghrib
#   EXPECT: adhan notification fires at the right minute, correct channel sound audible in emulator audio

# 3. Doze pass
adb shell dumpsys battery unplug
adb shell dumpsys deviceidle force-idle
adb shell dumpsys deviceidle get deep            # EXPECT: IDLE
#   clock-jump past the next prayer time (step 2 technique)
#   EXPECT: notification still fires (setExactAndAllowWhileIdle); repeat with permission denied -> may be delayed
adb shell dumpsys deviceidle unforce && adb shell dumpsys battery reset

# 4. App Standby pass
adb shell dumpsys battery unplug
adb shell am set-inactive com.khavion.deendawn true
adb shell am get-inactive com.khavion.deendawn   # EXPECT: Idle=true
#   jump clock -> EXPECT: alarm still fires; then:
adb shell am set-standby-bucket com.khavion.deendawn restricted   # worst bucket, repeat check
adb shell dumpsys battery reset

# 5. Reboot / rescheduling
adb reboot   # (or Cold Boot from Device Manager)
adb shell dumpsys alarm | grep -A4 deendawn      # EXPECT: full alarm set re-registered without opening the app

# 6. Timezone + DST correctness
adb shell setprop persist.sys.timezone "Europe/London"
#   open app -> EXPECT: reschedule runs; dumpsys alarm 'when=' values match London prayer times
#   repeat across a DST boundary date via the step-2 clock jump; compare to Jest fixtures

# 7. Channel audit (after changing each prayer's sound in settings)
adb shell dumpsys notification --noredact | grep -A6 deendawn
#   EXPECT: only active channel IDs present (adhan.fajr.ping etc.), correct sound= URI, old channels deleted

# 8. Sticky next-prayer notification
#   enable toggle -> EXPECT: ongoing, silent, LOW-importance notification; swipe it away (allowed on 14+),
#   jump clock past next prayer -> EXPECT: it re-posts with updated prayer

# 9. Document as DEVICE-ONLY (not emulator-testable) in docs/TESTPLAN.md:
#   OEM killers (Samsung sleeping apps, MIUI autostart), real silent-mode/Focus behavior,
#   real Doze timing over hours, lock-screen presentation on OEM skins, actual speaker audio routing
```

## Sources

1. https://developer.android.com/about/versions/14/changes/schedule-exact-alarms (accessed 2026-07-30)
2. https://developer.android.com/develop/background-work/services/alarms
3. https://support.google.com/googleplay/android-developer/answer/13161072 (Play exact-alarm policy)
4. https://support.google.com/googleplay/android-developer/answer/11926878 (target API deadlines)
5. https://github.com/expo/expo — sdk-54 branch, `packages/expo-notifications/.../ExpoSchedulingDelegate.kt` and module `AndroidManifest.xml`
6. https://docs.expo.dev/versions/v54.0.0/sdk/notifications/
7. https://developer.android.com/develop/ui/views/notifications/channels
8. https://developer.android.com/training/monitoring-device-state/doze-standby
9. https://developer.android.com/develop/background-work/services/fgs/restrictions-bg-start
10. https://developer.android.com/about/versions/15/behavior-changes-15
11. https://developer.android.com/about/versions/14/behavior-changes-all
12. https://support.google.com/googleplay/android-developer/answer/13392821 (FGS Play declaration)
13. https://github.com/meypod/al-azan + raw manifest + https://f-droid.org/en/packages/com.github.meypod.al_azan/
14. https://github.com/invertase/notifee (archived 2026-04-07); https://notifee.app/react-native/docs/triggers/
15. https://www.npmjs.com/package/react-native-notify-kit (v10.5.0); https://registry.npmjs.org/expo-alarm-module
16. https://github.com/invertase/notifee/issues/349 ; https://github.com/eclipse-paho/paho.mqtt.android/issues/468 (500-alarm cap)
17. https://support.muslimtoolbox.com/en/knowledgebase/7-prayer-times/docs/17-notifications-why-i-can-t-hear-the-full-adhan ; https://support.muslimpro.com/hc/en-us/articles/115001314591 (OEM whitelisting)
18. https://dontkillmyapp.com/xiaomi
19. https://testyour.app/blog/android-alarm-manager/ ; https://riptutorial.com/android/example/16607/set-date-time-via-adb ; https://gist.github.com/indiejoseph/420a41dab5559010521b2a8dd3c2931b ; https://developer.android.com/tools/dumpsys

## Confidence and gaps

**Well supported (primary sources, cross-checked):** expo-notifications' exact/inexact AlarmManager behavior and missing manifest permission (read directly from sdk-54 source); Android 12→14 exact-alarm permission mechanics; USE_EXACT_ALARM Play policy wording; channel immutability/deletion mechanics; Doze while-idle 9-minute rule and adb Doze/Standby commands; FGS background-start exemption for exact alarms; FGS Play declaration + video requirement; notifee archived with notify-kit as endorsed successor; Al-Azan's full permission/FGS architecture; 500-alarm cap (multiple independent bug reports; not in prose docs).

**Medium confidence:** `appops set ... SCHEDULE_EXACT_ALARM`, `am set-standby-bucket`, `cmd alarm set-timezone`, and `dumpsys notification --noredact` output details — community-documented and version-dependent; verify each against `adb shell cmd alarm` / actual output on the API 35/36 images before writing them into TESTPLAN.md. Android 16 full-screen-intent change summarized from secondary coverage of the official page.

**Could not verify:** whether Google Play accepts prayer-time apps for `USE_EXACT_ALARM` (no documented precedent either way — this is why the recommendation avoids it); internal Android implementations of Muslim Pro / Athan / Pillars (closed source; only their support-doc behavior is verified); expo-notifications' behavior on OEM-modified Android (emulator is stock AOSP by definition — device-pass item).

---


# Report 4. Android emulator testing — capabilities, cookbook, matrix, Maestro

## Answer

Everything in this brief is doable on your current emulator setup except true sensor/GPS physics, real-Doze timing, and performance truth. Key confirmed facts: Expo SDK 54 / RN 0.81 has **minSdk 24, target/compile 36** — so your API 24 AVD is not obsolete, it is exactly the support floor. Local scheduled notifications fire normally on Android emulators (full AlarmManager/NotificationManager stack; even remote push works on Google-Play-services images per Expo's own docs — the "use a physical device" folklore is about push tokens and Doze timing, not local notifications). The emulator console (`adb emu ...`) can inject magnetometer values and GPS fixes; the Extended Controls "Virtual sensors" pose sliders are the right way to drive a compass because they produce *consistent* accelerometer+magnetometer pairs. Maestro drives Android emulators over adb, grants all permissions by default on `launchApp` (a big difference from iOS), and one YAML set can serve both platforms via `runFlow: when: platform:` conditionals plus `testID`-based `id` selectors.

## Findings

### 1. Sensor and location simulation

**Console access:** `telnet localhost 5554` then `auth <token>` (token in `~/.emulator_console_auth_token`), or skip telnet entirely with fire-and-forget `adb emu <command>` (https://developer.android.com/studio/run/emulator-console).

**Sensors (verified syntax):**
- `sensor status` — list all virtual sensors; `sensor get magnetic-field`; `sensor set <name> x:y:z` (colon-separated). Documented names include `acceleration`, `magnetic-field`, `orientation` (https://developer.android.com/studio/run/emulator-console).
- Extended Controls → Virtual sensors → **Device Pose**: yaw/pitch/roll sliders (plus 0/90/180/270 presets) that emit `TYPE_ACCELEROMETER` and `TYPE_MAGNETIC_FIELD` events consistently as you rotate the virtual device; magnetometer reported in microteslas (https://developer.android.com/studio/run/emulator-extended-controls).
- **For the qibla compass:** drive yaw in Virtual sensors and verify the needle tracks continuously and settles at the expected bearing (e.g., set location to Houston via `geo fix`, expected qibla ≈ your unit-test fixture value). Raw `sensor set magnetic-field` is useful for injecting degenerate values (zero field, wild spikes) to test your "needs calibration"/low-accuracy UI branch. *Caveat (unverified, practical):* while the pose model is active it may overwrite raw `sensor set` values on the next pose update — inject with the pose panel closed, and treat console injection as a fault-injection tool, not a heading simulator.

**Location:** `geo fix <longitude> <latitude> [altitude] [satellites] [velocity]` — **longitude first**, e.g. `adb emu geo fix -95.3698 29.7604` for Houston (https://developer.android.com/studio/run/emulator-console). Extended Controls → Location gives a Google Maps picker, saved points, routes with playback speed, and GPX/KML import for movement simulation (https://developer.android.com/studio/run/emulator-extended-controls). `geo nmea` accepts raw `$GPGGA`/`$GPRCM` sentences.

**Limitations vs real device:** no real sensor noise, drift, or magnetic interference; sensor accuracy is essentially always "good," so the figure-8 calibration UX can only be tested as UI (mocked accuracy states), never end-to-end; `geo fix` has no accuracy-radius control — horizontal accuracy comes back as a fixed synthetic value, so expo-location accuracy-threshold logic needs unit tests plus device pass. True-north declination correction is pure math — unit-test it; the emulator can't validate it.

### 2. Notifications on the emulator

- **Local scheduled notifications fire on Android emulators.** The emulator runs the full framework ("provides almost all the capabilities of a real Android device" — https://developer.android.com/studio/run/emulator); channels, sounds, DND, and lock-screen presentation are all real system behavior. Expo's SDK 54 notifications docs confirm even **push** works on "Android emulators with Google Play services" (https://docs.expo.dev/versions/v54.0.0/sdk/notifications/); Firebase states FCM needs a device with Play Store "or an emulator running... with Google APIs" (https://firebase.google.com/docs/cloud-messaging/android/first-message). Blog advice that "notifications need a physical device" conflates iOS-simulator push limits and Doze-timing fidelity with basic delivery — basic delivery works.
- **Channel sounds:** emulator audio routes to host speakers by default (audio is on unless you pass `-no-audio` — https://developer.android.com/studio/run/emulator-commandline), so custom adhan channel sounds are audible on your Mac. Verify per-channel sound in Settings → Apps → Deen Dawn → Notifications on the AVD.
- **DND:** `adb shell cmd notification set_dnd [on|none|priority|alarms|all|off]` — verified in AOSP `NotificationShellCmd` (https://android.googlesource.com/platform/frameworks/base/+/refs/heads/main/services/core/java/com/android/server/notification/NotificationShellCmd.java). `settings put global zen_mode 1` is the legacy path and less reliable on Android 15+.
- **Lock-screen presentation:** post/schedule a notification, then `adb shell input keyevent KEYCODE_SLEEP`, wake with `KEYCODE_WAKEUP`, and screenshot the lock screen. Add a real keyguard with `adb shell locksettings set-pin 1234` (remove: `locksettings clear --old 1234`) to test "sensitive content hidden" states (locksettings is standard shell tooling; community-documented). You can also post synthetic notifications without your app via `cmd notification post -t "Title" -S bigtext TAG "text"` (AOSP source above).
- **Exact-alarm caveat:** Expo docs note `SCHEDULE_EXACT_ALARM` is needed for exact-time triggers on Android 12+ (https://docs.expo.dev/versions/v54.0.0/sdk/notifications/) — the grant state is toggleable via `appops` (community-verified, see cookbook) so you can test your degraded-precision path.

### 3. adb cookbook (copy-paste; `PKG` = your applicationId)

```bash
PKG=com.khavionapps.deendawn   # adjust to the real applicationId

# ---------- type & display ----------
adb shell settings put system font_scale 1.3      # 0.85 | 1.0 | 1.15 | 1.3 (2.0 max on Android 14+ nonlinear scaling)
adb shell settings put system font_scale 2.0      # max stress (API 34+ images)
adb shell settings put system font_scale 1.0      # reset
adb shell wm density 540                          # "display size" bigger; wm density reset to undo
adb shell wm size                                 # print resolution
# dark / light
adb shell cmd uimode night yes                    # force dark
adb shell cmd uimode night no                     # force light

# ---------- locale / RTL ----------
# per-app locale, API 33+ (verified against AOSP LocaleManagerShellCommand):
adb shell cmd locale set-app-locales $PKG --user current --locales ar
adb shell cmd locale set-app-locales $PKG --user current --locales ur
adb shell cmd locale get-app-locales $PKG
adb shell cmd locale set-app-locales $PKG --user current --locales ""   # reset
# force RTL mirroring regardless of language (dev-options-backed, may need app restart):
adb shell settings put global debug.force_rtl 1
adb shell settings put global debug.force_rtl 0
# device-wide locale (google_apis images only — adb root unavailable on Play images):
adb root && adb shell setprop persist.sys.locale ar-SA && adb reboot
# pseudolocales en-XA / ar-XB require pseudoLocalesEnabled=true in the debug build first

# ---------- TalkBack ----------
adb shell pm list packages | grep talkback        # present? (Play-image AVD after installing "Android Accessibility Suite" from Play Store)
adb shell settings put secure enabled_accessibility_services \
  com.google.android.marvin.talkback/com.google.android.marvin.talkback.TalkBackService
adb shell settings put secure enabled_accessibility_services ""   # off

# ---------- connectivity ----------
adb shell cmd connectivity airplane-mode enable   # Android 11+; "disable" to undo; no arg = query
adb shell svc wifi disable && adb shell svc data disable   # granular radios
adb shell svc wifi enable  && adb shell svc data enable

# ---------- Doze / App Standby (official commands) ----------
adb shell dumpsys battery unplug
adb shell dumpsys deviceidle force-idle
adb shell dumpsys deviceidle unforce
adb shell dumpsys battery reset
adb shell am set-inactive $PKG true               # App Standby on
adb shell am get-inactive $PKG

# ---------- process death & state restoration ----------
adb shell input keyevent KEYCODE_HOME             # background the app first (am kill only kills safe/background procs)
adb shell am kill $PKG                            # system-initiated death (savedInstanceState survives)
adb shell monkey -p $PKG -c android.intent.category.LAUNCHER 1   # relaunch → verify restore
adb shell am force-stop $PKG                      # harsher: also cancels alarms → verify notification rescheduler on next launch
adb shell settings put global always_finish_activities 1   # "Don't keep activities"; 0 to reset

# ---------- permissions ----------
adb shell pm grant  $PKG android.permission.ACCESS_FINE_LOCATION
adb shell pm revoke $PKG android.permission.ACCESS_FINE_LOCATION
adb shell pm revoke $PKG android.permission.POST_NOTIFICATIONS     # API 33+ runtime notif permission
adb shell appops set $PKG SCHEDULE_EXACT_ALARM deny                # test inexact-alarm fallback (community-verified)
adb shell cmd appops reset $PKG

# ---------- notifications / DND / lock screen ----------
adb shell cmd notification set_dnd on             # values: on|none|priority|alarms|all|off
adb shell cmd notification set_dnd off
adb shell cmd notification post -t "Fajr" -S bigtext qa "Adhan test"   # synthetic notification
adb shell locksettings set-pin 1234               # secure lockscreen; clear: locksettings clear --old 1234
adb shell input keyevent KEYCODE_SLEEP && sleep 1 # screen off → scheduled notif → lock-screen check
adb shell input keyevent KEYCODE_WAKEUP

# ---------- E2E stability: animations off ----------
adb shell settings put global window_animation_scale 0
adb shell settings put global transition_animation_scale 0
adb shell settings put global animator_duration_scale 0

# ---------- evidence capture ----------
adb exec-out screencap -p > shot.png
adb shell screenrecord --time-limit 180 /sdcard/demo.mp4   # max 180s, NO audio; then: adb pull /sdcard/demo.mp4

# ---------- emulator console via adb (no telnet needed) ----------
adb emu geo fix -95.3698 29.7604                  # LONGITUDE first, then latitude (Houston)
adb emu sensor get magnetic-field
adb emu sensor set magnetic-field 0:35:-45
adb emu rotate                                    # 45° CCW steps
```

Sources for this section: emulator console (https://developer.android.com/studio/run/emulator-console), Doze (https://developer.android.com/training/monitoring-device-state/doze-standby), adb/screencap/screenrecord/pm (https://developer.android.com/tools/adb), `cmd uimode` (https://www.fonearena.com/blog/277716/android-q-enable-dark-mode-system-wide.html), `cmd connectivity airplane-mode` (https://www.adb-shell.com/android/connectivity.html), `cmd locale` (AOSP https://android.googlesource.com/platform/frameworks/base/+/refs/heads/main/services/core/java/com/android/server/locales/LocaleManagerShellCommand.java), `cmd notification` (AOSP NotificationShellCmd), TalkBack/font-scale/animation-scale (https://gist.github.com/mrk-han/67a98616e43f86f8482c5ee6dd3faabe, https://dev.to/robotsquidward/how-to-use-talkback-on-an-android-emulator-1f33), debug.force_rtl + pseudolocales (https://developer.android.com/guide/topics/resources/pseudolocales).

### 4. Device matrix

**minSdk verdict: API 24 AVD is NOT obsolete.** RN 0.81's template pins `minSdkVersion = 24` (verified in https://raw.githubusercontent.com/react-native-community/template/0.81-stable/template/android/build.gradle: `buildToolsVersion "36.0.0", minSdkVersion 24, compileSdkVersion 36, targetSdkVersion 36`), Expo SDK 54 runs RN 0.81 targeting Android 16/API 36 (https://expo.dev/changelog/sdk-54), and the SDK 54 template doesn't override minSdk. So API 24 = exact support floor — keep it.

**Recommended AVD set (5):**
1. **`dd-api24-lowend`** — API 24, small phone profile (e.g., Nexus 4), `hw.ramSize=1024` in config.ini: floor testing, pre-channel notifications, pre-runtime-POST_NOTIFICATIONS behavior, low-memory process death.
2. **`dd-api35-pixel`** (exists) — google_apis: main QA workhorse (adb root works → locale hacks, writable settings).
3. **`dd-api36-play`** (exists) — Play Store image: Play services push, Play pre-launch-report-like environment, and the **only** practical TalkBack host (install "Android Accessibility Suite" from Play Store; google_apis images don't ship TalkBack — https://dev.to/robotsquidward/how-to-use-talkback-on-an-android-emulator-1f33). Note: Play images are release-key signed → **no `adb root`** (https://developer.android.com/studio/run/managing-avds).
4. **`dd-tablet`** — Pixel Tablet profile, API 35/36 google_apis: large-screen/adaptive-layout checks (Android 16 expects adaptive layouts — https://reactnative.dev/blog/2025/08/12/react-native-0.81).
5. **`dd-resizable`** — the **"Resizable" device definition** with an API 34+ image; the emulator toolbar's Display Mode toggles phone/foldable(fold+unfold)/tablet/desktop in one AVD — cheaper than separate foldable AVDs (https://developer.android.com/studio/run/resizable-emulator).

**Play vs google_apis:** google_apis = root, writable system, FCM-capable (Firebase requires at least Google APIs — https://firebase.google.com/docs/cloud-messaging/android/first-message). Play image adds Play Store + release signing (no root). Keep both; do rooty QA on google_apis.

**Headless creation (verified syntax + community-verified `-d` flag, which the current official page oddly omits but the tool supports):**
```bash
sdkmanager --list | grep system-images          # confirm exact package ids you have
avdmanager list device                          # discover device ids (pixel_8, pixel_tablet, resizable_experimental, ...)
echo no | avdmanager create avd -n dd-api24-lowend \
  -k "system-images;android-24;google_apis;arm64-v8a" -d "Nexus 4" --force
echo no | avdmanager create avd -n dd-resizable \
  -k "system-images;android-35;google_apis;arm64-v8a" -d "resizable_experimental" --force
# then tune ~/.android/avd/<name>.avd/config.ini (hw.ramSize, hw.lcd.density, hw.lcd.width/height)
```
(https://developer.android.com/tools/avdmanager, https://blog.isul.net/post/how-to-make-avd-with-specific-device-from-command-line/)

### 5. Maestro on Android

- **Setup:** Maestro connects over adb and "automatically detects and connects to running emulators"; zero instrumentation, works with React Native (https://docs.maestro.dev/get-started/supported-platform/android). Boot the AVD headless for CI: `emulator @dd-api35-pixel -no-window -no-audio -no-snapshot`, wait for `getprop sys.boot_completed`, then `maestro test e2e/`.
- **Selectors:** `id:` maps to **resource-id on Android** and **accessibilityIdentifier on iOS**; `text:` includes content-desc (Android) / accessibilityLabel (iOS); both are regex-based (https://docs.maestro.dev/reference/selectors/core-selectors). For RN, best practice is `testID`, "which Maestro maps to a unique `id`" on both platforms (https://docs.maestro.dev/get-started/supported-platform/react-native) — so your existing iOS flows' `testID`-based taps should largely just work.
- **Permissions — the big platform difference:** Maestro **grants all permissions by default on `launchApp`**; override with `permissions: { all: deny, location: allow }` or mid-flow `setPermissions`. Android grants silently via the package manager (no dialogs); iOS auto-taps system prompts. Android accepts full permission IDs for anything unlisted (https://docs.maestro.dev/maestro-flows/flow-control-and-logic/permissions). Your iOS flows that tap permission dialogs need `runFlow: when: platform: iOS` guards.
- **Back button / keyboard:** Android has hardware back (`pressKey: back`) with no iOS equivalent — guard with platform conditionals; Maestro added an artificial delay after key presses on Android to fix back-button timing flakiness (https://github.com/mobile-dev-inc/maestro/blob/main/CHANGELOG.md).
- **One YAML set, both platforms:** yes — `runFlow: when: { platform: Android }` / `platform: iOS` with AND-combined conditions (https://docs.maestro.dev/maestro-flows/flow-control-and-logic/conditions). appIds differ per platform; parameterize the flow header (`appId: ${APP_ID}`, run with `maestro test -e APP_ID=...`) or keep thin per-platform wrapper flows including shared subflows.
- **Flakiness & mitigations:** built-in auto-wait/retry removes most sleeps; for the rest use `extendedWaitUntil` with explicit timeout, `waitForAnimationToEnd` after screen transitions (known flakiness after animations: https://github.com/mobile-dev-inc/Maestro/issues/1703), and disable system animations via the three `*_animation_scale 0` settings (https://maestro.dev/insights/5-ways-to-fix-flaky-mobile-ui-tests, https://docs.maestro.dev/maestro-flows/flow-control-and-logic/wait-commands). Use `clearState` in launchApp for reproducible runs.

### 6. Cannot be verified on emulator — human device-pass list

- Real magnetometer heading, calibration accuracy states, figure-8 flow, magnetic interference near cases/magnets (emulator sensors are noiseless and always "accurate").
- Real GPS acquisition time, drift, accuracy radius, indoor degradation.
- **OEM battery killers** (Samsung/Xiaomi/Oppo aggressive task killers silently breaking rolling notification rescheduling — emulator is stock AOSP; see dontkillmyapp.com class of issues) — the single biggest Android adhan-app risk.
- Overnight real-Doze notification timing (forced `deviceidle` proves logic, not real maintenance-window latency for 5 AM Fajr).
- Audio focus/ducking against other real apps (Spotify, phone calls) during Quran streaming; Bluetooth audio routing.
- Haptics feel (tasbih) — emulator has no vibration motor.
- Real cold-start/scroll performance on low-end silicon; thermal throttling.
- TalkBack *usability* judgment (gesture feel) — emulator TalkBack proves labels/order, not experience.
- Play **pre-launch report** runs on Google's real devices and can surface crashes/ANRs your emulators never hit; treat its findings as a mandatory triage step during the 14-day closed test on your personal account.

### 7. Performance measurement on emulator

**Meaningfulness: directional only.** Google explicitly blocks benchmarking on emulators — Macrobenchmark raises an `EMULATOR` error because "performance is not representative of a real device as the emulator shares resources with its hosting OS" (https://developer.android.com/topic/performance/benchmarking/macrobenchmark-instrumentation-args). On an M-series Mac the arm64 emulator is often *faster* than a real mid-range phone. Use emulator numbers for regression *trends* on the same host, never for the "<2s cold start" budget sign-off.

Commands (all verified):
- **Cold start:** `adb shell am start -S -W $PKG/.MainActivity` → `ThisTime`/`TotalTime`/`WaitTime` in ms; `-S` force-stops first, `-W` waits (https://developer.android.com/topic/performance/vitals/launch-time).
- **Jank:** `adb shell dumpsys gfxinfo $PKG framestats` — per-frame nanosecond timings for recent frames plus aggregate janky-frame % and percentiles since API 23; `dumpsys gfxinfo $PKG reset` between scenarios (https://iut-fbleau.fr/docs/android/training/testing/performance.html — note: archived-era doc; command unchanged).
- **App size (the one metric that IS accurate on any machine):** `apkanalyzer apk file-size app.apk` and `apkanalyzer apk download-size app.apk` (compressed estimate), `apkanalyzer apk compare old.apk new.apk` for regressions (https://developer.android.com/tools/apkanalyzer). For the AAB, use bundletool `get-size total` (standard practice; not re-verified this session).
- **Memory:** `adb shell dumpsys meminfo $PKG` — PSS breakdown; valid for leak-shape trends, absolute numbers differ from real devices.

### Recommended "Android QA sweep" script outline

```bash
#!/usr/bin/env bash
# e2e/android-sweep.sh — release-evidence sweep (mirrors the iOS 205-capture sweep)
# Evidence: docs/screens/android/<avd>/<locale>_<theme>_<scale>/<screen>.png
PKG=com.khavionapps.deendawn
AVDS=(dd-api24-lowend dd-api35-pixel dd-api36-play dd-tablet dd-resizable)
LOCALES=(en ar ur)                     # ar/ur via: cmd locale set-app-locales (API 33+ AVDs)
THEMES=(no yes)                        # cmd uimode night <t>
SCALES=(1.0 1.3 2.0)                   # font_scale (2.0 only on API 34+ AVDs)
SCREENS=(home prayer-times quran-surah qibla tasbih hijri zakat settings)  # deep-link or Maestro nav per screen

for AVD in "${AVDS[@]}"; do
  emulator @"$AVD" -no-snapshot -no-boot-anim &            # keep audio ON for one adhan-sound spot check
  adb wait-for-device shell 'while [ -z "$(getprop sys.boot_completed)" ]; do sleep 1; done'
  adb shell settings put global window_animation_scale 0   # + transition/animator scales
  adb install -r app-release.apk
  adb emu geo fix -95.3698 29.7604                          # fixed test location (Houston)

  for LOC in "${LOCALES[@]}"; do
    adb shell cmd locale set-app-locales $PKG --user current --locales $LOC   # API<33 AVD: skip ar/ur or use debug.force_rtl
    for THEME in "${THEMES[@]}"; do
      adb shell cmd uimode night $THEME
      for SCALE in "${SCALES[@]}"; do
        adb shell settings put system font_scale $SCALE
        adb shell am force-stop $PKG
        adb shell am start -S -W $PKG/.MainActivity | tee -a evidence/startup-$AVD.log   # trend only, not budget proof
        for S in "${SCREENS[@]}"; do
          # navigate (maestro test -e SCREEN=$S e2e/goto-screen.yaml  OR  adb shell am start deep-link)
          adb exec-out screencap -p > "docs/screens/android/$AVD/${LOC}_${THEME}_${SCALE}/$S.png"
        done
      done
    done
  done

  # per-AVD one-offs:
  #  - offline suite:      cmd connectivity airplane-mode enable → Maestro offline flow → disable
  #  - notification pass:  schedule adhan in-app → KEYCODE_SLEEP → wait → WAKEUP → screencap lock screen
  #  - Doze logic:         dumpsys battery unplug → deviceidle force-idle → step through → battery reset
  #  - process death:      HOME → am kill → relaunch → screencap restored state
  #  - permission denial:  pm revoke POST_NOTIFICATIONS + ACCESS_FINE_LOCATION → manual-city + no-notif UX
  #  - RTL mirror check:   debug.force_rtl 1 (API 24 AVD, where per-app locale is unavailable)
  #  - dd-api36-play only: TalkBack pass (enable via settings put secure ...), expo push receipt
  #  - dd-resizable only:  repeat SCREENS across Display Modes phone/foldable/tablet/desktop
  #  - jank sample:        scroll surah view under Maestro → dumpsys gfxinfo $PKG framestats >> evidence/
  adb emu kill
done
apkanalyzer apk file-size app-release.apk >> evidence/size.log
apkanalyzer apk download-size app-release.apk >> evidence/size.log
```
Matrix size: 5 AVDs × 3 locales × 2 themes × 3 scales × 8 screens = 720 captures max; prune to full matrix on `dd-api35-pixel` only, with the other AVDs running locale=en+ar, scale=1.0+2.0 (≈ 340 captures) to keep review tractable.

## Sources

1. https://developer.android.com/studio/run/emulator-console — console/sensor/geo commands (current, fetched 2026-07-30)
2. https://developer.android.com/studio/run/emulator-extended-controls — virtual sensors, location routes, battery, fingerprint
3. https://developer.android.com/studio/run/emulator — emulator capabilities
4. https://developer.android.com/studio/run/emulator-commandline — `-no-audio`, `-no-window`, `-no-snapshot`, netspeed
5. https://developer.android.com/training/monitoring-device-state/doze-standby — Doze/App Standby adb commands
6. https://developer.android.com/tools/adb — screencap/screenrecord/pm grant-revoke
7. https://developer.android.com/tools/avdmanager — headless AVD creation
8. https://developer.android.com/studio/run/resizable-emulator — resizable/foldable device definition
9. https://developer.android.com/studio/run/managing-avds — Play images release-key signed, no root
10. https://developer.android.com/topic/performance/vitals/launch-time — `am start -S -W`
11. https://developer.android.com/topic/performance/benchmarking/macrobenchmark-instrumentation-args — emulator-not-representative
12. https://developer.android.com/tools/apkanalyzer — size commands
13. https://developer.android.com/guide/topics/resources/pseudolocales — en-XA/ar-XB
14. https://developer.android.com/guide/topics/resources/app-languages — per-app locales (no adb section)
15. https://android.googlesource.com/platform/frameworks/base/+/refs/heads/main/services/core/java/com/android/server/locales/LocaleManagerShellCommand.java — `cmd locale set-app-locales` syntax (AOSP main)
16. https://android.googlesource.com/platform/frameworks/base/+/refs/heads/main/services/core/java/com/android/server/notification/NotificationShellCmd.java — `cmd notification set_dnd/post` (AOSP main)
17. https://expo.dev/changelog/sdk-54 — RN 0.81, Android 16 target, edge-to-edge (Sep 2025)
18. https://reactnative.dev/blog/2025/08/12/react-native-0.81 — API 36 default, 16KB pages (Aug 2025)
19. https://raw.githubusercontent.com/react-native-community/template/0.81-stable/template/android/build.gradle — minSdk 24 verbatim
20. https://docs.expo.dev/versions/v54.0.0/sdk/notifications/ — channels, SCHEDULE_EXACT_ALARM, "emulators with Google Play services"
21. https://firebase.google.com/docs/cloud-messaging/android/first-message — FCM emulator requirement
22. https://docs.maestro.dev/get-started/supported-platform/android — adb-based driving
23. https://docs.maestro.dev/reference/selectors/core-selectors — id/text mapping per platform
24. https://docs.maestro.dev/get-started/supported-platform/react-native — testID → id
25. https://docs.maestro.dev/maestro-flows/flow-control-and-logic/permissions — default grant-all, YAML
26. https://docs.maestro.dev/maestro-flows/flow-control-and-logic/conditions — platform conditionals YAML
27. https://github.com/mobile-dev-inc/Maestro/issues/1703 + https://maestro.dev/insights/5-ways-to-fix-flaky-mobile-ui-tests + https://github.com/mobile-dev-inc/maestro/blob/main/CHANGELOG.md — flakiness/mitigations
28. https://gist.github.com/mrk-han/67a98616e43f86f8482c5ee6dd3faabe — font_scale/TalkBack/animation adb (community gist)
29. https://dev.to/robotsquidward/how-to-use-talkback-on-an-emulator-1f33 — TalkBack not preinstalled; Play Store install (older article; approach still current)
30. https://www.adb-shell.com/android/connectivity.html — `cmd connectivity airplane-mode` (community cheatsheet)
31. https://www.fonearena.com/blog/277716/android-q-enable-dark-mode-system-wide.html — `cmd uimode night` (community)
32. https://iut-fbleau.fr/docs/android/training/testing/performance.html — gfxinfo framestats (archived Google doc; command unchanged)
33. https://blog.isul.net/post/how-to-make-avd-with-specific-device-from-command-line/ — avdmanager `--device` flag (community)

## Confidence and gaps

**Well supported (primary sources, fetched this session):** minSdk 24 / target 36 for Expo SDK 54–RN 0.81; emulator console sensor/geo syntax; Doze adb commands; `cmd locale` and `cmd notification` syntax (AOSP source); Maestro default-grant permissions, selectors, platform conditionals; macrobenchmark emulator caveat; screenrecord 180s/no-audio limits; Play-image no-root; FCM/expo push on Play-services emulators.

**Moderately supported (community/secondary, marked in text):** `cmd uimode night`, `cmd connectivity airplane-mode` exact availability per API level, `avdmanager -d/--device` (works, but current official page omits it), `locksettings`, `appops SCHEDULE_EXACT_ALARM`, `debug.force_rtl`, TalkBack-absent-on-google_apis (older articles; re-check on your API 35/36 images with `pm list packages | grep talkback` — one command settles it), `resizable_experimental` device id (confirm via `avdmanager list device`), font_scale 2.0 ceiling on Android 14+.

**Could not verify:** whether raw `sensor set magnetic-field` values persist while the Virtual-sensors pose model is active (flagged as a caveat — test empirically); exact per-API behavior of `settings put global zen_mode` on Android 15/16 (use `cmd notification set_dnd` instead); Maestro `maestro start-device` CLI specifics (not needed — plain `emulator` launch is verified); bundletool `get-size total` syntax (standard but not re-fetched). Nothing in the brief hinges on these.

---


# Report 5. The Android excellence bar — prioritized work items

## Answer

To feel like a "how is this free?!" app on Android in 2026, DeenDawn should (a) skip Material You dynamic color deliberately — it is opt-in and Google itself harmonizes rather than mandates brand colors — while nailing the Material signals RN/iOS-first teams miss: enforced edge-to-edge, a proper monochrome themed icon (newly important because Android 16 QPR2 force-themes icons for apps that don't supply one), a correct Android-12-style icon splash, and a white 96×96 notification small icon; (b) ship a prayer-times home-screen widget via react-native-android-widget (actively maintained, New-Arch-compatible, Expo 54 config plugin — the privacy-comparable competitor Pillars gets review praise specifically for its widget); (c) wire per-app language for EN/UR/AR with the `expo-localization` plugin's `supportedLocales`; and (d) make the listing lead with verifiable privacy facts — this category's leaders were literally caught selling prayer-app location data to military/FBI/ICE data brokers, so "Data safety: No data collected" is the differentiator.

## Findings

### 1. Material 3 / dynamic color and the signals that matter

- Dynamic color is not required of apps. Google's own Material team acknowledged that "changing colors depending on the user conflicted with products' chosen colors, which were often semantic and needed to stay static," and its solution was hue harmonization, not mandatory adoption ([9to5google, Feb 2022](https://9to5google.com/2022/02/15/google-dynamic-color/)). M3's color system treats brand/custom color schemes as first-class alongside wallpaper-derived ones ([m3.material.io](https://m3.material.io/styles/color/dynamic/choosing-a-source)). In RN there is no automatic dynamic color anyway — it requires a native module to read the system palette — so intentionally keeping the forest-green/gold + three custom themes is both sane and the RN norm. The one Material You gesture worth making is the monochrome themed icon (§2). (RN-specific "requires extra module" point: general knowledge, consistent with everything fetched; no first-party doc asserts it directly.)
- Edge-to-edge is now mandatory, not a style choice: SDK 54 / RN 0.81 targets Android 16 (API 36) and "edge-to-edge will be enabled in all Android apps, and cannot be disabled"; `react-native-edge-to-edge` was dropped as an expo dependency and the new `androidNavigationBar.enforceContrast` app.json property replaces its main option ([Expo SDK 54 changelog](https://expo.dev/changelog/sdk-54); [RN 0.81 blog](https://reactnative.dev/blog/2025/08/12/react-native-0.81)). Action: audit every screen (especially Quran reader night-warm theme and modals) for safe-area correctness and transparent nav-bar look.
- Predictive back: disabled by default in SDK 54, enabled via `android.predictiveBackGestureEnabled`, planned default-on in SDK 55/56 ([Expo changelog](https://expo.dev/changelog/sdk-54)). Caution: there is an accepted, still-open bug where enabling it with expo-router makes the back gesture jump to the home screen instead of the previous screen, traced upstream to react-native-screens ([expo/expo#39092](https://github.com/expo/expo/issues/39092), opened Aug 2025, open as of this check). Recommendation: keep it off in SDK 54; retest at the SDK 55 upgrade.
- Splash: the Android 12+ system splash is icon-centric — vector-ish icon in a masked circle (288×288 dp fitting a 192 dp circle without icon background; 240×240 dp / 160 dp circle with one) on a single opaque window background; full-bleed splash images are not possible and the optional bottom branding image is recommended against by Google's own design guidance ([Android splash docs](https://developer.android.com/develop/ui/views/launch/splash-screen)). Make sure the Deen Dawn splash mark reads correctly under that mask on the brand background color.
- Typography/haptics (editorial, not doc-verified this session): keep your custom Newsreader/Public Sans stack — custom type is fine on Android — but check Android-specific conventions manually: left-aligned app-bar titles, no iOS "< Back" text labels, Android's system back instead of relying on header buttons, and test expo-haptics intensity on real hardware (Android haptic motors vary widely; iOS-tuned patterns often feel mushy). Ripple is already done per the brief.

### 2. Icons: adaptive + themed (monochrome)

- Specs: all layers on a 108×108 dp canvas; the outer 18 dp on each side is reserved; the safe zone never clipped by any mask is 66×66 dp; keep the logo 48–66 dp ([Android adaptive icon docs](https://developer.android.com/develop/ui/views/launch/icon_design_adaptive)).
- Themed icons: on Android 13+, if the user enables themed icons, launchers tint apps that provide a `monochrome` layer. Critically for 2026: "Starting with Android 16 QPR 2, Android automatically themes app icons for apps that don't provide their own" — i.e., if you don't ship a monochrome layer, the OS will now generate a themed icon for you, out of your control. Supplying your own monochrome mark has moved from "polish" to "required for brand control" ([same doc](https://developer.android.com/develop/ui/views/launch/icon_design_adaptive)).
- Expo config (all pure app.json, verified against [Expo splash/icon guide](https://docs.expo.dev/develop/user-interface/splash-screen-and-app-icon/)):
  ```json
  "android": {
    "icon": "./assets/android-legacy-icon.png",
    "adaptiveIcon": {
      "foregroundImage": "./assets/android-icon-foreground.png",
      "backgroundColor": "#<brand-green>",
      "monochromeImage": "./assets/android-icon-monochrome.png"
    }
  }
  ```
  All PNG; `backgroundImage` is an alternative to `backgroundColor`; `android.icon` covers pre-adaptive devices.

### 3. Home-screen widgets

- Category evidence: prayer times are the canonical glanceable data — Athan markets its home-screen prayer widget as a headline feature, "Muslim Pillars" leads with "beautiful widgets that keep your next Salah visible," and Pillars (the closest privacy-respecting comparable) draws review praise like "the widget feature is lovely… makes checking upcoming prayer times so much easier without opening the app" ([Pillars on Google Play](https://play.google.com/store/apps/details?id=com.pillars.pillars&hl=en_US); [Athan App Store listing](https://apps.apple.com/us/app/athan-prayer-times-dua-azkar/id505858403)). A widget is arguably the single highest-leverage Android-only feature for this app.
- Tooling: Expo's official `expo-widgets` is iOS-only (SwiftUI/Expo UI, and introduced after SDK 54 anyway) ([Expo widgets docs](https://docs.expo.dev/versions/latest/sdk/widgets/)), so the viable path on SDK 54 Android is [react-native-android-widget](https://saleksovski.github.io/react-native-android-widget/): ~890 stars, actively maintained (CHANGELOG shows 0.21.0 on 2026-07-11; 0.20.x Jan–May 2026; note one fetched view of the Releases page rendered these dates as 2024 — the CHANGELOG's ISO dates plus its "Expo 54" (0.17.2) and "Expo 55 canary" (0.18.0) entries support the 2026 reading), New Architecture support since 0.16, first-party Expo config plugin ([repo](https://github.com/sAleksovski/react-native-android-widget); [CHANGELOG](https://github.com/sAleksovski/react-native-android-widget/blob/master/CHANGELOG.md); [Expo registration tutorial](https://saleksovski.github.io/react-native-android-widget/docs/tutorial/register-widget-expo)).
- How it works: you register widgets in the plugin config (`name`, `label`, `description`, `previewImage`, `minWidth/minHeight` for ≤Android 11, `targetCellWidth/Height` for 12+, custom `fonts`, `updatePeriodMillis` — default 0, minimum 1,800,000 ms = 30 min) and render with widget-only primitives (`FlexWidget`, `OverlapWidget`, `ListWidget`, `TextWidget`, `ImageWidget`, `IconWidget`, `SvgWidget` — no RN `View`/`Text`) via a widget task handler ([register-widget-expo](https://saleksovski.github.io/react-native-android-widget/docs/tutorial/register-widget-expo); [primitives](https://saleksovski.github.io/react-native-android-widget/docs/primitives/index)).
- Design implication of the 30-min floor: don't build a live countdown. Build a "today's five times + date + next-prayer highlight" widget; the highlight can lag up to ~30 min between periodic updates unless you also trigger re-renders from app foreground and your existing background rescheduling task. That's an honest, battery-friendly fit for prayer data (times change once per day). Effort estimate (editorial): ~2–4 days for one well-themed widget including RTL/Urdu text, preview image, and update wiring; +1–2 days per extra size/variant.
- Lock screen / AOD: lock-screen widgets returned to Pixel phones in Android 16 QPR2 (swipeable panel right of the clock; public rollout reported for December 2025; Samsung One UI has its own equivalent) ([Android Authority](https://www.androidauthority.com/lock-screen-widgets-on-phones-android-16-qpr2-3589668/)). These reuse the AppWidget framework, so a home-screen widget is most of the work; whether react-native-android-widget exposes the keyguard/lock-screen category flag is unverified — treat as a research task. There is no third-party AOD surface on stock Android (general knowledge, unverified).

### 4. Per-app language preferences (Android 13+)

- Expo wiring is pure config: add the `expo-localization` config plugin with `supportedLocales.android: ["en", "ur", "ar"]`; this makes DeenDawn appear in Settings > System > App languages ([Expo localization guide](https://docs.expo.dev/guides/localization/)).
- Android semantics: `android:localeConfig` (which the plugin path handles for you) is what signals selectability; omitting it "signals that users shouldn't be able to set your app's language independent of their system language." The platform APIs "automatically sync with system settings," and a language change recreates the Activity by default ([Android per-app languages doc](https://developer.android.com/guide/topics/resources/app-languages)).
- Interplay with your in-app picker + RTL restart: because the Activity is recreated on a system-side change, your existing cold-start path (read `getLocales()` → init i18next → set `I18nManager` → `expo-updates` reload for RTL flips) handles it naturally. Two-way sync (in-app picker also calling `setApplicationLocales` so the system Settings row reflects it) needs a native call — `react-native-localization-settings` exists for exactly this ([repo](https://github.com/jakex7/react-native-localization-settings), existence verified via search only). Recommended order: ship one-way (system → app) via `supportedLocales` now; treat two-way sync as optional polish.

### 5. Play Store presence quality bar

- Feature graphic: exactly 1024×500, JPEG or 24-bit PNG with no alpha, required to publish; Play crops it to 16:9 or narrower in promotional surfaces, so keep the wordmark and mark center-safe; keep under ~1 MB ([ScreenKit spec page](https://screenkit.tools/specs/google-play-feature-graphic-size); [appradar guidelines](https://appradar.com/blog/android-app-screenshot-sizes-and-guidelines-for-google-play) — ASO vendors, not Google-primary, but consistent with each other).
- "Premium free" perception (editorial synthesis, grounded in the above guides): device-framed screenshots in the brand palette with one short benefit caption each, first two screenshots carrying the whole story ("Accurate prayer times. No ads. No tracking."), a short description (80-char field) that states the zero-cost/zero-data facts plainly, and a consistent visual system across icon, feature graphic, and screenshots. You already have iOS screenshot sets; re-shoot on Android (status bar, edge-to-edge, Material back affordances visible) rather than reusing iOS frames — mismatched chrome is a classic "port" tell.
- Large screens: Google renamed the guidance — the "large screen app quality" guidelines are now the adaptive app quality tiers: Tier 3 "Adaptive Ready" (runs full screen, no letterboxing, critical flows completable, basic keyboard/mouse), Tier 2 "Adaptive Optimized" (layouts optimized for all sizes/postures), Tier 1 "Adaptive Differentiated" ([Android adaptive quality guidelines](https://developer.android.com/docs/quality-guidelines/large-screen-app-quality)). For a phone-first app, meeting Tier 3 plus uploading tablet/foldable screenshots is the right target — it avoids the degraded tablet presentation and costs little since the app is already resizable-friendly RN. Whether Play currently shows explicit "not optimized" warnings/form-factor ratings on the listing was not confirmed in the fetched doc — treat as likely but unverified.

### 6. Category landscape — what the incumbents do badly

- Muslim Pro was found sending user location data to broker X-Mode, whose buyers included US military contractors (Vice/Motherboard, Nov 2020; X-Mode was subsequently banned from both app stores) ([Middle East Eye summary](https://www.middleeasteye.net/news/another-muslim-prayer-app-found-be-tracking-its-users-locations-report)).
- Salaat First (10M+ installs) sold location data to Predicio, part of a supply chain serving a contractor working with the FBI, ICE, and CBP; it collected lat/long, device model, OS, IP, timestamps, and didn't even surface a privacy policy at the consent prompt; Google later threatened removal of apps containing Predicio code ([Vice](https://www.vice.com/en/article/muslim-app-location-data-salaat-first/); [Vice on the Predicio ban](https://www.vice.com/en/article/google-predicio-ban-muslim-prayer-app/)).
- Comparitech's study of 175 Muslim apps on Google Play: 96% requested "Device ID & call information," ~40% requested location, 63% storage; only five apps met its privacy bar — including Pillars, iPray, Daily Islam — all characterized by "ad-free, minimal permissions, data stays on device" ([Comparitech study](https://www.comparitech.com/blog/vpn-privacy/muslim-prayer-app-study/), published Jan 2022, updated Oct 2023 — flag: pre-2024 data, but it remains the most-cited study in this category).
- Positioning guidance (editorial): state only verifiable mechanics, never sermonize and never name competitors in the listing (comparative claims are a Play metadata-policy risk — unverified specifics, keep generic): "Free forever. No ads. No accounts. No analytics. Your location never leaves your phone. Works fully offline." Let the Play Data safety section ("No data collected") and the airplane-mode demo screenshot do the arguing. In-app, one calm line on the About/Privacy screen plus the permission-prompt copy ("used on this device only") is enough — the audience that was burned by Muslim Pro/Salaat First recognizes the signals without preaching.

### 7. Android-only quick wins — feasibility in Expo SDK 54

- Persistent next-prayer notification: `expo-notifications` `NotificationContentInput.sticky` ("If set to true, the notification cannot be dismissed by swipe") is supported — pure JS on your existing scheduler; update it at each prayer boundary from the same rolling scheduler ([expo-notifications v54 docs](https://docs.expo.dev/versions/v54.0.0/sdk/notifications/)). Limits: no chronometer/live countdown without a foreground service (not offered by expo-notifications); make it an opt-in setting. (Note: newer Android versions let users dismiss many "ongoing" notifications anyway — unverified this session.)
- Notification actions ("Silence today," "Snooze"): `setNotificationCategoryAsync` is explicitly "Supported platforms: Android, iOS" with button and text-input actions — pure JS ([same docs](https://docs.expo.dev/versions/v54.0.0/sdk/notifications/)).
- Monochrome status-bar icon: the expo-notifications config plugin's `icon` ("96x96 all-white png with transparency") + `color` tint — pure config; without it Android shows a generic/grey glyph ([same docs](https://docs.expo.dev/versions/v54.0.0/sdk/notifications/)).
- App shortcuts (long-press icon → Qibla / Tasbih / Continue reading): `expo-quick-actions` (Evan Bacon) exposes Android App Shortcuts with a config plugin for icon assets and runtime `QuickActions.setItems()`; Android shortcuts are pinnable to home screen so icons should be adaptive-style ([repo](https://github.com/EvanBacon/expo-quick-actions)).
- Share target (receive shared text → Quran search): `expo-share-intent` config plugin with `androidIntentFilters: ["text/*"]` ([repo](https://github.com/achorein/expo-share-intent)). Nice-to-have, low priority.
- Launcher/app category (`android:appCategory` in the manifest, helps system categorization): trivial `withAndroidManifest` config-plugin tweak — value is marginal; unverified that Expo exposes it directly (it does not appear in app.json config docs consulted).

## PRIORITIZED Android work items

**P0 — table stakes for "premium free" on Android**
1. Notification small icon (96×96 white PNG) + brand tint color — pure config (expo-notifications plugin); without it every adhan notification looks broken.
2. Adaptive icon: foreground/background layers within the 66 dp safe zone + `monochromeImage` themed icon — pure config (app.json) + new icon assets; now brand-defensive because Android 16 QPR2 auto-themes apps that omit it.
3. Edge-to-edge audit of all screens/themes (it's forced on, cannot be disabled) + decide `androidNavigationBar.enforceContrast` — pure code/config.
4. Android 12+ splash check: mark legible inside the 192 dp masked circle on brand background — pure config/assets (expo-splash-screen).
5. Per-app language: `expo-localization` plugin `supportedLocales.android: ["en","ur","ar"]`, verify Settings > App languages → cold-start locale/RTL path — pure config + small JS.
6. Play listing pack: 1024×500 center-safe feature graphic, Android-native screenshots in brand style, 80-char short description leading with verifiable privacy/free facts, Data safety = No data collected — assets/metadata only.

**P1 — the differentiators**
7. Prayer-times home-screen widget (today's 5 times + next-prayer highlight, light/dark, RTL) via react-native-android-widget — third-party native module with Expo config plugin, New-Arch OK, ~2–4 days; honest 30-min update floor, refresh from existing background rescheduler.
8. App shortcuts: Qibla / Tasbih / Continue reading via expo-quick-actions — native module + config plugin, small.
9. Notification action "Silence today" on adhan notifications via `setNotificationCategoryAsync` — pure JS on existing stack.
10. Opt-in sticky "next prayer" notification (`sticky: true`, updated per prayer) — pure JS; document its limits in-app.
11. Adaptive Tier 3 ("Adaptive Ready") pass + tablet/foldable screenshots on the listing — layout QA, no native work.

**P2 — later / watch items**
12. Predictive back: keep `android.predictiveBackGestureEnabled` OFF on SDK 54 (open expo-router/react-native-screens bug #39092); re-test at SDK 55 — pure config flag.
13. Lock-screen widget eligibility (Android 16 QPR2 Pixel panel): investigate keyguard category support in react-native-android-widget — research task, unverified.
14. Share target → Quran search via expo-share-intent — native module + config plugin, small.
15. Dynamic color: intentionally NOT adopting; log the rationale in docs/DECISIONS.md (brand themes + monochrome icon are the Material You answer) — no code.
16. `android:appCategory` and misc manifest polish — tiny `withAndroidManifest` config plugin.

## Sources

1. https://expo.dev/changelog/sdk-54 (Sept 2025)
2. https://reactnative.dev/blog/2025/08/12/react-native-0.81 (Aug 2025)
3. https://github.com/expo/expo/issues/39092 (opened Aug 2025, open at time of check)
4. https://developer.android.com/develop/ui/views/launch/splash-screen (current)
5. https://developer.android.com/develop/ui/views/launch/icon_design_adaptive (current; includes Android 16 QPR2 auto-theming note)
6. https://docs.expo.dev/develop/user-interface/splash-screen-and-app-icon/ (current)
7. https://docs.expo.dev/guides/localization/ (current)
8. https://developer.android.com/guide/topics/resources/app-languages (current)
9. https://saleksovski.github.io/react-native-android-widget/ + /docs/tutorial/register-widget-expo + /docs/primitives/index (current)
10. https://github.com/sAleksovski/react-native-android-widget + CHANGELOG.md (latest 0.21.0, 2026-07-11 per CHANGELOG)
11. https://docs.expo.dev/versions/latest/sdk/widgets/ (expo-widgets, iOS-only)
12. https://docs.expo.dev/versions/v54.0.0/sdk/notifications/ (current, SDK 54)
13. https://github.com/EvanBacon/expo-quick-actions (current)
14. https://github.com/achorein/expo-share-intent (current)
15. https://developer.android.com/docs/quality-guidelines/large-screen-app-quality (adaptive quality tiers, current)
16. https://www.comparitech.com/blog/vpn-privacy/muslim-prayer-app-study/ (Jan 2022, updated Oct 2023)
17. https://www.vice.com/en/article/muslim-app-location-data-salaat-first/ (Jan 2021); https://www.vice.com/en/article/google-predicio-ban-muslim-prayer-app/ (2021); https://www.middleeasteye.net/news/another-muslim-prayer-app-found-be-tracking-its-users-locations-report (2021)
18. https://9to5google.com/2022/02/15/google-dynamic-color/ (Feb 2022)
19. https://m3.material.io/styles/color/dynamic/choosing-a-source (current)
20. https://www.androidauthority.com/lock-screen-widgets-on-phones-android-16-qpr2-3589668/ (late 2025)
21. https://play.google.com/store/apps/details?id=com.pillars.pillars ; https://apps.apple.com/us/app/athan-prayer-times-dua-azkar/id505858403 (current listings)
22. https://screenkit.tools/specs/google-play-feature-graphic-size ; https://appradar.com/blog/android-app-screenshot-sizes-and-guidelines-for-google-play (2025–2026 ASO guides)
23. https://github.com/jakex7/react-native-localization-settings (existence verified via search only)

## Confidence and gaps

- Well supported (primary sources fetched this session): edge-to-edge enforcement and `androidNavigationBar.enforceContrast`; predictive-back default/flag and the open expo-router bug; adaptive-icon dp specs, monochrome layer, and the Android 16 QPR2 auto-theming change; Expo app.json icon properties; `expo-localization` `supportedLocales` and Android `localeConfig`/`setApplicationLocales` semantics; expo-notifications `sticky`, categories-on-Android, and the 96×96 white icon plugin option; react-native-android-widget's config plugin shape, primitives, 30-min update floor, and New-Arch support; adaptive quality tier names/requirements; the Muslim Pro/Salaat First data-sale reporting and Comparitech numbers.
- Thin / secondary-only: feature-graphic cropping and screenshot best practices come from consistent ASO-vendor pages, not a fetched Google-primary page; widget effort estimate and "premium listing" style guidance are editorial; react-native-localization-settings and lock-screen-widget (keyguard) support in react-native-android-widget were not verified in fetched docs.
- Discrepancy noted: one fetched view of the widget library's Releases page rendered release years as 2024 while the CHANGELOG's ISO dates read 2026 (0.21.0 = 2026-07-11); the CHANGELOG's internal evidence (Expo 54/55-canary entries) supports 2026, so I treated the library as actively maintained, but re-check before committing to it.
- Unverified claims I flagged inline: Android 14+ user-dismissability of ongoing notifications; Play form-factor rating/warning surfacing on listings; absence of third-party AOD surfaces; comparative-claims policy risk specifics; Comparitech data is pre-2024 on a fast-moving topic.

---


# Report 6. Repo audit — actual Android state of this codebase (2026-07-30)

Complete map below.

# Android state map — `/Users/zohaibkhawaja/Desktop/Khavion/deendawn`

**Version correction:** the repo is **not** SDK 54 / RN 0.81. `package.json:29,60` → `expo: ^57`, `react-native: 0.86.0`, `react: 19.2.3`, `expo-router: ~57.0.9`. The SDK 54→57 upgrade is commit `b556e8c`. `docs/DECISIONS.md:9` (RN 0.86 note in `plugins/withAppearanceHardening.js:9`) confirms.

---

## 1. `app.json` — Android section + plugins

`/Users/zohaibkhawaja/Desktop/Khavion/deendawn/app.json`

| Item | Lines | Value |
|---|---|---|
| `android` block | 33–49 | — |
| `package` | 42 | `com.khavion.deendawn` (same id as `ios.bundleIdentifier`, :18) |
| `versionCode` | — | **absent by design.** `eas.json:4` `appVersionSource: "remote"`; rationale at `docs/DECISIONS.md:220` ("intentionally did NOT add `ios.buildNumber`/`android.versionCode`") |
| `permissions` (allowlist) | — | **absent** — no `android.permissions` array, so autolinked library permissions all merge through |
| `blockedPermissions` | 43–48 | `RECORD_AUDIO`, `SYSTEM_ALERT_WINDOW`, `READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE` |
| `edgeToEdgeEnabled` | 40 | `true` |
| `predictiveBackGestureEnabled` | 41 | `false` |
| navigation-bar / status-bar config | — | **none** (no `androidNavigationBar`, no `androidStatusBar`) |
| `adaptiveIcon` | 34–39 | `backgroundColor #E6F4FE`, `foregroundImage`, `backgroundImage`, `monochromeImage` (all three PNGs exist in `assets/images/`) |
| splash | 56–67 (plugin) | `expo-splash-screen`: `splash-icon.png`, width 200, `contain`, light `#F7F6F2`, dark `#15181D`. Not platform-split |
| locales | — | **iOS-only.** `CFBundleLocalizations ["en","ur","ar"]` at :26–30; there is **no `android.locales`** and no generated `res/xml/locales_config.xml`. Android per-app language picker is therefore unavailable |

**Android-relevant plugins** (`app.json:54–107`)
- `expo-notifications` :71–78 — `sounds: ["./assets/sounds/adhan_clip_placeholder.wav"]`. No Android `icon`/`color`/`defaultChannel` options set.
- `expo-audio` :87–92 — `microphonePermission: false`.
- `expo-location` :79–86 — when-in-use only; `locationAlways*: false`.
- `expo-build-properties` :94–101 — **`ios.deploymentTarget` only; no `android` key** (no `compileSdkVersion`/`targetSdkVersion`/`minSdkVersion`/`extraProguardRules` pinned).
- `expo-background-task` :70, `expo-sqlite` :68, `expo-localization` :69, `expo-font` :102, `expo-image` :103, `expo-status-bar` :104.
- `./plugins/withAppearanceHardening` :106 — **iOS-only plugin** (`withDangerousMod('ios')` + `withXcodeProject`, `plugins/withAppearanceHardening.js:34,44`); a no-op on Android, harmless.
- `experiments.reactCompiler: true` :110, `newArchEnabled: true` :10.

---

## 2. `eas.json` — Android profiles

`/Users/zohaibkhawaja/Desktop/Khavion/deendawn/eas.json`
- `cli.appVersionSource: "remote"` (:4).
- **`build`** (:6–20): `development` (:7–13) has `developmentClient`, `distribution: internal`, and an **`ios.simulator: true` block with no Android counterpart**; `preview` (:14–16) `distribution: internal`; `production` (:17–19) `autoIncrement: true`. **No `android` key in any build profile** — no `buildType: app-bundle`/`apk`, no `gradleCommand`, no `image`, no `ndk`/JDK pin (relevant: `docs/ANDROID.md:53` records that JDK 21 is required and system Java 25 breaks the build).
- **`submit.production.android`** (:26–29): `serviceAccountKeyPath: "./secrets/play-service-account.json"` (path not present in repo), `track: "internal"`. Added per `docs/DECISIONS.md:265`.

---

## 3. Platform-specific code inventory

**`Platform.OS` / `Platform.select` — only 2 occurrences in the entire app/src/components tree:**
- `src/features/zakat/components/ZakatScreen.tsx:110` — `behavior={Platform.OS === 'ios' ? 'padding' : undefined}`
- `src/features/prayer-times/components/CityPickerModal.tsx:40` — same pattern

`Platform.select` is used **zero** times. Platform-suffixed files: exactly one — `components/ui/icon-symbol.ios.tsx` (paired with `components/ui/icon-symbol.tsx`, the MaterialIcons fallback; all 12 SF names used app-wide are present in its `MAPPING`, lines 15–30 — verified no gaps).

**iOS-only behavior lacking an Android branch:**

| Area | File:line | Gap |
|---|---|---|
| **Tab chrome (highest impact)** | `app/(tabs)/_layout.tsx:19,23,27,31,35` | All 5 `NativeTabs.Trigger.Icon` use **`sf="…"`** only. `node_modules/expo-router/build/native-tabs/types.d.ts:193` types `sf?: SFSymbol` (iOS); Android needs `drawable?: string` (:203) or `src?` (:208). Result on Android: labels render, **icons do not**. Header comment (:8–11) is explicitly iOS-only ("Liquid Glass") |
| Header chrome | `app/_layout.tsx:99–110` | `headerBackButtonDisplayMode: 'minimal'` on 11 screens — iOS-only prop, silently ignored on Android |
| Haptics | `src/lib/haptics.ts:20–27` | No platform branch. `selectionAsync()` (:23) and `notificationAsync()` (:24–26) are thin/absent on Android; the header comment reasons entirely from Apple semantics (:16–18). `VIBRATE` is granted (manifest :9), so it degrades rather than crashes |
| Insets | `src/components/ui/Screen.tsx:32`, plus `useSafeAreaInsets` in 10 files (`MoreScreen.tsx:98,146`, `AskScreen.tsx:20`, `SurahScreen.tsx:58`, `SurahListScreen.tsx:31`, `BookmarksScreen.tsx:31`, `QiblaScreen.tsx:24`, `FullAdhanPlayer.tsx:27`, `OnboardingScreen.tsx:44`, `TodayScreen.tsx:95`) | Portable, but combined with `edgeToEdgeEnabled: true` and no `androidNavigationBar` config this is the untested surface |
| Scroll insets | 9 call sites of `contentInsetAdjustmentBehavior="automatic"` (`MoreScreen.tsx:317`, `AboutScreen.tsx:34`, `TasbihScreen.tsx:84`, `AskScreen.tsx:149`, `CalendarScreen.tsx:92`, `ThinkerScreen.tsx:45`, `SurahListScreen.tsx:101,141`, `QiblaScreen.tsx:165`, `ZakatScreen.tsx:114`, `TodayScreen.tsx:170`) | iOS-only prop; no-op on Android |
| Fonts | see §7 | no platform logic |
| Audio background modes | see §5 | iOS-only declaration |
| Ripple (the one Android affordance implemented) | `src/components/ui/AppPressable.tsx:29,41` | `android_ripple ?? { color: t.border, foreground: true }` — per `docs/DECISIONS.md:418` "Android ripple = the entire Android feel budget" |
| Dev audio host | `src/features/audio/config.ts:23` | `DEV_AUDIO_BASE_URL = 'http://localhost:8083'` with comment "it is the ATS exception domain in debug builds" — an **iOS-ATS-shaped** assumption. On an Android emulator `localhost` is the emulator, so this needs `adb reverse tcp:8083 tcp:8083` (cleartext itself is fine: `android/app/src/debug/AndroidManifest.xml` sets `usesCleartextTraffic="true"`) |

---

## 4. Notification scheduler — Android channels: **none exist**

- **Pure planner:** `src/features/notifications/scheduler.ts` — `planNotifications` (:48+), `ADHAN_PRAYERS` (:6), `SoundKey = 'default'|'silent'|'clip'|'fullAdhan'` (:9), `NOTIFICATION_CAP = 60` (:37), `MIN_DAYS_COVERED = 7` (:39). The cap comment (:31–34) is iOS-reasoned ("iOS silently drops everything past 64 pending local notifications") — Android has no such limit, so the cap is merely conservative there.
- **OS sync:** `src/features/notifications/service.ts` — `rescheduleAll()` (:67–127), `cancelAllAdhans()` (:130), `installForegroundHandler()` (:12–21), `ensurePermission()` (:23–31).
- **Triggers:** `src/features/notifications/useNotificationScheduling.ts` (mount / settings change / `AppState` active / notification-received), and `src/features/notifications/backgroundRefresh.ts` (`expo-background-task`, `minimumInterval: 60*12`, :29). Its doc comment (:15–17) says "iOS decides when (if ever) this runs" — no Android/WorkManager wording.

**Android-critical findings:**
1. **`Notifications.setNotificationChannelAsync` / `AndroidImportance` / `vibrationPattern` appear nowhere in the codebase.** Grep across `app/ src/ components/ plugins/ scripts/` returns zero hits; the only matches repo-wide are prose in `docs/ANDROID.md:44`, `docs/AUDIT.md:118,152,183`, `docs/RESEARCH_PROMPT.md:39`. On Android every notification lands in the auto-created `expo_notifications_fallback_notification_channel` at default importance.
2. **Custom sound will be ignored on Android.** `service.ts:47–52` sets a per-notification `sound: 'adhan_clip_placeholder.wav'`. Android takes sound from the *channel*, not the payload — so the per-prayer Silent/Ping/Clip/Full picker collapses to one channel sound. The asset itself is correctly staged: `android/app/src/main/res/raw/adhan_clip_placeholder.wav` exists (hyphen→underscore rename was commit `50fd965`, motivation recorded in `docs/ANDROID.md:57–58`).
3. **`interruptionLevel: 'timeSensitive'` (`service.ts:40,57`) is iOS-only** — no Android equivalent set (that role is `IMPORTANCE_HIGH` + channel bypass-DND).
4. **`ensurePermission` (`service.ts:27–29`) passes only an `ios: {...}` options object.** `requestPermissionsAsync` still triggers the Android 13+ `POST_NOTIFICATIONS` runtime dialog (permission comes from `node_modules/expo-notifications/android/src/main/AndroidManifest.xml`), so it works — but nothing is Android-tuned.
5. **No exact-alarm code of any kind:** no `SCHEDULE_EXACT_ALARM`/`USE_EXACT_ALARM` in `app.json` or any source file, no `setAlarmClock`, no battery-optimization-exemption prompt. Strategy exists only as an open research question (`docs/AUDIT.md:183`, `docs/RESEARCH_PROMPT.md:38–39`) and as a forward-reference in `CLAUDE.md:167` ("Exact-alarm permission strategy is already documented in docs/DECISIONS.md when you get there") — **that DECISIONS entry does not actually exist**; `docs/DECISIONS.md` contains no exact-alarm text.
6. Reboot survival comes free from the library receiver (`RECEIVE_BOOT_COMPLETED` + `BOOT_COMPLETED` in expo-notifications' own manifest), not from app code.

Tests: `src/features/notifications/__tests__/{scheduler,service,prefsStore,soundAssets}.test.ts`. `soundAssets.test.ts:1–5` gates only the **iOS** 30 s notification-sound limit.

---

## 5. Audio player — background playback

- **Streaming player:** `src/features/audio/components/SurahAudioBar.tsx`. On first play (`toggle`, :96–118):
  - `setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true, interruptionMode: 'doNotMix' })` (:102–106)
  - `player.setActiveForLockScreen(true, { title, artist: tr('audio.lockScreenArtist') })` (:111–114) — **this is the only lock-screen metadata code in the repo**
- **iOS declaration:** `app.json:21–23` `UIBackgroundModes: ["audio"]`.
- **Android equivalent: absent.** No `FOREGROUND_SERVICE` / `FOREGROUND_SERVICE_MEDIA_PLAYBACK` permission, no `MediaSessionService`, no `expo-build-properties.android` audio config. `android/app/src/main/AndroidManifest.xml` declares only `MODIFY_AUDIO_SETTINGS` (:5) — no media service or foreground-service entry. Background recitation past app-backgrounding is therefore unproven on Android.
- **Full adhan:** `src/features/notifications/FullAdhanPlayer.tsx` — plays `assets/sounds/adhan_full_placeholder.wav` (:46) only on open-from-notification; `setAudioModeAsync({ playsInSilentMode: true })` (:44). Its doc comment (:21–23) and `service.ts:44–46` both frame the design as an **iOS limitation**. Matching decision: `docs/DECISIONS.md:5` — *"Android full-adhan foreground service: deferred to post-v1 (new permission surface); do not scaffold."*
- Supporting pure modules (platform-neutral): `playerLogic.ts`, `resumeStore.ts`, `urls.ts`, `config.ts`.

---

## 6. Maestro flows (`e2e/`) — 6 flows

All share `appId: com.khavion.deendawn` and use `testID`-based `id:` selectors, which Maestro resolves on both platforms.

| Flow | Android-hostile bits |
|---|---|
| `e2e/smoke.yaml` | Tab taps by visible text (`'More'` :10, `'Quran'` :21) depend on NativeTabs labels rendering — labels do exist on Android, but with **no `sf`→drawable icon** (§3) any future icon assertion breaks |
| `e2e/onboarding.yaml` | :36–39 comment *"iOS 26 native pageSheet: element taps land offset inside the sheet (Maestro/XCUITest), so select the top match with the return key instead"* → `pressKey: Enter` (:39). An **iOS-workaround path** baked into the happy path; Android's modal is not a pageSheet, so the direct `tapOn: id: city-houston-us` would be the natural (and untested) route |
| `e2e/offline.yaml` | Same pageSheet comment + `pressKey: Enter` (:36–39). Header comment :7–8 reasons about pushed-screen chrome; `pressKey: enter` **lowercase** at :82 (vs `Enter` at :39) — inconsistent casing |
| `e2e/ask.yaml` | `pressKey: enter` lowercase (:17, 25-adjacent, :51). `- tapOn: 'Ask'` (:9) |
| `e2e/audio.yaml` | **Hard-blocked on Android emulator:** header (:3–5) requires `scripts/dev-audio-server.mjs` on `:8083`, and `src/features/audio/config.ts:23` points at `localhost` — needs `adb reverse tcp:8083 tcp:8083`, which no script does. Also asserts a raw duration regex `text: '0:0.*/.*1:00.*'` (:30) |
| `e2e/locales.yaml` | Only 18 lines (EN→UR); the header comment promises AR + round-trip that the file does not do. Relies on the language-switch **restart** path — `MoreScreen.tsx:217` `Updates.reloadAsync().catch(() => DevSettings.reload())`, untested on Android |

Also relevant: `docs/DECISIONS.md:412–413` and `scripts/evidence-sweep/README.md:18–21` record iOS-specific Maestro gotchas ("never assert on tab labels with `, tab` regexes — NativeTabs exposes plain labels").
`docs/TESTPLAN.md:10` scopes E2E as "**Maestro, iOS Simulator**", though `docs/AUDIT.md:105` claims the suites were "green on **both** iOS and Android" at the SDK-54 era.

---

## 7. Fonts — no platform-conditional logic

All loading is in one place: `app/_layout.tsx:119–133` (`useFonts` from `expo-font`), with `if (!fontsLoaded) return null;` (:135).
- **Arabic:** `AmiriQuran: require('@/assets/fonts/AmiriQuran.ttf')` (:121)
- **Urdu:** `NotoNastaliqUrdu: require('@/assets/fonts/NotoNastaliqUrdu-Regular.ttf')` (:122)
- **Latin:** `@expo-google-fonts/newsreader` (6 faces, imported :2–9) + `@expo-google-fonts/public-sans` (4 faces, :10–15)
- Token map: `src/lib/theme/tokens.ts:141–155` (`quran: 'AmiriQuran'` :152, `nastaliq: 'NotoNastaliqUrdu'` :154). Urdu line-height factor applied in `src/components/ui/AppText.tsx:63`.
- Nav-theme font wiring: `app/_layout.tsx:78–83`.

**Zero `Platform` references in any font path.** Both custom TTFs are single-weight, and every Latin weight is loaded as a discrete family name rather than via `fontWeight` — which is the right shape for Android (no synthetic-bolding divergence). Nastaliq line-height on Android is the untested risk.

---

## 8. Docs — Android-relevant entries

### `docs/DECISIONS.md`
- **:5** — "**Android full-adhan foreground service: deferred to post-v1 (new permission surface); do not scaffold.**"
- **:93** — `ios/` and `android/` gitignored (Expo CNG); `npx expo prebuild` regenerates.
- **:95** — deterministic notification ids; cap 60 of iOS's 64; custom adhan sounds deferred.
- **:220** — `appVersionSource: "remote"` chosen *because* `/ios` and `/android` are gitignored; consequence: **no `android.versionCode` in app.json on purpose**.
- **:263** — publishing-rules research: Apple $99/yr, no tester gate, 1–2 day review; **Google Play personal account $25 once + 12-tester × 14-continuous-day closed test (~2–4 weeks)**; organization account (D-U-N-S) exempt. Decision: **Apple first**.
- **:264** — **Android permissions trimming**: the four `blockedPermissions`, verified via `expo prebuild -p android` to emit `tools:node="remove"`; store build ships only `INTERNET`, `ACCESS_FINE/COARSE_LOCATION`, `MODIFY_AUDIO_SETTINGS`, `VIBRATE`. Motivation: keep "no data collected" Data Safety clean.
- **:265** — `eas.json` `submit.production.android` added.
- **:268** — Play listing prepped: `fastlane/metadata/android/en-US/` + `docs/store/PLAY_LISTING.md`.
- **:290** — 12-tester gate "applies to all personal accounts created after 2023-11-13, regardless of monetization… **it is now the long pole on Android (~3 weeks from account creation)**."
- **:418–419** — "**Android ripple = the entire Android feel budget**"; haptic verbs follow Apple semantics.
- **:412–413** — Maestro/iOS-26 pageSheet workaround, all five suites pass on the iOS release build.
- **No exact-alarm entry exists**, despite `CLAUDE.md:167` pointing here for one.

### `docs/TESTPLAN.md`
- **:10** — E2E explicitly scoped "**Maestro, iOS Simulator**".
- **:15** — Device pass framed as "verify on a physical **iPhone** before external TestFlight" — there is **no Android device-pass section at all**.
- **:19** adhan fires with sound on a locked device; **:20** reschedule after reboot; **:21** background audio under lock + lock-screen controls — all three are exactly the Android-fragile behaviors, and all three are iPhone-scoped.
- **:27** — the single Android mention: "VoiceOver (iOS) / **TalkBack (Android)** pass" (decorative icons hidden on BOTH platforms).

### `docs/BLOCKERS.md`
- **:44–47** — the 12-tester rule stated for the owner; "iOS is unaffected — it can ship while the Android clock runs."
- **:122–150** — **item 1b, Google Play**: "Android is 100% ready too"; $25 personal account; identity verification (real home address, no PO boxes); service-account key + app entry; Google requires the **first build uploaded manually once** before headless uploads work; the 12-tester mechanics (any 12 adults, don't need Android phones to count, must not leave, sign up 15–16 for slack); "**Android is roughly 3 weeks behind** the day you create the account"; recommendation to start Play in parallel with Apple.
- **:326** — "the 14-day clock is the long pole on Android and it runs in the background."

### `docs/TODO.md`
- **:9** (E3, done) — "clip bundled via expo-notifications plugin… **Android channels deferred w/ v1 constitution**".
- **:30** — "On-device iOS Simulator + **Android emulator** visual pass… **iOS⇄Android parity confirmed**" (2026-07-21, i.e. pre-SDK-57).
- **:34, 35, 36, 38, 39, 40** — six features each closed with "verified iOS+Android" (:39 names concrete cases: "iOS 7:103, Android 2:67").
- **:49** — "Publish-prep… **Android permissions trimmed (blocked mic/overlay/storage)**; Play listing + Data Safety prepped… eas Android submit".
- **:50** — owner gate: "(Optional: Google Play $25, **org route to skip the 12-tester wait**.)"
- **:52** — physical-device pass "before external release" — iPhone-shaped, no Android emulator/device equivalent.
- **:120** — open backlog: "Background playback (**UIBackgroundModes audio**), lock-screen controls" — the Android half was never itemized.

### `docs/ANDROID.md` (whole file is Android)
Emulator runbook for the owner: `deendawn_pixel` AVD (Pixel 7 / Android 15), `ANDROID_HOME=/opt/homebrew/share/android-commandlinetools`, `adb reverse tcp:8081 tcp:8081`, `adb shell am start -n com.khavion.deendawn/.MainActivity` (:20–31). **:42–45** — "not the final Play Store build… Android is officially a 'fast-follow' after iOS TestFlight, so a few Android-only polish items (**notification channels, exact-alarm handling**) are deferred." **:51–56** — platform 35, NDK 27 (for `llama.rn`), **JDK 21 required** (system Java 25 too new), debug APK ≈291 MB. **:57–58** — the hyphen→underscore resource-name portability bug.

### `docs/AUDIT.md` (also load-bearing)
**:105** E2E green on both platforms; **:117** Android builds via prebuild+Gradle, `assembleDebug` 5m34s; **:118** "Android-only polish (notification channels, exact-alarm, **Material You**) is deferred"; **:152** "**Android notification reliability unaddressed** — Doze/battery-optimization/exact-alarms make on-time adhan on Android genuinely hard"; **:183** the open research question naming `SCHEDULE_EXACT_ALARM`/`USE_EXACT_ALARM` (API 31+) vs `setAlarmClock`, channels for per-prayer sounds, battery-optimization exemption, foreground-service vs AlarmManager and Play-policy implications. Also `docs/RESEARCH_PROMPT.md:38–39` (same question, prompt form).

---

## 9. Android-only files, and evidence-sweep portability

**Committed Android-only files:** `fastlane/metadata/android/en-US/{title.txt, short_description.txt, full_description.txt}` and `docs/ANDROID.md`. That's all — `docs/store/PLAY_LISTING.md` is referenced by DECISIONS/BLOCKERS but is **not present** in `docs/store/`.

**No `google-services.json` anywhere** (repo-wide find, excluding `node_modules`) — expected, since there's no FCM/push; expo-notifications is local-only. Note the library manifest still registers `ExpoFirebaseMessagingService`, harmless without the file.

**Generated `android/` (gitignored, mtime `Jul 21 17:45` — stale vs `app.json` at `Jul 30 01:12`):**
- `android/app/src/main/AndroidManifest.xml` — merged permissions: `ACCESS_COARSE/FINE_LOCATION`, `INTERNET`, `MODIFY_AUDIO_SETTINGS`, `VIBRATE`, plus the four `tools:node="remove"` entries (:6–10) — matches `DECISIONS.md:264` exactly. `enableOnBackInvokedCallback="false"` (:18) from `predictiveBackGestureEnabled: false`. `screenOrientation="portrait"`, `deendawn://` scheme intent-filter (:31). **No channel/alarm/foreground-service declarations.**
- `android/app/build.gradle:95–96` — `versionCode 1`, `versionName "1.0.0"` (EAS remote overrides at build time).
- `android/gradle.properties:38,42,47,65` — `newArchEnabled=true`, `hermesEnabled=true`, `edgeToEdgeEnabled=true`, `expo.edgeToEdgeEnabled=true`; `:31` all four ABIs (the 291 MB debug APK).
- `android/app/src/main/res/raw/adhan_clip_placeholder.wav` — the sound plugin output.
- `android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml` — background + foreground + **`<monochrome>`** all wired; `ic_launcher_monochrome.webp` present in all five densities.
- **Staleness evidence (needs re-prebuild before any Android work):** `res/values/colors.xml` has `splashscreen_background #ffffff` and `values-night` `#000000`, but `app.json:62,64` now specifies `#F7F6F2` / `#15181D`. `res/values/styles.xml` still carries `android:statusBarColor #ffffff` + `enforceNavigationBarContrast`, i.e. the pre-edge-to-edge theme shape.
- Only two Kotlin files, both stock: `MainActivity.kt`, `MainApplication.kt`. **No hand-written Android native code, no widget provider, no `res/xml/locales_config.xml`.**

**Widget:** `src/features/widget/widgetData.ts` (+ `__tests__/widgetData.test.ts`) is a pure, portable snapshot contract. But `docs/WIDGET.md` is **entirely iOS**: WidgetKit/SwiftUI, App Group entitlement, `@bacons/apple-targets` config plugin (:33–40). No Glance/`AppWidgetProvider` counterpart. `docs/TESTPLAN.md:25` lists the widget as an iPhone device-pass item.

**`scripts/evidence-sweep/` — iOS-simctl-specific, not portable as written:**
- `sweep.sh` — `xcrun simctl terminate|launch|openurl|io … screenshot` (:9,10,13,16). adb analogues exist (`am force-stop`, `am start -a VIEW -d`, `exec-out screencap -p`) but nothing is abstracted.
- `prime.sh` — `xcrun simctl bootstatus|install|launch|terminate|get_app_container`, then `sqlite3` on `$CONT/Documents/SQLite/user.db` (:4–14). On Android the KV DB lives in the app's private `databases/`/`files/` dir, reachable only via `run-as`/`adb shell` on a debuggable build — **the whole seeding mechanism needs rewriting**.
- `cells.sh` — hardcoded iOS simulator UDIDs (:4–7) and `xcrun simctl ui <udid> appearance|content_size` (:15,42,56,61). Android equivalents are `adb shell cmd uimode night yes|no` and `adb shell settings put system font_scale` — different verbs, different granularity, and **`content_size` has no Android analogue** (Android font scale is 1 dimension vs iOS's Dynamic Type ladder), so the 200%-type cells don't map 1:1.
- `resweep.sh`, `manifest.py` — 5 simctl calls / iOS-device metadata table (`manifest.py:3–20` enumerates 8 iPhone/iPad models with iOS versions).
- `m3-*.yaml` (6 flows) — iPad-only, and exist purely to work around an iOS behavior: `README.md:9–11` "iPads re-prompt the 'Open in Deen Dawn?' scheme dialog on EVERY deep link". `README.md:14–21` "Hard-won rules" are all iOS (`simctl ui appearance` going stale, iOS 26 pageSheet tap offsets).
- **`grep -rn "adb" scripts/` → zero hits.** The only adb usage in the repo is prose in `docs/ANDROID.md:29–30`.
- Sibling scripts `scripts/audit-screens.sh` (5 simctl calls) and `scripts/qa-screenshot-routes.sh` (2) are likewise iOS-only. `scripts/dev-audio-server.mjs` binds the `localhost:8083` host that Android can't reach without `adb reverse`.

---
