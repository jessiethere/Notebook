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
                    Text(store.t("home.greeting") + " ☀️").font(.title2)
                    Text(store.t("home.subtitle")).font(.caption).foregroundStyle(.secondary)
                }
                VStack(alignment: .leading, spacing: 14) {
                    HStack { Text("TODAY'S LITTLE MOMENT").font(.caption2); Spacer(); Button(store.t("home.continue") + " ↗", action: openStudio).font(.caption) }
                    if let entry, entry.photo.hasPrefix("/assets/"), let data = try? SharedResources.mediaData(named: entry.photo.contains("lake") ? "lake" : "coffee"), let image = UIImage(data: data) {
                        Image(uiImage: image).resizable().scaledToFill().frame(height: 180).clipped().padding(8).background(.white).rotationEffect(.degrees(-3))
                    } else { Text(store.t("photo.placeholder")).font(.caption).frame(maxWidth: .infinity, minHeight: 130).background(store.color("cream")) }
                    Text(entry?.title ?? store.t("home.blankTitle")).font(.headline)
                    Text(entry?.body ?? store.t("home.blankBody")).font(.caption).foregroundStyle(.secondary)
                    if entry?.isDemo == true { Text(store.t("home.sample")).font(.caption2).foregroundStyle(.secondary) }
                }.padding(18).background(store.color("butter").opacity(0.4), in: RoundedRectangle(cornerRadius: 22))
                HStack { ForEach(["home.text", "home.mood", "nav.studio"], id: \.self) { label in Button(store.t(label), action: openStudio).font(.caption).frame(maxWidth: .infinity).padding(.vertical, 13).background(store.color("blush").opacity(0.45), in: RoundedRectangle(cornerRadius: 14)) } }
                Text(store.t("home.growth")).font(.headline)
                HabitList(date: DayKey.string())
                Text(store.t("home.books")).font(.headline)
                HStack { ForEach(store.state.books.prefix(3)) { book in VStack { BookCoverView(book: book).frame(height: 140); Text(book.title).font(.caption2).lineLimit(2) } } }
                Button(action: openStudio) { VStack(alignment: .leading, spacing: 8) { Text("Journal Studio").font(.system(size: 24, design: .serif)); Text(store.t("home.studio")).font(.caption) }.frame(maxWidth: .infinity, alignment: .leading).padding(20).background(store.color("sage").opacity(0.5), in: RoundedRectangle(cornerRadius: 18)) }
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
                    VStack(alignment: .leading, spacing: 5) { Text(habit.title).font(.subheadline); Text(habit.theme + " · " + store.t("growth.weekCount", values: ["target": String(habit.target), "count": String(store.state.weeklyCount(habitId: habit.id, date: date))])).font(.caption2).foregroundStyle(.secondary) }
                    Spacer()
                    Button { store.commit { $0.toggleCheck(habitId: habit.id, date: date, minutes: habit.minutes) } } label: { Image(systemName: complete ? "checkmark.circle.fill" : "circle").font(.title2) }.accessibilityLabel(store.t(complete ? "habit.cancel" : "habit.complete") + " " + habit.title)
                }
            }
        }.padding(17).background(store.color("paper"), in: RoundedRectangle(cornerRadius: 18))
    }
}
