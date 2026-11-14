"""Rebuild one TTF from unicode-range web-font slices of the SAME font (Fontsource / webfont npm
packages), keeping each glyph once. Outlines and names are unchanged; layout/vertical tables
that referenced slice-local glyph IDs are dropped. Usage: merge_font_slices.py OUT.ttf "slices/*.woff2"."""
import sys, glob, os
from fontTools.ttLib import TTFont
out, pattern = sys.argv[1], sys.argv[2]
files = sorted(glob.glob(pattern))
base = TTFont(files[0]); base.flavor = None
base["glyf"]  # load fully
for n in base.getGlyphOrder(): base["glyf"][n].expand(base["glyf"])
for tag in ("GSUB", "GPOS", "GDEF", "hdmx", "LTSH", "VDMX", "vhea", "vmtx", "VORG", "kern", "morx", "bsln", "feat", "prop", "FFTM"):
    if tag in base: del base[tag]
glyf, hmtx = base["glyf"], base["hmtx"]
order = list(base.getGlyphOrder()); have = set(order)
cmap = dict(base.getBestCmap())
for path in files[1:]:
    part = TTFont(path)
    pg, pm = part["glyf"], part["hmtx"]
    for name in part.getGlyphOrder():
        if name in have: continue
        glyph = pg[name]
        glyph.expand(pg)
        glyf.glyphs[name] = glyph
        hmtx.metrics[name] = pm.metrics[name]
        order.append(name); have.add(name)
    for code, name in part.getBestCmap().items():
        cmap.setdefault(code, name)
base.setGlyphOrder(order)
glyf.glyphOrder = order
for table in base["cmap"].tables:
    if table.isUnicode() and table.format in (4, 12):
        table.cmap = {c: n for c, n in cmap.items() if table.format == 12 or c <= 0xFFFF}
if not any(t.format == 12 for t in base["cmap"].tables):
    from fontTools.ttLib.tables._c_m_a_p import CmapSubtable
    t = CmapSubtable.newSubtable(12); t.platformID, t.platEncID, t.language = 3, 10, 0; t.cmap = dict(cmap)
    base["cmap"].tables.append(t)
base["maxp"].numGlyphs = len(order)
if "post" in base: base["post"].formatType = 3.0
base.save(out)
check = TTFont(out); cm = check.getBestCmap()
probe = "小日子慢慢记手帐今天的心情成长打卡宠物亲子Capiday 123"
print(out, os.path.getsize(out)//1024, "KB glyphs", len(check.getGlyphOrder()), "cmap", len(cm), "missing", [c for c in probe if c != " " and ord(c) not in cm], check["name"].getDebugName(6))
