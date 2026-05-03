# TIL — Today I Learned

A running log of bugs, fixes, and lessons from building One Song.

---

## 2026-05-03 — FLEXIBLE In-App Update Downloaded But Never Installed

### Problem

The in-app update dialog appeared, user tapped "Update", and the update downloaded in the background. But it was never actually installed — the app stayed on the old version. On subsequent cold starts, the update dialog never appeared again. The update was stuck in a downloaded-but-not-installed state.

### Root Cause

`sp-react-native-in-app-updates` with `IAUUpdateKind.FLEXIBLE` on Android uses Google Play Core to download the update in the background. After downloading, you **must** call `installUpdate()` to trigger the actual installation. The old code called `startUpdate()` and then did nothing — fire-and-forget. There was no status listener registered to detect when the download completed.

On subsequent cold starts, `checkNeedsUpdate()` still returned `shouldUpdate: true` (the app was still the old version), but calling `startUpdate()` when a flexible update is already downloaded doesn't show the dialog again — Play Core silently completes and waits for `installUpdate()`.

### Fix

**Register a status listener before calling `startUpdate()`** and call `installUpdate()` when the status reaches `DOWNLOADED`:

```typescript
private startFlexibleUpdate(): void {
  if (!this.inAppUpdates) {
    return;
  }

  this.inAppUpdates.addStatusUpdateListener(
    (status: StatusUpdateEvent) => {
      if (status.status === INSTALL_STATUS.DOWNLOADED) {
        this.inAppUpdates?.installUpdate();
      }
    },
  );

  const updateOptions: StartUpdateOptions = {
    updateType: IAUUpdateKind.FLEXIBLE,
  };
  this.inAppUpdates.startUpdate(updateOptions);
}
```

This handles both scenarios:
1. **First download:** Listener fires `DOWNLOADED` when the background download finishes → `installUpdate()` triggers installation
2. **Cold start with already-downloaded update:** `startUpdate()` completes immediately (Play Core detects the update is already downloaded) → listener fires `DOWNLOADED` immediately → `installUpdate()` triggers installation

The listener must be registered **before** calling `startUpdate()` — Play Core sends status callbacks and if you register after, you missed them.

### Verification

- Unit tests confirm the listener calls `installUpdate()` on `DOWNLOADED` and ignores other statuses (`DOWNLOADING`, etc.)
- Cold start scenario tested manually on device: update downloaded in previous session, app reopened, `installUpdate()` was called immediately

### Lesson

- **FLEXIBLE in-app updates are NOT fire-and-forget.** You must listen for the `DOWNLOADED` status and call `installUpdate()`. Without this, the update downloads to the device but never installs.
- **`installUpdate()` is a separate API from `startUpdate()`.** Play Core splits download and install into two steps for flexible updates. If you want immediate install, use `IAUUpdateKind.IMMEDIATE` instead (but it blocks the app UI during download).
- **`startUpdate()` is idempotent for already-downloaded updates.** On cold start, you can safely call `startUpdate()` again — Play Core detects the pending download and fires `DOWNLOADED` immediately rather than re-downloading. This means a properly implemented status listener fixes both the initial download AND cold start scenarios.
- **Register listeners before the action.** `addStatusUpdateListener` must be called before `startUpdate()` — status callbacks fire synchronously for already-completed states, and you could miss the `DOWNLOADED` event if you register after.

---

## 2026-05-03 — In-App Update Crash in Release Builds (ProGuard/R8)

### Problem

App crashed on startup in Play Console internal testing, but worked fine in local debug builds. Logcat showed:

```
com.facebook.react.common.JavascriptException: Error: react-native-device-info: NativeModule.RNDeviceInfo is null.
```

The crash originated from `sp-react-native-in-app-updates`, which depends on `react-native-device-info` to read the current app version.

### Root Cause

Three separate issues (discovered iteratively):

1. **Transitive dependency version mismatch:** `sp-react-native-in-app-updates` depends on `react-native-device-info@10.3.0`, which is too old for React Native 0.85. The native module doesn't link properly with the newer React Native architecture, causing a null native module error even in debug.

2. **ProGuard/R8 obfuscates `sp-react-native-in-app-updates` classes:** The app has `minifyEnabled true` in `android/app/build.gradle`. `sp-react-native-in-app-updates` doesn't ship ProGuard rules, so R8 obfuscates its Java classes (`com.sudoplz.rninappupdates.**`) and the `@ReactModule` annotation metadata. React Native's autolinking can't discover the module at runtime, so `NativeModules.SpInAppUpdates` is null.

3. **ProGuard/R8 also obfuscates `react-native-device-info` classes:** Even after fixing #1 and #2, the crash persisted. Checking the R8 mapping file (`android/app/build/outputs/mapping/release/mapping.txt`) revealed that `com.learnium.RNDeviceInfo.RNDeviceInfo` (the React package class that registers the module) was being renamed to `com.learnium.RNDeviceInfo.b`. The React module itself (`RNDeviceModule`) was preserved, but the package class responsible for module registration was obfuscated, breaking React Native's autolinking — even though `sp-react-native-in-app-updates` was now properly preserved.

Debug builds don't run ProGuard, which is why the crash only appeared in release builds distributed through Play Console.

### Fix

**1. Override the transitive dependency with a compatible version:**

```bash
pnpm add react-native-device-info
```

This installs `react-native-device-info@15.0.2` (latest), which is compatible with RN 0.85. The override is automatically picked up because pnpm's node_modules resolution prefers the direct dependency over the transitive one.

**2. Add ProGuard keep rules** in `android/app/proguard-rules.pro` for BOTH libraries:

```proguard
# react-native-device-info
-keep class com.learnium.RNDeviceInfo.** { *; }

# sp-react-native-in-app-updates
-keep class com.sudoplz.rninappupdates.** { *; }
-keepclassmembers class * {
    @com.facebook.react.module.annotations.ReactModule <methods>;
}
-keep class com.google.android.play.core.appupdate.** { *; }
-keep class com.google.android.play.core.install.** { *; }
-keep class com.google.android.play.core.tasks.** { *; }
```

The `react-native-device-info` rule is critical — without it, R8 renames the React package class from `RNDeviceInfo` to `b`, breaking autolinking even though the actual module code is preserved.

**3. Make the JS code defensive** in `src/services/InAppUpdateService.ts`:

```typescript
import { NativeModules, Platform } from 'react-native';
import SpInAppUpdates, { IAUUpdateKind, ... } from 'sp-react-native-in-app-updates';

class InAppUpdateService {
  private inAppUpdates: SpInAppUpdates | null = null;

  constructor() {
    if (!__DEV__ && NativeModules.SpInAppUpdates) {
      try {
        this.inAppUpdates = new SpInAppUpdates(false);
      } catch (_e) {
        this.inAppUpdates = null;
      }
    }
  }

  async checkAndPromptUpdate(): Promise<void> {
    if (__DEV__ || !this.inAppUpdates) {
      return;
    }
    // ... rest of update check
  }
}
```

This prevents the service from instantiating if the native module is missing, and skips update checks entirely in dev mode.

### Verification

1. Added `-keep class com.learnium.RNDeviceInfo.** { *; }` to `android/app/proguard-rules.pro`
2. Cleared build cache (`rm -rf android/app/build android/.gradle`)
3. Rebuilt release AAB with `pnpm android:release` (confirmed `minifyReleaseWithR8` re-ran)
4. Checked `seeds.txt` — all `com.learnium.RNDeviceInfo.**` classes are now preserved
5. Checked `mapping.txt` — `RNDeviceInfo` and `RNDeviceModule` are no longer renamed
6. Launched the installed app on test device — confirmed via `adb shell am start` that the crash no longer occurs

### Lesson

- **R8 obfuscates ALL native module package classes, not just the module itself.** The React module class (`RNDeviceModule`) was preserved in `seeds.txt`, but the package class (`RNDeviceInfo`) that registers it was being renamed. Always check the mapping file (`mapping.txt`), not just `seeds.txt`, to confirm classes aren't being renamed.
- **Every React Native library with native Android code needs a ProGuard rule.** When `minifyEnabled true`, you need `-keep` rules for every library that registers native modules — even transitive dependencies like `react-native-device-info` used by `sp-react-native-in-app-updates`.
- **Use `mapping.txt` to verify R8 behavior, not `seeds.txt`.** `seeds.txt` only shows classes that R8 considers entry points. A class can appear in seeds but still have its package class (used for registration) renamed in mapping.
- **Native module libraries often don't ship ProGuard rules.** When `minifyEnabled true` is set, you must manually add `-keep` rules for any library that uses React Native's native module system. The `@ReactModule` annotation is particularly fragile — R8 strips it by default, breaking autolinking.
- **Transitive dependencies can pin outdated versions.** Always check what version a library pulls in. `pnpm ls react-native-device-info` showed `10.3.0` (from the library) alongside `15.0.2` (direct install). The direct install wins, but only if you add it explicitly.
- **Debug builds are not representative of release behavior.** ProGuard/R8 only runs in release builds. A library that works locally can crash in production. Always test release builds through Play Console internal testing before promoting to production.
- **Defensive JS coding around native modules is cheap insurance.** Checking `NativeModules.SpInAppUpdates` before instantiating prevents a hard crash even if the native side fails to link for any reason (ProGuard, architecture mismatch, missing dependency).

---

## 2026-05-03 — Google Play Rejects Build: "Version code 1 has already been used"

### Problem

Google Play Console rejected the upload with:

> Version code 1 has already been used. Try another version code.

Even though `versionName` had been bumped from `"0.0.1"` to `"0.0.2"`.

### Root Cause

`versionCode` and `versionName` serve different purposes:

- **`versionCode`** (integer) — Google Play's internal identifier. Must be strictly increasing for every upload. This is what the error refers to.
- **`versionName`** (string) — user-facing version label. Cosmetic only. Has no effect on Play Console rejection.

Only `versionName` was bumped. `versionCode` was still `1`, matching the previous upload.

### Fix

Bump `versionCode` alongside `versionName` in `android/app/build.gradle`:

```gradle
versionCode 2
versionName "0.0.2"
```

Also created `scripts/bump-android-version.sh` to automate this — bumps patch semver in `versionName` in `build.gradle`, increments `versionCode` by 1, and updates `package.json` version to match.

### Lesson

- Google Play only cares about `versionCode` for uniqueness. `versionName` is cosmetic.
- Both must be bumped together. Never bump one without the other.
- Automate version bumps — manual edits to two fields across two files (`build.gradle` + `package.json`) are error-prone.

---

## 2026-05-02 — Android Release Build Signed with Debug Certificate

### Problem

Google Play rejected the release AAB with:

> You uploaded an APK or Android App Bundle that was signed in debug mode. You need to sign your APK or Android App Bundle in release mode.

### Root Cause

In `android/app/build.gradle`, the `release` build type was incorrectly configured to use the debug signing config:

```gradle
buildTypes {
    release {
        signingConfig signingConfigs.debug  // <-- wrong
        ...
    }
}
```

This meant `bundleRelease` produced an AAB signed with `debug.keystore`, which Play Store rejects.

### Fix

1. **Added a `release` signing config** that reads credentials from environment variables:

```gradle
signingConfigs {
    debug { ... }
    release {
        storeFile file('upload-keystore.jks')
        storePassword System.getenv('KEYSTORE_PASSWORD') ?: ''
        keyAlias System.getenv('KEY_ALIAS') ?: ''
        keyPassword System.getenv('KEY_PASSWORD') ?: ''
    }
}
```

2. **Pointed the `release` build type to the new signing config:**

```gradle
buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled enableProguardInReleaseBuilds
        proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
    }
}
```

3. **Updated `scripts/build-android-signed.sh`** to validate credentials and keystore before building, and use `trap` for guaranteed cleanup:

```bash
# Validate credentials
if [ -z "$KEYSTORE_PASSWORD" ] || [ -z "$KEY_ALIAS" ] || [ -z "$KEY_PASSWORD" ]; then
  echo "❌ Error: Failed to fetch one or more signing credentials from 1Password."
  exit 1
fi

# Validate keystore download
if [ ! -f "$KEYSTORE_PATH" ]; then
  echo "❌ Error: Failed to download keystore file from 1Password."
  exit 1
fi

# Ensure cleanup happens even if build fails
cleanup() {
  echo "🧹 Cleaning up keystore..."
  rm -f "$KEYSTORE_PATH"
}
trap cleanup EXIT
```

### Verification

Ran `scripts/build-android-signed.sh` and confirmed the output AAB is signed with the upload keystore:

```bash
jarsigner -verify -verbose -certs android/app/build/outputs/bundle/release/app-release.aab
```

Output shows the certificate is issued by the upload keystore, not the Android debug certificate.

### Lesson

- React Native's starter template defaults `release` builds to `signingConfigs.debug` as a convenience. You **must** change this before shipping to production.
- The `signingConfigs.release` block should use `System.getenv()` to read secrets, not hardcode them. This pairs well with a build script that fetches credentials from a secrets manager (1Password, etc.).
- Always validate that credentials and files were actually fetched before starting the Gradle build. Silent failures in `op read` produce empty strings, which Gradle accepts but produces an invalid signature.
- Use `trap cleanup EXIT` in shell scripts to ensure sensitive files (keystores) are deleted even if the build crashes or is interrupted.

---

## 2026-05-02 — Metadata Extraction in React Native

### `react-native-fs.read()` length defaults to 0, not "read all"

`read(filepath, length, position, encoding)` — if `length` is `0`, it reads **zero bytes**. You must explicitly pass a chunk size (e.g. `256 * 1024`).

### `atob`/`btoa` don't exist in React Native

Hermes/JavaScriptCore doesn't provide `atob`/`btoa`. Use the `buffer` package (`Buffer.from(data, 'base64')`) instead.

### ID3 tags are MP3-only

`id3-parser` only reads ID3 tags. M4A/MP4 files store metadata in **MP4 atoms**, not ID3 tags. You need a separate parser for MP4.

### MP4 atom hierarchy for metadata

Metadata lives inside: `moov` → `udta` → `meta` → `ilst`

- `meta` is a "full box" — it has a 4-byte version/flags header **before** its children
- `udta` is a regular container — **no** header skip before its children

### MP4 `data` atom type indicator is the first byte

The `data` atom's first byte indicates encoding/format:
- `0x01` = UTF-8 text
- `0x0D` = JPEG image
- `0x0E` = PNG image

Read it as `data[0]`, not as a big-endian uint32 (`readUInt32BE` gives `0x01000000`).

### Artwork as `file://` path > base64 data URI

Both React Native `<Image>` and `react-native-track-player` support `file://` URIs. Saving extracted artwork to the cache directory as a file and storing the path is more reliable than base64 data URIs (no AsyncStorage bloat, no encoding overhead).

### Path aliases in React Native (Metro + TypeScript + Jest)

To use `@/` aliases across the entire RN toolchain, you need three separate configs — they don't share resolution:

1. **TypeScript** (`tsconfig.json`) — `baseUrl` + `paths` for type-checking and IDE autocomplete
2. **Metro** (`metro.config.js`) — custom `resolveRequest` in `resolver` for runtime bundling (Metro doesn't read tsconfig paths)
3. **Jest** (`jest.config.js`) — `moduleNameMapper` for test resolution

No extra dependency needed if you're on RN 0.72+ (Metro has native alias support). For Jest, map `@/(.*)` to `<rootDir>/src/$1` and add a special case for `@/App` if it lives outside `src/`.

---
## 2026-05-02 — Android 12+ Double Splash Screen: System Splash vs Custom SplashActivity

### Problem

The Android launch screen showed the app logo **twice** in quick succession — a "double splash" effect. Previous fixes (changing `windowBackground` to solid black, deleting old drawables, running `./gradlew clean`) had no effect.

### Root Cause

Android 12+ (API 31+) **mandates a system splash screen** that automatically displays the app's launcher icon (`ic_launcher`) before any app code runs. This is controlled by the OS, not by the app.

Our architecture had two independent splash mechanisms:
1. **System splash screen** (Android 12+ mandatory) — shows `ic_launcher` icon automatically
2. **Custom `SplashActivity`** — renders `launch_screen.xml` with `@mipmap/ic_launcher_foreground` (same icon)

Both showed the same logo, creating the double flash.

### Why Previous Fixes Failed

- `windowBackground` changes only affect the preview window, not the Android 12+ system splash
- `./gradlew clean` doesn't help — the system splash is generated at runtime by the OS
- The Android 12+ system splash is **mandatory and cannot be disabled**

### Fix

Removed `SplashActivity` entirely and made `MainActivity` the launcher. The Android 12+ system splash now shows the icon once (customized with black background). `MainActivity` loads directly after.

**Files changed:**

1. **Deleted** `SplashActivity.kt` and `res/layout/launch_screen.xml`
2. **Updated `AndroidManifest.xml`** — `MainActivity` is now the launcher with `SplashTheme`:
   ```xml
   <activity
     android:name=".MainActivity"
     android:theme="@style/SplashTheme"
     ...>
     <intent-filter>
       <action android:name="android.intent.action.MAIN" />
       <category android:name="android.intent.category.LAUNCHER" />
     </intent-filter>
   </activity>
   ```
3. **Updated `MainActivity.kt`** — switches from `SplashTheme` to `AppTheme` in `onCreate()`:
   ```kotlin
   override fun onCreate(savedInstanceState: Bundle?) {
       setTheme(R.style.AppTheme)
       super.onCreate(savedInstanceState)
   }
   ```
4. **Created `values-v31/styles.xml`** — customizes the Android 12+ system splash:
   ```xml
   <style name="SplashTheme" parent="Theme.AppCompat.DayNight.NoActionBar">
       <item name="android:windowSplashScreenBackground">@color/splash_background</item>
       <item name="android:windowSplashScreenAnimatedIcon">@mipmap/ic_launcher_foreground</item>
       <item name="android:windowSplashScreenIconBackgroundColor">@color/splash_background</item>
       <item name="android:windowSplashScreenAnimationDuration">300</item>
   </style>
   ```
5. **Updated `values/styles.xml`** — added `windowBackground` to `AppTheme` for seamless transition from splash to app

### Trade-off

The Android 12+ system splash screen **cannot render text**. "One Song" text that was previously shown below the logo in `SplashActivity` must now be shown in the React Native app's initial loading/landing screen instead.

### Verification

1. `./gradlew clean`
2. Rebuild and install
3. Launch — logo appears **once** on black background, then transitions to the app
4. No double logo flash

### Lesson

- Android 12+ introduced a **mandatory system splash screen** that uses the app's launcher icon. It appears before `onCreate()` runs and cannot be disabled.
- Having both a system splash AND a custom `SplashActivity` that shows the same icon causes an unavoidable double splash on Android 12+ devices.
- The standard Android 12+ pattern is: customize the system splash (background color, icon) via `values-v31/styles.xml`, then let `MainActivity` load directly. No separate `SplashActivity` needed.
- System splash attributes (`windowSplashScreenBackground`, `windowSplashScreenAnimatedIcon`, etc.) only exist on API 31+. Use `values-v31/styles.xml` so they don't break builds on older devices.
- `MainActivity` must call `setTheme(R.style.AppTheme)` before `super.onCreate()` when using `SplashTheme` as the launcher theme, or the splash background will persist after the app loads.

---
## 2026-05-02 — Custom Launch Screen with Black Background and Logo

### Problem

The default launch screen showed a gray background with "OneSong" text and "Powered by React Native" at the bottom. The app uses a dark theme (`#000` backgrounds, white text) so the gray launch screen felt jarring and off-brand.

### Root Cause

React Native's iOS template generates a `LaunchScreen.storyboard` with `systemBackgroundColor` (white/light gray) and default labels. Android uses the app theme's default window background (also light gray on most devices). Neither matches the app's dark aesthetic.

### Fix

**iOS — `LaunchScreen.storyboard`**

Rewrote the storyboard to use a pure black background (`#000`), centered logo image, and "One Song" text in white below it:

1. Added a `LaunchLogo` image set to `Images.xcassets/` (reused the 1024x1024 App Store artwork)
2. Set view background to black: `<color key="backgroundColor" white="0.0" alpha="1" .../>`
3. Replaced default labels with an `imageView` (logo, 120x120pt) and a `label` ("One Song", bold 36pt, white)
4. Centered both vertically with Auto Layout constraints

**Android — `SplashActivity` with layout (needed for text)**

Android `windowBackground` drawables (layer-lists, bitmaps, colors) cannot render text. To show "One Song" below the logo, a full layout + dedicated `SplashActivity` is required:

1. Created `res/layout/launch_screen.xml` — black background with centered logo and text:
   ```xml
   <RelativeLayout android:background="#000000" ...>
       <ImageView android:src="@mipmap/ic_launcher_foreground" ... />
       <TextView android:text="One Song" android:textColor="#FFFFFF" ... />
   </RelativeLayout>
   ```

2. Created `SplashActivity.kt` — shows the layout and hands off to `MainActivity` after a short delay so the text is actually visible:
   ```kotlin
   class SplashActivity : AppCompatActivity() {
       override fun onCreate(savedInstanceState: Bundle?) {
           super.onCreate(savedInstanceState)
           setContentView(R.layout.launch_screen)

           Handler(Looper.getMainLooper()).postDelayed({
               startActivity(Intent(this, MainActivity::class.java))
               finish()
           }, 800)
       }
   }
   ```

3. Made `SplashActivity` the launcher entry point in `AndroidManifest.xml`:
   ```xml
   <activity android:name=".SplashActivity" android:theme="@style/SplashTheme" ...>
       <intent-filter>
           <action android:name="android.intent.action.MAIN" />
           <category android:name="android.intent.category.LAUNCHER" />
       </intent-filter>
   </activity>
   ```

4. Kept `MainActivity` with `singleTask` so it doesn't duplicate when the app is already running:
   ```xml
   <activity android:name=".MainActivity" android:launchMode="singleTask" ... />
   ```

### Verification

- **iOS:** Build and launch — black screen with white logo and "One Song" text appears during app startup.
- **Android:** Build and launch — black screen with centered app icon appears, then transitions seamlessly into the React Native app.

### Lesson

- Launch screens are native-only — React Native's JS bundle hasn't loaded yet, so you can't use JS components.
- iOS storyboards are XML under the hood — editing them manually is faster than opening Xcode for simple layouts.
- Android's `windowBackground` theme attribute is the standard way to show a splash before `onCreate()` runs. The drawable must be a layer-list or solid color, not a layout.
- **Critical:** If using a `SplashActivity` to show text (since drawables can't render text), you must delay the handoff to `MainActivity`. Calling `startActivity()` + `finish()` immediately in `onCreate()` destroys the activity before the layout ever draws to the screen. Use `Handler.postDelayed()` or `ViewTreeObserver.OnPreDrawListener` to ensure the splash is visible.
- **Avoid double splash:** The `SplashTheme`'s `windowBackground` and the `SplashActivity`'s layout both render. If `windowBackground` contains the same logo as the layout, the logo flashes twice. Set `windowBackground` to a solid color (`@color/splash_background`) and let the `SplashActivity` layout be the only visual.
- Always switch back to the normal app theme in `onCreate()` before calling `super.onCreate()`, or the splash background will persist after the app loads.
- Reuse existing assets when possible — the iOS launch logo is the same 1024x1024 PNG used for App Store, just referenced in a new image set.

---
## 2026-05-02 — Kotlin Build Error: Missing `android.os.Bundle` Import in `MainActivity.kt`

### Problem

Android build failed with two Kotlin compilation errors:

```
e: MainActivity.kt:10:3 'onCreate' overrides nothing. Potential signatures for overriding:
    fun onCreate(p0: Bundle?): Unit
    fun onCreate(p0: Bundle?, p1: PersistableBundle?): Unit
e: MainActivity.kt:10:45 Unresolved reference 'Bundle'.
```

### Root Cause

When adding a custom `onCreate()` override to `MainActivity.kt` (to switch from `SplashTheme` to `AppTheme`), the `android.os.Bundle` import was missing. Kotlin couldn't resolve the `Bundle` type in the method signature, so it failed to match the override against `ReactActivity.onCreate(savedInstanceState: Bundle?)`.

### Fix

Added the missing import at the top of `MainActivity.kt`:

```kotlin
import android.os.Bundle
```

Full corrected file header:
```kotlin
package io.nesin.onesong

import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
```

### Verification

Rebuilt the debug APK. Compilation succeeded and the app launched with the splash theme switching correctly.

### Lesson

- Kotlin's `override` keyword is strict — if the parameter types don't resolve, the compiler treats it as a new method, not an override. The error `'onCreate' overrides nothing` is actually caused by the unresolved `Bundle` type, not a wrong signature.
- When overriding Android lifecycle methods (`onCreate`, `onResume`, etc.), always verify the required `android.os.*` imports are present. IDE auto-import usually handles this, but manual edits can miss it.
- The two errors are linked: `Unresolved reference 'Bundle'` is the root cause, and `'onCreate' overrides nothing` is the symptom.

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
