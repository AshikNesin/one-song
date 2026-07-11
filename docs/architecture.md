# Architecture Notes

## Why Only arm64-v8a?

The release APK targets only the `arm64-v8a` architecture. This covers virtually all modern Android phones (2015+) and keeps the APK at ~14 MB instead of 56 MB. If you need to support emulators (x86/x86_64) or older 32-bit devices, add those architectures back in `android/app/build.gradle` under the `splits.abi.include` list.

## Audio Focus Handling

The app listens to audio focus events via `react-native-track-player`. When a phone call comes in or another app takes audio focus, playback pauses automatically and resumes when focus returns. The UI play/pause button stays in sync.

## Song File Persistence

The app copies the picked file into the app's document directory and stores the local URI. Metadata (title, artist, artwork) is read from the file — Artwork is returned as a `data:` URI so it works in both the in-app `<Image>` and the platform media notification / Now Playing center without disk caching.

Since the app keeps its own copy, deleting or moving the original file has no effect on playback. If the app is uninstalled and reinstalled, the document directory is wiped and playback will fail on next launch. The existing error handling in `Playback.ts` detects the failure, clears the stored song, and navigates to the onboarding screen so the user can pick a new song.

## Sleep Timer

The timer is implemented with `setTimeout` in `SleepTimer.ts`. When it fires, it calls `TrackPlayer.pause()` and clears the timer state. The default timer preference is saved to AsyncStorage so it survives app restarts and auto-applies when the player initializes.

## App-Killed Behavior

Playback stops and the notification is removed when the app is swiped away from recents. This is configured via `AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification` in `updateOptions()`.
