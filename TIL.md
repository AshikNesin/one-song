# TIL — Today I Learned

A running log of bugs, fixes, and lessons from building One Song.

---
## 2026-05-02 — Generate App Logos from SVG

### Problem

Need to convert the app's `logo.svg` into platform-specific launcher/app icons for both iOS and Android. SVG cannot be used directly as a launcher icon — both platforms require PNGs in specific sizes.

### Tool

**https://easyappicon.com/** — upload a single square PNG (or SVG converted to PNG), and it generates the full icon set for both platforms.

### Generated Output

After uploading the logo, the tool produces two folders:

**`assets/android/`**
- `mipmap-ldpi/` — 36x36 (low-density screens)
- `mipmap-mdpi/` — 48x48 (baseline)
- `mipmap-hdpi/` — 72x72 (high-density)
- `mipmap-xhdpi/` — 96x96 (extra-high)
- `mipmap-xxhdpi/` — 144x144 (extra-extra-high)
- `mipmap-xxxhdpi/` — 192x192 (extra-extra-extra-high)
- `mipmap-anydpi-v26/` — adaptive icon XML configs (Android 8.0+)
- `values/ic_launcher_background.xml` — background color for adaptive icons
- `ic_launcher-web.png` — 512x512 Play Store icon
- `playstore-icon.png` — 512x512 Play Store icon

**`assets/ios/AppIcon.appiconset/`**
- `Icon-App-20x20@1x.png` through `@3x` — notification icons
- `Icon-App-29x29@1x.png` through `@3x` — settings icons
- `Icon-App-40x40@1x.png` through `@3x` — spotlight icons
- `Icon-App-60x60@2x.png` and `@3x` — app icon on home screen
- `Icon-App-76x76@1x.png` and `@2x` — iPad app icon
- `Icon-App-83.5x83.5@2x` — iPad Pro app icon
- `ItunesArtwork@2x.png` — App Store listing
- `Contents.json` — Xcode asset catalog manifest

### Where to Place the Files

**Android:** Copy all `mipmap-*` folders and `values/` into:
```
android/app/src/main/res/
```

The directory structure must match exactly:
```
android/app/src/main/res/
  mipmap-hdpi/ic_launcher.png
  mipmap-hdpi/ic_launcher_round.png
  mipmap-hdpi/ic_launcher_foreground.png
  mipmap-mdpi/...
  mipmap-xhdpi/...
  mipmap-xxhdpi/...
  mipmap-xxxhdpi/...
  mipmap-anydpi-v26/ic_launcher.xml
  mipmap-anydpi-v26/ic_launcher_round.xml
  mipmap-ldpi/...
  values/ic_launcher_background.xml
```

**iOS:** Copy the entire `AppIcon.appiconset/` folder into:
```
ios/OneSong/Images.xcassets/AppIcon.appiconset/
```

This overwrites the existing `Contents.json` and adds all the PNG files.

### Copy Commands

```bash
# Android
for dir in mipmap-hdpi mipmap-mdpi mipmap-xhdpi mipmap-xxhdpi mipmap-xxxhdpi mipmap-ldpi mipmap-anydpi-v26 values; do
  cp -R assets/android/$dir/* android/app/src/main/res/$dir/
done

# iOS
cp -R assets/ios/AppIcon.appiconset/* ios/OneSong/Images.xcassets/AppIcon.appiconset/
```

Note: `mipmap-anydpi-v26` and `mipmap-ldpi` may not exist in a fresh React Native project — create them first with `mkdir -p`.

### Verification

- **Android:** Rebuild and install. The app icon on the launcher should show the custom logo instead of the default React Native robot.
- **iOS:** Open `ios/OneSong.xcworkspace` in Xcode, verify the AppIcon asset catalog shows all sizes with the custom logo, then build.

### Lesson

- Launcher icons are a native concern, not a React Native concern. The JS bundle has no control over them.
- Keep the generated source files in `assets/android/` and `assets/ios/` as a backup/reference, then copy into the native projects. This makes it easy to regenerate and re-apply if the logo changes.
- Adaptive icons (Android 8.0+) require both a foreground PNG and a background color/XML. The `mipmap-anydpi-v26/` configs reference these layers separately.
- iOS requires a `Contents.json` manifest that lists every icon size and scale. Xcode uses this to validate the asset catalog — missing entries cause build warnings.

## 2026-05-02 — PlayerScreen loading state: why it exists and how to make it subtle

### Problem

`PlayerScreen` showed a bold **"Loading..."** text at the top of the screen while the app initialized. It felt jarring and out of place for a minimal app.

### Root Cause

The `isReady` flag gates rendering until three async init steps complete:

1. `setupPlayer()` — initializes react-native-track-player's native audio session (the slowest step)
2. `getSong()` + `getSleepTimer()` — reads persisted state from AsyncStorage
3. `loadSong()` + `getPlaybackState()` — restores the last track and playback state

`setupPlayer()` in particular has native overhead, so the screen can't render in a valid state immediately.

### Fix

Replaced the text with a small, semi-transparent `ActivityIndicator`:

**`src/screens/PlayerScreen.tsx`**
```tsx
import { ActivityIndicator, ... } from 'react-native';

if (!isReady) {
  return (
    <View style={[styles.container, styles.loadingContainer]}>
      <ActivityIndicator size="small" color="rgba(255,255,255,0.4)" />
    </View>
  );
}
```

Styles:
```tsx
loadingContainer: {
  justifyContent: 'center',
},
```

### Verification

Launched the app. The spinner appears centered and fades into the black background instead of shouting "Loading..." at the user.

### Lesson

- Native module initialization (`setupPlayer()`) is the main reason a loader is unavoidable in audio apps. You can't render playable controls before the engine is ready.
- `ActivityIndicator` with low-opacity white (`rgba(255,255,255,0.4)`) and `size="small"` is a standard, subtle pattern for dark-themed apps.
- If even the spinner feels like too much, the next step would be to render the full UI skeleton immediately but keep controls disabled until `isReady` flips. That's more work but eliminates the blank-screen phase entirely.

---

## 2026-05-02 — `ReferenceError: Property 'window' doesn't exist` on app launch (Hermes + RN 0.85)

### Problem

App crashed on launch with a red screen:

```
ReferenceError: Property 'window' doesn't exist
```

Stack trace pointed to `anonymous@65807:26` — a minified Metro bundle location.

### Root Cause

React Native 0.85's `Libraries/Core/setUpReactDevTools.js` contains this line in debug mode:

```javascript
if (!window.document) {
```

Hermes (the default JS engine) does **not** define `window` as a global binding. Unlike JSC or browsers, accessing an undeclared identifier in Hermes throws a `ReferenceError` rather than returning `undefined`.

The code only runs when:
1. `__DEV__` is `true` (debug builds)
2. The React DevTools initialization path is hit

This is a **latent upstream bug** in React Native 0.85 — it was always present but may have been masked by:
- Metro serving a stale cached bundle
- Testing release builds (this code is stripped in release)
- The dev server failing to connect, bypassing the DevTools setup

### Fix

Guard the `window` access with a `typeof` check before dereferencing it:

**File:** `node_modules/react-native/Libraries/Core/setUpReactDevTools.js` (line 133)

```javascript
// Before
if (!window.document) {

// After
if (typeof window === 'undefined' || !window.document) {
```

### Persisting the fix

Since this is a `node_modules` change, it will be lost on reinstall. Applied the fix via `pnpm patch`:

```bash
pnpm patch react-native@0.85.2
# edit the file in the temp patch directory
pnpm patch-commit '/Users/ashiknesin/Code/one-song/node_modules/.pnpm_patches/react-native@0.85.2'
```

This creates `patches/react-native@0.85.2.patch` and registers it in `pnpm-workspace.yaml`. The patch auto-applies on every `pnpm install`.

### Verification

Rebuilt the debug APK, installed via `adb`, and launched. Logcat showed no `ReferenceError` — app starts cleanly.

### Lesson

- Hermes handles undeclared globals differently from JSC. Always use `typeof foo !== 'undefined'` before accessing a global that may not exist.
- React Native debug-only code paths (DevTools, Fast Refresh, etc.) can contain bugs that never surface in release builds.
- When a crash appears "suddenly" with no code changes, suspect: Metro cache invalidation, dev server state changes, or a previously bypassed code path finally executing.
- `pnpm patch` (or `patch-package` for npm/yarn) is the standard way to persist `node_modules` fixes. Don't leave them as manual edits.

---

## 2026-05-02 — App display name shows "OneSong" instead of "One Song"

### Problem

After installing the app on a device, the launcher label showed **"OneSong"** (no space) instead of the intended **"One Song"**.

### Root Cause

The app name was set to the camelCase project name in three places:

1. `app.json` — `displayName` field used by React Native CLI
2. `ios/OneSong/Info.plist` — `CFBundleDisplayName` (iOS launcher label)
3. `android/app/src/main/res/values/strings.xml` — `app_name` (Android launcher label)

### Fix

Updated all three files to include the space:

**`app.json`**
```json
{
  "name": "OneSong",
  "displayName": "One Song"
}
```

**`ios/OneSong/Info.plist`**
```xml
<key>CFBundleDisplayName</key>
<string>One Song</string>
```

**`android/app/src/main/res/values/strings.xml`**
```xml
<string name="app_name">One Song</string>
```

### Verification

Rebuilt and reinstalled the app. Launcher now shows **"One Song"** correctly on both iOS and Android.

### Lesson

- `name` (internal project name) and `displayName` (user-facing label) are separate in React Native. Only `displayName` needs the space.
- iOS and Android store their launcher labels in separate files. Both must be updated manually — changing `app.json` alone does not sync to native projects after they've been generated.
- Always verify the actual installed app label, not just the project name in code.

---

## 2026-05-02 — Build failure: invalid JAVA_HOME + stale autolinking cache + install timeout

### Problem

`pnpm react-native run-android` failed with three separate issues:

1. **`JAVA_HOME is set to an invalid directory: /Library/Java/JavaVirtualMachines/amazon-corretto-8.jdk/Contents/Home`**  
   The environment variable pointed to a deleted Java 8 install. Gradle refused to start.

2. **`package com.onesong does not exist`**  
   The autolinking-generated `ReactNativeApplicationEntryPoint.java` still referenced `com.onesong.BuildConfig` even though the bundle ID had been renamed to `io.nesin.onesong`. Running `./gradlew clean` did not clear the stale generated file or the cached `autolinking.json`.

3. **`com.android.ddmlib.ShellCommandUnresponsiveException`** during `:app:installDebug`  
   After the APK compiled successfully, Gradle's install task hung for ~5 min and then crashed while trying to push the APK to the connected Pixel device.

### Root Cause

- **JAVA_HOME**: An old shell config (or system default) was setting `JAVA_HOME` to a Java 8 path that no longer existed. The project actually needs Java 17 (configured in `gradle.properties`), but Gradle itself also needs a valid `JAVA_HOME` to launch.
- **Stale autolinking**: React Native's autolinking caches the Android package name in `android/build/generated/autolinking/autolinking.json` and in the Gradle execution history (`android/.gradle/9.3.1/executionHistory/executionHistory.bin`). `./gradlew clean` only cleans `android/app/build/`, not the root `.gradle/` or the autolinking JSON. The generator reads from these caches and reproduces the old package name on every build.
- **Install timeout**: Gradle's built-in device install task sometimes times out on certain USB connections or when the device is busy. Using `adb install` directly bypasses Gradle's wrapper and succeeds immediately.

### Fix

1. **Set valid JAVA_HOME and add Android SDK to PATH** before every build:
   ```bash
   export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
   export ANDROID_HOME="$HOME/Library/Android/sdk"
   export PATH="$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools:$PATH"
   ```

2. **Delete stale caches** after any bundle ID rename:
   ```bash
   rm -rf android/.gradle/9.3.1/executionHistory/executionHistory.bin
   rm -rf android/build/generated/autolinking/autolinking.json
   rm -rf android/app/build/generated/autolinking
   ```

3. **Install APK directly with adb** when Gradle install hangs:
   ```bash
   adb install -r android/app/build/outputs/apk/debug/app-arm64-v8a-debug.apk
   adb shell am start -n io.nesin.onesong/.MainActivity
   ```

### Learning

- `./gradlew clean` is not enough when React Native autolinking is involved. The autolinking JSON and Gradle execution history live outside `app/build/` and must be wiped manually after structural changes like a package rename.
- Always verify `JAVA_HOME` and `ANDROID_HOME` before debugging Android build issues. Many cryptic Gradle errors trace back to missing or invalid environment variables.
- When Gradle's install task fails with a device timeout, the APK is usually already built successfully. Switch to direct `adb install` as a reliable fallback.

---

---

## 2026-05-02 — Renamed Android Bundle ID from com.onesong to io.nesin.onesong

### Problem

The app used the default `com.onesong` bundle ID. The owner owns `nesin.io` and wanted the package name to reflect their domain.

### Root Cause

Starter templates (like React Native CLI init) generate a placeholder bundle ID. It's meant to be changed before shipping.

### Fix

Changed every reference from `com.onesong` to `io.nesin.onesong`:

**1. `android/app/build.gradle`**
```gradle
android {
    namespace "io.nesin.onesong"
    defaultConfig {
        applicationId "io.nesin.onesong"
    }
}
```

**2. `MainApplication.kt`** — updated package declaration:
```kotlin
package io.nesin.onesong
```

**3. `MainActivity.kt`** — updated package declaration:
```kotlin
package io.nesin.onesong
```

**4. Directory structure** — moved files to match the new package:
```
android/app/src/main/java/
  com/onesong/          → deleted
  io/nesin/onesong/     → created
    MainApplication.kt
    MainActivity.kt
```

### Verification

```bash
grep -r "com\.onesong" android/
# No output — no stale references remain.
```

Build: **SUCCESSFUL** — app installs and runs with the new bundle ID.

### Lesson

- The Android package name must match the directory structure exactly. Moving files without updating the `package` declaration (or vice versa) causes a build error.
- `namespace` (for Gradle's build system) and `applicationId` (for the Play Store / device) are separate fields. For most apps they should be identical, but they can differ if needed (e.g., flavor-specific IDs).
- Reverse-domain notation (`io.nesin.onesong`) is the Android convention. It ensures global uniqueness.
- iOS uses a separate bundle identifier. If building for iOS later, update `ios/OneSong/Info.plist` → `CFBundleIdentifier` to match.

---

## 2026-05-01 — Android Build Failures: Java Version & Missing SDK Tools

### Problem

Running `pnpm react-native run-android` failed with multiple cascading errors:

1. `JAVA_HOME is set to an invalid directory: /Library/Java/JavaVirtualMachines/amazon-corretto-8.jdk/Contents/Home`
2. `adb: command not found`
3. `No connected devices!` / `No emulators found as an output of emulator -list-avds`

### Root Cause

**Java mismatch:** The system default Java was OpenJDK 25 (installed via Homebrew), but the Android NDK/CMake toolchain used by React Native's new architecture does not yet support Java 25. It throws `restricted method in java.lang.System` errors during native compilation.

**Missing PATH entries:** The Android SDK `platform-tools` (contains `adb`) and `emulator` directories were not in the shell `PATH`, so the React Native CLI couldn't find them.

**No running emulator:** No Android Virtual Device (AVD) was booted at the time of the install command.

### Fix

**1. Pin the Android build to OpenJDK 17**

OpenJDK 17 is the highest LTS version that React Native's native build pipeline supports reliably. It was already installed via Homebrew at:

```
/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
```

Point Gradle to it in `android/gradle.properties`:

```properties
org.gradle.java.home=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
```

This leaves the system default (`java -version` → 25) untouched while forcing the Android build to use 17.

**2. Export JAVA_HOME for the CLI session**

When running `react-native run-android` directly, the CLI also needs `JAVA_HOME` set to 17:

```bash
export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
```

**3. Add Android SDK tools to PATH**

```bash
export ANDROID_HOME="$HOME/Library/Android/sdk"
export PATH="$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools:$PATH"
```

**4. Start the emulator before installing**

```bash
emulator -avd Pixel_7a -no-snapshot-load
```

Then wait for `adb shell getprop sys.boot_completed` to return `1` before running `react-native run-android`.

### Verification

```bash
# Check Gradle uses Java 17
cd android && ./gradlew clean assembleDebug

# Check emulator is detected
adb devices

# Full run
export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
export PATH="$HOME/Library/Android/sdk/emulator:$HOME/Library/Android/sdk/platform-tools:$PATH"
pnpm react-native run-android
```

Build: **SUCCESSFUL** — app installed and launched on `Pixel_7a`.

### Lesson

- React Native's New Architecture (TurboModules/Fabric) + NDK/CMake is sensitive to the Java version. Don't assume your system default Java works for Android builds.
- `org.gradle.java.home` only fixes Gradle itself — the React Native CLI may still pick up a broken `JAVA_HOME` from the environment. Set both.
- Always check `adb devices` and `emulator -list-avds` before blaming the build. The error `No connected devices!` often means the emulator simply isn't running, not that the build is broken.
- Documenting the exact paths (`/opt/homebrew/opt/openjdk@17`, `~/Library/Android/sdk`) saves future debugging time on Apple Silicon Macs where Homebrew uses `/opt/homebrew`.

---

## 2026-05-02 — Android APK Size: CPU Architectures & ABI Splitting

### Problem

Release APK was **56 MB** — far above the PRD target of 15 MB.

### Root Cause

React Native starter templates bundle **native libraries for four CPU architectures** into a single APK:

| Architecture | What it is | Devices |
|---|---|---|
| **arm64-v8a** | 64-bit ARM (AArch64) | Modern phones: Pixel 7a, Galaxy S24, iPhone 15+ |
| **armeabi-v7a** | 32-bit ARM | Old/low-end phones pre-2015 |
| **x86** | 32-bit Intel/AMD | Android emulators, some tablets/Chromebooks |
| **x86_64** | 64-bit Intel/AMD | Android emulators, Chromebooks |

Each architecture needs its own compiled `.so` files (C++ libraries for React Native, track-player, screens, etc.). When all four are packed into one APK, the device only uses one set and the rest is dead weight.

### Fix

Split the APK by ABI (Application Binary Interface) and build only for the target architecture.

In `android/app/build.gradle`, add a `splits` block inside the `android` block:

```gradle
android {
    splits {
        abi {
            enable true
            reset()
            include "arm64-v8a"
            universalApk false
        }
    }
    // ... rest of config
}
```

- `enable true` — turn on ABI splitting
- `reset()` — clear the default list
- `include "arm64-v8a"` — only build for 64-bit ARM
- `universalApk false` — don't also build a fat APK

### Verification

Build release APK:

```bash
pnpm react-native run-android --mode=release
```

Output path changes from:
- `app-release.apk` (56 MB, all architectures)

To:
- `app-arm64-v8a-release.apk` (~14 MB, single architecture)

That's a **75% size reduction**.

### Lesson

- **arm64-v8a** is the architecture for virtually all modern Android phones (2015+). Targeting only this is reasonable for a mobile-first app.
- If you need to support emulators (x86/x86_64) or older 32-bit devices, add those architectures back to the `include` list or set `universalApk true` for a fallback fat APK.
- ABI splitting is a Gradle/Android feature, not React Native-specific. It works for any Android app with native libraries.
- Google Play's App Bundle (AAB) does this automatically per-device. APK splitting is the manual equivalent when distributing APKs directly.

---

## How to Add a New Entry

Copy the template below, fill it in, and prepend it to the top of this file (newest first).

```markdown
## YYYY-MM-DD — Short Title

### Problem

What went wrong? Include exact error messages.

### Root Cause

Why did it happen? Link to docs or upstream issues if relevant.

### Fix

Step-by-step what changed. Include file paths and code snippets.

### Verification

How did you confirm it's fixed?

### Lesson

What should you (or the next person) do differently next time?

---
```
