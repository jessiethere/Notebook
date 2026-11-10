// What's new: the update notes shown inside the app (a card on Home after an
// update, and the full list in Settings). Newest first. Add one entry for
// every published update (see AGENTS.md); these are interface texts in both
// languages, not user content.
export const UPDATES = [
  {
    version: "7.6",
    date: "2026-11-10",
    zh: {
      title: "搜索写过的东西、「那年今天」、每天的温柔提醒、给手帐本加标签",
      items: [
        "首页和日历右上角有放大镜：搜索标题、正文、纸上的字、#标签、习惯感想和做完的事；几个词用空格隔开就会都匹配，找到的字会标出来，点一下打开那一页。只在这台设备上搜索。",
        "「那年今天」：如果往年的今天记过，首页会出现「1 年前的今天」，带那天的照片和一句话；还没满一年时显示「一个月前的今天」。点 × 今天就不再显示；打开「首页隐藏今天的内容」时也不显示。",
        "设置里新增「每天的提醒」：选一个时间（默认晚上 9 点），iPhone 会轻轻问一句「今天有什么值得记的？」。用的是 iPhone 本地通知，不联网；今天已经记过了就不打扰；通知上可以直接「关闭每日提醒」，点通知会打开「今天怎么记？」。（网页里没法提醒，只在 iPhone App 里有效。）",
        "手帐本可以加标签：编辑手帐本时填「标签」（空格分开，带空格的标签前面加 #，例如 #self awareness）；书架上方可以按标签筛选，打开手帐本能看到它的标签，搜索也能搜到。",
        "首页「今天」卡片里的字用那一页自己的字体（以前总是默认字体，和页面里看起来不一样）。",
      ],
    },
    en: {
      title: "Search what you wrote, On this day, a gentle daily reminder, tags for your journals",
      items: [
        "A magnifier on Home and Calendar: search titles, words, text on the paper, #tags, habit notes and things done; several words must all match; matches are highlighted and a tap opens that page. Searching happens only on this device.",
        "On this day: if you kept this date in an earlier year, Home shows “1 year ago today” with that day's photo and a line; before a year has passed, “A month ago today”. × hides it for today; it also stays hidden with “Hide today on Home”.",
        "Settings → Daily reminder: pick a time (9 pm by default) and your iPhone gently asks “Anything worth keeping today?”. A local notification, nothing online; skipped once today is kept; “Turn off daily reminder” right on the notification, and tapping it opens “How shall we keep today?”. (The Web can't notify — iPhone app only.)",
        "Tags for journals: add “Tags” when editing a journal (spaces between; # before a tag with spaces, e.g. #self awareness); filter the shelf by tag, see them on the journal's page, and find them by search.",
        "Home's “Today” card now shows each page's words in that page's own fonts (it used to fall back to the default font).",
      ],
    },
  },
  {
    version: "7.5",
    date: "2026-11-10",
    zh: {
      title: "备份提醒；记录改存进本机数据库，写多少年都放得下",
      items: [
        "记录只在这台手机上，所以备份很重要：自己记了 3 天以上、还没备份过（或已经 14 天没备份）时，首页会出现一行小提醒，点「现在备份」就行；点 × 一周后再提醒。",
        "设置里能看到「上次备份：哪天（几天前）」。iPhone 上可以把备份文件存到「文件」或 iCloud 云盘。",
        "文字和页面改存进本机数据库（IndexedDB，和照片放在一起），比原来的浏览器小仓库大得多；就算原来的地方满了，也照样能保存，不会丢。",
        "第一次打开会自动把以前的记录搬过去，不用做任何事；还会请求浏览器 / iPhone 不要在空间不够时自动清掉这些数据。",
      ],
    },
    en: {
      title: "Backup reminders; your journal now lives in the device's database, room for years",
      items: [
        "Everything is only on this phone, so backups matter: once you've kept 3+ days with no backup (or none for 14 days), Home shows a one-line reminder — tap “Back up”; × waits a week.",
        "Settings shows when you last backed up. On iPhone, save the file to Files or iCloud Drive.",
        "Words and pages now live in the device's database (IndexedDB, next to your photos) — far roomier than before; even if the old store is full, saving still works and nothing is lost.",
        "The first start moves earlier pages over by itself; the app also asks the browser / iPhone not to clear this data when space runs low.",
      ],
    },
  },
  {
    version: "7.4",
    date: "2026-11-10",
    zh: {
      title: "App 锁：4 位密码，iPhone App 里可以用面容 ID",
      items: [
        "设置 →「隐私」→「App 锁」：设置 4 位密码（输入两次）。之后打开 Little Days 要先输入密码，锁着的时候下面的内容不能点也看不到。",
        "可以选离开多久后再锁上：立即、1 分钟或 5 分钟。",
        "密码只保存在这台设备上，而且只存加密后的校验值，不存密码本身。连续输错 5 次要等 30 秒再试（刷新页面也不能跳过）。",
        "iPhone App 里可以用面容 ID（或触控 ID）解锁，由 iOS 验证，Little Days 拿不到你的面容或指纹；打开 App 锁后，切换 App 的预览里也只显示「Little Days」，不显示手帐内容。",
        "关掉或修改密码都要先输入现在的密码。「忘记密码？」会如实说明：我们无法帮你找回，记得定期备份。",
      ],
    },
    en: {
      title: "App lock: a 4-digit passcode, Face ID in the iPhone app",
      items: [
        "Settings → Privacy → App lock: set a 4-digit passcode (twice). Little Days then asks for it when opened; while locked, nothing underneath can be seen or tapped.",
        "Choose how long you can be away before it locks again: immediately, 1 minute or 5 minutes.",
        "The passcode stays on this device, stored only as a salted hash — never the passcode itself. Five wrong tries in a row mean a 30-second wait (a reload doesn't skip it).",
        "In the iPhone app, Face ID (or Touch ID) unlocks it — iOS checks it, Little Days never sees your face or fingerprint; with the lock on, the app switcher shows just “Little Days”, not your journal.",
        "Turning it off or changing the passcode asks for the current one first. “Forgot passcode?” says honestly that we can't recover it — back up now and then.",
      ],
    },
  },
  {
    version: "7.3",
    date: "2026-11-09",
    zh: {
      title: "删除习惯更好找：每个习惯有「✎ 编辑」",
      items: [
        "「我的习惯」里每个习惯下面有「✎ 编辑」按钮（原来是不显眼的「⋯」）：点开可以「编辑习惯」或「删除这个习惯」（会先问你，它的打卡记录也一起删除）。",
        "修好了习惯卡片左边的小图标跑到卡片外面的问题。",
        "习惯卡片下面改成两行：一周的小圆点一行，次数、编辑、成长书一行，小屏手机上也不会被截掉。",
      ],
    },
    en: {
      title: "Deleting a habit is easy to find: “✎ Edit” on each habit",
      items: [
        "Each habit in My habits has a “✎ Edit” button (it was an easy-to-miss “⋯”): open it to edit the habit or delete it (you're asked first; its check-ins go too).",
        "Fixed the little habit icons showing outside their cards.",
        "Under each habit: the week's dots on one line, then count, Edit and its book — nothing is cut off on small phones.",
      ],
    },
  },
  {
    version: "7.2",
    date: "2026-11-09",
    zh: {
      title: "保护隐私：今日清单默认不进导出，首页可以隐藏今天",
      items: [
        "今日清单（打卡的习惯、做完的事）是私人的：导出图片和分享给家人的 PDF 默认不再带它；想带的话在设置 →「隐私」里打开。",
        "设置 →「隐私」可以打开「首页隐藏今天的内容」：首页只显示「今天记了几页」，不显示照片和文字，别人看到你的手机时更安心。",
        "「隐私」里写清楚了：内容只存在这台设备上；放进来的照片不会留下拍摄地点（GPS）；App 不连接第三方服务、没有广告和追踪；社区等功能目前只是本机演示。",
      ],
    },
    en: {
      title: "Privacy: today's list stays out of exports; Home can hide today",
      items: [
        "Today's list (habits checked, things done) is private: exported pictures and PDFs shared with family no longer include it unless you switch it on in Settings → Privacy.",
        "Settings → Privacy → “Hide today on Home”: Home shows only how many pages you kept today — no photos or words — for when someone else sees your phone.",
        "Privacy now spells it out: everything stays on this device; photos you add keep no location (GPS); the app talks to no third-party service, no ads or tracking; community features are a local demo for now.",
      ],
    },
  },
  {
    version: "7.1",
    date: "2026-11-09",
    zh: {
      title: "那一天的「今日清单」放到页面后面，更安静",
      items: [
        "打开某一天时，「今日清单」不再放在最上面，而是放在这一天的页面后面，像一天的结尾。",
        "清单变成一行一行的 ✓：打卡的习惯和做完的事长得一样；不再每条都有大卡片和「写感想」。",
        "点习惯那一行：有感想就打开来看，没有就直接写。",
      ],
    },
    en: {
      title: "A day's “Today's list” moves after the pages, quieter",
      items: [
        "Opening a day, “Today's list” is no longer at the top: it comes after that day's pages, like the end of the day.",
        "The list is simple ✓ rows: habits checked and things done look alike — no big card and “Add a note” link for each.",
        "Tap a habit's row to read its note, or write one if there isn't one yet.",
      ],
    },
  },
  {
    version: "7.0",
    date: "2026-11-09",
    zh: {
      title: "首页「今天」卡片：每张照片一页，可以左右滑",
      items: [
        "首页「今天」卡片现在按照片来滑：今天放进页面的每张照片各占一张（带那一页的标题），只有文字的页面也有一张；下面的小圆点跟着走。",
        "以前是一页一张，今天只有一页（哪怕里面有好几张照片）时就滑不动；现在一页里的几张照片都能一张张看。",
        "当天跨页上自动放的照片副本不会重复出现。",
      ],
    },
    en: {
      title: "Home's “Today” card: one slide per photo, swipe through them",
      items: [
        "Home's “Today” card now swipes by photo: every photo put on today's pages gets its own slide (with that page's line), and pages that are only words get one too; the dots follow.",
        "Before, it was one slide per page, so a day with a single page (even with several photos) couldn't be swiped; now each photo on that page can be seen in turn.",
        "Copies of photos on the day spread are not shown twice.",
      ],
    },
  },
  {
    version: "6.9",
    date: "2026-11-09",
    zh: {
      title: "今天要做的事最多 8 件；今日清单画进导出图片和 PDF",
      items: [
        "「今天要做的事」从最多 5 件放宽到 8 件。",
        "导出图片时，当天第一页下面会多一条「今日清单」：打卡的习惯和做完的事，不会盖住页面本身。",
        "分享整本书的 PDF 里，每天的第一页也带着这条清单；这一页会稍微长一点，不会被压扁。",
        "翻书页上的「今日清单」现在会显示打卡习惯的名字（之前只显示做完的事）。",
        "习惯保留在「我的习惯」里，首页一行入口不变。",
      ],
    },
    en: {
      title: "Up to 8 things in Today's plan; the day's list in exported pictures and PDFs",
      items: [
        "“Today's plan” now holds up to 8 things (was 5).",
        "Exporting a picture of a day's first page adds a “Today's list” strip underneath: habits checked and things done, without covering the page.",
        "In a shared book's PDF, each day's first page carries the list too; that page is a little taller instead of squashed.",
        "The list on the flip book's page now names the habits checked (before, only the things done showed).",
        "Habits stay in My habits, with the one line on Home as before.",
      ],
    },
  },
  {
    version: "6.8",
    date: "2026-11-09",
    zh: {
      title: "首页「今天要做的事」，更新记录搬进设置",
      items: [
        "首页的习惯列表换成了空白的「今天要做的事」：写下今天要做的，做完打个勾（最多 5 件，人人可用，不再只在实验室里）。",
        "习惯还在：首页只留一行「我的习惯 · 今天 x/y 已完成 ›」，打卡、成长之书、每周回顾都在「我的习惯」里（书架上也有）。",
        "更新记录不再占首页：有新版本时，右上角设置齿轮上出现小红点；设置里的「更新记录」显示这次更新的内容，也能看全部。",
      ],
    },
    en: {
      title: "“Today's plan” on Home; update notes moved to Settings",
      items: [
        "Home's habit list is now a blank “Today's plan”: write what's on today and tick it off (up to 5, for everyone — no longer only in Labs).",
        "Habits are still here: Home keeps one line, “My habits · x/y done today ›”; check-ins, habit books and weekly reviews are in My habits (also on the shelf).",
        "Update notes no longer take space on Home: a small dot on the Settings gear when there's a new version; Settings → “Updates” shows what changed and the full list.",
      ],
    },
  },
  {
    version: "6.7",
    date: "2026-11-09",
    zh: {
      title: "保存后看到写好的那页、首页左右滑预览今天；拖动互换/替换照片、杂志风格；删习惯、补记昨天",
      items: [
        "「我的习惯」里每个习惯有「⋯」：可以改名字、改每周目标，或删除（会先问你，它的打卡记录也会一起删除）。",
        "忘了记？首页有「忘了记？补记昨天」；选的照片如果是昨天拍的，会自动记到昨天（预览里也可以改日期）。",
        "主题配色不再只在实验室里，设置里人人可用；字体里加了简单的默认黑体、宋体、楷体（用设备自带的字体）。",
        "编辑封面时，纸下面重复的「今天的标题和文字」框去掉了，直接在纸上打字；在纸上打完字马上就能点「撤销」。",
        "在「自定义」里，把一张照片拖到另一张上面松手，两张就会换位置；每张按自己的比例放进对方的框里，不会被裁掉。",
        "选中照片，工具条里多了「替换」：换一张照片，位置不变，框会跟着新照片的横竖比例调整。",
        "杂志风格：每页上方有「— 08:10 · MORNING」小标，标题更大、更像杂志标题，页脚有「LITTLE DAYS · NO. 09」；当天跨页有「LITTLE DAYS」刊头和大号日期，像一期杂志的封面。",
        "装饰贴纸会避开多行文字，不再碰到长句子。",
        "点「保存」后会直接翻到你刚写好的那一页（在手帐本里一页页翻），不再一下子跳回首页。",
        "首页「今天」卡片可以向右滑，下面有小圆点：一页页预览今天写过的字和放过的照片，点一下就打开那一页。",
        "「图库」直接在「今天怎么记？」里显示照片，点一张再开始写；选「我的相册」后取消，会回到原来的地方（首页或那个选择窗口），不会多出一张空白页。",
        "在纸上打字时，换字体只改正在写的那一处（标题或正文），和字号、颜色一样分开调整。",
        "首页「Aa 只写几句」去掉了「Aa」，就是「只写几句」：不放照片，直接在纸上写一页。",
      ],
    },
    en: {
      title: "See your page after Save, swipe through today on Home; swap/replace photos, Editorial; delete habits, fill in yesterday",
      items: [
        "Each habit in “My habits” has “⋯”: rename it, change its weekly goal, or delete it (you're asked first; its check-ins go too).",
        "Forgot a day? Home has “Forgot? Fill in yesterday”; photos taken yesterday go to yesterday by themselves (the preview's date can be changed).",
        "Colour themes are for everyone now, not only in Labs; the fonts include simple Sans, Serif and Kai defaults (your device's own fonts).",
        "The cover's duplicate “Today's title and words” box under the paper is gone — type on the paper; typing there can be undone right away.",
        "In Customize, drag a photo onto another and let go: they change places, each fitted into the other's frame in its own shape, never cropped.",
        "Select a photo and tap “Replace”: the new photo takes the same place, and the frame follows its shape.",
        "Editorial: a “— 08:10 · MORNING” kicker on each page, a bigger headline and a “LITTLE DAYS · NO. 09” folio; the day spread gets a LITTLE DAYS masthead and a big date, like a magazine cover.",
        "Stickers now keep clear of longer, multi-line words.",
        "After Save you see the page you just made, open in its journal (turn the pages), instead of jumping back to Home.",
        "Home's “Today” card swipes sideways, with dots below: preview today's words and photos page by page; tap one to open it.",
        "“Library” shows its photos right in “How shall we keep today?” — tap one, then start; cancelling “My photos” takes you back where you were (Home or that sheet), with no empty page left behind.",
        "Typing on the paper, a new font changes only what you're writing (the title or the words), like size and colour.",
        "Home's “Aa Just write” is now simply “Just write”: no photos, write a page on paper.",
      ],
    },
  },
  {
    version: "6.6",
    date: "2026-11-09",
    zh: {
      title: "成长合并进「今天」：首页打卡、今日清单、书架上的「我的习惯」",
      items: [
        "底部导航少了「成长」：现在是 首页 / 日历 / ＋ / 书架。",
        "首页「今天」卡片里有「今天的小习惯」，一点就打卡；「我的习惯 ›」打开成长之书、统计、每周回顾和习惯设置。",
        "书架上多了一本「我的习惯」，和其他书放在一起。",
        "打过卡的习惯（和做完的事）会以「今日清单」小便签出现在那一天的阅读页最上面，翻书时也会出现在那天的第一页下方。",
        "实验室：首页可以写「今天想做的事」，最多 5 件，打勾、删除；没做完的不会自动挪到明天，第二天可以点「搬到今天」。",
      ],
    },
    en: {
      title: "Growth is part of your day: check in on Home, today's list, “My habits” on the shelf",
      items: [
        "No more Growth tab: the menu is Home / Calendar / ＋ / Books.",
        "Home's “today” card has your little habits — one tap to check in; “My habits ›” opens the growth journey, stats, weekly reflections and habit settings.",
        "“My habits” also sits on the shelf with your other books.",
        "Habits checked (and things done) appear as a small “Today's list” at the top of that day, and under that day's first page when you flip the book.",
        "Labs: write up to 5 “things to do today” on Home, check or remove them; unfinished ones never move by themselves — tap “bring them here” the next day.",
      ],
    },
  },
  {
    version: "6.5",
    date: "2026-11-09",
    zh: {
      title: "Quick Create V2：选完照片就是一页好看的手账，三种风格",
      items: [
        "选完照片直接看到排好的初稿：几个 Moment 的一天会有一张「当天跨页」，再加每个 Moment 一页；不用先写字、不用先选模板。",
        "三种真正不同的风格，一键切换：杂志（大主图、衬线字、留白）、手账（拍立得、胶带、手写字、牛皮纸）、拼贴（错落叠放、柔色背景、贴纸）。照片、文字和顺序都会保留。",
        "想写的话，点页面或「写一句」就能给每个 Moment 写感想，页面会自动重新排好；不写也很好看。",
        "「重新排版」换一种构图；「调整分组」可以挪照片；「自定义」进入自由编辑。你自己调整过的页，换风格或重新排版前会先问你。",
        "照片按原比例放进相框，不会被裁掉；长句子会自动变小、换行，不会被截断。",
      ],
    },
    en: {
      title: "Quick Create V2: pick photos, get a beautiful page — in three styles",
      items: [
        "Right after picking photos you see a designed draft: a day spread for days with several Moments, plus one page per Moment. No words or template needed first.",
        "Three truly different styles, one tap to switch: Editorial (a big hero photo, serif type, white space), Cozy (Polaroids, tape, handwriting, kraft paper) and Collage (layered pieces, soft colour, stickers). Photos, words and order are kept.",
        "Want words? Tap the page or “Add words” to write a line for each Moment; the page re-arranges itself. It looks good without words too.",
        "“Re-layout” tries another composition; “Regroup” moves photos between Moments; “Customize” opens free editing. Pages you adjusted yourself are never changed without asking.",
        "Photos sit in frames of their own shape, never cropped; long lines shrink and wrap instead of being cut off.",
      ],
    },
  },
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
