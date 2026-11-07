import SwiftUI
import LittleDaysCore

struct GrowthView: View {
    @EnvironmentObject private var store: NativeStore
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 22) {
                Text("Grow gently.").font(.system(size: 32, design: .serif))
                Text("一点一点，成为更喜欢的自己。").font(.caption).foregroundStyle(.secondary)
                Text("不赶路，慢慢长大。🌱").font(.title3).padding(24).frame(maxWidth: .infinity).background(store.color("sage").opacity(0.5), in: RoundedRectangle(cornerRadius: 22))
                HabitList(date: DayKey.string())
                ForEach(store.state.habits) { habit in
                    VStack(alignment: .leading, spacing: 8) {
                        Text(habit.title).font(.subheadline)
                        ProgressView(value: Double(min(habit.target, store.state.weeklyCount(habitId: habit.id, date: DayKey.string()))), total: Double(habit.target))
                        Text("本周 \(store.state.weeklyCount(habitId: habit.id, date: DayKey.string())) / \(habit.target) 次").font(.caption2).foregroundStyle(.secondary)
                    }
                }
                Text("累计 \(store.state.checks.count) 次小小成长。每一次，都算数。").font(.caption).foregroundStyle(.secondary)
            }.padding(23)
        }
    }
}
