"""Download the Little Days photo library: real photos for a page's picture,
grouped by mood and moment (coffee, good food, the sea, a quiet day ...).

Every photo comes from Unsplash under the Unsplash License
(https://unsplash.com/license) and is saved as a local JPEG, so the app never
requests a third-party host at run time. Each file's source URL is written to
Resources/Photos/Unsplash-Photos.txt and to library.json ("photos").

    python3 tools/fetch_photos.py            # download missing files + update library.json
    python3 tools/fetch_photos.py --catalog  # only rewrite library.json / the source list
    python3 tools/fetch_photos.py --refresh  # download every photo again

Gradients, patterns and other artwork are page backgrounds (library.json
"scenes"), not photos.
"""
import json
import sys
import urllib.request
from pathlib import Path

RES = Path(__file__).resolve().parents[1] / 'Packages/LittleDaysCore/Sources/LittleDaysCore/Resources'
OUT = RES / 'Photos'
LICENSE = 'Unsplash-Photos.txt'
# The photo's own shape (landscape stays landscape), the long side at most 1000px.
SIZE = 'w=1000&h=1000&fit=max&q=74&fm=jpg'

# collection id: (zh, en, description zh, description en)
COLLECTIONS = {
    'coffee': ('咖啡时光', 'Coffee time', '一杯咖啡，一点慢下来的时间。', 'A cup of coffee and a slower moment.'),
    'food': ('好好吃饭', 'Good food', '认真吃的每一顿饭。', 'Every meal worth remembering.'),
    'sweet': ('甜甜的', 'Something sweet', '今天值得一点甜。', 'Today deserves something sweet.'),
    'flowers': ('花与绿植', 'Flowers & plants', '一束花、一盆绿，心情就亮了。', 'A bunch of flowers, a little green.'),
    'pets': ('毛孩子', 'Furry friends', '家里最可爱的那一位。', 'The cutest one at home.'),
    'sea': ('海边晴天', 'Sea & sun', '海风、阳光和浪花。', 'Sea breeze, sunshine and waves.'),
    'views': ('山野日落', 'Hills & sunsets', '走远一点，看看天空。', 'Go a little further and look up.'),
    'night': ('夜晚星空', 'Night & stars', '星星、灯光和安静的夜。', 'Stars, lights and a quiet night.'),
    'quiet': ('安静的一天', 'A quiet day', '读书、写字、听雨。', 'Reading, writing, listening to the rain.'),
    'travel': ('出发旅行', 'Off we go', '在路上的日子。', 'Days on the road.'),
    'celebrate': ('值得庆祝', 'Celebrate', '生日、派对和闪闪发光的夜晚。', 'Birthdays, parties and bright nights.'),
    'move': ('动一动', 'Move a little', '跑步、瑜伽、出一身汗。', 'Run, stretch, break a sweat.'),
    'seasons': ('四季', 'Seasons', '春花、夏树、冬雪。', 'Spring blossom, summer trees, winter snow.'),
}

# id: (collection, Unsplash photo id, zh, en)
PHOTOS = {
    'coffee-cheers': ('coffee', '1495474472287-4d71bcdd2085', '一起喝咖啡', 'Coffee together'),
    'latte-art': ('coffee', '1509042239860-f550ce710b93', '拉花拿铁', 'Latte art'),
    'latte-beans': ('coffee', '1511920170033-f8396924c348', '咖啡豆与拿铁', 'Latte and beans'),
    'corner-cafe': ('coffee', '1501339847302-ac426a4a7cbb', '街角咖啡馆', 'Corner café'),
    'workday-coffee': ('coffee', '1499750310107-5fef28a66643', '工作日的咖啡', 'Workday coffee'),
    'desk-corner': ('coffee', '1497032628192-86f99bcd76bc', '桌面一角', 'Desk corner'),
    'brunch': ('food', '1504754524776-8f4f37790ca0', '周末早午餐', 'Weekend brunch'),
    'good-bowl': ('food', '1490645935967-10de6ba17061', '一碗元气', 'A bowl of goodness'),
    'fresh-salad': ('food', '1512621776951-a57141f2eefd', '清爽沙拉', 'Fresh salad'),
    'home-dinner': ('food', '1504674900247-0877df9cc836', '家常好菜', 'Home cooking'),
    'pizza': ('food', '1565299624946-b28f40a0ae38', '分享披萨', 'Pizza to share'),
    'dinner-out': ('food', '1414235077428-338989a2e8c0', '晚餐约会', 'Dinner out'),
    'strawberry-cups': ('sweet', '1488477181946-6428a0291777', '草莓杯', 'Strawberry cups'),
    'donuts': ('sweet', '1551024601-bec78aea704b', '甜甜圈', 'Donuts'),
    'ice-cream': ('sweet', '1497034825429-c343d7c6a68f', '冰淇淋', 'Ice cream'),
    'sundae': ('sweet', '1563805042-7684c019e1cb', '巧克力圣代', 'Chocolate sundae'),
    'cookies': ('sweet', '1499636136210-6f4ee915583e', '刚出炉的饼干', 'Fresh cookies'),
    'party-cake': ('sweet', '1464349095431-e9a21285b5f3', '彩虹蛋糕', 'Party cake'),
    'spring-blooms': ('flowers', '1490750967868-88aa4486c946', '春天小黄花', 'Spring blooms'),
    'bouquet': ('flowers', '1487530811176-3780de880c2d', '一束花', 'A bouquet'),
    'sunflowers': ('flowers', '1455659817273-f96807779a8a', '向日葵', 'Sunflowers'),
    'cherry-blossom': ('flowers', '1522383225653-ed111181a951', '樱花', 'Cherry blossom'),
    'little-cactus': ('flowers', '1459411552884-841db9b3cc2a', '小仙人掌', 'Little cactus'),
    'succulent': ('flowers', '1485955900006-10f4d324d411', '多肉', 'Succulent'),
    'lazy-cat': ('pets', '1518791841217-8f162f1e1131', '慵懒小猫', 'Lazy cat'),
    'happy-dog': ('pets', '1543466835-00a7907e9de1', '开心狗狗', 'Happy dog'),
    'stair-cat': ('pets', '1495360010541-f48722b34f7d', '楼梯上的猫', 'Cat on the stairs'),
    'running-pups': ('pets', '1548199973-03cce0bbc87b', '一起奔跑', 'Running together'),
    'ginger-cat': ('pets', '1573865526739-10659fec78a5', '橘猫', 'Ginger cat'),
    'beach-dog': ('pets', '1587300003388-59208cc962cb', '海边狗狗', 'Beach dog'),
    'beach-sunset': ('sea', '1507525428034-b723cf961d3e', '海边日落', 'Beach sunset'),
    'waves': ('sea', '1505142468610-359e7d316be0', '浪花', 'Waves'),
    'beach-day': ('sea', '1473496169904-658ba7c44d8a', '沙滩墨镜', 'Beach day'),
    'holiday-pool': ('sea', '1520250497591-112f2f40a3f4', '度假泳池', 'Holiday pool'),
    'lake-boat': ('sea', '1501785888041-af3ef285b470', '湖上小船', 'Boat on the lake'),
    'purple-dusk': ('sea', '1475924156734-496f6cac6ec1', '紫色黄昏', 'Purple dusk'),
    'valley-morning': ('views', '1506744038136-46273834b3fb', '山谷清晨', 'Valley morning'),
    'golden-field': ('views', '1500382017468-9049fed747ef', '金色麦田', 'Golden field'),
    'cloud-sea': ('views', '1506905925346-21bda4d32df4', '云海', 'Sea of clouds'),
    'pink-ridges': ('views', '1500964757637-c85e8a162699', '粉色山脊', 'Pink ridges'),
    'green-hills': ('views', '1501854140801-50d01698950b', '绿色山丘', 'Green hills'),
    'mirror-lake': ('views', '1493246507139-91e8fad9978e', '镜面湖', 'Mirror lake'),
    'milky-way': ('night', '1519681393784-d120267933ba', '银河山顶', 'Milky Way peak'),
    'stargazing': ('night', '1444703686981-a3abbc4d4fe3', '看星星', 'Stargazing'),
    'starry-lake': ('night', '1534447677768-be436bb09401', '湖上星夜', 'Starry lake'),
    'violet-lake': ('night', '1494500764479-0c8f2919a3d8', '紫色湖面', 'Violet lake'),
    'city-lights': ('night', '1519501025264-65ba15a82390', '城市夜色', 'City lights'),
    'golden-city': ('night', '1480714378408-67cf0d13bc1b', '城市黄昏', 'City at dusk'),
    'bookshelf': ('quiet', '1507842217343-583bb7270b66', '书架', 'Bookshelf'),
    'open-book': ('quiet', '1456513080510-7bf3a84b82f8', '摊开的书', 'An open book'),
    'writing': ('quiet', '1434030216411-0b793f4b4173', '写点什么', 'Writing something'),
    'todo-list': ('quiet', '1484480974693-6ca0a78fb36b', '今日清单', "Today's list"),
    'rain-window': ('quiet', '1515694346937-94d85e41e6f0', '窗上的雨', 'Rain on the window'),
    'rainy-day': ('quiet', '1428592953211-077101b2021b', '雨天', 'Rainy day'),
    'above-clouds': ('travel', '1436491865332-7a61a109cc05', '云上', 'Above the clouds'),
    'trip-plans': ('travel', '1488646953014-85cb44e25828', '旅行计划', 'Trip plans'),
    'open-road': ('travel', '1500530855697-b586d89ba3ee', '公路', 'Open road'),
    'tent-view': ('travel', '1504280390367-361c6d9f38f4', '帐篷里的风景', 'Tent view'),
    'camper-night': ('travel', '1523987355523-c7b5b0dd90a7', '露营车', 'Camper night'),
    'hot-air-balloons': ('travel', '1530789253388-582c481c54b0', '热气球', 'Hot-air balloons'),
    'confetti': ('celebrate', '1513151233558-d860c5398176', '彩纸', 'Confetti'),
    'balloons': ('celebrate', '1530103862676-de8c9debad1d', '气球', 'Balloons'),
    'happy-birthday': ('celebrate', '1558636508-e0db3814bd1d', '生日快乐', 'Happy birthday'),
    'concert': ('celebrate', '1459749411175-04bf5292ceea', '演唱会', 'Concert night'),
    'movie-night': ('celebrate', '1489599849927-2ee91cede3ba', '电影之夜', 'Movie night'),
    'music-party': ('celebrate', '1470225620780-dba8ba36b745', '音乐派对', 'Music party'),
    'morning-yoga': ('move', '1506126613408-eca07ce68773', '晨间瑜伽', 'Morning yoga'),
    'running': ('move', '1476480862126-209bfaa8edc8', '跑步', 'Running'),
    'strength': ('move', '1517836357463-d25dfeac3438', '力量训练', 'Strength'),
    'forest-walk': ('move', '1441974231531-c6227db76b6e', '林间散步', 'Forest walk'),
    'sunset-stretch': ('move', '1544367567-0f2fcb009e0b', '日落瑜伽', 'Sunset stretch'),
    'evening-run': ('move', '1552674605-db6ffd4facb5', '夜跑', 'Evening run'),
    'summer-tree': ('seasons', '1502082553048-f009c37129b9', '夏天的大树', 'Summer tree'),
    'misty-hills': ('seasons', '1470071459604-3b5ec3a7fe05', '雾中山野', 'Misty hills'),
    'snowy-forest': ('seasons', '1491002052546-bf38f186af56', '雪中森林', 'Snowy forest'),
    'frost': ('seasons', '1478265409131-1f65c88f965c', '窗上的霜', 'Frost'),
    'winter-wreath': ('seasons', '1512389142860-9c449e58a543', '冬日花环', 'Winter wreath'),
    'snowy-sunset': ('seasons', '1483664852095-d6cc6870702d', '雪地夕阳', 'Snowy sunset'),
}


# Photos that also work as a whole-page background ("照片氛围"): open skies,
# water and soft scenery with room for a frosted text card.
BACKDROPS = ['beach-sunset', 'waves', 'cloud-sea', 'pink-ridges', 'purple-dusk', 'cherry-blossom',
             'misty-hills', 'golden-field', 'snowy-forest', 'starry-lake']


def tone(path):
    """'dark' when the lower part of the photo (where the words sit) is dark."""
    from PIL import Image
    image = Image.open(path).convert('L')
    w, h = image.size
    lower = image.crop((0, int(h * 0.55), w, h)).resize((40, 20))
    mean = sum(lower.tobytes()) / (40 * 20)
    return 'dark' if mean < 120 else 'light'


def size(path):
    from PIL import Image
    with Image.open(path) as image:
        return image.size


def source(unsplash_id):
    return f'https://images.unsplash.com/photo-{unsplash_id}'


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    if '--catalog' not in sys.argv:
        for key, (_, uid, _, _) in PHOTOS.items():
            target = OUT / f'LD-photo-{key}.jpg'
            if target.exists() and '--refresh' not in sys.argv:
                continue
            with urllib.request.urlopen(f'{source(uid)}?{SIZE}', timeout=60) as response:
                target.write_bytes(response.read())
            print('saved', target.name)
    lines = ['Little Days photo library (LD-photo-*.jpg)', '',
             'Photos from Unsplash, used under the Unsplash License: https://unsplash.com/license',
             'Downloaded once by tools/fetch_photos.py and bundled with the app (JPEG, original shape,',
             'long side 1000px);',
             'the app never loads them from Unsplash at run time. Source of each file:', '']
    lines += [f'LD-photo-{key}.jpg  {source(uid)}' for key, (_, uid, _, _) in PHOTOS.items()]
    (OUT / LICENSE).write_text('\n'.join(lines) + '\n', encoding='utf-8')
    library = RES / 'library.json'
    catalog = json.loads(library.read_text(encoding='utf-8'))
    catalog['photos'] = [{'id': key, 'collection': c, 'nameZh': zh, 'nameEn': en, 'file': f'LD-photo-{key}.jpg',
                          **dict(zip(('w', 'h'), size(OUT / f'LD-photo-{key}.jpg'))),
                          'source': source(uid), 'license': LICENSE,
                          **({'backdrop': True, 'tone': tone(OUT / f'LD-photo-{key}.jpg')} if key in BACKDROPS else {})}
                         for key, (c, uid, zh, en) in PHOTOS.items()]
    catalog['photoCollections'] = [{'id': k, 'nameZh': v[0], 'nameEn': v[1], 'descZh': v[2], 'descEn': v[3]} for k, v in COLLECTIONS.items()]
    library.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'{len(PHOTOS)} photos in {len(COLLECTIONS)} collections → {OUT}')


if __name__ == '__main__':
    main()
