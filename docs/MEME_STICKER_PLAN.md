# Little Days — Meme & Sticker Studio 设计方案

> 状态：**设计轮，只出设计，没有改 App 代码**（2026-11-13）。等用户确认后按第 6 节分阶段实现。
> 设计板（375 / 430 · 中文 / 英文，共 28 张）：https://claude.ai/artifact/4EEpdtVnJ55zG3mrYdgkdK （版本 1）；截图是把提议的界面注入到**真实运行的 App**（Chromium 模拟手机）里拍的，纸张、照片、文字和底部工具栏是真的，贴纸面板里的新内容是设计稿，不是 App 代码，也不是 iPhone 实机画面。
> 优先级：用户定的顺序是 P0 媒体 → P1 基础编辑 → P2 IA → P3 Playroom。Meme 的保存和 P0 共用同一个 MediaStore（IndexedDB），**P0 的根因还没确认**（Claude iOS App 内嵌链接，persisted=否），所以 Phase A 之前要先把 P0 的受控复现做完，见第 7 节风险 R1。

---

## 0. 一页结论

- **位置不变**：Meme 放在 Journal Studio 的「贴纸」里；底部仍是 照片 · 文字 · 贴纸 · 更多 四个按钮。贴纸面板改名「贴纸与 Meme」，顶部四个标签：**贴纸 / Captain / Meme & GIF / 我的收藏**。
- **自己的 Meme 走单独的导入路径**，不走照片的路径。现在的照片导入（`imageBlob`）会把所有图片缩到 1200px 并**转成 JPEG**：透明背景会变成实色，GIF 只剩第一帧。Meme 必须保留原始字节。
- **导入后先预览，再二选一**：主按钮「放到这一页」（下方有一个默认不勾的「同时存进我的收藏」）；次按钮「只存进收藏，先不放到页面」。两个按钮的去向写在按钮上，不靠图标区分。
- **GIF 默认静止**：编辑器和阅读器里都先显示第一帧（或选定的封面帧）+「GIF」角标；点一下才播放；阅读器同时最多播放 2 个，滑出屏幕就停；打开「减少动态」时不自动播放；PDF 和图片导出用代表帧；**绝不把 GIF 存成 PNG 丢掉动画**。
- **Captain 的小反应**：6 个，稳定 ID，原色（无帽）先做，柠檬帽随后。**现在一个正式素材都没有**，设计板里全部是标明「素材制作中 / 占位」的占位块，素材到位前不能放到页面上。之前 ChatGPT 生成的 2D 贴纸和 GIF 只作概念参考，不作正式素材。
- **删除收藏不伤页面**：收藏只是一个列表；页面各自引用媒体 ID。删除收藏项只删列表项，图片字节在仍被页面使用时保留。
- **不上传、不联网**：Meme 只存在这台设备的 IndexedDB 里，会进入本机备份；不默认上传到云端，不自动发给 Qwen；官方素材库不抓取网上有版权的热门 Meme。

### 需要你确认的 8 个决定

| # | 决定 | 我的建议 |
|---|---|---|
| D1 | 「Meme & GIF」和「我的收藏」的分工 | Meme & GIF = **导入入口 + 已经放在页面上但还没收藏的** + 将来的 Meme Maker；我的收藏 = **我存下来的 Meme**（可加 ★ 常用、分类、管理）。 |
| D2 | ★ 能不能收藏官方贴纸和 Captain 反应 | 可以，★ 常用 里混排显示；官方素材不复制字节，只记 ID。 |
| D3 | 新图层类型 | 新增 `kind: "meme"`，不复用 `photo`（照片的 调整 / 滤镜 / 裁剪 会重新编码成 JPEG，会毁掉透明和动画）。 |
| D4 | GIF 在编辑器里点「播放」后 | 播一遍（最长 6 秒）后停回封面帧；不循环。 |
| D5 | 阅读器同时播放上限 | 2 个；第 3 个开始播放时，最早的那个停下。 |
| D6 | 大小上限 | 静态 10 MB / 最长边 4096 px（超过 2048 px 的缩到 2048，PNG / WebP 保留透明）；动图 8 MB / 最长边 1024 px / 300 帧 / 15 秒，超过就拒绝并说明原因，不偷偷转成静态图。 |
| D7 | Captain 反应的动画格式 | **透明 PNG / WebP 精灵图 + CSS steps()**（和 Playroom 一样，可暂停、可指定帧、可遵守减少动态、导出帧准确）；另出 animated WebP / GIF 只给将来的聊天贴纸用。 |
| D8 | Phase 1 范围 | 只做静态（PNG / JPG / 静态 WebP）+ 收藏基础；GIF / 动态 WebP 在 Phase B。 |

---

## 1. Feature Architecture

### 1.1 入口

```
Journal Studio 底部：照片 · 文字 · 贴纸 · 更多     ← 不变
                        │
                        ▼
            「贴纸与 Meme」面板（.tool-sheet，可上拉变高）
   ┌────────┬─────────┬────────────┬──────────┐
   │  贴纸  │ Captain │ Meme & GIF │ 我的收藏 │
   └────────┴─────────┴────────────┴──────────┘
   贴纸：     最近用过（跨类型 5 个）+ 原来的 10 个分类、23 张原创贴纸
   Captain：  「Captain 的小反应」6 个 · 原色 / 柠檬帽 切换
   Meme&GIF： 从相册 / 从文件 导入 · 放在页面上但没收藏的 · Meme Maker（即将推出）
   我的收藏： 全部 / ★ 常用 / 静态 / GIF · 分类（可选）· ＋导入 · 管理
```

- 选中页面上的 Meme 或 Captain 反应后，底部换成该对象的工具（沿用 V10.25 的「← 返回 · X · 已选中」）：

| 对象 | 工具栏 |
|---|---|
| 我的 Meme（静态） | ← 返回 · 裁剪 · 换一个 · 收藏/已收藏 · 图层 · 删除 |
| 我的 Meme（GIF） | ← 返回 · ▶ 播放 · 封面帧 · 收藏/已收藏 · 图层 · 删除 |
| Captain 反应 | ← 返回 · ▶ 播放 · 换一个 · 原色/柠檬帽 · 图层 · 删除 |

  移动、缩放、旋转仍是直接在纸上拖、双指、控制点（现有 `sel-frame`），图层顺序在「图层」里。

### 1.2 数据模型（全部是可选字段，schemaVersion 仍为 1）

**页面图层**（`moment.layers[]` / `entry.layers[]`）：

```jsonc
// 我的 Meme（新 kind）
{ "id": "…", "kind": "meme",
  "mediaRef": "media:<uuid>",      // 原始字节（PNG / JPG / WebP / GIF），从不重新编码动图
  "poster":   "media:<uuid>",      // 仅动图：代表帧 PNG（编辑器、阅读器静止态、导出、缩略图）
  "memeId":   "meme_<uuid>",       // 可选：来自收藏时记下，收藏删了也不影响显示
  "mime": "image/gif", "animated": true, "aspect": 1,
  "frames": 12, "durationMs": 1000, "posterFrame": 0,
  "crop": { … },                   // 仅静态，沿用 V10.20 的非破坏 crop.rect
  "x": 50, "y": 60, "scale": 1, "rotation": -6 }

// Captain 反应：复用 sticker kind（换一个、图层、删除都现成）
{ "id": "…", "kind": "sticker", "assetId": "captain.react.so-happy", "variant": "natural",
  "x": 60, "y": 55, "scale": 1, "rotation": 0 }
```

**收藏**（新的顶层可选数组，和 journal 其它元数据放在一起，走现有的 meta-store）：

```jsonc
"memes": [{ "id": "meme_<uuid>", "mediaRef": "media:<uuid>", "poster": "media:<uuid>",
            "mime": "image/gif", "animated": true, "w": 320, "h": 320, "frames": 12,
            "durationMs": 1000, "bytes": 29514, "name": "原始文件名（不显示在纸上）",
            "category": "celebrate", "favorite": true, "addedAt": "…", "lastUsedAt": "…" }],
"favorites": ["sticker:bear", "captain:so-happy@natural"]   // 官方素材的 ★，只记 ID
```

- Swift：`StickerLayer` 加可选的 `poster` / `memeId` / `mime` / `animated` / `frames` / `durationMs` / `posterFrame` / `variant`；`Models.swift` 加可选 `memes` / `favorites`；Core 测试覆盖「旧 JSON 照常解码、新字段往返」。
- 分类值存英文 key（`happy / done / speechless / cute / celebrate / other`），显示时按语言翻译；**用户自己的文件名不翻译**。

### 1.3 代码模块（实现时）

| 新文件 | 职责 |
|---|---|
| `Public/js/meme.mjs` | 纯函数：识别格式（看文件头，不只看 MIME）、限额检查、收藏增删改、`memeUses(state, mediaRef)` |
| `Public/js/gif.mjs` | 读 GIF / WebP 头：宽高、帧数、时长、是否透明；取第 0 帧做封面（优先 `ImageDecoder`，不支持时用自带解析） |
| `Public/js/meme-ui.mjs` | 面板四个标签、导入预览对话框、收藏管理 |
| `Public/js/anim-player.mjs` | 阅读器 / 编辑器的播放控制：并发上限、离屏暂停、减少动态 |

`app.js` 只接线（动作分发、`changeTarget`）。`media.mjs` 的 `visitMediaReferences` 要加上 `state.memes[].mediaRef / poster` 和图层的 `poster`，这样**备份、媒体检查、引用计数**都会算上收藏里的图。

### 1.4 和现有功能的关系

| 现有功能 | 关系 |
|---|---|
| 贴纸（23 张原创） | 留在「贴纸」标签，不动；「换一个」可以在贴纸、Captain 之间换，Meme 只换成别的 Meme |
| 照片 | 完全分开。照片仍转 JPEG（为了省空间）；Meme 保留原样 |
| 手绘 | 手绘是 `photo` + `drawing:true` 的 PNG，不变 |
| Captain Playroom | 舞台互动（Idle、毛线球、摸摸）≠ 可贴的反应。两者用同一套 3D 形象、灯光和比例；Playroom 的「开心」以后可以复用 So Happy! 的精灵图 |
| 将来的 Captain 聊天贴纸 | 只做兼容设计：同一个 Asset ID，另外导出 animated WebP / GIF / APNG（见第 4 节） |
| 导出（PDF / 图片 / 9:16） | 动图画代表帧；视频导出以后可以真的播放（Phase E 以后再评估） |
| 备份 / 恢复 | 收藏里的图（即使没放在任何页面上）也进备份；受现有 100 MB 备份上限约束 |
| 媒体检查（V10.22） | 收藏项也逐个检查五类状态；报告里写「收藏 · GIF · 29 KB」这样的类型和大小，不写文件内容 |

---

## 2. User Flows

### A. 插入自己的 Meme

1. 贴纸 → Meme & GIF（或 我的收藏 → ＋导入）→「从相册」/「从文件」。
   - 在 Mac 上：用隔空投送或 iCloud 云盘放进「文件」，再「从文件」选；在 Mac 浏览器里可以直接拖进面板（Phase D）。
2. 读取：显示进度（沿用 V10.23 导入卡的样式）；看文件头判断格式。
3. **检查**：不支持的格式（HEIC 例外：转成 JPEG 静态图）、超过限额 → 停下，写清楚原因和上限，不保存任何东西。
4. **导入预览**（设计板 4）：棋盘格背景显示透明；动图播一遍后停在第一帧，可「↻ 再播一遍」；信息行：格式 · 尺寸 · 帧数 · 时长 · 大小 · 透明背景；可选分类。
5. 二选一：
   - **「放到这一页」**：写入 IndexedDB 并读回校验 → 图层加在纸中间、被选中；如果勾了「同时存进我的收藏」，同时加一条收藏。
   - **「只存进收藏，先不放到页面」**：写入并校验 → 加一条收藏 → 面板切到「我的收藏」并高亮新项。
   - 「取消」：什么都不写。
6. 保存失败（配额、写入后读不回）：提示「没有保存」+「重试」，不留下半个图层（P0 的规则）。

### B. 添加 Captain 反应

1. 贴纸 → Captain → 选「原色 / 柠檬帽」→ 点一个反应 → 加在纸上，播放一遍后停在封面帧。
2. 选中后：▶ 播放 · 换一个（保持位置、大小、角度，同 V10.25 贴纸）· 原色/柠檬帽（就地切换）· 图层 · 删除。
3. 素材没到位的反应显示占位块，点了提示「这个反应还在制作中」，**不放到页面上**。

### C. 收藏和复用

1. 任何 Meme / 贴纸 / Captain 反应：在面板里长按（或选中后点「收藏」）→ ★。
2. 已放到页面但没收藏的 Meme 出现在 Meme & GIF 的「放到页面上的（还没收藏）」，点「☆ 收藏」即可。
3. 我的收藏：全部 / ★ 常用 / 静态 / GIF；分类可选（开心 / 崩溃 / 无语 / 可爱 / 庆祝 / 其他）；点一下就放到当前页面；`lastUsedAt` 决定「最近用过」。

### D. GIF 保存与阅读器播放

1. 导入时保存两份：原始 GIF 字节 + 代表帧 PNG（`poster`），都读回校验。
2. 编辑器：显示代表帧 +「GIF」角标；选中后「▶ 播放」播一遍（≤ 6 秒）停回代表帧；「封面帧」可选其它帧做代表帧（Phase D）。
3. 阅读器：显示代表帧 + ▶；点一下播放，再点暂停；同时最多 2 个；翻页 / 滑出屏幕自动停；「减少动态」开启时不自动播放，点了才播。
4. 导出 PDF / 图片：用代表帧；不会因为导出而改动原始 GIF。
5. 刷新、重开浏览器、重开 App：读 IndexedDB；读不到时显示现有的「媒体缺失」占位，媒体检查能看到原因。

### E. 修改或删除（上下文工具）

- 页面上删除：图层删掉，可撤销；收藏不受影响。
- 收藏里删除（管理 → 选择 → 删除）：用页面内 `askConfirm`：「这张还在 3 页上使用，删除收藏不会影响那些页面」。删除只去掉收藏列表项；字节在仍被页面引用时保留（`memeUses` 检查）。没有页面使用时，才在下一次「清理未使用的媒体」里提示可以释放空间（以后的功能，不自动删除）。
- 换一个：Meme 换成收藏里的另一个 Meme，位置、大小、角度不变。
- 静态 Meme 裁剪：沿用 V10.20 的非破坏裁剪，输出 PNG（保留透明），不走 JPEG。

---

## 3. UI Design Board（28 张）

375×667 和 430×932 各一套，中文和英文各一套，每套 7 张：

| # | 画面 | 看点 |
|---|---|---|
| 1 | 贴纸与 Meme · 首页（贴纸标签） | 四个标签；「最近用过」跨类型；原来的分类和贴纸照常 |
| 2 | Captain 小反应 | 包头用现有正式的原色 Captain 抠图作标识；6 个反应**全部是占位块**（NAT-01…06，写明「素材制作中」）；原色 / 柠檬帽切换 |
| 3 | Meme & GIF | 从相册 / 从文件；Mac 的说明；「放到页面上的（还没收藏）」+ ☆ 收藏；Meme Maker 即将推出 |
| 4 | 导入预览 | 棋盘格透明；动图播一遍停第一帧；格式信息；可选分类；**放到这一页 / 同时存进收藏 / 只存进收藏** 三者的关系 |
| 5 | 纸上的 Captain 动画反应 + GIF Meme | 选中的 Captain 反应（占位）和工具栏；另一个 GIF Meme 显示代表帧 + 角标 |
| 6 | 我的收藏 | 筛选、分类、★、GIF 角标、＋导入、管理；「只保存在这台设备上」 |
| 7 | 收藏为空 | 两个导入按钮；支持的格式；也可以先放到页面再收藏 |

示例 Meme 全部是为这次设计画的合成图（圆脸小人、星星），不是真实用户数据，也不是网上的 Meme。

---

## 4. Captain Reaction Asset Spec

### 4.1 共同规格

- **形象**：灰蓝色柔软长毛、金色圆眼睛、粉色鼻子和肉垫、整体圆润的比例、3D 毛绒收藏玩具的质感；和现有正式素材（`Resources/Keepers/LD-keeper-cat-yarn-happy.png`、`docs/brand/LD-captain-natural-yarn-original.png`）是同一只猫、同一种灯光（左上方柔光）。
- **版本**：`natural`（原色，无帽，**先做**）、`lemon`（柠檬帽，**不带绿领巾**——绿领巾版已被否决）。
- **不把文字画进图里**：反应名称由 App 按语言显示。
- **原图**：≥ 1024×1024，透明背景，四周留 8% 安全边；地面阴影单独一层（可选）。
- **封面**：静态 PNG，1024 原图 + 512 运行时版本。
- **动画（App 内）**：精灵图（PNG 或 WebP，带完整 alpha），每帧 512×512，12–24 帧，12 fps，1.5–2.5 秒，首尾能接上；附一个 JSON：帧数、fps、循环次数、封面帧。
- **动画（将来的聊天贴纸）**：animated WebP 512、GIF 320（GIF 只有 1 位透明，要带底色描边以免毛边出现白边）、APNG 320。
- **许可**：原创，记在 `LD-keeper-LICENSE.txt`，`library.json` 里写来源和许可证；之前 ChatGPT 的 2D 贴纸 / GIF 只作概念参考。

### 4.2 六个反应

| Asset ID | 中文 / English | 动作和表情 | 动画节拍 |
|---|---|---|---|
| `captain.react.so-happy` | 开心到起飞 / So Happy! | 两只前爪举高，耳朵竖起，眼睛笑成弯月，身边几颗小星星 | 蹲 → 跳起 → 空中停一下 → 落地回弹 |
| `captain.react.im-done` | 彻底崩溃 / I'm Done | 整只猫摊平在地上像一块软糖，尾巴也平放，表情放空 | 晃一下 → 慢慢瘫倒 → 尾巴尖抖一下 |
| `captain.react.proud` | 嘿嘿得意 / Proud of Me | 下巴抬高，眼睛半眯，胸前的毛蓬起来，一颗小星星 | 挺胸 → 点头两下 → 星星闪一下 |
| `captain.react.shy-loved` | 害羞贴贴 / Shy & Loved | 抱着一个爱心抱枕，脸颊粉红，半遮着脸 | 左右轻轻扭 → 冒出两颗小爱心 |
| `captain.react.you-got-this` | 加油打气 / You Got This | 一只爪子握拳举起，另一只拿小彩球，眼神坚定 | 举拳两次 → 彩球摇一摇 |
| `captain.react.no-thoughts` | 放空发呆 / No Thoughts | 坐着，眼睛圆圆直视前方，头顶飘一小朵云 | 慢慢眨眼 → 头微微歪 → 云飘过去 |

### 4.3 文件命名和登记

```
Resources/Keepers/Reactions/
  LD-captain-react-so-happy-natural-cover.png      (512)
  LD-captain-react-so-happy-natural-sprite.webp    (帧 512，横排)
  LD-captain-react-so-happy-natural.json           { frames, fps, loops, coverFrame }
docs/brand/captain-reactions/
  LD-captain-react-so-happy-natural-original.png   (≥1024)
  LD-captain-react-so-happy-natural-chat.webp / .gif / .png   (聊天贴纸，将来)
```

`library.json` 新增 `captainReactions: [{ id, nameZh, nameEn, variants: { natural: {cover, sprite, meta}, lemon: {…} }, license }]`；缺哪个版本就不写哪个，界面显示占位。

### 4.4 现在有什么、缺什么

| 有（正式） | 缺 |
|---|---|
| 原色 Captain 抱毛线球静态抠图（320×325）和 941×1672 原图 | **全部 6 个反应**的原色封面、动画、原图 |
| 柠檬帽 4 个静态表情（197×251，偏小）、柠檬帽抱抱精灵图 | 全部 6 个反应的柠檬帽版本 |
| — | 所有 ≥1024 的反应原图 |

---

## 5. Media Persistence Plan

1. **字节**：IndexedDB `little-days-media` / `media`，沿用 MediaStore：`put` 写 ArrayBuffer → 读回校验 → 才写入引用。记录的元数据：`kind: "meme"`、`mime`、`animated`、`w/h`、`frames`、`durationMs`、`bytes`、`name`。
2. **不重新编码动图**：GIF / 动态 WebP 原样保存。静态图：JPG 原样；PNG / WebP 超过 2048 px 时用 canvas 缩小并**按原格式**输出（保留 alpha），不转 JPEG。
3. **代表帧**：动图另存一张 PNG（`poster`），用于编辑器、阅读器静止态、导出、缩略图、减少动态。代表帧丢了可以从原始 GIF 重新生成；原始 GIF 丢了，图层显示「媒体缺失」，不会用代表帧冒充动图。
4. **引用**：图层、收藏、代表帧都是 `media:<uuid>` 字符串；`visitMediaReferences` 覆盖 `state.memes[]` 和图层 `poster`，所以备份、恢复、媒体检查、引用计数都包含它们。
5. **删除**：从不自动删除字节；删除收藏项前用 `memeUses` 数还被几页使用，写进确认文字。
6. **日志**（`events.mjs`，只记允许的字段）：`meme_import`（stage、mime、bytes、frames、结果、err）、`meme_save_failed`、`meme_play`（只记次数）。**不记录图片内容和文件名**。
7. **配额**：导入前用 `navigator.storage.estimate()` 估一下；剩余不足时先提示，不写半个。
8. **iOS 原生（如需要）**：如果 WKWebView 的相册选择器把 GIF 转成 JPG（待验证，见 R2），Swift 外壳用 `PHPickerViewController`（`preferredAssetRepresentationMode = .current`）取原始数据，通过现有的 WebShell 桥交给页面，页面走同一条 `meme.mjs` 路径。

---

## 6. Implementation Roadmap

| Phase | 内容 | 验收 | 依赖 |
|---|---|---|---|
| **A** 静态 Meme + 面板骨架 | 四个标签（Captain 标签只显示占位）；静态 PNG / JPG / WebP 导入、预览、二选一；`kind:"meme"` 图层（移动、缩放、旋转、图层、删除、透明保留）；收藏基础（列表、插入、删除带使用数）；备份 / 媒体检查覆盖收藏；Swift 可选字段 | 透明 PNG 放到页面后刷新、重开浏览器、备份恢复都还在且仍透明；删除收藏后页面不变；375 / 430 中英文 | **P0 受控复现完成** |
| **B** GIF 与动态 WebP | 文件头识别、限额、代表帧；编辑器播放一遍；阅读器点播、并发 2、离屏停、减少动态；导出用代表帧 | GIF 保存后重开仍是动图（字节 sha256 不变）；导出 PDF 是代表帧；超限有原因 | A |
| **C** Captain 的小反应 | 素材到位后登记 `captainReactions`；精灵播放器；原色 / 柠檬帽切换；换一个 | 原色 6 个可放、可播、可切换；缺的版本显示占位 | **新素材** |
| **D** 收藏增强 | ★ 常用（含官方）、分类、管理多选删除、最近用过、封面帧选择、静态裁剪输出 PNG、Mac 拖入、iOS PHPicker 桥（如 R2 成立） | 各流程回归 | A / B |
| **E** Meme Maker（只做设计） | 照片或 Captain → 上下各一句字（用已有字体）→ 裁剪 → 存进收藏为 PNG；不默认用 AI，不自动发给 Qwen | 设计确认后再排期 | D |

每个 Phase 完成时：新增浏览器回归（`tests/v1xx-browser.cjs`）、`npm test`、外壳一致性测试、发布到固定链接、写 agent.md / README / whats-new。Chromium 通过不写成 iPhone 通过；GIF 播放和相册选择器必须在 Xcode 模拟器或真机上另外看。

---

## 7. Risks & Trade-offs

| # | 风险 | 影响 | 处理 |
|---|---|---|---|
| R1 | **P0 未定根因**：Claude iOS App 内嵌链接的 IndexedDB 未持久化（persisted=否），照片曾报错 | Meme 和照片同一个存储，会一起受影响；收藏里没放在页面上的图更依赖 IndexedDB | Phase A 前先完成 P0 受控复现；收藏进备份；导入成功后提示「建议备份」一次 |
| R2 | iOS 相册选择器可能把 GIF 转成 JPG（只剩一帧），HEIC 会转 JPG | GIF 从相册导入后不会动 | 在模拟器 / 真机验证；成立的话：提示用「从文件」，并做 PHPicker 原始数据桥（Phase D） |
| R3 | 动图解码占内存（每帧全尺寸解码） | 多个大 GIF 同时播放会卡、可能被系统回收页面 | 1024 px / 300 帧上限；默认静止；并发 2；离屏停 |
| R4 | `ImageDecoder` 在 WKWebView 是否可用不确定 | 取帧数 / 代表帧的方法不同 | 自带 GIF 头解析和第 0 帧解码作为后备；WebP 动图用 `<img>` + canvas 取首帧 |
| R5 | `<img>` 里的 GIF 不能真正「暂停」 | 「暂停」= 换回代表帧，再播从头开始 | Phase B 先这样；需要真正的暂停时改用 canvas 逐帧播放（成本高，先不做） |
| R6 | GIF 只有 1 位透明 | 毛绒边缘有白边 / 锯齿 | Captain 用带 alpha 的精灵图（D7）；用户 GIF 原样显示，不处理 |
| R7 | 备份上限 100 MB | 收藏多的 GIF 可能让备份失败 | 导入时显示大小；备份失败时列出最大的几项 |
| R8 | 用户自己的 Meme 可能有版权 | 分享 / 导出整页时带出别人的图 | 只存在本机，不上传、不进官方库；分享前的提示里写「页面里有你导入的图片」 |
| R9 | 新图层 kind 在旧版本里不认识 | 旧备份恢复到旧版本时 Meme 不显示 | Web 和外壳是同一份 `Public/`，正常不会出现；旧版本遇到不认识的 kind 会跳过，不会删掉数据 |
| R10 | 面板变成四个标签，更复杂 | 违背「创作自由但不复杂」 | 默认停在「贴纸」；最近用过跨类型；底部按钮不增加 |
| R11 | Captain 素材周期长 | Captain 标签长期只有占位 | Phase A / B 不依赖素材；Captain 标签在素材到位前可以先隐藏（待你决定） |

**取舍总结**：保真（原始字节、不重编码）优先于省空间；可控（默认静止、点了才动）优先于热闹；本机隐私优先于便利（不上传、不默认 AI）；Captain 宁可显示占位，也不用不合格的替代品。

---

## 8. 代码现状核对（2026-11-13，用于设计依据）

- 照片导入 `imageBlob()`（`Public/app.js`）：最长边缩到 1200 px，`canvas.toBlob(..., "image/jpeg", 0.84)` —— 透明和动画都会丢。
- 照片编辑 / 裁剪旋转输出也是 `image/jpeg`（0.88）；手绘输出 PNG。
- 贴纸面板：`material-categories` 10 个分类 + `art-sticker-grid`，`asset-sticker` 动作已支持 V10.25「换一个」。
- `library.json`：`stickers` 23 张；`keepers`（柠檬帽 4 个静态表情）、`keeperPlay`（柠檬帽 Idle、抱抱精灵图 6 帧、原色抱毛线球抠图）；没有任何反应素材。
- `visitMediaReferences` 现在只看页面、书封、打卡和图片字段，**不包含收藏**（需要加）。
- 没有自动清理媒体的逻辑（删除图层不会删字节）。
- Swift `StickerLayer` 的 `kind` 是 String，新字段都可以做成可选。
