import SwiftUI
import UIKit
import LittleDaysCore

struct HomeView: View {
    @EnvironmentObject private var store: NativeStore
    let openStudio: () -> Void
    private var entry: JournalEntry? { store.state.entries.first { $0.date == DayKey.string() } }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 22) {
                HStack { Text("✿").foregroundStyle(store.color("accent")); Text("Little Days").font(.system(size: 30, design: .serif)) }
                VStack(alignment: .leading, spacing: 8) {
                    Text(Date(), format: .dateTime.weekday(.wide).month().day()).font(.caption).foregroundStyle(.secondary)
                    Text("今天，也有小美好。☀️").font(.title2)
                    Text("记录生活，也记录一点点变好的自己。").font(.caption).foregroundStyle(.secondary)
                }
                VStack(alignment: .leading, spacing: 14) {
                    HStack { Text("TODAY'S LITTLE MOMENT").font(.caption2); Spacer(); Button("继续记录 ↗", action: openStudio).font(.caption) }
                    if let entry, entry.photo.hasPrefix("/assets/"), let data = try? SharedResources.mediaData(named: entry.photo.contains("lake") ? "lake" : "coffee"), let image = UIImage(data: data) {
                        Image(uiImage: image).resizable().scaledToFill().frame(height: 180).clipped().padding(8).background(.white).rotationEffect(.degrees(-3))
                    } else { Text("📷 留下今天的一瞬").font(.caption).frame(maxWidth: .infinity, minHeight: 130).background(store.color("cream")) }
                    Text(entry?.title ?? "为今天，留一点位置。").font(.headline)
                    Text(entry?.body ?? "写下一个小小的瞬间。").font(.caption).foregroundStyle(.secondary)
                    if entry?.isDemo == true { Text("示例手帐 · 可编辑").font(.caption2).foregroundStyle(.secondary) }
                }.padding(18).background(store.color("butter").opacity(0.4), in: RoundedRectangle(cornerRadius: 22))
                HStack { ForEach(["文字", "心情", "创作"], id: \.self) { label in Button(label, action: openStudio).font(.caption).frame(maxWidth: .infinity).padding(.vertical, 13).background(store.color("blush").opacity(0.45), in: RoundedRectangle(cornerRadius: 14)) } }
                Text("今天的小小成长").font(.headline)
                HabitList(date: DayKey.string())
                Text("我的手帐本").font(.headline)
                HStack { ForEach(store.state.books.prefix(3)) { book in VStack { Text(book.cover).font(.largeTitle).frame(maxWidth: .infinity).frame(height: 110).background(store.color(book.color), in: RoundedRectangle(cornerRadius: 10)); Text(book.title).font(.caption2).lineLimit(2) } } }
                Button(action: openStudio) { VStack(alignment: .leading, spacing: 8) { Text("Journal Studio").font(.system(size: 24, design: .serif)); Text("把今天，拼贴成喜欢的样子 ↗").font(.caption) }.frame(maxWidth: .infinity, alignment: .leading).padding(20).background(store.color("sage").opacity(0.5), in: RoundedRectangle(cornerRadius: 18)) }
            }.padding(23)
        }
    }
}

struct HabitList: View {
    @EnvironmentObject private var store: NativeStore
    let date: String
    var body: some View {
        VStack(spacing: 15) {
            ForEach(store.state.habits) { habit in
                let complete = store.state.checks.contains { $0.habitId == habit.id && $0.date == date }
                HStack {
                    Image(systemName: "leaf").foregroundStyle(store.color("accent"))
                    VStack(alignment: .leading, spacing: 5) { Text(habit.title).font(.subheadline); Text("\(habit.theme) · 每周 \(habit.target) 次").font(.caption2).foregroundStyle(.secondary) }
                    Spacer()
                    Button { store.commit { $0.toggleCheck(habitId: habit.id, date: date, minutes: habit.minutes) } } label: { Image(systemName: complete ? "checkmark.circle.fill" : "circle").font(.title2) }.accessibilityLabel("\(complete ? "取消" : "完成") \(habit.title)")
                }
            }
        }.padding(17).background(store.color("paper"), in: RoundedRectangle(cornerRadius: 18))
    }
}
