"""Dependency-free Little Days localhost preview. Works with Windows Python 3."""
import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
SHARED = ROOT / 'Packages/LittleDaysCore/Sources/LittleDaysCore/Resources'

class PreviewHandler(SimpleHTTPRequestHandler):
    extensions_map = {**SimpleHTTPRequestHandler.extensions_map, '.mjs': 'text/javascript', '.json': 'application/json'}

    def do_GET(self):
        path = self.path.split('?', 1)[0]
        if path == '/api/health':
            data = json.dumps({'status': 'ok', 'app': 'Little Days', 'framework': 'Python preview'}).encode()
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Content-Length', str(len(data)))
            self.end_headers()
            self.wfile.write(data)
        elif path in {'/assets/coffee.jpg', '/assets/lake.jpg'}:
            data = (SHARED / 'Media' / path.rsplit('/', 1)[1]).read_bytes()
            self.send_response(200)
            self.send_header('Content-Type', 'image/jpeg')
            self.send_header('Content-Length', str(len(data)))
            self.end_headers()
            self.wfile.write(data)
        elif path.startswith('/shared/'):
            name = path.removeprefix('/shared/')
            if name not in {'design-tokens.json', 'features.json', 'seed.json'}:
                self.send_error(404)
                return
            data = (SHARED / name).read_bytes()
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Content-Length', str(len(data)))
            self.end_headers()
            self.wfile.write(data)
        else:
            super().do_GET()

    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port', type=int, default=8080)
    args = parser.parse_args()
    if not 1 <= args.port <= 65535:
        parser.error('--port must be between 1 and 65535')
    handler = partial(PreviewHandler, directory=str(ROOT / 'Public'))
    try:
        server = ThreadingHTTPServer(('127.0.0.1', args.port), handler)
    except OSError as error:
        print(f'Cannot start localhost:{args.port}: {error}. Try --port 8081.', file=sys.stderr)
        return 1
    print(f'Little Days Web preview: http://localhost:{args.port}', flush=True)
    print('HTML interactive preview; not a running SwiftUI app. Ctrl+C to stop.', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
    return 0

if __name__ == '__main__':
    sys.exit(main())
