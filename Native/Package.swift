// swift-tools-version:5.9
import PackageDescription

let package = Package(
    name: "LittleDaysUI",
    platforms: [.iOS(.v17)],
    products: [.library(name: "LittleDaysUI", targets: ["LittleDaysUI"])],
    dependencies: [.package(path: "../Packages/LittleDaysCore")],
    targets: [.target(name: "LittleDaysUI", dependencies: [
        .product(name: "LittleDaysCore", package: "LittleDaysCore")
    ], resources: [
        // Copy of Public/ (tools/sync_native_web.py): the iPhone shell shows the same Web app as localhost.
        .copy("WebApp")
    ])]
)
