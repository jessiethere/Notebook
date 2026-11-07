import SwiftUI
import LittleDaysCore

struct SettingsView: View {
    @EnvironmentObject private var store: NativeStore
    @Environment(\.dismiss) private var dismiss
    var body: some View {
        NavigationStack {
            Form {
                Section(store.t("language")) {
                    Picker(store.t("language"), selection: $store.language) { Text("简体中文").tag("zh-CN"); Text("English").tag("en") }
                    Text(store.t("settings.contentNote")).font(.caption)
                }
                Section(store.t("settings.private")) { Text(store.t("settings.privateNote")).font(.caption) }
                Section(store.t("settings.licenses")) {
                    ForEach(store.catalog.fonts) { font in
                        NavigationLink(font.name) {
                            ScrollView { Text((try? String(data: SharedResources.libraryData(category: "fonts", filename: font.license), encoding: .utf8)) ?? "SIL OFL 1.1").font(.caption).padding() }.navigationTitle(font.name)
                        }
                    }
                }
            }
            .navigationTitle(store.t("settings.title"))
            .toolbar { ToolbarItem(placement: .confirmationAction) { Button(store.t("close")) { dismiss() } } }
        }
    }
}
