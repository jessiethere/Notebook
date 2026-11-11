import XCTest
@testable import LittleDaysCore

final class CoreTests: XCTestCase {
    func testV3CatalogAndCommercialFontNotices() throws {
        let catalog = try SharedResources.decode(AssetCatalog.self, named: "library")
        XCTAssertEqual(catalog.fonts.count, 11)
        XCTAssertEqual(catalog.stickers.count, 23)
        XCTAssertEqual(Set(catalog.stickers.map(\.category)).count, 10)
        for font in catalog.fonts {
            let license = try SharedResources.libraryData(category: "fonts", filename: font.license)
            XCTAssertTrue(String(decoding: license, as: UTF8.self).contains("SIL OPEN FONT LICENSE"))
        }
        let sticker = try SharedResources.libraryData(category: "stickers", filename: catalog.stickers[0].nativeFile)
        XCTAssertGreaterThan(sticker.count, 1000)
        // Original scene illustrations (photo-like material) and their notice.
        let scenes = try XCTUnwrap(catalog.scenes)
        XCTAssertEqual(scenes.count, 33)
        XCTAssertEqual(catalog.sceneCollections?.count, 2)
        XCTAssertEqual(scenes.filter { $0.retired == true }.count, 23)
        // Real photos for a page's picture (Unsplash License) and their source list.
        let photos = try XCTUnwrap(catalog.photos)
        XCTAssertEqual(photos.count, 78)
        XCTAssertEqual(catalog.photoCollections?.count, 13)
        XCTAssertEqual(photos.filter { $0.backdrop == true }.count, 10)
        let photo = try SharedResources.libraryData(category: "photos", filename: photos[0].file)
        XCTAssertEqual(Array(photo.prefix(2)), [0xFF, 0xD8])
        XCTAssertTrue(String(decoding: try SharedResources.libraryData(category: "photos", filename: photos[0].license), as: UTF8.self).contains("Unsplash License"))
        let scene = try SharedResources.libraryData(category: "scenes", filename: scenes[0].file)
        XCTAssertTrue(String(decoding: scene, as: UTF8.self).hasPrefix("<svg"))
        XCTAssertNoThrow(try SharedResources.libraryData(category: "scenes", filename: scenes[0].license))
        XCTAssertThrowsError(try SharedResources.libraryData(category: "fonts", filename: "../../seed.json"))
        // Original background music (tools/make_music.py) and its notice.
        let music = try XCTUnwrap(catalog.music)
        XCTAssertEqual(music.count, 8)
        // V6.4 story kits use fonts and stickers that exist.
        let kits = try XCTUnwrap(catalog.kits)
        XCTAssertEqual(kits.map(\.id), ["cream", "blush", "sage", "kraft"])
        XCTAssertTrue(kits.allSatisfy { kit in kit.stickers.allSatisfy { id in catalog.stickers.contains { $0.id == id } } })
        let track = try SharedResources.libraryData(category: "music", filename: music[0].file)
        XCTAssertGreaterThan(track.count, 100_000)
        XCTAssertTrue(String(decoding: try SharedResources.libraryData(category: "music", filename: music[0].license), as: UTF8.self).contains("Original music"))
        XCTAssertThrowsError(try SharedResources.libraryData(category: "music", filename: "LD-photo-latte-art.jpg"))
        // Little Keeper V8.0: Captain only (Normal, Happy, Sleepy, Peek), cut out of the approved reference.
        let keepers = try XCTUnwrap(catalog.keepers)
        XCTAssertEqual(keepers.map(\.mood), ["normal", "happy", "sleepy", "peek"])
        XCTAssertEqual(Set(keepers.map(\.animal)), ["cat"])
        let keeperPNG = try SharedResources.libraryData(category: "keepers", filename: keepers[0].file)
        XCTAssertEqual(Array(keeperPNG.prefix(4)), [0x89, 0x50, 0x4E, 0x47])
        XCTAssertThrowsError(try SharedResources.libraryData(category: "keepers", filename: "LD-photo-latte-art.jpg"))
    }

    func testLegacyJournalWithoutV3FieldsStillDecodes() throws {
        let seed = try SharedResources.decode(Seed.self, named: "seed")
        let state = DayState(seed: seed, today: "2026-11-07")
        var object = try JSONSerialization.jsonObject(with: JSONEncoder().encode(state)) as! [String: Any]
        var entries = object["entries"] as! [[String: Any]]
        for index in entries.indices { for key in ["media", "textStyle", "bodyFont", "visibility", "fieldValues"] { entries[index].removeValue(forKey: key) } }
        object["entries"] = entries
        let decoded = try JSONDecoder().decode(DayState.self, from: JSONSerialization.data(withJSONObject: object))
        XCTAssertEqual(decoded.entries[0].body, state.entries[0].body)
        XCTAssertEqual(decoded.entries[0].photo, state.entries[0].photo)
        XCTAssertNil(decoded.entries[0].media)
    }

    func testV3MediaFieldsFontsAndArtSurviveSwiftRoundTrip() throws {
        let seed = try SharedResources.decode(Seed.self, named: "seed")
        var object = try JSONSerialization.jsonObject(with: JSONEncoder().encode(DayState(seed: seed, today: "2026-11-07"))) as! [String: Any]
        var books = object["books"] as! [[String: Any]]
        books[0]["description"] = "我的植物"
        books[0]["visibility"] = "private"
        books[0]["coverTemplate"] = "floral-notebook"
        books[0]["music"] = "morning-piano"
        books[0]["tags"] = ["阅读", "self awareness"]
        object["keeper"] = ["enabled": true, "animal": "westie", "outfit": "beret", "name": "糯米", "mode": "interactive", "allowMemories": false, "revisits": ["2026-11-10"]]
        books[0]["fields"] = [["id": "water", "label": "浇水", "type": "checkbox"]]
        object["books"] = books
        var entries = object["entries"] as! [[String: Any]]
        entries[0]["media"] = [["id": "clip", "kind": "audio", "name": "声音日记", "mime": "audio/webm", "source": "media:test-audio", "size": 200, "duration": 2.5]]
        entries[0]["fieldValues"] = ["water": true, "minutes": 12]
        entries[0]["font"] = "handwritten"
        entries[0]["bodyFont"] = "chinese"
        // V10.1: alignment chosen for the title / the words (optional).
        entries[0]["textStyle"] = ["size": 24, "color": "#2F2A26", "align": "center"]
        entries[0]["bodyStyle"] = ["align": "right"]
        entries[0]["layers"] = [["id": "art", "kind": "sticker", "text": "Little bear", "assetId": "bear", "x": 20, "y": 40, "scale": 1.2, "rotation": 15]]
        object["entries"] = entries
        var decoded = try JSONDecoder().decode(DayState.self, from: JSONSerialization.data(withJSONObject: object))
        decoded.save(decoded.entries[0])
        let reloaded = try JSONDecoder().decode(DayState.self, from: JSONEncoder().encode(decoded))
        XCTAssertEqual(reloaded.entries[0].media?[0].source, "media:test-audio")
        XCTAssertEqual(reloaded.entries[0].layers[0].assetId, "bear")
        XCTAssertEqual(reloaded.entries[0].bodyFont, "chinese")
        XCTAssertEqual(reloaded.entries[0].textStyle?.align, "center")
        XCTAssertEqual(reloaded.entries[0].bodyStyle?.align, "right")
        XCTAssertEqual(reloaded.entries[0].fieldValues?["water"], .bool(true))
        XCTAssertEqual(reloaded.books[0].fields?[0].type, "checkbox")
        XCTAssertEqual(reloaded.books[0].music, "morning-piano")
        XCTAssertEqual(reloaded.books[0].tags, ["阅读", "self awareness"])
        XCTAssertEqual(reloaded.keeper?.animal, "westie")
        XCTAssertEqual(reloaded.keeper?.outfit, "beret")
        XCTAssertEqual(reloaded.keeper?.mode, "interactive")
        XCTAssertEqual(reloaded.keeper?.allowMemories, false)
    }
    func testV31MomentsFreeLayoutAndGrowthNotesRoundTrip() throws {
        let seed = try SharedResources.decode(Seed.self, named: "seed")
        var object = try JSONSerialization.jsonObject(with: JSONEncoder().encode(DayState(seed: seed, today: "2026-11-07"))) as! [String: Any]
        var entries = object["entries"] as! [[String: Any]]
        let photo: [String: Any] = ["id": "p1", "kind": "photo", "text": "a.jpg", "mediaRef": "media:p1", "x": 33, "y": 44, "w": 50, "h": 40, "scale": 1, "rotation": 7, "frame": "polaroid", "tape": true, "crop": ["x": 20, "y": 70, "zoom": 1.5], "sourceRef": "media:orig", "shape": "heart", "edit": ["filter": "warm", "brightness": 10, "ratio": "1:1", "rotate": 90, "text": ["value": "周末", "style": "label", "color": "#FFFFFF", "size": 9, "x": 50, "y": 82]]]
        let drawing: [String: Any] = ["id": "d1", "kind": "photo", "text": "drawing", "mediaRef": "media:ink", "x": 40, "y": 30, "w": 60, "h": 20, "scale": 1, "rotation": 0, "frame": "bare", "drawing": true, "aspect": 1.5]
        entries[0]["moments"] = [["id": "m1", "title": "Gym Session", "time": "08:00", "body": "squats", "tags": ["fitness"], "backdrop": "scene:color-peach", "music": "rainy-window", "capturedAt": "2026-11-09T08:10:00.000Z", "kit": "blush", "layoutStyle": "cozy", "textStyle": ["size": 30, "color": "#7D8E66"], "bodyStyle": ["size": 16], "layers": [photo, drawing], "media": [["id": "c", "kind": "audio", "name": "voice", "mime": "audio/webm", "source": "media:v", "origin": "recording"]]]]
        entries[0]["backdrop"] = "scene:sky-moon"
        entries[0]["photo"] = "photo:latte-art"
        entries[0]["layers"] = [["id": "g", "kind": "growth", "text": "Move", "habitId": "move", "checkDate": "2026-11-07", "x": 50, "y": 50, "w": 62, "scale": 1, "rotation": -2]]
        object["entries"] = entries
        object["checks"] = [["habitId": "move", "date": "2026-11-07", "minutes": 60, "detail": "Lower Body", "note": "左腿发力更好", "shareNote": false]]
        object["reflections"] = [["id": "r", "period": "week", "key": "2026-11-02", "wentWell": "3 次训练"]]
        let decoded = try JSONDecoder().decode(DayState.self, from: JSONSerialization.data(withJSONObject: object))
        let reloaded = try JSONDecoder().decode(DayState.self, from: JSONEncoder().encode(decoded))
        let moment = try XCTUnwrap(reloaded.entries[0].moments?.first)
        XCTAssertEqual(moment.title, "Gym Session")
        XCTAssertEqual(moment.layers?.first?.w, 50)
        XCTAssertEqual(moment.layers?.first?.crop?.zoom, 1.5)
        // V3.6 photo editor: the original and the edit settings survive.
        XCTAssertEqual(moment.layers?.first?.sourceRef, "media:orig")
        XCTAssertEqual(moment.layers?.first?.edit?.filter, "warm")
        XCTAssertEqual(moment.layers?.first?.edit?.text?.value, "周末")
        XCTAssertEqual(moment.layers?.first?.shape, "heart")
        // V5.2 hand drawing: stays a drawing (not a layout photo).
        XCTAssertEqual(moment.layers?.last?.drawing, true)
        XCTAssertEqual(moment.layers?.last?.aspect, 1.5)
        XCTAssertEqual(moment.textStyle?.color, "#7D8E66")
        XCTAssertEqual(moment.bodyStyle?.size, 16)
        XCTAssertEqual(moment.music, "rainy-window")
        XCTAssertEqual(moment.capturedAt, "2026-11-09T08:10:00.000Z")
        XCTAssertEqual(moment.kit, "blush")
        XCTAssertEqual(moment.layoutStyle, "cozy")
        // V6.5: a text layer bound to a Moment's words decodes too.
        let bound = try JSONDecoder().decode(StickerLayer.self, from: Data(#"{"id":"t","kind":"text","text":"","x":50,"y":90,"scale":1,"rotation":0,"bind":"title","of":"m1","excerpt":20,"gen":true,"chip":"#B4547A"}"#.utf8))
        XCTAssertEqual(bound.bind, "title")
        XCTAssertEqual(bound.of, "m1")
        XCTAssertEqual(bound.gen, true)
        XCTAssertEqual(moment.media?.first?.origin, "recording")
        // Page backgrounds and library photos keep their references.
        XCTAssertEqual(moment.backdrop, "scene:color-peach")
        XCTAssertEqual(reloaded.entries[0].backdrop, "scene:sky-moon")
        XCTAssertEqual(reloaded.entries[0].photo, "photo:latte-art")
        XCTAssertEqual(reloaded.entries[0].layers.first?.habitId, "move")
        XCTAssertEqual(reloaded.checks.first?.note, "左腿发力更好")
        XCTAssertEqual(reloaded.reflections?.first?.wentWell, "3 次训练")
        // Editing a note keeps one check per habit/date, so weekly counts stay the same.
        XCTAssertEqual(reloaded.weeklyCount(habitId: "move", date: "2026-11-07"), 1)
    }

    func testSharedResourcesAndDates() throws {
        let tokens = try SharedResources.decode(DesignTokens.self, named: "design-tokens")
        XCTAssertEqual(tokens.colors["cream"], "#F8F5EF")
        XCTAssertGreaterThan(try SharedResources.mediaData(named: "coffee").count, 1000)
        let features = try SharedResources.decode(FeatureDefinition.self, named: "features")
        XCTAssertEqual(features.tabs.map(\.id), ["home", "calendar", "studio", "growth", "books"])
        // V6.6: Growth has no tab of its own (Home's "today" card + "My habits").
        XCTAssertEqual(features.tabs.filter { $0.inNav != false }.map(\.id), ["home", "calendar", "studio", "books"])
        XCTAssertEqual(DayKey.weekStart("2026-11-08"), "2026-11-02")
        XCTAssertEqual(DayKey.adding(1, to: "2026-12-31"), "2027-01-01")
    }

    func testChecksAndJournalUpsertShareDate() throws {
        let seed = try SharedResources.decode(Seed.self, named: "seed")
        var state = DayState(seed: seed, today: "2026-11-07")
        state.toggleCheck(habitId: "reading", date: "2026-11-07", minutes: 25)
        XCTAssertEqual(state.weeklyCount(habitId: "reading", date: "2026-11-08"), 1)
        XCTAssertEqual(state.checks.first?.minutes, 25)
        let entry = JournalEntry(date: "2026-11-07", title: "今天读了书")
        state.save(entry)
        XCTAssertEqual(state.entries.filter { $0.date == "2026-11-07" }.count, 1)
        XCTAssertEqual(state.checks.first?.date, state.entries.first?.date)
        state.toggleCheck(habitId: "reading", date: "2026-11-07")
        XCTAssertTrue(state.checks.isEmpty)
        let encoded = try JSONEncoder().encode(state)
        XCTAssertEqual(try JSONDecoder().decode(DayState.self, from: encoded).entries.first?.title, "今天读了书")
    }
}
