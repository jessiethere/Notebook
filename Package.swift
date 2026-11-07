// swift-tools-version:5.9
import PackageDescription

let package = Package(
    name: "Notebook",
    platforms: [.macOS(.v13)],
    products: [.executable(name: "NotebookServer", targets: ["NotebookServer"])],
    dependencies: [
        .package(url: "https://github.com/vapor/vapor.git", exact: "4.110.1")
    ],
    targets: [
        .target(name: "NotebookApp", dependencies: [.product(name: "Vapor", package: "vapor")]),
        .executableTarget(name: "NotebookServer", dependencies: [
            "NotebookApp", .product(name: "Vapor", package: "vapor")
        ]),
        .testTarget(name: "NotebookAppTests", dependencies: [
            "NotebookApp", .product(name: "XCTVapor", package: "vapor")
        ])
    ]
)
