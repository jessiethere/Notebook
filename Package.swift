// swift-tools-version:5.9
import PackageDescription

let package = Package(
    name: "Notebook",
    // iOS 17 is the minimum for every Capiday package (LittleDaysCore,
    // Native/LittleDaysUI and the app target). This package is the local
    // Vapor server, run on the Mac; the iOS line keeps the deployment target
    // the same as LittleDaysCore's if Xcode builds it for an iPhone
    // destination (without it SwiftPM assumed iOS 15 and the build failed with
    // "LittleDaysCore-product requires minimum platform version 17.0").
    // The iPhone app itself is Native/LittleDays.xcodeproj
    // (open LittleDays.xcworkspace).
    platforms: [.macOS(.v13), .iOS(.v17)],
    products: [.executable(name: "NotebookServer", targets: ["NotebookServer"])],
    dependencies: [
        .package(path: "Packages/LittleDaysCore"),
        .package(url: "https://github.com/vapor/vapor.git", exact: "4.110.1")
    ],
    targets: [
        .target(name: "NotebookApp", dependencies: [
            .product(name: "Vapor", package: "vapor"),
            .product(name: "LittleDaysCore", package: "LittleDaysCore")
        ]),
        .executableTarget(name: "NotebookServer", dependencies: [
            "NotebookApp", .product(name: "Vapor", package: "vapor")
        ]),
        .testTarget(name: "NotebookAppTests", dependencies: [
            "NotebookApp", .product(name: "XCTVapor", package: "vapor")
        ])
    ]
)
