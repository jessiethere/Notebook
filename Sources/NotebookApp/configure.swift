import Vapor

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
        HealthResponse(status: "ok", app: "Notebook", framework: "Vapor")
    }
}

struct HealthResponse: Content {
    let status: String
    let app: String
    let framework: String
}
