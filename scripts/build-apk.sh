#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export JAVA_HOME="${JAVA_HOME:-/opt/homebrew/opt/openjdk@21}"
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH"

npx expo prebuild --platform android --non-interactive || true

printf 'sdk.dir=%s\n' "$ANDROID_HOME" > android/local.properties

cd android
./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a
cd "$ROOT"

mkdir -p dist
cp -f android/app/build/outputs/apk/release/app-release.apk dist/lockout.apk
ls -lh dist/lockout.apk
echo "APK: $ROOT/dist/lockout.apk"
