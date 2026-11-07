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
}

public struct JournalBook: Codable, Identifiable, Equatable {
    public var id: String
    public var title: String
    public var category: String
    public var color: String
    public var cover: String
}

public struct StickerLayer: Codable, Identifiable, Equatable {
    public var id: String
    public var kind: String
    public var text: String
    public var x: Double
    public var y: Double
    public var scale: Double
    public var rotation: Double

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
    }
}

public struct DayState: Codable {
    public var schemaVersion = 1
    public var habits: [Habit]
    public var books: [JournalBook]
    public var entries: [JournalEntry]
    public var checks: [HabitCheck]
    public var drafts: [String: JournalEntry]

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
