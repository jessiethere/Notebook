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
    /// V6.6: false = a page without its own tab (Growth lives on Home's
    /// "today" card and in the "My habits" book).
    public let inNav: Bool?
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
/// Original background music (tools/make_music.py), played on a loop.
public struct MusicAsset: Decodable, Identifiable {
    public let id: String
    public let nameZh: String
    public let nameEn: String
    public let moodZh: String
    public let moodEn: String
    public let bpm: Int
    public let seconds: Double
    public let file: String
    public let source: String
    public let license: String
}

/// V6.4: one style for a whole day (paper, fonts, ink, accent, stickers).
public struct StoryKit: Decodable, Identifiable {
    public let id: String
    public let nameZh: String
    public let nameEn: String
    public let swatch: String
    public let paper: String
    public let titleFont: String
    public let lineFont: String
    public let ink: String
    public let accent: String
    public let stickers: [String]
    public let playful: Bool
}

public struct PhotoAsset: Decodable, Identifiable {
    public let id: String
    public let collection: String
    public let nameZh: String
    public let nameEn: String
    public let file: String
    /// Pixel size of the bundled file (its own shape: landscape or portrait).
    public let w: Int?
    public let h: Int?
    public let source: String
    public let license: String
    /// Also offered as a whole-page background ("照片氛围").
    public let backdrop: Bool?
    /// "dark": words on it as a background are set in white.
    public let tone: String?
}

public struct SceneCollection: Decodable, Identifiable {
    public let id: String
    public let nameZh: String
    public let nameEn: String
    public let descZh: String
    public let descEn: String
}

/// One cut-out of the approved Captain Character Reference (provided by the
/// product owner; see Keepers/LD-keeper-LICENSE.txt).
public struct KeeperAsset: Decodable, Identifiable {
    public let id: String
    public let animal: String
    public let outfit: String
    public let mood: String
    public let file: String
    public let license: String
}

/// V10.8: one look in Captain's wardrobe (library.json "keeperLooks"). `id`
/// is a `KeeperAsset.outfit`; `kind` is "hat" or "accessory". Only looks with
/// approved artwork are listed; nothing is unlocked or earned.
public struct KeeperLook: Decodable, Identifiable {
    public let id: String
    public let animal: String
    public let kind: String
    public let nameZh: String
    public let nameEn: String
    public let noteZh: String?
    public let noteEn: String?
}

/// V10.17: Captain's Playroom (library.json "keeperPlay"): per outfit, the
/// stage's resting picture, its happy reaction (frames side by side) and,
/// where the art allows, a yarn ball that can be dragged on its own. An
/// outfit only gets the actions it has matching art for — never another
/// outfit's pictures.
public struct KeeperPlayClip: Decodable {
    public let file: String
    public let frames: Int
    public let frameMs: Int
    public let loops: Int?
    public let still: Int?
}

public struct KeeperPlayBall: Decodable {
    public let file: String
    public let x: Double
    public let y: Double
    public let d: Double
}

public struct KeeperPlay: Decodable {
    public let animal: String
    public let outfit: String
    public let stage: String
    public let idle: String
    public let happy: KeeperPlayClip?
    public let ball: KeeperPlayBall?
    public let license: String

    public var files: [String] { [idle, license] + [happy?.file, ball?.file].compactMap { $0 } }
}

public struct AssetCatalog: Decodable {
    public let schemaVersion: Int
    public let fonts: [FontAsset]
    public let stickers: [StickerAsset]
    public let scenes: [SceneAsset]?
    public let sceneCollections: [SceneCollection]?
    public let photos: [PhotoAsset]?
    public let photoCollections: [SceneCollection]?
    public let music: [MusicAsset]?
    public let keepers: [KeeperAsset]?
    public let keeperLooks: [KeeperLook]?
    public let keeperPlay: [KeeperPlay]?
    public let kits: [StoryKit]?
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
        case "music": allowed = Set((catalog.music ?? []).flatMap { [$0.file, $0.license] })
        case "keepers": allowed = Set((catalog.keepers ?? []).flatMap { [$0.file, $0.license] } + (catalog.keeperPlay ?? []).flatMap(\.files))
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
