import Foundation

public struct DesignTokens: Decodable {
    public let colors: [String: String]
    public let radius: [String: Int]
    public let fonts: [String: String]
}

public struct NavigationTab: Decodable, Identifiable {
    public let id: String
    public let title: String
    public let subtitle: String
    public let symbol: String
}

public struct MaterialTemplate: Decodable, Identifiable {
    public let id: String
    public let title: String
}

public struct FeatureDefinition: Decodable {
    public let tabs: [NavigationTab]
    public let templates: [MaterialTemplate]
    public let moods: [String]
    public let stickers: [String: [String]]
}

public struct JournalSeed: Decodable {
    public let id: String
    public let dayOffset: Int
    public let title: String
    public let body: String
    public let mood: String
    public let bookId: String
    public let photo: String
    public let template: String
    public let font: String
}

public struct Seed: Decodable {
    public let schemaVersion: Int
    public let habits: [Habit]
    public let books: [JournalBook]
    public let journals: [JournalSeed]
}

public enum SharedResources {
    public static func mediaData(named name: String) throws -> Data {
        guard ["coffee", "lake"].contains(name),
              let url = Bundle.module.url(forResource: name, withExtension: "jpg") else {
            throw CocoaError(.fileNoSuchFile)
        }
        return try Data(contentsOf: url)
    }

    public static func data(named name: String) throws -> Data {
        guard ["design-tokens", "features", "seed"].contains(name),
              let url = Bundle.module.url(forResource: name, withExtension: "json") else {
            throw CocoaError(.fileNoSuchFile)
        }
        return try Data(contentsOf: url)
    }

    public static func decode<T: Decodable>(_ type: T.Type, named name: String) throws -> T {
        try JSONDecoder().decode(type, from: data(named: name))
    }
}

public enum DayKey {
    private static var formatter: DateFormatter {
        let formatter = DateFormatter()
        formatter.calendar = Calendar(identifier: .gregorian)
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter
    }
    public static func string(_ date: Date = Date()) -> String { formatter.string(from: date) }
    public static func date(_ key: String) -> Date { formatter.date(from: key) ?? Date() }
    public static func adding(_ days: Int, to key: String) -> String {
        let calendar = Calendar(identifier: .gregorian)
        return string(calendar.date(byAdding: .day, value: days, to: date(key))!)
    }
    public static func weekStart(_ key: String) -> String {
        let weekday = Calendar(identifier: .gregorian).component(.weekday, from: date(key))
        return adding(-(weekday + 5) % 7, to: key)
    }
}
