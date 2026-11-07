import XCTest
@testable import LittleDaysCore

final class CoreTests: XCTestCase {
    func testV3CatalogAndCommercialFontNotices() throws {
        let catalog = try SharedResources.decode(AssetCatalog.self, named: "library")
        XCTAssertEqual(catalog.fonts.count, 7)
        XCTAssertEqual(catalog.stickers.count, 23)
        XCTAssertEqual(Set(catalog.stickers.map(\.category)).count, 10)
        for font in catalog.fonts {
            let license = try SharedResources.libraryData(category: "fonts", filename: font.license)
            XCTAssertTrue(String(decoding: license, as: UTF8.self).contains("SIL OPEN FONT LICENSE"))
        }
        let sticker = try SharedResources.libraryData(category: "stickers", filename: catalog.stickers[0].nativeFile)
        XCTAssertGreaterThan(sticker.count, 1000)
        XCTAssertThrowsError(try SharedResources.libraryData(category: "fonts", filename: "../../seed.json"))
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
        books[0]["fields"] = [["id": "water", "label": "浇水", "type": "checkbox"]]
        object["books"] = books
        var entries = object["entries"] as! [[String: Any]]
        entries[0]["media"] = [["id": "clip", "kind": "audio", "name": "声音日记", "mime": "audio/webm", "source": "media:test-audio", "size": 200, "duration": 2.5]]
        entries[0]["fieldValues"] = ["water": true, "minutes": 12]
        entries[0]["font"] = "handwritten"
        entries[0]["bodyFont"] = "chinese"
        entries[0]["layers"] = [["id": "art", "kind": "sticker", "text": "Little bear", "assetId": "bear", "x": 20, "y": 40, "scale": 1.2, "rotation": 15]]
        object["entries"] = entries
        var decoded = try JSONDecoder().decode(DayState.self, from: JSONSerialization.data(withJSONObject: object))
        decoded.save(decoded.entries[0])
        let reloaded = try JSONDecoder().decode(DayState.self, from: JSONEncoder().encode(decoded))
        XCTAssertEqual(reloaded.entries[0].media?[0].source, "media:test-audio")
        XCTAssertEqual(reloaded.entries[0].layers[0].assetId, "bear")
        XCTAssertEqual(reloaded.entries[0].bodyFont, "chinese")
        XCTAssertEqual(reloaded.entries[0].fieldValues?["water"], .bool(true))
        XCTAssertEqual(reloaded.books[0].fields?[0].type, "checkbox")
    }
    func testSharedResourcesAndDates() throws {
        let tokens = try SharedResources.decode(DesignTokens.self, named: "design-tokens")
        XCTAssertEqual(tokens.colors["cream"], "#F8F5EF")
        XCTAssertGreaterThan(try SharedResources.mediaData(named: "coffee").count, 1000)
        let features = try SharedResources.decode(FeatureDefinition.self, named: "features")
        XCTAssertEqual(features.tabs.map(\.id), ["home", "calendar", "studio", "growth", "books"])
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
