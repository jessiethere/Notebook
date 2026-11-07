// swift-tools-version:5.9
import PackageDescription

let package = Package(
    name: "LittleDaysCore",
    platforms: [.iOS(.v17), .macOS(.v13)],
    products: [.library(name: "LittleDaysCore", targets: ["LittleDaysCore"])],
    targets: [
        .target(name: "LittleDaysCore", resources: [.process("Resources")]),
        .testTarget(name: "LittleDaysCoreTests", dependencies: ["LittleDaysCore"])
    ]
)
