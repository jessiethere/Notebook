import SwiftUI
import LittleDaysCore

struct CalendarView: View {
    @EnvironmentObject private var store: NativeStore
    @Binding var selectedDate: Date
    let openStudio: () -> Void
    @State private var mode = "Memory"
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                Text("Calendar").font(.system(size: 32, design: .serif))
                Text("每个日子，都值得被记住。").font(.caption).foregroundStyle(.secondary)
                Picker("日历模式", selection: $mode) { Text("Memory").tag("Memory"); Text("Growth").tag("Growth") }.pickerStyle(.segmented)
                DatePicker("选择日期", selection: $selectedDate, displayedComponents: .date).datePickerStyle(.graphical)
                if mode == "Growth" { HabitList(date: DayKey.string(selectedDate)) }
                else if let entry = store.state.entries.first(where: { $0.date == DayKey.string(selectedDate) }) {
                    Text(entry.title).font(.headline); Text(entry.body).font(.subheadline).foregroundStyle(.secondary)
                } else { Text("这一天的故事，还在等你写下。").font(.subheadline).foregroundStyle(.secondary) }
                Button("记录 / 编辑这一天 ↗", action: openStudio).buttonStyle(.borderedProminent)
            }.padding(23)
        }
    }
}
