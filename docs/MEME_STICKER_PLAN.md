# Little Days — Meme & Sticker Studio 设计方案（最终设计 v2）

> 状态：**最终设计，等用户看过设计板后开始 Phase A 开发**。本轮仍没有改 App 代码。
> 设计板：https://claude.ai/artifact/4EEpdtVnJ55zG3mrYdgkdK （v2：9 个画面 × 375 / 430 × 中 / 英 = 36 张；v1 的 28 张也留在页面里对照）。截图是把设计稿注入**真实运行的 App**（容器里的 Chromium 模拟手机）拍的，不是 iPhone 实机画面。
> 设计语言：延续 Tactile Stationery × Cozy Editorial —— 纸感底色、细线描边、手帐胶带式标签、深橄榄绿主按钮。
> **开工前提**：用户要求「在可靠存储和恢复验证完成之前，不要正式实施新的 Meme 媒体存储流程」。P0 现状见第 8 节；Phase A 的媒体写入部分要等 P0 结论。

## 版本记录

- **v1（2026-11-13）**：初稿，8 个待确认决定 D1–D8，28 张设计板。
- **v2（2026-11-13）**：用户确认 D1–D8 并补充要求，改动如下：
  - 收藏统一为 ★：官方贴纸、Captain、我的 Meme 都用同一个 ★；「我的收藏」= 所有 ★ 过的东西。v1 里收藏内部再分「★ 常用」的做法取消。
  - 「最近使用」只作辅助入口，不会自动变成永久收藏。
  - Meme Layer 统一承载：我的静态 Meme、以后的 GIF、Captain 形象和小反应，以及封面和动画引用。原有的 23 张原创贴纸保持 `kind:"sticker"` 不变。
  - Phase A 只做静态图：界面上写清支持范围，**不提供 GIF 入口**。选到 GIF 时说明「下一版支持」，不转换。
  - Captain 本轮只做原色（无帽）6 个反应。柠檬帽显示为「之后」，不能选。
  - 统一的 Animated Sticker 播放接口：精灵图和 GIF 用不同解码方式，对外都是播放、暂停、回到封面。
  - 新增：GIF 选择器验证结果（第 9 节）、P0 状态（第 8 节）、iPhone 环境自测工具（设计板第 9 节）。

---

## 1. 最终决定（D1–D8）

| # | 决定 |
|---|---|
| D1 | **Meme & GIF** = 导入自己的 Meme、预览、添加到当前页面；以后加 GIF 和 Meme Maker。**我的收藏** = 所有 ★ 过的我的 Meme、官方贴纸、Captain，可以反复插入不同页面。「本页使用 / 最近使用」是辅助入口，**不自动加入收藏**。收藏和页面引用互相独立，取消收藏不会删除页面里的 Meme。 |
| D2 | 统一 ★ 机制。官方贴纸和 Captain 只存稳定 Asset ID，不复制素材。我的 Meme 字节存在 IndexedDB（MediaStore，写入后读回校验）。 |
| D3 | 新增语义明确的 `kind:"meme"`。位置、缩放、旋转、层级、选择、删除、撤销 / 重做、保存都复用现有的图层能力，不另写画布引擎。现在没有透明度字段，Phase A 不加。 |
| D4 | 编辑器默认显示封面帧。点「播放」播一遍，然后回到封面帧，可以再点。播放期间仍能选中和拖动（播放的是图片，不影响手势）。 |
| D5 | 阅读器同时最多播放 2 个，第 3 个开始时停掉最早的那个。离开页面就停，重新打开显示封面。遵守减少动态。不限制一页放几个。 |
| D6 | 静态图 10 MB；GIF 8 MB、最长边 1024 px、300 帧、15 秒。选完文件就检查，超出时写明原因和允许的范围；**不经同意不把 GIF 转成静态图**。另外按 宽 × 高 × 帧数 估算解码内存，超过 300 MB 也拒绝。 |
| D7 | Captain 官方动画用透明逐帧精灵图（沿用 Playroom），统一的 Animated Sticker 接口见 2.4。只用正式的 3D 灰色绒毛、金色圆眼形象，不用 2D 替代品。 |
| D8 | Phase A：静态 Meme、Meme Layer、基础图层编辑、★ 收藏、本地保存与重开、已有合格 Captain 静态素材。Phase B：GIF。 |

---

## 2. Layer Architecture

### 2.1 现状（代码核对）

- 页面图层是 `page.layers[]`，按数组顺序叠放（越靠后越在上面）；「图层」面板里的上移 / 下移 / 置顶 / 置底就是调整数组顺序。
- 通用字段：`id`、`kind`、`text`、`x`、`y`（百分比）、`scale`、`rotation`、可选 `w` / `h`。
- 校验（`model.mjs`）：每个图层必须有字符串 `id` 和 `text`，`x/y/scale/rotation` 必须是有限数字；`crop` 存在时必须有 `x/y/zoom`；**不校验 `kind` 的取值**。
- 渲染（`canvas.mjs`）：不认识的 `kind`、又没有可用 `assetId` 的图层，会把 `text` 当文字显示，**不会丢数据**。
- 移动、缩放、旋转、选择框都对 `[data-layer]` 生效，和 `kind` 无关；撤销 / 重做走 `changeTarget`。
- 没有透明度字段。原创贴纸是 `kind:"sticker"` + `assetId`，通过 `stickerURL()` 找到 `library/stickers/…`。

### 2.2 Meme Layer

```jsonc
{
  "id": "…", "kind": "meme",
  "text": "Meme",                       // 必填：校验要求；旧版本把它当文字显示（兼容兜底）
  "x": 56, "y": 50, "scale": 1, "rotation": -6, "w": 34, "aspect": 1,   // w=纸宽百分比；高 = w / aspect
  // 来源二选一：
  "mediaRef": "media:<uuid>",           // 我的 Meme：原始字节（Phase A 只有静态）
  "assetId": "captain.react.so-happy",  // 官方 Captain：稳定 ID
  "variant": "natural",                 // 官方造型；缺省 natural
  // 动画（Phase B 起，可选）：
  "poster": "media:<uuid>",             // 我的 GIF 的封面帧 PNG；官方素材的封面在 library.json
  "anim": { "format": "gif" | "sprite", "frames": 12, "durationMs": 1000, "coverFrame": 0 },
  "mime": "image/png", "memeId": "col_<uuid>"   // 可选：来自哪条收藏，仅作追溯
}
```

- **为什么不复用 `photo`**：照片的调整、滤镜、裁剪和旋转都会重新编码成 JPEG，会丢掉透明背景和动画。Meme 走自己的工具栏，就不会进入这些路径。
- **为什么原创贴纸不迁移**：保持 `kind:"sticker"`，旧数据零改动。贴纸和 Meme 可以互相「换一个」：只换来源字段，位置、大小、角度不变。
- **大小**：在 `layerGeometry()` 里把 `meme` 加入有宽度的类型（宽度用 `w`，高度由 `aspect` 算），和照片一样。
- **导出**：静态图直接画；Phase B 的动图画 `poster`。
- **Swift**：`StickerLayer` 加可选的 `variant`、`poster`、`anim`（结构体）、`mime`、`memeId`、`aspect`。Core 测试覆盖两点：旧 JSON 照常解码；新字段往返不丢。

### 2.3 选中后的工具栏（沿用 V10.25 的「← 返回 · X · 已选中」）

| 对象 | 工具栏 | 阶段 |
|---|---|---|
| 我的 Meme（静态） | ← 返回 · 换一个 · ★ 收藏 / 已收藏 · 图层 · 删除 | A |
| Captain 静态形象 | ← 返回 · 换一个 · ★ · 图层 · 删除 | A |
| 我的 GIF | ← 返回 · ▶ 播放 · ★ · 图层 · 删除（封面帧选择在 D） | B |
| Captain 小反应（有动画） | ← 返回 · ▶ 播放 · 换一个 · ★ · 图层 · 删除 | C |

移动、缩放、旋转仍是在纸上直接拖、双指、控制点。

### 2.4 Animated Sticker 接口（Phase B / C）

```js
// js/anim-sticker.mjs
createAnimatedSticker(el, layer, ctx) → {
  play(),            // 播一遍，结束时回到封面
  stop(),            // 立刻回到封面
  playing: boolean,
  onend: () => {}
}
// SpriteDriver：官方精灵图，CSS steps() 驱动 background-position，可准确停在任意帧
// ImageDriver：用户 GIF，<img> 在封面 PNG 和原始 GIF 之间切换（真正的暂停要逐帧解码，暂不做）
// Player 管理器：全局同时最多 2 个；IntersectionObserver 离屏就 stop()；减少动态时不自动播放
```

---

## 3. 收藏机制

```jsonc
// 顶层可选字段（和日记其它元数据一起存，走 meta-store）
"collection": [
  { "id": "col_<uuid>", "type": "sticker", "ref": "bear", "addedAt": "…" },
  { "id": "col_<uuid>", "type": "captain", "ref": "captain.static.yarn-happy", "variant": "natural", "addedAt": "…" },
  { "id": "col_<uuid>", "type": "meme", "ref": "media:<uuid>", "mime": "image/png",
    "w": 400, "h": 400, "bytes": 10240, "category": "cute", "addedAt": "…", "lastUsedAt": "…" }
]
```

- **★ = 在 collection 里**。点 ★ 加一条，再点就移除这一条。
- 官方素材只存 ID。我的 Meme 存 `media:` 引用和尺寸、大小这些元数据，**不存原始文件名**。
- **最近使用 / 本页使用**：不存储，每次从页面图层里算出来（`kind:"meme"` 且没在收藏里的，按添加时间排序，最多 12 个），旁边有「☆ 收藏」。
- **取消收藏**：
  - 只删 collection 里的这一条。页面上的 Meme 有自己的 `mediaRef`，不受影响。
  - 如果这张 Meme 没用在任何页面上，先用页面内确认框提示：「取消收藏后在面板里就找不到它了，图片仍留在这台设备上」。
  - 图片字节**从不自动删除**。以后的「存储管理」会列出没被引用的图片，由用户自己清理。
- **备份 / 媒体检查**：`visitMediaReferences` 加上 `collection[].ref`（`type:"meme"`），这样只存在收藏里的 Meme 也会进入本机备份，也会被检查。
- 分类（可选）：开心 / 崩溃 / 无语 / 可爱 / 庆祝 / 其他，存英文 key，按语言显示。

---

## 4. UI Design Board（v2，36 张）

| # | 画面 | 看点 |
|---|---|---|
| 1 | 贴纸与 Meme · 首页 | 四个标签；「最近用过」；原创贴纸右上角有 ☆ / ★（长按或点 ☆ 收藏） |
| 2 | Captain | 原色；柠檬帽显示「之后」，不能选；**「已有正式形象 · 可以使用」**里是现有的原色抱毛线球；6 个小反应是标明「制作中」的占位，不能放到页面 |
| 3 | Meme & GIF | 「Phase A · 静态图」；从相册 / 从文件；写明「支持 PNG · JPG · WebP 静态图；GIF 下一版」；最近使用（还没收藏）+ ☆ 收藏；Meme Maker 即将推出 |
| 4 | 导入预览（静态 PNG） | 棋盘格看透明；信息行；说明「透明背景保留，不会转成 JPG」；可选分类；放到这一页 / 同时 ★ 收藏 / 只 ★ 收藏 / 取消 |
| 5 | 选到 GIF | 「这一版只能导入静态图……不会把它转成静态图」；换一张静态图 / 知道了 |
| 6 | 纸上的 Meme + Captain | 选中的静态 Meme：← 返回 · 换一个 · ★ 已收藏 · 图层 · 删除；旁边是放好的原色 Captain |
| 7 | 我的收藏 | 全部 / 我的 Meme / 贴纸 / Captain；所有项都带 ★；＋导入；管理 |
| 8 | 取消收藏确认 | 页面内确认框，写明后果；不用系统 confirm |
| 9 | 收藏为空 | 两个导入按钮；支持范围写清楚 |

示例 Meme 是为这次设计画的合成图；Captain 只用了仓库里现有的正式素材，没有生成替代品。

---

## 5. Captain Animation Asset Spec

### 5.1 本轮范围

- **只做原色（无帽）6 个**，柠檬帽以后再做。
- 优先顺序：角色统一、动作清楚、可爱、品牌一致。
- **我（Claude）不能画出正式的 3D 毛绒形象**。本轮交付的是：出图规格、每个反应的动作说明、命名和 ID、元数据结构、验收清单，以及**明确标注「PLACEHOLDER · 占位」的封面占位图**（中性灰色剪影，不是 Captain，也不像任何别的猫）。正式图需要用你们出正式 Captain 3D 图的流程生成，并以 `docs/brand/LD-captain-natural-yarn-original.png` 为形象参考。
- 占位图只在设计板里展示。Phase A 的 App 里，小反应位置用 CSS 画的占位块，**不能放到页面上**。

### 5.2 共同规格

- **形象**：灰蓝色柔软长毛、金色圆眼睛、粉色鼻子和肉垫、圆润的比例、3D 毛绒收藏玩具质感；左上方柔光；和现有原色抠图是同一只猫。
- **构图**：正方形，角色居中，四周留 8% 安全边；透明背景；不画文字、不画地面背景；地面阴影可以单独出一层。
- **原图**：≥ 1024×1024 PNG，透明背景。App 封面用 512×512。
- **精灵图（Phase C）**：
  - 每帧 512×512，横向一排；
  - 12–24 帧，12 fps，1.5–2.5 秒；
  - **最后一帧 = 结束状态**（就是封面姿势），所以播完能平滑停住。
- **元数据**：每个反应、每个造型一个 JSON：

```jsonc
{ "id": "captain.react.so-happy", "variant": "natural",
  "nameZh": "开心到起飞", "nameEn": "So Happy!",
  "cover": "LD-captain-react-so-happy-natural-cover.png",
  "sprite": "LD-captain-react-so-happy-natural-sprite.webp",
  "frame": { "w": 512, "h": 512, "count": 18, "order": "left-to-right" },
  "fps": 12, "loops": 1, "endFrame": 17, "coverFrame": 17,
  "license": "LD-keeper-LICENSE.txt" }
```

- **登记**：`library.json` 加 `captainReactions: [{ id, nameZh, nameEn, variants: { natural: { cover, sprite?, meta? }, lemon?: {…} } }]`。只有封面时只写 `cover`，界面显示静态图、不显示 ▶。
- **将来的聊天贴纸**：同一个 ID，另外导出 animated WebP 512 和 GIF 320（GIF 要描边，防止毛边出白边）。

### 5.3 六个反应（原色）

| Asset ID | 名字 | 封面姿势（= 结束状态） | 动作节拍 |
|---|---|---|---|
| `captain.react.so-happy` | 开心到起飞 / So Happy! | 双前爪举高，耳朵竖起，眼睛笑成弯月，身边 3 颗小星星 | 蹲 → 跳起 → 空中停一下 → 落地，爪子举着 |
| `captain.react.im-done` | 彻底崩溃 / I'm Done | 整只猫摊平在地上像一块软糖，下巴贴地，尾巴平放，眼睛放空 | 站着晃一下 → 慢慢瘫倒 → 尾巴尖抖一下 |
| `captain.react.proud` | 嘿嘿得意 / Proud of Me | 下巴抬高，眼睛半眯，胸前的毛蓬起来，头顶一颗小星星 | 挺胸 → 点头两下 → 星星闪一下 |
| `captain.react.shy-loved` | 害羞贴贴 / Shy & Loved | 抱着粉色爱心抱枕，脸颊粉红，抱枕挡住半张脸 | 左右轻轻扭 → 冒出两颗小爱心 |
| `captain.react.you-got-this` | 加油打气 / You Got This | 一只爪握拳举起，另一只拿小彩球，眼神坚定 | 举拳两次 → 彩球摇一摇 |
| `captain.react.no-thoughts` | 放空发呆 / No Thoughts | 坐着，眼睛圆圆直视前方，头顶一小朵云 | 慢慢眨眼 → 头微微歪 → 云飘过去 |

### 5.4 文件命名

```
Resources/Keepers/Reactions/
  LD-captain-react-<key>-natural-cover.png       512，透明
  LD-captain-react-<key>-natural-sprite.webp     Phase C
  LD-captain-react-<key>-natural.json
docs/brand/captain-reactions/
  LD-captain-react-<key>-natural-original.png    ≥ 1024
```

`<key>`：so-happy · im-done · proud · shy-loved · you-got-this · no-thoughts。

### 5.5 验收清单（每张都要过）

- [ ] 和原色参考图放在一起，看得出是同一只猫：毛色、眼睛颜色和形状、鼻子、比例、质感都一致。
- [ ] 没有帽子、领巾或其它配饰（道具只限表里写的：星星、抱枕、彩球、云）。
- [ ] 透明背景，边缘没有白边或黑边。
- [ ] 缩到 64 px 也能看出是哪个动作。
- [ ] 图里没有文字。
- [ ] 不是 2D 画风，也不是 ChatGPT 之前那批 2D 概念图的直接改版。

### 5.6 Phase A 可用的已有正式 Captain 静态素材

| ID | 文件 | 说明 |
|---|---|---|
| `captain.static.yarn-happy` | `Resources/Keepers/LD-keeper-cat-yarn-happy.png`（320×325） | 原色、抱毛线球；作为第一个可用的 Captain 贴纸；最大放大倍数限制在原图尺寸以内 |

柠檬帽的 4 个静态表情（197×251）本轮不放进 Captain 标签，等柠檬帽版本一起整理。

---

## 6. 静态 MVP 流程（Phase A）

1. 贴纸 → Meme & GIF →「从相册」/「从文件」。文件选择器写 `accept="image/png,image/jpeg,image/webp"`。
2. 选完先看文件头，不只看扩展名：
   - PNG / JPEG / 静态 WebP → 继续；
   - **GIF、动态 WebP、APNG** → 第 5 号画面「下一版支持」，什么都不保存，不转换；
   - HEIC（iOS 相册可能给）→ 交给 WebKit 转好的 JPEG；如果拿到的是原始 HEIC，就说明「请先在相册里导出为 JPG」；
   - 超过 10 MB 或最长边超过 4096 px → 说明原因和上限。
3. 导入预览（第 4 号画面）。
4. 「放到这一页」：
   - MediaStore 写入原始字节，并读回校验；
   - PNG / WebP 最长边超过 2048 px 时，按原格式缩小，保留透明；
   - 然后加一个 `kind:"meme"` 图层，放在纸中间并选中；
   - 勾了「同时 ★ 收藏」才加收藏。
5. 「只 ★ 收藏」：写入并校验 → 加收藏 → 切到「我的收藏」并高亮新项。
6. 「取消」：什么都不写。写入失败时提示「没有保存」+「重试」，不留下半个图层。
7. 页面上：移动、缩放、旋转、图层顺序、删除（可撤销）、换一个、★。
8. 重开：草稿和图层从本地恢复，图片从 IndexedDB 读出；读不到时显示现有的「媒体缺失」，媒体检查里能看到原因。

---

## 7. Phase B GIF 技术方案

- **识别**：
  - 自己解析文件头：GIF 数帧数、读延时得到总时长、读宽高；
  - WebP 看 VP8X 的动画标记，数 ANMF 块；
  - APNG 看 acTL；
  - 不依赖 `ImageDecoder`（在 WKWebView 里不一定有）。
- **限额**：
  - 8 MB、1024 px、300 帧、15 秒；
  - 解码内存估算 = 宽 × 高 × 4 × 帧数，超过 300 MB 也拒绝；
  - 都要写明原因。
- **保存**：
  - 原始 GIF 字节原样保存；
  - 封面帧：画第 0 帧到 canvas，存成 PNG（`poster`）；
  - 两份都读回校验；sha256 记在媒体记录里，以后用来确认没被改动。
- **编辑器**：显示 `poster` + GIF 角标；▶ 时把 `src` 换成原始 GIF 的 blob URL；`durationMs` 到了（最长 6 秒）就换回 `poster`。
- **阅读器**：
  - 点一下播放，再点停止；
  - Player 管理器同时最多 2 个；
  - IntersectionObserver 离屏就停，翻页时停掉全部；
  - `prefers-reduced-motion` 时不自动播放，只在点击后播放一遍；
  - GIF 没有声音。
- **导出**：PDF 和图片画 `poster`；视频导出暂不播放动图。
- **相册来源**：如果第 9 节的真机测试证明从相册选的 GIF 被转成了 JPG，Phase B 提示改用「文件」，并在 Swift 外壳里加 PHPicker 原始数据桥（`preferredAssetRepresentationMode = .current`）。

---

## 8. 媒体持久化与测试计划

### 8.1 P0 现状（2026-11-13 用户截图）

- 环境：Claude iOS App 内嵌链接（in-app web view · WebKit · iOS，`frame.claudeusercontent.com`，嵌在 claude.ai 里）。
- 长期保存（persisted）= **否**；已用 0.0 MB / 可用 983.0 MB；IndexedDB 和 localStorage 都能用；没有媒体错误记录。
- 结果：「这台设备上的手帐还没有用到照片或视频」。
- **还不能下结论**，要看截图前有没有先加照片再强制退出：
  - **没有加照片**：说明检查本身正常，只是这次没有可检查的东西。
  - **加了照片、强制退出、重开后变成这样**：说明那一页连同照片引用一起没了。最可能的原因是 Claude App 的内嵌网页在 App 重启后清掉了这个 frame 的本地存储（persisted=否）。这是宿主环境的行为，App 代码修不了；真正的 Little Days iOS App 用自己的 WKWebView 存储，不受影响。
- 为了分清这两种情况，设计板第 9 节放了一个「**存储保持测试**」：写一个标记 → 强制退出 Claude → 重开看标记还在不在。不涉及任何手帐内容。

### 8.2 Meme 持久化

- 字节：IndexedDB `little-days-media`，沿用 MediaStore（ArrayBuffer、读回校验、`onEvent` 日志）。
- 引用：图层 `mediaRef` / `poster`；收藏 `collection[].ref`。都纳入 `visitMediaReferences`，所以备份、恢复、媒体检查、使用计数都覆盖它们。
- 日志只记阶段、mime、字节数、尺寸、结果、错误类型，**不记文件名和图片内容**。
- 从不自动删除媒体字节。

### 8.3 测试计划

| 层 | 内容 |
|---|---|
| 单元（`npm test`） | 文件头识别（PNG / JPEG / WebP 静态 / WebP 动态 / GIF / APNG / HEIC / 伪造扩展名）；限额；collection 增删和去重；`memeUses`；`visitMediaReferences` 覆盖收藏；旧 JSON 校验通过 |
| 浏览器（新增 `v126-browser.cjs` 起） | 透明 PNG 导入 → 放到页面 → 读回字节 sha256 不变、仍是 PNG；刷新 / 关掉浏览器重开后还在；只 ★ 收藏 → 收藏里有、页面上没有；取消收藏 → 页面不变；删除图层 → 撤销回来；选 GIF → 提示下一版、IndexedDB 里没有新记录；超限提示；四个标签在 375 / 430 中英文；官方贴纸 ★ 只存 ID；备份 → 恢复后收藏和页面都在 |
| Swift Core | 新的可选字段能解码、往返不丢；旧 JSON 不变 |
| 外壳一致性 | `test_native_shell.py` |
| 引擎 | Chromium（容器）+ WebKit（Mac Playwright） |
| 模拟器 / 真机 | Little Days 外壳：导入一张透明 PNG，杀掉 App 后重开；Claude iOS App：存储保持测试 + GIF 选择测试（设计板第 9 节） |

Chromium 或 WebKit 通过，不写成 iPhone 通过。

---

## 9. GIF 选择器验证（2026-11-13）

| 环节 | 来源 | 导入前 | 结果 | 结论 |
|---|---|---|---|---|
| iOS 模拟器「照片」图库 | `xcrun simctl addmedia`（LD P0 Verify，iOS 模拟器） | GIF89a，396,833 B，sha256 `bfbb9b38…` | 图库里是 `IMG_0011.GIF`，字节和 sha256 完全相同 | **系统图库不会转换 GIF** |
| 当前 App 的照片导入 · Chromium | Web Preview，`#photos-input`（`accept="image/*"`） | `image/gif`，396,833 B | IndexedDB 里是 `image/jpeg`，32,381 B，文件头 `FF D8` | **是我们自己的流程把 GIF 转成了 JPG，只剩一帧**（`imageBlob()` 用 canvas 重新编码） |
| 当前 App 的照片导入 · WebKit（Safari 26.5 内核，Mac） | 同上 | `image/gif`，396,833 B | `image/jpeg`，60,756 B，`FF D8` | 同上，和浏览器引擎无关 |
| 相册选择器 → WKWebView 的 `<input type=file>` | 模拟器 / iPhone | — | **未验证** | 选择器要在界面上点选，这次没能自动化；用 AppleScript 控制模拟器卡在了 macOS 权限请求上，已放弃这条路 |
| 「文件」选择器 → WKWebView | 模拟器 / iPhone | — | **未验证** | 同上 |

- 需要补测的环境：
  - **iPhone 真机上的 Claude App**：用设计板第 9 节的「GIF 选择测试」，分别从「照片」和「文件」选同一张 GIF，看文件头和帧数；
  - **iOS 模拟器上的 Little Days 外壳**（这台模拟器的相册里已经有 IMG_0011.GIF），手动点选。
- 结论用于 Phase B：
  - 不论相册是否转换，**现在的照片路径一定会转成 JPG**，所以 Meme 必须走单独的导入路径；
  - Phase A 只要看到文件头是 GIF，就停下来说明，不保存。
