# TIL — Today I Learned

A running log of bugs, fixes, and lessons from building One Song.

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
