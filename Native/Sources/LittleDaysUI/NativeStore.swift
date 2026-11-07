import Foundation
import SwiftUI
import LittleDaysCore

@MainActor
final class NativeStore: ObservableObject {
    let tokens: DesignTokens
    let features: FeatureDefinition
    @Published private(set) var state: DayState
    @Published var error: String?
    private let file: URL
    private var persistenceLocked = false

    init() {
        // These immutable bundled files are covered by the Core resource tests.
        tokens = try! SharedResources.decode(DesignTokens.self, named: "design-tokens")
        features = try! SharedResources.decode(FeatureDefinition.self, named: "features")
        let seed = try! SharedResources.decode(Seed.self, named: "seed")
        state = DayState(seed: seed)
        file = URL.applicationSupportDirectory.appending(path: "LittleDays/state.json")
        if FileManager.default.fileExists(atPath: file.path) {
            do {
                let loaded = try JSONDecoder().decode(DayState.self, from: Data(contentsOf: file))
                guard loaded.schemaVersion == 1 else { throw CocoaError(.coderReadCorrupt) }
                state = loaded
            } catch {
                persistenceLocked = true
                self.error = "本机记录无法读取。为保护原文件，已暂停保存，请先备份 state.json。"
            }
        }
    }

    func color(_ name: String) -> Color { Color(hex: tokens.colors[name] ?? "#F8F5EF") }

    func commit(_ change: (inout DayState) -> Void) {
        guard !persistenceLocked else { error = "请先恢复或备份已有记录。"; return }
        var next = state
        change(&next)
        do {
            try FileManager.default.createDirectory(at: file.deletingLastPathComponent(), withIntermediateDirectories: true)
            try JSONEncoder().encode(next).write(to: file, options: .atomic)
            state = next
        } catch { self.error = "本机保存失败，请检查可用空间后重试。" }
    }
}

extension Color {
    init(hex: String) {
        let value = UInt64(hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted), radix: 16) ?? 0
        self.init(.sRGB, red: Double((value >> 16) & 255) / 255, green: Double((value >> 8) & 255) / 255, blue: Double(value & 255) / 255, opacity: 1)
    }
}
