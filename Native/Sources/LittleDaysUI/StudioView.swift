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
                Text("Journal Studio").font(.system(size: 30, design: .serif))
                Text(date).font(.caption).foregroundStyle(.secondary)
                VStack(alignment: .leading, spacing: 16) { Text(entry.mood).font(.largeTitle); Text(entry.title.isEmpty ? "今天的小美好" : entry.title).font(.title2); Text(entry.body.isEmpty ? "写下一点点值得收藏的日常。" : entry.body).font(.body) }.frame(maxWidth: .infinity, minHeight: 200, alignment: .topLeading).padding(24).background(store.color(entry.template == "vintage" ? "butter" : "paper"), in: RoundedRectangle(cornerRadius: 12))
                TextField("给今天取个名字", text: $entry.title).textFieldStyle(.roundedBorder)
                TextField("写点什么…", text: $entry.body, axis: .vertical).lineLimit(4...8).textFieldStyle(.roundedBorder)
                Picker("今天的心情", selection: $entry.mood) { ForEach(store.features.moods, id: \.self) { Text($0).tag($0) } }.pickerStyle(.segmented)
                Picker("手帐本", selection: $entry.bookId) { ForEach(store.state.books) { Text($0.title).tag($0.id) } }
                Picker("模板", selection: $entry.template) { ForEach(store.features.templates) { Text($0.title).tag($0.id) } }.pickerStyle(.segmented)
                HStack {
                    Button("保存草稿") { store.commit { $0.drafts[date] = entry }; message = store.error == nil ? "草稿已保存" : "保存失败" }.buttonStyle(.bordered)
                    Button("收藏这一天") { store.commit { $0.save(entry) }; message = store.error == nil ? "手帐已保存 🌷" : "保存失败" }.buttonStyle(.borderedProminent)
                }
                Text(message).font(.caption).foregroundStyle(.secondary)
                Text("原生编辑器第一阶段：文字、心情、模板与本机保存。照片、自由贴纸编辑等将在后续与 Web 预览逐步对齐。").font(.caption2).foregroundStyle(.secondary)
            }.padding(23)
        }
        .task(id: date) { entry = store.state.drafts[date] ?? store.state.entries.first { $0.date == date } ?? JournalEntry(date: date) }
    }
}
