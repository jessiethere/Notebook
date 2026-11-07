import Vapor
import LittleDaysCore

public func configure(_ app: Application) throws {
    app.http.server.configuration.hostname = "127.0.0.1"
    app.http.server.configuration.port = 8080
    app.middleware.use(FileMiddleware(publicDirectory: app.directory.publicDirectory))

    app.get { request -> Response in
        let response = request.fileio.streamFile(at: app.directory.publicDirectory + "index.html")
        response.headers.replaceOrAdd(name: .cacheControl, value: "no-cache")
        return response
    }

    app.get("api", "health") { _ in
        HealthResponse(status: "ok", app: "Little Days", framework: "Vapor")
    }

    app.get("shared", ":name") { request -> Response in
        let filename = request.parameters.get("name") ?? ""
        guard filename.hasSuffix(".json") else { throw Abort(.notFound) }
        let name = String(filename.dropLast(5))
        guard let data = try? SharedResources.data(named: name) else { throw Abort(.notFound) }
        return Response(status: .ok, headers: ["Content-Type": "application/json; charset=utf-8"], body: .init(data: data))
    }

    app.get("assets", ":name") { request -> Response in
        let filename = request.parameters.get("name") ?? ""
        guard filename.hasSuffix(".jpg"),
              let data = try? SharedResources.mediaData(named: String(filename.dropLast(4))) else {
            throw Abort(.notFound)
        }
        return Response(status: .ok, headers: ["Content-Type": "image/jpeg"], body: .init(data: data))
    }

    app.get("library", ":category", ":name") { request -> Response in
        let category = request.parameters.get("category") ?? ""
        let filename = request.parameters.get("name") ?? ""
        guard let data = try? SharedResources.libraryData(category: category, filename: filename) else { throw Abort(.notFound) }
        let extensionName = (filename as NSString).pathExtension
        let type = ["ttf": "font/ttf", "svg": "image/svg+xml", "png": "image/png", "txt": "text/plain; charset=utf-8"][extensionName] ?? "application/octet-stream"
        return Response(status: .ok, headers: ["Content-Type": type], body: .init(data: data))
    }
}

struct HealthResponse: Content {
    let status: String
    let app: String
    let framework: String
}
