# One Song

A minimal Android music player that plays exactly one song — on repeat, with a sleep timer, and background playback.

## What It Is

One Song is intentionally simple. Pick one audio file from your device, and the app plays it continuously. No playlists, no libraries, no complexity. Just your song, always ready.

## Features

- **One Song Only** — Pick a single audio file. The app remembers it forever (or until you change it).
- **Auto-Play on Open** — The song starts playing as soon as you open the app.
- **Repeat Forever** — The song loops automatically. No settings needed.
- **Sleep Timer** — Set a timer (5–60 minutes) and the app pauses automatically when time is up. Configure a default timer in Settings.
- **Background Playback** — Music keeps playing when you switch apps or lock your screen. Control it from the notification shade.
- **Seekable Progress Bar** — Tap or drag anywhere on the bar to jump to a different part of the song.
- **Change Song Anytime** — Go to Settings → Change Song to pick a different track.
- **Clean Start on Reopen** — If you force-close the app, it starts the song from the beginning next time. No state to worry about.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native 0.85 |
| Language | TypeScript |
| Audio Engine | react-native-track-player |
| Navigation | React Navigation (Native Stack) |
| State Persistence | AsyncStorage |
| File Picker | @react-native-documents/picker |
| Permissions | react-native-permissions |
| Build System | Gradle (Android) |

## Getting Started

### Prerequisites

- Node.js ≥ 22.11.0
- pnpm (or npm/yarn)
- Android Studio with SDK installed
- OpenJDK 17 (React Native's Android build does not yet support Java 25)
- A running Android emulator or a physical device with USB debugging enabled

### 1. Clone and Install

```bash
git clone <repo-url>
cd one-song
pnpm install
```

### 2. Configure Java for Android

The Android build requires OpenJDK 17. If your system default is Java 25, set this environment variable before building:

```bash
export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
```

On Apple Silicon Macs, the path is typically `/opt/homebrew/opt/openjdk@17`. On Intel Macs, use `/usr/local/opt/openjdk@17`.

### 3. Add Android SDK Tools to PATH

```bash
export ANDROID_HOME="$HOME/Library/Android/sdk"
export PATH="$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools:$PATH"
```

### 4. Start Metro (the JS bundler)

```bash
pnpm start
```

Leave this running in a separate terminal.

### 5. Run on Android

With an emulator running or a device connected:

```bash
pnpm android
```

Or explicitly:

```bash
pnpm react-native run-android
```

For a release build:

```bash
pnpm react-native run-android --mode=release
```

## Project Structure

```
OneSong/
├── android/                         # Android native project
│   ├── app/src/main/
│   │   ├── AndroidManifest.xml      # Permissions & services
│   │   └── java/io/nesin/onesong/   # MainActivity.kt, MainApplication.kt
│   └── ...
├── src/
│   ├── types/
│   │   └── index.ts                 # TypeScript interfaces (Song, TimerPreset, etc.)
│   ├── utils/
│   │   └── constants.ts             # Storage keys, timer presets, UI strings
│   ├── services/
│   │   ├── AudioService.ts          # Track player setup, playback, sleep timer, audio focus
│   │   ├── StorageService.ts        # AsyncStorage wrapper (song, timer, onboarding state)
│   │   └── PermissionService.ts     # Android storage permission requests
│   ├── components/
│   │   ├── ProgressBar.tsx          # Seekable playback progress bar
│   │   ├── PlayPauseButton.tsx      # Geometric play/pause icon button
│   │   └── SleepTimerButton.tsx     # Timer preset selector modal
│   ├── screens/
│   │   ├── OnboardingScreen.tsx     # First launch: pick song & grant permission
│   │   ├── PlayerScreen.tsx         # Main screen: song info, controls, progress
│   │   └── SettingsScreen.tsx       # Change song, timer default, reset data
│   ├── navigation/
│   │   └── AppNavigator.tsx         # Stack navigator (Onboarding → Player → Settings)
│   └── App.tsx                      # Entry point: initializes track player
├── TIL.md                           # Running log of bugs, fixes, and lessons learned
├── PLAN.md                          # Original implementation plan
└── package.json
```

## Architecture Notes

### Why Only arm64-v8a?

The release APK targets only the `arm64-v8a` architecture. This covers virtually all modern Android phones (2015+) and keeps the APK at ~14 MB instead of 56 MB. If you need to support emulators (x86/x86_64) or older 32-bit devices, add those architectures back in `android/app/build.gradle` under the `splits.abi.include` list.

### Audio Focus Handling

The app listens to audio focus events via `react-native-track-player`. When a phone call comes in or another app takes audio focus, playback pauses automatically and resumes when focus returns. The UI play/pause button stays in sync.

### Song File Persistence

The app copies the picked file to its own cache directory using `@react-native-documents/picker`'s `keepLocalCopy()` API. This avoids `SecurityException` when the original file is moved or the app loses persistent URI permission after reinstall.

### Sleep Timer

The timer is implemented with `setTimeout` in `AudioService.ts`. When it fires, it calls `TrackPlayer.pause()` and clears the timer state. The timer is saved to AsyncStorage so it survives app restarts and auto-applies when the player initializes.

### App-Killed Behavior

Playback stops and the notification is removed when the app is swiped away from recents. This is configured via `AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification` in `updateOptions()`.

## Troubleshooting

| Problem | Cause | Fix |
|---|---|---|
| `JAVA_HOME is set to an invalid directory` | Java 25 is not supported by the Android NDK/CMake toolchain | Set `JAVA_HOME` to OpenJDK 17 before building |
| `adb: command not found` | Android SDK `platform-tools` not in PATH | Add `$ANDROID_HOME/platform-tools` to PATH |
| `No connected devices!` | No emulator running or device not connected | Start an emulator or connect a device with USB debugging |
| `The player has already been initialized` | `setupPlayer()` called multiple times | Already handled in `AudioService.ts` — the error is caught and ignored |
| `SecurityException` on playback | File URI lost permission after reinstall | File is copied to app cache on pick; use `keepLocalCopy()` |
| Song keeps playing after app is closed | Default track player behavior | Already fixed — `AppKilledPlaybackBehavior` is set to stop playback |

See [`TIL.md`](./TIL.md) for detailed write-ups of every bug and fix encountered during development.

## Building for Production

The release APK is built with ABI splitting for `arm64-v8a` only:

```bash
cd android
./gradlew assembleRelease
```

Output: `android/app/build/outputs/apk/release/app-arm64-v8a-release.apk`

## License

ISC
