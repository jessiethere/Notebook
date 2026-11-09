import Foundation

public struct Habit: Codable, Identifiable, Equatable {
    public var id: String
    public var title: String
    public var theme: String
    public var kind: String
    public var target: Int
    public var minutes: Int
}

public struct HabitCheck: Codable, Equatable {
    public var habitId: String
    public var date: String
    public var minutes: Int
    // V3.1 check-in reflection. Still unique per (habitId, date); private unless shareNote is true.
    public var detail: String?
    public var note: String?
    public var mood: String?
    public var photo: String?
    public var shareNote: Bool?
    public var updatedAt: String?
}

/// V3.1 optional weekly ("week", key = Monday yyyy-MM-dd) or monthly ("month", key = yyyy-MM) reflection.
public struct GrowthReflection: Codable, Identifiable, Equatable {
    public var id: String
    public var period: String
    public var key: String
    public var wentWell: String?
    public var challenges: String?
    public var learned: String?
    public var nextFocus: String?
    public var updatedAt: String?
}

public struct JournalBook: Codable, Identifiable, Equatable {
    public var id: String
    public var title: String
    public var category: String
    public var color: String
    public var cover: String
    public var description: String?
    public var coverTemplate: String?
    public var coverFont: String?
    public var coverDecoration: String?
    public var coverImage: String?
    public var visibility: String?
    public var fields: [BookField]?
}

public struct BookField: Codable, Identifiable, Equatable {
    public var id: String
    public var label: String
    public var type: String
    public var options: [String]?
    public var labelZh: String?
    public var labelEn: String?
}

public struct JournalMedia: Codable, Identifiable, Equatable {
    public var id: String
    public var kind: String
    public var name: String
    public var mime: String
    public var source: String
    public var size: Int?
    public var duration: Double?
    public var poster: String?
    /// "recording" for microphone voice notes.
    public var origin: String?
    /// V3.8: a video's own pixel size, so portrait clips land upright.
    public var width: Double?
    public var height: Double?
}

public struct JournalTextStyle: Codable, Equatable {
    public var size: Double?
    public var color: String?
    public var weight: Int?
    public var spacing: Double?
}

public enum JSONValue: Codable, Equatable {
    case string(String), number(Double), bool(Bool), object([String: JSONValue]), array([JSONValue]), null
    public init(from decoder: Decoder) throws {
        let value = try decoder.singleValueContainer()
        if value.decodeNil() { self = .null }
        else if let decoded = try? value.decode(Bool.self) { self = .bool(decoded) }
        else if let decoded = try? value.decode(String.self) { self = .string(decoded) }
        else if let decoded = try? value.decode(Double.self) { self = .number(decoded) }
        else if let decoded = try? value.decode([String: JSONValue].self) { self = .object(decoded) }
        else { self = .array(try value.decode([JSONValue].self)) }
    }
    public func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        switch self {
        case .string(let value): try container.encode(value)
        case .number(let value): try container.encode(value)
        case .bool(let value): try container.encode(value)
        case .object(let value): try container.encode(value)
        case .array(let value): try container.encode(value)
        case .null: try container.encodeNil()
        }
    }
}

public struct StickerLayer: Codable, Identifiable, Equatable {
    public var id: String
    public var kind: String
    public var text: String
    public var x: Double
    public var y: Double
    public var scale: Double
    public var rotation: Double
    public var assetId: String?
    public var mediaRef: String?
    public var fontId: String?
    public var fontSize: Double?
    public var color: String?
    public var weight: Int?
    public var spacing: Double?
    public var align: String?
    // V3.1 free layout. x/y are the centre in % of the canvas, w is % of canvas width, h % of canvas height.
    public var w: Double?
    public var h: Double?
    public var crop: LayerCrop?
    public var frame: String?
    public var tape: Bool?
    // kind == "growth": a live card that references a HabitCheck instead of copying it.
    public var habitId: String?
    public var checkDate: String?
    // kind == "video" / "audio": a clip from the page's media placed on the paper.
    public var clipId: String?
    // kind == "photo", V3.6 photo editor: mediaRef is the edited picture,
    // sourceRef the untouched original, edit the settings to re-edit from it.
    public var sourceRef: String?
    public var edit: PhotoEdit?
    // V3.8: landscape / portrait / square / circle / arch / heart / film.
    public var shape: String?

    public init(text: String, x: Double = 80, y: Double = 60) {
        self.id = UUID().uuidString
        self.kind = "sticker"
        self.text = text
        self.x = x
        self.y = y
        self.scale = 1
        self.rotation = -12
    }
}

/// Photo editor settings (filters, crop ratio, adjustments, title on the picture).
public struct PhotoEdit: Codable, Equatable {
    public var filter: String?
    public var brightness: Double?
    public var contrast: Double?
    public var saturation: Double?
    public var warmth: Double?
    public var ratio: String?
    public var zoom: Double?
    public var x: Double?
    public var y: Double?
    public var rotate: Int?
    public var text: PhotoEditText?
}

public struct PhotoEditText: Codable, Equatable {
    public var value: String
    public var style: String?
    public var color: String?
    public var size: Double?
    public var x: Double?
    public var y: Double?
}

public struct LayerCrop: Codable, Equatable {
    public var x: Double
    public var y: Double
    public var zoom: Double
}

/// V3.1: an ordered chapter inside one day (JournalEntry stays the date container).
public struct JournalMoment: Codable, Identifiable, Equatable {
    public var id: String
    public var title: String?
    public var time: String?
    public var body: String?
    public var mood: String?
    public var tags: [String]?
    public var bookId: String?
    public var template: String?
    public var font: String?
    public var layers: [StickerLayer]?
    public var media: [JournalMedia]?
    public var collapsed: Bool?
    public var layoutTemplate: String?
    public var layoutEdited: Bool?
    public var visibility: String?
    public var updatedAt: String?
    public var savedAt: String?
}

public struct JournalEntry: Codable, Identifiable, Equatable {
    public var id: String
    public var date: String
    public var title: String
    public var body: String
    public var mood: String
    public var bookId: String
    public var photo: String
    public var template: String
    public var font: String
    public var layers: [StickerLayer]
    public var isDemo: Bool
    public var updatedAt: String
    public var media: [JournalMedia]?
    public var fieldValues: [String: JSONValue]?
    public var textStyle: JournalTextStyle?
    public var bodyFont: String?
    public var visibility: String?
    public var moments: [JournalMoment]?
    public var layoutTemplate: String?
    public var layoutEdited: Bool?

    public init(id: String = UUID().uuidString, date: String, title: String = "", body: String = "", mood: String = "☀️", bookId: String = "daily", photo: String = "", template: String = "cute", font: String = "serif", isDemo: Bool = false) {
        self.id = id
        self.date = date
        self.title = title
        self.body = body
        self.mood = mood
        self.bookId = bookId
        self.photo = photo
        self.template = template
        self.font = font
        self.layers = []
        self.isDemo = isDemo
        self.updatedAt = ISO8601DateFormatter().string(from: Date())
        self.media = []
        self.fieldValues = [:]
        self.visibility = "private"
    }
}

public struct DayState: Codable {
    public var schemaVersion = 1
    public var habits: [Habit]
    public var books: [JournalBook]
    public var entries: [JournalEntry]
    public var checks: [HabitCheck]
    public var drafts: [String: JournalEntry]
    public var reflections: [GrowthReflection]?

    public init(seed: Seed, today: String = DayKey.string()) {
        habits = seed.habits
        books = seed.books
        checks = []
        drafts = [:]
        entries = seed.journals.map { item in
            JournalEntry(id: item.id, date: DayKey.adding(item.dayOffset, to: today), title: item.title, body: item.body, mood: item.mood, bookId: item.bookId, photo: item.photo, template: item.template, font: item.font, isDemo: true)
        }
    }

    public mutating func toggleCheck(habitId: String, date: String, minutes: Int = 0) {
        guard habits.contains(where: { $0.id == habitId }) else { return }
        if let index = checks.firstIndex(where: { $0.habitId == habitId && $0.date == date }) {
            checks.remove(at: index)
        } else {
            checks.append(HabitCheck(habitId: habitId, date: date, minutes: max(0, minutes)))
        }
    }

    public mutating func save(_ entry: JournalEntry) {
        var entry = entry
        entry.isDemo = false
        entry.updatedAt = ISO8601DateFormatter().string(from: Date())
        if let index = entries.firstIndex(where: { $0.date == entry.date }) { entries[index] = entry }
        else { entries.append(entry) }
        drafts.removeValue(forKey: entry.date)
    }

    public func weeklyCount(habitId: String, date: String) -> Int {
        let start = DayKey.weekStart(date)
        let end = DayKey.adding(6, to: start)
        return checks.filter { $0.habitId == habitId && $0.date >= start && $0.date <= end }.count
    }
}
