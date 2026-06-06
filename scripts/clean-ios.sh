#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/_env.sh"

PROJECT_DIR="$SCRIPT_DIR/.."

echo "🗑️  Removing iOS Pods and Podfile.lock..."
rm -rf "$PROJECT_DIR/ios/Pods" "$PROJECT_DIR/ios/Podfile.lock"

echo "🗑️  Removing Xcode DerivedData..."
rm -rf ~/Library/Developer/Xcode/DerivedData/OneSong-*

echo "📦  Reinstalling pods..."
cd "$PROJECT_DIR/ios" && pod install

echo "✅  iOS clean complete! Run 'pnpm ios' to build."
