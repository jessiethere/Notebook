# 素材来源

示例照片来自 Unsplash 的公开图片服务，下载为仓库内本地 JPEG，运行时不请求第三方域名：

- 咖啡：<https://images.unsplash.com/photo-1495474472287-4d71bcdd2085>，通过 `w=900&q=85&fit=crop` 获取。
- 湖畔：<https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1>，通过 `w=600&q=85&fit=crop` 获取。
- Unsplash License：<https://unsplash.com/license>。照片仅用作第一阶段示例内容，不表示 Capiday 已建立原创摄影/素材商店；发布前应完成全部资产授权与来源审核。

位置：`Packages/LittleDaysCore/Sources/LittleDaysCore/Resources/Media/`。

页面线性图标使用项目内 SVG 路径；Emoji/符号贴纸由系统字体呈现，外观可能随 Windows/iPhone 改变。未捆绑付费字体或第三方贴纸包；V3 新增的 OFL 字体见下文。

`docs/images/` 是真实 Chromium 浏览器截图，使用仓库自带示例内容，不是 SwiftUI 截图。


## V3 字体许可与原创素材

实际打包七款字体：Cormorant Garamond（Elegant Serif）、Caveat（Handwritten）、Quicksand（Cute Rounded）、Libre Baskerville（Vintage）、DM Sans（Minimal Sans）、Pacifico（Decorative）、Ma Shan Zheng（Chinese Fonts）。均来自 Google Fonts 的 ofl 目录，附各自完整 SIL Open Font License 1.1 文本。每个原始下载地址、文件 SHA-256、PostScript 名和字重范围记录在共享 library.json。

OFL 允许遵守许可的商业使用、嵌入及再分发；字体文件中的作者、许可和 Reserved Font Names 保持原样。CSS 的 LD-* 家族是应用别名，不修改字体内部名称。本轮未抓取商业字体或音乐平台资源。

Stickers 目录包含本项目原创的 23 个 SVG 与对应透明 480px PNG，覆盖十类素材。原创许可见 LittleDays-Original-Assets.txt，允许随项目/衍生应用商业使用与修改，并保留声明；不含第三方贴纸包。

Music 目录（V6.0 / V6.2）包含 8 首本项目原创的背景音乐（LD-music-*.mp3，96 kbps，38–53 秒循环）：午后咖啡、窗外下雨、出门散步、晚安、海边、清晨钢琴、晴天、咖啡馆一角。全部由 tools/make_music.py 用代码合成（FM 电钢琴、钢琴、拨弦/尤克里里、低音提琴、八音盒、钢片琴、铺底、噪声鼓与鼓刷、雨声、海浪、咖啡馆背景声、黑胶噪声），不使用任何采样、录音、他人歌曲或流媒体平台内容；和弦是常见进行，旋律为本项目编写。许可见 LittleDays-Original-Music.txt：用户可在 App 内播放，并用于自己的页面、视频和书（包括分享给家人朋友）。每首的来源、时长、BPM 记录在 library.json `music`。

测试中的视频、波形音频和虚拟麦克风由测试程序合成，不是用户媒体，不用作背景音乐资源。真实用户媒体和导出的本机备份不得提交到仓库。真实 Web 截图使用公开示例或明确的合成测试内容，不是 SwiftUI 截图。

## V3.2 新增中文字体

| 字体 | 风格 | 来源与生成 |
| --- | --- | --- |
| 站酷快乐体 ZCOOL KuaiLe | 可爱圆润 | npm `@fontsource/zcool-kuaile@5.3.0`（Google Fonts ofl/zcoolkuaile） |
| 站酷小薇 ZCOOL XiaoWei | 雅致宋 | npm `@fontsource/zcool-xiaowei@5.3.0`（Google Fonts ofl/zcoolxiaowei） |
| 龙藏体 Long Cang | 手写行书 | npm `@fontsource/long-cang@5.3.0`（Google Fonts ofl/longcang） |
| 霞鹜文楷 LXGW WenKai | 楷体，适合正文与心得 | npm `lxgw-wenkai-webfont@1.7.0`（字体 v1.250，github.com/lxgw/LxgwWenKai） |

npm 包里是按 unicode-range 切开的网页子集。`tools/merge_font_slices.py` 把同一字体的子集合并回一个 TTF：字形轮廓、字体名称、版权与 OFL 均不改变，每个字形只保留一份；只删除引用子集内部字形编号的排版/竖排表（GSUB/GPOS/GDEF、vhea/vmtx、morx 等），因此复杂排版特性（如竖排替换）不可用。四款字体的 OFL 均未声明 Reserved Font Name；许可证文本随文件放在 `Fonts/LD-zh-*-OFL.txt`，SHA-256 记录在 library.json。

## V4.4 照片素材（真实照片）与页面背景

- **照片素材**：78 张来自 Unsplash 的照片，按心情和事件分 13 组，位于 `Resources/Photos/LD-photo-*.jpg`（JPEG，保留原始横竖比例、长边 1000px，约 9.6 MB；尺寸记录在 `photos[].w/h`）。由 `tools/fetch_photos.py` 一次性下载并随 App 打包，运行时不请求 Unsplash。每个文件的原图地址写在 `Photos/Unsplash-Photos.txt` 和 `library.json` 的 `photos[].source`。
- 许可：Unsplash License（<https://unsplash.com/license>）允许免费商用、修改，不要求署名，但不允许把照片原样汇编成同类图库或壁纸服务。Capiday 只把它们作为写手帐时可选的配图；正式上架前仍应按上文完成全部资产的来源与授权审核。挑选时尽量避开可辨认的人脸和品牌标志。
- **页面背景**：`Scenes/` 里的渐变、可爱图案、万花筒、光影丝带、星空（21 张）是项目原创，用作页面背景（`backdrop`）；12 张手绘“生活小景”标记为 `retired`，只为兼容已使用它们的页面而保留。
- 2026-11-09 更新：万花筒、光影丝带、星空也标记为 `retired`（只为兼容保留）。照片素材中有 10 张标记 `backdrop: true`，可作为整页背景（“照片氛围”），`tone` 由 `tools/fetch_photos.py` 按画面下半部分亮度计算。

## V7.9 Little Keeper 角色图（2026-11-10）

- 来源：Capiday 产品负责人 2026-11-10 提供并明确授权在 Capiday 内使用的 3D 角色表，以及「参考图 1 · Captain 角色视觉标准」。不是从网上抓取的素材。
- Captain 猫以产品负责人自己的猫 Captain 为原型。
- 处理：`python3 tools/extract_keepers.py <角色表.png>`（18 张）和 `python3 tools/extract_keepers.py --captain <参考图1.png>`（探头 Peek + 惊喜 Surprised）。每个角色单独裁切、去底、保留柔和阴影；原图（整张角色表、参考图）不随 App 发布，也不提交到仓库。
- 文件：`Packages/LittleDaysCore/Sources/LittleDaysCore/Resources/Keepers/`，清单在 `library.json` 的 `keepers`，说明在 `LD-keeper-LICENSE.txt`。服务路径 `library/keepers/<文件>`（`tools/preview.py`、`tools/build_link.py`、Swift `SharedResources.libraryData(category: "keepers")`）。
- 限制：只限 Capiday 内使用，不另行分发或出售。
- 缺少的姿势与更高分辨率图见 DESIGN_SYSTEM.md「V7.9 Little Keeper 角色视觉规范」。

## V8.0 Captain 素材（2026-11-10，取代 V7.9 的 20 张多角色素材）

- 来源：产品负责人 2026-11-10 提供并授权的「参考图 1 · Captain 角色视觉标准」，是 Captain 唯一的美术标准；Captain 以产品负责人自己的猫为原型。
- 文件：Resources/Keepers 下 4 张透明 PNG（Normal / Happy / Sleepy 197×251，Peek 339×290）+ `LD-keeper-LICENSE.txt`；清单在 `library.json` 的 `keepers`。
- 处理：`tools/extract_captain.py`（只用参考图里的像素，不重画）。参考图本身不进仓库、不随 App 发布。
- V7.9 的小兔、小西高地和其他帽子素材已从 App 包中移除（仍在 git 历史里）；`tools/extract_keepers.py` 一并删除。等这些角色的美术确认后再重新加入。
- 限制：只限 Capiday 内使用。分辨率受参考图限制，正式上架前建议美术提供每个状态 ≥ 1024px 宽的透明 PNG 和动画帧。

## V8.1 正式 App Icon（2026-11-10）

- 来源：产品负责人 2026-11-10 上传并确认的「Little Days V1 Official App Icon」（图标上的字样仍是 Little Days；改名为 Capiday 后需要新图标），保存为 `docs/brand/LD-app-icon-original.png`（1254 × 1254 PNG，原样保存，未改动）。
- 生成：`python3 tools/make_app_icon.py` → iOS `Native/App/Assets.xcassets/AppIcon.appiconset/AppIcon-1024.png`；Web `Public/icons/favicon-32.png`、`icon-192.png`、`apple-touch-icon.png`（同步进 iOS 外壳 WebApp 与在线链接）。
- 处理说明见 DESIGN_SYSTEM.md「V8.1 正式 App Icon」。只限 Capiday 使用。

## 2026-11-10 Captain 自然形象原图（待集成）

- 产品负责人 2026-11-10 上传的「无帽 Captain 抱粉色毛线球」原图，原样保存为 `docs/brand/LD-captain-natural-yarn-original.png`（941 × 1672）。
- **尚未裁切、尚未进入 App**：按计划在 V9.0 Phase 4（Keeper 设置）用 `tools/extract_captain.py` 同样的方法单独抠图并检查毛发边缘后再集成；在那之前 App 里的 Natural 形象仍标为未完成。

## 2026-11-11 Captain：已有素材与待补的正式美术资源（V10.16 记录）

用户决定（2026-11-11）：Play Mode 和 Dress Up 的动画必须用正式美术资源。不用粗糙 SVG、拉伸现有 PNG 或低质量临时素材代替。已有的合格素材照常使用。

**已有、正在使用**（`Packages/LittleDaysCore/Sources/LittleDaysCore/Resources/library.json` → `keepers` / `keeperLooks`）：

| 文件 | 内容 | 用在哪里 |
|---|---|---|
| LD-keeper-cat-lemon-normal.png | 戴柠檬帽，平常 | 首页、Captain 小角落、设置 |
| LD-keeper-cat-lemon-happy.png | 戴柠檬帽，开心 | 被夸 / 保存后 |
| LD-keeper-cat-lemon-sleepy.png | 戴柠檬帽，困 | 夜里 |
| LD-keeper-cat-lemon-peek.png | 戴柠檬帽，探头 | 首页探头 |
| LD-keeper-cat-yarn-happy.png | 抱毛线球，不戴帽子（静态） | 装扮「毛线球」 |

**缺失，等正式美术**（在拿到素材之前不实现对应的互动）：

| 互动 | 需要的素材 | 现在的处理 |
|---|---|---|
| 摸摸头 | 被摸时的表情和动作：至少 3 帧（伸头 → 眯眼 → 回位），或一段 Lottie / 序列帧；两种帽子状态各一套 | 只用文字回应（「呼噜呼噜……再往左边一点」），没有动画 |
| 挠肚皮 | 翻身露肚皮的姿势，加 2–3 帧反应（开心或害羞躲开） | 没有入口 |
| 玩毛线球 | 拨毛线球、追毛线球的序列帧（现有的抱毛线球是一张静态图，不能当动画） | 「和 Captain 玩一会儿」页如实写着「正在准备」 |
| 换帽子 | 每顶新帽子都要配齐平常 / 开心 / 困 / 探头 4 张，与柠檬帽同样的光照和描边 | 只有柠檬帽 |
| 换衣服 | 衣服或配件的全套姿势（同上 4 张），要能和帽子组合，或者单独成套 | 没有衣服 |

交付规格（与现有 Captain 一致）：PNG 透明背景，原画 ≥ 1024px，统一的光源与描边；动画用序列帧（每帧单独的 PNG）或 Lottie JSON，标明帧率；附原创或授权说明，写入 `library/stickers/LittleDays-Original-Assets.txt`。

不做：不新增 Bunny、Westie 或其他 Keeper；不用 SVG 线稿或拉伸现有 PNG 拼动画。

### 2026-11-11 补充：用户提供的动画（已存为文件的部分）

- 已存入 `docs/brand/captain-anim/`：柠檬帽坐姿静态图、柠檬帽「抱毛线球大笑」（6 帧）、柠檬帽加绿领巾「玩毛线球」（9 帧）。`tools/make_captain_anim.py` 生成 JPEG 雪碧图，放在 `Resources/Keepers/`。**还没有登记进 library.json，也没有接到界面**，要等 Playroom 设计确认（docs/CAPTAIN_PLAYROOM_PLAN.md）。
- 上表中「玩毛线球」的柠檬帽版本现在有了。摸摸头、挠肚皮、换衣服仍然缺失；无帽版的所有动画也缺失（对话里的无帽图没有存成文件）。

### 2026-11-12 Captain's Playroom MVP：实际使用的素材与仍缺的素材

**已导入并在 App 里真实播放**（全部来自用户提供的原图，没有重画）：

| App 里的文件 | 来源 | 用在哪里 |
|---|---|---|
| LD-keeper-cat-lemon-play-idle.jpg | LD-captain-lemon-yarn-sit.webp。去掉毛线球和线后，原位置用周围像素平滑填补；底色已和开心动画对齐 | 柠檬帽的舞台静态画 |
| LD-keeper-yarn-ball.png | 同一张图里的粉色毛线球，单独抠出，透明背景 | 可以拖动的毛线球 |
| LD-keeper-cat-lemon-hug-anim.jpg | LD-captain-lemon-hug.gif，6 帧 × 180 ms | 开心反应：戳 Captain，或者 Captain 接住毛线球时播放 |
| LD-keeper-cat-yarn-happy.png | 原有的无帽抱毛线球静态图 | 无帽版的舞台（只有静态画） |

**没有使用**：LD-captain-lemon-play.gif（带绿领巾），按用户决定不进 App，原图留在 docs/brand 存档。原来生成的 `LD-keeper-cat-lemon-sit.jpg`、`LD-keeper-cat-lemon-play-anim.jpg` 已删除。

**请从 ChatGPT 下载后放进 `Notebook/docs/brand/captain-anim/`**（ChatGPT 里的文件不会自动进入仓库）：

1. 无帽版「开心反应」动画：抱着粉色毛线球笑，与 LD-captain-lemon-hug.gif 动作对应。建议命名 `LD-captain-natural-hug.gif`。
2. 无帽版「坐在毛线球旁」的静态图：毛线球不被爪子挡住，与 LD-captain-lemon-yarn-sit.webp 构图一致，这样无帽版也能拖毛线球。建议命名 `LD-captain-natural-yarn-sit.png`。
3. 如果有：无帽版「玩毛线球」动画（不带领巾）。建议命名 `LD-captain-natural-play.gif`。
4. 如果有：柠檬帽、**不带领巾**的「玩毛线球」动画。建议命名 `LD-captain-lemon-play-nobandana.gif`。

导入前请确认这几点：
- 是真正会动的 GIF、WebP 或 MP4（用电脑打开能看到在动），不是九宫格预览图或截图；
- 帧数 ≥ 6，并写明每帧多少毫秒；
- 第一帧和最后一帧能接上（可以循环），或者明确只播一遍；
- 背景要么透明，要么和现有素材一样是奶油色纸面；
- 边长最好 ≥ 1024px（现在是 400–500px，iPhone 上略软）。

导入后运行 `python3 tools/make_captain_anim.py`，检查每帧，再登记进 library.json 的 `keeperPlay`。
