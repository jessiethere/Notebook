"""Dependency-free Capiday localhost preview. Works with Windows Python 3."""
import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
import sys
import threading
import webbrowser

ROOT = Path(__file__).resolve().parents[1]
SHARED = ROOT / 'Packages/LittleDaysCore/Sources/LittleDaysCore/Resources'

class PreviewHandler(SimpleHTTPRequestHandler):
    extensions_map = {**SimpleHTTPRequestHandler.extensions_map, '.mjs': 'text/javascript', '.json': 'application/json'}

    def do_GET(self):
        path = self.path.split('?', 1)[0]
        if path == '/api/health':
            data = json.dumps({'status': 'ok', 'app': 'Capiday', 'framework': 'Python preview'}).encode()
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
        elif path.startswith('/library/'):
            parts = path.split('/')
            if len(parts) != 4 or parts[2] not in {'fonts', 'stickers', 'scenes', 'photos', 'music', 'keepers'}:
                self.send_error(404)
                return
            category, name = parts[2:]
            catalog = json.loads((SHARED / 'library.json').read_text(encoding='utf-8'))
            allowed = {item[key] for item in catalog.get(category, []) for key in ('file', 'nativeFile', 'license') if key in item}
            if category == 'keepers':  # Captain's Playroom pictures (V10.17)
                for play in catalog.get('keeperPlay', []):
                    allowed |= {play['idle'], play['license']} | {(play.get(k) or {}).get('file') for k in ('happy', 'ball')} - {None}
            if name not in allowed:
                self.send_error(404)
                return
            location = SHARED / category.title() / name
            if not location.is_file():
                self.send_error(404)
                return
            data = location.read_bytes()
            content_type = {'.ttf': 'font/ttf', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.mp3': 'audio/mpeg', '.txt': 'text/plain; charset=utf-8'}.get(location.suffix, 'application/octet-stream')
            self.send_response(200)
            self.send_header('Content-Type', content_type)
            self.send_header('Content-Length', str(len(data)))
            self.end_headers()
            self.wfile.write(data)
        elif path.startswith('/shared/'):
            name = path.removeprefix('/shared/')
            if name not in {'design-tokens.json', 'features.json', 'seed.json', 'library.json', 'i18n.json'}:
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

def open_browser(url):
    try:
        opened = webbrowser.open(url, new=2)
    except (OSError, webbrowser.Error):
        opened = False
    if not opened:
        print(f'Open this address in your browser: {url}', flush=True)

def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port', type=int, default=8080)
    parser.add_argument('--open', action='store_true', help='Open the localhost preview in your browser')
    # Default stays local-only for personal computers. Cloud sessions use
    # --host 0.0.0.0 so the session's servers/preview panel can reach it.
    parser.add_argument('--host', default='127.0.0.1', choices=['127.0.0.1', '0.0.0.0'], help='Interface to listen on (default: this computer only)')
    args = parser.parse_args(argv)
    if not 1 <= args.port <= 65535:
        parser.error('--port must be between 1 and 65535')
    required = [ROOT / 'Public/index.html', ROOT / 'Public/app.js', SHARED / 'seed.json', SHARED / 'library.json', SHARED / 'i18n.json']
    if not all(path.is_file() for path in required):
        print('Incomplete project. Run Start-Windows.cmd from the complete Notebook folder (git clone).', file=sys.stderr)
        return 1
    handler = partial(PreviewHandler, directory=str(ROOT / 'Public'))
    try:
        server = ThreadingHTTPServer((args.host, args.port), handler)
    except OSError as error:
        alternative = args.port + 1 if args.port < 65535 else 8080
        print(f'Cannot start localhost:{args.port}: {error}. Try --port {alternative}.', file=sys.stderr)
        return 1
    print(f'Capiday Web preview: http://localhost:{args.port}', flush=True)
    print('Same Web app as the iOS Swift shell. Ctrl+C to stop.', flush=True)
    if args.open:
        threading.Thread(target=open_browser, args=(f'http://localhost:{args.port}',), daemon=True).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
    return 0

if __name__ == '__main__':
    sys.exit(main())
