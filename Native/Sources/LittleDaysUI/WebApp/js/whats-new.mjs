// What's new: the update notes shown inside the app (a card on Home after an
// update, and the full list in Settings). Newest first. Add one entry for
// every published update (see AGENTS.md); these are interface texts in both
// languages, not user content.
export const UPDATES = [
  {
    version: "10.55",
    date: "2026-11-14",
    zh: {
      title: "照片墙：看见生活的全部",
      items: [
        "日历里的「照片墙」不再是第二个月历：你保存在手帐里的生活照片会自动汇成一面瀑布流照片墙，按原本的比例排列，最新的在最前面，月份只是一行小字。",
        "点一张照片：看大图、所属日期和手帐本、同一天的其他照片，左右滑动看上一张 / 下一张；「打开这一页」直接翻到它所在的那一页，返回时回到照片墙。",
        "新保存的照片会自动出现，删除的页面会带走它的照片；照片墙不会另外保存任何照片，图库示例图、贴纸和手绘也不会混进来。",
        "「生活记忆」还是原来的月历，用来找回某一天。",
      ],
    },
    en: {
      title: "Photo wall: all your days at a glance",
      items: [
        "The Photo wall in Calendar is no longer a second calendar: the photos you kept in your journal gather into a masonry wall in their own shapes, newest first, with just a quiet month line.",
        "Tap a photo to see it large with its date and book, the other photos from that day, and swipe for the next one. Open this page goes straight to the page it lives on; back returns to the wall.",
        "New photos appear by themselves and a deleted page takes its photos away. The wall stores no copies, and library samples, stickers and drawings stay out.",
        "Memories is still the month calendar, for finding a day.",
      ],
    },
  },
  {
    version: "10.54",
    date: "2026-11-14",
    zh: {
      title: "新建手帐本：先起名字，其他慢慢来",
      items: [
        "打开就是封面、名称、6 个精选封面和「创建」；描述、标签、封面细节、手帐设置都收进「更多个性化设置」，收起时也能看到当前设置的摘要。",
        "「查看更多封面」：按生活主题、杂志、纸张手作、柔和可爱分类浏览全部 22 种封面，还能从整个图库选照片或上传自己的；返回时名字和选择都还在。",
        "新增 10 种封面：植物标本、咖啡小票、食谱卡片、旅行明信片、毛孩子名牌、生活碎片、复古票根、简约杂志、柔彩云朵、四季流转（会跟着季节换装）。",
        "点「创建」后，确认真正保存好了才打开新的手帐本；没保存好时你填的内容都还在，可以再试一次，连点两下也只会建一本。",
      ],
    },
    en: {
      title: "A new book: name it now, the rest can wait",
      items: [
        "First you see the cover, the name, six featured covers and Create. Description, tags, cover details and book settings fold under More personal touches, each with a short summary.",
        "More covers: browse all 22 by Life themes, Magazine, Paper & craft and Soft & cute; pick from the whole photo library or upload your own. Going back keeps your name and choices.",
        "Ten new covers: Botanical Herbarium, Café Receipt, Recipe Card, Travel Postcard, Pet Tag, Everyday Polaroids, Vintage Ticket, Minimal Editorial, Pastel Cloud and Through the Seasons (it changes with the season).",
        "Create opens your new book only once it is really saved. If it isn't, everything you filled in stays to try again — and two quick taps still make one book.",
      ],
    },
  },
  {
    version: "10.53",
    date: "2026-11-14",
    zh: {
      title: "新建手帐本：「创建」不会没反应",
      items: [
        "类别清空也能创建，会自动用默认类别。",
        "如果某一项需要修改，它所在的折叠小栏会自动展开，让你看到要改哪里。",
      ],
    },
    en: {
      title: "New book: Create always responds",
      items: [
        "An empty category no longer blocks Create; the default category is used.",
        "If a field needs fixing, the folded section it sits in opens so you can see it.",
      ],
    },
  },
  {
    version: "10.52",
    date: "2026-11-14",
    zh: {
      title: "新建手帐本更简单",
      items: [
        "新建 / 编辑手帐本时，封面预览就在名称旁边，一眼能看到最要紧的：名称、描述、封面样式、封面照片。",
        "封面样式和封面照片都改成左右滑动的一行；封面照片可以从整个图库里选（适合这本书的排在前面），第一格就是「上传」。",
        "标签与类别、封面细节（颜色 · 字体 · 装饰）、隐私与记录字段都收进了可以展开的小栏里，不再一长串。",
      ],
    },
    en: {
      title: "A simpler new book",
      items: [
        "Creating or editing a book: the cover preview sits beside the name, so the essentials — name, words, cover style and photo — are all in view.",
        "Cover styles and cover photos are sideways rows; pick from the whole photo library (the ones that suit the book first), with Upload as the first tile.",
        "Tags and category, cover details (colour · font · decoration), and privacy and record fields fold away until you need them.",
      ],
    },
  },
  {
    version: "10.51",
    date: "2026-11-14",
    zh: {
      title: "返回就保存；写字时看得见；书架可以直接管理",
      items: [
        "编辑页左上角的返回：直接保存并退出，不再问「要先收好这一页吗？」。草稿还是草稿，已完成的还是已完成（改动会保存）；要完成就点右上角「完成」。真的保存好了才退出，没保存好会提示并可以再试一次。",
        "新建文字框：直接出现光标可以打字，不再把默认文字选中（iPhone 上会弹出剪切 / 拷贝 / 粘贴）；什么都没写就离开，这个空的文字框会自动去掉。",
        "在文字框里打字时，键盘上方只留一行：「样式 · B I U S · 完成」；字体、字号、颜色和对齐在「样式」里打开（键盘会先收起）。",
        "今天的故事：写字面板顶部有一个实时的页面小窗，对准你正在写的那句话；换字体、A+ / A−、颜色和对齐，立刻就能看到效果。面板会贴在键盘上方。",
        "今天的故事点「保存」后，会等真正保存好，再直接打开刚做好的那一页（不是这一天的第一页）。",
        "首页左上角：中文界面显示「开铺手帐」，英文界面显示 Capiday。杂志封面上的旧名字也改成了 capiday。",
        "书架：展开的书右上角有「···」，可以直接编辑书本资料；空的书可以删除（会先确认），有页面的书不会被删除。",
        "标签改成胶囊：输入后按回车（或逗号）就变成一个标签，点 × 删除；带空格的标签不用再加 #。展开的书下面会显示前 2 个标签。",
      ],
    },
    en: {
      title: "Back saves; see what you type; manage books from the shelf",
      items: [
        "Back in the editor now saves and leaves — no more “Put this page away first?”. A draft stays a draft and a finished page stays finished (with your changes); tap Done to finish. It leaves only once it is really saved, and tells you (with Try again) if it is not.",
        "A new text box opens with the caret ready (no selected words, so no Cut / Copy / Paste popping up); a new box you leave empty goes away.",
        "While typing in a text box, one short row sits above the keyboard: Style · B I U S · Done. Fonts, size, colour and alignment open from Style.",
        "Today's story: the words sheet now shows the real page live at its top, centred on the line you are writing — fonts, A+ / A−, colours and alignment show at once. The sheet sits above the keyboard.",
        "Save in Today's story waits until it is really saved, then opens the page you just made (not the day's first page).",
        "Home's wordmark reads 开铺手帐 in Chinese and Capiday in English; magazine covers no longer show the old name.",
        "Shelf: the pulled-out book has a ··· to edit its details right there; an empty book can be deleted (after asking); a book with pages is never deleted.",
        "Tags are chips: type one and press return (or a comma); × removes it; tags with spaces need no #. The pulled-out book shows its first 2 tags.",
      ],
    },
  },
  {
    version: "10.50",
    date: "2026-11-14",
    zh: {
      title: "语音日记能听到了；视频第一次就能导入",
      items: [
        "修好了：录完语音日记后播放没有声音。原因是录音后 iPhone 一直停在「录音」模式，声音从听筒（打电话的位置）出来、非常小。现在录完就切回正常播放，从扬声器出声。",
        "录音时更清楚：红色指示灯、「正在录音」和实时时长 00:12，下面有跟着你声音跳动的声波，「停止并保存」放在旁边。",
        "点停止后马上显示「正在保存录音…」，真正存好才显示「录音已保存」；万一没存好，录音还在，可以「重新保存」。",
        "录音时切到别的 App、来电或锁屏，会自动停止并保存，不会丢。",
        "页面上的声音和视频，只有真的开始播放才显示「正在播放」；播放不了会直接告诉你。",
        "修好了：第一次导入视频总是失败（要点「重试」才行）。",
        "不再每次打开 App 都问一遍能不能用麦克风；iPhone 系统只会问一次。",
      ],
    },
    en: {
      title: "Voice notes play out loud; videos import the first time",
      items: [
        "Fixed: a voice note played no sound right after recording. The iPhone stayed in recording mode and played through the earpiece, very quietly. It now switches back to normal playback through the speaker.",
        "Clearer while recording: a red light, “Recording” with the time (00:12), a sound level that follows your voice, and “Stop and save” right beside it.",
        "Stop shows “Saving the recording…” at once and “Recording saved” only once it really is; if saving fails, the recording is kept and you can save it again.",
        "Switching apps, a call or locking the phone while recording stops and saves it — nothing is lost.",
        "Sounds and videos on a page show “playing” only when they really play, and say so when they can't.",
        "Fixed: the first video import always failed and needed a retry.",
        "The app no longer asks about the microphone every time it opens; iOS asks once.",
      ],
    },
  },
  {
    version: "10.49",
    date: "2026-11-14",
    zh: {
      title: "iPhone 上的音乐音量可以调了",
      items: [
        "修好了：「这本书的音乐」里的音量滑块在 iPhone 上没有作用（iPhone 不让网页直接改声音大小）。现在在 iPhone 和 iPad 上换了一种方式调音量，拖动滑块就会变大变小。",
      ],
    },
    en: {
      title: "Music volume works on iPhone",
      items: [
        "Fixed: the volume slider in a book's music did nothing on iPhone (iOS ignores a web page's own volume setting). On iPhone and iPad the music now plays through a volume control that iOS honours.",
      ],
    },
  },
  {
    version: "10.48",
    date: "2026-11-14",
    zh: {
      title: "分享更简单",
      items: [
        "书里的「分享给家人看（PDF）」改成「分享」，分享给谁都可以。",
        "分享完不再弹出「想让 TA 也能往这本书里加照片吗？」的问题。",
      ],
    },
    en: {
      title: "Simpler sharing",
      items: [
        "“Share with family (PDF)” in a book is now just “Share” — share it with anyone.",
        "No more question about letting someone add photos after you share.",
      ],
    },
  },
  {
    version: "10.47",
    date: "2026-11-14",
    zh: {
      title: "可以把一天彻底清空了",
      items: [
        "修好了：删掉一天的所有页面后，「页面目录」里会留下一个删不掉的「封面」。现在没有封面就不显示封面这一行；什么都没有时显示「这一天还没有页面」。",
        "删除一天的最后一页时会提示「删除这一页后，这一天将没有记录。」，选「删除」后回到日历，这一天变成空的。",
        "以前删掉页面后，点「完成」保存不了，删掉的页面其实还留在已保存的手帐里；现在会正确清空。",
        "清空后可以点提示里的「撤销」，或在日历的这一天点「恢复刚删除的这一天」（关掉 App 再打开也可以）。照片、视频文件不会被删除。",
        "只剩封面时可以直接删除封面；以前自动生成的封面会保留，由你决定隐藏还是删除。",
        "编辑器顶部的「第几页 · 共几页」和阅读器、日历使用同一个计数：显示中的封面算一页，隐藏的封面不算。",
      ],
    },
    en: {
      title: "A day can now be emptied completely",
      items: [
        "Fixed: after deleting every page of a day, the page list kept a cover that could not be deleted. Now the cover row shows only when the day has a cover; an empty day says “No pages on this day yet.”",
        "Deleting a day's last page says “After deleting this page, this day will have no record.” — Delete takes you back to the Calendar with the day empty.",
        "Before, after deleting pages, Done could not save and the deleted pages stayed in the saved journal; this now clears correctly.",
        "Undo on the message, or “Restore the day you just deleted” on that date in the Calendar (also after closing the app). Photo and video files are never deleted.",
        "When only a cover is left it can be deleted; covers made automatically by older versions are kept for you to hide or delete.",
        "“Page n of N” in the editor now counts like the Reader and Calendar: a shown cover is a page, a hidden one is not.",
      ],
    },
  },
  {
    version: "10.46",
    date: "2026-11-14",
    zh: {
      title: "手绘：在 iPhone 上画完可以正常退出、选中和保存",
      items: [
        "修好了 iPhone 上手绘板顶部的「取消」「完成」被手机状态栏挡住、点不到的问题——之前画完会卡在画板里，没法回到页面保存。",
        "手绘里空白的地方不再挡住下面的照片、文字和贴纸：点空白处会选中下面的东西，点到笔画才选中手绘。",
        "画了新笔画后点「取消」，会先问一句要不要放弃；什么都没画就直接关闭。接着画以前的手绘时点取消，原来的手绘保持不变。",
        "手绘保存失败时不再直接丢掉，会问你要不要再试一次。",
      ],
    },
    en: {
      title: "Drawing: on iPhone you can now finish, select and save",
      items: [
        "Fixed: on iPhone the drawing board's Cancel and Done sat under the status bar and could not be tapped, so you were stuck on the board and could not save.",
        "Empty parts of a drawing no longer cover the photos, text and stickers underneath: tapping an empty spot picks what is below; tapping a stroke picks the drawing.",
        "Cancel after drawing new strokes asks first; with nothing new it just closes. Cancelling while drawing more on an earlier drawing keeps it as it was.",
        "If a drawing cannot be saved, it is no longer dropped: you are asked to try again.",
      ],
    },
  },
  {
    version: "10.45",
    date: "2026-11-14",
    zh: {
      title: "改名了：中文叫开铺手帐，英文叫 Capiday",
      items: [
        "App 从 Little Days 改名：中文名「开铺手帐」，英文名「Capiday」。中文界面里的提示和说明写开铺手帐；首页和页面上的刊头、页脚，以及导出的 PDF、备份文件名用 Capiday。",
        "App 图标换成了新的 Capiday 图标（还是戴柠檬帽的 Captain）。",
        "你的手帐、照片、视频和设置都原样保留，不需要做任何事情；以前导出的备份也照样可以恢复。",
      ],
    },
    en: {
      title: "Little Days is now Capiday",
      items: [
        "The app is now called Capiday (in Chinese: 开铺手帐): Home, Settings, messages, exported PDF and backup file names, and the masthead and footer on your pages all use the new name.",
        "A new Capiday app icon (still Captain in the lemon hat).",
        "Your journal, photos, videos and settings stay exactly as they were — nothing to do. Backups you exported before still restore.",
      ],
    },
  },
  {
    version: "10.44",
    date: "2026-11-13",
    zh: {
      title: "每日封面变成可选的",
      items: [
        "新的一天不再自动生成每日封面，阅读时直接从第一页开始，页数也不再多算一页。",
        "想要封面时，在「今天的故事」页签最后点「＋ 封面（可选）」，会用当天已有的照片排好，不会重复导入。封面上的照片也可以换成这一天、这本书里的照片，或从相册添加；那一页本身的照片不变。",
        "以前的每日封面都保留着。在阅读器右下角「···」里可以「在阅读器隐藏每日封面」，只是不显示，封面和照片都不删除；随时可以「重新显示每日封面」（日详情里也有）。",
        "完整备份照样包含隐藏的封面。书本封面不受影响，也不算在页数里。",
      ],
    },
    en: {
      title: "Day covers are now optional",
      items: [
        "A new day no longer gets a day cover on its own: reading starts on its first page, and the page count isn't one higher.",
        "Want one? Tap \"＋ Cover (optional)\" after the pages in Today's Story: it's laid out from the day's photos, nothing imported again. A cover photo can be swapped for one from this day, this book or Photos; the page itself keeps its photo.",
        "Earlier day covers are all kept. In the Reader's ··· menu, \"Hide this day's cover when reading\" only hides it (cover and photos stay); \"Show this day's cover again\" brings it back (also in Day Detail).",
        "A full backup still includes hidden covers. Book covers are unchanged and never count as pages.",
      ],
    },
  },
  {
    version: "10.43",
    date: "2026-11-13",
    zh: {
      title: "换照片可以直接用已经导入的照片",
      items: [
        "快速编辑和 Journal Studio 里点「换照片」，上方写着「正在替换照片 N」，下面先列出已经在开铺手帐里的照片：这一页、这一天、这本书；也可以照常「从相册添加」。",
        "选中的照片会复制到这个位置，原来的那张留在原处，不会交换位置，也不会再存一份文件。",
        "这个位置原来的那句话会保留，不会带上来源照片的说明。可以撤销，换完可以接着写字、改字体、换排版。",
      ],
    },
    en: {
      title: "Replace a photo with one you already imported",
      items: [
        "In Quick Edit and Journal Studio, Replace photo now says \"Replacing photo N\" and first shows the photos already in Capiday — this page, this day, this book — with Add from Photos still there.",
        "The photo you pick is copied into that place; the original stays where it was (no swapping), and no extra copy of the file is saved.",
        "That place keeps its own words (the other photo's caption isn't copied). You can undo, then carry on writing, changing the type or the layout.",
      ],
    },
  },
  {
    version: "10.42",
    date: "2026-11-13",
    zh: {
      title: "页数在每个地方都一样了",
      items: [
        "书架和首页的书写「几天 · 几页」，不再用「篇」表示天数。",
        "日历上的数字、日详情里的「几页」、阅读器的「第几 / 共几页」，现在都按同一条规则计算：当天自己的页面（显示时）加上每一页 Moment。书本封面不算在页数里。",
        "日详情的照片数只算不同的照片，每日封面里重复出现的照片不再多算。",
      ],
    },
    en: {
      title: "Page counts now match everywhere",
      items: [
        "Books on the shelf and on Home say \"days · pages\", instead of using one word for days.",
        "The number on the Calendar, the pages in Day Detail and \"Page n of N\" in the Reader all follow one rule: the day's own page (when shown) plus each Moment page. The book cover is not a page.",
        "Day Detail counts different photos: photos repeated on a day cover are no longer counted twice.",
      ],
    },
  },
  {
    version: "10.41",
    date: "2026-11-13",
    zh: {
      title: "你的手帐只装你自己的记录",
      items: [
        "新装的 App 只有一本空的「我的手帐」，0 页，可以改名、换封面或删除。书架上不再出现「和家人一起的书」建议卡片。",
        "以前版本放进手帐的示例都还保存着，但不再出现在你的书、日历、阅读、搜索和统计里，Captain 也不会把它们当成你的回忆。",
        "想看以前的示例：设置 → 示例内容 → 查看以前的示例，每一天都标着「示例」。",
        "你改过并保存过的示例那几天，算你自己的记录，照常显示、可以搜索。",
      ],
    },
    en: {
      title: "Your journal holds only what you kept",
      items: [
        "A new install starts with one empty book, My Journal (0 pages) — rename it, give it another cover or delete it. The family book suggestions no longer sit on the shelf.",
        "Samples an earlier version added are still stored, but they no longer appear in your books, Calendar, reading, search or counts, and Captain never treats them as your memories.",
        "To look at them: Settings → Samples → See the earlier samples, each day marked Sample.",
        "Sample days you changed and saved count as your own and show as usual.",
      ],
    },
  },
  {
    version: "10.40",
    date: "2026-11-13",
    zh: {
      title: "备份：只有真的存好了，才算备份",
      items: [
        "以前只要有一张照片读不出来，整份备份就会失败。现在 App 会列出读不出来的是哪几个文件、在哪一天的页面里；你可以先取消去看看，或者导出一份不含这些文件的备份。",
        "这份备份的文件名会带「incomplete」，文件里也写明缺了哪些，只会记为「不完整的备份」，不会当成完整备份。恢复时其他内容照常恢复，缺的照片位置保留。",
        "以前点了备份、在分享面板里取消，也会被记成「已备份」。现在导出后会问你「备份文件存好了吗？」，选「存好了」才记下这次备份。",
      ],
    },
    en: {
      title: "Backups: it only counts once the file is kept",
      items: [
        "Before, one photo that couldn't be read made the whole backup fail. Now the app lists which files can't be read and which days they're on; you can cancel and look, or export a backup without them.",
        "That backup's file name says \"incomplete\" and the file lists what's missing; it's recorded as an incomplete backup, never a complete one. Restoring it brings back everything else and keeps the missing photo's place.",
        "Before, cancelling the share sheet still counted as \"backed up\". Now the app asks \"Did you keep the backup file?\" and records the backup only when you say yes.",
      ],
    },
  },
  {
    version: "10.39",
    date: "2026-11-13",
    zh: {
      title: "第一次打开：干净的手帐，照片入口一眼就能看到",
      items: [
        "新装的 App 不再把示例页面、示例日子和示例习惯放进你的书、日历和页数里。已经有示例的手帐不受影响，示例都还在（设置 → 示例 可以移除没改过的），也不会再加新的。",
        "第一次打开时跟随手机语言：英文手机直接是英文，默认的三本书也用英文名。已经在用的人保持原来的语言，更新后不会突然改变。",
        "小屏手机（375 宽）首页第一屏就能完整看到「选今天的照片」。认识 Little Keeper 的邀请改为在你收好第一页之后出现，放在照片手帐卡下面。",
        "不再自动弹出连续记录的印章，首页也不再提示「开始连续记录」。",
        "习惯、成长轨迹、我的习惯暂时收起（在 设置 → 实验功能 打开后仍可使用），所有打卡和习惯数据都保留，没有删除。",
      ],
    },
    en: {
      title: "First open: a clean journal, and the photo button in plain sight",
      items: [
        "A new install no longer mixes sample pages, sample days and sample habits into your books, calendar and page counts. Journals that already have samples keep them (Settings → Samples removes the untouched ones) and get no new ones.",
        "The first open follows your phone's language: an English phone opens in English, with the three starting books named in English. If you already use the app, your language stays as it was.",
        "On small phones (375 wide) Choose today's photos is fully in the first screen. The invitation to meet Little Keeper now shows after you keep your first page, under the photo card.",
        "The streak stamp no longer pops up on its own, and Home no longer asks you to start a streak.",
        "Habits, the growth calendar and My Habits are put away for now (still there with Settings → Labs on). Every check-in and habit is kept.",
      ],
    },
  },
  {
    version: "10.38",
    date: "2026-11-13",
    zh: {
      title: "长文字不会再被截断",
      items: [
        "快速编辑「写文字」以前一页最多 70 字、照片说明最多 120 字，多打的字进不去。现在没有这个限制，写多少都会完整保存。",
        "短的一句排成标题，长的一段自动排成好读的正文字号，不会为了塞进去把字缩小。",
        "文字多到一页放不下时，会给出分页建议：照片留在第一页，文字在下一页接着排，按句子分开，一个字都不少。点〔分成 N 页〕之前不会自动加页。",
        "Journal Studio 里纸上的标题和照片说明也不再在 70 / 120 字处截断。",
      ],
    },
    en: {
      title: "Long words are no longer cut off",
      items: [
        "Quick Edit's Words used to stop at 70 characters for a page and 120 for a photo's caption. That limit is gone; everything you type is saved.",
        "A short line is set as a headline; a longer one becomes easy-to-read body text instead of shrinking to fit.",
        "When the words need more than one page, you get a suggestion: the photos stay on the first page and the words continue on the next, split between sentences, nothing left out. No page is added until you tap Make N pages.",
        "In Journal Studio, the line and photo captions on the paper are no longer cut at 70 / 120 characters either.",
      ],
    },
  },
  {
    version: "10.37",
    date: "2026-11-13",
    zh: {
      title: "切出 App 时，刚写的字会马上保存",
      items: [
        "写字时本来就会边写边存；现在刚打完字就切到别的 App、锁屏或关掉页面，最后几个字也会马上保存，不用等。",
        "「已保存」只在文字真的写进这台设备的手帐数据库之后才显示；写入失败会显示「还没保存」，可以点一下重试。",
        "回到 App 时会再检查一次保存状态（包括照片是否已存好）。",
      ],
    },
    en: {
      title: "Switching away from the app saves what you just typed",
      items: [
        "Your words were already kept as you write; now the last few are kept at once when you switch apps, lock the phone or close the page right after typing.",
        "\"Saved\" only shows once the words are really in this device's journal database; if that fails it says \"Not saved yet\" and you can tap to try again.",
        "When you come back, the save state is checked again (photos included).",
      ],
    },
  },
  {
    version: "10.36",
    date: "2026-11-13",
    zh: {
      title: "手帐暂时打不开时，App 会停下来保护它",
      items: [
        "以前如果打开 App 时这台设备上的手帐数据库刚好读不出来，App 可能会当作新用户新建一本空白手帐，下一次修改就可能盖掉原来的记录。现在不会了。",
        "只有真正第一次使用才会新建手帐。数据库暂时打不开、手帐格式来自其他版本、或最新副本损坏时，App 会停在一个说明页面，在你选择之前不写入、不清空、不覆盖任何数据。",
        "说明页面可以〔重试〕、〔保存原始数据副本〕；最新副本损坏但还有较早的完整副本时，可以确认后〔用较早的副本继续〕，损坏的那份会先完整保留。",
      ],
    },
    en: {
      title: "If your journal can't open, the app now stops to protect it",
      items: [
        "Before, if the journal database on this device couldn't be read when the app opened, the app could start a blank journal as if you were new, and your next change could overwrite the real one. That no longer happens.",
        "A new journal is only made on a real first start. If the database can't open, the journal was saved by another version, or the newest copy is damaged, the app stops on an explanation and writes, clears or overwrites nothing until you choose.",
        "There you can Try again or Save a copy of the raw data; when the newest copy is damaged but an earlier complete copy exists, you can confirm Continue with the earlier copy, and the damaged one is kept first.",
      ],
    },
  },
  {
    version: "10.35",
    date: "2026-11-13",
    zh: {
      title: "Captain：打开就知道现在可以做什么",
      items: [
        "打开 Captain，最上面是一张小卡片：一句适合现在的话，加上一两个点了就会做的按钮。还没记录时是〔选照片〕〔随手写〕；刚收好一页时是〔写一句话〕或〔继续编辑〕和〔看看成品〕；今天已经记过时是〔翻翻今天〕；刚翻完以前的一天时是〔继续翻阅〕。",
        "不再列四行固定的功能。想整理今天、回顾以前，直接在聊天里说就好。",
        "请 Captain 代写时，它会直说还不会，并给你能直接开始的按钮。",
        "每次打开换一句话，不会一直重复同一句。",
        "在 Mac 上试本机模型时，如果模型没有回应，回复下面会写明这是简单回复。",
      ],
    },
    en: {
      title: "Captain: what you can do now, right when you open it",
      items: [
        "Captain opens on a small card: one line for this moment and one or two buttons that really do it — Pick photos / Just write before anything is kept; Add a line (or Keep editing) / See the page right after a page; Open today once today is kept; Keep reading after looking back at an older day.",
        "No fixed list of four any more. To sort out today or look back, just say so in the chat.",
        "Asked to write for you, Captain says it can't yet and offers buttons that start a page.",
        "A different line each time you open it.",
        "When the model on your Mac doesn't answer, the reply says it's the simple one.",
      ],
    },
  },
  {
    version: "10.34",
    date: "2026-11-13",
    zh: {
      title: "放不下一页时，建议分成两页，由你决定",
      items: [
        "照片和文字实在太多、怎么排都会太挤时，「今天的故事」底部会出现建议卡：左边是现在的一页，旁边是分开后的每一页。",
        "〔分成 2 页〕：照片按原来的顺序分开，那句话放在第一页，每张照片的字跟着照片走。〔保持一页〕：也可以，卡片会说明哪里会比较挤；文字仍然不会压在照片上。",
        "不会自动加页，已保存的页面也不会被重新排版。",
        "修复：换照片后再调整照片分组，旧照片会被换回来的问题。",
      ],
    },
    en: {
      title: "Too much for one page? A suggested split — your call",
      items: [
        "When the photos and words can't fit one page without crowding, Today's story shows a card: the page as it is now, next to each page of a split.",
        "\u201cMake 2 pages\u201d keeps the photos in order, your line on the first page and each photo's words with its photo. \u201cKeep one page\u201d is fine too — the card says what will be tight, and words still never sit on a photo.",
        "Pages are never added on their own, and saved pages are never re-laid out.",
        "Fixed: after replacing a photo, regrouping the photos brought the old photo back.",
      ],
    },
  },
  {
    version: "10.33",
    date: "2026-11-13",
    zh: {
      title: "自动排版：照片不再被挤得很小，字不再压到照片上",
      items: [
        "排版时按你选的字体和字号量出文字真实占几行，不再靠字数估算。",
        "每张照片都有最小尺寸；很高的截图、Meme 会留得更宽，上面的字看得清。照片不裁切。",
        "长的一句话改成正文大小显示，不缩小、不截断；照片下面的字和照片一样宽，不会伸到旁边的照片上。",
        "「换个排版」只给出合格而且彼此不同的排法，不再出现几张一样的小图。",
      ],
    },
    en: {
      title: "Auto layout: no tiny photos, no words on photos",
      items: [
        "Words are measured in the font and size you chose, by the lines they really take — no more guessing from the character count.",
        "Every photo has a minimum size; tall screenshots and memes get more width so their own text stays readable. Photos are never cropped.",
        "A long line is shown at reading size, never shrunk or cut; the words under a photo are as wide as the photo and no longer reach the next one.",
        "\u201cAnother layout\u201d only offers layouts that pass and differ from each other — no more identical thumbnails.",
      ],
    },
  },
  {
    version: "10.32",
    date: "2026-11-13",
    zh: {
      title: "「今天怎么记？」：视频、声音、自由排版一打开就能看到",
      items: [
        "视频、声音、自由排版移到三张主卡片正下方，打开就能看到，不用往下找。",
        "「照片 + 一句话」仍然是第一张、最显眼的卡片；第一次打开时默认选它，之后记得你上次用的方式。",
        "选「视频」后，照片相关的选项会换成视频说明，按钮变成「选一段视频」，直接打开视频导入；选好的书和日期都保留。声音、自由排版也一样。",
      ],
    },
    en: {
      title: "\u201cHow shall we keep today?\u201d: video, sound and free layout right there",
      items: [
        "Video, sound and free layout now sit right under the three main cards — visible as soon as the sheet opens.",
        "\u201cPhoto + a line\u201d is still the first and biggest card; it is chosen the first time, and after that the sheet remembers the way you used last.",
        "Choose Video and the photo options give way to a short note and a \u201cPick a video\u201d button that opens the video import; your book and date stay. Sound and free layout work the same way.",
      ],
    },
  },
  {
    version: "10.31",
    date: "2026-11-13",
    zh: {
      title: "快速编辑的按钮固定在屏幕底部",
      items: [
        "在屏幕比较高的 iPhone 上，「今天的故事」的 换照片 · 写文字 · 换个排版 · 保存 现在固定在屏幕底部，不再停在页面下方、留出一大片空白。",
      ],
    },
    en: {
      title: "Quick Edit buttons stay at the bottom of the screen",
      items: [
        "On taller iPhones the Photo · Words · Layout · Save buttons in Today's story now sit at the bottom of the screen instead of just under the page with empty space below.",
      ],
    },
  },
  {
    version: "10.30",
    date: "2026-11-13",
    zh: {
      title: "多张照片配一段长文字时，照片不再被挤得很小",
      items: [
        "两张照片配一段比较长的话：照片按并排 / 上下 / 错落排成均衡的一对，那段话放在照片下面（以前第二张会被挤得很小）。",
        "很多张照片配一段长话时：所有照片排成整齐的几行，不会再有照片缩成邮票大小。",
        "只影响新做的页面和你在「今天的故事」里换排版的页面；已经保存的页面不会变。",
      ],
    },
    en: {
      title: "Many photos and a long line: no more tiny photos",
      items: [
        "Two photos with a longer line: the photos make an even pair (side by side, stacked or staggered) and the line goes under them. Before, the second photo was squeezed small.",
        "Many photos with a long line: every photo goes into neat rows — none shrinks to the size of a stamp.",
        "Only new pages, and pages you re-lay out in Today's story, change; pages you already saved stay as they are.",
      ],
    },
  },
  {
    version: "10.29",
    date: "2026-11-13",
    zh: {
      title: "快速编辑：换照片、写文字、换排版，都在「今天的故事」里",
      items: [
        "底部变成四个按钮：换照片、写文字、换个排版、保存。「自定义」移到右上角，自由移动、图层这些都还在里面。",
        "点页面上的照片就能选中它（会描边并标出「第 2 张」），再点「替换这张照片」，不用进「自定义」。",
        "换照片时，这张照片的文字、整页的字体和风格都保留；新照片形状不同时，这一页会重新排，两张照片的排法（并排 / 上下 / 错落）不变。换完可以点「撤销」。",
        "你在「自定义」里调整过的页面，换照片时新照片放在原来的位置，其他都不动。",
        "「写文字」一打开就能直接输入；字体、字号、颜色收在「字体与样式」里，需要时再展开。不写也可以直接保存。",
        "「换个排版」里能看到三种排版的小图，下面一行是杂志 / 手账 / 拼贴风格；换排版或换风格都不会丢照片和文字。",
      ],
    },
    en: {
      title: "Quick Edit: change a photo, write, change the layout — all in Today's story",
      items: [
        "The bottom now has four buttons: Photo, Words, Layout and Save. Customize moved to the top right; free moving, layers and the rest are still there.",
        "Tap a photo on the page to choose it (it gets an outline and a “Photo 2” label), then “Replace this photo” — no need to open Customize.",
        "Replacing a photo keeps that photo's words and the page's type and style. If the new photo has another shape the page is laid out again, keeping the same arrangement for a pair (side by side / stacked / staggered). Undo is right there.",
        "On a page you arranged yourself in Customize, the new photo takes the old one's place and nothing else moves.",
        "Words opens ready to type; fonts, size and colours are folded into “Type & style” until you want them. Words are optional — you can just save.",
        "Layout shows the three layouts as small previews, with the Magazine / Journal / Collage styles below. Changing either never loses a photo or a word.",
      ],
    },
  },
  {
    version: "10.28",
    date: "2026-11-13",
    zh: {
      title: "两张照片的排版更均衡",
      items: [
        "杂志风格里放两张照片、没有写标题时，不再一张大一张小，旁边也不再给没写的字留一栏空白。",
        "会在并排、上下、错落三种排法里，按照片形状、占满页面的程度和两张大小是否均衡，自动选最合适的一种；照片不裁切，截图上的字完整保留。",
        "两张照片形状差很多时（比如横图配竖的截图），小的那张会适当放大，两张看起来差不多大。",
        "点「重新排版」可以在三种排法之间切换，照片都保留。",
        "已经保存的页面、你自己在「自定义」里调整过的页面不会被自动重排。",
      ],
    },
    en: {
      title: "Two photos, better balanced",
      items: [
        "In the magazine style, two photos with no title are no longer one big and one small, with an empty column kept for words you didn't write.",
        "The page picks the best of three arrangements — side by side, stacked, or staggered — by the photos' shapes, how much of the page they fill and how even their sizes are. Photos are never cropped; the words in a screenshot stay whole.",
        "When the two shapes are very different (a landscape photo and a tall screenshot), the smaller one is given a little more room so the two look about the same size.",
        "“Re-layout” goes through the three arrangements; both photos always stay.",
        "Pages you already saved, and pages you arranged yourself in Customize, are never laid out again by themselves.",
      ],
    },
  },
  {
    version: "10.27",
    date: "2026-11-13",
    zh: {
      title: "标题完全可选：不再显示「未命名的一页」",
      items: [
        "不起标题也是完整的一页。日历、书架、首页、编辑器和阅读器里不会再出现「未命名的一页」「未命名的小日子」。",
        "没有标题时，按你已有的内容显示，比如「11:05 · 2 张照片」，或你写的那句话的开头。这只是显示方式，不会替你填标题。",
        "日历里这一天的页面列表多了小图，同一天的几页一眼就能分清；点一行直接打开阅读器里的那一页。",
        "想起名字时，点「起个名字（选填）」；删掉标题后，又会按内容显示。照片和文字都不受影响。",
        "Captain 不再提醒「有几页还没有名字」。",
        "阅读器里的照片不会再出现蓝色的焦点框。",
      ],
    },
    en: {
      title: "Titles are optional: no more “Untitled page”",
      items: [
        "A page without a title is a whole page. The calendar, your books, Home, the editor and the reader no longer say “Untitled page” or “An untitled little day”.",
        "Without a title a page is shown by what it has — “11:05 · 2 photos”, or the start of the line you wrote. This is only how it's shown; your title stays empty.",
        "The day's page list in the calendar has a small picture for each page, so pages on the same day are easy to tell apart; tap one to open that page in the reader.",
        "To name a page, tap “Add a name (optional)”; delete the name and the page is shown by what it has again. Photos and words are untouched.",
        "Captain no longer reminds you that pages have no name.",
        "Photos in the reader no longer show a blue focus ring.",
      ],
    },
  },
  {
    version: "10.26",
    date: "2026-11-13",
    zh: {
      title: "「检查照片和视频」说得更准确",
      items: [
        "在 iPhone 上，视频要先点一下才会被读取，所以检查时打不开视频不再算作「解码失败」，而是单独写成「视频没有打开检查」，不代表文件坏了。",
        "导入视频或音频失败时，本机记录里会写明是「等了 10 秒还没读到」还是播放器给出的具体错误编号，方便找原因。记录里没有文件名和内容。",
      ],
    },
    en: {
      title: "Check photos & videos is more precise",
      items: [
        "On iPhone a video is only read after a tap, so a video the check could not open is no longer counted as “decode failed”; it is listed as “video not opened”, which does not mean the file is broken.",
        "When importing a video or sound fails, the local log now says whether nothing loaded within 10 seconds or which player error code came back. The log has no file names or content.",
      ],
    },
  },
  {
    version: "10.25",
    date: "2026-11-13",
    zh: {
      title: "编辑器整理：选中什么就改什么，「更多」分成三组",
      items: [
        "选中照片、文字、视频或贴纸后，工具栏上方会写着「照片 · 已选中」，最左边是「← 返回」（回到照片 · 文字 · 贴纸 · 更多），不再是 ×；× 只用来关面板。",
        "形状、字体、颜色、对齐、图层改成工具栏上方的细选项条，打开时纸张只缩小一点，改动看得清楚。",
        "图层只放最常用的：上移、下移、置顶、置底、复制；位置和大小的精确数值收在「精确调整」里。",
        "选中贴纸后可以「换一个」：位置、大小和角度都不变。",
        "「更多」分成三组：页面外观（背景与纸张、排版、页面字体）、媒体与创作（手绘排第一，还有视频、音频、配乐、本页媒体）、页面管理（页面信息、心情、页面目录、操作指南）；「换一种写法」放在最下面。",
        "「目录」和「页面管理」合并成「页面目录」：点一页就跳过去，可以上下移动、复制、删除；「只保存这一页」等操作在「更多页面操作」里。「本页照片」和下面的「照片」重复，已经去掉。",
        "操作指南改为四步：加东西、摆位置、改它、改整页。看过旧指南的人不会再自动弹出，可以在「更多 → 操作指南」重看。",
      ],
    },
    en: {
      title: "A tidier editor: change what you selected, and More in three groups",
      items: [
        "A selected photo, text, video or sticker is named above its tools (“Photo · selected”), and the first button is ← Back to Photo · Text · Stickers · More — not ×; × only closes sheets.",
        "Shape, Font, Colour, Align and Layer open as a compact strip above the tools, so the paper stays big and you can see the change.",
        "Layer keeps what you need most: up, down, to front, to back, duplicate; exact numbers are under Exact position & size.",
        "A selected sticker can be swapped — same place, size and angle.",
        "More has three groups: Page look (background & paper, layout, page font), Media & making (Draw first, then video, audio, music, page media) and Pages & info (page details, mood, pages, guide); Style is at the bottom.",
        "Contents and Pages are one Pages list: tap a page to go there, move it, duplicate or delete it; save-one-page and similar actions are under More page actions. “This page's photos” repeated Photo below and is gone.",
        "The guide is now four steps: add things, place them, change one, the whole page. If you saw the old guide it won't pop up again — replay it from More → Guide.",
      ],
    },
  },
  {
    version: "10.24",
    date: "2026-11-13",
    zh: {
      title: "心情记在每一页上；背景和纸张互相替换",
      items: [
        "心情现在是每一页的可选信息：在「页面信息」里选，「更多 → 心情」也能直接打开。五个心情是 开心 · 温暖 · 平静 · 低落 · 雀跃，可以随时更改或清除，不会画到纸上。",
        "新的一天不再自动带上 ☀️；以前的日子保留原来的心情，不做改动。",
        "选背景（风景照片、渐变、图案）会替换纸张，选纸张也会替换背景，不用先撤销；需要的话撤销可以换回来。",
        "打字时，字体和 B I U S 工具条会贴在键盘正上方。",
        "小修正：贴纸面板的标题改为「贴纸」；「更多」里的「版式」统一叫「排版」；形状面板不再出现跳回「更多」的返回箭头；在页面上加照片后，不再弹出提示挡住纸张。",
      ],
    },
    en: {
      title: "Mood belongs to each page; background and paper replace each other",
      items: [
        "Mood is now optional page information: choose it in Page details, or go straight there from More → Mood. Happy · Warm · Calm · Low · Excited — change or clear it any time; it is never drawn on the paper.",
        "A new day no longer starts with ☀️; earlier days keep the mood they had.",
        "Choosing a background (scenery, gradient, pattern) replaces the paper, and choosing a paper replaces the background — no undo needed first (undo still brings it back).",
        "While typing, the font and B I U S bar sits right above the keyboard.",
        "Small fixes: the sticker sheet is titled Stickers; More says Layout everywhere; the Shape sheet no longer has a back arrow into More; adding photos no longer shows a message over the paper.",
      ],
    },
  },
  {
    version: "10.23",
    date: "2026-11-12",
    zh: {
      title: "导入视频时看得到每一步，换封面更好找",
      items: [
        "导入视频时，页面上会出现一张卡片：先读取视频信息，再显示导入进度，然后是「正在保存到本机」「正在生成封面」，最后显示「已保存到本机」。",
        "保存过程中，页面条会变淡，卡片上写明「保存完成前，暂时不能切换页面」，不用等点了才知道；顶部只会显示「保存中」，不会提前显示「已保存」。",
        "没存进这台设备时，卡片会写明「保存失败」和原因，并提供「重试」；视频超过 50 MB 时会直接说明，页面不会被改动。",
        "选中视频后，下面依次是：播放、换封面、形状、图层、移除。",
        "「本页媒体」里，换封面和从页面移除两个大按钮就在视频正下方，375 和 430 宽的手机上都不用滚动；时长、大小和「已保存到本机」放在下面的小字里。",
        "换封面会显示现在的封面，拖动时间轴选一帧，点完成保存；原视频不会被改动，阅读模式里也用新封面。",
        "「从纸上拿下」改为两个更清楚的操作：「从页面移除」（会先确认，可以撤销），以及「不放在纸上」（仍保留在本页媒体里）。",
      ],
    },
    en: {
      title: "See every step of importing a video, and find the cover easily",
      items: [
        "Importing a video shows a card on the page: reading the file, importing with progress, saving to this device, making a cover, then “Saved on this device”.",
        "While it saves, the page strip dims and the card says pages can't be switched until it's saved — before you tap; the top only says “Saving”, never “Saved” too early.",
        "If it can't be stored on this device, the card says “Not saved” and why, with Retry; a video over 50 MB is refused right away and the page is unchanged.",
        "A selected video's tools are: Play, Cover, Shape, Layer, Remove.",
        "In the page's media list, Cover and Remove from page are big buttons right under the video — no scrolling on 375 or 430-wide phones; length, size and “Saved on this device” are the small print.",
        "Cover shows the cover in use; drag the timeline to pick a frame and tap Done. The video itself is never changed, and the reader uses the new cover.",
        "“Take off the page” is now two clear actions: “Remove from page” (asks first, undo works) and “Off the paper” (stays in the page's media list).",
      ],
    },
  },
  {
    version: "10.22",
    date: "2026-11-12",
    zh: {
      title: "新增「检查照片和视频」，帮我们找到照片打不开的原因",
      items: [
        "设置 → 数据与隐私里新增「检查照片和视频」：逐个检查这台设备上手帐用到的照片、视频和声音，分清是「文件不在」「文件在但读不出来」「读得出但打不开」还是「页面引用不对」。",
        "同时显示运行环境：浏览器内核、运行地址、是不是嵌在其他页面里、存储会不会被系统自动清理、还剩多少空间。",
        "检查只读取，不会修改、转换、删除或上传任何东西；结果里没有名字和文字，可以一键复制发给开发者。",
        "照片或视频出问题时，本机记录会写下是哪一步出的问题（保存、读取、临时地址失效、解码）和错误类型，方便查原因。",
      ],
    },
    en: {
      title: "New “Check photos & videos” to find out why a photo won't open",
      items: [
        "Settings → Data & privacy has a new “Check photos & videos”: every photo, video and sound your pages use is checked and sorted into missing, stored but unreadable, read but won't open, or an invalid reference.",
        "It also shows where the app runs: browser engine, address, whether it is embedded in another page, whether storage may be cleared by the system, and space left.",
        "The check only reads — nothing is changed, converted, deleted or uploaded — and the result has no names or words, so it can be copied to the developer.",
        "When a photo or video fails, the local log now notes which step failed (save, read, temporary address, decode) and the error type.",
      ],
    },
  },
  {
    version: "10.21",
    date: "2026-11-12",
    zh: {
      title: "照片和视频存得更牢，出问题会如实告诉你",
      items: [
        "新加的照片和视频现在按原始文件内容存进这台设备，存完会马上读回来核对一遍，确认无误才算存好。",
        "以前存下的照片和视频照常打开，第一次打开时会悄悄换成更稳的存法：同一个文件、同一个编号，不删除任何东西。",
        "右上角的「已保存」只有在这一页用到的照片和视频都确实存在时才会出现；有文件没存进去时会显示「保存失败」，告诉你是几个照片或视频，请你重新添加；文字照常保存。",
        "如果某张照片真的读取不到，页面上会写着「照片读取不到」，不会换成别的图片；页面里的文字和其他内容都不受影响。",
        "照片或视频偶尔加载失败时会自动重新读取一次。",
        "备份会把照片和视频本身一起导出；恢复到另一台设备后都能打开。",
      ],
    },
    en: {
      title: "Photos and videos are kept more safely — and you're told if one is missing",
      items: [
        "New photos and videos are stored on this device as their original file contents, read back and checked right after saving.",
        "Photos and videos saved before open as usual, and move to the safer storage the first time they open — same file, same id, nothing deleted.",
        "“Saved” at the top only appears when every photo and video on the page is really there; if one isn't, it says “Not saved”, how many photos or videos to add again, and that your words are kept.",
        "A photo that really can't be read says “Photo can't be read” on the page instead of showing another picture; the words and everything else stay.",
        "A photo or video that fails to load is read again once, automatically.",
        "Backups include the photos and videos themselves, and open after restoring on another device.",
      ],
    },
  },
  {
    version: "10.20",
    date: "2026-11-12",
    zh: {
      title: "照片的形状、裁剪和排版分开了",
      items: [
        "加照片后不会再自动弹出排版：一张照片会直接选中；多张时下面会出现一条「试试排版」的小提示，不想用点 × 就好。",
        "选中照片后，下面依次是：形状、裁剪画面、调整、替换、图层、删除。",
        "「形状」只改照片框的样子（圆形、拱形、心形、相框、胶带……），不会改动照片里显示的部分。",
        "「裁剪画面」是全屏的：拖四个角和四条边选范围，单指拖动画面、双指缩放，可选原比例、1:1、3:4、16:9 等，也能旋转 90°。",
        "裁剪不会改动原图，随时可以重新裁或恢复；可以撤销 / 重做，阅读模式和导出也会按裁好的样子显示。",
        "多张照片时，「试试排版」的提示不会再挡住下面的页面条。",
      ],
    },
    en: {
      title: "Shape, crop and layout are now separate",
      items: [
        "Adding photos no longer opens Layout: one photo is selected right away; with several, a small “Try a layout” hint appears — tap × to ignore it.",
        "A selected photo's tools are: Shape, Crop, Adjust, Replace, Layer, Delete.",
        "Shape only changes the frame (circle, arch, heart, frames, tape…), never which part of the photo shows.",
        "Crop is full screen: drag the corners and edges, move the picture with one finger, pinch to zoom, pick Original, 1:1, 3:4, 16:9… and rotate 90°.",
        "Cropping never changes the original photo — re-crop or reset any time; undo / redo work, and the reader and exports show the crop.",
        "With several photos, the layout hint no longer covers the page strip.",
      ],
    },
  },
  {
    version: "10.19",
    date: "2026-11-12",
    zh: {
      title: "杂志模式：每张照片写一句，直接换字体",
      items: [
        "「Aa 改文字」现在以照片为主：上面一排是这个 Moment 的真实照片缩略图，标着 1、2、3，点哪张就给哪张写一句；也可以写一句给整个 Moment。",
        "拍摄时间相同的照片也分得清：每句话都跟着那张照片走，排版时就放在那张照片的下面（放不下时放在上面），不会跑到别的照片旁边。",
        "切换照片、换杂志 / 手账 / 拼贴、重新排版、调整分组，写好的字都还在，并且仍然对着原来的照片。",
        "在同一个面板里直接换字体（宋体、黑体、楷体、文楷……）、大小、加粗、颜色和对齐，上面的页面马上就变；进入「自定义」后这些样式也都保留。",
        "直接点页面上的某张照片，就会打开那张照片的文字。",
      ],
    },
    en: {
      title: "Magazine view: a line for each photo, and fonts right there",
      items: [
        "“Aa Edit words” is now photo by photo: a row of the Moment's real thumbnails, numbered 1, 2, 3 — tap one to write its line, or write one line for the whole Moment.",
        "Photos taken at the same minute are told apart: each line belongs to its photo and is laid out right under it (or above when there's no room), never beside another one.",
        "Switching photos, styles (Editorial / Cozy / Collage), re-layout or regrouping keeps every line with its own photo.",
        "Change the font (Song, Hei, Kai, WenKai…), size, bold, colour and alignment in the same sheet and see the page change at once; Customize keeps it all.",
        "Tap a photo on the page to open its line directly.",
      ],
    },
  },
  {
    version: "10.18",
    date: "2026-11-12",
    zh: {
      title: "Captain 听得懂更多日常的话了",
      items: [
        "问 Captain 叫什么、几岁、喜欢吃什么，说你饿了、好忙、无聊、紧张、睡不着、想家，或者考砸了、升职了、过生日，Captain 都会接上对应的话。",
        "告诉它你做了什么（比如「今天吃了火锅」），它会用你的话接着问：「火锅！听起来不错。最喜欢哪一刻？」",
        "不知道写什么时跟它说一声，它会给你一个小题目；无聊时它会邀请你去「玩耍」丢毛线球。",
        "答不上来的问题，它会老实说「这个问题难倒我了」；难过的日子不说「别难过」，只是陪着你。",
        "这些都在你的设备上完成，不是 AI，也不会把你的话发到任何地方。",
      ],
    },
    en: {
      title: "Captain understands more everyday lines",
      items: [
        "Ask Captain's name, age or favourite food; say you're hungry, busy, bored, nervous, can't sleep, miss home, had a rough day, got good news or it's your birthday — Captain answers to fit.",
        "Tell it what you did (“I had coffee with a friend”) and it picks up your words: “Oh, coffee! Sounds nice. What was the best moment?”",
        "Not sure what to write? Say so and get a small prompt. Bored? Captain invites you to Play with the yarn ball.",
        "Questions it can't answer get an honest “that one's beyond me”; on hard days it never says “don't be sad” — it just stays with you.",
        "All on your device — not AI, and nothing you say is sent anywhere.",
      ],
    },
  },
  {
    version: "10.17",
    date: "2026-11-12",
    zh: {
      title: "和 Captain 玩毛线球：拖一拖、点一点，Captain 会接住",
      items: [
        "Captain's Corner 的「玩耍」变成一个大舞台：按住粉色毛线球拖到 Captain 爪子边松手，Captain 会抱住它开心大笑；丢到别处，球会自己滚回来。",
        "点一下毛线球，它会自己滚过去；戳戳 Captain 的身体，也会看到它开心的样子。",
        "柠檬帽和无帽都能玩，各用各的画：无帽版现在只有静态画，戳它会开心地跳一下。不会突然换装扮。",
        "还没画好的摸摸头、挠肚皮先收起来，不再显示「准备中」。",
        "系统开了「减少动态效果」时，只显示一张开心的画，不播放动画。iPhone App 里接住毛线球时会有一下轻轻的震动。",
      ],
    },
    en: {
      title: "Play yarn with Captain: drag it, tap it — Captain catches it",
      items: [
        "Play in Captain's Corner is now a big stage: drag the pink yarn ball to Captain's paws and let go — Captain hugs it and giggles; drop it elsewhere and it rolls back.",
        "Tap the ball and it rolls over by itself; poke Captain for a happy moment too.",
        "Both the lemon hat and no hat can play, each with its own pictures — the no-hat look only has a still for now and gives a happy hop. The look never switches by itself.",
        "Pat and tummy rub are tucked away until their art is ready — no more “coming soon”.",
        "With Reduce Motion on, one happy picture is shown instead of the animation. The iPhone app gives a light tap when Captain catches the ball.",
      ],
    },
  },
  {
    version: "10.16.1",
    date: "2026-11-12",
    zh: {
      title: "细节打磨：欢迎页换上 App 图标和小芽字标，五种字母印记更统一",
      items: [
        "欢迎页（实验室里才会出现）用 App 图标和带小芽的开铺手帐字标，去掉了像素小花和散落的表情。",
        "Apple 登录、邮箱登录还没有开放，只放在欢迎页底部标着「实验室 · 还没有开放」的虚线框里，不能点。",
        "五种字母印记的字母大小、边框粗细统一了：牛皮纸的字母变大，朱印的双圈变轻，手写体的中文不再压到下划线。",
        "选中的印记只有一圈细细的绿色描边，不再显得太重。",
      ],
    },
    en: {
      title: "Polish: the welcome page wears the app icon and sprout wordmark; the five monograms match",
      items: [
        "The welcome page (only in Labs) now shows the app icon and the Capiday wordmark with its sprout, instead of a pixel flower and scattered emoji.",
        "Apple and email sign-in are not available yet: they sit, disabled, in a dashed tray labelled “Labs · not available yet”.",
        "The five monograms now share one letter size and ring weight: Kraft's letter is larger, Seal's double ring lighter, and Script's Chinese no longer touches its stroke.",
        "The chosen monogram has one thin sage ring instead of a heavy outline.",
      ],
    },
  },
  {
    version: "10.16",
    date: "2026-11-11",
    zh: {
      title: "你的个人标记；日记音乐点了才响；同一天的每一页都能直接打开",
      items: [
        "编辑资料换成「属于你的小世界」：五种字母印记（纸片、朱印、牛皮纸、鼠尾草、手写）用你名字的第一个字，另外还有小芽。没选的时候显示小芽。",
        "以前选的表情头像会一直保留，在编辑资料里显示为「现在的头像」，只是不再提供新的表情选项。",
        "欢迎页只留名字和你现在的头像，挑头像在「设置 → 编辑资料」。",
        "看某一天的手帐时，背景音乐默认不响，点音乐按钮才播放，可以暂停；换到另一天也不会突然响。",
        "书本页里，同一天有好几页时，会显示这一天的每一页，点哪页就在阅读器打开哪页。",
      ],
    },
    en: {
      title: "Your own mark; a day's music plays only when tapped; every page of a day one tap away",
      items: [
        "Edit profile is now “A little world of your own”: five monograms of your name's first letter (Paper, Seal, Kraft, Sage, Script) and the sprout, which also shows when nothing is chosen.",
        "An emoji avatar you chose before stays, shown as “Current avatar”; new emoji are no longer offered.",
        "The welcome page keeps just your name and current mark — choose a mark in Settings → Edit profile.",
        "Reading a day, its music is silent until you tap it, and can be paused; moving to another day never starts it by surprise.",
        "In a book, a day with several pages shows each of them — tap one to open the reader right there.",
      ],
    },
  },
  {
    version: "10.15",
    date: "2026-11-11",
    zh: {
      title: "开发用的 Captain 本地对话：第 3 版（这个链接里看不到变化）",
      items: [
        "在 Mac 上用本机 Qwen 实测了三版说法：现在不再一直「喵」，也不会反复提帽子、尾巴和阳光，夸它时它知道是在夸自己。",
        "如果模型的回复和你说的语言不一样（比如你说中文它回英文），App 不会显示这句，改用 Captain 原来的回答。",
        "这些只在 Mac 上开发时使用，默认关闭；这个链接和 iPhone App 里的 Captain 不变。",
      ],
    },
    en: {
      title: "Captain's development-only local chat: version 3 (nothing changes in this link)",
      items: [
        "Three versions were tested with Qwen on the Mac: no more “meow” in every line, no more hat / tail / sunshine over and over, and a compliment is understood as being about Captain.",
        "If the model answers in a different language from yours (you write Chinese, it answers in English), the app drops that line and Captain answers the usual way.",
        "Only used while developing on a Mac and off by default; Captain in this link and the iPhone app is unchanged.",
      ],
    },
  },
  {
    version: "10.14",
    date: "2026-11-11",
    zh: {
      title: "iPhone App 第一次在模拟器里跑起来了",
      items: [
        "开铺手帐的 iPhone App 第一次在 Mac 的 Xcode 模拟器里构建并运行成功：首页、日历、书架和写手帐的页面都能正常打开。",
        "修好了操作指南在 iPhone App 里的位置：绿色圆环原来会比纸张低一截，现在会跟着纸张走，准确圈住要讲的地方。",
        "开发用的 Captain 本地模型对话换了一版说法：不再一直「喵」，不猜你的手帐里写了什么，也不老是劝你去写。这个只在 Mac 上开发时使用，这个链接里看不到。",
      ],
    },
    en: {
      title: "The iPhone app runs in the Simulator for the first time",
      items: [
        "The Capiday iPhone app was built and run in Xcode's Simulator on a Mac for the first time: Home, Calendar, the shelf and the page editor all open.",
        "Fixed the guide's position in the iPhone app: the green ring used to sit a little below the page; it now follows the page and circles the right spot.",
        "Captain's development-only local-model chat got a new voice: no more \u201cmeow\u201d in every line, no guessing what's in your journal, no nudging you to write. It is only used while developing on a Mac — not in this link.",
      ],
    },
  },
  {
    version: "10.13",
    date: "2026-11-11",
    zh: {
      title: "为在 Mac 上开发做准备（这个链接里看不到变化）",
      items: [
        "新增 Mac 本地开发说明和检查脚本：用于在你自己的 Mac 上运行网页预览、iPhone 模拟器，以及本地运行的 Qwen 模型（Ollama）。",
        "Captain 可以在开发时接入本机的 Qwen 模型来聊天：默认关闭，只有在 Mac 上用开发命令打开时才会启用；这个链接和 iPhone App 里都不会使用。",
        "接入后也只会发送你在 Captain 面板里打的那句话，不会发送手帐、照片或声音；模型没启动时，Captain 照常用原来的方式回答。",
      ],
    },
    en: {
      title: "Getting ready to develop on a Mac (nothing changes in this link)",
      items: [
        "New Mac development guide and check script: run the web preview, the iPhone Simulator and a Qwen model on your own Mac (Ollama).",
        "During development, Captain can chat through the Qwen model on that Mac. It is off by default and only turned on with a developer command on the Mac — never in this link or the iPhone app.",
        "Even then, only the line you type to Captain is sent — never your journal, photos or sound. When the model isn't running, Captain answers as before.",
      ],
    },
  },
  {
    version: "10.12",
    date: "2026-11-11",
    zh: {
      title: "排版更顺手：双击就能写字",
      items: [
        "轻点文字框是选中；双击直接开始写（键盘会出来），也可以继续点下方的「编辑」。单击不会再意外进入输入。",
        "按住文字框任何地方拖动都只会移动它。手指轻微抖动不再算作移动。",
        "控制点挪到了框外面：上方的 ↻ 转角度，角上的圆点改大小。它们不再盖住文字，触控范围也不会互相抢。放大缩小时控制点大小不变，转过角度的文字框也一样好用。",
        "文字颜色修好了：打字时点工具条上的颜色圆点就会展开整排颜色（‹ 返回），不会再被挤得点不到；「颜色」面板里当前颜色有勾选标记。新增橄榄绿和纸白（适合写在照片上），改完会自动保存。",
        "第一次打开编辑器时有三步小引导：移动元素、双击编辑文字、用控制点调整布局。可以跳过，只出现一次；之后在「更多 → 操作指南」随时再看。已经写过手帐的人不会因为更新被重新教学。",
        "第一次选中文字框时，会有一句「双击即可编辑文字」的小提示，只出现一次。",
      ],
    },
    en: {
      title: "Easier layout: double-tap to write",
      items: [
        "Tap a text box to select it; double-tap to start typing (the keyboard opens), or use Edit below. A single tap never starts typing by surprise.",
        "Press anywhere on a text box and drag: it only moves. A small wobble of the finger is no longer a move.",
        "The handles now sit outside the box: ↻ above turns it, the corner dot resizes it. They no longer cover the words or fight each other for your finger, keep their size when you zoom, and work on turned boxes too.",
        "Text colour fixed: while typing, tap the colour dot in the bar to open the full row of colours (‹ back) — no more slivers too small to tap — and the Colour sheet marks the colour in use. New: olive and paper white (for words on a photo). Changes save by themselves.",
        "A three-step guide the first time you open the editor: move things, double-tap to edit words, adjust with the handles. Skip it any time; it shows once, and More → How to opens it again. People who already keep pages are not taught again because of an update.",
        "The first time you select a text box, a small “Double-tap to edit the words” tip points at it — once.",
      ],
    },
  },
  {
    version: "10.11",
    date: "2026-11-11",
    zh: {
      title: "翻开一本手帐：全屏阅读",
      items: [
        "书本页最上面是「开始翻阅」（读过之后是「继续翻阅 · 第 N 页」，旁边可以「从封面开始」）；点封面也能翻开。「记录新的一页」和 PDF 分享放在下面。",
        "阅读时整个屏幕都是这本书，底部导航先收起来。书页保持原来的 4:5，照片、贴纸、文字格式都和编辑时一样，不会被裁切。",
        "封面不算页数：封面写「封面 · 共 8 页」，内页从「第 1 / 8 页」到「第 8 / 8 页」。",
        "左右滑动翻页，也可以点左右边缘；点中间显示或隐藏按钮。双击照片放大看，可以双指缩放和拖动；双指也能放大整页看小字。视频和声音只在你点了之后才播放。",
        "这本书的背景音乐默认不响，点右下角的 ♪ 才开始，可以暂停再继续。",
        "页面列表里点某一天，直接翻到那天的第一页；封面也在列表最前面。右下角的「所有页面」可以一下跳到任意一页。",
        "在阅读中点「编辑」，改完点完成或保存草稿，都会回到刚才那一页，显示最新的样子；新写好的一页保存后也会直接在阅读里打开。",
        "放不下的长文字，书页保持原样，下面有「阅读全文」。",
        "离开再回来，会记得读到哪一页（只记在这台设备上）。支持「减少动态效果」。",
      ],
    },
    en: {
      title: "Open a journal: full-screen reading",
      items: [
        "A book page now starts with “Read Book” (after reading, “Continue reading · page N”, with “Start from the cover”); tapping the cover opens it too. “Write a new page” and PDF sharing sit below.",
        "While reading, the book fills the screen and the bottom menu steps away. Pages keep their 4:5 shape with photos, stickers and text formatting exactly as made — never cropped.",
        "The cover is not a page: it reads “Cover · 8 pages”; pages go from “Page 1 of 8” to “Page 8 of 8”.",
        "Swipe or tap the left / right edge to turn; tap the middle to show or hide the controls. Double-tap a photo to look closely (pinch and drag); pinch the page to read small words. Video and sound play only when you tap them.",
        "The book's music is silent by default — tap ♪ to play, pause and continue.",
        "In the page list, a day opens straight at its first page; the cover is listed first. “All pages” jumps to any page.",
        "Edit from the reader, then finish or keep a draft: you come back to the same page, showing the change. A newly saved page also opens in the reader.",
        "Long words that don't fit keep the page as it is, with “Read the full text” below.",
        "Your place is remembered (on this device only). Reduce Motion is respected.",
      ],
    },
  },
  {
    version: "10.10",
    date: "2026-11-11",
    zh: {
      title: "设置页的小打磨",
      items: [
        "还没起名字时，顶部显示「我的小世界」和「给这个世界起个名字吧」，头像是一株小嫩芽，不再显示「还没有名字」。起了名字显示名字的首字；选过的头像照旧保留。",
        "Little Keeper 区域的 Captain 变大了一些，旁边多了「和 Captain 玩一会儿」，打开 Captain 的小角落（聊天、装扮都在那里）；设置页本身只管设置。",
        "数据与隐私更简洁：「备份与恢复」放在最前面，导出按钮更醒目；每一行只留一句说明。完整的隐私说明（备份文件的注意事项、大小限制、两个开关的细节、AI 的说明）都在「隐私说明」里，一条没少。",
        "检查了 iPhone 375 / 393 宽的屏幕：文字不小于 12px、多行文字有足够行距、开关和按钮至少 44px、最后一行不被底部导航挡住。顺手把「尚未接入」小标签调大了一点。",
        "六款主题颜色、中英文设置和你的偏好都没变。",
        "Captain 的小角落：键盘收起后，对话会停在最新一条。",
      ],
    },
    en: {
      title: "Small Settings polish",
      items: [
        "Before you choose a name, the top now reads “My little world” with “Give this world a name”, and a small sprout instead of “No name yet”. With a name it shows the first letter; an avatar you chose is kept.",
        "Captain is a little larger under Little Keeper, with a new “Spend a moment with Captain” that opens Captain's Corner (chat and looks live there); Settings itself stays for settings.",
        "Data & Privacy is calmer: Backup & restore comes first with a clearer export button, and each row has one line. The full privacy notes (backup safety, size limits, both switches in detail, AI) are all in Privacy notes.",
        "Checked on 375- and 393-wide iPhones: no text under 12px, enough room between lines, switches and buttons at least 44px, and the last row clear of the bottom bar. The “Not available yet” tag is slightly larger.",
        "The six colour themes, language and your preferences are unchanged.",
        "Captain's Corner: after the keyboard closes, the chat stays on the newest line.",
      ],
    },
  },
  {
    version: "10.9",
    date: "2026-11-11",
    zh: {
      title: "Captain 更懂你在说什么了；面板变成 Captain 的小角落",
      items: [
        "夸它、谢谢它、想摸摸它、问它在干嘛，Captain 都会好好回应，不再一律说「这个我还不会」。只有问「你会做什么」时，它才介绍自己能做的事。",
        "说「今天有点累，但是写完了一页」，它会先认可你写完了，而不是说「今天不写也没关系」。还没写、打算等会儿写、开心、难过也分开回应。",
        "听不懂的话，它会老实说没太懂，不会编事实，也不会假装理解。",
        "没有打开「翻看以前的页面」时，Captain 不会说出你页面的标题，也不再说「偷偷多看了两眼」这类话。",
        "面板顶部有三个标签：聊天、玩耍、装扮。「玩耍」（摸摸头、挠肚皮、玩毛线球）还在准备，要等正式动画画好，现在只说明即将到来。",
        "面板高度固定，发消息时不再跳动；点顶部的小横条或往上拉可以展开，往下拉先收回再关闭。聊起来以后，四个快捷操作会收成一行小按钮，自动滚到最新回复。",
        "仍然没有 AI，也不会发送任何内容。",
      ],
    },
    en: {
      title: "Captain gets what you mean a little better; the panel becomes Captain's Corner",
      items: [
        "Compliment it, thank it, want to pat it, ask what it's up to — Captain answers in kind instead of “I can't do that yet”. It lists what it can do only when you ask what it can do.",
        "Say “I'm tired, but I finished a page” and it recognises the page you finished rather than saying it's fine not to write. Not yet, later, happy and sad get their own replies too.",
        "When it doesn't understand, it says so plainly — no made-up facts, no pretending.",
        "Without “look at earlier pages” switched on, Captain never names your pages, and lines like “I sneaked a second look” are gone.",
        "Three tabs at the top: Chat, Play, Look. Play (head pats, belly rubs, the yarn ball) waits for Captain's real animation — for now it only says what's coming.",
        "The panel keeps one height, so it no longer jumps when you send; tap or pull up the little bar to expand, pull down to go back and then to close. Once you start chatting, the four shortcuts fold into one line and the newest reply stays in view.",
        "Still no AI, and nothing is sent anywhere.",
      ],
    },
  },
  {
    version: "10.8",
    date: "2026-11-11",
    zh: {
      title: "Captain 可以换装扮了（第一步）",
      items: [
        "Captain 面板的名字下面多了「装扮 ›」；设置 →「角色与装扮」里也有同一个选择。点一下就换，首页、面板、书架上的 Captain 一起变。",
        "现在有两个造型：柠檬帽（原来的样子），和抱着毛线球、不戴帽子的 Captain。",
        "没有金币、签到、亲密度，也不需要解锁——想换就换。",
        "小花夹子、毛线帽、青蛙帽、睡帽、围巾、铅笔、围裙还没有画稿。Captain 只用正式画稿，不用代码画，所以它们画好之后才会出现在这里。",
        "毛线球造型目前只有一张画（开心的样子），所以首页上是坐着的 Captain，而不是从卡片后面探头。",
      ],
    },
    en: {
      title: "Captain can change its look (first step)",
      items: [
        "Under Captain's name in the panel there is now “Look ›”; the same choice is in Settings → Character & look. One tap changes it — on Home, in the panel and by the shelf.",
        "Two looks for now: the lemon hat (as before), and Captain holding a ball of yarn, without a hat.",
        "No coins, check-ins or closeness levels, and nothing to unlock — change it whenever you like.",
        "Flower clip, knit hat, frog hat, sleep cap, scarf, pencil and apron have no artwork yet. Captain is only shown with real artwork, never drawn in code, so they will appear here once they are drawn.",
        "The yarn look has a single picture for now (happy), so on Home Captain sits there instead of peeking over the card.",
      ],
    },
  },
  {
    version: "10.7",
    date: "2026-11-11",
    zh: {
      title: "离开编辑器时：完成手帐、保存草稿，或继续编辑",
      items: [
        "编辑时点左上角返回，会问一句「要先收好这一页吗？」，三个选择：完成手帐、保存草稿、继续编辑。",
        "完成手帐：全部内容保存，这一天标记为「已完成」。以后还能再打开修改；不会发布或分享。和右上角的「完成」是同一个操作。",
        "保存草稿：封面、每一页、照片位置、文字格式都原样留着，这一天标记为「草稿」，下次从离开的那一页继续。",
        "继续编辑：关掉提示，纸面和选中的东西都不变。",
        "顶部现在同时显示两件事：「已保存」是内容已经存在这台设备上；下面一行小字「草稿 / 已完成」是这篇手帐做没做完。自动保存照常工作。",
        "草稿带一个低调的「草稿」标签：首页的故事卡片、书本里的页面列表、翻页、当天页面上都能看到；当天页面上有「继续编辑」。",
        "什么都没写就返回，直接离开，不留空草稿；只是打开看看已完成的手帐，返回时也不会问。",
        "如果保存失败，不会提示成功，也不会离开编辑器，内容留在页面上。",
        "以前用返回离开、没有点过「完成」的日子，现在会显示「草稿」；打开点一次「完成」即可。",
      ],
    },
    en: {
      title: "Leaving the editor: finish the entry, keep a draft, or keep editing",
      items: [
        "Tapping back while editing now asks “Put this away first?” with three choices: Finish entry, Keep as draft, Keep editing.",
        "Finish entry: everything is saved and the day is marked Completed. You can open and change it later; nothing is published or shared. It is the same step as Done at the top right.",
        "Keep as draft: the cover, every page, photo positions and text formatting stay as they are; the day is marked Draft and reopens on the page you left.",
        "Keep editing: the question closes; the paper and the selected item are unchanged.",
        "The top now shows two things: “Saved” means the content is stored on this device; the small line under it, Draft / Completed, says whether the entry is finished. Autosave works as before.",
        "A draft carries a quiet “Draft” tag: on Home's story card, in a book's page list, in the page reader and on the day page, which also has “Continue editing”.",
        "Going back with nothing written simply leaves (no empty draft); looking at a finished entry without changing it does not ask either.",
        "If saving fails, it never says it worked and the editor stays open with your work on the page.",
        "Days you left with back and never finished with Done now show “Draft”; open one and tap Done once.",
      ],
    },
  },
  {
    version: "10.6",
    date: "2026-11-11",
    action: "rich-demo",
    zh: {
      title: "文字可以只给几个字加粗、斜体、下划线了",
      action: "放一页格式示例到今天，试试看",
      items: [
        "在纸上打字时，文字工具条里多了 B / I / U / S：加粗、斜体、下划线、删除线。",
        "先选中几个字再点，只有这几个字变；同一段话里可以有普通、加粗、斜体、下划线，也可以叠加（比如又粗又带下划线）。",
        "没有选中文字、只有光标时点一下，接下来打的字就带这个格式；再点一下关掉。",
        "选中一个文本框（没有在打字）时，在「字体」面板里点 B / I / U / S 是给整个文本框加格式。",
        "按钮会亮起表示当前文字的格式；点按钮不会丢掉选中的文字。撤销 / 重做对格式同样有效。",
        "保存、刷新、再次编辑后格式都在；预览、翻页、导出的图片里样子一致。以前的纯文字手帐不受影响。",
        "中文字体没有真正的斜体，显示为向右倾斜的字。从别处粘贴进来的文字只保留文字本身，不带外面的字体、颜色和链接。",
        "顺便修了一个老问题：在文本框里打空格会被当成「打开图层面板」。",
      ],
    },
    en: {
      title: "Bold, italic and underline on just a few words",
      action: "Put an example page in today to try it",
      items: [
        "While typing on the paper, the text bar now has B / I / U / S: bold, italic, underline, strikethrough.",
        "Select a few words first and only they change; one paragraph can mix plain, bold, italic and underlined words, and looks can be combined (bold and underlined, say).",
        "With only a caret, tap one and the words you type next take that look; tap again to switch it off.",
        "With a text box selected (not being typed in), B / I / U / S in the Font panel format the whole box.",
        "The buttons light up to show the current look; tapping them does not lose the selected words. Undo / redo work for formatting too.",
        "The look stays after saving, reloading and editing again, and is the same in the preview, the page reader and exported pictures. Older plain-text pages are untouched.",
        "Chinese fonts have no true italic, so those words are shown slanted. Text pasted from elsewhere keeps only the words — no outside fonts, colours or links.",
        "Also fixed: a space typed inside a text box used to open the layer panel instead.",
      ],
    },
  },
  {
    version: "10.5",
    date: "2026-11-11",
    zh: {
      title: "Captain 面板：发送更清楚，没发出去的话不会丢",
      items: [
        "输入框右边是一个明显的「发送 ↑」按钮（鼠尾草绿）；没有字的时候是灰的，点不了。",
        "关闭只有右上角一个小小的 ×，也可以按住面板顶部往下拉；底部不再有任何会和「发送」混淆的关闭按钮。",
        "打了字没发就关掉面板，文字会留着；下次打开 Captain 还在。关闭面板不会自动发送，只有真的发出去才清空。",
        "回车是换行，不是发送；可以写几行。中文输入法还在选字时不会误发。",
        "发送后会先显示「正在想」的小圆点，这时不能重复发送。",
        "打字时面板里的快捷操作会先让开，输入框和发送按钮留在键盘上方。",
        "Captain 的样子、陪伴方式和回应内容都没变；这一版仍然没有 AI。",
      ],
    },
    en: {
      title: "Captain's panel: a clearer Send, and unsent words are kept",
      items: [
        "A clear sage “Send ↑” button sits right beside the field; it is grey and inactive while the field is empty.",
        "Closing is only the small × at the top right, or pulling the sheet down from its top; nothing at the bottom can be mistaken for Send any more.",
        "Words you typed but did not send stay when the panel closes, and are back the next time you open Captain. Closing never sends; the field empties only after a real send.",
        "Return adds a line instead of sending, so you can write a few lines. Nothing is sent while the Chinese input method is still choosing characters.",
        "After sending, small “thinking” dots show first, and a second send is blocked meanwhile.",
        "While typing, the shortcuts in the panel step aside so the field and Send stay above the keyboard.",
        "Captain's look, companion modes and replies are unchanged; there is still no AI in this version.",
      ],
    },
  },
  {
    version: "10.4",
    date: "2026-11-11",
    zh: {
      title: "设置页重新整理：My Capiday · 本机个人空间",
      items: [
        "设置页不再是 12 张大卡片，改成五组：个人资料、Little Keeper、外观与偏好、数据与隐私、关于与更多。整页长度不到原来的一半。",
        "最上面是「My Capiday · 本机个人空间」：如实写明资料和手帐只保存在这台设备、没有云端账号。点「编辑资料」可以改名字和头像。",
        "默认头像改成名字首字的圆形纸片；你选过的头像会继续保留。",
        "Little Keeper 只留预览和一行陪伴方式（安静 / 温柔 / 互动 / 关闭）；改名、翻看以前的页面、主动打招呼收进「角色与装扮」。",
        "主题颜色变成一行圆形色板；界面语言和每天提醒放在一起。",
        "数据与隐私：本机存储、备份与恢复、App 锁、两个隐私开关、隐私说明。「AI 小管家」标着「尚未接入」，开关不能打开——现在没有任何 AI。",
        "更新记录、功能介绍、许可证、示例内容、测试记录、实验室移到页面最下方，点开才显示。",
        "「退出登录」改名为「回到欢迎页（数据保留）」，只在实验室的登录页开启时出现——开铺手帐没有云端账号，谈不上退出。",
      ],
    },
    en: {
      title: "Settings, tidied: My Capiday · your space on this device",
      items: [
        "Settings is no longer twelve large cards but five groups: profile, Little Keeper, look & preferences, data & privacy, about & more. The page is less than half as long.",
        "At the top, “My Capiday · your space on this device”: it says plainly that profile and journals stay on this device and there is no cloud account. “Edit profile” changes the name and avatar.",
        "The default avatar is now a round paper chip with the first letter of your name; an avatar you chose is kept.",
        "Little Keeper keeps a preview and one line for the companion mode (Quiet / Gentle / Interactive / Off); renaming, looking back at earlier pages and greeting first moved into “Character & look”.",
        "Colour themes are a single row of round swatches; interface language and the daily reminder sit with them.",
        "Data & privacy: storage on this device, backup & restore, app lock, two privacy switches, privacy notes. “AI Keeper” is marked “Not available yet” and cannot be switched on — there is no AI at present.",
        "Update notes, feature tour, licences, sample content, test log and Labs moved to the bottom and open when tapped.",
        "“Sign out” is now “Back to the welcome page (data kept)”, shown only when the Labs sign-in page is on — Capiday has no cloud account to sign out of.",
      ],
    },
  },
  {
    version: "10.3",
    date: "2026-11-11",
    zh: {
      title: "Captain 会看情况说话了（不用 AI）",
      items: [
        "首页 Captain 旁边多了一个小标签「找 Captain」。点它或点 Captain，都会打开同一个面板。",
        "Captain 的第一句话会看今天的情况：今天写了几页、放了几张照片、最后一页叫什么、是不是很晚、是不是好几天没写。同一句话一周内不重复，也不会在你已经写过之后还问「今天有什么想记录的吗」。",
        "面板里可以和它说几句。它现在只会几件简单的事；不会的会直接说「这个我还不会」，不再对什么都回同一句。",
        "「整理今天的故事」：把今天的页面按时间排给你看，点哪一页就打开哪一页（只是展示，不改动手帐）。",
        "「回顾以前的回忆」：第一次会先问你能不能翻看以前的页面；同意后在这台设备上翻一页你自己的旧手帐。",
        "保存一页后「听听 Captain 怎么说」：会说这一页本身的事（几张照片、有没有声音、是不是今天的第一页）；去掉了每次都有的「（尾巴晃了晃）」。难过或很累的日子，仍然先回应你的心情。",
        "「帮我写一句话」需要 AI 小管家，现在还没有，面板里如实标着。这一版没有任何 AI，也不会发送你的手帐。",
      ],
    },
    en: {
      title: "Captain now speaks to the situation (no AI)",
      items: [
        "A small tag beside Captain on Home, “Ask Captain”. The tag and a tap on Captain open the same panel.",
        "Captain's first line fits the day: how many pages and photos today, the last page's name, whether it is late, whether it has been a few days. A line is not repeated within a week, and it no longer asks “anything to record today?” after you already wrote.",
        "You can say a few things to it. It only knows a few simple things for now; when it cannot help it says so instead of giving the same sentence to everything.",
        "“Sort out today's story”: today's pages in time order, each opening its own page (it only shows them; the journal is not changed).",
        "“Look back at a memory”: it asks first whether it may look at earlier pages; then it opens one of your own old pages, on this device.",
        "After saving a page, “Hear what Captain says” talks about the page itself (photos, sound, the first page today); the “(tail swishes)” after every reply is gone. Hard or tiring days are still met first.",
        "“Help me write a line” needs the AI keeper, which is not here yet — the panel says so. This version has no AI and sends nothing.",
      ],
    },
  },
  {
    version: "10.2",
    date: "2026-11-11",
    zh: {
      title: "首页往下滑：今天的故事和我的手帐",
      items: [
        "顶部不变。往下是「今天的故事」：同一天写的几页会排成一页回忆——照片来自当天各页，下面是标题和感想；其他页面各占一行，带着自己的时间和所属手帐。这只是展示方式，每一页的内容都没有被合并或改动，点哪一页就打开哪一页。",
        "只有文字的一页会显示成一张日记纸；长文字在首页折叠，点进去看全文。有视频或声音的页面会有标记。",
        "卡片下方多了「收藏于 · 手帐名」，点书名直接进那本手帐。",
        "今天还没记录时，会先请你开始写，再在下面放「最近的故事」（你自己最近的一篇，不会用示例冒充）。",
        "「今天要做的事」和习惯收成一行「今天的小计划」，点开才展开；展开或收起会记住。待办和习惯的数据都没有变。",
        "「我的手帐」：最近在写的那本放大，旁边只有一处「接着记一页」；其他手帐小一号立在旁边。「我的书 / 共同的书」切换在书架页。",
        "标题跟随语言：中文是「今天的故事 / 我的手帐」，英文是 Today's Story / My Library。",
        "修好：英文界面在小屏手机上，顶部「更多方式」下面的小字会把页面撑宽。",
      ],
    },
    en: {
      title: "Scrolling Home: Today's Story and My Library",
      items: [
        "The top is unchanged. Below it is Today's Story: the pages written on the same day are arranged as one memory — photos from across the day, then the title and words; each other page keeps its own line with its time and journal. It is only a way of showing them: no page is merged or changed, and each opens on its own.",
        "A page with only words is shown as a sheet of diary paper; long text is folded on Home and opens in full. Pages with video or sound are marked.",
        "Under the card, “In · journal name” opens that journal.",
        "With nothing written today you are invited to start, and your latest story is shown underneath (your own latest page, never a sample).",
        "To-dos and habits fold into one line, “Today's little plans”; it opens when tapped and remembers whether it was open. Their data is unchanged.",
        "My Library: the journal you are writing in is larger, with the only “Write the next page” link; the others stand beside it. The My / Shared switch is on the bookshelf page.",
        "Section titles follow the language: 今天的故事 / 我的手帐 in Chinese, Today's Story / My Library in English.",
        "Fixed: in English on small phones, the hint under “More ways” at the top made the page wider than the screen.",
      ],
    },
  },
  {
    version: "10.1",
    date: "2026-11-11",
    zh: {
      title: "选中什么，底部就出现什么工具（第二步）",
      items: [
        "点一下照片、文字或贴纸，底部那排工具换成它自己的：照片是 替换 · 裁切 · 调整 · 图层 · 删除；文字是 编辑 · 字体 · 颜色 · 对齐 · 图层 · 删除；贴纸是 图层 · 删除。左边的 × 回到 照片 · 文字 · 贴纸 · 更多。",
        "原来浮在纸上的黑色小菜单取消了，不再挡住内容。复制、置顶和上下层顺序在「图层」里。",
        "文字框：字体、字号、颜色、左中右对齐，改的只是选中的这一个；点「编辑」直接在纸上打字。",
        "「随手写」和「照片+一句」的标题、正文：打字时可以改字体、字号、颜色和对齐（位置仍由页面自动安排）。",
        "打字时的工具条里多了「转为自由文字框」：标题和正文会带着字体、字号、颜色、对齐变成可以拖动的文字框，不会重复、不会丢字，也可以撤销。",
        "导出的图片会按你选的对齐来画标题和正文。",
        "修好：在面板里点输入框（例如「页面信息」里的名字）时，光标有时会立刻丢失。",
      ],
    },
    en: {
      title: "The tools follow what you select (step 2)",
      items: [
        "Tap a photo, text or sticker and the bottom row becomes its own tools: Replace · Crop · Adjust · Layer · Delete for a photo; Edit · Font · Colour · Align · Layer · Delete for text; Layer · Delete for a sticker. × on the left returns to Photo · Text · Stickers · More.",
        "The black menu that floated over the paper is gone, so it no longer covers your content. Duplicate, to front and the stacking order are in Layer.",
        "Text boxes: font, size, colour and left / centre / right alignment change only the selected box; Edit lets you type right on the paper.",
        "Titles and words in “Just write” and “Photo + a line” take font, size, colour and alignment while you type (the page still places them).",
        "The typing bar has “Make it a free text box”: the title and words become movable text boxes with their font, size, colour and alignment — nothing doubled, nothing lost, and it can be undone.",
        "Exported pictures draw the title and words with the alignment you chose.",
        "Fixed: tapping a field inside a sheet (such as the page name in Page details) could lose the caret straight away.",
      ],
    },
  },
  {
    version: "10.0",
    date: "2026-11-11",
    zh: {
      title: "写手帐的页面重新整理了（第一步：外壳）",
      items: [
        "纸张变大了，占满屏幕中间；写一页不用再上下滚动。",
        "顶部只留：返回、这一页的名字（点它整理这一天的页面）、保存状态、预览、完成。",
        "底部只有四个工具：照片、文字、贴纸、更多。背景、版式、字体、手绘、视频、音频、心情等都在「更多」里，点进去后左上角 ‹ 可以回到「更多」。",
        "撤销和重做移到纸张左下方，不会挡住内容；没有可撤销的内容时是灰色。切到另一页后，撤销不会改到别的页面。",
        "日期、记到哪本手帐、时间、名字和说明、删除这一页，都收在「更多 → 页面信息」。",
        "分享、导出图片、导出视频移到「预览」（顶部的眼睛）里。",
        "顶部会显示 已保存 / 保存中 / 保存失败。保存失败时留在编辑页、内容不丢，点「保存失败」可以重试。",
        "点「完成」：保存好并回到刚保存的那一页（只读），需要时点「编辑这一页」再回来；不会自动公开或发到社区。",
        "这是第一步。选中照片、文字、贴纸时在底部出现各自的工具，是下一步。",
      ],
    },
    en: {
      title: "The writing screen, reorganised (step 1: the shell)",
      items: [
        "A larger sheet of paper in the middle of the screen; no more scrolling up and down to write a page.",
        "The top bar keeps only: back, the page's name (tap it to arrange the day's pages), the save state, preview and Done.",
        "Four tools at the bottom: Photo, Text, Stickers, More. Background, layout, font, drawing, video, audio, mood and the rest are in More; ‹ at the top left of a tool returns to More.",
        "Undo and redo moved under the paper at the lower left, never on your content; they are greyed out when there is nothing to undo. After switching pages, undo cannot change another page.",
        "Date, journal, time, name and caption, and deleting the page are in More → Page details.",
        "Share, export photo and export video moved into Preview (the eye at the top).",
        "The top bar shows Saved / Saving / Not saved. If saving fails you stay in the editor with everything kept; tap “Not saved” to try again.",
        "Done saves and shows the page you just saved (read-only); tap “Edit this page” to come back. Nothing is made public or posted to the community.",
        "This is step 1. Tools that appear at the bottom for a selected photo, text or sticker come next.",
      ],
    },
  },
  {
    version: "9.2",
    date: "2026-11-10",
    zh: {
      title: "换背景更好找了",
      items: [
        "写一页时，纸面下方多了一个「背景」按钮，点一下就能换页面背景（照片氛围、渐变、图案）和纸张。",
        "底部工具栏里原来的「纸张」改名为「背景」。",
        "修好：在 iPhone 上打完字、收起键盘后，底部那排工具（照片、版式、字体、背景、贴纸…）有时不再出现。现在键盘收起或点一下别处，它就回来。",
      ],
    },
    en: {
      title: "Changing the background is easier to find",
      items: [
        "While writing a page there is now a “Background” button right under the paper: page backgrounds (photo moods, gradients, patterns) and paper styles.",
        "“Paper” in the bottom tool row is now called “Background”.",
        "Fixed: on iPhone the bottom tool row sometimes stayed hidden after typing and closing the keyboard. It now returns when the keyboard closes or you tap elsewhere.",
      ],
    },
  },
  {
    version: "9.1",
    date: "2026-11-10",
    zh: {
      title: "Captain 的对话泡泡；面板字号统一",
      items: [
        "修好：在首页点 Captain 时，它说的话被挤成一个字一行。现在是一个正常的对话泡泡，带小尾巴指向 Captain；书架上的泡泡也一样。",
        "「认识 Little Keeper」和改名字的面板统一了字号：说明文字不再小到看不清，「就是它了」和「以后再说」两个按钮一样大。",
      ],
    },
    en: {
      title: "A speech bubble for Captain; consistent sheet type",
      items: [
        "Fixed: tapping Captain on Home squeezed its line to one character per row. It is now a proper speech bubble with a little tail pointing at Captain; the shelf bubble matches.",
        "The “Meet Little Keeper” and name sheets use one type scale: notes are readable, and the two buttons are the same size.",
      ],
    },
  },
  {
    version: "9.0",
    date: "2026-11-10",
    zh: {
      title: "首页 V9.0：照片手帐成为主入口",
      items: [
        "首页换成新的「文具店」排版：左边是大大的日期，旁边一句问候和「今天有什么值得记录？」。",
        "「照片手帐」变成一张有纸张厚度的大卡片，里面有两张拍立得，Captain 从卡片上沿探头；「选今天的照片」是唯一的主按钮。",
        "「只写几句 / 手绘 / 更多方式」收进下面一条安静的文具栏，不再是四个一样大的按钮。",
        "「今天的回忆」只显示你今天真正写的页（示例会标出「示例」）；还没写时是轻轻的空状态。",
        "小屏幕上照片不会压住文字或按钮。其他页面（日历、书架、Keeper 设置）会按顺序接着更新。",
      ],
    },
    en: {
      title: "Home V9.0: the photo journal leads",
      items: [
        "Home has a new stationery-shop layout: a large date, one greeting and “What's worth keeping today?”.",
        "The Photo Journal is now one paper card with two polaroids, Captain peeking over its top edge, and a single main button: “Choose today's photos”.",
        "Just write / Draw / More ways sit in one quiet stationery strip below — no more four equal buttons.",
        "“Today's memories” shows only pages you really kept today (samples are marked); before that, a light empty state.",
        "On small screens the photos never cover the text or the button. Calendar, My Books and Keeper settings follow next.",
      ],
    },
  },
  {
    version: "8.1",
    date: "2026-11-10",
    zh: {
      title: "正式 App 图标：探头的 Captain",
      items: [
        "开铺手帐用上了你确认的正式 App 图标：戴柠檬帽的 Captain 从奶油色手帐边探头，旁边是小花回形针、开铺手帐字样和小芽。",
        "iPhone App 的图标资源已经换好（1024 × 1024，不透明正方形，圆角由 iOS 自己加）。浏览器标签页的小图标、加到 iPhone 主屏幕时的图标也一起换了。",
        "图标直接使用原图，没有重画；只是去掉了原图外面一圈的空白和阴影，让图标铺满。",
      ],
    },
    en: {
      title: "Official app icon: Captain peeking",
      items: [
        "Capiday now uses your approved official app icon: Captain in the lemon hat peeking over a cream journal plaque, with the flower paper clip, the Capiday wordmark and the sprout.",
        "The iPhone app icon is in place (1024 × 1024, an opaque square; iOS adds the rounded shape). The browser tab icon and the “Add to Home Screen” icon changed too.",
        "The artwork is used as it is, never redrawn — only the empty margin and shadow around the original picture were left out so the icon fills its square.",
      ],
    },
  },
  {
    version: "8.0",
    date: "2026-11-10",
    zh: {
      title: "Captain 正式版：只保留 Captain，重新精细抠图；首页更安静",
      items: [
        "这一轮只有 Captain（灰蓝色小猫，柠檬帽）。小兔、小西高地和其他帽子先下架，等确认好美术再加。",
        "Captain 的四张图（默认、开心、睡觉、探头）全部从你的「Captain 角色视觉标准」重新抠图：毛发边缘保留柔和的毛尖、去掉了奶油色白边；不再带闪光线、zZ 字样和原图的阴影；三张站姿图同一尺寸、同一底线。",
        "首页：Captain 从「今天」卡片上沿探出头，两只爪子搭在卡片边上，带一点柔和阴影。它不再自己说欢迎语（首页已经有「Hi，今天是星期几」）；点它才说一句短话，5 秒后自己消失，不会把页面往下推。",
        "保存一页后，开心的 Captain 出现在那一页右上角的空白处，不再挡住「打开这一天」。点它不再换图假装动画，只是轻轻弹一下；平时只有很轻的呼吸，系统「减少动态效果」时完全不动。",
        "修好：和 Captain 聊天时，它的话被挤成一个字一行。现在气泡是正常宽度，输入框也换成了圆角样式。",
      ],
    },
    en: {
      title: "Captain, properly: Captain only, re-cut with care; a quieter Home",
      items: [
        "This round has Captain only (the grey-blue cat in the lemon hat). Bunny, Westie and the other hats are off until their art is approved.",
        "All four Captain pictures (Normal, Happy, Sleepy, Peek) are freshly cut from your Captain Character Reference: soft fur tips kept, no cream fringe, no sparkles, “zZ” or baked shadow; the three standing pictures share one size and baseline.",
        "Home: Captain peeks over the top of today's card with both paws on its edge and a soft shadow. It no longer adds its own greeting (Home already says hi); tap it for one short line that fades after 5 seconds without moving the page.",
        "After saving a page, a happy Captain appears in the page's empty top corner instead of over “Open this day”. A tap no longer swaps pictures to fake an animation — just a gentle bounce; otherwise only a very light breath, and nothing moves with Reduce Motion.",
        "Fixed: in the chat with Captain its replies were squeezed to one word per line. Bubbles are normal width now, with a rounded input.",
      ],
    },
  },
  {
    version: "7.9",
    date: "2026-11-10",
    zh: {
      title: "Little Keeper 换上你确认的 3D 角色图",
      items: [
        "Little Keeper 不再用代码画：现在直接使用你提供并授权的 3D 角色图，每个角色单独裁切成透明图片（不是整张角色表）。",
        "首页：Captain 用参考图里真正的「探头」姿势，头和爪子搭在今天卡片的上边；尺寸比参考图小，只是陪在旁边。晚上 10 点后换成睡觉的样子。",
        "三个小伙伴：小兔（小芽帽）、Captain 猫（柠檬帽，默认名字 Captain）、新加的小西高地（小芽帽）。设置里可以换帽子。",
        "暂时没有对应图片的姿势会用最接近的那张，不用代码假装：小兔和小西高地还没有探头图（首页先让卡片挡住下半身）；所有图都抱着本子和铅笔，还没有单独的「写字」动作；小兔没有睡觉 / 兴奋，Captain 和小西高地没有鼓励。这些需要补美术素材。",
      ],
    },
    en: {
      title: "Little Keeper now uses your approved 3D character art",
      items: [
        "Little Keeper is no longer drawn in code: it now uses the 3D character art you provided and authorised, each character cut out as its own transparent picture (never the whole sheet).",
        "Home: Captain uses the real Peek pose from your reference — head and paws over the top of today's card — smaller than in the reference, a companion beside the content. After 10 pm it shows the sleepy picture.",
        "Three companions: Bunny (sprout hat), Captain Cat (lemon hat, named Captain by default) and the new Westie (sprout hat). You can change hats in Settings.",
        "Poses without a picture yet use the closest real picture instead of a drawn stand-in: no Peek for Bunny and Westie (on Home the card hides their lower half for now); every picture holds the notebook and pencil, with no separate Writing pose; no Sleepy / Excited for Bunny, no Encouraging for Captain and Westie. These need more artwork.",
      ],
    },
  },
  {
    version: "7.8",
    date: "2026-11-10",
    zh: {
      title: "Little Keeper 换上毛绒新造型；首页变成一本小本子",
      items: [
        "Little Keeper 换了新造型：毛茸茸、大眼睛，从本子上方探出头、爪子搭在本子边上。小猫是灰色英短，戴着带叶子的柠檬毛线帽；小兔戴着小雏菊花环。长大后帽子上会多一朵小花，再多一枚金色小星星。",
        "首页「今天」卡片变成一本小本子：左边有铁环、四周一圈缝线；最上面是「Hi，名字！今天是星期几」和日期小牌子。",
        "记录的入口改成四个带小插画的方块：照片手帐（高亮）、只写几句、手绘、更多方式。",
        "品牌名旁边多了一颗小芽和一句「把日子，好好收藏」；首页「今天」的照片卡片上贴了一条纸胶带。",
        "修好：在设置里备份之后，「本机媒体」那一行用量不会再变成空白。",
      ],
    },
    en: {
      title: "Little Keeper's new plush look; Home becomes a little notebook",
      items: [
        "Little Keeper has a new look: fluffy, big-eyed, peeking over the notebook with paws on its edge. The cat is a grey shorthair in a knitted lemon hat with a leaf; the bunny wears a daisy crown. As they grow, a little flower and then a gold star appear.",
        "Home's “Today” card is now a little notebook: binder rings on the side, stitching all round, and “Hi, <name>! It's <weekday>” with a date tag at the top.",
        "Ways to start are four illustrated tiles: Photo journal (highlighted), Just write, Draw, More ways.",
        "A sprout beside the name and “Your life, beautifully collected.” underneath; washi tape on today's photo cards.",
        "Fixed: after backing up in Settings, the media-usage line no longer goes blank.",
      ],
    },
  },
  {
    version: "7.7",
    date: "2026-11-10",
    zh: {
      title: "Little Keeper：一个可选的小伙伴；首页「Hi，今天是星期几」；标签更好找",
      items: [
        "首页上方改成「Hi，你的名字！今天是星期几」，点一下就能设置怎么称呼你。",
        "新的可选小伙伴 Little Keeper：小兔或小猫，抱着本子和铅笔，软软的、会呼吸、眨眼、抖耳朵，头会跟着你的手指转一点，点它会弹一下。默认不开，首页只轻轻邀请一次。",
        "三种陪伴方式：安静（只陪着，不说话）、温柔（轻轻邀请你记录；只有你点「听听它怎么说」才回应那一页）、互动（可以点它聊几句、一起回看和整理；翻看以前的页面、主动打招呼都要你另外打开）。",
        "在纸上打字时它也安静地写；保存后会在本子上盖个章。它说的话都在这台设备上生成，你的日记不会被发送到任何地方；还没有接入 AI 服务，所以「允许发送给 AI」不能打开。",
        "它会随你记录的日子慢慢长大（新朋友 → 一起长大中 → Little Keeper）：每天最多长一点点；难过和开心的日子一样算；没来也不会退步，不用喂、不会生病。",
        "书架上也有它，点一下会聊聊你的手帐。随时可以在设置里换动物、改名字、换方式或关掉，关掉不会删除任何记录。",
        "手帐本标签多的时候，书架上只显示最常用的 3 个，其余的点「更多」可以搜索。",
      ],
    },
    en: {
      title: "Little Keeper, an optional companion; “Hi, it's <weekday>” on Home; easier tags",
      items: [
        "Home now greets you: “Hi, <your name>! It's <weekday>.” Tap it to set what to call you.",
        "Meet Little Keeper, an optional companion: a bunny or a cat with a notebook and pencil — soft, breathing, blinking, ears twitching, head turning a little toward your finger, bouncing when tapped. Off by default; Home invites you once.",
        "Three ways to keep you company: Quiet (just there), Gentle (a soft invitation; replies to a page only when you ask), Interactive (tap to chat, revisit and tidy up; looking at earlier pages and speaking first each need your OK).",
        "It writes quietly while you type and stamps the notebook after you save. Everything it says is made on this device; your journal is never sent anywhere. No AI service is connected, so “Allow sending to an AI service” stays off.",
        "It grows with the days you keep (New Friend → Growing Companion → Little Keeper): a little at most each day; sad and happy days count the same; nothing is lost when you're away — no feeding, no illness.",
        "It sits by your shelf in My Books too. Change the animal, name or mode, or turn it off, any time in Settings — turning it off deletes nothing.",
        "With many journal tags, the shelf shows the 3 most used; the rest are under “More”, with a search.",
      ],
    },
  },
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
        "设置 →「隐私」→「App 锁」：设置 4 位密码（输入两次）。之后打开开铺手帐要先输入密码，锁着的时候下面的内容不能点也看不到。",
        "可以选离开多久后再锁上：立即、1 分钟或 5 分钟。",
        "密码只保存在这台设备上，而且只存加密后的校验值，不存密码本身。连续输错 5 次要等 30 秒再试（刷新页面也不能跳过）。",
        "iPhone App 里可以用面容 ID（或触控 ID）解锁，由 iOS 验证，开铺手帐拿不到你的面容或指纹；打开 App 锁后，切换 App 的预览里也只显示「开铺手帐」，不显示手帐内容。",
        "关掉或修改密码都要先输入现在的密码。「忘记密码？」会如实说明：我们无法帮你找回，记得定期备份。",
      ],
    },
    en: {
      title: "App lock: a 4-digit passcode, Face ID in the iPhone app",
      items: [
        "Settings → Privacy → App lock: set a 4-digit passcode (twice). Capiday then asks for it when opened; while locked, nothing underneath can be seen or tapped.",
        "Choose how long you can be away before it locks again: immediately, 1 minute or 5 minutes.",
        "The passcode stays on this device, stored only as a salted hash — never the passcode itself. Five wrong tries in a row mean a 30-second wait (a reload doesn't skip it).",
        "In the iPhone app, Face ID (or Touch ID) unlocks it — iOS checks it, Capiday never sees your face or fingerprint; with the lock on, the app switcher shows just “Capiday”, not your journal.",
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
        "杂志风格：每页上方有「— 08:10 · MORNING」小标，标题更大、更像杂志标题，页脚有「CAPIDAY · NO. 09」；当天跨页有「CAPIDAY」刊头和大号日期，像一期杂志的封面。",
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
        "Editorial: a “— 08:10 · MORNING” kicker on each page, a bigger headline and a “CAPIDAY · NO. 09” folio; the day spread gets a CAPIDAY masthead and a big date, like a magazine cover.",
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
        "新增 5 首开铺手帐原创轻音乐：午后咖啡、窗外下雨、出门散步、晚安、海边。不是从音乐平台抓的歌，可以放心用在页面、视频和书里。",
        "写一页时点「♫ 声音 → 背景音乐」，或者在做好一页后点「♫ 配乐」，可以先试听再选。写的时候不会自动播放。",
        "在日历里看这一天、或用「翻页」看书翻到这一页时，音乐会轻轻循环播放；点「♫ 曲名」可以暂停。离开就停；放录音或视频时音乐会先暂停。",
        "导出这一页的视频时会带上这首音乐（只有音乐的页面导出 15 秒，结尾淡出）。",
      ],
    },
    en: {
      title: "Give a page some background music",
      items: [
        "Five original Capiday pieces: Afternoon coffee, Rain on the window, A little walk, Good night and By the sea. They are not songs taken from a music service, so they are free to use in your pages, videos and books.",
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
