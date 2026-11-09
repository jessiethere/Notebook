"""Draw the original Little Days scene illustrations (photo-like material for
journal pages). Original artwork by the project; see
Resources/Scenes/LittleDays-Original-Scenes.txt. Re-run to regenerate.

    python3 tools/make_scenes.py
"""
from pathlib import Path

OUT = Path(__file__).resolve().parents[1] / 'Packages/LittleDaysCore/Sources/LittleDaysCore/Resources/Scenes'
W, H = 1200, 900


def svg(defs, body):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">'
            f'<defs>{defs}</defs>{body}</svg>\n')


def lin(i, *stops, x2=0, y2=1):
    s = ''.join(f'<stop offset="{o}" stop-color="{c}"/>' for o, c in stops)
    return f'<linearGradient id="{i}" x1="0" y1="0" x2="{x2}" y2="{y2}">{s}</linearGradient>'


def rad(i, *stops, cx=.5, cy=.5, r=.6):
    s = ''.join(f'<stop offset="{o}" stop-color="{c}"/>' for o, c in stops)
    return f'<radialGradient id="{i}" cx="{cx}" cy="{cy}" r="{r}">{s}</radialGradient>'


GRAIN = ('<filter id="grain"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/>'
         '<feColorMatrix values="0 0 0 0 .35  0 0 0 0 .3  0 0 0 0 .25  0 0 0 .07 0"/></filter>')
FINISH = '<rect width="1200" height="900" filter="url(#grain)"/>'

scenes = {}

# 1. Morning coffee on a wooden table
scenes['coffee-morning'] = svg(
    lin('wall', (0, '#F6E7D3'), (1, '#EBCFB2')) + lin('table', (0, '#B9835A'), (1, '#8E5E3C'))
    + rad('sun', (0, '#FFF6DF'), (1, '#FFF6DF00'), cx=.8, cy=.15, r=.5) + rad('crema', (0, '#E9C08E'), (.7, '#B9773F'), (1, '#7A4A26')) + GRAIN,
    '<rect width="1200" height="900" fill="url(#wall)"/><rect width="1200" height="900" fill="url(#sun)"/>'
    '<rect x="760" y="80" width="300" height="360" rx="8" fill="#FFF8EC" opacity=".55"/><path d="M910 80v360M760 260h300" stroke="#E2C8A8" stroke-width="10"/>'
    '<rect y="560" width="1200" height="340" fill="url(#table)"/><path d="M0 610h1200M0 700h1200M0 800h1200" stroke="#7B4F31" stroke-opacity=".25" stroke-width="4"/>'
    '<ellipse cx="520" cy="690" rx="250" ry="58" fill="#5C3A22" opacity=".25"/><ellipse cx="500" cy="660" rx="240" ry="62" fill="#FAF4EA"/><ellipse cx="500" cy="652" rx="190" ry="44" fill="#EFE5D6"/>'
    '<path d="M370 470h260l-22 175c-4 22-24 36-46 36H438c-22 0-42-14-46-36z" fill="#F7F1E7"/><path d="M630 510c70 0 80 90 10 104" fill="none" stroke="#F7F1E7" stroke-width="26"/>'
    '<ellipse cx="500" cy="472" rx="130" ry="30" fill="url(#crema)"/><path d="M470 470c20-12 40-12 60 0c-20 10-40 10-60 0z" fill="#F3DDBF" opacity=".9"/>'
    '<path d="M450 420c-30-40 30-60 0-110M520 410c-30-40 30-60 0-110M580 425c-25-35 25-55 0-95" fill="none" stroke="#FFFFFF" stroke-opacity=".7" stroke-width="10" stroke-linecap="round"/>'
    '<rect x="800" y="600" width="230" height="150" rx="10" fill="#FFFDF7" transform="rotate(-8 915 675)"/><path d="M830 640h160M830 675h130M830 710h150" stroke="#C9B49A" stroke-width="6" transform="rotate(-8 915 675)"/>'
    '<circle cx="230" cy="700" r="38" fill="#F4C26B"/><circle cx="285" cy="725" r="30" fill="#E8A44E"/>' + FINISH)

# 2. Sunrise over soft hills
scenes['sunrise-hills'] = svg(
    lin('sky', (0, '#FBD3B0'), (.55, '#F7E6CF'), (1, '#E8EFE0')) + rad('glow', (0, '#FFF3C9'), (1, '#FFF3C900'), cx=.5, cy=.62, r=.45) + GRAIN,
    '<rect width="1200" height="900" fill="url(#sky)"/><rect width="1200" height="900" fill="url(#glow)"/><circle cx="600" cy="560" r="110" fill="#FFE6A8"/>'
    '<path d="M0 600c160-80 330-90 470-40s300 60 440 0 230-40 290-20v360H0z" fill="#B9CDA9"/>'
    '<path d="M0 690c200-70 380-50 560 0s420 50 640-20v250H0z" fill="#93B184"/>'
    '<path d="M0 780c240-50 480-30 700 10s360 20 500-10v120H0z" fill="#6F9466"/>'
    '<g fill="#FFFFFF" opacity=".75"><ellipse cx="260" cy="220" rx="110" ry="26"/><ellipse cx="330" cy="200" rx="70" ry="24"/><ellipse cx="900" cy="160" rx="120" ry="24"/></g>'
    '<path d="M760 300l14 8 14-8M820 330l10 6 10-6" stroke="#8A6C57" stroke-width="4" fill="none" stroke-linecap="round"/>' + FINISH)

# 3. Rainy window with a warm lamp inside
scenes['rainy-window'] = svg(
    lin('out', (0, '#8FA3B5'), (1, '#C5D2DB')) + lin('wall', (0, '#E9DED0'), (1, '#D8C7B3')) + rad('lamp', (0, '#FFE9B8'), (1, '#FFE9B800'), cx=.82, cy=.35, r=.35) + GRAIN,
    '<rect width="1200" height="900" fill="url(#wall)"/><rect width="1200" height="900" fill="url(#lamp)"/>'
    '<rect x="160" y="110" width="620" height="560" rx="14" fill="url(#out)"/>'
    '<g fill="#6E8396" opacity=".55"><rect x="200" y="420" width="90" height="250"/><rect x="310" y="360" width="120" height="310"/><rect x="460" y="460" width="80" height="210"/><rect x="580" y="390" width="150" height="280"/></g>'
    '<g stroke="#FFFFFF" stroke-opacity=".7" stroke-width="5" stroke-linecap="round">'
    + ''.join(f'<path d="M{x} {y}l-6 34"/>' for x, y in [(230, 160), (300, 250), (380, 180), (460, 300), (530, 200), (610, 280), (690, 170), (250, 340), (420, 400), (560, 360), (700, 420), (330, 480), (640, 520)])
    + '</g><path d="M160 390h620M470 110v560" stroke="#F4ECE2" stroke-width="18"/><rect x="160" y="110" width="620" height="560" rx="14" fill="none" stroke="#F4ECE2" stroke-width="22"/>'
    '<rect x="120" y="670" width="700" height="40" rx="8" fill="#C9B194"/>'
    '<path d="M960 220l-60 120h120z" fill="#F1D9A8"/><rect x="955" y="340" width="10" height="260" fill="#8A6C57"/><ellipse cx="960" cy="610" rx="70" ry="14" fill="#8A6C57"/>'
    '<rect x="300" y="610" width="90" height="70" rx="10" fill="#FBF5EC"/><path d="M390 625c34 0 34 40 0 40" fill="none" stroke="#FBF5EC" stroke-width="12"/>'
    '<path d="M500 650c0-40 30-70 70-70s70 30 70 70z" fill="#A8C3A0"/><rect x="540" y="640" width="60" height="40" rx="6" fill="#D98E6B"/>' + FINISH)

# 4. Tulips in a vase
scenes['tulip-vase'] = svg(
    lin('bg', (0, '#FBEDEA'), (1, '#F3DCD6')) + lin('vase', (0, '#BFD3E0'), (1, '#94B1C4'), x2=1, y2=0) + GRAIN,
    '<rect width="1200" height="900" fill="url(#bg)"/><rect y="640" width="1200" height="260" fill="#EAD2C7"/><ellipse cx="600" cy="790" rx="190" ry="26" fill="#C9A99C" opacity=".5"/>'
    '<g stroke="#6F9466" stroke-width="12" fill="none" stroke-linecap="round"><path d="M600 560c-10-140-90-220-160-280"/><path d="M600 560c0-150 20-250 40-330"/><path d="M600 560c20-120 100-200 170-250"/><path d="M600 560c-30-100-120-120-200-150"/></g>'
    '<g fill="#8DB07D"><path d="M560 480c-80-40-110-120-90-160 50 30 90 90 90 160z"/><path d="M640 470c70-50 120-60 150-40-40 50-100 60-150 40z"/></g>'
    + ''.join(f'<g transform="translate({x} {y}) rotate({r})"><path d="M-44 0c0-50 20-80 44-90 24 10 44 40 44 90 0 30-20 46-44 46S-44 30-44 0z" fill="{c}"/><path d="M0-90c-10 40-10 80 0 136M-44 0c20-10 30-30 26-60M44 0c-20-10-30-30-26-60" stroke="#FFFFFF" stroke-opacity=".35" stroke-width="5" fill="none"/></g>'
              for x, y, r, c in [(440, 270, -18, '#E89AA3'), (640, 220, 4, '#F1B4A6'), (770, 300, 20, '#E37F8E'), (400, 420, -30, '#F4C7B8')])
    + '<path d="M500 560h200l-20 220c-2 20-18 34-38 34h-84c-20 0-36-14-38-34z" fill="url(#vase)"/><path d="M520 600h160" stroke="#FFFFFF" stroke-opacity=".5" stroke-width="8"/>' + FINISH)

# 5. Beach and waves
scenes['beach-waves'] = svg(
    lin('sky', (0, '#CFE6F2'), (1, '#F4EEDF')) + lin('sea', (0, '#7FB8C9'), (1, '#A9D3D6')) + GRAIN,
    '<rect width="1200" height="900" fill="url(#sky)"/><circle cx="930" cy="190" r="70" fill="#FFF1C2"/>'
    '<rect y="430" width="1200" height="230" fill="url(#sea)"/><path d="M0 430h1200" stroke="#6AA4B6" stroke-width="6"/>'
    '<path d="M0 640c120-30 240-30 360 0s240 30 360 0 240-30 360 0 120 15 120 15v245H0z" fill="#F1DFC0"/>'
    '<path d="M0 640c120-30 240-30 360 0s240 30 360 0 240-30 360 0" fill="none" stroke="#FFFFFF" stroke-width="14" stroke-linecap="round"/>'
    '<path d="M80 540c60-14 120-14 180 0M420 500c60-14 120-14 180 0M800 560c60-14 120-14 180 0" stroke="#FFFFFF" stroke-opacity=".6" stroke-width="6" fill="none" stroke-linecap="round"/>'
    '<g transform="translate(300 760)"><path d="M0 0l140-150 10 10L20 10z" fill="#8A6C57"/><path d="M60-150a150 150 0 0 1 240 60L140-150z" fill="#E78F8E"/><path d="M60-150a150 150 0 0 1 120-30l-40 30z" fill="#FFF3E6"/></g>'
    '<rect x="620" y="720" width="260" height="70" rx="12" fill="#F7C873" transform="rotate(-6 750 755)"/><path d="M640 735h220M640 765h220" stroke="#FFFFFF" stroke-width="10" transform="rotate(-6 750 755)"/>'
    '<path d="M980 760l14-30 14 30 32 4-24 22 6 32-28-16-28 16 6-32-24-22z" fill="#F2A87E"/>' + FINISH)

# 6. City at night with a moon
scenes['city-night'] = svg(
    lin('sky', (0, '#2F3A5E'), (1, '#6A6F9A')) + rad('moon', (0, '#FFF6D8'), (1, '#FFF6D800'), cx=.78, cy=.2, r=.25) + GRAIN,
    '<rect width="1200" height="900" fill="url(#sky)"/><rect width="1200" height="900" fill="url(#moon)"/><circle cx="935" cy="180" r="62" fill="#FFF3CF"/>'
    + ''.join(f'<circle cx="{x}" cy="{y}" r="{r}" fill="#FFFFFF" opacity=".8"/>' for x, y, r in [(120, 90, 3), (300, 160, 2), (480, 70, 3), (640, 140, 2), (760, 60, 3), (1100, 120, 2), (220, 260, 2), (560, 230, 2)])
    + ''.join(f'<rect x="{x}" y="{y}" width="{w}" height="{900 - y}" fill="{c}"/>' for x, y, w, c in [(0, 470, 170, '#394468'), (150, 380, 140, '#2B3557'), (280, 520, 120, '#3F4B73'), (390, 330, 170, '#27304F'), (540, 450, 130, '#36416A'), (660, 390, 160, '#2B3557'), (810, 500, 150, '#394468'), (950, 420, 120, '#27304F'), (1060, 520, 140, '#36416A')])
    + ''.join(f'<rect x="{x}" y="{y}" width="20" height="26" fill="#F9D98C" opacity="{o}"/>' for x, y, o in [(30, 520, .9), (90, 580, .7), (180, 430, .9), (230, 500, .6), (420, 380, .9), (470, 450, .8), (420, 520, .7), (700, 440, .9), (760, 520, .8), (980, 470, .9), (1020, 560, .6), (580, 500, .8), (860, 560, .9), (320, 580, .8), (1100, 580, .7)])
    + '<path d="M0 820h1200v80H0z" fill="#1E2540"/><path d="M0 820h1200" stroke="#F9D98C" stroke-opacity=".5" stroke-width="4" stroke-dasharray="40 30"/>' + FINISH)

# 7. Picnic blanket with fruit
scenes['picnic'] = svg(
    lin('grass', (0, '#CFE3B4'), (1, '#A9CB8E')) + '<pattern id="check" width="80" height="80" patternUnits="userSpaceOnUse"><rect width="80" height="80" fill="#FFF7F2"/><rect width="40" height="40" fill="#F3B5B0"/><rect x="40" y="40" width="40" height="40" fill="#F3B5B0"/></pattern>' + GRAIN,
    '<rect width="1200" height="900" fill="url(#grass)"/>'
    '<path d="M120 200l900 -60 80 640-920 60z" fill="url(#check)" opacity=".95"/>'
    '<g transform="translate(330 330)"><ellipse cx="0" cy="40" rx="150" ry="30" fill="#7E9A63" opacity=".4"/><path d="M-140 0h280l-30 90h-220z" fill="#D9A56B"/><path d="M-140 0h280" stroke="#B9824B" stroke-width="12"/><path d="M-100 0c0-100 200-100 200 0" fill="none" stroke="#B9824B" stroke-width="12"/></g>'
    + ''.join(f'<circle cx="{x}" cy="{y}" r="{r}" fill="{c}"/>' for x, y, r, c in [(650, 330, 46, '#E5534B'), (720, 360, 40, '#F08A3C'), (690, 420, 36, '#E5534B'), (580, 420, 30, '#9CC46F')])
    + '<g transform="translate(820 520) rotate(-12)"><path d="M0 0h170l-85 150z" fill="#F7D774"/><path d="M0 0h170" stroke="#F3B44B" stroke-width="14" stroke-linecap="round"/><circle cx="60" cy="40" r="8" fill="#F3B44B"/><circle cx="100" cy="70" r="8" fill="#F3B44B"/></g>'
    '<rect x="420" y="560" width="70" height="140" rx="20" fill="#BFE0EC" opacity=".9"/><rect x="430" y="540" width="50" height="30" rx="6" fill="#F7F1E7"/>'
    '<g fill="#FFFFFF"><circle cx="1060" cy="100" r="12"/><circle cx="1080" cy="90" r="12"/><circle cx="1070" cy="112" r="12"/><circle cx="1090" cy="108" r="12"/></g><circle cx="1076" cy="102" r="7" fill="#F4C84A"/>' + FINISH)

# 8. Open book and tea
scenes['book-tea'] = svg(
    lin('desk', (0, '#E7D7C3'), (1, '#D3BC9F')) + rad('light', (0, '#FFF8E7'), (1, '#FFF8E700'), cx=.3, cy=.2, r=.6) + GRAIN,
    '<rect width="1200" height="900" fill="url(#desk)"/><rect width="1200" height="900" fill="url(#light)"/>'
    '<g transform="rotate(-6 560 480)"><path d="M200 300c140-30 260-20 360 30v380c-100-50-220-60-360-30z" fill="#FFFCF5"/><path d="M920 300c-140-30-260-20-360 30v380c100-50 220-60 360-30z" fill="#FBF6EC"/>'
    '<path d="M560 330v380" stroke="#D9C6A8" stroke-width="6"/>'
    + ''.join(f'<path d="M250 {y}c90-14 180-10 260 14" stroke="#CDBBA0" stroke-width="5" fill="none"/>' for y in range(380, 650, 40))
    + ''.join(f'<path d="M610 {y + 14}c80-24 170-28 260-14" stroke="#CDBBA0" stroke-width="5" fill="none"/>' for y in range(380, 650, 40))
    + '<path d="M820 300v120l20-16 20 16V296" fill="#E78F8E"/></g>'
    '<ellipse cx="980" cy="760" rx="120" ry="30" fill="#A98B6B" opacity=".35"/><path d="M890 640h170l-12 100c-3 20-20 30-40 30h-66c-20 0-37-10-40-30z" fill="#F7F1E7"/>'
    '<path d="M1060 660c50 0 50 70 0 70" fill="none" stroke="#F7F1E7" stroke-width="18"/><ellipse cx="975" cy="642" rx="84" ry="16" fill="#C98E4E"/>'
    '<path d="M950 600c-20-30 20-40 0-80M1000 600c-20-30 20-40 0-80" stroke="#FFFFFF" stroke-opacity=".7" stroke-width="8" fill="none" stroke-linecap="round"/>'
    '<path d="M120 740c40-60 110-70 150-20" stroke="#8DB07D" stroke-width="14" fill="none" stroke-linecap="round"/><ellipse cx="170" cy="700" rx="40" ry="18" fill="#9DC08C" transform="rotate(-30 170 700)"/>' + FINISH)

# 9. Cat on a sunny windowsill
scenes['cat-window'] = svg(
    lin('sky', (0, '#CFE4F0'), (1, '#EAF2F1')) + lin('wall', (0, '#F4E4D2'), (1, '#E9D2BA')) + GRAIN,
    '<rect width="1200" height="900" fill="url(#wall)"/><rect x="240" y="90" width="720" height="520" rx="16" fill="url(#sky)"/>'
    '<path d="M240 470c120-40 240-40 360 0s240 40 360 0v140H240z" fill="#B7D2A6"/><circle cx="820" cy="210" r="56" fill="#FFF0B8"/>'
    '<path d="M600 90v520M240 350h720" stroke="#FBF5EC" stroke-width="18"/><rect x="240" y="90" width="720" height="520" rx="16" fill="none" stroke="#FBF5EC" stroke-width="24"/>'
    '<rect x="180" y="600" width="840" height="50" rx="10" fill="#D8BE9F"/>'
    '<g fill="#5B4E46"><ellipse cx="520" cy="560" rx="130" ry="70"/><circle cx="420" cy="500" r="62"/><path d="M372 462l8-60 40 40zM440 446l30-50 14 58z"/><path d="M640 590c90 0 110-60 80-110" stroke="#5B4E46" stroke-width="26" fill="none" stroke-linecap="round"/></g>'
    '<g fill="#F6E7B6"><ellipse cx="400" cy="500" rx="10" ry="6"/><ellipse cx="444" cy="500" rx="10" ry="6"/></g>'
    '<path d="M760 600c0-60 40-100 90-100s90 40 90 100z" fill="#8DB07D"/><rect x="800" y="580" width="100" height="70" rx="10" fill="#E3A37D"/>' + FINISH)

# 10. Mountain lake with a little boat
scenes['mountain-lake'] = svg(
    lin('sky', (0, '#DCEBF4'), (1, '#F6EFE2')) + lin('lake', (0, '#86B7C2'), (1, '#5F99A8')) + GRAIN,
    '<rect width="1200" height="900" fill="url(#sky)"/>'
    '<path d="M0 520l220-260 160 170 200-280 220 260 160-140 240 250z" fill="#A9B7C8"/><path d="M380 430l200-280 70 82-40 40 40 30-60 20z" fill="#FFFFFF" opacity=".8"/>'
    '<path d="M0 560l180-140 180 120 220-180 240 200 200-130 180 130v120H0z" fill="#7F9C86"/>'
    '<rect y="590" width="1200" height="310" fill="url(#lake)"/><path d="M80 660h180M520 700h240M900 650h180M300 780h200M760 820h220" stroke="#FFFFFF" stroke-opacity=".45" stroke-width="6" stroke-linecap="round"/>'
    '<g transform="translate(600 720)"><path d="M-130 0h260l-40 50h-180z" fill="#C98E5C"/><path d="M-120 0h240" stroke="#A86F42" stroke-width="10"/><path d="M0 0v-130l70 110z" fill="#FFF6E8"/><path d="M0 0v-130" stroke="#8A6C57" stroke-width="6"/></g>'
    + ''.join(f'<path d="M{x} 600l-24 0 24-70 24 70z" fill="#5C7E6A"/>' for x in (60, 110, 1040, 1100, 1150)) + FINISH)

# 11. Autumn tree and falling leaves
scenes['autumn-leaves'] = svg(
    lin('sky', (0, '#FBE6C8'), (1, '#F7D3AE')) + GRAIN,
    '<rect width="1200" height="900" fill="url(#sky)"/><path d="M0 720c200-40 400-40 600 0s400 40 600 0v180H0z" fill="#D9A06B"/>'
    '<path d="M580 720c10-150-20-260-80-330M600 720c0-180 40-280 120-340M590 560c-60-40-120-50-170-40" stroke="#7A5136" stroke-width="34" fill="none" stroke-linecap="round"/>'
    + ''.join(f'<circle cx="{x}" cy="{y}" r="{r}" fill="{c}"/>' for x, y, r, c in [(500, 330, 130, '#E48A44'), (690, 300, 150, '#D9663A'), (610, 220, 120, '#F0A653'), (400, 420, 100, '#E99B4E'), (790, 420, 110, '#E27A3E')])
    + ''.join(f'<g transform="translate({x} {y}) rotate({r})"><path d="M0-22c18 8 22 30 0 44-22-14-18-36 0-44z" fill="{c}"/></g>' for x, y, r, c in [(200, 300, 20, '#E27A3E'), (260, 560, -40, '#F0A653'), (950, 260, 60, '#D9663A'), (1020, 520, 10, '#E48A44'), (860, 640, -20, '#F0A653'), (330, 680, 70, '#D9663A'), (120, 700, -10, '#E48A44')])
    + '<rect x="830" y="660" width="200" height="16" rx="6" fill="#8A6C57"/><path d="M850 676v60M1010 676v60" stroke="#8A6C57" stroke-width="12"/>' + FINISH)

# 12. Birthday cake with candles
scenes['birthday-cake'] = svg(
    lin('bg', (0, '#F7E3EC'), (1, '#EFD1DE')) + rad('glow', (0, '#FFF2C9'), (1, '#FFF2C900'), cx=.5, cy=.3, r=.35) + GRAIN,
    '<rect width="1200" height="900" fill="url(#bg)"/><rect width="1200" height="900" fill="url(#glow)"/>'
    + ''.join(f'<path d="M{x} 0v{l}" stroke="#E7B9CB" stroke-width="3"/><path d="M{x - 26} {l}h52l-26 40z" fill="{c}"/>' for x, l, c in [(160, 120, '#F7D774'), (300, 80, '#A9D3D6'), (900, 100, '#F3B5B0'), (1040, 140, '#C9DDAF')])
    + '<ellipse cx="600" cy="760" rx="300" ry="50" fill="#D7AFC1"/><ellipse cx="600" cy="740" rx="280" ry="44" fill="#FFFFFF"/>'
    '<path d="M370 520h460v200c0 26-100 46-230 46s-230-20-230-46z" fill="#F6C9D3"/><ellipse cx="600" cy="520" rx="230" ry="46" fill="#FFF6F0"/>'
    '<path d="M370 520c20 40 40 40 60 0s40 40 60 0 40 40 60 0 40 40 60 0 40 40 60 0 40 40 60 0 40 40 60 0" fill="none" stroke="#FFF6F0" stroke-width="22" stroke-linecap="round"/>'
    '<path d="M370 640h460" stroke="#EFA9B9" stroke-width="16"/>'
    + ''.join(f'<rect x="{x - 9}" y="410" width="18" height="100" rx="6" fill="{c}"/><path d="M{x} 410c-16-20 0-40 0-52 0 12 16 32 0 52z" fill="#F6B23E"/>' for x, c in [(520, '#A9D3D6'), (600, '#F7D774'), (680, '#C9DDAF')])
    + ''.join(f'<circle cx="{x}" cy="{y}" r="7" fill="{c}"/>' for x, y, c in [(450, 600, '#F7D774'), (520, 660, '#A9D3D6'), (640, 610, '#C9DDAF'), (740, 650, '#F7D774'), (560, 700, '#E78F8E')]) + FINISH)

NAMES = {
    'coffee-morning': ('早晨的咖啡', 'Morning coffee', 'daily'),
    'sunrise-hills': ('山坡日出', 'Sunrise hills', 'nature'),
    'rainy-window': ('雨天窗边', 'Rainy window', 'daily'),
    'tulip-vase': ('一瓶郁金香', 'Tulips in a vase', 'daily'),
    'beach-waves': ('海边的风', 'By the sea', 'travel'),
    'city-night': ('城市夜晚', 'City night', 'travel'),
    'picnic': ('草地野餐', 'Picnic', 'daily'),
    'book-tea': ('书和一杯茶', 'Book and tea', 'daily'),
    'cat-window': ('窗台上的猫', 'Cat by the window', 'pets'),
    'mountain-lake': ('山与湖', 'Mountain lake', 'travel'),
    'autumn-leaves': ('秋天的树', 'Autumn leaves', 'nature'),
    'birthday-cake': ('生日蛋糕', 'Birthday cake', 'celebration'),
}

if __name__ == '__main__':
    OUT.mkdir(parents=True, exist_ok=True)
    for key, data in scenes.items():
        (OUT / f'LD-scene-{key}.svg').write_text(data, encoding='utf-8')
    (OUT / 'LittleDays-Original-Scenes.txt').write_text(
        'Little Days scene illustrations (LD-scene-*.svg)\n\n'
        'Original artwork drawn for the Little Days project (generated by tools/make_scenes.py).\n'
        'No third-party images, photos, logos or characters are used.\n'
        'Users may place them in their own journals and exports.\n', encoding='utf-8')
    print(f'{len(scenes)} scenes → {OUT}')
