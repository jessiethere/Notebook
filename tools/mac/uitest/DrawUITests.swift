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
        let keys = ["dlg", "studio", "reader", "ctx", "drawing", "saved", "draftDrawings", "dayInk", "down", "up"]
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
    func launch() {
        app = XCUIApplication()
        app.launchArguments = ["-AppleLanguages", "(zh-Hans)", "-AppleLocale", "zh_CN", "-LittleDaysCheck", "/tmp/ld-uitest/probe.js"]
        app.launch()
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
}
