// swift-tools-version:5.9
import PackageDescription

let package = Package(
    name: "LittleDaysUI",
    platforms: [.iOS(.v17)],
    products: [.library(name: "LittleDaysUI", targets: ["LittleDaysUI"])],
    dependencies: [.package(path: "../Packages/LittleDaysCore")],
    targets: [.target(name: "LittleDaysUI", dependencies: [
        .product(name: "LittleDaysCore", package: "LittleDaysCore")
    ])]
)
