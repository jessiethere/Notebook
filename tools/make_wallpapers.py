"""Original "wallpaper-style" scene collections for Capiday (portrait 3:4).

Five procedural collections — color, ribbons, kaleidoscope, patterns, sky —
drawn with smooth gradients and soft light (no third-party art). Generated
together with the life scenes by tools/make_scenes.py.
"""
import math

W, H = 900, 1200


class Rand:
    """Small deterministic generator so every file is reproducible."""

    def __init__(self, seed):
        self.state = seed * 2654435761 % 2**32 or 1

    def __call__(self, a=0.0, b=1.0):
        self.state = (1103515245 * self.state + 12345) % 2**31
        return a + (b - a) * self.state / 2**31


def doc(defs, body):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">'
            f'<defs>{defs}</defs>{body}</svg>\n')


def stops(*pairs):
    return ''.join(f'<stop offset="{o}" stop-color="{c}"{"" if a is None else f" stop-opacity=\"{a}\""}/>' for o, c, a in pairs)


# ---------- 1. Color: soft light fields (mesh-like gradients) ----------
COLOR = {
    'color-peach': ('#FFD9C2', ['#FF9F80', '#FFC9A3', '#F7A3C0', '#FFE3A3']),
    'color-ocean': ('#BFE4F5', ['#4FA3E0', '#7FD3E8', '#3E6FD8', '#A6F0E0']),
    'color-lavender': ('#E4DAF7', ['#9C7BF2', '#F2A6D8', '#7FA0F2', '#D8C8FF']),
    'color-mint': ('#DDF5E8', ['#7FD9B0', '#B5E8A0', '#5CC2C9', '#F2F0A6']),
    'color-rose': ('#F7DCD6', ['#E89AA3', '#F5C6A0', '#C98BB8', '#FCE1C9']),
    'color-midnight': ('#141A33', ['#3E4FD8', '#8C4FD8', '#1F8FBF', '#D84F9C']),
}


def color_field(key):
    base, palette = COLOR[key]
    r = Rand(sum(map(ord, key)))
    defs, body = '', f'<rect width="{W}" height="{H}" fill="{base}"/>'
    for i, c in enumerate(palette * 2):
        cx, cy, rad = r(-100, W + 100), r(-100, H + 100), r(380, 720)
        defs += f'<radialGradient id="b{i}" cx=".5" cy=".5" r=".5">{stops((0, c, .95), (.55, c, .45), (1, c, 0))}</radialGradient>'
        body += f'<ellipse cx="{cx:.0f}" cy="{cy:.0f}" rx="{rad:.0f}" ry="{rad * r(.8, 1.3):.0f}" fill="url(#b{i})"/>'
    defs += f'<linearGradient id="gloss" x1="0" y1="0" x2="0" y2="1">{stops((0, "#FFFFFF", .28), (.45, "#FFFFFF", 0), (1, "#000000", .12))}</linearGradient>'
    body += f'<rect width="{W}" height="{H}" fill="url(#gloss)"/>'
    return doc(defs, body)


# ---------- 2. Ribbons: glowing bands on a dark ground ----------
RIBBONS = {
    'ribbons-aurora': ('#06101A', ['#43E6B0', '#2FB5FF', '#B57BFF', '#7CFFDA']),
    'ribbons-sunset': ('#140A0C', ['#FF7A59', '#FFC15E', '#FF5E9C', '#FFE8A3']),
    'ribbons-candy': ('#0F0B1C', ['#FF8FD1', '#8FB8FF', '#FFE08F', '#9CFFC9']),
    'ribbons-ember': ('#0D0907', ['#FF9F43', '#FF5E3A', '#FFD27A', '#E8486B']),
}


def ribbons(key):
    bg, palette = RIBBONS[key]
    r = Rand(sum(map(ord, key)) * 7)
    defs = f'<radialGradient id="halo" cx=".5" cy=".45" r=".7">{stops((0, palette[1], .18), (1, bg, 0))}</radialGradient>'
    body = f'<rect width="{W}" height="{H}" fill="{bg}"/><rect width="{W}" height="{H}" fill="url(#halo)"/>'
    for i in range(7):
        a, b = palette[i % 4], palette[(i + 1) % 4]
        defs += f'<linearGradient id="r{i}" x1="0" y1="0" x2="1" y2="1">{stops((0, a, None), (.5, b, None), (1, a, None))}</linearGradient>'
        y0 = r(-100, H + 100)
        pts = [(-80, y0)] + [(W * k / 3 + r(-80, 80), r(80, H - 80)) for k in (1, 2)] + [(W + 80, r(-100, H + 100))]
        d = f'M{pts[0][0]:.0f} {pts[0][1]:.0f} C{pts[1][0]:.0f} {pts[1][1]:.0f} {pts[2][0]:.0f} {pts[2][1]:.0f} {pts[3][0]:.0f} {pts[3][1]:.0f}'
        w = r(18, 46)
        # Glow: wide faint strokes under a bright core (no blur filter needed).
        for width, opacity in ((w * 4, .08), (w * 2.2, .16), (w, .9), (w * .25, .9)):
            stroke = '#FFFFFF' if width == w * .25 else f'url(#r{i})'
            body += f'<path d="{d}" fill="none" stroke="{stroke}" stroke-width="{width:.0f}" stroke-linecap="round" opacity="{opacity if width != w * .25 else .35}"/>'
    return doc(defs, body)


# ---------- 3. Kaleidoscope: 12-fold mirrored shapes ----------
KALEIDO = {
    'kaleido-lagoon': (['#0F3D5E', '#1D6E8F'], ['#5FD3E8', '#B5F2E0', '#2F8FBF', '#F2E6A6', '#7FB5FF']),
    'kaleido-garden': (['#2E3B1F', '#4F6B2E'], ['#E8A3B5', '#F2D27A', '#A6D98C', '#FFFFFF', '#D97A5E']),
    'kaleido-sunrise': (['#5E1F2E', '#B54F3E'], ['#FFC15E', '#FF8F6B', '#FFE3B5', '#F25E7A', '#FFF2D9']),
    'kaleido-violet': (['#1F1440', '#3E2A7A'], ['#B58FFF', '#FF9CD9', '#8FD9FF', '#FFE08F', '#E8D9FF']),
}


def kaleidoscope(key):
    (bg1, bg2), palette = KALEIDO[key]
    r = Rand(sum(map(ord, key)) * 13)
    cx, cy = W / 2, H / 2
    defs = f'<radialGradient id="kbg" cx=".5" cy=".5" r=".75">{stops((0, bg2, None), (1, bg1, None))}</radialGradient>'
    for i, c in enumerate(palette):
        defs += f'<radialGradient id="k{i}" cx=".35" cy=".35" r=".8">{stops((0, "#FFFFFF", .85), (.35, c, None), (1, c, .75))}</radialGradient>'
    wedge = ''
    for _ in range(26):
        d = r(30, 720)
        ang = r(0, 15)
        x, y = d * math.cos(math.radians(ang)), d * math.sin(math.radians(ang))
        size = r(10, 70) * (0.5 + d / 900)
        fill = f'url(#k{int(r(0, len(palette)))})'
        kind = r()
        if kind < .4:
            wedge += f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{size:.0f}" fill="{fill}" opacity="{r(.6, .95):.2f}"/>'
        elif kind < .75:
            wedge += f'<ellipse cx="{x:.0f}" cy="{y:.0f}" rx="{size * 1.8:.0f}" ry="{size * .55:.0f}" transform="rotate({r(0, 180):.0f} {x:.0f} {y:.0f})" fill="{fill}" opacity="{r(.55, .9):.2f}"/>'
        else:
            s = size * 1.3
            wedge += f'<path d="M{x:.0f} {y - s:.0f}L{x + s * .87:.0f} {y + s * .5:.0f}L{x - s * .87:.0f} {y + s * .5:.0f}Z" fill="{fill}" opacity="{r(.5, .85):.2f}"/>'
    defs += f'<g id="wedge">{wedge}</g>'
    body = f'<rect width="{W}" height="{H}" fill="url(#kbg)"/><g transform="translate({cx} {cy})">'
    for k in range(12):
        body += f'<use href="#wedge" transform="rotate({k * 30})"/><use href="#wedge" transform="rotate({k * 30}) scale(1 -1)"/>'
    body += '</g>'
    defs += f'<radialGradient id="kglow" cx=".5" cy=".5" r=".5">{stops((0, "#FFFFFF", .5), (1, "#FFFFFF", 0))}</radialGradient>'
    body += f'<circle cx="{cx}" cy="{cy}" r="160" fill="url(#kglow)"/>'
    return doc(defs, body)


# ---------- 4. Patterns: little motifs scattered on a soft ground ----------
def cloud(x, y, s, c='#FFFFFF'):
    return f'<g transform="translate({x:.0f} {y:.0f}) scale({s:.2f})" fill="{c}"><circle cx="-14" cy="4" r="12"/><circle cx="2" cy="-4" r="16"/><circle cx="18" cy="5" r="11"/><rect x="-26" y="4" width="54" height="12" rx="6"/></g>'


def flower(x, y, s, petal, core='#FFD45E'):
    petals = ''.join(f'<ellipse cx="0" cy="-12" rx="7" ry="12" fill="{petal}" transform="rotate({a})"/>' for a in range(0, 360, 60))
    return f'<g transform="translate({x:.0f} {y:.0f}) scale({s:.2f})">{petals}<circle r="7" fill="{core}"/></g>'


def star(x, y, s, c):
    pts = ' '.join(f'{math.cos(math.radians(-90 + i * 36)) * (16 if i % 2 == 0 else 7):.1f},{math.sin(math.radians(-90 + i * 36)) * (16 if i % 2 == 0 else 7):.1f}' for i in range(10))
    return f'<polygon points="{pts}" fill="{c}" transform="translate({x:.0f} {y:.0f}) scale({s:.2f})"/>'


def heart(x, y, s, c):
    return f'<path d="M0 12C-18 0-16-14-6-14c3 0 5 2 6 4 1-2 3-4 6-4 10 0 12 14-6 26z" fill="{c}" transform="translate({x:.0f} {y:.0f}) scale({s:.2f})"/>'


def bee(x, y, s):
    return (f'<g transform="translate({x:.0f} {y:.0f}) scale({s:.2f})"><ellipse cx="-6" cy="-12" rx="8" ry="10" fill="#FFFFFF" opacity=".85"/><ellipse cx="6" cy="-12" rx="8" ry="10" fill="#FFFFFF" opacity=".85"/>'
            '<ellipse rx="15" ry="11" fill="#F7C531"/><path d="M-5-10v20M3-10v20" stroke="#3A2E22" stroke-width="5"/><circle cx="13" cy="-2" r="2" fill="#3A2E22"/></g>')


PATTERNS = {
    'pattern-clouds': ('#BFE3F7', '#E3F3FC'),
    'pattern-flowers': ('#F9D9E2', '#FCEEF2'),
    'pattern-stars': ('#1E2650', '#2E3A70'),
    'pattern-hearts': ('#FBEFE3', '#F7E1CF'),
}


def pattern(key):
    a, b = PATTERNS[key]
    r = Rand(sum(map(ord, key)) * 3)
    defs = f'<linearGradient id="pg" x1="0" y1="0" x2="0" y2="1">{stops((0, a, None), (1, b, None))}</linearGradient>'
    body = f'<rect width="{W}" height="{H}" fill="url(#pg)"/>'
    for row in range(10):
        for col in range(6):
            x = col * 160 + (80 if row % 2 else 0) + r(-18, 18)
            y = row * 130 + 50 + r(-14, 14)
            s = r(1.3, 1.9)
            pick = r()
            if key == 'pattern-clouds':
                body += bee(x, y, s * .9) if pick < .22 else cloud(x, y, s * 1.3)
            elif key == 'pattern-flowers':
                body += flower(x, y, s, ['#FFFFFF', '#F7A3B8', '#FFC9A3', '#C9A3F7'][int(pick * 4)])
            elif key == 'pattern-stars':
                body += (f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{s * 14:.0f}" fill="#FFF3C2"/><circle cx="{x + s * 7:.0f}" cy="{y - s * 4:.0f}" r="{s * 13:.0f}" fill="{a}"/>'
                         if pick < .2 else star(x, y, s, ['#FFE38F', '#FFFFFF', '#B5C8FF'][int(pick * 3)]))
            else:
                body += heart(x, y, s * 1.4, ['#F28B9B', '#F7B5A3', '#E8687E', '#FFD1B3'][int(pick * 4)])
    defs += f'<linearGradient id="pgloss" x1="0" y1="0" x2="0" y2="1">{stops((0, "#FFFFFF", .22), (.5, "#FFFFFF", 0))}</linearGradient>'
    body += f'<rect width="{W}" height="{H}" fill="url(#pgloss)"/>'
    return doc(defs, body)


# ---------- 5. Sky: planets, moon and nebula ----------
def starfield(r, n=160):
    return ''.join(f'<circle cx="{r(0, W):.0f}" cy="{r(0, H):.0f}" r="{r(.6, 2.4):.1f}" fill="#FFFFFF" opacity="{r(.35, 1):.2f}"/>' for _ in range(n))


def sky(key):
    r = Rand(sum(map(ord, key)) * 17)
    defs = f'<linearGradient id="night" x1="0" y1="0" x2="0" y2="1">{stops((0, "#03050F", None), (1, "#0B1430", None))}</linearGradient>'
    for i, c in enumerate(['#3E2A7A', '#1F5F8F', '#8F2A6B']):
        defs += f'<radialGradient id="neb{i}" cx=".5" cy=".5" r=".5">{stops((0, c, .55), (1, c, 0))}</radialGradient>'
    body = f'<rect width="{W}" height="{H}" fill="url(#night)"/>'
    for i in range(3):
        body += f'<ellipse cx="{r(0, W):.0f}" cy="{r(0, H):.0f}" rx="{r(300, 520):.0f}" ry="{r(200, 380):.0f}" fill="url(#neb{i})"/>'
    body += starfield(r)
    cx, cy, R = W / 2, H * .62, 300
    if key == 'sky-blue-planet':
        defs += (f'<radialGradient id="pl" cx=".35" cy=".3" r=".8">{stops((0, "#BFF2FF", None), (.35, "#3FA0E0", None), (.7, "#1F4FA0", None), (1, "#081530", None))}</radialGradient>'
                 f'<radialGradient id="atmo" cx=".5" cy=".5" r=".5">{stops((.86, "#7FD3FF", 0), (.93, "#7FD3FF", .55), (1, "#7FD3FF", 0))}</radialGradient>')
        land = ''.join(f'<ellipse cx="{cx + r(-200, 200):.0f}" cy="{cy + r(-200, 200):.0f}" rx="{r(40, 120):.0f}" ry="{r(25, 70):.0f}" fill="#5FBF8F" opacity=".55" transform="rotate({r(-40, 40):.0f} {cx:.0f} {cy:.0f})"/>' for _ in range(6))
        defs += f'<clipPath id="disc"><circle cx="{cx}" cy="{cy}" r="{R}"/></clipPath>'
        body += f'<circle cx="{cx}" cy="{cy}" r="{R * 1.16:.0f}" fill="url(#atmo)"/><circle cx="{cx}" cy="{cy}" r="{R}" fill="url(#pl)"/><g clip-path="url(#disc)">{land}<circle cx="{cx + 120}" cy="{cy + 110}" r="{R}" fill="#000814" opacity=".45"/></g>'
    elif key == 'sky-ringed':
        defs += f'<radialGradient id="pl" cx=".35" cy=".3" r=".8">{stops((0, "#FFE9C2", None), (.45, "#E0A86B", None), (1, "#4A2A14", None))}</radialGradient>'
        defs += f'<linearGradient id="ring" x1="0" y1="0" x2="1" y2="0">{stops((0, "#FFE3B5", .1), (.5, "#FFE3B5", .9), (1, "#FFE3B5", .1))}</linearGradient>'
        body += (f'<ellipse cx="{cx}" cy="{cy}" rx="{R * 1.9:.0f}" ry="{R * .42:.0f}" fill="none" stroke="url(#ring)" stroke-width="34" transform="rotate(-14 {cx} {cy})" opacity=".55"/>'
                 f'<circle cx="{cx}" cy="{cy}" r="{R * .8:.0f}" fill="url(#pl)"/>'
                 f'<path d="M{cx - R * 1.84:.0f} {cy:.0f}A{R * 1.9:.0f} {R * .42:.0f} 0 0 0 {cx + R * 1.84:.0f} {cy:.0f}" fill="none" stroke="url(#ring)" stroke-width="34" transform="rotate(-14 {cx} {cy})"/>')
    else:
        defs += (f'<radialGradient id="moon" cx=".4" cy=".35" r=".75">{stops((0, "#FFFDF2", None), (.6, "#E8E2CC", None), (1, "#B5AE96", None))}</radialGradient>'
                 f'<radialGradient id="mglow" cx=".5" cy=".5" r=".5">{stops((.55, "#FFF6D8", .35), (1, "#FFF6D8", 0))}</radialGradient>')
        craters = ''.join(f'<circle cx="{cx + r(-180, 180):.0f}" cy="{cy - 140 + r(-180, 180):.0f}" r="{r(14, 46):.0f}" fill="#BDB59C" opacity=".45"/>' for _ in range(9))
        defs += f'<clipPath id="disc"><circle cx="{cx}" cy="{cy - 140}" r="250"/></clipPath>'
        body += f'<circle cx="{cx}" cy="{cy - 140}" r="520" fill="url(#mglow)"/><circle cx="{cx}" cy="{cy - 140}" r="250" fill="url(#moon)"/><g clip-path="url(#disc)">{craters}</g>'
        body += f'<path d="M0 {H - 180} C 220 {H - 260} 420 {H - 200} 620 {H - 250} S 860 {H - 230} {W} {H - 260} V {H} H 0 Z" fill="#0A0F22"/>'
    return doc(defs, body)


COLLECTIONS = [
    ('life', [k for k in []]),  # filled by make_scenes.py (the illustrated scenes)
    ('color', list(COLOR)),
    ('ribbons', list(RIBBONS)),
    ('kaleido', list(KALEIDO)),
    ('pattern', list(PATTERNS)),
    ('sky', ['sky-blue-planet', 'sky-ringed', 'sky-moon']),
]
NAMES = {
    'color-peach': ('蜜桃晨光', 'Peach glow'), 'color-ocean': ('海的颜色', 'Ocean'), 'color-lavender': ('薰衣草黄昏', 'Lavender dusk'),
    'color-mint': ('薄荷清晨', 'Mint morning'), 'color-rose': ('玫瑰金', 'Rose gold'), 'color-midnight': ('午夜霓虹', 'Midnight neon'),
    'ribbons-aurora': ('极光丝带', 'Aurora ribbons'), 'ribbons-sunset': ('落日丝带', 'Sunset ribbons'), 'ribbons-candy': ('糖果丝带', 'Candy ribbons'), 'ribbons-ember': ('余烬', 'Embers'),
    'kaleido-lagoon': ('泻湖', 'Lagoon'), 'kaleido-garden': ('花园', 'Garden'), 'kaleido-sunrise': ('朝霞', 'Sunrise'), 'kaleido-violet': ('紫晶', 'Amethyst'),
    'pattern-clouds': ('云朵和小蜜蜂', 'Clouds & bees'), 'pattern-flowers': ('满天小花', 'Little flowers'), 'pattern-stars': ('星星月亮', 'Stars & moons'), 'pattern-hearts': ('小爱心', 'Little hearts'),
    'sky-blue-planet': ('蓝色星球', 'Blue planet'), 'sky-ringed': ('土星环', 'Ringed planet'), 'sky-moon': ('月光', 'Moonlight'),
}


def render(key):
    if key in COLOR:
        return color_field(key)
    if key in RIBBONS:
        return ribbons(key)
    if key in KALEIDO:
        return kaleidoscope(key)
    if key in PATTERNS:
        return pattern(key)
    return sky(key)
