# react-native
- Use the existing latest Java installation; do not install alternative Java versions. Confidence: 0.85
- Target arm64-v8a as the primary Android architecture; only include others when explicitly requested. Confidence: 0.65
- Use reverse-domain bundle IDs with the user's domain (io.nesin.*). Confidence: 0.70
- Use pnpm as the package manager for this project. Confidence: 0.85
- Use pnpm patch (not patch-package) for persisting node_modules patches. Confidence: 0.70
- Use dynamically sourced app version instead of hardcoded version strings. Confidence: 0.65
- Organize documentation by moving detailed sections (Architecture, Troubleshooting, Building) into dedicated files inside a docs/ folder. Confidence: 0.75
