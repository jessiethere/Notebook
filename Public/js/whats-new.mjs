// What's new: the update notes shown inside the app (a card on Home after an
// update, and the full list in Settings). Newest first. Add one entry for
// every published update (see AGENTS.md); these are interface texts in both
// languages, not user content.
export const UPDATES = [
  {
    version: "6.4",
    date: "2026-11-09",
    zh: {
      title: "今天的故事更好看：一整套配色，装饰只放在空白处",
      items: [
        "一天的封面和每一页用同一套「配色」（纸张、字体、颜色和几枚贴纸），默认跟这本书的颜色走；预览里点「配色」可以一次换掉整天：奶油、樱花、鼠尾草、牛皮纸。",
        "只有一张照片的页会直接用大图；几张照片按配色的风格排。",
        "每页最多放 2 枚贴纸，只放在空白的角落，不会压住照片、文字或那一句话。",
        "很长的一句话会自动变小、最多两行，不再被截断；导出的图片和 PDF 也一样。",
      ],
    },
    en: {
      title: "Prettier stories: one style for the day, decorations only where it's empty",
      items: [
        "The cover and every page of a day share one style (paper, fonts, colours and a few stickers), matching the book by default; tap a style in the preview to change the whole day: Cream, Blush, Sage or Kraft.",
        "A page with one photo opens with it big; a few photos follow the style's mood.",
        "At most 2 stickers per page, only in empty corners — never over a photo, words or the caption.",
        "A long line gets smaller and may use two lines instead of being cut off, in exported pictures and PDFs too.",
      ],
    },
  },
  {
    version: "6.3",
    date: "2026-11-09",
    zh: {
      title: "今天的故事：选照片，自动排成一天",
      items: [
        "首页最上面问「今天有什么值得记录？」，点「选今天的照片」就开始，不用先选手帐本、模板或字体。",
        "照片会按拍摄时间自动分成几个 Moment（比如早上健身、下午咖啡、晚上做饭）；点一张照片可以挪到前一个 / 后一个 Moment，或从这张分开。",
        "每个 Moment 可以写一句（都能跳过），然后自动排成「封面时间线 + 每个 Moment 一页」，每页都能「换一种」，也能「自己调整」再回来。",
        "保存后直接打开这本书、翻到今天这几页；日历里也能看到。照片都在一个时间段的，还是和以前一样直接得到一页。",
      ],
    },
    en: {
      title: "Today's story: pick photos, get your day laid out",
      items: [
        "Home now asks “What's worth keeping today?” — tap “Pick today's photos” to start; no book, template or font to choose first.",
        "Photos are grouped into Moments by when they were taken (a morning workout, afternoon coffee, dinner); tap a photo to move it to the Moment before or after, or split there.",
        "Write a line for each Moment (or skip), and get a timeline cover plus one page per Moment; shuffle any page, or adjust it yourself and come back.",
        "Saving opens the book at today's pages; the calendar has them too. Photos all from one time of day still make a single page, as before.",
      ],
    },
  },
  {
    version: "6.2",
    date: "2026-11-09",
    zh: {
      title: "更多音乐风格；可以调音量；整本书配一首音乐",
      items: [
        "新增 3 首原创音乐：清晨钢琴（钢琴）、晴天（欢快的尤克里里）、咖啡馆一角（爵士小三重奏 + 咖啡馆背景声）。现在一共 8 首。",
        "选音乐的面板最上面有音量条，这台设备会记住。",
        "打开一本书，在「列表 / 翻页」上方可以「给这本书配音乐」：翻开这本书、看这本书里的某一天时都会轻轻播放；某一页自己选了音乐时，放那一页的。",
        "导出视频时，没有自己音乐的页会带上这本书的音乐，音量跟你调的一样。",
      ],
    },
    en: {
      title: "More music styles, a volume control, and music for a whole book",
      items: [
        "Three new original pieces: Morning piano (piano), Sunny day (cheerful ukulele) and Café corner (a small jazz trio with café sounds) — eight in all.",
        "The music sheet has a volume slider at the top, remembered on this device.",
        "Open a book and choose “Add music to this book” above List / Flip: it plays while the book is open and when you read one of its days; a page with its own music plays that instead.",
        "A page without its own music takes its book's music into its video, at your volume.",
      ],
    },
  },
  {
    version: "6.1",
    date: "2026-11-09",
    zh: {
      title: "看到哪页，就在哪页编辑",
      items: [
        "用「翻页」看书时，每一页下面都有「✎ 编辑这一页」，点一下直接打开这一页，不用先回到那一天再找。",
        "在日历里看某一天时，每一页右上角有「✎ 编辑」，一下就能改（「⋯」里仍然可以改标题或删除）。",
        "改完点「保存」或左上角返回，会回到你刚才看的那一页。",
        "示例页没有编辑按钮（它们只是示范）。",
      ],
    },
    en: {
      title: "Edit a page right where you are reading it",
      items: [
        "Flipping a book page by page, every page has “✎ Edit this page” — no need to go to that day and find it first.",
        "Reading a day in the calendar, every page has “✎ Edit” at its top right (⋯ still has rename and delete).",
        "Save or ‹ takes you back to the page you were reading.",
        "Sample pages have no edit button (they are only examples).",
      ],
    },
  },
  {
    version: "6.0",
    date: "2026-11-09",
    zh: {
      title: "给页面配一首背景音乐",
      items: [
        "新增 5 首 Little Days 原创轻音乐：午后咖啡、窗外下雨、出门散步、晚安、海边。不是从音乐平台抓的歌，可以放心用在页面、视频和书里。",
        "写一页时点「♫ 声音 → 背景音乐」，或者在做好一页后点「♫ 配乐」，可以先试听再选。写的时候不会自动播放。",
        "在日历里看这一天、或用「翻页」看书翻到这一页时，音乐会轻轻循环播放；点「♫ 曲名」可以暂停。离开就停；放录音或视频时音乐会先暂停。",
        "导出这一页的视频时会带上这首音乐（只有音乐的页面导出 15 秒，结尾淡出）。",
      ],
    },
    en: {
      title: "Give a page some background music",
      items: [
        "Five original Little Days pieces: Afternoon coffee, Rain on the window, A little walk, Good night and By the sea. They are not songs taken from a music service, so they are free to use in your pages, videos and books.",
        "While writing, tap “♫ Sound → Background music”, or “♫ Music” after making a page; listen first, then choose. Nothing plays while you write.",
        "Reading the day in the calendar, or flipping the book to that page, plays it softly on a loop; tap “♫ name” to pause. It stops when you leave, and pauses when a voice note or video plays.",
        "The page's video carries the music (a page with only music makes a 15-second video that fades out).",
      ],
    },
  },
  {
    version: "5.9",
    date: "2026-11-09",
    zh: {
      title: "书可以像书一样一页一页翻",
      items: [
        "打开一本书，标题下面可以选「列表」或「翻页」，会记住你的选择。",
        "「翻页」先看封面（书名、日期范围、页数），再按日期一页一页往后看，示例页会标出来。",
        "左右滑动、点 ‹ ›，或按键盘左右键翻页，有翻书的小动画（系统设置“减少动态效果”时不播放）；每页下方「打开这一天」可以回到那天编辑。",
      ],
    },
    en: {
      title: "Read a book page by page, like a real book",
      items: [
        "Open a book and choose “List” or “Flip” under its title; your choice is remembered.",
        "“Flip” starts with the cover (title, dates, page count), then every page in date order; sample pages are marked.",
        "Swipe, tap ‹ ›, or use the arrow keys to turn pages with a little page-turn animation (off with “reduce motion”); “Open this day” under each page takes you back to edit it.",
      ],
    },
  },
  {
    version: "5.8",
    date: "2026-11-09",
    zh: {
      title: "照片不再被裁掉；保存一直够得着；示例不会变成你的封面",
      items: [
        "用自己的照片做整页（照片 + 一句话）时，整张照片都显示，四周用这张照片的模糊效果补满；「换一种」的大图样子也不再裁掉。",
        "往下滑、看不到上方「保存」时，工具栏上方会浮出一个「✓ 保存」。",
        "在有示例的日子里写，会从一张干净的新页开始，保存后示例就被你的页面替换；之前已经被当成自己封面的示例图和示例文字会自动清掉（你自己的页都保留）。",
      ],
    },
    en: {
      title: "No more cropped photos; Save always in reach; samples never become your cover",
      items: [
        "Your own photo as a whole page (photo + a line) is shown whole, with a soft blurred copy filling the edges; the big-photo shuffle look no longer crops either.",
        "Scroll down and a small “✓ Save” floats above the toolbar when the top Save is out of sight.",
        "Writing on a day that has a sample starts a clean page, and saving replaces the sample. A sample cover that was earlier kept as yours is cleared (your own pages stay).",
      ],
    },
  },
  {
    version: "5.7",
    date: "2026-11-09",
    zh: {
      title: "连续记录的小印章；看书时也能改标题、编辑或删除",
      items: [
        "首页显示「连续 N 天 · 本周 M 天」。每天记下第一页回到首页时，会盖下一个「连续 N 天」的小印章，还有纸片飘落；3、7、14、30 天会有特别的话。",
        "宽松规则：每周可以休息一天，连续不会断；示例不算。",
        "在日历里看某一天时：没标题的页点「＋ 加标题」，有标题的双击就能改；每页右上角「⋯」可以编辑这一页或删除。",
      ],
    },
    en: {
      title: "A little streak stamp; rename, edit or delete while reading",
      items: [
        "Home shows “N-day streak · M this week”. After today's first page, back on Home, a “Day N” stamp lands with a little paper confetti; 3, 7, 14 and 30 days get a special line.",
        "Gentle rule: one rest day a week won't break the streak; samples don't count.",
        "Reading a day: tap “＋ Add a title” on an untitled page, or double-click a title to change it; ⋯ on each page edits or deletes it.",
      ],
    },
  },
  {
    version: "5.6",
    date: "2026-11-09",
    zh: {
      title: "页面更清爽：选中更轻、没有重复的选项、打卡标签更好看",
      items: [
        "选中照片或卡片时，只有一圈细线和两个小圆点（右下角拉大、上方旋转），不再有白色方块。",
        "记到哪本书只在纸上方选一次，下面工具栏不再重复；视频、声音用纸下面的按钮加，加了之后工具栏才出现「声音」列表。",
        "插进页面的成长打卡变成一张带小勾和纸胶带的标签，不再是方框；连插几张会错开摆放。",
      ],
    },
    en: {
      title: "Cleaner pages: lighter selection, no repeated choices, nicer check-in labels",
      items: [
        "A selected photo or card shows a thin outline and two small dots (resize at the corner, rotate at the top) — no white square.",
        "The journal is chosen once, above the paper; the dock no longer repeats it. Video and sound are added under the paper; the dock lists them once there are some.",
        "A check-in on the page is now a soft label with a check and a strip of tape; several are placed apart.",
      ],
    },
  },
  {
    version: "5.5",
    date: "2026-11-09",
    zh: {
      title: "书架可以拖动排序，更多示例",
      items: [
        "书架上按住书脊拖到想放的位置（电脑上按住直接拖）；首页的书也按这个顺序。抽出一本书后也能「往前放 / 往后放」。英文书名会横着沿书脊排。",
        "点纸上的标题或文字，下面马上出现字体、字号、颜色；原来的「文字」按钮改名「加文字框」，它是新加一个文字框。",
        "成长：写过的打卡点「已写」先看内容，里面再点「编辑」；每个习惯的图标变成一本小书，点它就打开成长书。",
        "加了 6 天示例（咖啡、做饭、旅行、海边……），标着「示例」，在设置里可以一键移除。",
      ],
    },
    en: {
      title: "Drag to reorder the shelf, more samples",
      items: [
        "Hold a spine and drag it to a new place (with a mouse, just drag); Home follows the same order. A pulled-out book can also move earlier / later. English titles now run along the spine.",
        "Tap a title or words on the page: font, size and colour appear right below. The old “Text” button is now “Text box” — it adds a new box.",
        "Growth: a written check-in opens to read first, with Edit inside; each habit's icon is a little book that opens its growth book.",
        "Six sample days (coffee, cooking, travel, the beach…), marked “Sample”, removable in Settings.",
      ],
    },
  },
  {
    version: "5.4",
    date: "2026-11-09",
    zh: {
      title: "一个人记，家人一起看",
      items: [
        "书里新增「分享给家人看（PDF）」：整本书做成一个 PDF（封面 + 每一页，按日期排好），对方在微信、iMessage 里直接翻看，不用装 App。",
        "书架上推荐两本书：「我们俩」（情侣日常和纪念日）和「宝宝成长」。",
        "分享后会问一句「想让 TA 也能加照片吗？」——这个功能还在做，你的回答帮我们决定先做什么。",
      ],
    },
    en: {
      title: "You keep the book, family looks",
      items: [
        "New in every book: Share with family (PDF) — the whole book in one file (a cover, then every page by date) that opens in Messages or WhatsApp, no app needed.",
        "Two suggested books on the shelf: The two of us (everyday moments and anniversaries) and Growing up.",
        "After sharing we ask whether they should be able to add photos too — not built yet; your answer helps us decide.",
      ],
    },
  },
  {
    version: "5.3",
    date: "2026-11-09",
    zh: { title: "应用里可以看到更新记录", items: ["每次更新后，首页顶部会出现「新版本」卡片，点开就能看这次改了什么。", "设置里有完整的「更新记录」。"] },
    en: { title: "Updates now show in the app", items: ["After each update, a “New version” card appears at the top of Home — tap it to see what changed.", "Settings has the full update history."] },
  },
  {
    version: "5.2",
    date: "2026-11-09",
    zh: {
      title: "选几张照片，一页就排好了",
      items: [
        "「＋」→ 照片 + 一句话 → 从相册一次选几张：照片保持原来的横竖比例，自动排成一页。",
        "下面只有四个按钮：换一种（三种样子）、写一句话、分享、编辑；点「完成」就放进选好的书。",
        "分享会生成 Story 尺寸（9:16）的图片。",
        "社区、私信、我的主页 / 装扮 / 等级、共同的书、颜色主题、登录页先收进「设置 → 实验室」。",
        "设置里有「测试记录」：只记用了哪些功能、用了多久，不含文字和照片。",
      ],
    },
    en: {
      title: "Pick a few photos — the page lays itself out",
      items: [
        "＋ → Photo + a line → choose several photos: each keeps its own shape and the page is laid out for you.",
        "Just four buttons: Shuffle (three looks), Add a line, Share, Edit. Tap Done to keep it in your journal.",
        "Share makes a Story-size (9:16) picture.",
        "Community, messages, profile / decorating / levels, shared books, colour themes and sign-in now live in Settings → Labs.",
        "Settings has a Test log: which features you used and how long they took — no words or photos.",
      ],
    },
  },
  {
    version: "5.1",
    date: "2026-11-09",
    zh: {
      title: "一天 = 封面 + 每一页",
      items: [
        "封面用一句话总结这一天（可以不写），第 01 页、第 02 页……记录发生了什么。",
        "「整理顺序 / 删除」可以上移、下移、删除每一页。",
        "记录一天有三种方式：照片 + 一句话、随手写、手绘（支持 Apple Pencil 力度）。",
        "装扮空间：6 套一键套装、头像框、动态版式；等级改成文具店主题。",
      ],
    },
    en: {
      title: "A day = a cover + its pages",
      items: [
        "The cover sums up the day in one line (optional); Page 01, 02… keep what happened.",
        "“Reorder / delete” moves pages up or down or deletes them.",
        "Three ways to keep a day: photo + a line, just write, or draw (Apple Pencil pressure).",
        "Decorate: six one-tap looks, avatar frames, post layouts; stationery-shop levels.",
      ],
    },
  },
  {
    version: "5.0",
    date: "2026-11-09",
    zh: {
      title: "书架、杂志封面与照片库",
      items: ["书架可以切换「我的书 / 共同的书」，书脊像杂志。", "6 种杂志封面，照片按原比例显示。", "照片库换成真实照片，渐变和图案变成页面背景。"],
    },
    en: {
      title: "Shelf, magazine covers and the photo library",
      items: ["The shelf switches between My Books and Our Books, with magazine spines.", "Six magazine covers; photos keep their own shape.", "Real photos in the library; gradients and patterns became page backgrounds."],
    },
  },
];
export const LATEST = UPDATES[0].version;
export const SEEN_KEY = "little-days.seen-version";

export function noteFor(update, language) {
  return language === "en" ? update.en : update.zh;
}
// True when this device has not yet seen the newest update.
export function hasUnseen(storage = globalThis.localStorage) {
  try {
    return storage?.getItem(SEEN_KEY) !== LATEST;
  } catch {
    return false;
  }
}
export function markSeen(storage = globalThis.localStorage) {
  try {
    storage?.setItem(SEEN_KEY, LATEST);
  } catch {}
}
