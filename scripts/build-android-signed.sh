#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/_env.sh"

if ! command -v op >/dev/null 2>&1; then
  echo "❌ Error: 1Password CLI (op) is not installed or not in PATH."
  exit 1
fi

OP_ITEM="op://NesinTech/One Song Android Signing"
KEYSTORE_PATH="android/app/upload-keystore.jks"

echo "🔐 Fetching signing credentials from 1Password..."

# Fetch credentials
export KEYSTORE_PASSWORD=$(op read "${OP_ITEM}/KEYSTORE_PASSWORD")
export KEY_ALIAS=$(op read "${OP_ITEM}/KEY_ALIAS")
export KEY_PASSWORD=$(op read "${OP_ITEM}/KEY_PASSWORD")

# Validate credentials
if [ -z "$KEYSTORE_PASSWORD" ] || [ -z "$KEY_ALIAS" ] || [ -z "$KEY_PASSWORD" ]; then
  echo "❌ Error: Failed to fetch one or more signing credentials from 1Password."
  exit 1
fi

# Download keystore file temporarily
echo "📦 Fetching keystore file..."
rm -f "$KEYSTORE_PATH"
op read "${OP_ITEM}/upload-keystore.jks" --out-file "$KEYSTORE_PATH"

if [ ! -f "$KEYSTORE_PATH" ]; then
  echo "❌ Error: Failed to download keystore file from 1Password."
  exit 1
fi

# Ensure cleanup happens even if build fails
cleanup() {
  echo "🧹 Cleaning up keystore..."
  rm -f "$KEYSTORE_PATH"
}
trap cleanup EXIT

echo "🏗️  Building release AAB..."
cd android && ./gradlew bundleRelease

echo "✅ Build complete!"
echo "📍 Output: android/app/build/outputs/bundle/release/app-release.aab"
