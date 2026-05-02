# Architecture Notes

## Why Only arm64-v8a?

The release APK targets only the `arm64-v8a` architecture. This covers virtually all modern Android phones (2015+) and keeps the APK at ~14 MB instead of 56 MB. If you need to support emulators (x86/x86_64) or older 32-bit devices, add those architectures back in `android/app/build.gradle` under the `splits.abi.include` list.

## Audio Focus Handling

The app listens to audio focus events via `react-native-track-player`. When a phone call comes in or another app takes audio focus, playback pauses automatically and resumes when focus returns. The UI play/pause button stays in sync.

## Song File Persistence

The app copies the picked file to its own cache directory using `@react-native-documents/picker`'s `keepLocalCopy()` API. This avoids `SecurityException` when the original file is moved or the app loses persistent URI permission after reinstall.

## Sleep Timer

The timer is implemented with `setTimeout` in `AudioService.ts`. When it fires, it calls `TrackPlayer.pause()` and clears the timer state. The timer is saved to AsyncStorage so it survives app restarts and auto-applies when the player initializes.

## App-Killed Behavior

Playback stops and the notification is removed when the app is swiped away from recents. This is configured via `AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification` in `updateOptions()`.
