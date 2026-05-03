#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BUILD_GRADLE="$SCRIPT_DIR/../android/app/build.gradle"
PACKAGE_JSON="$SCRIPT_DIR/../package.json"

if [ ! -f "$BUILD_GRADLE" ]; then
  echo "❌ Error: $BUILD_GRADLE not found."
  exit 1
fi

if [ ! -f "$PACKAGE_JSON" ]; then
  echo "❌ Error: $PACKAGE_JSON not found."
  exit 1
fi

CURRENT_VERSION_NAME=$(grep 'versionName' "$BUILD_GRADLE" | tr -d '[:space:]' | cut -d'"' -f2)
CURRENT_VERSION_CODE=$(grep 'versionCode' "$BUILD_GRADLE" | tr -d '[:space:]')

if [ -z "$CURRENT_VERSION_NAME" ]; then
  echo "❌ Error: Could not extract versionName from build.gradle."
  exit 1
fi

MAJOR=$(echo "$CURRENT_VERSION_NAME" | cut -d. -f1)
MINOR=$(echo "$CURRENT_VERSION_NAME" | cut -d. -f2)
NEW_MINOR=$((MINOR + 1))
NEW_VERSION_NAME="${MAJOR}.${NEW_MINOR}.0"

CURRENT_VERSION_CODE=$(echo "$CURRENT_VERSION_CODE" | sed 's/versionCode//')
NEW_VERSION_CODE=$((CURRENT_VERSION_CODE + 1))

echo "Bumping version: $CURRENT_VERSION_NAME → $NEW_VERSION_NAME"
echo "Bumping versionCode: $CURRENT_VERSION_CODE → $NEW_VERSION_CODE"

if [[ "$OSTYPE" == "darwin"* ]]; then
  sed -i '' "s/versionCode .*/versionCode $NEW_VERSION_CODE/" "$BUILD_GRADLE"
  sed -i '' "s/versionName \".*\"/versionName \"$NEW_VERSION_NAME\"/" "$BUILD_GRADLE"
  sed -i '' "s/\"version\": \"[^\"]*\"/\"version\": \"$NEW_VERSION_NAME\"/" "$PACKAGE_JSON"
else
  sed -i "s/versionCode .*/versionCode $NEW_VERSION_CODE/" "$BUILD_GRADLE"
  sed -i "s/versionName \".*\"/versionName \"$NEW_VERSION_NAME\"/" "$BUILD_GRADLE"
  sed -i "s/\"version\": \"[^\"]*\"/\"version\": \"$NEW_VERSION_NAME\"/" "$PACKAGE_JSON"
fi

echo "✅ Done! Updated:"
echo "   android/app/build.gradle: versionCode=$NEW_VERSION_CODE, versionName=$NEW_VERSION_NAME"
echo "   package.json: version=$NEW_VERSION_NAME"
