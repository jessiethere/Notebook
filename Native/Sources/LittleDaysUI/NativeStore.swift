import Foundation
import SwiftUI
import LittleDaysCore
import CoreText

@MainActor
final class NativeStore: ObservableObject {
    let tokens: DesignTokens
    let features: FeatureDefinition
    let catalog: AssetCatalog
    private let messages: [String: [String: String]]
    @Published var language = UserDefaults.standard.string(forKey: "LittleDays.language") ?? "zh-CN" {
        didSet { UserDefaults.standard.set(language, forKey: "LittleDays.language") }
    }
    @Published private(set) var state: DayState
    @Published var error: String?
    private let file: URL
    private var persistenceLocked = false

    init() {
        // These immutable bundled files are covered by the Core resource tests.
        tokens = try! SharedResources.decode(DesignTokens.self, named: "design-tokens")
        features = try! SharedResources.decode(FeatureDefinition.self, named: "features")
        catalog = try! SharedResources.decode(AssetCatalog.self, named: "library")
        messages = try! SharedResources.decode([String: [String: String]].self, named: "i18n")
        let seed = try! SharedResources.decode(Seed.self, named: "seed")
        state = DayState(seed: seed)
        file = URL.applicationSupportDirectory.appending(path: "LittleDays/state.json")
        for font in catalog.fonts {
            if let data = try? SharedResources.libraryData(category: "fonts", filename: font.file),
               let provider = CGDataProvider(data: data as CFData), let graphicsFont = CGFont(provider) {
                CTFontManagerRegisterGraphicsFont(graphicsFont, nil)
            }
        }
        if FileManager.default.fileExists(atPath: file.path) {
            do {
                let loaded = try JSONDecoder().decode(DayState.self, from: Data(contentsOf: file))
                guard loaded.schemaVersion == 1 else { throw CocoaError(.coderReadCorrupt) }
                state = loaded
            } catch {
                persistenceLocked = true
                self.error = t("native.readError")
            }
        }
    }

    func color(_ name: String) -> Color { Color(hex: tokens.colors[name] ?? "#F8F5EF") }
    func t(_ key: String, values: [String: String] = [:]) -> String {
        var text = messages[key]?[language == "en" ? "en" : "zh"] ?? key
        for (name, value) in values { text = text.replacingOccurrences(of: "{\(name)}", with: value) }
        return text
    }
    func fontName(_ id: String) -> String { catalog.fonts.first { $0.id == id }?.postScriptName ?? "Georgia" }
    func font(_ id: String, size: CGFloat) -> Font {
        if let asset = catalog.fonts.first(where: { $0.id == id }) { return .custom(asset.postScriptName, size: size) }
        return .system(size: size, design: id == "rounded" ? .rounded : id == "serif" ? .serif : .default)
    }

    func commit(_ change: (inout DayState) -> Void) {
        guard !persistenceLocked else { error = t("native.backupFirst"); return }
        var next = state
        change(&next)
        do {
            try FileManager.default.createDirectory(at: file.deletingLastPathComponent(), withIntermediateDirectories: true)
            try JSONEncoder().encode(next).write(to: file, options: .atomic)
            state = next
        } catch { self.error = t("native.saveFailed") }
    }
}

extension Color {
    init(hex: String) {
        let value = UInt64(hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted), radix: 16) ?? 0
        self.init(.sRGB, red: Double((value >> 16) & 255) / 255, green: Double((value >> 8) & 255) / 255, blue: Double(value & 255) / 255, opacity: 1)
    }
}
