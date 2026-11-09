"""Build the hosted-link copy of the Web app (a claude.ai Artifact).

Output: dist/link/ (not committed). It holds the same Public/ files plus the
shared JSON, fonts, stickers and sample photos at the relative paths the app
requests (shared/, library/, assets/), so one link opens the full app in any
browser without running a server. The page itself (index.html) is written
without <html>/<head>/<body> tags because the host adds that skeleton.

    python3 tools/build_link.py
"""
import json
from pathlib import Path
import re
import shutil

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / 'Public'
SHARED = ROOT / 'Packages/LittleDaysCore/Sources/LittleDaysCore/Resources'
OUT = ROOT / 'dist/link'


def page_html():
    html = (PUBLIC / 'index.html').read_text(encoding='utf-8')
    head = re.search(r'<head>(.*?)</head>', html, re.S).group(1)
    body = re.search(r'<body>(.*?)</body>', html, re.S).group(1)
    # The host skeleton already sets charset and a viewport-fit=cover viewport.
    head = re.sub(r'\s*<meta\s+charset="[^"]*"\s*/>', '', head)
    head = re.sub(r'\s*<meta\s+name="viewport".*?/>', '', head, flags=re.S)
    title = re.search(r'<title>.*?</title>', head, re.S).group(0)
    head = head.replace(title, '')
    return f'{title}\n{head.strip()}\n{body.strip()}\n'


def main():
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir(parents=True)
    (OUT / 'index.html').write_text(page_html(), encoding='utf-8')
    files = []
    for path in sorted(PUBLIC.rglob('*')):
        if path.is_file() and path.name != 'index.html' and path.suffix in {'.css', '.js', '.mjs'}:
            files.append((path, path.relative_to(PUBLIC)))
    for name in ['design-tokens', 'features', 'seed', 'library', 'i18n']:
        files.append((SHARED / f'{name}.json', Path('shared') / f'{name}.json'))
    catalog = json.loads((SHARED / 'library.json').read_text(encoding='utf-8'))
    for font in catalog['fonts']:
        for name in {font['file'], font['license']}:
            files.append((SHARED / 'Fonts' / name, Path('library/fonts') / name))
    for sticker in catalog['stickers']:
        for name in {sticker['file'], sticker['license']}:
            files.append((SHARED / 'Stickers' / name, Path('library/stickers') / name))
    for scene in catalog.get('scenes', []):
        for name in {scene['file'], scene['license']}:
            files.append((SHARED / 'Scenes' / name, Path('library/scenes') / name))
    for photo in catalog.get('photos', []):
        for name in {photo['file'], photo['license']}:
            files.append((SHARED / 'Photos' / name, Path('library/photos') / name))
    for name in ['coffee.jpg', 'lake.jpg']:
        files.append((SHARED / 'Media' / name, Path('assets') / name))
    published = {}
    for source, target in files:
        destination = OUT / target
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(source, destination)
        published[target.as_posix()] = target.as_posix()
    (OUT.parent / 'link-files.json').write_text(json.dumps(published, indent=1), encoding='utf-8')
    size = sum(p.stat().st_size for p in OUT.rglob('*') if p.is_file())
    print(f'Built {len(published) + 1} files ({size / 1024 / 1024:.1f} MB) in {OUT.relative_to(ROOT)}')


if __name__ == '__main__':
    main()
