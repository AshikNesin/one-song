#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/_env.sh"

cd "$SCRIPT_DIR/.."

pnpm react-native run-android --no-packager "$@"
