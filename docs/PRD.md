# One Song
## Goal
A minimal mobile app that plays a single song on loop. 

In terms of feature, it is very minimal:
1. Music player
2. Sleep timer
3. Notification (where I can stop and play/close the song)

And it has a minimal setting page
- Ability to set the song (local audio files only - MP3/M4A)
- Ability to set the sleep timer

## Song Source
- Local audio files only (user selects from device storage)
- Supported formats: MP3, M4A
- No streaming, no bundled default songs

## File Handling
When a song is selected, the app **copies the file into its own cache directory** using `keepLocalCopy()`. The app plays this cached copy, not the original file. This means:
- Renaming, moving, or deleting the original file does not affect playback
- The app continues to work even if the original file is no longer accessible
- The trade-off is extra storage used for the duplicate copy

This prevents `SecurityException` when the original file is moved or when the app loses persistent URI permission after reinstall.

## App Launch Behavior
- First launch: Show onboarding screen to select song and grant permissions
- Subsequent launches: Auto-play the previously selected song immediately (unless auto-play is disabled in settings)
- Sleep timer: Auto-applies previous setting if it was enabled

## Sleep Timer Behavior
- Timer ends: Stop music and close the app
- Manual stop: Cancel the timer
- Display: Subtle countdown visible in main player UI

## Main Player UI
- Song name display
- Large subtle play/pause button
- Sleep timer button (opens quick picker)
- Album art: Display if available, otherwise show default music icon/image
- Minimal visual elements

## Song Loop Behavior
- Loop infinitely until sleep timer ends or user stops
- File error: Show simple error message with button to pick different song
- Immediate restart (no fade) - seamless loop
- Show always while music is playing (foreground and background)
- Controls: Play/Pause toggle, Stop (closes app)
- Text: Simple "Playing" (no song name)
- Tap behavior: Opens the app

## Settings Screen
- Change song: Available anytime (replaces current song)
- Auto-play on launch: Toggle to enable/disable automatic playback when app starts
- Sleep timer presets: 5, 10, 15, 30, 45, 60 minutes
- No custom timer input
- No volume control (use system volume)
- No themes or appearance settings

## Permissions (Onboarding)
- Storage: Read media/audio files (required)
- Notification: Required for Android 13+
- If storage denied: Show explanation message with retry button

## Edge Cases
- Missing file: Detect on launch, show error, redirect to settings to pick new song
- Phone calls: Auto-pause music, resume after call ends
- Audio focus: Pause when other apps play audio, resume when focus returns

## Backstory
Everyday, before going to bed, my kid wants hear the same lullaby. We play it on YouTube or sometime on music app.

I just want a dedicated app just for that. Instead of multiple clicks, I want the app to start playing as soon as I open the app and after it reaches the sleep timer or I explictly stop the app should close.

## Data Persistence
- Use AsyncStorage (built-in, simple)
- Store song URI (not absolute path - more reliable)
- Store sleep timer duration and enabled/disabled state

## Tech Stack
- React Native (bare workflow, no Expo)
- Audio: react-native-track-player (background playback, notifications, audio focus)
- Hermes engine enabled (reduces app size)

## Non-Functional Requirements
- Minimal file size and memory footprint
- Target APK size: Under 15MB
- Use ProGuard/R8 for code shrinking in release builds

## App Details
- Name: One Song
- Minimum Android Version: API 26 (Android 8.0)
- Analytics: Future consideration

## Scope
I want to focus on Android app and if there is a need then I'll consider Apple ecosystem.
