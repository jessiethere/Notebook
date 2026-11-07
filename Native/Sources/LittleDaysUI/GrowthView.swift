import SwiftUI
import LittleDaysCore

struct GrowthView: View {
    @EnvironmentObject private var store: NativeStore
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 22) {
                Text(store.t("growth.title")).font(.system(size: 32, design: .serif))
                Text(store.t("growth.subtitle")).font(.caption).foregroundStyle(.secondary)
                Text(store.t("growth.headline")).font(.title3).padding(24).frame(maxWidth: .infinity).background(store.color("sage").opacity(0.5), in: RoundedRectangle(cornerRadius: 22))
                HabitList(date: DayKey.string())
                ForEach(store.state.habits) { habit in
                    VStack(alignment: .leading, spacing: 8) {
                        Text(habit.title).font(.subheadline)
                        ProgressView(value: Double(min(habit.target, store.state.weeklyCount(habitId: habit.id, date: DayKey.string()))), total: Double(habit.target))
                        Text(store.t("growth.weekCount", values: ["count": String(store.state.weeklyCount(habitId: habit.id, date: DayKey.string())), "target": String(habit.target)])).font(.caption2).foregroundStyle(.secondary)
                    }
                }
                Text(store.t("growth.milestone", values: ["count": String(store.state.checks.count)])).font(.caption).foregroundStyle(.secondary)
            }.padding(23)
        }
    }
}
