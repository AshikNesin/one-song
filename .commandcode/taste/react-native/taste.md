# react-native
- Target arm64-v8a as the primary Android architecture; only include others when explicitly requested. Confidence: 0.65
- Use reverse-domain bundle IDs with the user's domain (io.nesin.*). Confidence: 0.70
- Use pnpm as the package manager for this project. Confidence: 0.90
- Use pnpm patch (not patch-package) for persisting node_modules patches. Confidence: 0.70
- Use dynamically sourced app version instead of hardcoded version strings. Confidence: 0.65
- Organize documentation by moving detailed sections (Architecture, Troubleshooting, Building) into dedicated files inside a docs/ folder. Confidence: 0.75
- Use "dev" as the npm script name for starting the Metro bundler instead of "start". Confidence: 0.75
- Use shell scripts in a scripts/ directory for commands that require environment setup (e.g., loading proper Java context). Confidence: 0.75
- Keep Metro bundler and platform build commands as separate npm scripts; do not combine them into a single concurrent command. Confidence: 0.75
