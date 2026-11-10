import Foundation
import WebKit
import LittleDaysCore

/// Serves the bundled Web app to the WKWebView shell.
///
/// Routes mirror `tools/preview.py` so the iPhone shell and the localhost
/// preview load byte-for-byte the same HTML/CSS/JavaScript:
/// - `/shared/<name>.json`, `/library/<fonts|stickers|scenes|photos|music|keepers>/<file>`, `/assets/<name>.jpg`
///   come from the LittleDaysCore bundle (`SharedResources`, same allow-lists);
/// - everything else comes from `WebApp/`, a copy of `Public/` kept in sync by
///   `tools/sync_native_web.py` (checked by `tests/test_native_shell.py`).
enum LittleDaysWebResources {
    static let scheme = "littledays"
    static let host = "app"
    static var startURL: URL { URL(string: "\(scheme)://\(host)/index.html?shell=ios")! }

    /// Release builds always open the bundled app. Debug builds can follow the
    /// running localhost preview instead (Xcode → Scheme → Arguments:
    /// `-LittleDaysDevServer http://127.0.0.1:8080`), so a Mac simulator shows
    /// the same live page as the Windows browser without re-syncing files.
    static var launchURL: URL {
        #if DEBUG
        if let value = UserDefaults.standard.string(forKey: "LittleDaysDevServer"),
           let url = URL(string: value), ["http", "https"].contains(url.scheme ?? "") {
            return url
        }
        #endif
        return startURL
    }

    static func response(forPath rawPath: String) throws -> (data: Data, mimeType: String) {
        let path = rawPath.isEmpty || rawPath == "/" ? "/index.html" : rawPath
        let parts = path.split(separator: "/").map(String.init)
        // Never allow traversal or hidden files out of the bundle.
        guard !parts.isEmpty, !parts.contains(where: { $0 == ".." || $0.hasPrefix(".") }) else {
            throw CocoaError(.fileNoSuchFile)
        }
        switch parts[0] {
        case "shared" where parts.count == 2 && parts[1].hasSuffix(".json"):
            return (try SharedResources.data(named: String(parts[1].dropLast(5))), "application/json; charset=utf-8")
        case "library" where parts.count == 3:
            return (try SharedResources.libraryData(category: parts[1], filename: parts[2]), mimeType(for: parts[2]))
        case "assets" where parts.count == 2 && parts[1].hasSuffix(".jpg"):
            return (try SharedResources.mediaData(named: String(parts[1].dropLast(4))), "image/jpeg")
        default:
            guard let root = Bundle.module.url(forResource: "WebApp", withExtension: nil) else {
                throw CocoaError(.fileNoSuchFile)
            }
            let file = parts.reduce(root) { $0.appendingPathComponent($1) }
            return (try Data(contentsOf: file), mimeType(for: file.lastPathComponent))
        }
    }

    static func mimeType(for filename: String) -> String {
        switch (filename as NSString).pathExtension.lowercased() {
        case "html": return "text/html; charset=utf-8"
        case "js", "mjs": return "text/javascript; charset=utf-8"
        case "css": return "text/css; charset=utf-8"
        case "json": return "application/json; charset=utf-8"
        case "svg": return "image/svg+xml"
        case "png": return "image/png"
        case "jpg", "jpeg": return "image/jpeg"
        case "ttf": return "font/ttf"
        case "mp3": return "audio/mpeg"
        case "txt": return "text/plain; charset=utf-8"
        default: return "application/octet-stream"
        }
    }
}

/// `littledays://app/...` handler. A fixed custom origin keeps the Web app's
/// LocalStorage metadata and IndexedDB media in one stable WebKit data store.
final class LittleDaysSchemeHandler: NSObject, WKURLSchemeHandler {
    func webView(_ webView: WKWebView, start urlSchemeTask: WKURLSchemeTask) {
        guard let url = urlSchemeTask.request.url, url.host == LittleDaysWebResources.host else {
            urlSchemeTask.didFailWithError(URLError(.badURL))
            return
        }
        let status: Int
        let body: Data
        let type: String
        do {
            let resource = try LittleDaysWebResources.response(forPath: url.path)
            (status, body, type) = (200, resource.data, resource.mimeType)
        } catch {
            (status, body, type) = (404, Data("Not found".utf8), "text/plain; charset=utf-8")
        }
        let headers = ["Content-Type": type, "Content-Length": String(body.count), "Cache-Control": "no-cache"]
        guard let response = HTTPURLResponse(url: url, statusCode: status, httpVersion: "HTTP/1.1", headerFields: headers) else {
            urlSchemeTask.didFailWithError(URLError(.cannotParseResponse))
            return
        }
        urlSchemeTask.didReceive(response)
        urlSchemeTask.didReceive(body)
        urlSchemeTask.didFinish()
    }

    func webView(_ webView: WKWebView, stop urlSchemeTask: WKURLSchemeTask) {}
}
