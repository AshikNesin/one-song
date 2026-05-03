# scripts
- Don't hardcode absolute user-specific paths in shell scripts; derive paths dynamically so scripts work on any machine. Confidence: 0.75
- Make shell scripts defensive: check if paths/binaries exist before setting/exporting them, and skip gracefully if missing. Confidence: 0.70
- Check if required external tools/binaries exist before using them, and fail with a clear error message if missing. Confidence: 0.75
- Avoid interactive prompts in shell scripts; use force flags or pre-remove files to prevent hanging. Confidence: 0.75
- Always bump the patch version for semantic versioning (e.g., 0.0.1 → 0.0.2); bump both versionCode and versionName in Android builds together. Confidence: 0.85
- When bumping versionName, increment versionCode by 1 (not by mapping to the semver digits). For example, 0.0.30 → 1.0.0 means versionCode goes from 30 → 31, not 30 → 100. Confidence: 0.85
