#!/bin/bash
set -e

JAVA17_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home

if [ -d "$JAVA17_HOME" ]; then
  export JAVA_HOME="$JAVA17_HOME"
  export ANDROID_HOME="$HOME/Library/Android/sdk"
  export PATH="$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools:$PATH"
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR/../android" && ./gradlew clean
