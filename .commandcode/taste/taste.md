# Taste (Continuously Learned by [CommandCode][cmd])

[cmd]: https://commandcode.ai/

# react-native
See [react-native/taste.md](react-native/taste.md)
# grill-me
See [grill-me/taste.md](grill-me/taste.md)
# documentation
- Document non-trivial bug fixes (root cause, fix, lessons learned) in TIL.md using the established Problem/Root Cause/Fix/Verification/Lesson format. Confidence: 0.70

# scripts
- Don't hardcode absolute user-specific paths in shell scripts; derive paths dynamically so scripts work on any machine. Confidence: 0.75
- Make shell scripts defensive: check if paths/binaries exist before setting/exporting them, and skip gracefully if missing. Confidence: 0.70
- Check if required external tools/binaries exist before using them, and fail with a clear error message if missing. Confidence: 0.75
- Avoid interactive prompts in shell scripts; use force flags or pre-remove files to prevent hanging. Confidence: 0.75
- Always bump the patch version for semantic versioning (e.g., 0.0.1 → 0.0.2); bump both versionCode and versionName in Android builds together. Confidence: 0.85
