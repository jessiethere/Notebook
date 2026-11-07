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
                Text(store.t("calendar.title")).font(.system(size: 32, design: .serif))
                Text(store.t("calendar.subtitle")).font(.caption).foregroundStyle(.secondary)
                Picker(store.t("calendar.title"), selection: $mode) { Text(store.t("calendar.memory")).tag("Memory"); Text(store.t("calendar.growth")).tag("Growth") }.pickerStyle(.segmented)
                DatePicker(store.t("field.date"), selection: $selectedDate, displayedComponents: .date).datePickerStyle(.graphical)
                if mode == "Growth" { HabitList(date: DayKey.string(selectedDate)) }
                else if let entry = store.state.entries.first(where: { $0.date == DayKey.string(selectedDate) }) {
                    Text(entry.title).font(.headline); Text(entry.body).font(.subheadline).foregroundStyle(.secondary)
                } else { Text(store.t("calendar.empty")).font(.subheadline).foregroundStyle(.secondary) }
                Button(store.t("calendar.edit") + " ↗", action: openStudio).buttonStyle(.borderedProminent)
            }.padding(23)
        }
    }
}
