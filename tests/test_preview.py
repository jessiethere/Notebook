import importlib.util
import json
from pathlib import Path
import threading
import unittest
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

    def test_nonpublic_files_and_unknown_paths_are_not_served(self):
        for path in ['/shared/../../README.md', '/shared/unknown.json', '/Package.swift', '/missing']:
            with self.assertRaises(HTTPError) as error:
                urlopen(self.base + path)
            self.assertEqual(error.exception.code, 404)

if __name__ == '__main__':
    unittest.main()
