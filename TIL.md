# TIL — Today I Learned

A running log of bugs, fixes, and lessons from building One Song.

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
