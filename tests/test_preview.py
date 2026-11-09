import importlib.util
import json
from pathlib import Path
import threading
import unittest
import tempfile
import shutil
import socket
import subprocess
import sys
import time
from unittest.mock import patch
from functools import partial
from http.server import ThreadingHTTPServer
from urllib.error import HTTPError
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('preview', ROOT / 'tools/preview.py')
preview = importlib.util.module_from_spec(spec)
spec.loader.exec_module(preview)

class PreviewTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = ThreadingHTTPServer(('127.0.0.1', 0), partial(preview.PreviewHandler, directory=str(ROOT / 'Public')))
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.base = f'http://127.0.0.1:{cls.server.server_port}'

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join()

    def test_home_and_javascript(self):
        for path, expected in [('/', 'text/html'), ('/app.js', 'javascript'), ('/js/model.mjs', 'javascript')]:
            with urlopen(self.base + path) as response:
                self.assertIn(expected, response.headers['Content-Type'])
                self.assertGreater(len(response.read()), 100)

    def test_resources_and_photos(self):
        with urlopen(self.base + '/shared/design-tokens.json') as response:
            self.assertEqual(json.load(response)['colors']['cream'], '#F8F5EF')
        with urlopen(self.base + '/assets/coffee.jpg') as response:
            self.assertEqual(response.headers['Content-Type'], 'image/jpeg')
            self.assertGreater(len(response.read()), 1000)

    def test_v3_library_and_font_mime_types(self):
        for path, expected in [('/shared/library.json', 'application/json'), ('/shared/i18n.json', 'application/json'), ('/library/fonts/LD-handwritten.ttf', 'font/ttf'), ('/library/stickers/LD-sticker-bear.svg', 'image/svg+xml'), ('/library/stickers/LD-sticker-bear.png', 'image/png'), ('/library/music/LD-music-afternoon-coffee.mp3', 'audio/mpeg')]:
            with urlopen(self.base + path) as response:
                self.assertIn(expected, response.headers['Content-Type'])
                self.assertGreater(len(response.read()), 100)

    def test_unknown_library_and_private_data_are_not_http_resources(self):
        for path in ['/library/fonts/../../README.md', '/library/fonts/secret.ttf', '/little-days.v1', '/messages', '/media/private-recording.webm']:
            with self.assertRaises(HTTPError) as error:
                urlopen(self.base + path)
            self.assertEqual(error.exception.code, 404)

    def test_browser_open_failure_keeps_manual_address_available(self):
        with patch.object(preview.webbrowser, 'open', return_value=False) as opener, patch('builtins.print') as printer:
            preview.open_browser('http://localhost:8080')
            opener.assert_called_once()
            self.assertIn('http://localhost:8080', printer.call_args.args[0])

    def test_busy_port_does_not_open_a_browser_or_start_another_service(self):
        with patch.object(preview.webbrowser, 'open') as opener:
            self.assertEqual(preview.main(['--port', str(self.server.server_port), '--open']), 1)
            opener.assert_not_called()

    def test_cli_launches_from_extracted_zip_with_spaces_without_git_or_project_cwd(self):
        with tempfile.TemporaryDirectory(prefix='Little Days ZIP ') as directory:
            extracted = Path(directory) / 'Notebook-main'
            extracted.mkdir()
            shutil.copytree(ROOT / 'Public', extracted / 'Public')
            shutil.copytree(preview.SHARED, extracted / 'Packages/LittleDaysCore/Sources/LittleDaysCore/Resources')
            (extracted / 'tools').mkdir()
            shutil.copy2(ROOT / 'tools/preview.py', extracted / 'tools/preview.py')
            with socket.socket() as sock:
                sock.bind(('127.0.0.1', 0))
                port = sock.getsockname()[1]
            process = subprocess.Popen([sys.executable, str(extracted / 'tools/preview.py'), '--port', str(port)], cwd=directory, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            try:
                for attempt in range(100):
                    try:
                        with urlopen(f'http://127.0.0.1:{port}/api/health', timeout=0.2) as response:
                            self.assertEqual(json.load(response)['status'], 'ok')
                        break
                    except OSError:
                        if process.poll() is not None:
                            self.fail('Preview exited while launching from the ZIP layout')
                        time.sleep(0.03)
                else:
                    self.fail('Preview did not become ready')
            finally:
                process.terminate()
                process.wait(timeout=5)

    def test_incomplete_zip_exits_before_serving(self):
        with tempfile.TemporaryDirectory() as directory:
            with patch.object(preview, 'ROOT', Path(directory)):
                self.assertEqual(preview.main([]), 1)

    def test_nonpublic_files_and_unknown_paths_are_not_served(self):
        for path in ['/shared/../../README.md', '/shared/unknown.json', '/Package.swift', '/missing']:
            with self.assertRaises(HTTPError) as error:
                urlopen(self.base + path)
            self.assertEqual(error.exception.code, 404)

if __name__ == '__main__':
    unittest.main()
