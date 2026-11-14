# Real-touch UI test (XCUITest) for the iOS shell

Added 2026-11-14 for the P0 drawing bug (`docs/BUGFIX_LOG.md`). It sends **real touches** to the Simulator, which `-LittleDaysTap` / `-LittleDaysCheck` cannot do: those only call `click()` from JavaScript, and they miss iOS-only problems such as buttons hidden under the status bar.

The repository's Xcode project is **not** changed. The test target is added only to a temporary copy in `/tmp`:

```bash
rm -rf /tmp/ld-uitest && mkdir -p /tmp/ld-uitest
git -C ~/Documents/Developer/Notebook archive origin/v33-write-first-community | tar -x -C /tmp/ld-uitest
cd /tmp/ld-uitest
mkdir -p Native/UITests && cp tools/mac/uitest/DrawUITests.swift Native/UITests/ && cp tools/mac/uitest/probe.js /tmp/ld-uitest/probe.js
python3 tools/mac/uitest/add_uitest_target.py Native/LittleDays.xcodeproj/project.pbxproj
xcodebuild build -project Native/LittleDays.xcodeproj -scheme LittleDays -destination "id=<simulator>" -derivedDataPath /tmp/ld-uitest/DD
# then add the shared scheme from tools/mac/uitest/CapidayUITests.xcscheme into Native/LittleDays.xcodeproj/xcshareddata/xcschemes/
xcodebuild test -project Native/LittleDays.xcodeproj -scheme CapidayUITests -destination "id=<simulator>" -derivedDataPath /tmp/ld-uitest/DD ONLY_ACTIVE_ARCH=YES ARCHS=arm64
```

- Uninstall `com.capiday.app` from the Simulator first, so the run starts from a fresh install.
- Each step prints a line starting with `LDSTEP`. Screenshots go to `/tmp/ld-uitest/shots/`.
- `probe.js` only reads the page. It publishes the state through an accessibility label, and when a dialog is open it moves into that dialog, because a modal dialog hides everything else from accessibility.
- Gotchas found while setting this up:
  - Build the app once with the automatic `LittleDays` scheme before running `test`, otherwise the test scheme can't find the `LittleDaysUI` module.
  - Pass `ONLY_ACTIVE_ARCH=YES ARCHS=arm64`, otherwise it also builds for x86_64 and fails.
