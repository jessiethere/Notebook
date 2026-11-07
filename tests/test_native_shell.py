import importlib.util
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('sync_native_web', ROOT / 'tools/sync_native_web.py')
sync_native_web = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sync_native_web)


class NativeShellTests(unittest.TestCase):
    def test_ios_shell_bundles_exactly_the_localhost_web_app(self):
        changed, stale = sync_native_web.differences()
        self.assertEqual((changed, stale), ([], []), 'Run python3 tools/sync_native_web.py after editing Public/')

    def test_shell_serves_every_route_the_web_app_requests(self):
        swift = (ROOT / 'Native/Sources/LittleDaysUI/WebShell/LittleDaysWebResources.swift').read_text(encoding='utf-8')
        for route in ['"shared"', '"library"', '"assets"', '"WebApp"']:
            self.assertIn(route, swift)
        app = (ROOT / 'Public/app.js').read_text(encoding='utf-8')
        # Every absolute fetch in the Web app must be one of the routes above.
        for path in re.findall(r'fetch\(`(/[^`$]*)', app):
            self.assertTrue(path.startswith(('/shared/', '/library/', '/assets/')), path)

    def test_app_entry_uses_the_web_shell_and_declares_device_permissions(self):
        entry = (ROOT / 'Native/App/LittleDaysApp.swift').read_text(encoding='utf-8')
        self.assertIn('LittleDaysWebShellView()', entry)
        project = (ROOT / 'Native/LittleDays.xcodeproj/project.pbxproj').read_text(encoding='utf-8')
        for key in ['NSMicrophoneUsageDescription', 'NSCameraUsageDescription', 'UIFileSharingEnabled']:
            self.assertEqual(project.count(key), 2, key)
        package = (ROOT / 'Native/Package.swift').read_text(encoding='utf-8')
        self.assertIn('.copy("WebApp")', package)


if __name__ == '__main__':
    unittest.main()
