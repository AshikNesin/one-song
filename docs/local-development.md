# Local Development Guide

Testing the app on a physical Android device during development.

## Prerequisites

- Android phone running Android 8.0+ (API 26+)
- USB cable (or Wi-Fi setup)
- Computer with Node.js and pnpm installed

## Step 1: Enable Developer Options on Your Phone

1. Open **Settings** → **About Phone**
2. Tap **Build Number** 7 times until you see "You are now a developer!"
3. Go back → **System** → **Developer Options**
4. Enable **USB Debugging**

## Step 2: Connect Your Phone to Computer

### Option A: USB Cable

1. Plug in your phone via USB
2. On your phone, allow the computer's RSA key when prompted
3. Verify connection:

```bash
adb devices
```

You should see your device listed.

### Option B: Wi-Fi (No Cable)

1. Connect phone and computer to same Wi-Fi
2. First connect via USB, then:

```bash
adb tcpip 5555
adb connect YOUR_PHONE_IP:5555
```

Find your phone's IP in Settings → About → Status.

## Step 3: Install App on Device

From the project root:

```bash
pnpm react-native run-android
```

This:
- Starts Metro bundler (keeps running)
- Compiles the Android app
- Installs APK on your phone
- Launches the app automatically

## Step 4: Development Workflow

### Making Changes
- Edit any file in `src/`
- Save the file
- App reloads automatically (Fast Refresh)

### Viewing Logs
Metro terminal shows:
- JavaScript errors (red screen on phone)
- `console.log()` output
- Network requests

### Common Metro Commands

| Command | Action |
|---------|--------|
| `r` | Reload app |
| `d` | Open developer menu on phone |
| `i` | Run on iOS (if needed) |
| `a` | Run on Android |

### Developer Menu on Phone
Shake the phone (or press `d` in Metro) to open:
- **Reload**: Refresh JavaScript
- **Debug**: Open Chrome DevTools
- **Fast Refresh**: Toggle hot reloading
- **Settings**: Configure bundler

## Step 5: Testing Audio Features

Since this is a music app, test these scenarios on real hardware:

1. **Playback**: Does the song play? Is the volume normal?
2. **Background**: Press home button → audio should keep playing
3. **Notification**: Check notification shade for media controls
4. **Phone call**: Receive a call → audio should pause automatically
5. **Sleep timer**: Set timer → verify it stops after the duration
6. **Seek**: Drag progress bar → audio jumps to that position

## Troubleshooting

### "No devices found"
```bash
# Restart adb server
adb kill-server
adb start-server
adb devices
```

### App installs but crashes immediately
- Check Metro terminal for JavaScript errors
- Common cause: Missing permission in AndroidManifest.xml
- Run `adb logcat` for detailed native crash logs

### Audio not playing
- Check volume is up (not muted)
- Verify the selected file is a supported format (MP3, AAC, WAV)
- Check Android logcat for audio-specific errors

### Hot reload not working
- Press `r` in Metro to force reload
- Check that Fast Refresh is enabled in developer menu

### Build errors
```bash
cd android && ./gradlew clean
cd ..
pnpm react-native run-android
```

## Debugging with Chrome DevTools

1. Press `d` in Metro or shake phone
2. Select "Debug"
3. Chrome opens automatically
4. Use Console, Network, and Sources tabs
5. Set breakpoints in your TypeScript code

**Note**: Audio playback might not work while debugging in Chrome. Stop debugging to test audio properly.

## Release Testing

When ready to test the actual APK:

```bash
cd android
./gradlew assembleRelease
```

Install the release APK:
```bash
adb install app/build/outputs/apk/release/app-release.apk
```

## Tips for This Project

- **Keep Metro running** while developing — don't close the terminal
- **Use a real song file** you own for testing (MP3 from your Downloads)
- **Test onboarding flow** by clearing app data: Settings → Apps → One Song → Storage → Clear Data
- **Check file permissions** if song selection fails — Android 13+ uses different storage permissions
