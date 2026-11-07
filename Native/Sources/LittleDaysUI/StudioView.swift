import SwiftUI
import LittleDaysCore

struct StudioView: View {
    @EnvironmentObject private var store: NativeStore
    let date: String
    @State private var entry = JournalEntry(date: DayKey.string())
    @State private var message = ""

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                Text(store.t("studio.title")).font(.system(size: 30, design: .serif))
                Text(DayKey.date(date), format: .dateTime.year().month().day()).font(.caption).foregroundStyle(.secondary)
                VStack(alignment: .leading, spacing: 16) { Text(entry.mood).font(.largeTitle); Text(entry.title.isEmpty ? store.t("studio.titlePlaceholder") : entry.title).font(store.font(entry.font, size: 24)); Text(entry.body.isEmpty ? store.t("studio.bodyPlaceholder") : entry.body).font(store.font(entry.bodyFont ?? entry.font, size: 16)) }.frame(maxWidth: .infinity, minHeight: 200, alignment: .topLeading).padding(24).background(store.color(entry.template == "vintage" ? "butter" : "paper"), in: RoundedRectangle(cornerRadius: 12))
                TextField(store.t("studio.titleLabel"), text: $entry.title).textFieldStyle(.roundedBorder)
                TextField(store.t("studio.bodyLabel"), text: $entry.body, axis: .vertical).lineLimit(4...8).textFieldStyle(.roundedBorder)
                Picker(store.t("studio.font"), selection: $entry.font) { Text(store.t("font.serif")).tag("serif"); Text(store.t("font.rounded")).tag("rounded"); Text(store.t("font.system")).tag("system"); ForEach(store.catalog.fonts) { font in Text(font.name).tag(font.id) } }
                Text("Little moments, 美好小日子。").font(store.font(entry.font, size: 24))
                Picker(store.t("studio.mood"), selection: $entry.mood) { ForEach(store.features.moods, id: \.self) { Text($0).tag($0) } }.pickerStyle(.segmented)
                Picker(store.t("studio.book"), selection: $entry.bookId) { ForEach(store.state.books) { Text(store.t("template." + $0.id)).tag($0.id) } }
                Picker(store.t("studio.paper"), selection: $entry.template) { ForEach(store.features.templates) { Text(store.t("template." + $0.id)).tag($0.id) } }.pickerStyle(.segmented)
                HStack {
                    Button(store.t("studio.saveDraft")) { store.commit { $0.drafts[date] = entry }; message = store.error == nil ? store.t("native.draftSaved") : store.t("native.saveFailed") }.buttonStyle(.bordered)
                    Button(store.t("save")) { store.commit { $0.save(entry) }; message = store.error == nil ? store.t("native.saved") : store.t("native.saveFailed") }.buttonStyle(.borderedProminent)
                }
                Text(message).font(.caption).foregroundStyle(.secondary)
                Text(store.t("native.editorScope")).font(.caption2).foregroundStyle(.secondary)
            }.padding(23)
        }
        .task(id: date) { entry = store.state.drafts[date] ?? store.state.entries.first { $0.date == date } ?? JournalEntry(date: date) }
    }
}
