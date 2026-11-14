import sys
p = sys.argv[1]; s = open(p).read()
objs = '''
		BB0000000000000000000001 /* DrawUITests.swift in Sources */ = {isa = PBXBuildFile; fileRef = BB0000000000000000000002 /* DrawUITests.swift */; };
		BB0000000000000000000002 /* DrawUITests.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = DrawUITests.swift; sourceTree = "<group>"; };
		BB0000000000000000000003 /* CapidayUITests.xctest */ = {isa = PBXFileReference; explicitFileType = wrapper.cfbundle; includeInIndex = 0; path = CapidayUITests.xctest; sourceTree = BUILT_PRODUCTS_DIR; };
		BB0000000000000000000004 /* UITests */ = {isa = PBXGroup; children = (BB0000000000000000000002 /* DrawUITests.swift */,); path = UITests; sourceTree = "<group>"; };
		BB0000000000000000000005 /* CapidayUITests */ = {isa = PBXNativeTarget; buildConfigurationList = BB0000000000000000000006; buildPhases = (BB0000000000000000000007, BB0000000000000000000008, BB0000000000000000000009,); buildRules = (); dependencies = (BB000000000000000000000A,); name = CapidayUITests; productName = CapidayUITests; productReference = BB0000000000000000000003; productType = "com.apple.product-type.bundle.ui-testing"; };
		BB0000000000000000000006 = {isa = XCConfigurationList; buildConfigurations = (BB000000000000000000000C, BB000000000000000000000D,); defaultConfigurationIsVisible = 0; defaultConfigurationName = Release; };
		BB0000000000000000000007 = {isa = PBXSourcesBuildPhase; buildActionMask = 2147483647; files = (BB0000000000000000000001,); runOnlyForDeploymentPostprocessing = 0; };
		BB0000000000000000000008 = {isa = PBXFrameworksBuildPhase; buildActionMask = 2147483647; files = (); runOnlyForDeploymentPostprocessing = 0; };
		BB0000000000000000000009 = {isa = PBXResourcesBuildPhase; buildActionMask = 2147483647; files = (); runOnlyForDeploymentPostprocessing = 0; };
		BB000000000000000000000A = {isa = PBXTargetDependency; target = A00000000000000000000009; targetProxy = BB000000000000000000000B; };
		BB000000000000000000000B = {isa = PBXContainerItemProxy; containerPortal = A0000000000000000000000C; proxyType = 1; remoteGlobalIDString = A00000000000000000000009; remoteInfo = LittleDays; };
		BB000000000000000000000C = {isa = XCBuildConfiguration; buildSettings = {CODE_SIGN_STYLE = Automatic; GENERATE_INFOPLIST_FILE = YES; IPHONEOS_DEPLOYMENT_TARGET = 17.0; PRODUCT_BUNDLE_IDENTIFIER = com.capiday.app.uitests; PRODUCT_NAME = "$(TARGET_NAME)"; SDKROOT = iphoneos; SWIFT_VERSION = 5.0; TARGETED_DEVICE_FAMILY = "1,2"; TEST_TARGET_NAME = LittleDays; }; name = Debug; };
		BB000000000000000000000D = {isa = XCBuildConfiguration; buildSettings = {CODE_SIGN_STYLE = Automatic; GENERATE_INFOPLIST_FILE = YES; IPHONEOS_DEPLOYMENT_TARGET = 17.0; PRODUCT_BUNDLE_IDENTIFIER = com.capiday.app.uitests; PRODUCT_NAME = "$(TARGET_NAME)"; SDKROOT = iphoneos; SWIFT_VERSION = 5.0; TARGETED_DEVICE_FAMILY = "1,2"; TEST_TARGET_NAME = LittleDays; }; name = Release; };
'''
s = s.replace("\tobjects = {\n", "\tobjects = {\n" + objs, 1)
s = s.replace("\t\t\t\tA00000000000000000000007 /* App */,\n", "\t\t\t\tA00000000000000000000007 /* App */,\n\t\t\t\tBB0000000000000000000004 /* UITests */,\n", 1)
s = s.replace("\t\t\t\tA00000000000000000000003 /* LittleDays.app */,\n", "\t\t\t\tA00000000000000000000003 /* LittleDays.app */,\n\t\t\t\tBB0000000000000000000003 /* CapidayUITests.xctest */,\n", 1)
s = s.replace("\t\t\t\tA00000000000000000000009 /* LittleDays */,\n\t\t\t);\n\t\t};\n/* End PBXProject", "\t\t\t\tA00000000000000000000009 /* LittleDays */,\n\t\t\t\tBB0000000000000000000005 /* CapidayUITests */,\n\t\t\t);\n\t\t};\n/* End PBXProject", 1)
assert s.count("BB0000000000000000000004 /* UITests */,") == 1 and s.count("BB0000000000000000000005 /* CapidayUITests */,") == 1 and s.count("CapidayUITests.xctest */,") == 1
open(p, "w").write(s); print("patched")
