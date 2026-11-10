"""The official app icon (2026-11-10) is wired into the iOS project and the web app."""
import json
import struct
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
APPICON = ROOT / 'Native/App/Assets.xcassets/AppIcon.appiconset'


def png_info(path):
    data = path.read_bytes()
    assert data[:8] == b'\x89PNG\r\n\x1a\n', f'{path} is not a PNG'
    width, height, depth, color = struct.unpack('>IIBB', data[16:26])
    return width, height, color  # color type 2 = RGB (opaque), 6 = RGBA


class AppIconTests(unittest.TestCase):
    def test_ios_icon_is_an_opaque_1024_square(self):
        contents = json.loads((APPICON / 'Contents.json').read_text(encoding='utf-8'))
        image = contents['images'][0]
        self.assertEqual((image['idiom'], image['platform'], image['size']), ('universal', 'ios', '1024x1024'))
        self.assertEqual(png_info(APPICON / image['filename']), (1024, 1024, 2), 'opaque RGB, no alpha, no pre-rounded corners')
        self.assertTrue((APPICON.parent / 'Contents.json').is_file())

    def test_xcode_project_uses_the_asset_catalog(self):
        project = (ROOT / 'Native/LittleDays.xcodeproj/project.pbxproj').read_text(encoding='utf-8')
        self.assertIn('path = Assets.xcassets;', project)
        self.assertIn('lastKnownFileType = folder.assetcatalog;', project)
        self.assertIn('files = (A00000000000000000000016,)', project, 'the catalog is in the Resources build phase')
        self.assertEqual(project.count('ASSETCATALOG_COMPILER_APPICON_NAME = AppIcon;'), 2, 'Debug and Release')
        self.assertEqual(project.count('PRODUCT_BUNDLE_IDENTIFIER = com.jessiethere.littledays;'), 2, 'bundle id unchanged')
        self.assertEqual(project.count('{'), project.count('}'))
        self.assertEqual(project.count('('), project.count(')'))

    def test_web_icons_are_linked_and_present(self):
        html = (ROOT / 'Public/index.html').read_text(encoding='utf-8')
        for name, size, color in [('favicon-32.png', 32, 6), ('icon-192.png', 192, 6), ('apple-touch-icon.png', 180, 2)]:
            self.assertIn(f'href="icons/{name}"', html)
            self.assertEqual(png_info(ROOT / 'Public/icons' / name), (size, size, color), name)
        self.assertNotIn('🌷', html, 'the old emoji favicon is gone')

    def test_source_artwork_is_kept(self):
        self.assertEqual(png_info(ROOT / 'docs/brand/LD-app-icon-original.png')[:2], (1254, 1254))


if __name__ == '__main__':
    unittest.main()
