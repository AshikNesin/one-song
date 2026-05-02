# Troubleshooting

| Problem | Cause | Fix |
|---|---|---|
| `JAVA_HOME is set to an invalid directory` | Java 25 is not supported by the Android NDK/CMake toolchain | Set `JAVA_HOME` to OpenJDK 17 before building |
| `adb: command not found` | Android SDK `platform-tools` not in PATH | Add `$ANDROID_HOME/platform-tools` to PATH |
| `No connected devices!` | No emulator running or device not connected | Start an emulator or connect a device with USB debugging |
| `The player has already been initialized` | `setupPlayer()` called multiple times | Already handled in `AudioService.ts` — the error is caught and ignored |
| `SecurityException` on playback | File URI lost permission after reinstall | File is copied to app cache on pick; use `keepLocalCopy()` |
| Song keeps playing after app is closed | Default track player behavior | Already fixed — `AppKilledPlaybackBehavior` is set to stop playback |

See [`TIL.md`](../TIL.md) for detailed write-ups of every bug and fix encountered during development.
