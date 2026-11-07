"""Copy the Web app (Public/) into the iOS Swift shell bundle.

The iPhone app is a thin SwiftUI + WKWebView shell around the very same
HTML/CSS/JavaScript that the localhost preview serves, so both always match.
Run this after every change in Public/:

    python3 tools/sync_native_web.py          # copy
    python3 tools/sync_native_web.py --check  # exit 1 if the shell is stale

Shared JSON, fonts, stickers and sample photos are not copied: the shell
serves them from the LittleDaysCore bundle, exactly like tools/preview.py.
"""
import argparse
import filecmp
from pathlib import Path
import shutil
import sys

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'Public'
TARGET = ROOT / 'Native/Sources/LittleDaysUI/WebApp'
SUFFIXES = {'.html', '.css', '.js', '.mjs'}


def web_files():
    return sorted(
        path.relative_to(SOURCE)
        for path in SOURCE.rglob('*')
        if path.is_file() and path.suffix in SUFFIXES
    )


def differences():
    expected = set(web_files())
    present = {path.relative_to(TARGET) for path in TARGET.rglob('*') if path.is_file()} if TARGET.exists() else set()
    stale = sorted(present - expected)
    changed = sorted(
        path for path in expected
        if not (TARGET / path).is_file() or not filecmp.cmp(SOURCE / path, TARGET / path, shallow=False)
    )
    return changed, stale


def sync():
    changed, stale = differences()
    for path in changed:
        (TARGET / path).parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(SOURCE / path, TARGET / path)
    for path in stale:
        (TARGET / path).unlink()
    return changed, stale


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument('--check', action='store_true', help='only report whether the shell bundle is up to date')
    args = parser.parse_args()
    if args.check:
        changed, stale = differences()
        if changed or stale:
            print('iOS shell web bundle is out of date:', *[str(p) for p in changed + stale], sep='\n  ')
            print('Run: python3 tools/sync_native_web.py')
            return 1
        print('iOS shell web bundle matches Public/.')
        return 0
    changed, stale = sync()
    print(f'Synced {len(changed)} changed and removed {len(stale)} stale file(s) into {TARGET.relative_to(ROOT)}.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
