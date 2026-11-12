import LocalAuthentication
import SwiftUI
import UIKit
import WebKit

/// The Little Days iPhone app: a thin SwiftUI shell around the same Web app
/// that the localhost preview shows (http://localhost:8080). Every feature —
/// Journal Studio, Moments, Day Detail, Growth, books, media, backup — comes
/// from the shared HTML/CSS/JavaScript, so the iPhone app never falls behind.
public struct LittleDaysWebShellView: View {
    public init() {}

    @Environment(\.scenePhase) private var scenePhase
    @ObservedObject private var privacy = LittleDaysPrivacy.shared

    public var body: some View {
        LittleDaysWebView()
            .ignoresSafeArea()
            .background(Color(red: 248 / 255, green: 245 / 255, blue: 239 / 255))
            // App lock on: the app switcher shows a plain cover, not the journal.
            .overlay {
                if privacy.lockEnabled && scenePhase != .active {
                    ZStack {
                        Color(red: 246 / 255, green: 241 / 255, blue: 231 / 255)
                        Text("Little Days").font(.system(size: 30, weight: .regular, design: .serif))
                            .foregroundStyle(Color(red: 47 / 255, green: 42 / 255, blue: 38 / 255))
                    }
                    .ignoresSafeArea()
                }
            }
    }
}

#if DEBUG
/// Debug builds only: page errors (uncaught exceptions, rejected promises,
/// console.error/warn, failed script/style loads) and four startup milestones
/// (web view created, document start, DOMContentLoaded, home rendered) go to
/// the Xcode console and the system log as "[LittleDays JS] +<ms since launch> …",
/// so a blank or slow start can be diagnosed without Safari's Web Inspector.
/// Read them from the Simulator with:
///   xcrun simctl spawn booted log show --last 5m --predicate 'eventMessage CONTAINS "[LittleDays JS]"'
/// Release builds don't include it.
final class LittleDaysDebugConsole: NSObject, WKScriptMessageHandler {
    static let name = "littleDaysDebug"

    static func install(in controller: WKUserContentController) {
        let source = """
        (() => {
          const post = (kind, parts) => {
            try {
              const text = parts.map((p) => p instanceof Error ? (p.stack || p.message) : typeof p === "string" ? p : JSON.stringify(p)).join(" ");
              window.webkit.messageHandlers.littleDaysDebug.postMessage(kind + ": " + text);
            } catch (_) {}
          };
          addEventListener("error", (e) => {
            if (e.target && e.target !== window && (e.target.src || e.target.href)) post("load failed", [e.target.src || e.target.href]);
            else post("error", [e.message + " @ " + e.filename + ":" + e.lineno + ":" + e.colno, e.error || ""]);
          }, true);
          addEventListener("unhandledrejection", (e) => post("unhandled rejection", [e.reason]));
          post("milestone", ["document start"]);
          addEventListener("DOMContentLoaded", () => post("milestone", ["DOMContentLoaded"]));
          const waitHome = setInterval(() => {
            if (document.querySelector("#navigation [data-page]")) { clearInterval(waitHome); post("milestone", ["home rendered"]); }
          }, 50);
          for (const level of ["error", "warn"]) {
            const original = console[level].bind(console);
            console[level] = (...args) => { post(level, args); original(...args); };
          }
        })();
        """
        controller.addUserScript(WKUserScript(source: source, injectionTime: .atDocumentStart, forMainFrameOnly: true))
        controller.add(LittleDaysDebugConsole(), name: name)
    }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        NSLog("[LittleDays JS] +%.0f ms %@", (Date().timeIntervalSince1970 - LittleDaysWebResources.launchedAt) * 1000, String(describing: message.body))
    }
}
#endif

/// Whether the Web app's lock is on (told by the page through the bridge;
/// only ever changed on the main thread).
final class LittleDaysPrivacy: ObservableObject {
    static let shared = LittleDaysPrivacy()
    @Published var lockEnabled = false
}

/// The page's app lock asks iOS for Face ID / Touch ID here and gets the
/// answer back; Little Days never sees the face or fingerprint itself.
@MainActor
final class LittleDaysLockBridge: NSObject, WKScriptMessageHandler {
    static let name = "littleDaysLock"
    weak var webView: WKWebView?

    /// "faceID", "touchID" or "" — given to the page at start.
    nonisolated static func biometry() -> String {
        let context = LAContext()
        guard context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: nil) else { return "" }
        switch context.biometryType {
        case .faceID: return "faceID"
        case .touchID: return "touchID"
        default: return ""
        }
    }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.name == Self.name, let body = message.body as? [String: Any], let type = body["type"] as? String else { return }
        if type == "state" {
            LittleDaysPrivacy.shared.lockEnabled = (body["on"] as? Bool) == true
            return
        }
        guard type == "unlock" else { return }
        let reason = (body["reason"] as? String).flatMap { $0.isEmpty ? nil : $0 } ?? "Unlock Little Days"
        let context = LAContext()
        // No system passcode fallback: the page's own keypad is the fallback.
        context.localizedFallbackTitle = ""
        context.evaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, localizedReason: reason) { ok, _ in
            Task { @MainActor [weak self] in
                self?.webView?.evaluateJavaScript("window.littleDaysBiometricResult && window.littleDaysBiometricResult(\(ok ? "true" : "false"))", completionHandler: nil)
            }
        }
    }
}

/// V10.17 · Captain's Playroom: a light tap of the Taptic Engine when Captain
/// catches the yarn ball or is poked. The page only asks; nothing is sent back.
@MainActor
final class LittleDaysHaptics: NSObject, WKScriptMessageHandler {
    static let name = "littleDaysHaptics"
    private let light = UIImpactFeedbackGenerator(style: .light)

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.name == Self.name else { return }
        light.impactOccurred()
    }
}

struct LittleDaysWebView: UIViewRepresentable {
    func makeCoordinator() -> LittleDaysWebCoordinator { LittleDaysWebCoordinator() }

    func makeUIView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        configuration.setURLSchemeHandler(LittleDaysSchemeHandler(), forURLScheme: LittleDaysWebResources.scheme)
        // Persistent store: journal metadata (LocalStorage) and media (IndexedDB) survive relaunches.
        configuration.websiteDataStore = .default()
        configuration.allowsInlineMediaPlayback = true
        configuration.mediaTypesRequiringUserActionForPlayback = .all
        // Lets the shared CSS drop the "web preview" phone frame and use real safe areas.
        let marker = WKUserScript(
            source: "window.littleDaysBiometry = '\(LittleDaysLockBridge.biometry())'; document.documentElement.dataset.shell = 'ios'; document.documentElement.dataset.biometric = window.littleDaysBiometry;",
            injectionTime: .atDocumentStart,
            forMainFrameOnly: true
        )
        configuration.userContentController.addUserScript(marker)
        // App lock: Face ID / Touch ID and the app switcher cover.
        let lockBridge = LittleDaysLockBridge()
        configuration.userContentController.add(lockBridge, name: LittleDaysLockBridge.name)
        // Daily reminder: local notifications (V7.6).
        configuration.userContentController.add(LittleDaysReminders.shared, name: LittleDaysReminders.name)
        // Captain's Playroom: a light tap (V10.17).
        configuration.userContentController.add(LittleDaysHaptics(), name: LittleDaysHaptics.name)

        let webView = WKWebView(frame: .zero, configuration: configuration)
        lockBridge.webView = webView
        LittleDaysReminders.shared.webView = webView
        webView.uiDelegate = context.coordinator
        webView.navigationDelegate = context.coordinator
        webView.isOpaque = false
        webView.backgroundColor = .clear
        webView.scrollView.bounces = false
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.allowsBackForwardNavigationGestures = false
        #if DEBUG
        if #available(iOS 16.4, *) { webView.isInspectable = true }
        LittleDaysDebugConsole.install(in: configuration.userContentController)
        NSLog("[LittleDays JS] +%.0f ms native: web view created, loading %@", (Date().timeIntervalSince1970 - LittleDaysWebResources.launchedAt) * 1000, LittleDaysWebResources.launchURL.absoluteString)
        #endif
        webView.load(URLRequest(url: LittleDaysWebResources.launchURL))
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {}
}

/// Native behaviour the Web app relies on: `alert`/`confirm` dialogs (used to
/// protect manual layouts, Moments and restores), microphone recording,
/// downloads for backups/PNG export, and keeping the app on its own origin.
@MainActor
final class LittleDaysWebCoordinator: NSObject, WKUIDelegate, WKNavigationDelegate, WKDownloadDelegate {
    private var downloads: [ObjectIdentifier: URL] = [:]

    // MARK: JavaScript dialogs

    func webView(_ webView: WKWebView, runJavaScriptAlertPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping () -> Void) {
        let alert = UIAlertController(title: nil, message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "OK", style: .default) { _ in completionHandler() })
        present(alert, from: webView, fallback: completionHandler)
    }

    func webView(_ webView: WKWebView, runJavaScriptConfirmPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (Bool) -> Void) {
        let english = Locale.preferredLanguages.first?.hasPrefix("en") == true
        let alert = UIAlertController(title: nil, message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: english ? "Cancel" : "取消", style: .cancel) { _ in completionHandler(false) })
        alert.addAction(UIAlertAction(title: english ? "OK" : "确定", style: .default) { _ in completionHandler(true) })
        present(alert, from: webView) { completionHandler(false) }
    }

    // MARK: Microphone (voice notes). iOS still asks the person via NSMicrophoneUsageDescription.

    func webView(_ webView: WKWebView, requestMediaCapturePermissionFor origin: WKSecurityOrigin, initiatedByFrame frame: WKFrameInfo, type: WKMediaCaptureType, decisionHandler: @escaping (WKPermissionDecision) -> Void) {
        let ownOrigin = origin.protocol == LittleDaysWebResources.scheme || origin.host == LittleDaysWebResources.launchURL.host
        decisionHandler(ownOrigin && type == .microphone ? .prompt : .deny)
    }

    // MARK: Debug: open a screen from the command line

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        #if DEBUG
        // Debug builds only (Release never reads it): launched with
        // `-LittleDaysTap "<css selector>||<css selector>"`, the shell taps those
        // elements one after another once the page is ready, so a Simulator
        // screenshot of Calendar, the shelf or Journal Studio can be taken
        // without touching the screen (tools/mac/sim-shots.sh). It only clicks
        // what a person could tap; it reads and sends nothing.
        guard let steps = UserDefaults.standard.string(forKey: "LittleDaysTap"), !steps.isEmpty else { return }
        let selectors = steps.components(separatedBy: "||").map { $0.trimmingCharacters(in: .whitespaces) }.filter { !$0.isEmpty }
        guard let data = try? JSONSerialization.data(withJSONObject: selectors), let list = String(data: data, encoding: .utf8) else { return }
        let script = """
        void (async (steps) => {
          const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
          for (let i = 0; i < 150 && !document.querySelector('#navigation [data-page]'); i++) await wait(100);
          for (const selector of steps) {
            let el = null;
            for (let i = 0; i < 50 && !(el = document.querySelector(selector)); i++) await wait(100);
            if (el) el.click();
            await wait(800);
          }
        })(\(list));
        """
        webView.evaluateJavaScript(script, completionHandler: nil)
        #endif
    }

    // MARK: Navigation and downloads

    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, preferences: WKWebpagePreferences, decisionHandler: @escaping (WKNavigationActionPolicy, WKWebpagePreferences) -> Void) {
        if navigationAction.shouldPerformDownload {
            decisionHandler(.download, preferences)
            return
        }
        guard let url = navigationAction.request.url else {
            decisionHandler(.cancel, preferences)
            return
        }
        // App pages and Blob/data URLs stay inside; license links open in Safari.
        if ["littledays", "blob", "data", "about"].contains(url.scheme ?? "") || url.host == LittleDaysWebResources.launchURL.host {
            decisionHandler(.allow, preferences)
        } else {
            UIApplication.shared.open(url)
            decisionHandler(.cancel, preferences)
        }
    }

    func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration, for navigationAction: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
        // target="_blank" links (license notices): show them in the same view.
        if navigationAction.targetFrame == nil, let url = navigationAction.request.url {
            if url.scheme == LittleDaysWebResources.scheme { webView.load(navigationAction.request) }
            else { UIApplication.shared.open(url) }
        }
        return nil
    }

    func webView(_ webView: WKWebView, navigationAction: WKNavigationAction, didBecome download: WKDownload) {
        download.delegate = self
    }

    func webView(_ webView: WKWebView, navigationResponse: WKNavigationResponse, didBecome download: WKDownload) {
        download.delegate = self
    }

    func download(_ download: WKDownload, decideDestinationUsing response: URLResponse, suggestedFilename: String, completionHandler: @escaping (URL?) -> Void) {
        // Backups and PNG exports land in the app's Documents folder (visible in Files).
        let folder = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let safeName = suggestedFilename.replacingOccurrences(of: "/", with: "-")
        let destination = folder.appendingPathComponent(safeName.isEmpty ? "Little-Days-Export" : safeName)
        try? FileManager.default.removeItem(at: destination)
        downloads[ObjectIdentifier(download)] = destination
        completionHandler(destination)
    }

    func downloadDidFinish(_ download: WKDownload) {
        guard let url = downloads.removeValue(forKey: ObjectIdentifier(download)), let webView = download.webView else { return }
        let share = UIActivityViewController(activityItems: [url], applicationActivities: nil)
        share.popoverPresentationController?.sourceView = webView
        present(share, from: webView, fallback: {})
    }

    func download(_ download: WKDownload, didFailWithError error: Error, resumeData: Data?) {
        downloads.removeValue(forKey: ObjectIdentifier(download))
    }

    // MARK: Helpers

    private func present(_ controller: UIViewController, from webView: WKWebView, fallback: @escaping () -> Void) {
        var top = webView.window?.rootViewController
        while let presented = top?.presentedViewController { top = presented }
        guard let top else {
            fallback()
            return
        }
        top.present(controller, animated: true)
    }
}
