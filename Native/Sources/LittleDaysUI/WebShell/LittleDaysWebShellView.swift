import SwiftUI
import UIKit
import WebKit

/// The Little Days iPhone app: a thin SwiftUI shell around the same Web app
/// that the localhost preview shows (http://localhost:8080). Every feature —
/// Journal Studio, Moments, Day Detail, Growth, books, media, backup — comes
/// from the shared HTML/CSS/JavaScript, so the iPhone app never falls behind.
public struct LittleDaysWebShellView: View {
    public init() {}

    public var body: some View {
        LittleDaysWebView()
            .ignoresSafeArea()
            .background(Color(red: 248 / 255, green: 245 / 255, blue: 239 / 255))
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
            source: "document.documentElement.dataset.shell = 'ios';",
            injectionTime: .atDocumentStart,
            forMainFrameOnly: true
        )
        configuration.userContentController.addUserScript(marker)

        let webView = WKWebView(frame: .zero, configuration: configuration)
        webView.uiDelegate = context.coordinator
        webView.navigationDelegate = context.coordinator
        webView.isOpaque = false
        webView.backgroundColor = .clear
        webView.scrollView.bounces = false
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.allowsBackForwardNavigationGestures = false
        #if DEBUG
        if #available(iOS 16.4, *) { webView.isInspectable = true }
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
