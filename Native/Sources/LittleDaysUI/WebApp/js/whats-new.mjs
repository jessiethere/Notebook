// What's new: the update notes shown inside the app (a card on Home after an
// update, and the full list in Settings). Newest first. Add one entry for
// every published update (see AGENTS.md); these are interface texts in both
// languages, not user content.
export const UPDATES = [
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
