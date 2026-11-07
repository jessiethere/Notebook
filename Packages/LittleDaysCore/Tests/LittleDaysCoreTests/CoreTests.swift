import XCTest
@testable import LittleDaysCore

final class CoreTests: XCTestCase {
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
