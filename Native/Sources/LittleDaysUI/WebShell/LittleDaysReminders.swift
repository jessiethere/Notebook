import UIKit
import UserNotifications
import WebKit

/// V7.6 daily reminder: local notifications only, nothing goes online.
/// The page sends `{type: "schedule", on, hour, minute, skipToday, title,
/// body, offTitle}`; the next 14 days are scheduled one by one (today is
/// skipped once something was kept), refreshed whenever the app opens or a
/// page is saved. A reminder's "Turn off" action and a tap on it are handed
/// back to the page (`littleDaysReminderTurnedOff()` / `littleDaysFromReminder()`).
@MainActor
public final class LittleDaysReminders: NSObject, WKScriptMessageHandler, UNUserNotificationCenterDelegate {
    public static let shared = LittleDaysReminders()
    static let name = "littleDaysReminder"
    static let category = "little-days.reminder"
    static let offAction = "little-days.reminder.off"
    private static let offPendingKey = "LittleDaysReminderOffPending"
    private static let ids = (0..<14).map { "little-days.daily.\($0)" }

    weak var webView: WKWebView?
    private var pendingTap = false

    /// Call once at launch so a reminder that opens the app is still heard.
    public static func install() {
        UNUserNotificationCenter.current().delegate = shared
    }

    public func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.name == Self.name, let body = message.body as? [String: Any], let type = body["type"] as? String else { return }
        if type == "ready" { deliverPending() }
        if type == "schedule" { schedule(body) }
    }

    private func schedule(_ body: [String: Any]) {
        let center = UNUserNotificationCenter.current()
        center.removePendingNotificationRequests(withIdentifiers: Self.ids)
        guard (body["on"] as? Bool) == true else { return }
        let hour = body["hour"] as? Int ?? 21
        let minute = body["minute"] as? Int ?? 0
        let skipToday = (body["skipToday"] as? Bool) == true
        let title = body["title"] as? String ?? "Capiday"
        let text = body["body"] as? String ?? ""
        let offTitle = body["offTitle"] as? String ?? "Turn off"
        let off = UNNotificationAction(identifier: Self.offAction, title: offTitle, options: [])
        center.setNotificationCategories([UNNotificationCategory(identifier: Self.category, actions: [off], intentIdentifiers: [], options: [])])
        center.requestAuthorization(options: [.alert, .sound]) { granted, _ in
            Task { @MainActor in
                guard granted else {
                    self.reply(ok: false, reason: "denied")
                    return
                }
                let calendar = Calendar.current
                let now = Date()
                for day in 0..<14 {
                    if day == 0 && skipToday { continue }
                    guard let date = calendar.date(byAdding: .day, value: day, to: now),
                          let fire = calendar.date(bySettingHour: hour, minute: minute, second: 0, of: date),
                          fire > now else { continue }
                    let content = UNMutableNotificationContent()
                    content.title = title
                    content.body = text
                    content.sound = .default
                    content.categoryIdentifier = Self.category
                    let parts = calendar.dateComponents([.year, .month, .day, .hour, .minute], from: fire)
                    let trigger = UNCalendarNotificationTrigger(dateMatching: parts, repeats: false)
                    center.add(UNNotificationRequest(identifier: Self.ids[day], content: content, trigger: trigger))
                }
                self.reply(ok: true, reason: "")
            }
        }
    }

    private func reply(ok: Bool, reason: String) {
        webView?.evaluateJavaScript("window.littleDaysReminderResult && window.littleDaysReminderResult({ ok: \(ok ? "true" : "false"), reason: '\(reason)' })", completionHandler: nil)
    }

    /// Hand a tap / "turn off" to the page once it is ready.
    private func deliverPending() {
        guard let webView else { return }
        if UserDefaults.standard.bool(forKey: Self.offPendingKey) {
            UserDefaults.standard.set(false, forKey: Self.offPendingKey)
            webView.evaluateJavaScript("window.littleDaysReminderTurnedOff && window.littleDaysReminderTurnedOff()", completionHandler: nil)
        }
        if pendingTap {
            pendingTap = false
            webView.evaluateJavaScript("window.littleDaysFromReminder && window.littleDaysFromReminder()", completionHandler: nil)
        }
    }

    // MARK: UNUserNotificationCenterDelegate

    nonisolated public func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse, withCompletionHandler completionHandler: @escaping () -> Void) {
        let action = response.actionIdentifier
        if action == Self.offAction {
            // Off at once, even before the page opens again.
            center.removePendingNotificationRequests(withIdentifiers: Self.ids)
            UserDefaults.standard.set(true, forKey: Self.offPendingKey)
        }
        Task { @MainActor in
            if action == UNNotificationDefaultActionIdentifier { self.pendingTap = true }
            self.deliverPending()
        }
        completionHandler()
    }

    nonisolated public func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification, withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        // The app is open already: no banner on top of it.
        completionHandler([])
    }
}
