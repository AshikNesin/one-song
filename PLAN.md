# One Song App - Implementation Plan

## Overview
This plan breaks down building a minimal Android music app that plays exactly one song. Each section explains **what** we're doing and **why**, designed for someone new to Android development.

---

## Phase 1: Project Setup (Foundation)

### Step 1: Initialize React Native Project
**What:** Create a new React Native project using the CLI

**Why:**
- React Native lets us write JavaScript/TypeScript instead of Java/Kotlin
- One codebase works on both Android and iOS (though we're focusing on Android)
- "Bare workflow" means we have full control over native Android code when needed

**Command:**
```bash
pnpm dlx react-native@latest init OneSong --template react-native-template-typescript
```

**What this creates:**
- `android/` folder - Contains the actual Android project (Java/Kotlin files, manifest, resources)
- `ios/` folder - iOS project (we'll ignore this)
- `src/` or root JS files - Where we write our React Native code
- `package.json` - Lists all dependencies
- `metro.config.js` - Bundler configuration (bundles JS for the app)

---

### Step 2: Install Dependencies
**What:** Add the libraries we need

**Why each library:**

1. **react-native-track-player** - The audio engine
   - Handles playing music in background
   - Shows notification with play/pause controls
   - Manages audio focus (pauses when you get a call)
   - This is a "native module" - it has Java code that bridges to React Native

2. **@react-native-async-storage/async-storage** - Simple database
   - Stores the selected song path
   - Stores sleep timer preference
   - Like browser localStorage but for mobile

3. **react-native-permissions** - Permission handling
   - Android requires asking user for permission to read storage
   - This library makes it easier to request and check permissions

4. **react-native-document-picker** - File picker
   - Opens Android's file picker so user can select their song
   - Returns the file path we need

5. **@react-navigation/native** - Screen navigation
   - Lets us have multiple screens (Onboarding → Player)
   - Handles the "stack" of screens (back button works automatically)

**Commands:**
```bash
pnpm add react-native-track-player @react-native-async-storage/async-storage
pnpm add react-native-permissions react-native-document-picker
pnpm add @react-navigation/native @react-navigation/native-stack react-native-screens react-native-safe-area-context
```

---

### Step 3: Android-Specific Setup
**What:** Configure Android manifest and build settings

**Why:**
- Android needs to know our app uses audio, notifications, and storage
- We need to declare permissions before the app can request them
- Native modules (like track-player) need to be "linked" to Android

**Files to modify:**

1. **android/app/src/main/AndroidManifest.xml**
   - Add `READ_EXTERNAL_STORAGE` permission (to read user's song file)
   - Add `FOREGROUND_SERVICE` permission (for background audio)
   - Add service declarations for react-native-track-player

2. **android/app/build.gradle**
   - Enable Hermes (JavaScript engine) for smaller app size
   - Set minimum SDK to 26 (Android 8.0) as per PRD

---

## Phase 2: Core Types and Constants

### Step 4: Define TypeScript Types
**What:** Create type definitions for our data

**Why:**
- TypeScript catches errors before we run the app
- Makes code self-documenting (you can see what a "Song" object contains)
- Helps IDE autocomplete

**File:** `src/types/index.ts`

**Types we need:**
```typescript
interface Song {
  id: string;
  title: string;
  artist: string;
  artwork?: string;  // Album art path (optional)
  url: string;         // File path to the audio file
  duration: number;    // Length in seconds
}

interface AppState {
  hasCompletedOnboarding: boolean;
  selectedSong: Song | null;
  sleepTimerMinutes: number | null;
}

interface SleepTimerPreset {
  label: string;
  minutes: number;
}
```

---

### Step 5: Create Constants
**What:** Define app-wide constants

**Why:**
- Avoid magic numbers (what does "15" mean? vs `SLEEP_TIMER_15_MIN`)
- Single place to change values
- Consistent across the app

**File:** `src/utils/constants.ts`

**Constants:**
- Sleep timer presets (5, 10, 15, 30, 60 minutes)
- Storage keys (for AsyncStorage)
- Default values
- UI text strings

---

## Phase 3: Services (The Brain)

Services are where we put code that does "work" - not UI, but logic.

### Step 6: Audio Service
**What:** Wrapper around react-native-track-player

**Why:**
- Track player is powerful but complex
- We want a simple API: `play()`, `pause()`, `seekTo(time)`
- Centralizes all audio logic in one place
- Handles setup, playback, and events

**File:** `src/services/AudioService.ts`

**Key functions:**
- `setupPlayer()` - Initialize track player (called once on app start)
- `loadSong(song: Song)` - Load a song into the player
- `play()` / `pause()` - Control playback
- `seekTo(seconds)` - Jump to position
- `getPosition()` - Get current playback position
- `setSleepTimer(minutes)` - Schedule app to stop after X minutes

**How it works:**
1. Track player runs as an Android "service" (can play in background)
2. It shows a notification with media controls
3. It emits events (playback finished, position updated)
4. Our service listens to these events and updates our app state

---

### Step 7: Storage Service
**What:** Save and load user preferences

**Why:**
- When user selects a song, we need to remember it
- Sleep timer preference should persist
- Next time app opens, we know if onboarding is done

**File:** `src/services/StorageService.ts`

**Key functions:**
- `saveSong(song: Song)` - Save selected song
- `getSong(): Promise<Song | null>` - Load saved song
- `saveSleepTimer(minutes: number | null)` - Save timer preference
- `getSleepTimer(): Promise<number | null>` - Load timer preference
- `setOnboardingComplete()` - Mark onboarding as done
- `hasCompletedOnboarding(): Promise<boolean>` - Check if onboarding done

**How it works:**
- AsyncStorage saves key-value pairs as files on device
- Values are strings, so we JSON.stringify objects
- It's async (returns Promises) because file I/O takes time

---

### Step 8: Permission Service
**What:** Handle Android permission requests

**Why:**
- Android 6+ requires runtime permission requests
- User must explicitly grant storage permission
- We need to check if permission is granted before accessing files

**File:** `src/services/PermissionService.ts`

**Key functions:**
- `requestStoragePermission()` - Ask user for storage access
- `checkStoragePermission()` - Check if we already have permission
- `shouldShowRequestRationale()` - Explain why we need permission

**How it works:**
1. App checks if permission is granted
2. If not, shows Android's permission dialog
3. User can accept or deny
4. If denied, we show an explanation and ask again
5. If permanently denied, we guide them to app settings

---

## Phase 4: UI Components

Components are reusable UI pieces. We build small components, then combine them into screens.

### Step 9: Progress Bar Component
**What:** Shows song progress and allows seeking

**Why:**
- Users want to see how far into the song they are
- Should be able to drag to jump to different parts
- Minimal design as per PRD

**File:** `src/components/ProgressBar.tsx`

**Features:**
- Shows current time / total duration
- Visual progress bar (thin line)
- Draggable to seek
- Updates in real-time as song plays

**How it works:**
1. Listens to track player's position updates
2. Calculates percentage: `current / duration`
3. Renders a touchable bar
4. When user drags, calculates new position and seeks

---

### Step 10: Play/Pause Button
**What:** Simple circular button with play/pause icon

**Why:**
- Main control users interact with
- Needs to show current state (playing vs paused)
- Minimal design - just an icon

**File:** `src/components/PlayPauseButton.tsx`

**Features:**
- Shows play icon when paused
- Shows pause icon when playing
- Calls AudioService.play() or pause()
- Updates based on playback state

---

### Step 11: Sleep Timer Button
**What:** Button to set sleep timer

**Why:**
- PRD requirement for sleep timer
- Should show current timer if set
- Opens picker to change timer

**File:** `src/components/SleepTimerButton.tsx`

**Features:**
- Shows "Timer: 15m" or "No timer"
- Opens modal/picker when tapped
- Lists preset options (5, 10, 15, 30, 60 min)
- Saves selection to storage

---

## Phase 5: Screens

Screens are full-page views. Each screen combines components and services.

### Step 12: Onboarding Screen
**What:** First-time user setup

**Why:**
- User needs to select their one song
- Need to request permissions
- Only shown on first launch

**File:** `src/screens/OnboardingScreen.tsx`

**Flow:**
1. Welcome message (minimal text)
2. Request storage permission
3. Show "Select Song" button
4. Open file picker when tapped
5. Show selected song info
6. "Continue" button to go to player

**What happens:**
- User taps "Select Song"
- We check/request permission
- Open document picker (shows Downloads, Music folders)
- User picks a file
- We validate it's an audio file
- Save song to storage
- Navigate to Player screen

---

### Step 13: Player Screen
**What:** Main screen - shows song info and controls

**Why:**
- This is the app - everything else leads here
- Minimal design as per PRD
- Auto-plays song on open

**File:** `src/screens/PlayerScreen.tsx`

**Layout (top to bottom):**
1. Album art (or default music icon)
2. Song title (small, minimal)
3. Artist name (smaller)
4. Progress bar
5. Play/Pause button (large, centered)
6. Sleep timer button (bottom)

**Behavior:**
- On mount: load song from storage, start playing
- If sleep timer was set: apply it automatically
- Show notification with controls (handled by track player)
- When sleep timer ends: pause playback

---

### Step 14: Settings Screen (Optional)
**What:** Change song or timer settings

**Why:**
- User might want to change their song
- Adjust sleep timer default
- Simple settings page

**File:** `src/screens/SettingsScreen.tsx`

**Features:**
- "Change Song" button (goes back to onboarding flow)
- Sleep timer default setting
- About app info

---

## Phase 6: Navigation & App Entry

### Step 15: Setup Navigation
**What:** Connect screens with navigation

**Why:**
- React Navigation manages the screen "stack"
- Handles back button automatically
- Animates screen transitions

**File:** `src/navigation/AppNavigator.tsx`

**Logic:**
- On app start: check if onboarding is complete
- If no: show OnboardingScreen
- If yes: show PlayerScreen
- Use "stack navigator" (screens stack on top of each other)

---

### Step 16: App Entry Point
**What:** Main App component

**Why:**
- Every React Native app has a root component
- Initializes services (audio player)
- Sets up navigation container

**File:** `src/App.tsx`

**What it does:**
1. Initialize track player (setupPlayer())
2. Wrap app in NavigationContainer
3. Render AppNavigator
4. Handle app lifecycle (pause when backgrounded, etc.)

---

## Phase 7: Native Module Setup

### Step 17: Link Native Modules
**What:** Connect JavaScript to native Android code

**Why:**
- Libraries like track-player have Java/Kotlin code
- React Native needs to know about these native modules
- Usually automatic with "autolinking" in modern RN

**Steps:**
1. Run `cd android && ./gradlew clean` (clean build)
2. Run `pnpm react-native run-android` (build and install)
3. Native modules compile and link automatically

**If issues occur:**
- May need to manually link in `MainApplication.java`
- Check each library's documentation for Android-specific setup

---

### Step 18: Configure Track Player Service
**What:** Add track player service to Android manifest

**Why:**
- Track player runs as a background service
- Android needs to know this service exists
- Required for notification to show

**File:** `android/app/src/main/AndroidManifest.xml`

**Add:**
```xml
<service android:name="com.doublesymmetry.trackplayer.service.MusicService"
         android:enabled="true"
         android:exported="true">
</service>
```

---

## Phase 8: Testing & Polish

### Step 19: Test Core Flow
**What:** Verify everything works

**Test cases:**
1. Fresh install → Onboarding → Select song → Plays automatically
2. Kill app → Reopen → Song plays (no onboarding)
3. Set sleep timer → Wait → Song pauses
4. Kill app during playback → Reopen → Resumes from where left off
5. Get phone call → Song pauses → Call ends → Song resumes
6. Background app → Notification shows → Can pause/play from notification

---

### Step 20: Handle Edge Cases
**What:** Make app robust

**Cases to handle:**
- Selected song file was deleted → Show error, go to onboarding
- Permission denied → Show explanation, guide to settings
- Audio focus lost (another app plays) → Pause, resume when focus returns
- Very long song names → Truncate with "..."
- No album art → Show default music icon
- Sleep timer during onboarding → Apply on first play

---

## Phase 9: Build & Release

### Step 21: Build Release APK
**What:** Create installable APK file

**Why:**
- Debug builds are large and slow
- Release builds are optimized (smaller, faster)
- ProGuard/R8 removes unused code

**Commands:**
```bash
cd android
./gradlew assembleRelease
```

**Output:** `android/app/build/outputs/apk/release/app-release.apk`

**Check size:** Should be under 15MB as per PRD

---

## Summary: File Structure

```
OneSong/
├── android/                    # Android native code
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── AndroidManifest.xml    # Permissions & services
│   │   │   └── java/...               # Native Java code
│   │   └── build.gradle               # Build config
│   └── ...
├── src/
│   ├── types/
│   │   └── index.ts            # TypeScript definitions
│   ├── utils/
│   │   └── constants.ts        # App constants
│   ├── services/
│   │   ├── AudioService.ts     # Audio playback
│   │   ├── StorageService.ts   # Data persistence
│   │   └── PermissionService.ts # Android permissions
│   ├── components/
│   │   ├── ProgressBar.tsx     # Seekable progress bar
│   │   ├── PlayPauseButton.tsx # Play/pause control
│   │   └── SleepTimerButton.tsx # Timer selector
│   ├── screens/
│   │   ├── OnboardingScreen.tsx # First-time setup
│   │   ├── PlayerScreen.tsx    # Main player UI
│   │   └── SettingsScreen.tsx  # Settings (optional)
│   ├── navigation/
│   │   └── AppNavigator.tsx    # Screen navigation
│   └── App.tsx                 # App entry point
├── package.json                # Dependencies
├── tsconfig.json               # TypeScript config
└── index.js                    # App bootstrap
```

---

## Key Concepts for Beginners

### React Native Basics
- **JS Bridge:** JavaScript code runs in a separate thread, communicates with native Android code
- **Native Modules:** Libraries with Java/Kotlin code (like track-player) that bridge to JS
- **Metro:** The bundler that packages your JS code for the app
- **Hermes:** A JavaScript engine optimized for mobile (smaller, faster)

### Android Concepts
- **Activity:** A single screen in Android (React Native creates one main activity)
- **Service:** Background process (track player uses this for audio)
- **Manifest:** XML file declaring what your app needs (permissions, services)
- **Gradle:** Build system that compiles everything into an APK
- **APK:** Android Package - the installable file

### React Navigation
- **Stack Navigator:** Screens stack like cards - new screen slides over, back button goes back
- **Navigation Container:** Wraps entire app, manages navigation state
- **Routes:** Named destinations ("Onboarding", "Player")

---

## Questions?

Each phase builds on the previous. We won't move to Phase 2 until Phase 1 is complete and you understand it.

Ready to start with Phase 1?
