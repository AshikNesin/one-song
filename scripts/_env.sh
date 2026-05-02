#!/bin/bash
# Shared environment setup for Android build scripts

JAVA17_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home

if [ -d "$JAVA17_HOME" ]; then
  export JAVA_HOME="$JAVA17_HOME"
fi

if [ -d "$HOME/Library/Android/sdk" ]; then
  export ANDROID_HOME="$HOME/Library/Android/sdk"
  export PATH="$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools:$PATH"
fi
