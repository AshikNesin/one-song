---
name: release-notes
description: Generate Google Play Store release notes for a given version. Use when the user asks for release notes, what's new, changelog, or play store listing for a specific version.
---

# Release Notes Generator

Generate concise, user-facing release notes for the Google Play Store based on git history.

## Process

1. **Identify the target version.** If the user specifies a version (e.g. "0.0.3"), find the matching tag or bump commit. If no version is given, use the latest bump commit.

2. **Gather changes.** Run `git log` from the previous version's bump commit (exclusive) to the target version's bump commit (inclusive). For example, if the user asks for "0.0.3", diff between the `0.0.2` bump and the `0.0.3` bump commits.

3. **Categorize commits** into:
   - **New** — new features or capabilities
   - **Bug Fixes** — fixes for broken behavior
   - **Improvements** — enhancements to existing features
   - Skip internal/infra changes (build scripts, version bumps, CI, TIL entries, taste rules, semver config, signing config)

4. **Translate to user-facing language.**
   - Use plain, non-technical language a Play Store user would understand
   - Focus on the *impact* on the user, not the implementation
   - Keep each bullet concise (one sentence)
   - Do not mention file names, function renames, commit hashes, or technical internals

5. **Output format.**

```
**Version X.Y.Z**

**New:**
- Description of new feature

**Bug Fixes:**
- Description of what was fixed
```

Only include sections that have entries. If the release has nothing user-facing, say so and ask if the user wants to include internal changes.

6. **Offer to adjust.** After presenting the notes, ask if the user wants to tweak the wording, add/remove items, or change the format.
