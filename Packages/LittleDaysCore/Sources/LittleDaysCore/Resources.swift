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
    /// Scene ids for "scene:daily" (the sample page's picture of the day).
    public let dailyScenes: [String]?
}

public struct FontAsset: Decodable, Identifiable {
    public let id: String
    public let name: String
    public let family: String
    public let postScriptName: String
    public let category: String
    public let file: String
    public let license: String
    public let source: String
    public let supportsChinese: Bool
}

public struct StickerAsset: Decodable, Identifiable {
    public let id: String
    public let category: String
    public let nameZh: String
    public let nameEn: String
    public let file: String
    public let nativeFile: String
    public let license: String
}

/// Original artwork used as page backgrounds (gradients, patterns, sky ...).
/// The hand-drawn "life" scenes are `retired`: no longer offered, still shown
/// on pages that already use them.
public struct SceneAsset: Decodable, Identifiable {
    public let id: String
    /// life / color / ribbons / kaleido / pattern / sky
    public let collection: String?
    public let category: String
    public let nameZh: String
    public let nameEn: String
    public let file: String
    public let license: String
    public let retired: Bool?
    /// "dark": words on this background are set in white.
    public let tone: String?
}

/// Real photos for a page's picture (Unsplash License; `source` is the original).
public struct PhotoAsset: Decodable, Identifiable {
    public let id: String
    public let collection: String
    public let nameZh: String
    public let nameEn: String
    public let file: String
    public let source: String
    public let license: String
}

public struct SceneCollection: Decodable, Identifiable {
    public let id: String
    public let nameZh: String
    public let nameEn: String
    public let descZh: String
    public let descEn: String
}

public struct AssetCatalog: Decodable {
    public let schemaVersion: Int
    public let fonts: [FontAsset]
    public let stickers: [StickerAsset]
    public let scenes: [SceneAsset]?
    public let sceneCollections: [SceneCollection]?
    public let photos: [PhotoAsset]?
    public let photoCollections: [SceneCollection]?
    public let coverTemplates: [MaterialTemplate]
    public let fieldTypes: [String]
}

public enum SharedResources {
    public static func libraryData(category: String, filename: String) throws -> Data {
        let catalog = try decode(AssetCatalog.self, named: "library")
        let allowed: Set<String>
        switch category {
        case "fonts": allowed = Set(catalog.fonts.flatMap { [$0.file, $0.license] })
        case "stickers": allowed = Set(catalog.stickers.flatMap { [$0.file, $0.nativeFile, $0.license] })
        case "scenes": allowed = Set((catalog.scenes ?? []).flatMap { [$0.file, $0.license] })
        case "photos": allowed = Set((catalog.photos ?? []).flatMap { [$0.file, $0.license] })
        default: throw CocoaError(.fileNoSuchFile)
        }
        guard allowed.contains(filename) else { throw CocoaError(.fileNoSuchFile) }
        let path = filename as NSString
        guard let url = Bundle.module.url(forResource: path.deletingPathExtension, withExtension: path.pathExtension) else { throw CocoaError(.fileNoSuchFile) }
        return try Data(contentsOf: url)
    }

    public static func mediaData(named name: String) throws -> Data {
        guard ["coffee", "lake"].contains(name),
              let url = Bundle.module.url(forResource: name, withExtension: "jpg") else {
            throw CocoaError(.fileNoSuchFile)
        }
        return try Data(contentsOf: url)
    }

    public static func data(named name: String) throws -> Data {
        guard ["design-tokens", "features", "seed", "library", "i18n"].contains(name),
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
