# Building for Production

## Signed Release Build

Use the build script which fetches signing credentials and produces a signed AAB:

```bash
pnpm android:release
```

This runs `scripts/build-android-signed.sh`, which:
- Bumps the version via `scripts/bump-android-version.sh`
- Validates keystore and credentials are present
- Builds a signed release AAB with `./gradlew bundleRelease`

Output: `android/app/build/outputs/bundle/release/app-release.aab`

## Manual APK Build

To build an unsigned release APK (for local testing only):

```bash
cd android
./gradlew assembleRelease
```

The release APK uses ABI splitting for `arm64-v8a` only (covers all modern Android phones since 2015, reduces size from ~56MB to ~14MB).

Output: `android/app/build/outputs/apk/release/app-arm64-v8a-release.apk`
