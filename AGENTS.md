# Memory

## Project Overview
See @README.md for project overview and @package.json for available npm/pnpm commands for this project.

## Code Style Guidelines
- Use descriptive variable names
- Follow existing patterns in the codebase
- Extract complex conditions into meaningful boolean variables
- Always prefer using "@/" alias based import instead of relative imports

## Architecture Notes
See @docs/architecture.md for architecture details, audio focus handling, file persistence, and sleep timer behavior.

## Common Workflows
- Use pnpm to install new dependency instead of npm
- Build for release: `pnpm android:release` (see @docs/building.md)
- Run on device: `pnpm android` (see @docs/local-development.md)
- Troubleshoot issues: see @docs/troubleshooting.md and @TIL.md
