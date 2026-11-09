// What's new: the update notes shown inside the app (a card on Home after an
// update, and the full list in Settings). Newest first. Add one entry for
// every published update (see AGENTS.md); these are interface texts in both
// languages, not user content.
export const UPDATES = [
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
