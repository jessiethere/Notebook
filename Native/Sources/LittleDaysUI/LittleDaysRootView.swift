import SwiftUI
import LittleDaysCore

@MainActor
public struct LittleDaysRootView: View {
    @StateObject private var store = NativeStore()
    @State private var tab = "home"
    @State private var selectedDate = Date()

    public init() {}

    public var body: some View {
        TabView(selection: $tab) {
            ForEach(store.features.tabs) { item in
                NavigationStack {
                    Group {
                        switch item.id {
                        case "home": HomeView(openStudio: { selectedDate = Date(); tab = "studio" })
                        case "calendar": CalendarView(selectedDate: $selectedDate, openStudio: { tab = "studio" })
                        case "studio": StudioView(date: DayKey.string(selectedDate))
                        case "growth": GrowthView()
                        default: BooksView(openStudio: { date in selectedDate = DayKey.date(date); tab = "studio" })
                        }
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .background(store.color("cream"))
                    .toolbarBackground(store.color("cream"), for: .navigationBar)
                }
                .tabItem { Label(item.title, systemImage: item.symbol == "leaf" ? "leaf" : item.symbol == "plus" ? "plus.circle.fill" : item.symbol) }
                .tag(item.id)
            }
        }
        .tint(store.color("accent"))
        .environmentObject(store)
        .alert("记录需要你的注意", isPresented: Binding(get: { store.error != nil }, set: { if !$0 { store.error = nil } })) {
            Button("知道了") { store.error = nil }
        } message: { Text(store.error ?? "") }
    }
}
