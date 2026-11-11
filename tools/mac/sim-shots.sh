#!/bin/bash
# Little Days · screenshots of the real iPhone app in the Simulator (Debug build).
#   bash tools/mac/sim-shots.sh                  # iPhone 18 Pro
#   bash tools/mac/sim-shots.sh "iPhone 17e"     # another simulator (name from: xcrun simctl list devices)
# Builds the app (Debug), installs it, then opens Home, Calendar, the shelf and
# Journal Studio one at a time and saves a PNG of each to build/sim-shots/.
# Screens are opened with the Debug-only launch argument -LittleDaysTap (see
# LittleDaysWebShellView.swift); Release builds ignore it. Uses the app's own
# data on that simulator: nothing is erased.
set -e
cd "$(dirname "$0")/../.."
NAME="${1:-iPhone 18 Pro}"
APP_ID="com.jessiethere.littledays"
OUT="build/sim-shots"
mkdir -p "$OUT"

python3 tools/sync_native_web.py
xcodebuild -project Native/LittleDays.xcodeproj -scheme LittleDays -configuration Debug \
  -destination "platform=iOS Simulator,name=$NAME" -derivedDataPath build/DerivedData build -quiet
APP="build/DerivedData/Build/Products/Debug-iphonesimulator/LittleDays.app"

xcrun simctl boot "$NAME" 2>/dev/null || true
xcrun simctl bootstatus "$NAME" -b >/dev/null
xcrun simctl install "$NAME" "$APP"

shot() { # shot <file> <wait seconds> [taps]
  xcrun simctl terminate "$NAME" "$APP_ID" 2>/dev/null || true
  if [ -n "$3" ]; then xcrun simctl launch "$NAME" "$APP_ID" -LittleDaysTap "$3" >/dev/null
  else xcrun simctl launch "$NAME" "$APP_ID" >/dev/null; fi
  sleep "$2"
  xcrun simctl io "$NAME" screenshot "$OUT/$1.png" >/dev/null 2>&1
  echo "saved $OUT/$1.png"
}
start=$(date +%s)
shot 01-home 12
echo "first screen after about $(( $(date +%s) - start ))s (includes waiting)"
# "body" steps only wait (~0.8 s each): Home re-renders once after its data
# loads, and a tap before that is lost.
shot 02-calendar 12 'body||body||body||#navigation [data-page="calendar"]'
shot 03-shelf 12 'body||body||body||#navigation [data-page="books"]'
shot 04-studio 14 'body||body||body||[data-action="today-write"]'
