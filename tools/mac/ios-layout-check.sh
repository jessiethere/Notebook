#!/bin/zsh
# V10.35 · Layout check L4 in the iOS Simulator (the iPhone's own fonts).
# Needs a Debug build of the app (it reads the Debug-only -LittleDaysCheck).
#   tools/mac/ios-layout-check.sh <simulator id> <zh|en> <path to LittleDays.app> [screenshot folder]
# Runs the eight cases of tests/v133-browser.cjs inside the app and prints the
# JSON report; with a folder, a screenshot every 1.5 s (named by the time, in
# ms, to match the report's "at").
DEV=$1; LANG_=$2; APP=$3; SHOTS=$4
JS=/tmp/ld-check-$LANG_.js
LOG=/tmp/ld-check-$LANG_.log
{ print -r -- "const CHECK_LANG = \"$LANG_\";"; cat "${0:A:h}/ios-layout-check.js"; } > $JS
xcrun simctl install $DEV $APP
xcrun simctl terminate $DEV com.jessiethere.littledays 2>/dev/null
: > $LOG
xcrun simctl launch --console-pty $DEV com.jessiethere.littledays -LittleDaysCheck $JS > $LOG 2>&1 &
[[ -n $SHOTS ]] && mkdir -p $SHOTS
for i in {1..200}; do
  sleep 1.5
  [[ -n $SHOTS ]] && xcrun simctl io $DEV screenshot --type=png $SHOTS/$LANG_-$(python3 -c 'import time;print(int(time.time()*1000))').png >/dev/null 2>&1
  grep -q '^LittleDaysCheck: {\|LittleDaysCheck failed' $LOG && break
done
xcrun simctl terminate $DEV com.jessiethere.littledays 2>/dev/null
grep 'LittleDaysCheck' $LOG
