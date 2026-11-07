import SwiftUI
import LittleDaysCore

@MainActor
public struct LittleDaysRootView: View {
    @StateObject private var store = NativeStore()
    @State private var tab = "home"
    @State private var selectedDate = Date()
    @State private var showSettings = false

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
                    .toolbar { ToolbarItem(placement: .topBarTrailing) { Button { showSettings = true } label: { Image(systemName: "gearshape") }.accessibilityLabel(store.t("settings")) } }
                }
                .tabItem { Label(store.t("nav." + item.id), systemImage: item.symbol == "leaf" ? "leaf" : item.symbol == "plus" ? "plus.circle.fill" : item.symbol) }
                .tag(item.id)
            }
        }
        .tint(store.color("accent"))
        .environmentObject(store)
        .environment(\.locale, Locale(identifier: store.language == "en" ? "en_US" : "zh_CN"))
        .sheet(isPresented: $showSettings) { SettingsView().environmentObject(store) }
        .alert(store.t("native.attention"), isPresented: Binding(get: { store.error != nil }, set: { if !$0 { store.error = nil } })) {
            Button(store.t("native.ok")) { store.error = nil }
        } message: { Text(store.error ?? "") }
    }
}
