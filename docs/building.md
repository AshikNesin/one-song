# Building for Production

The release APK is built with ABI splitting for `arm64-v8a` only:

```bash
cd android
./gradlew assembleRelease
```

Output: `android/app/build/outputs/apk/release/app-arm64-v8a-release.apk`
