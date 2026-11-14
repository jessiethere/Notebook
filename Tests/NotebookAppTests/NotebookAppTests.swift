import NotebookApp
import XCTVapor

final class NotebookAppTests: XCTestCase {
    func testHealthEndpoint() async throws {
        let app = try await Application.make(.testing)
        do {
            try configure(app)
            try await app.test(.GET, "/api/health") { response async throws in
                XCTAssertEqual(response.status, .ok)
                XCTAssertEqual(try response.content.decode([String: String].self), [
                    "status": "ok", "app": "Capiday", "framework": "Vapor"
                ])
            }
        } catch {
            try? await app.asyncShutdown()
            throw error
        }
        try await app.asyncShutdown()
    }

    func testHomepageAndAssets() async throws {
        let app = try await Application.make(.testing)
        do {
            try configure(app)
            XCTAssertEqual(app.http.server.configuration.hostname, "127.0.0.1")
            try await app.test(.GET, "/") { response async throws in
                XCTAssertEqual(response.status, .ok)
                XCTAssertTrue(response.body.string.contains("Capiday"))
                XCTAssertTrue(response.headers.contentType?.description.contains("text/html") == true)
            }
            for path in ["/styles.css", "/app.js", "/js/model.mjs", "/js/media.mjs", "/shared/design-tokens.json", "/shared/features.json", "/shared/seed.json", "/shared/library.json", "/shared/i18n.json", "/assets/coffee.jpg", "/library/stickers/LD-sticker-bear.svg", "/library/fonts/LD-handwritten.ttf"] {
                try await app.test(.GET, path) { response async throws in
                    XCTAssertEqual(response.status, .ok)
                    XCTAssertGreaterThan(response.body.readableBytes, 0)
                }
            }
        } catch {
            try? await app.asyncShutdown()
            throw error
        }
        try await app.asyncShutdown()
    }
}
