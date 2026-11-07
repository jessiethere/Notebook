import SwiftUI
import LittleDaysUI

@main
struct LittleDaysApp: App {
    var body: some Scene {
        // The app is a Swift shell around the shared Web app (same as http://localhost:8080).
        // The earlier SwiftUI prototype screens remain in LittleDaysUI as LittleDaysRootView.
        WindowGroup { LittleDaysWebShellView() }
    }
}
