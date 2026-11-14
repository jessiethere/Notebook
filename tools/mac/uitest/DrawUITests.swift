import XCTest

// V10.46 · real touches (XCUITest) on the Debug build, for the P0 drawing bug
// (docs/BUGFIX_LOG.md). Runs only in a temporary copy of the project (see
// tools/mac/uitest/README.md); the repository's Xcode project is not changed.
// The page state comes from probe.js (an accessibility label "LDSTATE:{json}").
final class DrawUITests: XCTestCase {
    var app: XCUIApplication!

    func state() -> [String: Any] {
        let el = app.descendants(matching: .any).matching(NSPredicate(format: "label BEGINSWITH 'LDSTATE:'")).firstMatch
        guard el.exists else { return [:] }
        return (try? JSONSerialization.jsonObject(with: Data(String(el.label.dropFirst(8)).utf8))) as? [String: Any] ?? [:]
    }
    func log(_ step: String) {
        let s = state()
        let keys = ["dlg", "studio", "reader", "ctx", "drawing", "saved", "draftDrawings", "dayInk", "bgmPlaying", "bgmGain", "volOut", "recordStatus", "voiceSrc", "voicePlaying", "voiceT", "voices", "session", "down", "up"]
        print("LDSTEP \(step) | " + keys.map { "\($0)=\(s[$0].map { "\($0)" }?.replacingOccurrences(of: "\n", with: "") ?? "-")" }.joined(separator: " "))
        try? XCUIScreen.main.screenshot().pngRepresentation.write(to: URL(fileURLWithPath: "/tmp/ld-uitest/shots/\(step).png"))
    }
    func rect(_ key: String) -> CGRect? {
        guard let a = state()[key] as? [Double], a.count == 4 else { return nil }
        return CGRect(x: a[0], y: a[1], width: a[2], height: a[3])
    }
    func point(_ r: CGRect, _ fx: Double, _ fy: Double) -> XCUICoordinate {
        app.webViews.firstMatch.coordinate(withNormalizedOffset: .zero).withOffset(CGVector(dx: r.minX + r.width * fx, dy: r.minY + r.height * fy))
    }
    func waitFor(_ key: String, _ seconds: Double = 15) -> CGRect? {
        let end = Date().addingTimeInterval(seconds)
        while Date() < end { if let r = rect(key) { return r }; Thread.sleep(forTimeInterval: 0.3) }
        return nil
    }
    func tap(_ key: String, _ fx: Double = 0.5, _ fy: Double = 0.5, wait: Double = 0.8) {
        guard let r = waitFor(key, 8) else { XCTFail("not found: \(key)"); return }
        point(r, fx, fy).tap()
        Thread.sleep(forTimeInterval: wait)
    }
    func stroke(_ board: CGRect, _ a: (Double, Double), _ b: (Double, Double)) {
        point(board, a.0, a.1).press(forDuration: 0.05, thenDragTo: point(board, b.0, b.1))
    }
    func launch(check: String = "/tmp/ld-uitest/probe.js") {
        app = XCUIApplication()
        app.launchArguments = ["-AppleLanguages", "(zh-Hans)", "-AppleLocale", "zh_CN", "-LittleDaysCheck", check]
        app.launch()
        if check != "/tmp/ld-uitest/probe.js" { return }
        let probe = app.descendants(matching: .any).matching(NSPredicate(format: "label BEGINSWITH 'LDSTATE:'")).firstMatch
        XCTAssertTrue(probe.waitForExistence(timeout: 90), "probe")
    }

    func testDrawSelectSave() throws {
        try? FileManager.default.createDirectory(atPath: "/tmp/ld-uitest/shots", withIntermediateDirectories: true)
        launch()
        // 1. Home → 手绘 → two strokes → 完成 (A: the bar must be tappable).
        let draw = app.buttons.matching(NSPredicate(format: "label BEGINSWITH '手绘'")).firstMatch
        XCTAssertTrue(draw.waitForExistence(timeout: 30), "draw tile")
        draw.tap()
        guard let board = waitFor("drawCanvas") else { log("0-no-board"); XCTFail("board"); return }
        stroke(board, (0.15, 0.15), (0.32, 0.22))
        stroke(board, (0.70, 0.78), (0.86, 0.86))
        log("1-drawn")
        tap("drawDone", wait: 2.5)
        log("2-after-done")
        XCTAssertEqual(state()["dlg"] as? String, "", "A: 完成 closes the board")
        if rect("skip") != nil { tap("skip") }
        // 2. Select by tapping ink, move it.
        guard let canvas = rect("canvas") else { XCTFail("canvas"); return }
        point(canvas, 0.78, 0.82).tap() // the first drawing's lower stroke
        Thread.sleep(forTimeInterval: 1.0)
        log("3-tap-ink")
        XCTAssertEqual(state()["ctx"] as? String, "drawing", "ink selects the drawing")
        if let d = rect("drawing") {
            point(d, 0.5, 0.5).press(forDuration: 0.15, thenDragTo: point(d, 0.5, 0.5).withOffset(CGVector(dx: -20, dy: -20)))
            Thread.sleep(forTimeInterval: 1.5)
        }
        log("4-dragged")
        // 3. B: text added, then a second drawing over it; tap the text.
        tap("back")
        tap("addText", wait: 1.2)
        log("4b-text-added") // a new box has its default words; nothing to type
        // Put the keyboard away and leave the text, as a person would: tap the
        // bare paper outside the drawing (bottom-left corner).
        for _ in 0..<2 where state()["ctx"] as? String != "" || app.keyboards.count > 0 {
            if let c = rect("canvas") { point(c, 0.04, 0.97).tap(); Thread.sleep(forTimeInterval: 1.0) }
        }
        log("4c-left-text")
        tap("more")
        tap("drawNew", wait: 1.5)
        if let b2 = waitFor("drawCanvas") {
            stroke(b2, (0.08, 0.08), (0.2, 0.12))
            stroke(b2, (0.8, 0.9), (0.92, 0.94))
            tap("drawDone", wait: 2.5)
        }
        if rect("back") != nil { tap("back") }
        Thread.sleep(forTimeInterval: 1.0) // the ink map is read after render
        log("5-second-drawing")
        tap("text", wait: 1.0)
        log("6-tap-text-under-drawing")
        XCTAssertEqual(state()["ctx"] as? String, "text", "B: the text under the empty part is picked")
        // 4. C: 接着画 + a stroke + 取消 asks first.
        for _ in 0..<2 where state()["ctx"] as? String != "" || app.keyboards.count > 0 {
            if let c = rect("canvas") { point(c, 0.04, 0.97).tap(); Thread.sleep(forTimeInterval: 1.0) }
        }
        if let c = rect("canvas") { point(c, 0.86, 0.92).tap(); Thread.sleep(forTimeInterval: 1.0) }
        log("6b-tap-second-ink")
        if rect("again") != nil {
            tap("again", wait: 1.5)
            if let b3 = waitFor("drawCanvas") { stroke(b3, (0.4, 0.4), (0.6, 0.5)) }
            tap("drawCancel", wait: 1.0)
            log("7-cancel-asks")
            XCTAssertEqual(state()["dlg"] as? String, "confirm-dialog", "C: 取消 with new strokes asks first")
            tap("confirmOk", wait: 1.2)
        } else { XCTFail("the second drawing was not selected by its ink") }
        if rect("back") != nil { tap("back") }
        // 5. Save → Reader.
        tap("save", wait: 3)
        log("8-saved")
        XCTAssertEqual(state()["reader"] as? Bool, true)
        // 6. Close the app completely, open again: the drawings are still there and draw.
        app.terminate()
        launch()
        Thread.sleep(forTimeInterval: 2)
        // Today's pages are further down Home: scroll until the entry is on screen.
        for _ in 0..<4 where (rect("openDay")?.maxY ?? 9999) > app.webViews.firstMatch.frame.height - 120 {
            app.webViews.firstMatch.swipeUp(velocity: .slow)
            Thread.sleep(forTimeInterval: 0.8)
        }
        tap("openDay", wait: 3)
        log("9-reopened")
        XCTAssertGreaterThanOrEqual(state()["saved"] as? Int ?? 0, 2, "both drawings saved")
        XCTAssertGreaterThanOrEqual(state()["dayInk"] as? Int ?? 0, 2, "and drawn after a restart")
    }

    // V10.47 · Bug 2: two pages on one day, both deleted from 页面目录 → asked →
    // the day is empty; after closing the app it stays empty; 恢复 brings it back.
    func testClearDay() throws {
        try? FileManager.default.createDirectory(atPath: "/tmp/ld-uitest/shots", withIntermediateDirectories: true)
        launch()
        for n in 1...2 {
            if n > 1 {
                // After 完成 the saved page opens in the Reader: back, then Home.
                for _ in 0..<3 where rect("navHome") == nil && rect("readerBack") != nil { tap("readerBack", wait: 1.2) }
                tap("navHome", wait: 1.5)
            }
            let draw = app.buttons.matching(NSPredicate(format: "label BEGINSWITH '手绘'")).firstMatch
            XCTAssertTrue(draw.waitForExistence(timeout: 30), "draw tile")
            draw.tap()
            guard let board = waitFor("drawCanvas") else { XCTFail("board"); return }
            stroke(board, (0.3, 0.3), (0.6, 0.5))
            tap("drawDone", wait: 2.5)
            if rect("skip") != nil { tap("skip") }
            tap("save", wait: 3)
        }
        log("c1-two-pages-saved")
        XCTAssertEqual(state()["saved"] as? Int, 2, "two pages with a drawing each")
        for _ in 0..<3 where rect("navCal") == nil && rect("readerBack") != nil { tap("readerBack", wait: 1.2) }
        tap("navCal", wait: 1.5)
        tap("todayCell", wait: 2)
        tap("editDate", wait: 2)
        if rect("skip") != nil { tap("skip") }
        tap("pagesManage", wait: 1.2)
        tap("pageRemove", wait: 1.0)
        if (state()["dlg"] as? String) == "confirm-dialog" { tap("confirmOk", wait: 1.2) }
        if rect("pageRemove") == nil { tap("pagesManage", wait: 1.2) }
        tap("pageRemove", wait: 1.2)
        log("c2-last-page-asks")
        XCTAssertEqual(state()["confirmText"] as? String, "删除这一页后，这一天将没有记录。")
        tap("confirmOk", wait: 2)
        log("c3-cleared")
        XCTAssertEqual(state()["calendar"] as? Bool, true, "back on the Calendar")
        XCTAssertEqual(state()["saved"] as? Int, 0)
        XCTAssertEqual(state()["draftDrawings"] as? Int, 0)
        app.terminate()
        launch()
        Thread.sleep(forTimeInterval: 2)
        log("c4-reopened")
        XCTAssertEqual(state()["saved"] as? Int, 0, "still empty after closing the app")
        XCTAssertEqual(state()["draftDrawings"] as? Int, 0)
        tap("navCal", wait: 1.5)
        tap("todayCell", wait: 1.5)
        tap("restore", wait: 2)
        log("c5-restored")
        XCTAssertEqual(state()["saved"] as? Int, 2, "恢复 brings both pages back")
    }

    // V10.49 · the music volume on iPhone: <audio>.volume does nothing on iOS,
    // so the music goes through a Web Audio gain. Real taps: play a piece from
    // a book's music sheet, then drag the volume slider.
    func testMusicVolume() throws {
        try? FileManager.default.createDirectory(atPath: "/tmp/ld-uitest/shots", withIntermediateDirectories: true)
        launch()
        if rect("skip") != nil { tap("skip") }
        tap("navBooks", wait: 1.5)
        tap("shelfSpine", wait: 1.5)
        tap("shelfBook", wait: 2)
        tap("bookMusic", wait: 1.5)
        tap("musicPreview", 0.5, 0.5, wait: 3)
        log("m1-playing")
        XCTAssertEqual(state()["bgmPlaying"] as? Bool, true, "the piece plays")
        XCTAssertEqual(state()["bgmGain"] as? String, "1", "through the gain")
        guard let v = rect("musicVolume") else { XCTFail("slider"); return }
        // An iOS slider moves only when the thumb itself is dragged: start on it.
        let start = (Double((state()["volOut"] as? String ?? "70").filter(\.isNumber)) ?? 70) / 100
        point(v, start, 0.5).press(forDuration: 0.3, thenDragTo: point(v, 0.05, 0.5))
        Thread.sleep(forTimeInterval: 1)
        log("m2-quiet")
        let quiet = state()["volOut"] as? String ?? ""
        let now = (Double(quiet.filter(\.isNumber)) ?? 0) / 100
        point(v, max(0.03, now), 0.5).press(forDuration: 0.3, thenDragTo: point(v, 0.95, 0.5))
        Thread.sleep(forTimeInterval: 1)
        log("m3-loud")
        let loud = state()["volOut"] as? String ?? ""
        print("LDSTEP volume \(quiet) -> \(loud)")
        XCTAssertNotEqual(quiet, loud, "the slider moves")
        XCTAssertEqual(state()["bgmPlaying"] as? Bool, true, "still playing after changing the volume")
    }

    // P0 voice: what the iPhone web view really records, and whether that file
    // loads and decodes (tools/mac/uitest/voice-check.js). Allows the in-app
    // microphone question when WebKit asks it.
    func testVoiceFormats() throws {
        launch(check: "/tmp/ld-uitest/voice-check.js")
        let end = Date().addingTimeInterval(60)
        var result = ""
        while Date() < end {
            for name in ["允许", "Allow"] where app.alerts.buttons[name].exists { app.alerts.buttons[name].tap() }
            let el = app.descendants(matching: .any).matching(NSPredicate(format: "label BEGINSWITH 'LDREC:'")).firstMatch
            if el.exists, !el.label.contains("running") { result = el.label; break }
            Thread.sleep(forTimeInterval: 0.5)
        }
        print("LDSTEP voice \(result)")
        XCTAssertFalse(result.isEmpty, "the check finished")
        // A real tap plays each file (the app plays only after a tap).
        for name in ["LDPLAY-webm", "LDPLAY-mp4"] {
            let b = app.buttons[name]
            if b.waitForExistence(timeout: 5) { b.tap(); Thread.sleep(forTimeInterval: 3) }
        }
        let el = app.descendants(matching: .any).matching(NSPredicate(format: "label BEGINSWITH 'LDREC:'")).firstMatch
        print("LDSTEP voice-played \(el.label)")
    }

    // P0 video import: an off-page <video> on a blob URL, without a tap and
    // after a real tap (tools/mac/uitest/video-check.js).
    func testVideoMetadata() throws {
        launch(check: "/tmp/ld-uitest/video-check.js")
        let label = { () -> String in self.app.descendants(matching: .any).matching(NSPredicate(format: "label BEGINSWITH 'LDVID:'")).firstMatch.label }
        let end = Date().addingTimeInterval(40)
        while Date() < end, !(label().contains("noTap")) { Thread.sleep(forTimeInterval: 0.5) }
        let b = app.buttons["LDVID-tap"]
        if b.waitForExistence(timeout: 5) { b.tap() }
        let end2 = Date().addingTimeInterval(15)
        while Date() < end2, !(label().contains("afterTap")) { Thread.sleep(forTimeInterval: 0.5) }
        print("LDSTEP video \(label())")
    }

    // V10.50 · P0 voice: record 5 s with real taps → stop → play right away
    // (really playing: time moves) → save → close the app → play again.
    // The Simulator plays through the Mac's speakers, so the iPhone earpiece
    // problem itself can only be checked on a real iPhone.
    func testVoiceRecordPlay() throws {
        try? FileManager.default.createDirectory(atPath: "/tmp/ld-uitest/shots", withIntermediateDirectories: true)
        launch()
        if rect("skip") != nil { tap("skip") }
        tap("quickOpen", wait: 1.2)
        tap("quickVoice", wait: 0.8)
        tap("quickStart", wait: 2)
        if rect("skip") != nil { tap("skip") }
        tap("recordAudio", wait: 1)
        for name in ["允许", "Allow", "好"] where app.alerts.buttons[name].exists { app.alerts.buttons[name].tap() }
        Thread.sleep(forTimeInterval: 5)
        log("v1-recording")
        XCTAssertEqual(state()["session"] as? String, "play-and-record")
        tap("stopRecording", wait: 4)
        log("v2-stopped")
        XCTAssertEqual(state()["voiceSrc"] as? Bool, true, "the clip is on the page")
        XCTAssertEqual(state()["session"] as? String, "playback", "back to playback after recording")
        tap("voicePlay", wait: 2.5)
        log("v3-playing")
        XCTAssertEqual(state()["voicePlaying"] as? Bool, true, "really playing")
        XCTAssertGreaterThan(state()["voiceT"] as? Double ?? 0, 0.5, "time moves")
        tap("save", wait: 3)
        log("v4-saved")
        XCTAssertEqual(state()["voices"] as? Int, 1, "saved in the journal")
        app.terminate()
        launch()
        Thread.sleep(forTimeInterval: 2)
        for _ in 0..<4 where (rect("openDay")?.maxY ?? 9999) > app.webViews.firstMatch.frame.height - 120 {
            app.webViews.firstMatch.swipeUp(velocity: .slow)
            Thread.sleep(forTimeInterval: 0.8)
        }
        tap("openDay", wait: 3)
        log("v5-reopened")
        tap("voicePlay", wait: 2.5)
        log("v6-playing-again")
        XCTAssertEqual(state()["voicePlaying"] as? Bool, true, "plays after the app was closed")
        XCTAssertGreaterThan(state()["voiceT"] as? Double ?? 0, 0.5)
    }
}
