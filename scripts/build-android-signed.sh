#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/_env.sh"

if ! command -v op >/dev/null 2>&1; then
  echo "❌ Error: 1Password CLI (op) is not installed or not in PATH."
  exit 1
fi

OP_ITEM="op://NesinTech/One Song Android Signing"

echo "🔐 Fetching signing credentials from 1Password..."

# Fetch credentials
export KEYSTORE_PASSWORD=$(op read "${OP_ITEM}/KEYSTORE_PASSWORD")
export KEY_ALIAS=$(op read "${OP_ITEM}/KEY_ALIAS")
export KEY_PASSWORD=$(op read "${OP_ITEM}/KEY_PASSWORD")

# Download keystore file temporarily
echo "📦 Fetching keystore file..."
rm -f android/app/upload-keystore.jks
# ✅ Correct - use op read with --out-file for attachments
op read "${OP_ITEM}/upload-keystore.jks" \
  --out-file android/app/upload-keystore.jks

echo "🏗️  Building release AAB..."
cd android && ./gradlew bundleRelease

# Cleanup keystore immediately after build
echo "🧹 Cleaning up keystore..."
rm -f app/upload-keystore.jks

echo "✅ Build complete!"
echo "📍 Output: android/app/build/outputs/bundle/release/app-release.aab"
