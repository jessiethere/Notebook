# Little Days · 开发日志与会话交接

## 固定约定

- 仓库：https://github.com/jessiethere/Notebook；产品 Little Days（手帐文具店）。理念：记录生活的美好，也收藏一点点变好的自己 / Collect moments, grow gently.
- 继续在现有 SwiftUI + HTML 交互预览 + Vapor + 共享 Core 上增量开发，不重建、不未经确认切换 React。
- 开始先读 AGENTS.md、agent.md、README.md、PRODUCT_SPEC、DESIGN_SYSTEM、ARCHITECTURE，检查最新分支/代码/提交。
- 每次改动同步维护本文件与 README 的日志，一起提交；保留历史。真实用户记录、媒体、备份和密钥不能提交公开 GitHub。
- 不把 HTML 预览称作 SwiftUI；不把本地私人状态/旧标签页提示称作服务端授权/多人协作。
- 完成时用中文说明功能、文件、Windows 测试方式、真实可用与演示/设计范围、测试结果和下一步。

## 当前状态

- **架构（2026-11-07 用户确认）**：最终发布 iOS App；App = Swift 外壳（SwiftUI + WKWebView）运行与 localhost 相同的 `Public/` Web 界面。用户通过 claude.ai 固定链接 https://claude.ai/artifact/VYUJ38K5TBqcZPB8VzJS7A 查看每次更新（2026-11-09 用户确认取代 Windows localhost:8080），不再使用 ZIP。云端会话开始即后台运行 `python3 tools/preview.py --port 8080` 并登记预览端口。
- **V3.1（Web）已实现**：Calendar 只读 Day Detail（全部 Moments、照片排版、统一音频播放器/录音/视频直接播放、照片放大、成长感想）；多照片自由排版（多选、独立图层、拖动/双指缩放旋转/鼠标把手/滚轮/方向键、裁切、相框/胶带、图层顺序、五种 Auto Layout、撤销重做）；一天多个 Moments（章节、排序、复制、删除、折叠、单独保存）；Growth 打卡感想、周/月回顾、成长卡片引用插入。全部仍为 schemaVersion 1 的可选字段，旧记录不迁移即可打开。
- 媒体对象 URL 改为按视图 scope 引用计数：图片 app 级常驻，音视频仅 Studio / Day Detail 打开时从 IndexedDB 载入，离开即撤销。
- 本轮环境（Ubuntu 24.04 容器）没有 Swift 工具链，且 download.swift.org 被网络策略拒绝（403），因此 Swift Core/Vapor 测试本轮**未运行**；Swift 模型只做了可选字段扩展与新增测试源码。
- V3 Phase 1 个人增强已实现于 Web：原五页保留，新增自定义封面/主题/通用字段、真实字体/原创贴纸、多文字/照片层、视频/音频/录音、双语 Settings、IndexedDB 与备份/恢复。
- Windows 默认无需 Git：下载 ZIP，全部解压，双击 Start-Windows.cmd；手动 `py -3 tools\preview.py --open` → http://localhost:8080。之前用户的错误来自没有 Git、终端在用户目录和将 preview.py 写成 preview\.py。
- schemaVersion 仍为 1，新增字段可选；旧记录 ID/日期/正文/旧 Emoji/系统字体保留。旧主照片写 Blob 成功后才替换引用。
- 新媒体在 IndexedDB，LocalStorage 只存轻量数据；本机备份是用户主动下载文件，不上传服务器。
- 原生 Core 支持 V3 Codable；SwiftUI 基础页面增加共享双语、字体注册/选择与 PNG 封面。原生音视频/完整封面字段编辑和画布未对齐 Web。
- 没有真实账号、社区、好友、私信或协作。背景音乐（V6.0 / V6.2）只有 8 首原创合成曲（tools/make_music.py → Resources/Music，library.json `music`），不接音乐平台。社区/好友/私信/共同创作只有本机演示（`little-days.demo-social`，明确标注“演示 · 未联网”）。未来后端方案仅为文档设计。

## 关键决策

- V3.1：一天仍是一条 Entry（日期容器），其中是有序 `moments`；不拆成多条 Entry，以保持 Calendar / My Books / Growth 的日期关联。“页”= 当日主页（旧标题/正文/主照片固定版式原样保留）+ 每个 Moment。
- 画布坐标全部相对画布（x/y 中心 %、w % 宽、h % 高、crop 百分比），画布固定 4:5，跨设备恢复一致。
- 成长卡片引用 `(habitId,date)` 打卡而不复制；感想写在原打卡上，打卡仍唯一，不重复计数；删除手帐页/Moment 不删除打卡；`shareNote` 默认 false，当前无任何分享出口。
- Studio 与 Day Detail 共用 `canvas.mjs` 的画布/媒体卡片渲染（edit / read-only 两种模式），避免功能不一致。
- 备份媒体总量 100 MB、导入 150 MB 不变；文件数上限 500 → 2000（多照片下 500 个文件会先于字节上限触发，字节上限不变所以内存风险不变）。
- 保留 Vapor，Windows 预览使用 Python 标准库；不引入前端构建框架或未经验证的 SwiftUI Web 兼容层。
- 共享 library.json / i18n.json、TTF+完整 OFL、原创 SVG+透明 PNG；CSS 从共享目录生成；Native 与 Web 使用同名数据类型/资源 ID。
- generic BookField schema 统一渲染七种字段，系统预设标签可双语，用户的名称/正文/字段值不自动翻译。
- Private 是本轮唯一可用权限；公开和 Shared 禁用。真正的访问控制必须在未来 Vapor 后端实现，好友关系不继承私人内容权限。
- Blob 事务先完成再更新元数据；迁移/恢复失败不清除原记录。导出备份最多 100 MB 媒体，导入文件 150 MB；暂不自动删除旧 Blob，以保护撤销和恢复。
- 保存元数据比较已读快照，检测旧标签页；不是跨客户端原子事务。协作将采用数据库 expectedRevision/409 与版本历史。

## 已知问题与下一步

- V3.1：原生 SwiftUI 尚未实现 Day Detail、Moments、自由照片图层与感想 UI（共享模型可解码）；Swift 测试本轮未能运行；单个 Moment 内不能再分多页；PNG 导出为基础版式；滚轮/把手旋转对旋转后的照片按未旋转坐标近似计算宽高。
- Windows CMD/Python Launcher/默认浏览器仍未实机验证；Linux 已验证 ZIP 布局、空格路径、跨目录与 HTTP。
- SwiftUI 只有语法/共享模型检查，未进行 iOS SDK 类型检查、模拟器或真机验证；优先原生构建与个人能力对齐。
- Web 新媒体只在当前浏览器 origin；换 localhost/127.0.0.1/端口不会自动同步。需导出备份，暂无云同步、备份加密或分卷。
- 格式兼容性依浏览器；本轮为 Chromium。PNG 不含可播放媒体、不是完整所见即所得；主照片裁切、滤镜、完整相框和信息卡片待开发。
- Blob 清理/保留与大规模媒体存储后续完善；本轮不自动清理被替换文件。
- Phase 2 明确标记社交演示，Phase 3 真实 Vapor 后端，Phase 4 协作，Phase 5 高级创作/授权音乐；具体见 ROADMAP。

## 更新日志

### 2026-11-13 — V10.43 S3：换照片时复用已导入的照片

- **根因**：快速编辑 `story-replace` 和 Studio `replace-photo` 都直接 `chooseAttachment()` 打开系统相册；页面上的缩略图只用来选目标。
- **修复**：新的共享面板 `openPhotoSource()`（快速编辑与 Studio 共用）：标题「正在替换照片 N」；来源「这一页 / 这一天 / 这本书」（这本书只在点开时读取，按日期倒序，最多 60 张，跳过示例日）+「从相册添加」（原来的流程）。选中 → 只把来源照片的 `mediaRef`（和它的 `sourceRef`/`edit`，便于再编辑）复制到目标图层：图层 id 不变，所以目标位置的 caption 保留，来源的 caption 不复制；不调用 `media.put`，不重新压缩、不重复保存。快速编辑沿用 `storyReplacePhoto`（一步撤销、照片分组跟随、手动排版的页放进原框）；Studio 的替换逻辑抽成 `studioReplacePhoto`（相册路径也改用它），一步撤销。面板为 see-through，页面上被替换的位置保持可见。
- **共享引用**：媒体库没有删除方法和垃圾回收；删除图层 / 页面只改手帐数据。备份按引用去重，恢复统一换新 id。测试中删除共享同一照片的一页后，另一页仍能读到，媒体记录数不变。
- **测试**：新 `tests/v143-browser.cjs` 6 项（zh 375 / en 430：标题与三个来源；照片 2 复制到位置 3，照片 2 不动，两处说明各自正确，媒体记录数不变；撤销；「这一天」用另一页的照片；接着写字并保存；重启后所有引用都在；Studio 用「这本书」替换；删除共享一页后文件保留）。
- **未做**：交换位置（按要求留到以后）；「编辑已保存页面」仍进入 Studio（另一个产品决定）。
- **回退**：`git revert`；没有新数据字段。

### 2026-11-13 — V10.42 统一计数：天 / Moment / 页（Step 2）

- **定义（写在 `Public/js/pages.mjs` 顶部）**：Day = 有记录的日期；Moment = `entry.moments`；Page = 能阅读的一页（显示中的当天主页 + 每个 Moment 页）；Book Cover 不计页；Day Cover = `layoutTemplate:"scrapbook"` 且有 Moment 的当天主页，显示时算一页，`dayCoverHidden:true` 时不算（数据保留）。
- **根因**：书的「N 篇」数的是天；日详情和日历的「N 页」数的是 Moment，漏了当天主页；阅读器 / PDF 数的是页；日详情的照片数会把每日封面里的重复照片再算一次。
- **修复**：书架卡片、书架书脊、抽出的书、首页书库、书本详情一律用 `bookCounts` → 「N 天 · M 页」（空间不够只显示「M 页」）；日历数字、日详情、首页「今天留下的 N 页」、回忆卡片、书本里的日卡片、Studio 的页面工具都用 `dayCounts` / 同一规则；`daySummary.photos` 改为不同照片数；英文 1 day / 1 page 单复数。
- **测试**：新 `tests/v142.test.mjs` 3 项（封面显示 / 隐藏、旧当天主页、示例、书本天数页数、阅读器与 PDF 用同一组页）；新 `tests/v142-browser.cjs` 2 项（同一天在阅读器、首页书库、日历、日详情都是 4 页，4 张照片）；`npm test` 281 通过。
- **回退**：`git revert`；只改显示和计数，不改数据。

### 2026-11-13 — V10.41 S1 + D1：示例与用户记录隔离；新用户一本空的「我的手帐」（P0）

- **决定（用户确认）**：D1 新用户只建一本空书；D2 旧示例保留在存储里，但不进入书、日历、阅读、搜索、统计和 Captain，只在 设置 → 示例内容 查看；改过的示例按用户内容保护；本轮不删除任何历史示例；S2 清理工具暂缓。
- **识别规则（检查了真实数据结构）**：稳定标记是 `entry.isDemo`。App 生成时为 true，用户保存那一天时 `saveEntry` / `saveMoment` 把它改成 false；示例 id 都是 `sample-*`；没有逐页编辑记录。所以只有「当天 isDemo:true」= 原始示例。用户保存过的那天里，仍带 isDemo 的页面无法可靠判断改没改过，一律当用户内容（保护优先）。不和 seed 内容比对。
- **文件**：新 `Public/js/pages.mjs`（共享规则：`isSampleDay`、`isDayCover`、`dayPageShown`、`daysOf`、`dayOf`、`visiblePages`、`dayCounts`、`bookCounts`）；`book-share.mjs`（`bookSharePages` 改用 `visiblePages`）；`day.mjs`（`daySummary` 默认跳过示例日，`{samples:true}` 给示例查看用；`bookPages` / `bookEntryCount` / `bookDays` 跳过示例日）；`day-view.mjs`；`search.mjs`、`keeper.mjs`（从「逐页 isDemo」改为「整天」规则，修正用户改过的示例页被搜索/Captain 跳过的问题）；`app.js`（今天、阅读器 `flipPages` 不再 includeDemo、日历、Captain 卡片、设置 → 示例内容列表、首次一本「我的手帐」、书架不再显示建议卡）；i18n 4 个键；styles；whats-new 10.41。
- **测试**：新 `tests/v141-browser.cjs` 10 项（zh 375 / en 430 × A 新安装 / B 自己的手帐，打开后存储逐字节不变 / C 只有旧示例，存储不变、首页搜索日历阅读器都没有、设置里 8 天全部列出并标「示例」/ D 改过的示例可搜索 / E 数据库读不出 → A1 面板）；v139 改为断言一本书；`tests/v31.test.mjs` 两个单元测试原本往未保存的示例日加页面，改为「用户保存过的一天」；`npm test` 278 通过。
- **风险**：用户保存过的示例日里，没改过的示例页也会显示为用户内容（保护优先的代价）。「移除所有示例」按钮是以前就有的、需确认的手动操作，没有改动，只删整天 isDemo:true 的示例。
- **回退**：`git revert`；没有改数据。

### 2026-11-13 — 方案轮：照片复用 · 每日封面可选 · 示例数据隔离（只出方案和预览，没有改 App 代码）

- **方案板**：https://claude.ai/artifact/AKgX2gu88hRidRkKB9fQGo （「现在的 App」是 V10.40 浏览器真实截图；「设计概念」是 HTML 画的预览）。
- **根因（代码核对）**：
  - 照片复用：快速编辑 `story-replace` 和 Studio `kind:"replace"` 都直接 `chooseAttachment()` 打开系统相册；缩略图条只用来选目标。已保存页面的「编辑」进入 Studio，不是快速编辑。
  - 每日封面：`makeStory()` 在 ≥2 段时间且当天主页为空时自动 `layoutDay()` 写进 entry 自己的图层（真实存储），`bookSharePages` 把它算一页。实测 5 张照片 / 3 段时间 → 阅读器「第 1 / 4 页」；日历只数 Moment（3），与阅读器不一致。
  - 示例：V10.39 已停止新安装写入。仍剩：新安装自动建 3 本预设书 + 书架「和家人一起的书」建议卡片像真书；老设备上 `daySummary` / `bookEntryCount` / 阅读器 `includeDemo:true` / 首页今天的故事仍计入示例（搜索、Captain、连续记录已排除）；保存改过的示例日只清 entry 的 `isDemo`，里面每页仍 `isDemo:true`，因此被搜索和 Captain 跳过。
- **结论**：三项都不需要迁移数据（引用复用；旧封面原样保留；示例只在读取时排除，清理须预览 + 确认）。
- **分批**：S1 示例不计入（读取层，可立即做）→ S2 示例清理预览 + 默认书本（需确认）→ S3 照片复用面板（可立即做）→ S4 新的日子默认不生成封面（可立即做）+ 旧封面隐藏入口（需确认）。
- **等待确认**：默认书本（建议只建一本空的「我的手帐」）、老设备示例显示方式（建议保留并标「示例」直到用户自己清理）、旧封面隐藏入口。

### 2026-11-13 — 全量浏览器回归（V10.36–V10.40 最终状态）与两个旧套件迁移

- 快照（提交 cc46e8d 时的 Public/tests）全量 78 个浏览器套件：77 通过，2 失败（v36、v65），均为 B 批改变首次启动默认值导致：v36 是不带公共辅助的登录套件，headless Chromium 设备语言是英文 → B2 正确地显示英文；它也依赖示例手帐。改为 `locale: "zh-CN"` + `little-days.with-samples=1`。v65 以「没有 Labs 的人」编辑习惯，习惯现在在 Labs 后面（B5）→ 第 1 步临时打开 Labs、第 2 步关回。两个套件单独重跑通过。没有修改 App 代码来迁就测试。
- `npm test` 278 通过。

### 2026-11-13 — 方案文档：C1/C4 备份格式、模拟器/真机测试计划、Track B Editorial；模拟器验证 B2（没有改 `Public/`）

- **需求**：C1 分卷与 C4 恢复快照先给兼容方案；准备真机步骤，区分模拟器和真机，说明 TestFlight 和 Xcode 直接安装的区别；Track B 先做 Editorial 设计确认、接入引擎分析、验收标准，评估 Story 复用；风格绑定按「书默认 + 页覆盖」。
- **文件**：新 `docs/BACKUP_FORMAT_PLAN.md`（分卷 version 2 只在超过 60 MB 时用，小于时仍输出 version 1；恢复前快照写入 `little-days.v1.before-restore`，写入成功才替换，可撤销；兼容表；3 个待确认点）、`docs/DEVICE_TEST_PLAN.md`（模拟器/真机分工表、模拟器结果、7 步真机流程、TestFlight 对比）、`docs/EDITORIAL_SYSTEM_PLAN.md`（现有 editorial 与设计板的差别；网格/照片角色/文字四级/1–5 张候选；复用 measuredBlock / checkQuality / layoutChecked / 分页建议；`book.layoutStyle` 默认 + `moment.layoutStyle` 覆盖，改书默认不重排已保存页、`layoutEdited` 永远不自动变；自动规则 + 人工评分验收；Story 作为同引擎的另一组候选；3 个待确认点）。
- **模拟器（Mac，`git archive` 导出 cc46e8d 到 /tmp/ld-build4，新建模拟器「LD B2 Check」iPhone 17e iOS 27.2，没有碰 Mac 工作区里其他会话的未提交修改）**：`-AppleLanguages (en)` → `navigator.languages ["en-US"]`、界面英文；`(zh-Hans)` → `["zh-CN"]`、中文；两次都没有示例页、没有连续记录和 Keeper 邀请，「选今天的照片」在首屏（448/773、423/739 px）。截图 `/tmp/ld-build4/en-home.png`（Mac 上）。
- **未做**：真机（尚无可用设备）；iPhone SE 尺寸模拟器未安装；Editorial 尚未实施（等确认）。

### 2026-11-13 — V10.40 C2 / C3：备份失败与状态（P0 第五批）

- **需求**：一个媒体文件异常不能让整份备份失败，但也不能悄悄漏掉；部分失败要有清单和状态，不能把不完整备份标成完整。取消分享不能被记成已备份。
- **根因**：`MediaStore.backup` 遇到任何缺失/读不出的文件直接 `throw`；`backup` 动作在 `link.click()` 之后立刻写 `little-days.last-backup`（浏览器和 iOS 外壳的分享面板都不会告诉页面是否真的保存了）。
- **修复**：`media.mjs` `backup(state, { allowMissing })` 逐个文件尝试，读不出的收集为 `missing`；不允许时抛 `backup-missing` 并带清单；允许时输出 `complete:false` + `missing:[{id,kind,name}]`（完整备份 `complete:true`）。`restore` 只容忍备份自己声明的缺失（必须同时 `complete:false`），这些引用原样保留；其他缺口仍拒绝，旧格式完整备份不受影响。`app.js`：读不出时弹出清单（类型、文件名、所在日期），取消不导出，确认才导出 `-incomplete.json`；导出后问「备份文件存好了吗？」，存好了才写 `last-backup`（完整）或 `last-backup-partial`（不完整，`{date, missing}`），没有/关闭什么都不记；设置里显示「上次备份不完整（缺 N 个）」以及上次完整备份日期。
- **兼容**：备份 JSON 只新增可选字段 `complete` / `missing`，`format`/`version` 不变；旧版本 App 读到不完整备份会按原逻辑拒绝（不改任何数据）。
- **测试**：`tests/v140.test.mjs` 2 项；`tests/v140-browser.cjs` 6 项（zh 375 / en 430：没有→不记、存好了→记；删掉一张照片的媒体记录后弹出清单含日期，取消不导出，继续得到 `-incomplete`（complete:false、清单正确、其余文件都在）且只记为不完整、设置显示不完整；新浏览器恢复不完整备份成功，缺的照片位置保留）。旧套件 v3 v31 v68 加了一步「存好了」，与 v104 v110 一起通过。
- **未做 / 风险**：100 MB 上限（C1 分卷）、恢复前快照（C4）按要求只出方案；iOS 外壳的分享面板仍不回报结果，所以靠用户自己确认——这是诚实但多一步的方案；真机上未验证。
- **回退**：`git revert` 本提交。

### 2026-11-13 — V10.39 B1–B5：首次体验（P0 第四批）

- **需求**：示例数据混入、默认语言、375 首页入口被遮、连续记录弹窗、Growth 残留。不能用删除数据的方式去掉示例；区分示例与用户自己保存/修改过的内容。
- **根因与修复**：
  - B1 新手帐由 seed 生成示例页（`journals`）、示例日子（`sampleDays`，按 `samplesVersion` 追加）和 3 个示例习惯。`start()` 现在给 `Store` 一份不含这三项的 seed：新手帐是空的；已有手帐的示例原样保留（不删除；Settings → 示例 只移除未修改的 `isDemo`，用户改过的示例早已 `isDemo:false`），以后也不再追加新示例。新安装的默认三本书按界面语言命名（`book.default.*`；已有的书不改名）。`little-days.with-samples=1` 只给旧测试套件保留旧示例手帐（`tests/signed-in.cjs` 设置）。
  - B2 `little-days.language` 为空时：没有任何使用痕迹（`hasTraces` / 已有手帐）→ 按 `navigator.languages[0]` 选中文或英文并保存；已经在用的人写入 zh-CN，保持原来的样子。
  - B3 Keeper 邀请卡从照片卡上方移到「今天怎么记」区域下方，并且只在第一页自己的内容保存后出现（旧示例模式除外）。375×667 首屏「选今天的照片」底部 475px < 导航栏 597px。
  - B4 `maybeCelebrate` 与 `streakChipHTML` 在 Labs 关闭时不出现（代码保留）。
  - B5 首页小计划里的习惯、书架「我的习惯」、日历「成长轨迹」页签与图例、Studio 的成长卡工具、`growth` 页路由都放到 `labsOn()` 后面；数据不动。
- **文件**：`Public/app.js`、`Packages/.../i18n.json`（`book.default.*`）、`Public/js/whats-new.mjs`（10.39）、`tests/signed-in.cjs`、新 `tests/v139-browser.cjs`。
- **测试**：`tests/v139-browser.cjs` 3 项（zh-CN 375 / en-US 430 真正首次打开：语言、首屏入口、无示例/习惯/连续记录/成长轨迹/我的习惯、英文书名、第一页保存后不弹印章、邀请出现在照片卡下方、打开 Labs 后 Growth 回来；英文设备上的老用户保持中文、示例/自己的页/习惯全部保留且不新增）。受影响的旧套件 v71 v110 已过；全量回归见 C 批日志。
- **未验证**：iOS WKWebView 里 `navigator.languages` 是否反映系统语言（Xcode 工程 knownRegions 有 zh-Hans，但没有 .lproj 资源），需要在模拟器用 `-AppleLanguages (zh-Hans)` 和 `(en)` 各启动一次确认；列入模拟器测试。
- **回退**：`git revert` 本提交；没有改数据格式，也没有删除任何数据。

### 2026-11-13 — V10.38 A3：长文字不再截断；放不下时文字接到下一页（P0 第三批）

- **需求**：Quick Edit 支持长文字；短文字标题式、长文字正文；完整保存；放不下时给分页建议；不允许静默截断/隐藏/丢失；验证旧页面和中英文长文字。不能只把 70 改大。
- **根因**：快速编辑文字框 `maxlength` 70（照片说明 120）且 `storyWordsInput` / `relayoutStoryWords` / `makeStory` 再 `slice(0,70)`；Studio 纸上标题 `data-max=70`、说明 120、写字卡标题 70、阅读器改名 70、自由文字框 300，都会无提示地吞掉多出的字。排版引擎本身（`lineFor`）早已能把长句排成正文。另外「一张照片 + 一页放不下的文字」时 `suggestSplit` 只能分照片，没有方案。
- **文件**：`Public/app.js`（`WORDS_MAX = 4000` 只作安全网，接近时才显示计数，到上限时明确提示 `sw.full`；去掉上述所有 70/120/300 截断；阅读器改名不再改写未改动的标题；分页建议在照片分不开时用 `suggestTextSplit`，预览里显示「第 N 页 · 文字」；确认分页时按建议重建分组，`keepLine` 让每页保留自己的文字（也修正了旧照片分页时可能把后一页文字错配到新页的问题）；`makeStory` 不再 trim/截断）；`Public/js/canvas.mjs`（纸上 inline 上限 70/2000 → 4000）；`Public/js/scrapbook-layout.mjs`（`layoutCore` 支持 0 张照片的文字页；`sentencePieces`；`suggestTextSplit`：照片页保留照片单独排时 ≥60% 的面积，文字不压页脚（≤93%），按句子切、单句超长时在逗号/空格处切，末页过短时与前一页平衡，`texts.join("") === title` 否则不建议）；`Public/js/day-story.mjs`（`tidy` 保留只有文字的分组 `wordsOnly`）；i18n 6 个键；whats-new 10.38。
- **测试**：`tests/v138.test.mjs` 4 项；`tests/v138-browser.cjs` 6 项（zh 375 / en 430：设计板 S7 74 字、S8 185 字 → 一页正文完整保存；465 / 930 字 → 分页建议，点之前不变，分页后拼回与原文完全一致、照片在第一页、每页文字在页内；Studio 79 / 195 字不截断）；Quick Edit 相关旧套件 v52 v60 v61 v64 v65 v66 v102 v119 v121 v126 v128 v129 v130 v133 全部通过；`npm test` 276 通过。截图人工看过：分页后照片保持大图，文字不贴页脚。
- **已知 / 未做**：以前已经被截断保存的旧文字无法找回（截断发生在输入时）。「保持一页」时放不下的文字仍可能超出页面，面板文案已如实说明并可随时再分页。Studio 自由排版页不做自动分页建议（只是不再截断）。没有在 iOS 模拟器里试中文输入法长文字。
- **回退**：`git revert` 本提交；不改数据格式（只是 title 可以更长，旧版本读到长 title 也不会出错）。

### 2026-11-13 — V10.37 A2：离开 App 时立即保存；「已保存」只在数据库写完后显示（P0 第二批）

- **需求**：加生命周期保存，但不只依赖进入后台那一刻；异步写入未完成时不谎报成功。
- **根因**：编辑时有 450 ms 防抖自动保存，但 `visibilitychange` 只处理 App 锁，`pagehide` 没有处理（iOS 切后台不触发 `beforeunload`），最后 450 ms 内的输入可能丢；`confirmMediaSaved` 在 IndexedDB 写入开始前就显示「已保存」（镜像关闭时 LocalStorage 也没写）。
- **文件**：`Public/js/model.mjs`（`Store.save` 记录最新一次持久化 `lastWrite`，新 `stored()` → true / false）；`Public/app.js`（`saveBeforeLeaving`：visibilitychange hidden / pagehide / freeze 时 `flushDraft`，失败显示「还没保存」并记事件；回到前台在编辑器 / 快速编辑里重新 `confirmMediaSaved`；`confirmMediaSaved` 先查照片再等 `store.stored()`，失败为 failed）；whats-new 10.37。
- **测试**：`tests/v137-browser.cjs` 8 项（zh 375 / en 430：编辑中已自动保存；防抖窗口内切后台 → LocalStorage 立即有、IndexedDB 随后有；pagehide 立即保存；IndexedDB 拒绝写入时一直是「还没保存」，切后台再回来仍是；恢复后点重试 → 已保存且数据库里有全文）。
- **未验证 / 风险**：iOS 真机上 App 被系统杀掉前 WebKit 是否完成 IndexedDB 事务、LocalStorage 是否已落盘，只能真机验证（列入真机测试）。原生外壳没有调用 `beginBackgroundTask` 争取后台时间，本批不改原生代码；如真机发现丢最后几个字，再加这一步。正在导入的照片在切后台时被杀，引用只在照片写入成功后才加入页面（原有逻辑），回到前台会重新检查。
- **回退**：`git revert` 本提交；不改数据格式。

### 2026-11-13 — V10.36 A1：手帐读取失败保护（P0 数据安全，第一批）

- **需求**：用户确认开始 A1。区分真正的新用户 / 数据库暂时读不出 / 格式不兼容 / 数据损坏，后三种不能当新用户，不能用空白状态覆盖。
- **根因**：`start()` 里 `meta.read()` 失败只 `console.warn`，`durableRaw` 为 null；LocalStorage 镜像关闭（手帐超过 ~5 MB）时 `Store` 走 `createInitialState`，下一次 `update` 把空白手帐写进 IndexedDB，覆盖原手帐。格式不兼容时 `Store` 抛中文硬编码错误，没有安全出路。
- **文件**：新 `Public/js/journal-open.mjs`（`checkJournal` / `decideJournalOpen` / `hasTraces`，纯函数）；`Public/app.js`（启动先判断，blocked 时显示 `showJournalRescue` 面板并 return，不创建 Store、不渲染、不写入）；`Public/js/model.mjs`（`Store` 新选项 `useDurable`）；`styles.css` `.rescue-panel`；i18n `rescue.*` 15 个键；whats-new 10.36。
- **规则**：有 LocalStorage 副本且可读 → 照旧；不可读 → damaged（有较早完整 IndexedDB 副本时可选「用较早的副本继续」，确认后先把损坏副本写进 IndexedDB `little-days.v1.rescue`，写成功才继续）；schemaVersion≠1 → incompatible（两份都不改）；IndexedDB 打不开 + 镜像关闭或有使用痕迹（account / mirror / seen-version / events / last-backup）→ unavailable，只能重试；IndexedDB 能开但应有的手帐没有 → missing，可确认「开始新的手帐」（那里没有可被覆盖的数据）；真正首次 → 新手帐；首次且 IndexedDB 打不开 → 新手帐但不写 IndexedDB（`persist: null`），以后能打开时不会遇到空白副本。所有 blocked 面板都可「保存原始数据副本」（下载 JSON，含每份原始文本），不用 alert/confirm。
- **测试**：`tests/v136.test.mjs` 6 项；`tests/v136-browser.cjs` 12 项（zh 375 / en 430 × 可读 / 损坏+较早副本+下载+取消+确认+保留 / 其他格式不改写 / 数据库打不开不写入且下次正常打开 / 缺失需确认 / 首次含数据库打不开）；`npm test` 272 通过；`tests/browser.cjs` 通过；全量浏览器回归见下一条日志。
- **已知/未验证**：真机上 IndexedDB 打不开的真实概率和表现没有验证；iOS 外壳里「保存原始数据副本」走 WKDownload → 分享面板，未在模拟器点过。
- **回退**：`git revert` 本提交即可；不改数据格式，不迁移任何数据。

### 2026-11-13 — V10.35 Captain 卡片：打开就知道现在可以做什么（固定链接第 98 版）

- 需求：
  - 用户回复「可以」，确认 Captain 按设计板 v2 实施；另外提醒「记得更新一下 GitHub」。
  - 要求：
    - Contextual Actions 负责做事，Chat 负责自然对话，不再加回四行固定目录；
    - 状态优先级：刚完成 > 今天已记；回顾状态只在真的看过以前的页面后出现；
    - 不每次重复同一句，不催促、不打卡，只有照片的一页也是完整的记录；
    - 键盘安全区；Qwen 不可用时给出准确说明；
    - 375 / 430、中文 / 英文都要验证；
    - 不新增 AI Agent 或记忆。
- 文件：
  - `Public/app.js`（Captain 面板）、`Public/styles.css`、i18n（`cp.*` 20 条、`kp.writeHelp`、`kp.simple`、`kp.localDown`）、`Public/js/whats-new.mjs`（10.35）；
  - 测试：新增 `tests/v135-browser.cjs`；迁移 v71、v103、v105、v109、v113；`package.json`；
  - 文档：`docs/CAPTAIN_UX_PLAN.md`（实施记录）、`docs/ARCHITECTURE.md`。
- 功能：
  - 面板顺序：头像 + 名字 → 聊天 / 玩耍 / 装扮 → 卡片 → 聊天 → 输入框。
  - A 状态：〔选照片〕〔随手写〕。
  - B 状态：刚收好一页（15 分钟内；「今天的故事」保存和编辑器「完成」都算）。有字时〔继续编辑〕〔看看成品〕，没字时〔写一句话〕〔看看成品〕。
  - C 状态：今天已记，〔翻翻今天〕，多页时写「今天 n 页」。
  - D 状态：30 分钟内在阅读器里看过以前的一天，写真实日期和页面名，〔继续翻阅〕。
  - B 和 D 都满足时，看后发生的那个。
  - 每个状态 2–3 句，再打开换下一句。
  - 没聊天时面板只有内容那么高；开始聊天后展开；有聊天时打字，卡片让位。
  - 代写请求：如实说「还不会」，附两个真能用的按钮。
  - 本机模型没有回应时，回复下面写明是简单回复；没开本机模型时，底部写「现在是简单聊天…」。
- 决定：
  - 整理今天、回顾以前、这周写了什么，改为在聊天里说，不再是固定行，因为用户要求不加回功能目录。
  - 回顾以前需要「翻看以前的页面」许可：聊天会说明去设置里打开。原来面板里的许可页没有入口了，代码保留。
  - 卡片状态只在内存里，没有新数据字段，所以不用改 `Models.swift`。
- 运行：
  - `npm test` 266 通过；`python3 -m unittest` 通过；
  - `v135-browser` 13 项通过（中文 375、英文 430 各 6 项，再加本机模型无回应）；
  - v71、v103、v105、v109、v113 迁移后通过；
  - 全量浏览器回归 73 个脚本一次全部通过（含 v135 和 v3）。
- 未完成：
  - iOS 模拟器（a8d24a9 的 `git archive` 导出，Debug 构建成功）：375 × 667 中文、430 × 932 英文都打开了 Captain，显示 C 状态（「今天 10 页」，是 L4 检查留下的真实页数）、〔翻翻今天〕和「现在是简单聊天…」，底部在 Home 指示条上方。截图在 Mac 的 `/tmp/ld-build3/l4/captain`。A、B、D 和聊天只在 Chromium 里验证过；iPhone 真机没测。
  - 「今天怎么记」主按钮对比度（约 3.4:1）没有改，等用户决定。

### 2026-11-13 — L4：在 iOS 模拟器里用 iPhone 字体核对排版；入口 Safe Area（没有改 `Public/`，固定链接不变）

- 需求：
  - 用户说 Mac 打开了。继续 L4：用 iOS 真实字体核对排版和测量。
  - 补做 V10.32 入口在模拟器里的 Safe Area 检查。
- 文件：
  - `Native/Sources/LittleDaysUI/WebShell/LittleDaysWebShellView.swift`：Debug 版新增 `-LittleDaysCheck`；
  - 新增 `tools/mac/ios-layout-check.js`、`tools/mac/ios-layout-check.sh`；
  - 文档：`docs/LAYOUT_QUALITY_PLAN.md`（L4 一节）、`docs/QUICK_ENTRY_PLAN.md`、`docs/ARCHITECTURE.md`。
- 做法：
  - Mac 上只用 `git archive` 导出 9366925 到 `/tmp/ld-build3/src`，在导出里加上同样的 Swift 改动（两边 sha 一致），然后 Debug 构建，`BUILD SUCCEEDED`。
  - Mac 项目目录里另一个会话没提交的 `project.pbxproj`、`Package.resolved` 和 4 个 Qwen 结果文件没有碰。
  - 新建两台只用来测试的模拟器：`LD L4 375`（375 × 667）、`LD L4 430`（430 × 932），都是 iOS 27.2。原来的模拟器和数据没有动。
- 结果：
  - 中文 375、英文 430 两种设置下，8 个案例全部通过：照片尺寸达标，文字不压照片、不出页；两个「太多」的案例建议分 2 页，分开后每页合格、每句话都在。
  - 校准：中英混排 + 宋体 + 大一号，iOS（Songti SC）排 3 行，Linux Chromium 排 2 行；「回家路上看到 sunset」iOS 两行、Chromium 一行。App 按真实测量排，iOS 上这几页的排法不同，但都合格。其它文字高度两边一致。
  - 规则数值不变。
  - Chromium 英文全流程第一次跑时，6 张 + 长文字 + 说明的案例排进了一页（这一页本身合格），之后 4 次都是建议分页，原因没有找到。
- 入口 Safe Area（模拟器截图）：
  - 375 × 667 中文、430 × 932 英文下，视频 / 声音 / 自由排版都在第一屏；
  - 选视频后显示说明，按钮变成「选一段视频」；
  - 「取消」在 Home 指示条上方。
- 截图：在 Mac 的 `/tmp/ld-build3/l4/out` 和 `/tmp/ld-build3/l4/entry`，已经在 Finder 里打开。截图太大，传不到云端会话，所以没有放进设计页，也没有提交到仓库。
- 运行：
  - `npm test` 266 通过，`python3 -m unittest` 通过；
  - iOS 模拟器检查 2 轮；Chromium 对照 4 轮；
  - Swift 改动在 Debug 构建里编译通过。
- **Captain**：
  - 准备开始实施时，自动权限检查拦下了代码修改。原因是「确认 mac 也打开了」不能明确算作确认了 Captain 设计。
  - 已加的文案也撤回了，`Public/` 没有改动。等用户明确确认再做。
- 未完成：iPhone 真机；手账和拼贴风格的 iOS 逐张检查；Captain 实施（等确认）。
- 预览：本地预览服务到了 2 小时上限后停止了，按会话规则没有再启动（固定链接不受影响）。

### 2026-11-13 — 排版质量 L1–L3：V10.33 真实测量 + 质量规则 + 备选排法，V10.34 建议分页（固定链接第 97 版）

- 需求：用户确认 L1–L4 的方向和调整：
  - 20% / 5.5% 是初始下限，要用真实页面校准（尤其是 Meme、截图、9:16）；
  - 1/3 是软规则，允许主图 + 配图，不过度裁切；
  - 长文字按真实渲染行数、真实字体、用户字号判断，不缩字号、不截断；
  - 分页只在没有合格单页时建议，给出单页 / 多页对比，由用户选；保留全部照片、文字、说明和顺序；
  - 真实字体测量提前到 L1；每阶段独立测试、可回退；
  - 已保存、手动调整过的页面不能未经确认重新排版。
- 文件：
  - `Public/js/scrapbook-layout.mjs`（主体）、`Public/app.js`、`Public/styles.css`、i18n（`qe.split.*` 8 条）、`Public/js/whats-new.mjs`（10.33 / 10.34）；
  - 测试：新增 `tests/v133-browser.cjs`、`tests/v134.test.mjs`；迁移 `tests/v119.test.mjs`、`tests/v128.test.mjs`；`package.json` 加 `test:browser:v133`；
  - 文档：`docs/LAYOUT_QUALITY_PLAN.md`（实施记录）、`docs/ARCHITECTURE.md`。
- **L1 测量与规则**：
  - App 给引擎一个 `measure(text, size, width, fontId, weight)`（`measureWords`）：在屏幕外 1000 px 宽的页面上，用和画布相同的 `textCSS` 渲染文字，量真实高度，有缓存；
  - 字体没加载完时返回 null，引擎改用保守的换行计数 `wrapLines`（英文整词、中文标点不放行首、宽字母更宽）；字体加载好后 `fontsArrived()` 重排正在做、没手动调整过的故事；
  - 文字按最终字体和字重量（页面选的字体，而不是风格默认字体）；
  - 那句话在标题字号下两行以内保持标题，否则用 16 × 字号档位的正文，不缩小、不截断；
  - 照片说明宽度 = 照片宽；文字压东西的容忍度从「每样 6%」改成「总共 0.3%」；
  - `checkQuality`：硬规则（照片短边 ≥ 20%、很高的图 ≥ 26%、面积 ≥ 5.5%、文字不压照片/文字、不出页、杂志风格照片不重叠），软规则（大小平衡 1/3 或 1/5、空白带 ≤ 24%）。
- **校准**：真实页面里 9:16 Meme 在 20% 宽时上面的字只有约 8 px，所以宽高比 ≤ 0.62 的图片短边下限提到 26%（`minShortTall`）。
- **L2 备选排法**：风格自己的三种排版先检查，合格的照片位置和以前完全一样；不够时再试整齐的几行（每张照片有最小宽度，主图过大时缩主图那行）、两栏（底部对齐）、高图一栏 + 其它几行。只给合格且互不相同的排法（最多 3 种），「换个排版」的缩略图数量跟着变。
- **L3 建议分页**：`suggestSplit` 只在没有合格单页时运行，按顺序分 2–4 页，每页必须合格，那句话和录音在第一页。「今天的故事」底部的建议卡显示「现在 · 一页」和每一页的小图，〔保持一页〕〔分成 N 页〕，并说明保持一页的代价。分页复用照片分组（`splitAt` + `story-regroup`），每组保留页面的字体设置。选〔保持一页〕后，在「换个排版」里还能重新分页。
- **顺带修复**：Quick Edit 换照片后再调整照片分组，旧照片会回来（分组里还存着旧引用）。现在换照片时分组一起更新，撤销一起恢复。
- 已保存页面不重排：引擎只在「今天的故事」新建或重排时运行；字体加载后的重排遵守 `layoutEdited`。
- 引擎矩阵（每种风格 480 页，估算路径）：杂志 399 合格 / 81 需分页；手账 339 / 141；拼贴 369 / 111；没有「既不合格也分不了」的页面。最慢一页约 0.35–0.4 秒（只在需要分页时）。
- 容量（杂志风格）：1–3 张总是一页；4 张含 9:16 只在长文字 + 每张都有说明时建议分页；5 张竖图只在长文字 + 说明时；6 张大多数有字的组合建议分页；8 张分 4 + 4。
- 运行：
  - `npm test` 266 通过（新增 v134 8 项）；`python3 -m unittest` 通过；
  - `tests/v133-browser.cjs` 16/16（中文 375、英文 430 各 8 个案例：问题 1 无说明 / 有说明→分 2+2、问题 2、问题 3、单张 Meme、2 横 1 竖、中英混排 + 宋体 + 大一号、6 张 + 长文字 + 说明→分 3+3；检查照片短边、面积、文字不压照片、正文字号、分页后照片和说明都在）；
  - 全量浏览器回归 72 个脚本一次全部通过（含 v3）。
- 提交说明：L1、L2、L3 改在同一批文件里，而且 L1 单独会让一个旧用例失败（要 L2 的备选排法才过），所以合成一个提交；L3 的界面（建议卡、`story-split-*`、`qe.split.*`、`.qe-split`）可以单独删掉回退，引擎的 `suggestSplit` 不被别处使用。
- **没验证 / 受阻**：
  - L4：iOS 模拟器里用 PingFang 等真实字体核对测量和页面；入口的 Safe Area。Mac 14:05 UTC 后一直没响应。
  - iPhone 真机没测；手账和拼贴风格只跑了规则矩阵，没有逐张截图检查。
- 下一步：Mac 回来后做 L4 和入口 Safe Area；Captain 设计板 v2 等用户确认后实施。

### 2026-11-13 — V10.32「今天怎么记？」入口（固定链接第 96 版）；Captain 设计板 v2（只出预览）

- 需求：
  - 用户确认入口方案，可以实施，要求：
    - 卡片缩小后仍然好点、字看得清；
    - 375 / 430、中文 / 英文和 Safe Area 都要验证；
    - 主按钮的文字和动作跟着方式变化；
    - 日期、书和草稿不丢；
    - 视频沿用现有的保存方式；
    - 只做最小改动。
  - Captain：按用户给的文案和「状态卡片 = 做事、聊天 = 说话」的分工更新设计板，先预览、确认后再实施。
  - 排版 L1–L4：用户确认了方向和调整。数值是初始下限；1/3 是软规则；长文字按真实行数判断；真实字体测量提前到 L1。
- **入口实施**（`Public/app.js`、`styles.css`、i18n 新增 7 条）：
  - 视频、声音、自由排版成为三张主卡片下面一排紧凑按钮（`QUICK_ALSO`），原来最下面的「其他」一行去掉；
  - 卡片的图从 4:5 改成 4:3，名字和小字说明保留；
  - 选这三种之一时，照片来源换成一句说明（`quick.say.*`），主按钮变成 `quick-more`，`data-more` 对应所选方式，文字用 `quick.start.video / voice / layout`；
  - 书和日期都在 `quick` 里，切换方式不会变；
  - 视频仍走 `quickMore` → `#video-input`，和原来是同一条保存路径；
  - 这三种不会记成下次的默认方式；
  - 第一次打开（没有记住的方式）时，默认从「随手写」改为「照片 + 一句话」。
- 实测位置（Chromium）：
  - 375×667 中文：视频 307–347 px（原来 652–682，超出屏幕）；
  - 375×667 英文：319–359 px；
  - 375×812：394 px；
  - 430×932：514–556 px；
  - 320×568：325–365 px，但「开始」按钮在屏幕外，要往下滑。
  - 375×667 下选「照片 + 一句话」时，「开始」按钮在 685 px，也要往下滑一点。这是原来就有的情况：照片来源和书本选择在它上面。
- 测试：
  - 新增 `tests/v132-browser.cjs`，在 zh/en × 375/430 下检查：
    - 视频、声音、自由排版在第一屏，并且在照片来源和书本选择之前；
    - 第一次打开默认选照片，照片卡片最大；
    - 选视频后照片选项消失，出现说明，按钮文字和动作都对，书保留，真的打开 `#video-input`，新页面在所选的书里；
    - 补记昨天时选视频，页面仍在昨天；
    - 下次打开时没有把视频记成默认方式。
  - 旧测试迁移：v33、v36、v51（选择器只取三张主卡片；v33 先点「随手写」）、v52（先点自由排版再开始）。
  - `signed-in.cjs` 给旧测试预设上次用的方式为「随手写」；v132 会清掉这个预设，检查第一次打开的默认值。
- 运行：
  - `npm test` 258 通过；`python3 -m unittest` 通过；
  - 全量浏览器回归（71 个脚本）：64 个一次通过；v33、v36、v46、v48、v51、v108 迁移或重跑后通过；
  - v3 仍然时过时不过（加视频后等工具栏），原来就这样。
- **没验证**：iOS 模拟器里的 Safe Area 和真实屏幕高度。Mac 在这期间停止响应（14:05 UTC 后），等它回来再测。
- **Captain 设计板 v2**（只在 `scratchpad/lq/wt` 原型里，正式代码没改）：
  - 用户给的 A–D 文案；B 已有文字时按钮是〔继续编辑〕〔看看成品〕；C 多页时用小字写「今天 2 页」；D 用小字写真实的日期和页面名；
  - 每个状态 2–3 句，第一次打开用用户给的那句，再打开换下一句；
  - 优先级：「刚完成」（15 分钟）和「刚回顾」（30 分钟）里后发生的那个优先，其次 C，最后 A；
  - 没有聊天记录时面板只占需要的高度，开始聊天后展开；
  - 有人请 Captain 代写时，如实回答「我还不会替你写」，并给〔选照片〕〔随手写〕按钮；
  - 没有 Qwen 时，输入框下面写明「简单聊天」能做什么。
  - 截图：A、B 无字、B 有字、C 两页、D、有聊天记录，以及 A 第二次打开，375 中文 / 430 英文都有。设计页 https://claude.ai/artifact/KgAuNDg4mgsgKYhUbDyj1A 第 2 版。
- 下一步：排版 L1（真实字体测量 + 规则 + 长文字），然后 L2、L3；Captain 等确认后实施。

### 2026-11-13 — 设计轮：排版质量规则与建议分页、Captain 重新定位、「今天怎么记」入口（只出方案，没改 App 代码）

- 需求（三份）：
  - **Auto Layout Quality Rules & Overflow Fix**：不要为三个案例写死参数，要建立规则：照片最小尺寸、文字不得压照片、三张照片的视觉平衡、放不下时建议分页、质量检查和自动换方案。要求先交 7 项（根因、规则、单页 / 分页条件、修复前后对比、375 / 430 结果、对数据的影响、分阶段方案），确认后再实施。
  - **Captain UX Repositioning**：Captain 是记忆陪伴，不是通用聊天机器人；设计 A–D 四种状态，每种最多两个能直接执行的操作；本轮只出设计。
  - **Quick Create Entry Discoverability**：视频、声音、自由排版放到照片来源和书本选择之前，375 / 430 第一屏可见；选视频直接进视频流程。先给预览。
- 做法：
  - 只在临时 worktree（`scratchpad/lq/wt`，HEAD c7af14c）里做原型，在 8110 端口运行，和 8080 上的正式版并排截图；
  - 正式代码一行没改。原型差异保存在 `docs/prototypes/2026-11-13-layout-captain-entry.patch`。
- **排版根因**（详见 `docs/LAYOUT_QUALITY_PLAN.md`）：
  - 长文字被当成 19 号、4 行的大标题，先占约 30% 页高；
  - 大照片再拿剩余高度的 60%；
  - 同一行照片等高，所以竖图会被压得很窄；
  - 照片说明最小宽 26%，比 19% 宽的照片还宽；
  - 每样东西允许压 6%，加起来能压 11%；
  - 文字高度按字数估算：Chromium 用 App 自己的 9 种字体实测，225 种组合里 34 种偏低，20 种少算一行以上，最多 1.67 倍；
  - 有时三种排版完全相同。
- **原型规则**：
  - 照片短边 ≥ 20%、面积 ≥ 5.5%；
  - ≤ 4 张时最小 ≥ 最大的 1/3，否则 1/5；
  - 文字压照片为 0、不出页面，空白带 ≤ 24%；
  - 照片说明宽度等于照片宽；
  - 长文字用 16 号正文；
  - 按浏览器的换行方式测量文字。
- **原型结构**：
  - 合格就保持原样；
  - 否则依次试整齐的几行（窄照片有最小宽度；主照片太大时缩主照片那一行）、两栏、竖图单独一栏加其它照片几行；
  - 都不合格时给出分页建议（2–4 页，按顺序分，那句话在第一页，字跟着照片）。
  - 在「今天的故事」里显示建议卡和两页预览，〔分成 2 页〕复用分组的 `splitAt` 和 `story-regroup`。
- **原型结果**：
  - 规则矩阵每种风格 480 页：杂志现在 302 页不合格 → 原型 414 合格（114 页和现在完全一样）、66 建议分页、0 仍不合格；手账 220 → 345 / 135 / 0；拼贴 318 → 381 / 99 / 0；
  - 速度：大多数页面 4–50 ms，需要建议分页的最多约 0.4 秒；加缓存前最慢 11 秒；
  - 8 个案例在 375 中文和 430 英文都用真实流程截了修复前后的图，保存后阅读器正常。
- **Captain**：
  - 现在的四行入口里，「整理今天」「回顾回忆」与已有功能重复；「帮我写一句话」显示为「需要 AI 小管家，还没有开放」。
  - 原型用一张状态卡片代替四行入口：
    - A 选照片 / 随手写；
    - B 写一句话 / 看看成品；
    - C 打开今天；
    - D 接着往下翻 / 回到今天。
  - 文案只用日期、张数和用户自己的字。四种状态都截了图。
- **今天怎么记**：
  - 实测 375 下视频入口在 652–682 px，屏幕高 667，超出屏幕；原型移到三张卡片下面，在 277–315 px。430 下从 822 移到 518。
  - 选「视频」后照片选项换成视频说明，按钮变成「选一段视频」。
  - 代价：卡片下的小字收起来了。
- 文档：新增 `docs/LAYOUT_QUALITY_PLAN.md`、`docs/CAPTAIN_UX_PLAN.md`、`docs/QUICK_ENTRY_PLAN.md`、`docs/prototypes/2026-11-13-layout-captain-entry.patch`；ROADMAP 加了 2b。
- 预览页：https://claude.ai/artifact/KgAuNDg4mgsgKYhUbDyj1A （固定链接没有更新，因为正式代码没变）。
- 运行：都是原型和截图脚本，没有改正式测试。正式代码没有变化，所以没有重跑全量回归。
- 没测：iPhone 和模拟器上的真实字体测量；手账、拼贴风格的逐张截图（只跑了规则矩阵）。
- 等用户确认：
  - 最小尺寸数值；
  - 长文字改成正文；
  - 建议分页的交互和 L1–L4 顺序；
  - Captain 的四种状态；
  - 入口卡片下的小字是否收起。

### 2026-11-13 — iOS 模拟器检查 Quick Edit；V10.31 底部按钮固定在屏幕底部（固定链接第 95 版）

- 需求：用户问现在做到哪个优先级，随后告诉我 Mac 已经开机，可以接着用模拟器检查。
- Mac 仓库：
  - 只读检查，仍然停在 49479dd；另一个会话没提交的 `project.pbxproj`、`Package.resolved` 和 4 个 Qwen 结果文件没动；
  - 只做了 `git fetch`（不改工作区）；
  - 用 `git archive` 把 97018a3 导出到 `/tmp/ld-build3/src`，在那里构建 Debug（成功）。
- Debug 驱动 `-LittleDaysTap` 的 `upload:` 现在可以一次给多个文件，路径用逗号隔开（`LittleDaysWebShellView.swift`，只在 Debug 构建生效）。这样能模拟「一次选两张照片」。
- 模拟器 `LD P0 Verify`（iPhone 17 尺寸），用脚本点击跑了一遍：
  - 选两张照片 → 换照片面板选第 2 张 → 替换 → 撤销 → 换排版选「错落」→ 写文字 → 保存 → 阅读器。
  - 截图里：第 2 张有描边和「第 2 张」标签；替换后有提示；三个排版小图正常；写文字时字体与样式是收起的；阅读器里没有选中框或蓝框。
  - 本机事件记录顺序是 qe_replace → qe_undo → story_relayout（错落）→ story_saved。
  - LocalStorage 里两次运行保存的页面：第 2 张都是撤销后的原照片（比例 0.8），排版编号 1。第二次安装并启动后，第一次的页面还在。
- **发现并修复**：屏幕高时页面内容比屏幕短，底部按钮停在页面下方，下面留出一大片空白。Chromium 测试用的 375×667 屏幕较矮，所以之前没发现。
  - 修复（`styles.css`）：故事视图的 `#app` 用 `:has(> .qe-bar)` 改成纵向 flex，最小高度占满，底部按钮 `margin-top: auto`。
  - 模拟器里复查：按钮已贴在屏幕底部。
  - v129 新加检查：按钮底边要在屏幕底部 60px 以内。没修时 430×932 下按钮底边在 703，测试会失败。
- 没验证：
  - 手动触控和键盘弹出：脚本点击不算真的触摸，iOS 不会弹出键盘；
  - 系统相册：用 `upload:` 跳过了系统选择器；
  - 真机。
- 运行：
  - `npm test` 258 通过；`python3 -m unittest` 通过；
  - 和故事视图相关的 15 个浏览器测试全部通过：v51、52、53、55、60、61、64、65、100、119、121、126、128、129、130。
  - 只改了 CSS，所以没有重跑全量；上一次全量回归 70 / 70。
- 文档：
  - ROADMAP：核心流程那一行原来写着「F1–F7 等用户确认」，已更新为本轮进度；
  - QUICK_EDIT_PLAN 第 8 节第 6 行、MAC_LOCAL_DEV（多文件 upload）。
- 发布：固定链接**第 95 版**。
- 下一步：用户手动测 `QUICK_EDIT_IPHONE_CHECK.md` 和 `P0_MEDIA_TEST.md`。

### 2026-11-13 — Step 5：完整回归 + V10.30 长文字排版修复（固定链接第 94 版）

- 需求：
  - 回归 6 项：单 / 双 / 多张照片和不同比例；有字、没字、长文字；替换 / 撤销 / 保存 / 重开；Quick Edit 和自定义之间切换；现有页面不意外重排；iPhone 触控、键盘和阅读器。
  - 每个阶段报告改动、测试和剩余风险。
- 新测试：
  - `tests/v130.test.mjs`：864 种组合，共 16 组照片（1–5 张；4:3 / 3:4 / 16:9 / 9:16 / 1:1）× 3 种文字 × 有无每张照片自己的字 × 3 种风格 × 3 种排版。检查：
    - 照片在页面内、完整不裁切、不小于可见尺寸；
    - 杂志风格的照片不重叠；
    - 文字在页面内、不压照片（拼贴风格除外）；
    - 没写的字不留空框。
  - `tests/v130-browser.cjs`：在 App 里选 1 / 2 / 3 / 5 张照片，分没字和长文字两种，依次保存、看阅读器、刷新；记录排版用时。
- **发现并修复**（`scrapbook-layout.mjs`）：
  - 两张照片配长文字（超过约 24 个汉字宽，旁边那栏放不下）时，第二张只有约 11% 宽。现在也走 `pairLayout`，文字放在照片下面；短文字仍然用「照片 + 旁边一栏字」。
  - 很多张照片配长文字时，大照片下方区域太矮，其他照片缩到 3–10% 宽，还有一行字压到照片 22%。现在只要有一张不到 14% 宽，就把所有照片排成整齐的几行。
  - 只影响新排的页面：已保存的页面不会重算。
- **v3 不稳定的来源**：V10.27（f0c54e5）单独连跑 4 次失败 3 次，Step 3（64f4271）4 次失败 2 次，当前代码 4 次失败 2 次。这是原来就有的问题（加视频后等工具栏，时间不稳定），和这轮改动无关；这次全量回归里它通过了。
- 运行：
  - `npm test` 258 通过；`python3 -m unittest` 通过；
  - **全量浏览器回归 70 / 70 通过**（Chromium，含 v128、v129、v130）。
- 计时（Chromium，本机容器，没有其他任务时）：从选好照片到排好的页面出现，1 张约 0.1 秒，2 张约 0.13 秒，3 张约 0.2 秒，5 张约 0.3 秒。和其他测试同时跑时会慢到约 3 秒。
- **未验证**：iPhone 真机或 Xcode 模拟器的触控、键盘弹出、系统相册单选、阅读器显示。Mac 当时处于睡眠，连不上。手动清单见 `docs/QUICK_EDIT_IPHONE_CHECK.md`（9 步，约 5 分钟）。
- 没有修的小问题，记在 `docs/QUICK_EDIT_PLAN.md` 第 8 节：
  - 9:16 竖图和三张照片配长文字时宽约 11%；
  - 五张竖图每张都写字时，有一行字压到照片约 10%；
  - 三张照片配长文字时下面两张偏小。
- 修改文件：
  - `Public/js/scrapbook-layout.mjs`、`whats-new.mjs`（10.30）；Native WebApp 同步；
  - `tests/v130.test.mjs`、`tests/v130-browser.cjs`（新）、`package.json`；
  - `docs/QUICK_EDIT_PLAN.md`（第 8 节）、`docs/QUICK_EDIT_IPHONE_CHECK.md`（新）。
- 发布：固定链接**第 94 版**。
- 下一步：
  - 用户在 iPhone 上按清单测试，同时做 P0 测试；
  - Mac 醒来后在模拟器里检查 Quick Edit；
  - 视反馈决定是否处理上面的小问题。

### 2026-11-13 — Step 2：V10.29 Quick Edit（固定链接第 93 版）

- 需求：
  - 底部提供〔换照片〕〔写文字〕〔换个排版〕〔保存〕；
  - 点照片就能选中并替换，不进入「自定义」；
  - 替换时默认保留关联文字，可撤销；
  - 写文字直接进入输入，字体和样式默认收起；
  - 「换个排版」展示三个布局缩略图，下一行是杂志 / 手账 / 拼贴；
  - 「自定义」放在右上角；
  - 布局和风格分开管理，切换任一项都不能丢内容。
- 实现（`Public/app.js` 故事视图，加 styles、i18n 新增 27 条 `qe.*` 文案）：
  - 顶栏右侧是「自定义」（`story-adjust`）。底部 sticky 区域是面板加四个按钮。原来的风格行、「↻ 重新排版 / 写一句 / 调整分组」按钮行和「✎ 自定义」都移走了。
  - **点画布**（`story-tap`）：点到照片就选中它，打开换照片面板：
    - 页面上描边并标「第 N 张」，面板里是这一页照片的真实缩略图；
    - 面板按钮是「给这张写字」和「替换这张照片」。
    - 没点到照片就打开写文字（整体那一句）。
  - **替换**（`story-replace` → `chooseAttachment({kind:"story-replace"})` → `handleImageUpload`）：
    - 照片字节先写进 IndexedDB 再改数据，不经过照片编辑器；
    - `storyReplacePhoto` 只改那张照片图层的 `mediaRef / aspect / text / crop`，图层 id 不变，所以 `caption` 跟着它；
    - 封面上的副本一起换；
    - 没手动调整的页面重排，双照片按 `arrangement` 保持原来的排法；手动调整过的页面只把新照片放进旧框里。
  - 提示条「已换成新照片 · 第 2 张的文字保留了 · 撤销」：撤销恢复替换前那个 Moment 和封面字段的快照。新照片的字节留在 IndexedDB，不删除。
  - **写文字**：
    - 打开就聚焦输入框（在同一次点击里，iOS 才会弹键盘）；
    - 字体与样式放进 `<details class="sw-more">`，默认收起；
    - 加了「可以不写，直接保存」；
    - 底部「写文字」总是先打开整体那一句。
  - **换个排版**：
    - 三个排版用页面副本算出来并画成真实小图，双照片时名字是并排 / 上下 / 错落，否则是排版 1 / 2 / 3；
    - 下一行是风格，最下面是「调整照片分组」（照片多于 1 张时）；
    - 手动调整过的页面换排版前先确认。
  - 排版（`layoutVariant`）和风格（`layoutStyle`）分开存：换风格不改排版编号。
- 数据：没有新增字段。`story.panel / pick / notice` 只在内存里。
- 迁移的测试：
  - `signed-in.cjs` 新增 `storyLayoutPanel / storyStyle / storyNextLayout / storyRegroup / openTypeTools / closeStoryPanel`；
  - v52、v53、v60、v61、v119、v128 改用面板。v119 的「点照片打开它的字」改成「点照片 → 给这张写字」。
- 新测试 `tests/v129-browser.cjs`（中文 375、英文 430）：
  - Flow B：点第 2 张 → 描边 → 给它写字 → 替换（同一图层、新媒体、文字保留、排法不变）→ 撤销 → 再替换 → 写整体（输入框已聚焦、样式收起）→ 改字体；
  - Flow F：三个真实小图 → 换排版 → 换手账（排版编号不变）→ 替换另一张并改字 → 自定义再返回（数据完全一致）；
  - Flow C：保存并刷新后，每句话仍按照片对应，标题、风格和字体都在，阅读器显示两张新照片；
  - 手动调整过的页面换照片：所有位置不变。
- 运行：
  - `npm test` 239 通过；`python3 -m unittest` 通过；
  - 全量浏览器回归（69 个脚本）：67 个一次通过；v128 迁移后通过；v3 时过时不过（下面单独说明）；
  - v129 全部通过，脚本跑完整个 Flow B → F → C 约 3 秒（不代表人的操作时间）。
- **v3 不稳定（不是这次改动引起的）**：
  - 失败点是 v3 第 255 行加视频后等工具栏，30 秒超时；
  - 当前代码单独连跑 4 次，2 次失败；
  - Step 3 提交（64f4271）连跑 4 次，同样 2 次失败；
  - 因为这两次都会失败，所以不是 Quick Edit 引起的。V10.27 的对照结果见 Step 5 记录。
- 发布：固定链接**第 93 版**。线上 app.js、styles.css、i18n 先读回，sha256 和 64f4271 一致才覆盖。
- 剩余风险：
  - 375 宽度下打开面板后，能看到的页面变少（约 280px），所以选中的照片会自动滚到面板上方；
  - 「点照片」从「写这张的字」改成了「选中这张」，老用户需要多点一下「给这张写字」；
  - 撤销只有一步；
  - 被换下或撤销掉的照片字节留在 IndexedDB，不自动清理；
  - iPhone 真机的键盘、系统相册单选和触控都没验证（Mac 当时处于睡眠）。清单见 `docs/QUICK_EDIT_IPHONE_CHECK.md`。
- 下一步：Step 5。

### 2026-11-13 — Step 3：V10.28 双照片自动排版（固定链接第 92 版）

- 需求（用户确认 V10.27 的 4 项建议，按 Step 3 → Step 2 → Step 5 实施）：
  - 并排 / 上下 / 错落三种，按照片比例、空间利用率和视觉平衡自动选；
  - 没写字时不留空白文字栏；默认完整展示照片，不裁切；
  - 现有页面和手动调整过的布局不被自动覆盖；
  - 「换个排版」可手动切换三种，内容全部保留。
- 实现（`Public/js/scrapbook-layout.mjs`，只改杂志风格、两张照片、没写标题这一种情况）：
  - 新增 `pairLayout(visuals, region, frame, variant)`：算三种排法：
    - 并排；
    - 上下；
    - 错落（第二张下移约三分之一）。
  - 两张形状差很多时，小的那张在共同边上放大到「一半差距」，面积比由形状比开方得到。例如 16:9 配 9:16 从 0.32 提到 0.56，4:3 配 3:4 从 0.56 提到 0.75。
  - 打分：`占满程度 × (0.55 + 0.45·均衡) × (0.6 + 0.4·横向占满)`，均衡 < 0.35 时打对折。
    - `variant` 0 是得分最高的，1、2 依次往下；同分时按并排 → 上下 → 错落。
  - 排好后整页垂直居中，页脚那行字（y ≥ 95）不算内容。
  - `layoutMoment` 的结果多了 `arrangement`（row / column / stagger），Step 2 的缩略图和换照片时保持排法会用到。
  - 照片自己有文字（caption）、但没写整页标题时，也用新排法，文字紧贴在各自照片下面。
  - 写了标题的两张照片、手账 / 拼贴风格、其它张数：都不变。
- 现有页面安全：
  - 排版引擎只在「今天的故事」里新建、点「重新排版」、换风格、改字时运行。已保存的页面的位置存在图层里，不会被重新计算。
  - `layoutEdited` 的页面仍然要先确认才会重排。
  - v128 用一页按旧版排法保存的两张照片验证：
    - 走过日历、阅读器、编辑器，刷新两次；
    - 每个图层的位置都没变。
- 「换个排版」：Step 3 先沿用「↻ 重新排版」，在三种排法之间循环。三个缩略图在 Step 2 加。
- 修改文件：
  - `Public/js/scrapbook-layout.mjs`、`Public/js/whats-new.mjs`（10.28）；Native WebApp 同步；
  - `tests/v128.test.mjs`（新，20 项）、`tests/v128-browser.cjs`（新）、`package.json`。
- 运行：
  - `npm test` 239 通过；`python3 -m unittest` 通过；
  - **全量浏览器回归 68 / 68 通过**（Chromium，含 v128）；
  - v128 浏览器测试（中文 375、英文 430）：
    - 两张没写字的照片居中、大小均衡、没有空文字框；
    - 「重新排版」三种不同，第四次回到第一种；
    - 手动拖过的页面点「重新排版」先询问，取消后不变；
    - 旧版保存的页面不被改动。
  - 单元测试覆盖 7 组手机常见比例（4:3、3:4、16:9、9:16、1:1 的组合）：
    - 三种排法都不同；
    - 不出页面、不重叠、照片比例不变；
    - 默认排法均衡 ≥ 0.5、占满 ≥ 0.38、左右居中；
    - 结果是确定的（没有随机）。
- 发布：固定链接**第 92 版**。线上 scrapbook-layout / whats-new 先读回，sha256 和 f0c54e5 一致才覆盖。
- 剩余风险：
  - 换版本后，在「今天的故事」里再点「重新排版」，两张照片的结果会和以前不同；只影响新建和正在编辑的故事。
  - 并排排法在两张横图时上下留白较多，但它只会作为第二、三选项出现。
  - 未在 iPhone 真机或模拟器上看过（Mac 当时处于睡眠）。
- 下一步：Step 2 Quick Edit。

### 2026-11-13 — Quick Create UX Sprint：V10.27 标题完全可选 + 阅读器蓝框修复（固定链接第 91 版）；Quick Edit 和双照片排版方案（等确认）

- 需求（用户）：
  - 定位 *Your life, a little world growing with you.*；不需要懂设计，不需要起标题、写字或进「自定义」；
  - 问题 A：换照片不直观；问题 B：双照片一大一小、留白没有意图；问题 C：日历里三条一样的「未命名的一页」；Reader 有蓝色选中框；
  - 要求按 Step 1 标题 → Step 2 Quick Edit → Step 3 双照片排版 → Step 4 Reader → Step 5 回归推进；
  - 小范围的标题 bug 可以先做；Quick Edit 大改先给方案；第一阶段交付 7 项。
- **P0 前提**：模拟器里照片按真实路径保存后杀掉 App 仍然正常；Claude App 里的手动验证（`P0_MEDIA_TEST.md`）还在等。本轮没有改媒体保存代码。
- **Step 1 标题选填（已实施）**：
  - 新增 `Public/js/page-label.mjs`（展示名规则见 `docs/QUICK_EDIT_PLAN.md` 第 3 节）；替换了约 20 处 `moment.untitled` / `entry.untitled` 后备文案；
  - 编辑器顶栏没有标题时显示日期（下一行仍是「第 N 页 · 共 M 页」）；
  - 日历这一天的页面列表：缩略图 + `时间 · 2 张照片`，点一行用新的 `read-page` 打开阅读器的那一页（草稿页滚动到页面上）；
  - 标题入口文案改为「（选填）」；去掉 Captain「有 N 页还没有名字」的提醒；Captain 回忆里的「没有标题的一页」改为「那一页」；
  - 展示名不写进 title；旧数据不迁移。
- **Step 4 阅读器蓝框（已修复）**：
  - 在 Mac WebKit（Playwright）里复现：阅读器的照片 `tabindex="0"`，键盘焦点落上去时 WebKit 画默认蓝色焦点框（`outline: auto`）。Chromium 里点击不会出现；
  - 修复：阅读器页的照片改成 `tabindex="-1"`，并去掉焦点框；其它只读页面的焦点框用 `--accent`；
  - 阅读器里没有选中描边、控制点或选中框，v126 有检查。
- **Step 2 / 3（方案，没改代码）**：`docs/QUICK_EDIT_PLAN.md`，预览页 https://claude.ai/artifact/Bj5uD5vtZAmtq9pwgv5f3B 。
  - 问题 B 的根因：`scrapbook-layout.mjs` 杂志风格两张照片时，即使没写字也给「那句话」留一栏；
  - 原型 `pairLayout`：三种排法打分，在 scratchpad 的 dist/link 副本里跑，**没有提交**；
  - 用 6 组手机常见比例做了「现在 vs 建议」对比，并预览了 Quick Edit 的 6 个关键状态（375 中文 / 430 英文）；
  - 待确认 4 件事：先做 Step 3 还是 Step 2、替换照片时文字是否保留、「换个排版」放什么、「自定义」放右上角。
- 修改文件：
  - `Public/app.js`、`Public/js/page-label.mjs`（新）、`day-view.mjs`、`collab-view.mjs`、`community-view.mjs`、`keeper.mjs`、`whats-new.mjs`（10.27）、`styles.css`；
  - i18n；Native WebApp 同步；
  - `tests/page-label.test.mjs`（新，8 项）、`tests/v126-browser.cjs`（新）、`tests/v55-browser.cjs`（「加标题」→「起个名字（选填）」）、`package.json`；
  - 文档：`docs/QUICK_EDIT_PLAN.md`（新）、PRODUCT_SPEC、ARCHITECTURE。
- 运行：
  - `npm test` 219 通过；`python3 -m unittest` 18 通过；
  - **全量浏览器回归 67 / 67 通过**（Chromium，含 v126）；
  - v126：中文 375 和英文 430 下，三页没标题的记录、日历列表、阅读器、补标题 / 删标题、编辑器顶栏、书架都没有「未命名 / Untitled」。
- 发布：固定链接**第 91 版**。线上 day-view / collab-view / community-view / keeper 先读回，sha256 和 3bc6ee9 一致才覆盖。
- 未验证：iPhone 真机、Xcode 模拟器里的 V10.27 界面。
- 下一步：等用户确认 Quick Edit 方案和 4 个问题；P0 手动测试结果。

### 2026-11-13 — 优先级调整：P0 原生模拟器真实路径验证 + V10.26 检查更准确（固定链接第 90 版）；核心流程 Audit；Meme Phase A 只做拆分

- 需求（用户）：
  - Meme v2 设计通过，D1–D8 不变，但先证明核心承诺「一分钟把照片变成漂亮的一页」；
  - P0 继续查，用实际 App 的保存 / 读取路径验证，Claude 内嵌链接和原生模拟器分开测；不要只凭 persisted 推断，不要未经验证断言原生不受影响，不清理用户数据；
  - GIF 相册 → File 这一步继续标为未验证；Meme Phase A 只做低风险准备和拆分；Captain 原色 6 个静态反应与开发分开；
  - 做核心流程 Audit 和最小修复清单，不重写首页和编辑器。
- **P0（原生 iOS 模拟器，真实保存路径）**：
  - 新增只在 Debug 构建生效的 `-LittleDaysTap "upload:<input>|<文件>|<mime>"` 和 `wait:<ms>`（`LittleDaysWebShellView.swift`，提交 c539dfc）。它把 Mac 上的测试文件交给页面自己的文件输入框，之后走 App 真实的导入 / 保存代码，只跳过系统选择器；Release 不读这个参数。
  - 构建方式：在 Mac 上 `git fetch` 后用 `git archive` 导出到 `/tmp/ld-build/src` 构建（Debug，模拟器「LD P0 Verify」iOS 27.2），**没有动 Mac 工作区和其它会话没提交的修改**（project.pbxproj、Package.resolved、Qwen 结果文件仍原样）。
  - 结果：
    - 测试照片（图库 latte-art）→ 杀掉 App 重开 → 正常（用到 1 · 存着 1 · 正常 1）；
    - 测试视频（第一次是分片 mp4，第二次是模拟器录屏 H.264 0.1 MB / 5.8 秒）→ 导入在 import 阶段失败：第一次只记了 `error`，加诊断后是 `media-timeout`。同一个文件在 Mac 桌面 WebKit 里 0.1 秒就能读到。推断：iOS WebKit 只在用户点击后加载媒体，脚本交文件没有点击，所以不代表真实选择器也会失败（未证实）；
    - 用 App 的「备份」在 Mac WebKit 里做一个含测试照片和测试视频的备份 → 在模拟器里「恢复备份」→ 杀掉 App 重开 → 用到 3 · 不在 0 · 读不出 0，照片显示，视频显示封面和「0:05 · 0.1 MB · 已保存到本机」；
    - 旧检查把这个可读的视频报成「解码失败 · timeout」。
  - 修改（V10.26）：
    - `media-check.mjs` 新增状态 `unchecked`：视频 / 声音在时限内没加载时，写成「视频没有打开检查（iOS 要先点一下才读取视频，不代表坏了）」，不标红；
    - `app.js` 的 `mediaMetadata` 失败时记录 `media-timeout` 或 `media-err-<MediaError 编号>`；
    - i18n、whats-new 10.26、`v122.test.mjs` 同步更新。
  - 模拟器里重装后确认新文案显示正常（截图 11-check-v1026）。
  - 读日志的办法：从模拟器的 WebKit LocalStorage sqlite 读 `little-days.events`（只有事件名、阶段、错误名）。模拟器剪贴板读不到，因为脚本点击不算用户手势。
  - 新文档 `docs/P0_MEDIA_TEST.md`：Claude App 内嵌链接的 5 分钟手动步骤（用 `P0-TEST-时间` 文字区分「整页没了」和「只是媒体读不出」）、模拟器手动步骤、已证实 / 未确定 / 可能的修复。
  - **根因仍未确定**：你最早看到的 Error 当时的数据已经不在；原生真机没测；真实选择器导入视频没测。
- **发布**：
  - V10.26 → 固定链接第 90 版（app.js、js/media-check.mjs、js/whats-new.mjs、shared/i18n.json）；
  - 线上旧的 media-check.mjs 先读回，sha256 1b64459f… 和 HEAD~1 一致才覆盖。
- **核心流程 Audit**（`docs/CORE_FLOW_AUDIT.md`，页面 https://claude.ai/artifact/XQudn5EW31Nc7jb6kWFgEw ）：
  - Chromium 模拟 390 / 375，1 / 3 / 5 张都实测：App 内 5 次点击（选照片、写一句、点输入框、完成、保存），不写字 2 次；
  - 自动排版 0.13–0.26 秒（电脑，非真机）；保存后进阅读器约 1.5 秒；刷新后从首页卡片 1 次点击重开，照片和文字都在；
  - 问题：「写一句」被底部按钮条挡住、输入框不自动聚焦、那句话变成照片下的灰色小字、写一句面板选项太多、书和日期是原生下拉框、没有拍摄时间时显示导入时刻；
  - 最小修复 F1–F7 等用户确认，**没有改代码**。
  - 另外在原生模拟器里看到：同一天已有内容时，首页「只写字」会再加一页（不在核心照片流程上，记下待查）。
- 文档：
  - ROADMAP 顶部写入新优先级；
  - MEME_STICKER_PLAN 状态改为「v2 通过、Phase A 暂不实施」，新增第 10 节 Phase A 拆分（A0 纯函数可以先做，A4 媒体写入等 P0）和第 11 节 Captain 素材说明（Claude 不能生成正式 3D 图）。
- 运行：
  - `npm test` 211 通过；`python3 -m unittest` 18 通过；
  - 浏览器 v121、v122、v123 通过（Chromium）；
  - 模拟器构建成功（只有警告）。
- 未完成：
  - 用户按 P0_MEDIA_TEST.md 在 Claude App 里测；
  - 原生真机测；
  - 真实选择器导入视频；
  - F1–F7 等确认；
  - Captain 素材等出图。
- Mac 上留下的测试文件：`/tmp/ld-gif`、`/tmp/ld-build`、`/tmp/ld-p0`；模拟器「LD P0 Verify」里有测试数据。

### 2026-11-13 — Meme & Sticker Studio 最终设计 v2（D1–D8 已确认）；GIF 选择器验证；P0 截图记录（仍未改 App 代码）

- 需求：用户确认 D1–D8 并补充要求，要求先写进设计方案（设计板、图层结构、收藏机制、Captain 动画素材规格、静态 MVP 流程、Phase B GIF 方案、持久化与测试计划），确认后再开发；单独验证「从相册选 GIF 会不会被转成 JPG」；Captain 本轮只做原色 6 个；P0 没确认前不正式实施新的 Meme 媒体存储。
- 文件：`docs/MEME_STICKER_PLAN.md` 改写为 v2（含版本记录）；设计板 https://claude.ai/artifact/4EEpdtVnJ55zG3mrYdgkdK 第 2 版（9 个画面 × 375/430 × 中/英 = 36 张；v1 折叠对照；Captain 6 张占位封面；两个 iPhone 自测工具）。`Public/`、Swift、测试都没改，固定链接仍是第 89 版。
- v2 的关键决定：
  - ★ 统一成一个 `collection` 数组（官方素材只存 ID；我的 Meme 存 `media:` 引用和元数据，不存文件名）；「最近使用」每次从页面图层算出来，不自动加收藏；
  - `kind:"meme"` 同时承载我的 Meme、以后的 GIF 和 Captain，必填 `text` 作为兼容兜底；
  - 原创贴纸保持 `kind:"sticker"`；
  - Phase A 文件选择器只接受 PNG / JPG / WebP，看文件头发现 GIF、动态 WebP、APNG 时说明「下一版支持」，不保存也不转换；
  - 解码内存估算超过 300 MB 也拒绝；
  - 统一的动态贴纸接口：精灵图驱动 + 图片驱动 + 同时最多 2 个。
- 代码核对：
  - `model.mjs` 校验要求每个图层有字符串 `id` 和 `text`，不校验 `kind`；
  - `canvas.mjs` 遇到不认识的 kind 会把 `text` 当文字显示（不丢数据）；
  - 没有透明度字段；`layerGeometry` 只给 photo / video 加宽高，Meme 需要加进去。
- **GIF 验证（真实运行）**：
  - iOS 模拟器（LD P0 Verify）用 `simctl addmedia` 加入测试 GIF（仓库里的 LD-captain-lemon-hug.gif，396,833 B，sha256 bfbb9b38…）→ 图库里是 IMG_0011.GIF，sha256 完全相同，**系统图库不转换**；
  - 当前照片导入：Chromium（容器）里 `image/gif` 396,833 B → 存成 `image/jpeg` 32,381 B（FF D8）；WebKit（Mac Playwright，Safari 26.5 内核，Mac 上的 49479dd 代码，`imageBlob()` 没变）里 → `image/jpeg` 60,756 B。**是我们自己的 `imageBlob()` 把 GIF 转成了单帧 JPG。**
  - 相册 / 文件选择器 → WKWebView 这一步**没验证**：需要界面点选，用 AppleScript 控制模拟器时卡在 macOS 权限请求（2 分钟超时），已放弃这条路。改为在设计板里放「GIF 选择测试」，在 iPhone 的 Claude App 里测；模拟器相册里已经有 IMG_0011.GIF，可以在外壳里手动点选。
- **P0 截图（用户，8:54）**：
  - Claude iOS App 内嵌网页，persisted=否；0.0 MB / 983.0 MB；IndexedDB、localStorage 都正常；没有媒体错误；「还没有用到照片或视频」。
  - 还不能判断：如果截图前加过照片再强制退出，说明那一页连同照片引用一起没了，很可能是宿主（Claude App）重启时清掉了内嵌网页的存储；如果没加过，说明这次只是没东西可查。
  - 设计板里放了「存储保持测试」来分清这两种情况（写标记 → 划掉 Claude → 重开看标记）。
- Captain 素材：我不能画正式的 3D 形象。交付的是规格、动作说明、命名和 ID、JSON 元数据、验收清单、6 张写明 PLACEHOLDER 的灰色剪影封面（只在设计板里，没提交进仓库）。Phase A 能用的正式 Captain 图只有原色抱毛线球（320×325）。
- Mac：只在 /tmp/ld-gif 放了测试文件，用 8092 端口跑过一次预览服务（测完就停）；Mac 上其它会话没提交的修改没有动；模拟器相册里多了 IMG_0011.GIF。
- 运行：设计板截图脚本；自测工具在 Chromium 里试过（GIF 帧数 6，和 PIL 一致；JPG 识别正确；存储标记读写正常；没有控制台错误；手机宽度没有横向滚动）。没有 App 测试，因为没改 App 代码。
- 下一步：
  1. 用户在 iPhone 的 Claude App 里做两个自测；
  2. 用户确认 v2 后开始 Phase A：先做界面、图层、收藏，媒体写入等存储保持测试有结论再接上；
  3. Captain 原色 6 个正式图按第 5 节出图。

### 2026-11-13 — Meme & Sticker Studio 设计轮（只出设计，未改 App 代码，等用户确认）

- 需求：在 Journal Studio 的贴纸系统里加入「Captain 的小反应」、我自己的 Meme 收藏、GIF；交付 7 项设计（架构、流程 A–E、设计板、Captain 反应素材规格、媒体保存方案、Phase A–E 路线、风险与取舍），设计确认前不实现。
- 文件：新增 `docs/MEME_STICKER_PLAN.md`；设计板 Artifact https://claude.ai/artifact/4EEpdtVnJ55zG3mrYdgkdK （版本 1，28 张：7 个画面 × 375/430 × 中/英）。没有改 `Public/`、Swift、测试，所以固定链接没有重新发布（仍是第 89 版）。
- 关键结论 / 决定（待确认 D1–D8）：
  - 贴纸面板改名「贴纸与 Meme」，四个标签 贴纸 / Captain / Meme & GIF / 我的收藏；底部四个按钮不变。
  - **现在的照片导入 `imageBlob()` 会缩到 1200px 并转 JPEG**（透明、动画都会丢；照片编辑 / 裁剪旋转也是 JPEG）。所以 Meme 走单独的导入路径保留原始字节，新图层 `kind:"meme"`（建议，D3）。
  - 导入后预览，按钮写明去向：「放到这一页」（下面「同时存进我的收藏」默认不勾）/「只存进收藏，先不放到页面」/ 取消。
  - GIF 默认静止（代表帧 PNG + 角标）；编辑器播一遍停；阅读器点播、同时 2 个、离屏停、减少动态不自动播；导出用代表帧；不把 GIF 存成 PNG。
  - `visitMediaReferences` 现在不包含收藏，实现时要加上，备份 / 媒体检查才覆盖收藏。没有自动清理媒体的逻辑，删除收藏不会伤页面。
  - Captain 6 个反应：稳定 ID `captain.react.<key>`，原色先做、柠檬帽（不带绿领巾）随后；建议用带 alpha 的精灵图 + CSS 逐帧（D7）。**正式素材 0 个**，设计板里全部是标明 NAT-01…06「素材制作中」的占位块；包头和空状态用的是现有正式的原色 Captain 抠图。
- 设计板做法：Playwright 打开真实 App（容器里的 Chromium，375×667 / 430×932，deviceScaleFactor 2），加一张图库照片、一行字、一张贴纸，再把提议的面板注入进去截图。示例 Meme 是为这次用 PIL 画的合成图（圆脸小人、星星 GIF），不是真实用户数据、不是网上的 Meme。脚本和图在 scratchpad，没有提交。
- 运行：只跑了设计板截图脚本和页面的手机 / 桌面宽度检查（无横向滚动）。没有新的 App 测试，因为没有改 App 代码。
- 风险（详见文档第 7 节）：P0 根因未定（Meme 共用同一个 IndexedDB）；iOS 相册可能把 GIF 转成 JPG（待模拟器 / 真机验证，必要时用 PHPicker 原始数据桥）；动图内存；`ImageDecoder` 在 WKWebView 是否可用不确定；备份 100 MB 上限。
- 下一步：等用户确认 D1–D8；Phase A 以 P0 受控复现为前置；Phase C 等 Captain 反应素材。

### 2026-11-13 — V10.25 发布到固定链接（第 89 版）；全量回归

- 需求：收尾 V10.25，跑全量浏览器回归，再发布。
- 第一次全量（Chromium 模拟手机）：63 通过 / 3 失败。
  - v41、v43：它们打开「更多 → 本页照片」，这个图块在 V10.25 已按计划去掉。迁移：v41 的照片素材库改从「＋照片 → 照片素材」进入（同一个 13 个合集 → 滑动选图），v43 的面板把手改用「背景与纸张」面板测；
  - v100：「更多」打开时纸只剩 116px 高（要求 > 120）。原因是 `--sheet-max-more` 的「屏高 − 320px」在 390×664 / 375×667 上太高。改为 **屏高 − 340px**：375×667 上更多面板 292px、纸 136px；430×932 不变（面板 440px、纸 253px）。代价：短屏上「媒体与创作」最后一行需要在面板里稍微滚动。
- 修改文件：`Public/styles.css`（及同步的 `Native/Sources/LittleDaysUI/WebApp/styles.css`）、`tests/v41-browser.cjs`、`tests/v43-browser.cjs`、`tests/v100-browser.cjs`（断言信息里带上实际高度）。
- 运行：重跑 v41、v43、v100、v124、v125 全部通过；`npm test` 211 通过；`python3 -m unittest discover -s tests` 18 通过（含外壳一致性）。容器没有 pytest。
- 发布：`tools/build_link.py` 后发布 app.js、styles.css、js/studio-guide.mjs、js/whats-new.mjs、shared/i18n.json 到固定链接，**第 89 版**。线上旧的 studio-guide.mjs 先读回来核对，sha256 与 6d29c10（V10.24）一致，才覆盖。
- 未验证：iPhone 实机 / Xcode 模拟器都没看 V10.25；键盘上方的打字条仍只在 Chromium 里模拟过。
- 下一步：Meme & Sticker Studio 设计轮（只出设计，等用户确认）；P0 仍等用户在 Claude iOS App 里按步骤复现；P3 等素材。

### 2026-11-12 — Mac 上实测第 5 节：Captain × 本机 Qwen 在浏览器里可用；`dev.sh web` 发现 8080 被别的程序占用时会停下

- 需求：用户确认「Yes, test web-ai」，按 docs/MAC_LOCAL_DEV.md 第 5 节在 Mac 上实际打开 App 里的本地 AI 聊天（Mac 本地时间 11-11 晚）。
- 先重跑 `doctor.sh`：都齐了，没有安装任何东西。brew / node / npm 显示 ❌ 只是因为 Claude 的命令行 PATH 里没有 `/opt/homebrew/bin`；补上后全部 ✅。
- 发现：8080 被 Xcode 里运行过的根目录服务端 `NotebookServer`（Debug-iphonesimulator，模拟器和 Mac 共用网络）占着，返回 500。原来的 `dev.sh web` 只看端口有没有人在听，会直接打开这个错误页面。没有停掉那个进程（是用户在 Xcode 里开的），改用 `python3 tools/preview.py --host 127.0.0.1 --port 8081`。
- 实测（Claude 桌面 App 里的浏览器，新的浏览器数据，只用合成输入；qwen3.5:4b，提示词 v3）：
  - 打开 `?dev-local-ai=qwen3.5:4b` 后 `little-days.dev.local-ai` 写入 `{on, endpoint: 127.0.0.1:11434, model}`；领养 Captain（温柔）后在聊天里发送。
  - 「你的柠檬帽真好看」→「谢谢！帽子是我的小太阳呀。」；「今天有点累，但是写完了一页」→「累了就休息会儿吧，我在这儿陪着你呢。」两条都标着「本机模型 · 开发」，几秒内出现。
  - 截获发给 Ollama 的请求：只有系统提示词 v3、用户的话和 Captain 的回复（开场白不在内），`think: false`、`keep_alive: "10m"`、temperature 0.7 / top_p 0.9 / top_k 40 / repeat_penalty 1.1 / num_predict 96；没有手帐内容。Ollama 对 `http://127.0.0.1:8081` 的 CORS 预检返回 204 并允许该来源。
  - 「What can you do?」→ 规则回复真实功能列表，0 次模型调用；「帮我整理今天的故事」→ 直接打开「今天的故事」面板，0 次模型调用。
  - 把模型地址改到没开的 `127.0.0.1:11999`：请求失败（Failed to fetch），立刻改用规则回复，页面没有异常（控制台只有浏览器自己的 ERR_CONNECTION_REFUSED）。
  - `?dev-local-ai=off`：开关被删除，之后聊天不发出任何请求，规则回复正常。
- 修改：`tools/mac/dev.sh` 的 `web()`：8080 有人在听但不是 `tools/preview.py` 时，打印占用的进程和停止方法，退出码 1，不再打开错误页面。验证：`bash -n` 通过；在 8080 被 `NotebookServer` 占用时运行 `dev.sh web-ai`（用假的 `open` 命令）打印提示并退出 1；确认 8081 上的 preview.py 进程能被识别为正常的预览。
- 文档：MAC_LOCAL_DEV.md 顶部状态、第 1 节「日常命令」、第 5 节（实测结果、8080 被占用的处理）、第 6 节表格。
- 没有修改 `Public/`，所以没有同步 iOS 外壳、没有重新发布固定链接。
- 测试时 Mac 上的代码是 34be8ed（V10.17）；提交前 rebase 到 GitHub 上新的 14 个提交（V10.18 起 Captain 规则能听懂更多日常的话，可能让一部分闲聊改走规则），rebase 后在新代码上重跑了一遍：「你的柠檬帽真好看」「今天有点累，但是写完了一页」「我想摸摸你的头」仍然走本机模型（「哇！你发现了我的帽子！」「嗯……累了就歇会儿。」「好呀，给你挠下巴！」），「What can you do?」仍走规则、不调用模型。摸头那句又把角色说反了（提示词要求 Captain 是被摸的一方），评测时留意。
- 未验证：`dev.sh web-ai` 在 8080 空闲时的完整流程（这次 8080 被占，用 8081 手动做的同样测试）；Safari / Chrome 等用户自己的浏览器；英文界面下的聊天。
- 下一步：需要时试 9B（`LD_MODEL=qwen3.5:9b`）；模拟器里接本地 AI 需要只在 DEBUG 生效的外壳开关（第 6 节）。

### 2026-11-13 — V10.25（P2）Journal Studio 信息架构整理：Phase 1–4；P3 Playroom 等素材

- 需求：按用户确认的 IA 第二版（`docs/STUDIO_IA_PLAN.md`）分阶段实现；P3 按 Playroom 计划继续。
- **Phase 1（选中对象）**：
  - 工具栏上方加 `.ctx-caption`，写「照片 · 已选中」；
  - 第一个按钮改为「← 返回」（`layer-deselect` 不变，`aria-label`「返回创作工具」），× 只用来关面板；打字时说明行隐藏；
  - 贴纸新增「换一个」（`sticker-swap`）：打开贴纸面板，选中的贴纸换成新的，位置、大小、角度不变，不会多出一个。
- **Phase 2（细选项条）**：
  - 形状 / 图层 / 字体·颜色·对齐（`STRIP_TOOLS`）改为 `.tool-sheet.strip`，舞台保持 `large strip-open`；
  - `syncStripHeight()` 把选项条的实际高度写进 `--strip-h`，纸张按这个高度缩小，不再按最高的面板算；
  - 形状变成一行横向滑动的小按钮；
  - 图层：上移 / 下移 / 置顶 / 置底 / 复制在前，其余（包括文字内容、字体）收进 `details.layer-precise`「精确调整」；`layer-edit-text` 会自动展开它。
  - 375×667 上，选项条打开时纸宽 172–190px（以前打开任何面板都只剩 136px）；390×844 上 316–353px。
- **Phase 3（更多、页面目录）**：
  - 「更多」分三组：页面外观（背景与纸张、排版、页面字体）· 媒体与创作（手绘排第一，深色底；视频、音频、配乐、本页媒体）· 页面管理（页面信息、心情、页面目录、操作指南，以及有打卡或记录项目时才出现的两项）；
  - 「换一种写法」放到最下面；`--sheet-max-more` 调成 min(52dvh, 440px, 屏高 − 320px)，375×667 上前两组不用滚动就能看到；
  - 去掉「本页照片」和「目录」两个图块。「页面目录」就是原来的「整理这一天」，改了标题，每页加「复制」（`page-copy`）、当前页高亮、删除按钮带 🗑；原来的「目录」（只保存这一页、折叠）从「更多页面操作」（`pages-more`）进入，功能都还在。
- **Phase 4（教程）**：`studio-guide.mjs` 改为四步：add（圈出工具栏）→ move → adjust → more（圈出「更多」）；文案按新结构重写。已经看过旧教程的人不会再自动弹出。
- 测试：
  - 新增 v125（两种屏幕尺寸，7 组）；
  - 迁移了 v3、v38、v100、v101、v31、v32、v112（`signed-in.cjs` 的 `studioTool("layer")` 会自动展开「精确调整」，`studioTool("chapters")` 走「页面目录 → 更多页面操作」）；
  - v112 改为四步，每一步检查圈的是不是真实元素、卡片有没有挡住它；
  - `npm test` 211。全量结果见下一条。
- **P3 Playroom**：
  - 计划里剩下的都要新素材：无帽版的开心动画、坐姿、玩毛线球；不带领巾的柠檬帽玩毛线球；摸摸头、挠肚皮；Idle 眨眼和呼吸；1024px 以上的原图。
  - 查了 Mac 的「下载」文件夹：`Lemon Kitten’s Yarn Ball Adventure-1.gif` 的 sha256 和仓库里已有的 `LD-captain-lemon-play.gif` 一样，就是用户已经决定不用的绿领巾版。
  - **没有新素材，所以 P3 没有改代码**；不用 CSS 假装动画。等用户提供素材。

### 2026-11-13 — V10.24（P1）心情放到每一页、背景和纸张互相替换、打字条贴在键盘上方、几处小修正（固定链接第 88 版）

- 需求：用户说「开始 P1 P2 P3」，按优先级先做 P1。心情的处理方式按用户 11-12 确认的执行。
- 改动（不新增数据字段）：
  - **心情**：
    - `moodPickerHTML` 放在「页面信息」最上面，「更多 → 心情」（`mood-open`）打开同一个地方；
    - 五个心情显示为有名字的印章（开心 / 温暖 / 平静 / 低落 / 雀跃），另有「清除」（`moment-mood-clear`）；存的值仍是原来的 emoji；
    - 封面（整天）不再有心情选择；新建的一天不再自动填 ☀️（`app.js` 新建草稿处和 `day.mjs`）；
    - 旧的日子原样保留，封面上已有的 `.canvas-mood` 照常显示，不改写。
  - **背景和纸张**：
    - 选风景照片、渐变或图案时，把纸张设为「极简」；
    - 选纸张时，删掉风景照片、渐变或图案（`scene:` / `photo:`）；用户自己的照片背景不删（它是这一页的照片）；
    - 有背景时，纸张不显示为已选；撤销可以换回来。
  - **打字条**：在触屏上、键盘弹起时（App 已经设置了 `--vv-h`），`#type-bar` 用和 V3.8 面板同样的办法，固定在键盘正上方。
  - **小修正**：
    - 形状面板不再显示 ‹；
    - `tool.stickers` 改为「贴纸」，`dock.layout` 改为「排版」；
    - 在 Studio 里加照片或替换照片成功后，不再弹提示；失败仍然提示。
  - **推迟到 P2 Phase 2**：文字图层面板里重复的字体选择（v3 还在用它，和图层面板重做一起改）。
- 测试：
  - 新增 `tests/v124-browser.cjs`，6 组通过；
  - 迁移了旧测试：`signed-in.cjs` 的 `studioTool("mood")` 改走新入口；browser.cjs、v32 改为检查封面没有心情入口，以及旧日子的 🌷 照常显示；
  - browser.cjs、v31、v32、v3、v37 通过；`npm test` 211；Python 18。
- 发布：第 88 版。`day.mjs` 先读取了已发布的版本，确认和提交里的一样之后才覆盖。
- 未做：
  - 「打字条贴在键盘上方」只在 Chromium 里用 App 自己的键盘变量模拟过，还没有在真机或模拟器里看过键盘；
  - P2、P3 接着做。

### 2026-11-12 — 用户在 iPhone 的 Claude App 里运行「检查照片和视频」的结果（第 87 版，17:59）

- 运行环境（实测）：
  - 浏览器：App 内网页视图 · WebKit · iOS（iPhone 上的 Claude App）；
  - 运行地址：`https://e724c27c-7907-42c7-bb82-36a5b8bbe361.frame.claudeusercontent.com`（这个 Artifact 自己的来源）；
  - 嵌在其他页面里：是，上层是 `https://claude.ai`；
  - **长期保存：否**；
  - 已用 / 可用空间：0.0 MB / 983.0 MB；IndexedDB 和 localStorage 都正常。
- 照片和视频：当前这台设备上的手帐**没有任何页面引用照片或视频**（引用数为 0）。媒体记录里只有这次检查本身，因为 V10.22 之前没有这类记录。
- 背景里「上次备份：11 月 10 日」还在，说明这份 localStorage 至少从 11 月 10 日起一直保留着。
- 结论：
  - 环境已经确认；
  - 当时出 Error 的页面已经不在这份数据里了（可能被删掉、换掉，或者当时测试的是别的页面或草稿），**没法从现有数据判断当时的原因**；
  - 「长期保存：否」说明 iOS 可以清理这份存储，这仍是风险。
- 下一步：请用户在同一个环境里用第 87 版做一次受控复现（加 1 张照片 → 离开再进 → 完全退出 Claude App 后重开 → 检查）。V10.22 / V10.23 的记录会写下每一步发生了什么。

### 2026-11-12 — P0 出问题的环境已确认：Claude 固定链接

- 用户确认：之前出现 Error，是在 **Claude 固定链接**里上传照片测试时发生的，不是 localhost，也不是 Xcode 模拟器。
- 这意味着：
  - 页面运行在 claude.ai 的 Artifact 预览里。它是嵌在 Claude 页面里的独立来源，有自己的一份 localStorage 和 IndexedDB，和 localhost、模拟器、iOS 外壳的数据互不相通。
  - 在 iPhone 的 Claude App 里，它跑在 App 内网页视图（WKWebView）里，属于第三方嵌入，存储会被分区，系统也可能清理。
  - 本会话的自动测试（Chromium 和 Mac WebKit 直接打开）都没有覆盖这种「嵌在 claude.ai 里」的环境。私有链接需要登录，这里打不开。
- 下一步：请用户在**同一台设备、同一个 Claude 链接**里打开 设置 → 检查照片和视频，复制结果。V10.22 以后的检查会显示：是否嵌入、上层来源（ancestorOrigins / referrer）、持久存储状态，以及旧文件分别属于「文件不在」「读不出来（错误名）」「打不开」中的哪一类。根因按结果来定。

### 2026-11-12 — V10.22 + V10.23 发布到固定链接（第 87 版）；全量回归

- 全量浏览器测试（Chromium，测试视频用 VIDEO_DIR 提供）：
  - 64 个测试中 63 个通过；
  - v39 没通过，因为它还在检查旧的视频工具顺序（形状 · 封面）。这是预期内的改动，已把 v39 改成新顺序（播放 · 换封面 · 形状 · 图层 · 移除），单独重跑通过；
  - 所以全部 64 个通过。
- 发布：固定链接第 86 版是另一个会话发布的 V10.22。我逐个核对了文件的 sha256：app.js、media.mjs、whats-new.mjs、styles.css、themes.css、i18n.json、personal-ui.mjs、poster-picker.mjs 都和提交 139b306 完全一样。V10.23 是在它之上做的修改，发布时先读取了这些文件，再发布为**第 87 版**。没有覆盖掉任何别人的内容。

### 2026-11-12 — V10.23（P0 / P1 / P2）视频导入每一步都看得见、保存失败可重试、换封面就在视频下面

- 需求（用户实测）：
  - 加视频后画布有时一片空白；切换页面时才弹出「媒体正在保存或录音」；
  - 「设置视频封面」藏在一长串小字里；「从纸上拿下」的意思不清楚；
  - 希望：分阶段显示保存状态（导入 / 写入本机 / 已保存 / 保存失败 + 重试），能拿到真实进度就显示进度条；在页面被暂停之前就提示；换封面要醒目，有时间轴和预览；视频工具要有清楚的层级；
  - 按要求的场景做回归，记录文件大小、保存结果、媒体 ID 和错误类型（不记录内容）。
- 和 P0「重新进入显示 Error」有没有关系（读代码得出的判断）：
  - 空白画布和「切换时才提示」是**反馈问题**。以前视频要先完整写入本机、再生成封面，之后才放到纸上；大文件在手机上要好几秒，这期间页面上什么都没有。
  - 保存期间，所有编辑操作（包括切换页面、离开 Studio）都会被拦下并弹出提示，所以不会因为切换页面而丢掉视频。页面数据只在文件写入成功之后才引用它，所以中途关掉页面也只会丢掉还没保存的视频，不会留下指向空文件的引用（这种引用才会显示 Error）。
  - 和 Error 唯一可能的联系仍是 V10.21 之前把相册选择器给的 File 原样存进去（在 iOS 上可能由会被系统删除的临时文件支撑）。根因仍待用户 iPhone 上的「检查照片和视频」结果确认。
- 修改：
  - `app.js`：
    - `handleMediaUpload` 改成导入流程（`mediaImport` / `runImport`）：读取信息并截一帧当缩略图（不保存）→ FileReader 读取文件（**真实进度**）→ 保存到本机（`attachClip` 的 `onStage` 报告 write / cover，这一段没有百分比，用不确定进度条）→ 已保存，2.6 秒后卡片自动消失；
    - 失败时卡片显示「保存失败 + 原因 + 重试 / 不要这个视频」，文件留在内存里可以重试，页面数据不变；
    - 超过 50 MB 时在保存前就拒绝（`too-big`）；
    - 导入期间顶部状态是「保存中」；页面条变淡（`.page-strip.locked`，`aria-disabled`，只在视频或声音导入时出现），卡片写明「保存完成前暂时不能切换页面」，提示文字改为 `import.busy`；
    - 事件 `media_import{kind,stage,size,ms}`、`media_import_failed{kind,stage,err,size}`；
    - 选中视频后的工具：播放（`ctx-play`）· 换封面 · 形状 · 图层 · 移除；
    - `remove-media-ask`：先用页面内确认框确认，再从页面移除，可以撤销，文件仍留在本机。
  - `js/canvas.mjs`：视频卡片的「换封面」和「从页面移除」两个按钮放在视频正下方，下面是小字（文件名 · 时长 · 大小 · 已保存到本机）和安静的文字按钮「不放在纸上」（原来的「从纸上拿下」，视频仍保留在本页媒体里）。
  - `js/personal-ui.mjs`：本页已有媒体时，先显示媒体卡片，添加按钮放到下面。
  - `js/poster-picker.mjs`：标题改为「更换封面」，显示「现在的封面」缩略图；主按钮改为「完成」；仍然复用原来的时间轴和实时画面、上传图片。
  - `js/media.mjs`：`errName` 不再用 DOMException 的数字 code（以前 QuotaExceededError 会记成「22」）。
  - `styles.css` 的 V10.23 区块：
    - 导入卡片、进度条（减少动态效果时不播放动画）；
    - 媒体卡片的按钮至少 44px 高，底部小字从 8px 改为 12px；
    - 面板里的视频预览高度最多 min(14dvh, 150px)，去掉原来 120px 的最小高度；
    - 隐藏面板里重复的「声音与影像」标题。
  - i18n：新增 `import.*`、`poster.change / done / current`、`media.removeFromPage / removeShort / removeConfirm / removed / savedLocal`；修改 `poster.title`、`poster.help`、`media.offPage`（「不放在纸上」）。
  - 测试：`tests/v123-browser.cjs`（测试视频从 `VIDEO_DIR` 读取，不进仓库）。
- 事故：
  - 第一版的「页面条变淡」在加照片时也会出现，而加照片的流程结束后不会重画页面条，结果一直是暂停状态（v121 发现：Playwright 认为它不可用）。已改为只在视频或声音导入时出现。
  - 第一次 375 宽的截图显示，「换封面」和「从页面移除」被挤到了菜单下面。原因有两个：面板上方先显示添加按钮；旧样式给视频设了 120px 的最小高度。测试原来用的是「滚动到可见后再检查」，所以没发现。已修正，测试现在用屏幕上的命中检测（`elementFromPoint`），不再先滚动。
- 测试结果（测试视频都是合成的：ffmpeg 测试图案，或者 WebKit 自己录的画面，内容不是私人视频）：

  | 场景 | Chromium（容器） | WebKit（Mac） |
  | --- | --- | --- |
  | 约 7 秒的视频 | 705,325 字节，存进去 705,325 字节，id 9928b4bd…，经历「读取信息 → 导入 → 保存 → 封面 → 完成」，约 210 ms | 607,292 字节，存进去 607,292 字节，id 7f78ee97…，约 226 ms |
  | 接近上限的视频 | 48,330,391 字节（46.1 MB）全部存进去，约 2.1 秒，有真实进度 | 51,938,850 字节（49.5 MB）全部存进去，约 0.34 秒 |
  | 导入时切换页面 | 页面条变淡，卡片有说明；点别的页时提示「视频正在保存到本机…」，页面不变 | 同左 |
  | 导入完成后切换页面 | 可以 | 可以 |
  | 超过上限（53,477,376 字节） | 保存前就拒绝，错误类型 `too-big`，页面不变 | 同左 |
  | 写入被拒绝一次（模拟 QuotaExceededError） | 显示「保存失败」和 `quotaexceedederr`，页面不变；点「重试」后保存成功；事件记为 `media_save_failed(write)` | 同左 |
  | 换封面（选第 5 秒的画面） | 新封面 20,299 字节；保存草稿再回来、刷新、完成后的阅读器里都是新封面 | 新封面 12,566 字节，结果同左 |
  | 关闭浏览器后重开（430 宽） | 新封面还在，视频能播放 | 同左 |
  | 从页面移除 → 撤销 | 会先确认；撤销后恢复 | 同左 |
  | 375 / 430 下按钮是否直接可见 | 是（命中检测） | 是 |

  - v122 在两种引擎上各 23 个检查点全部通过；v121 11/11；`npm test` 211/211。
  - iOS 模拟器：b3fa2df 构建成功，装在「LD P0 Verify」上能启动（首页 1.4 秒），没有 JS 报错；模拟器里没有做导入视频的点选测试（要在 iOS 相册选择器里选）。
- 已知 / 未做：
  - iPhone 上的「检查照片和视频」结果还没拿到，P0 根因仍未确认。
  - 写入本机这一段没有真实百分比（IndexedDB 不报告进度），所以只在导入阶段显示百分比。
  - 封面编辑沿用原来的界面，只加了「现在的封面」和「完成」，没有重做。
  - IA 的其他部分（「← 返回」、「更多」分组等）按优先级放在 P3。

### 2026-11-12 — V10.22（P0）只读的「检查照片和视频」+ 多引擎回归；Mac 合并状态核对；心情决定记录

- 需求：
  - 用户确认了心情的处理方式；
  - 说明媒体 Error 出现在 iPhone 上的 Web Preview（可能是 Claude App 里打开的预览），并要求根据实际地址、日志和环境确认浏览器类型，不要猜；
  - 按一张照片 / 多张 / 视频 / 草稿后重进 / 完成后重进 / 刷新 / 关闭重开 / 开发服务器重启分别测试，分清五类失败（保存失败、文件丢失、URL 失效、引用错误、解码失败），记录真实错误日志；
  - 原则上同意 Mac 合并，但先做 7 项检查；
  - 优先级：P0 → P1 基础编辑 → P2 IA → P3 Playroom。
- Mac 合并核对（已完成，没有需要我合并的东西）：
  - Mac 和远端都在 49479dd。reflog 显示用户 Mac 上在 14:32 把 e529a0e rebase 到了 9b70507 上，并推送了。
  - 逐行比较 e529a0e 和 49479dd 的增删：49479dd 包含 e529a0e 的全部内容，另外多了一行 rebase 说明。没有丢失。
  - Mac 上未提交的东西：`project.pbxproj`（Xcode 把工程文件格式从 objectVersion 56 升级到了 60）、`Package.resolved`、4 个 Qwen 评测结果文件。都不是本会话的工作，没有动。
  - ListAgents 没有看到其他会话。
  - 容器快进合并到 49479dd。
- V10.22 的改动：
  - `js/media-check.mjs`（新增，只读）：
    - `mediaUses` 记录每个引用的位置（日期、第几页、是否草稿），并找出格式不对的引用；
    - `inspectMedia` 把每个文件分成 ok / missing / unreadable / empty / decode / badref，旧的 Blob 记录只读不转换，图片用 `createImageBitmap` 实际解码，视频和音频读元数据；
    - `environment()` 实测内核、浏览器、平台、运行地址、是否被嵌入（`ancestorOrigins` / `referrer`）、持久存储、空间、IndexedDB 和 localStorage 是否可用；
    - `reportText` 生成可复制的文字报告，不含标题和正文。
  - `js/media.mjs`：
    - `put` 分阶段（open / read / write / verify），失败时记录 `media_save_failed`；
    - `readable` 记录 `media_missing`、`media_read_failed`（带错误名）、`media_converted`、`media_convert_failed`，每个 id 只记一次；
    - 新增 `errName`、`kindOf`；`onEvent` 钩子。
  - `js/events.mjs`：允许记录 `count`、`stage`、`err` 三个字段（错误名只保留小写字母、数字和连字符，最多 16 个字符）。
  - `app.js`：
    - 加载出错时分三种记录：`media_url_failed`（数据在，换新地址后恢复）、`media_decode_failed`（数据在但打不开）、`media_unreadable`；
    - 设置 → 数据与隐私新增一行「检查照片和视频」，打开一个只读面板，有复制按钮（剪贴板被拒绝时显示文字让用户自己选）。
  - i18n 新增 `check.*` 共 45 个键；`styles.css` 新增 V10.22 区块；更新记录 10.22。
  - 测试：`tests/v122.test.mjs`（5 项）、`tests/v122-browser.cjs`（自己启动预览服务，跑在 Chromium 或 WebKit 上）。
- 事故：第一版把 `media.onEvent = …` 写在了 `let media` 声明之前，App 启动时报「Cannot access 'media' before initialization」，一直停在「正在打开你的文具店…」。单元测试没发现，v122 浏览器测试发现了，已把这行移到声明之后。
- 测试结果（每一步都运行 App 自己的检查，要求每个文件都是 ok、每张图真的加载出来、视频没有错误、没有记录到任何媒体失败）：
  - **Chromium（Linux 容器）**：v122 共 23 个检查点全部通过。依次是：从选择器加 1 张、第二页加 3 张、第三页加视频；然后草稿后重进、完成进阅读器、完成后重进、刷新、关闭页面重开、关闭浏览器重开、重启开发服务器，每一步都检查 1 张照片页、3 张照片页和视频页；最后从设置打开检查面板。
  - **WebKit（Mac 上的 Playwright WebKit，代码是 7bac0b9 导出到 `/tmp/ld-p0/v122`）**：同样 23 个检查点全部通过。
  - `npm test` 211/211；`python3 -m unittest` 18/18；受影响的旧浏览器测试 v110、v103、v3、v36 通过；全量浏览器测试见下一条记录。
  - **iOS 模拟器**（Mac，Xcode 27.2，iOS 27.2，新建的设备「LD P0 Verify」）：
    - 7bac0b9 构建成功（Debug），Swift Core `swift test` 6/6；
    - 安装后用 Debug 的 `LittleDaysTap` 打开「设置 → 检查照片和视频」，截图显示：浏览器 in-app web view · WebKit · iOS，运行地址 `littledays://app`，**长期保存：否**，IndexedDB 和 localStorage 正常；
    - 这台设备上没有加过照片，所以没有文件可查。
  - **iOS 模拟器里的 Safari**：试过用 safaridriver 自动化（`safari:useSimulator`），会话建立失败（找不到可用的会话主机）。可能需要用户在模拟器的 Safari 里打开「远程自动化」，并在 Mac 上执行 `safaridriver --enable`（需要管理员密码），所以没有继续。在模拟器里写入了 `RemoteAutomationEnabled` 等设置，只影响「LD P0 Verify」这一台。
- 结论（如实写）：
  - Chromium 和 macOS WebKit 上，8 种情况都**没有复现**；
  - 根因仍未确认；
  - 用户的环境（iPhone 上的 Web Preview，可能在 Claude App 里）还没有测过；
  - 下一步要用户在出问题的 iPhone 上打开 V10.22 的「检查照片和视频」并复制结果，这是第一次能拿到用户设备上的真实日志。
- 风险：
  - iOS WKWebView 里持久存储没有被批准（模拟器显示「否」），系统可能清理存储；
  - 从 iOS 相册选的文件（由系统临时文件支撑）这条路径还没有测，自动测试用的是 Playwright 的文件选择器。
- 心情决定（已确认，本轮没有改代码，按优先级放在 P1 / P2 里做）：
  - 以后只在每一页上记录心情，默认不选；
  - 旧的整天心情不迁移，不把以前自动填的 ☀️ 当成「开心」；
  - 新建的一天不再自动填 ☀️；
  - 页面心情可以修改、清除；旧数据照常读取。

### 2026-11-12 — IA 方案第二版（六项决定）+ P0 在 Mac WebKit 和 iOS 模拟器上的验证（App 代码未改）

- 需求：用户确认了六项决定（← 返回 + 选中提示、保留视频形状、375 的「更多」用两档高度、不加页面主题和新数据、手绘放第一位、心情改名为 开心 / 温暖 / 平静 / 低落 / 雀跃），要求第二版的真实设计预览。同时要求先确认 P0 媒体问题的状态，没修好就先修 P0。
- P0 验证：
  - 连接了用户 Mac 上的 Notebook 文件夹。用户的 Mac 在 e529a0e，这是另一个会话没推送的本地提交；另外有一份未提交的 `project.pbxproj` 改动。远端领先 13 个提交，不能快进合并，所以没有合并、没有改用户的工作目录。
  - 把旧代码 b1aa514 和新代码 b7986b3 导出到 Mac 的 `/tmp/ld-p0`，装了 Playwright WebKit，在 WebKit 里各跑一遍：加 3 张照片和 1 段 mp4 → 离开再进来 → 刷新 → 关闭再开 → 阅读器。**新旧两版都正常**，IndexedDB 里的文件都可读。根因推测（Blob 失效）在桌面 WebKit 上没有复现。
  - iOS 模拟器：
    - 在 `/tmp/ld-p0/new` 用 `xcodebuild -workspace LittleDays.xcworkspace -scheme LittleDays` 构建，BUILD SUCCEEDED；
    - 新建了模拟器设备「LD P0 Verify」（iPhone 17，iOS 27.2，没有碰用户原来的设备），用 `simctl addmedia` 放入 3 张照片和 1 段 10 秒 mp4；
    - 安装并启动，首页 1.8 秒出现，没有 JS 报错。
    - 加照片的测试没做：要在 iOS 相册选择器里点选；这一版 Xcode 没有 Simulator.app，`LittleDaysTap` 只能点网页元素。
  - 结论：防护性修复（V10.21）已经上线，但根因仍未确认。需要用户告诉我是在哪里看到 Error 的。
- 设计第二版（同一个预览页，第 2 版）：
  - 39 张新截图（Chromium，375 / 430 × 中英）：默认、选中照片 / 文字 / 视频、照片形状、视频形状、字体、「更多」半高和展开、背景与纸张、页面目录、页面信息（新心情名）、键盘的现在和建议。
  - 页面里加了：返回 / 关闭 / 删除 / 取消的行为表，以及 P0 状态表。
- 新发现：
  - 心情兼容性：每一页的心情默认是空，可以放心显示新名字。整天的心情以前会自动填 ☀️（`app.js` 新建草稿、`day.mjs` 保存、Swift 的 init 默认值），旧的 ☀️ 不一定是用户选的。建议心情只做在每一页上，整天的旧值不改写，新建的一天不再自动填。等用户决定。
  - 键盘：App 用「窗口高度 − 可见区域高度」判断键盘；Chromium 缩窗口时两者一起变，所以测不出键盘。改用 App 自己的 `--vv-h` / `--kb` 变量加上画出的键盘区域来模拟。按现在的 CSS，打字条在纸下方，375 屏上会落进键盘区域；iPhone 会滚动让光标可见，可能部分缓解，要在模拟器确认。建议把打字条固定在键盘正上方。
- 文档：`docs/STUDIO_IA_PLAN.md` 第 11 节。
- 运行 / 测试：没有改 App 代码，这一轮没有跑仓库测试。新跑的验证是：Mac WebKit 的 P0 对比（新旧两版各 5 步，全部正常），以及模拟器的构建和启动。
- 留在 Mac 上的东西：
  - `/tmp/ld-p0`：测试代码、构建产物、脚本；
  - 模拟器「LD P0 Verify」：保留着，用户可以在 Xcode 里选它按 ⌘R 手动测；
  - Playwright 的 WebKit 和 ffmpeg 缓存：`~/Library/Caches/ms-playwright`。
- 待用户回答：
  1. 心情的旧数据怎么处理；
  2. 在哪里看到媒体 Error；
  3. 是否「确认合并」（需要先推送 e529a0e，再做一次真正的 merge）。

### 2026-11-12 — Journal Studio 信息架构审查与方案（只出设计，等用户确认；App 代码未改）

- 需求：用户的「Journal Studio Information Architecture Cleanup — Creative Freedom Without Complexity」。先审查全部工具和入口，提出三层结构、六个任务的前后流程、iPhone 预览（375 / 430，中英文）、实施计划和回归清单；确认后才改界面。
- 开始前检查：工作区干净；远端分支最新提交是 bf8c83f；ListAgents 显示这台机器上没有其他会话；Mac 未连接。
- 做法：
  - 用脚本在真实 App 里走了 33 个状态（Chromium，iPhone 13 尺寸 390×844），逐个记录底部工具、面板标题、‹ / ×、面板内容高度和纸张尺寸。
  - 根据记录写出完整工具清单（已实现 / 部分实现 / 未实现），并找出重复入口。
  - 再在真实 App 上替换底部区域，生成原型截图：375×667 和 430×932，中文和英文，共 26 张；另有 10 张现状截图。
- 产出：
  - 预览页 https://claude.ai/artifact/5yrXLwKVD9cFvkjf6TPxKr （私有）。
  - `docs/STUDIO_IA_PLAN.md`（文字版）。
  - 脚本 `ia/tour.cjs`、`ia/proto.cjs` 在会话 scratchpad 里，没有提交。
- 主要发现：
  - 页面管理有 4 个入口、2 套界面。
  - 打开任何面板，纸缩到原来的 40%（340×425 → 136×170）。
  - 「背景与纸张」的内容有 942px，纸张在第三屏。
  - 「更多」平铺 12 个图标。
  - 形状面板的 ‹ 会跳到「更多」。
  - 取消选择用的是 ×。
  - 文字的「图层」面板重复了文字内容和字体。
  - 有两个「字体」；「版式」和「排版」两个名字混用。
  - 贴纸面板的标题写成了「贴纸与文字框」。
- 方案要点：
  - 第 1 层固定四个工具。
  - 第 2 层最左边是「‹ 返回」；形状、字体、颜色、对齐、图层改为细选项条；视频加「播放」，贴纸加「换一个」。
  - 第 3 层「更多」分三组：页面外观、媒体与创作、页面管理。
  - 页面目录合并成一个；去掉「本页照片」；背景四选一、互相替换；心情进页面信息。
  - 教程改为四步。
  - 实施分 5 个阶段，每个阶段可以单独回退。
- 运行 / 测试：没有改功能代码，这一轮没有跑测试。之前 bf8c83f 的结果：Node 206、Python 18、浏览器 62 套通过。
- 待用户确认：`docs/STUDIO_IA_PLAN.md` 第 10 节的 6 个问题。确认后按 Phase 1 → 5 推进；补充需求（返回图标、背景互斥、心情）并入 Phase 1 和 Phase 3。
- 环境记录：
  - 本地预览服务（8080）跑满后台时限后停止，已重启并重新报告端口。
  - 清理旧截图的 `rm` 被安全检查拦下，没有执行。旧截图在 scratchpad 里，会被新截图覆盖，不影响结果。

### 2026-11-12 — V10.20 / V10.21 回归完成并发布（在线链接第 85 版）

- 旧浏览器测试迁移到 V10.20 的新路径（只改测试，不改 App）：
  - v31、v101：改用全屏裁剪编辑器（缩放滑块 → 完成），检查 `crop.zoom` 在 ±0.01 内、`crop.rect` 存在，以及只裁剪、不移动照片；
  - v32：通过「试试排版」提示打开排版；v33：从「更多」重新打开排版；
  - v38：形状改从「形状」面板进入；v39、v101：底部工具栏改为新的顺序；
  - v108：等装扮图片加载完再检查（原来约一半概率失败，是测试的时机问题，与 V10.20 无关）；
  - v36：读取媒体记录的 `bytes`（旧记录读 `blob`）。
- 运行结果（Chromium 模拟 iPhone 13）：
  - `npm test` 206/206；`python3 -m unittest` 18/18；
  - 全部 62 个浏览器测试通过：一次全量运行 60 个通过，v36 修好后单独运行通过，v121（11 组）单独运行通过。全量运行在最后一个测试时到了 10 分钟后台时限，所以 v121 是单独补跑的。
- 发布：在线链接第 85 版（V10.21 · 媒体持久化 + 裁剪），更新记录包含 10.20 和 10.21 两条。
- 仍未完成：
  - iOS 模拟器 / 真机验证（Mac 未连接）；Swift `LayerCrop.rect` 尚未在 Xcode 编译；
  - 补充需求（返回 / 关闭图标语义统一、背景与纸张互相替换、Mood 作为页面信息）还没开始。

### 2026-11-12 — V10.21 P0 媒体持久化：离开 Studio 再进来照片 / 视频显示 Error

- 需求（用户标为 URGENT，排在 UX 清理之前）：先复现并用真实日志定位根因；用稳定的 Media ID 修好持久化与恢复；兼容旧数据；Web 与 iOS 模拟器都要验证；补自动化回归；「已保存」必须可信。安全约束：不清空数据库、不删除现有媒体、不重置本机存储、不生成假的替代内容、不把私人媒体上传到云端。
- 复现（Chromium + 持久化浏览器资料，`scratchpad/crop/media-repro.cjs`）：
  - 加 3 张照片 + 1 段视频后，离开 Studio 再回来、刷新、关掉浏览器再打开、点「完成」进阅读器，全部能显示；存储里引用 5 个、实际存在 5 个、缺失 0 个，控制台没有错误。
  - 结论：**在 Chromium 里复现不出来。** 这个容器里只有 Chromium，没有 WebKit / iPhone Safari / iOS 模拟器，所以没法拿到用户设备上的真实错误日志。下面的根因是**代码审查得出的推断，没有在 WebKit 上证实**。
- 代码审查：
  - 页面数据里只存 `media:<uuid>` 引用，文件本身存在 IndexedDB（`little-days-media` / `media`），每次显示时用 `URL.createObjectURL` 生成临时地址。没有把 `blob:` 临时地址写进页面数据，这部分设计是对的。
  - 风险点：V10.20 及以前把 **Blob / File 对象**直接放进 IndexedDB（视频就是相册选择器给的 File 原样存）。iOS Safari / WKWebView 对存进 IndexedDB 的 Blob 有已知问题：Blob 背后的文件可能失效，之后读出来的 Blob 无法读取（常见报错 `WebKitBlobResource error 1`），表现正是「刚加时正常，离开再进来就 Error」。
  - 另外：保存状态只看页面数据有没有写进去，不检查媒体文件，所以文件没存好时也会显示「已保存」。
- 修复（`Public/js/media.mjs`、`Public/app.js`）：
  - 新文件存为 **ArrayBuffer 字节**（`bytes` + `mime`），不再存 Blob / File；写入后立即读回来核对字节数，不一致就报错（`media-verify`），不会假装存好了。
  - 旧的 Blob 记录：第一次打开时读出来，**原地**改写成字节（同一个 id，保留其他字段）；改写失败也不影响这次显示。读不出来的记录只标记为损坏，**不删除**。
  - `missing(ids)` 报告缺失或损坏的文件；`flushDraft` 之后 `confirmMediaSaved()` 检查这一页用到的所有媒体，全部存在才显示「已保存」，否则显示「保存失败」并提示「有 N 个照片或视频没能存进这台设备，请重新添加它们。文字已保存。」（事件 `media_not_saved`）。
  - 图片 / 视频 / 音频加载出错时，按临时地址找回 Media ID，重新从 IndexedDB 读一次（每个 id 一次，事件 `media_reloaded`）；还是不行就加 `.media-broken` 并记录 `media_unreadable`。
  - 真读不到的照片在页面上显示「📷 照片读取不到」，不生成替代图片；页面其他内容不受影响。
  - 启动时尽力调用 `navigator.storage.persist()`，降低浏览器自动清理存储的概率（不保证一定被同意）。
  - 备份：先按记录里的大小检查 100MB 上限，再读字节导出成 data URL；超过上限时备份**失败并提示**（`error.backupSize`），不会悄悄漏掉视频。恢复时用新的 `put`，所以恢复的文件也是字节存储。
- 附带修复：多张照片时「试试排版」提示把下面的页面条（撤销 · 页面 · ＋）挡住了；纸张现在会给提示让出位置（`styles.css` V10.21）。
- 测试：
  - `tests/media.test.mjs` 新增 4 项（旧记录原地转换、缺失只报告不删除、写入核对、重新读取只做一次），第 1 项改为检查字节；`tests/v31.test.mjs` 同步。`npm test` 206/206 通过。
  - 新增 `tests/v121-browser.cjs`（Chromium 持久化资料，11 组全部通过）：1 张 / 5 张 / 2 张 + 视频（含封面）/ 裁剪过的照片；离开 Studio 再进来；刷新；关闭浏览器再打开；完成后阅读器 5 页；旧 Blob 记录原地转换；真缺失的文件显示「照片读取不到」并显示「保存失败」；备份含照片和视频本身；恢复到空的浏览器资料后全部能显示；杂志模式 →「自定义」后刷新仍能显示。
  - `tests/signed-in.cjs` 导出 `seed`，供持久化浏览器资料使用。
- 旧数据能否恢复：如果 iPhone 上旧的 Blob 背后的文件已经失效，这些字节在本机已经不存在，**没有办法从 App 内找回**；App 会如实显示「照片读取不到」，不删除记录，用户可以从相册重新添加，或从之前导出的备份恢复。还能读出来的旧记录会被自动转成新存法。
- 未验证 / 风险：
  - 没有在 iPhone Safari、WKWebView 或 iOS 模拟器上验证（本轮 Mac 未连接，容器内没有 WebKit）。等 Mac 连上后，按 fetch → 展示 diff → 用户确认 → ff 合并的流程在模拟器里跑：加照片和视频 → 离开再进来 → 杀掉 App 重开。
  - 字节存储需要把整个文件读进内存，非常大的视频在旧设备上可能较慢；单个文件上限仍是 50MB（恢复时）。
  - 浏览器 / 系统在存储空间不足时仍可能清理网站数据；`persist()` 只是请求。

### 2026-11-12 — V10.20（进行中）Journal Studio 照片工具：形状 / 裁剪画面 / 排版分开，全屏非破坏性裁剪

- 需求（用户的整合需求 Part 1–11）：
  - Part 1–2（每张照片写一句、在杂志模式里直接改字体）已在 V10.19 完成，本轮只做回归；
  - 本轮做 Part 3–7：加照片后不强推排版；照片工具改为 形状、裁剪画面、调整、替换、图层、删除；面板标题和滚动位置；全屏可视化自由裁剪（角、边、比例、移动取景、双指缩放、旋转、取消 / 完成 / Undo / Redo，不改动原图）；统一手势。
- 审查结论：
  - 「裁剪」打开的是标题为「选中的图层」的通用面板：形状在顶部，缩放和 X/Y 滑块在底部，还会被自动滚到底，所以看不到形状。
  - 旧的裁剪只有 `crop {x, y, zoom}`。「调整」里的图片编辑器另有一套比例裁剪（重新生成图片，原图留在 `sourceRef`），形成两套裁剪概念。
  - 加照片后代码会强制 `studioTool = "layout"`。
- 修改：
  - 新增 `js/crop.mjs`、`js/crop-editor.mjs`；
  - `canvas.mjs` / `export.mjs` 统一使用 `cropView`；
  - `app.js`：照片工具行、形状面板、图层面板瘦身、`openCropFor`（旋转复用原有流程）、`layoutHint`、面板滚动位置、「调整」去掉裁剪页；
  - `photo-editor-ui.mjs` 支持 `tabs` 参数；
  - `styles.css` 的 V10.20 区块；`sync_tokens` 的 PAPER 列表加入 `.crop-editor`；
  - i18n：`crop.*`、`shape.hint`、`layout.hint*`，`tool.layer` 改为「图层」；
  - Swift：`LayerCrop.rect` / `aspect`、`CropRect`，CoreTests 补充对应检查；
  - 测试：v120 单元测试（5 项）、v120 浏览器测试（9 组）；
  - 文档：PRODUCT_SPEC、DESIGN_SYSTEM、ARCHITECTURE。
- 事故记录：一次 Python 修改脚本的最后一行 `open(P,'w').write(open(P).read())` 把未提交的 `app.js` 清空了。已用 `git checkout HEAD -- Public/app.js` 恢复（这时还没有提交任何本轮改动），再重新应用本轮修改，没有丢失已提交的内容。
- 已验证（Chromium 模拟 iPhone 13 触控，不是真机，也不是 iOS 模拟器）：v120 浏览器测试 9 组全部通过，包括取消不改变任何东西、完成后照片文件不变 / 位置角度不变 / 层级不变、Undo / Redo、换成圆形和拱门后仍是同一块画面、旋转后原图保留、保存刷新后仍保持、阅读器显示同一块画面、两张照片时只裁剪其中一张、375 / 430。
- 待办：旧的浏览器测试回归（全量运行中）、更新记录、发布、在 Mac 上编译 Swift 和模拟器验证（Mac 本轮未连接）。

### 2026-11-12 — V10.19 杂志模式：每张照片写一句，直接换字体

- 需求：
  - 「给这几个 Moment 写一句」只显示时间，多张照片时分不清是哪张；
  - 要以照片为中心：显示真实缩略图和编号，每张照片可以单独写，也保留 Moment 的公共文字；
  - 用照片的稳定 ID 关联，排版时说明靠近对应的照片；
  - 在杂志模式里直接改字体、字号、加粗、颜色、对齐，并实时预览，进入「自定义」后保留；
  - 切换布局、重新打开都不丢；适配 375 / 430。
- 审查结论：
  - 照片是带稳定 `id` 和 `mediaRef` 的图层，重新排版只改位置；
  - Moment 的一句话就是 `title`，排版生成的文字图层用 `bind` 绑定；
  - Studio 的文字样式字段是 `fontId / fontSize / color / weight / align`，字体列表 `TYPE_FONTS`，颜色列表 `TYPE_COLORS`；
  - 调整分组会重建 Moment，照片图层的 id 会变。
- 修改：
  - `scrapbook-layout.mjs`：照片说明排版、`settleCaptions`、`applyType`、`boundText` 支持 caption；
  - `app.js`：新面板、实时预览、调整分组时按 mediaRef 带回、点照片直接打开、Studio 里写回照片；
  - `styles.css` 的 V10.19 区块；`sync_tokens` 无需修改；
  - i18n `sw.*`；
  - Swift：`Models.swift`、`CoreTests`；
  - 测试：v119（单元，144 种情况）、v119-browser（新）；v52、v53、v60、v61 改用新的 `storyLines` 辅助函数（`signed-in.cjs`）；
  - `whats-new` 10.19；
  - 文档：PRODUCT_SPEC、DESIGN_SYSTEM、ARCHITECTURE。
- 决策：
  - 照片说明存在照片图层上，而不是 Moment 上的「顺序数组」，这样排版、重新排版、换风格都不会对错照片；
  - 调整分组时按 mediaRef（照片本身的媒体 id）带回，不用时间或顺序；
  - 文字样式存在页面的 `typeStyle`，并直接写进 Studio 的字段，而不是另起一套数据结构；
  - 打字时收起字体区，给键盘留位置；
  - 没有在杂志模式里做自由画布。
- 结果（Chromium）：
  - 3 张拍摄时间都是 14:18 的照片仍然是一个 Moment，缩略图标着「照片 1 / 3」等；
  - 切换照片后文字还在；第 3 张可以不写；
  - 宋体、A+、加粗、颜色、左对齐在面板打开时就显示在页面上；
  - 杂志 / 手账 / 拼贴、重新排版、调整分组后，说明仍在各自照片旁边；
  - 进入「自定义」后字体保留，在纸上编辑说明会写回那张照片；
  - 保存并刷新后，说明仍按 mediaRef 对应；
  - 375 / 430 宽度下页面可见，输入框和「完成」都放得下。
- 未验证 / 未实现：
  - Swift 改动没有编译（用户 Mac 本轮未连接）；
  - 没有在真机上测试键盘；
  - 早期的 SwiftUI 原型界面不显示照片说明；
  - 封面上的小标题原本就会截短加「…」（只影响显示）；
  - 视频图层暂时不能写说明；
  - 照片说明不支持部分加粗等格式（B / I / U / S 只用于 Moment 的一句话）。

### 2026-11-12 — V10.18 网页版 Captain 不再「笨笨的」：规则对话扩充

- 需求：用户在手机网页上试用，觉得 Captain 说话笨笨的。
- 原因：在线链接里没有 AI（本地 Qwen 只在 Mac 开发时用；正式 App 不加 AI 是用户的决定），全靠 `keeper-chat.mjs` 的规则。用 48 句日常的话测试，42 句被判为 unknown，只能回答「这句我没太懂」。
- 修改：
  - `keeper-chat.mjs` 新增 28 种意图和 `topic` 回显（详见 ARCHITECTURE V10.18）；
  - i18n 新增 70 多条中英文回复；
  - `keeper.mjs` 的 `LINE_COUNTS` 和 `thing` 值；
  - `app.js` 加入 `keeperTopic` 和 `cjkGap`；
  - `whats-new` 10.18；
  - 测试：v118（新）、v109、v103、v109 / v103 / v71 浏览器测试。
- 决策：
  - 不加 AI，只扩充规则：遵守「正式 App 不加 AI 调用」的约定。
  - 回显只用用户这句话里的几个字，不读取任何页面。
  - 问句不当作分享。
  - 难过和糟糕的事优先于分享（「去医院」不会接「哇」）。
- 结果：48 句全部有对应的回复（unknown 0/48）。在 Chromium 里实际对话检查：问名字 →「叫我 Captain 就好…」，吃了火锅 →「火锅呀，跟我多说一点？」，老板骂我 →「抱抱你。今天辛苦了。」，去医院检查 →「抱抱你。今天辛苦了。」。
- 测试：`npm test` 194/194；全量浏览器测试（59 个 `test:browser:*`）59/59 通过（Linux 容器，Chromium）。
- 已知问题：规则仍然听不懂复杂句子、反问和上下文（不会记得上一句说了什么），只是常见的话接得更自然了。真正「聪明」需要模型，要等以后用户决定是否允许。
- 环境：用户 Mac 本轮断开，没有在 Mac 上验证；预览服务到 2 小时上限被停止后已重新启动。

### 2026-11-12 — Captain 提示词 v3 正式评测（用户 Mac）；真机安装步骤

- 需求：用户问怎样装到真机，并同意做正式评测。
- 正式评测：在用户 Mac 上运行 `node tools/captain-eval.mjs --runs 3`（代码在 34be8ed，qwen3.5:4b，Ollama 0.40.16，Apple M5 24GB）。
  - 结果文件 `docs/captain-ai/results/2026-11-12-qwen3.5_4b-prompt-v3.{md,json}` 在 Mac 工作区，未提交。把它们原样复制到本会话的操作被 Mac 的自动模式拒绝了，所以没有再试。
  - 本仓库新增 `docs/captain-ai/results/2026-11-12-prompt-v3-formal.md`：逐字摘录 36 条回复，加上计数和 7 项评分。
  - 结论：总分 144/168（试跑 148），走模型的 10 句 122/140（试跑 124），正式结果与试跑一致。没有「喵」和表情，不声称看过手帐；3 条换语言的回复全部被 `sameLanguage` 拦截。剩下的问题：不肯定「写完了」、仍说「别难过」、偶尔主动提柠檬帽。评分由本会话完成，需要用户复核。
- 真机：`xcrun devicectl list devices` 只有 3 台模拟器，没有连接过真机。查询签名证书的命令被 Mac 拒绝（不允许云端会话读凭据），所以没有查。`docs/MAC_LOCAL_DEV.md` 改写成 8 步安装说明，并加上真机重点检查清单。工程的 `DEVELOPMENT_TEAM` 保持为空，由用户在 Xcode 里选自己的团队。
- 已知问题：真机上的 Captain 只用规则回复（访问不到 Mac 上的 Ollama），这是预期行为。
- 下一步：用户连上 iPhone 后，确认设备 → 构建安装 → 按清单检查；可以试 `qwen3.5:9b` 或写 v4 提示词。

### 2026-11-12 — Mac 同步收尾：34be8ed 已带入，Swift Core 测试 6/6 全部通过

- 用户第三次回复「确认合并」后，在 Mac 上运行 `git merge --ff-only 34be8ed864692214d365b6b3b58a51a31f1052f0`。合并后 `cmp` 确认 `Package.resolved` 和两份评测结果逐字节没变。检查点（分支 `checkpoint/pre-sync-2026-11-12` 和 `~/Documents/Developer/Notebook-checkpoints/2026-11-12/`）保留，由用户决定什么时候删除。
- 在用户 Mac 上实际运行（Xcode 27.2）：
  - `swift test`（Packages/LittleDaysCore）：**6/6 通过**；
  - `npm test`：191/191；
  - iPhone App Debug 构建（iPhone 18 Pro 模拟器）：**BUILD SUCCEEDED**。
- 本条日志提交之后，用户 Mac 会落后一个只改文档（agent.md、README）的提交，下次同步时一起带过去。
- 仍未验证：真机，轻震的手感。

### 2026-11-12 — Mac 上带入 2cb0fc1，Core 测试第一次能编译；修正共享导航里的社区标记

- 用户第二次回复「确认合并」后，在 Mac 上运行 `git merge --ff-only 2cb0fc1fbba2246fbeab01e6c34394eb49e581a4`。合并后 `cmp` 确认 `Package.resolved` 和两份评测结果逐字节没变。
- 在 Mac 上运行 `swift test`（Packages/LittleDaysCore，Xcode 27.2）：这是 11-09 以来 Core 测试第一次编译通过。共 6 个测试，4 个通过，2 个断言失败，都在 `testSharedResourcesAndDates`。
  - 原因：共享的 `features.json` 从 2026-11-07 起多了 `community` 标签，但没有任何标记说明它只属于 Labs；网页靠 `app.js` 里的 `LAB_PAGES` 过滤，测试却还在比对旧的 5 个标签。
- 修复：
  - `features.json` 的 community 加上 `"labs": true`；
  - Swift `FeatureTab` 新增可选字段 `labs`；
  - `CoreTests`：全部标签包括 community，正式版导航（排除 `inNav == false` 和 `labs == true`）是 首页 / 日历 / 写手帐 / 书架；
  - 网页导航的过滤也读取 `tab.labs`（`LAB_PAGES` 保留，用于页面跳转拦截）；
  - `tests/v116.test.mjs` 新增同样的检查。
- 测试（Linux 容器）：`npm test` 191/191；Python 测试通过；浏览器 v52、v116 通过。Swift 测试要在 Mac 上带入本次提交后重跑。

### 2026-11-12 — Mac 同步完成（用户确认合并）；iPhone App 构建并在模拟器里玩了 Playroom；修复多年未编译的 Core 测试

- 用户回复「确认合并」后，先确认 Mac 状态与审查时一致（HEAD 5115c61，只有 `Package.resolved` 和两份评测结果），再执行 `git merge --ff-only 9ea3ccaefb93a10746d2ced7c413ea8ee7bbcde4`。合并后用 `cmp` 对比检查点副本，三个文件逐字节没有变化。没有冲突，也没有覆盖任何文件。
- 在用户 Mac 上实际运行（Xcode 27.2）：
  - `npm test`：190/190 通过；`python3 -m unittest discover -s tests`：通过。
  - `xcodebuild -workspace LittleDays.xcworkspace -scheme LittleDays -configuration Debug -destination "platform=iOS Simulator,name=iPhone 18 Pro"`：**BUILD SUCCEEDED**，新的 `LittleDaysHaptics`、`KeeperPlay` 编译通过。
  - 装进 iPhone 18 Pro 模拟器，用 Debug 专用的 `-LittleDaysTap` 依次打开 Captain →「玩耍」→ 点毛线球，连续截图（`build/sim-shots/10-playroom.png`、`build/sim-shots/burst/`）：
    - 舞台、气泡、呼吸圈、底部提示都和网页一样；
    - 点球后 Captain 抱住毛线球、开心动画在播（气泡「我的毛线球！」）；
    - 播完回到原样，球回到原位，气泡变成「再来一次？」，呼吸圈消失。
    - 这是模拟器，不是真机；轻震在模拟器里感觉不到，没有验证。
  - `swift test`（Packages/LittleDaysCore）：**编译失败**。原因是 2026-11-09 V6.5 加的一行测试：原始字符串 `#"…"#` 里出现 `"chip":"#B4547A"`，其中的 `"#` 会提前结束字符串。从那以后 Core 测试一直没能编译，之前的日志里也没有跑过 Swift Core 测试。本次改成 `##"…"##` 修复，这个修复需要再按流程带到 Mac 上验证。
- 未完成：用户确认后把修复提交带到 Mac，再跑 `swift test`。

### 2026-11-12 — V10.17 Captain's Playroom MVP（用户确认五项决定后实现）；Mac 同步的安全检查点

- 需求：用户确认 Playroom 五项决定：
  1. 不用带绿领巾的版本；
  2. 抱毛线球大笑作为开心反应，不冒充摸头或挠肚皮；
  3. 摸头、挠肚皮在素材到位前隐藏；
  4. 无帽是正式造型，与柠檬帽走同一套互动逻辑、各用各的素材，不突然换装扮；
  5. ChatGPT 里的动画要用户手动导入。
  MVP 要求：大舞台、点身体触发开心反应、粉色毛线球真实可互动（点或拖）、播完回到 Idle、两种造型都能用、不以自动循环 GIF 冒充互动。另外要把 iOS 17 修复和 V10.16 的提交安全同步到 Mac。
- 素材审查（只算仓库里实际有的文件）：
  - `docs/brand/captain-anim/` 只有三份：
    - 柠檬帽坐姿 webp：静态，412px；
    - 柠檬帽抱毛线球大笑 GIF：6 帧 × 180ms，循环，506px；
    - 柠檬帽加绿领巾玩毛线球 GIF：9 帧 × 150ms，按决定不用。
  - 无帽只有原有的静态抱毛线球 PNG（320px，透明）。
  - 用户 Mac 上的同一目录也只有这三份。
  - 对话里提到的 ChatGPT 无帽动画不在仓库里。需要的文件清单和导入要求写在 docs/ASSETS.md「2026-11-12」。
- 修改：
  - `tools/make_captain_anim.py`：重写，需要 numpy。
    - 从坐姿图里把粉色毛线球和线抠出来，原位置用调和填充补上；球后面那只后爪本来就是虚焦，补完后是一片柔和的模糊。
    - 底色按开心动画的纸色（#FEF5EA）统一。
    - 生成 `LD-keeper-cat-lemon-play-idle.jpg`（23KB）和 `LD-keeper-yarn-ball.png`（19KB）；开心动画雪碧图没有变。
    - 删除 `LD-keeper-cat-lemon-sit.jpg`、`LD-keeper-cat-lemon-play-anim.jpg`（带领巾的那张）。
  - `library.json` 新增 `keeperPlay`：柠檬帽有 idle、happy、ball，无帽只有 idle。
  - Swift：`Resources.swift` 新增 `KeeperPlay` / `KeeperPlayClip` / `KeeperPlayBall`，keepers 白名单加入这些文件；`CoreTests` 新增 Playroom 检查，并修正旧测试少算的无帽图。`LittleDaysWebShellView.swift` 新增 `LittleDaysHaptics`（轻触觉反馈）。
  - `tools/preview.py`、`tools/build_link.py`：同步白名单。
  - `tools/sync_tokens.py`：`.pr-stage` 加入 PAPER 列表，舞台在所有主题下保持纸色。
  - `Public/app.js`：Playroom 舞台和交互（详见 ARCHITECTURE V10.17）；「玩耍」标签固定展开到最高。
  - `Public/styles.css`：替换原来的 `.kp-play` / `.kp-soon`。
  - i18n：删除 `corner.play*` / `corner.soon`，新增 `play.*`。
  - `whats-new` 10.17。
  - 测试：`tests/v117-browser.cjs`（新）；`tests/v109-browser.cjs` 的「玩耍」部分改为检查舞台；`package.json` 新增 `test:browser:v117`。
  - 文档：CAPTAIN_PLAYROOM_PLAN §6、ASSETS、PRODUCT_SPEC、DESIGN_SYSTEM、ARCHITECTURE、Keeper LICENSE。
- 决策与原因：
  - 毛线球单独抠出来，才能真正跟手拖动，而不只是「按一下就播放」。
  - 接住后用的是开心反应那段动画：Captain 抱着球的姿势正好能接上。没有单独的「扑球」动画，就不假装有。
  - 无帽版没有动画，就让它自己的画跳一下，不借柠檬帽的帧；也没有第二个毛线球，因为它手里已经抱着一个。
  - 舞台下不放按钮，直接操作球和 Captain 本身。
- Mac 同步（Part C）：
  - 检查结果：分支 v33-write-first-community，HEAD 5115c61。未提交的是 `Package.resolved`（swift-async-algorithms 1.1.7→1.1.5，新增 swift-configuration，看起来是 Xcode 解析依赖时自动改的），未跟踪的是两份 prompt-v2 评测结果。
  - 用 `ps` 查到 Claude 桌面 App 在运行。逐个检查进程打开的文件被自动模式拒绝了，所以无法确认另一个会话此刻有没有在编辑；但 git 状态里只有上面那三项。
  - 要合并的提交（b979623、3a3f382 和本次提交）不碰这三个路径，fast-forward 不会覆盖它们。
  - 已经建好检查点：分支 `checkpoint/pre-sync-2026-11-12`（指向 5115c61），并把 `uncommitted.patch`、`Package.resolved` 和两份评测结果复制到 `~/Documents/Developer/Notebook-checkpoints/2026-11-12/`。没有 stash、reset，也没有 commit 别人的修改。
  - fetch 之后要先把提交 id 和两份 diff 给用户看，用户确认后才合并，然后跑测试和模拟器构建。
- 运行 / 测试（Linux 容器，Chromium）：见本条末尾「结果」。没有在 iPhone 真机或 iOS 模拟器里试过 Playroom；Swift 改动在这里不能编译，要在 Mac 上合并后构建验证。
- 已知问题：
  - 舞台图只有 400px，iPhone 3 倍屏上偏软。
  - 拖动毛线球时能看到它原来位置的模糊补丁。
  - Captain 的视线不会跟着球走。
  - 无帽版只有静态画。
- 结果：`npm test` 190 项通过；`python3 -m unittest discover -s tests` 通过（包括外壳同步检查）；浏览器 v117（新）、v109、v108、v103 通过。全量浏览器测试（package.json 里 59 个 `test:browser:*`）在提交 729d629 的代码上 59/59 通过。
- 未完成 / 下一步：等用户导入无帽动画和更高清的素材；摸头、挠肚皮等正式素材；Mac 合并、Core 测试和模拟器构建；Captain 本地模型 v3 正式评测。

### 2026-11-12 — V10.16.1 最后一次 UI 打磨：欢迎页品牌统一、五种字母印记细节统一、社区确认只在 Labs

- 需求：用户认可 V10.16 方向，要求（1）欢迎页去掉像素风 ✿ 和散落表情，用已确认的品牌标识、小芽和文具元素，未上线的 Apple / 邮箱登录只在 Labs 环境展示；（2）五种 Monogram 统一字母大小、阴影、边框、纸片尺寸、选中状态，选中要清楚但克制；（3）确认社区是 Labs 界面，正式版不出现；（4）375 / 430、中英文、键盘、实时更新、保存后持久、旧头像无损、多页直达继续验证；已实现的只修问题，不重复开发。
- 检查结论：
  - 社区：`LAB_PAGES = ["community","inbox"]`，没有 Labs 时 `start()` 自动以本机账号进入，底部只有 4 个标签；`tests/v52-browser.cjs` 已覆盖「新安装没有欢迎页、没有社区」，本轮通过。没有改社区代码。
  - 欢迎页也只在 Labs 里出现（同上）。
  - 实时更新、旧 Emoji 无损、多页直达、375×667 在 V10.16 已实现并有测试，本轮只补测试，没有重写。
- 修改：
  - `Public/app.js`：抽出 `BRAND_SPROUT`；欢迎页 `.login-art`（✿ + 📔🌷📷）换成 `.login-brand`（App 图标 icon-192 + Little Days 字标 + 小芽）；「其他登录方式」分隔线和两个 disabled 登录按钮放进 `.login-labs` 虚线框，标签「实验室 · 还没有开放」。
  - `Public/styles.css`：删 `.login-art*`、`.login-divider*`，加 `.login-brand`、`.login-icon`、`.login-labs`、`.login-labs-tag`；`.pmark` 改为 `--pm-cap` / `--pm-cjk` / `--pm-ring` 变量（牛皮纸字母 0.38→0.44、朱印 0.36→0.40、手写 0.6→0.56、朱印双圈变轻、手写中文上移不压线、所有线条同一粗细）；选中描边 2px → 1.5px，胶囊同样。
  - i18n `login.labsOnly`；`whats-new.mjs` 10.16.1；`tests/v116-browser.cjs` 新增检查；`tests/v52-browser.cjs` 允许三段版本号。
  - 文档：DESIGN_SYSTEM、PRODUCT_SPEC、PROFILE_EDITOR_PLAN §9、ARCHITECTURE。
- 决策：版本号用 10.16.1（属于 V10.16 的打磨，但要让设置齿轮出现小红点、更新记录里看得到）。字母大小是在 Chromium 里把五种印记并排截图对比后调的，不是逐字体测量。
- 运行 / 测试（Linux 容器，Chromium）：`npm test` 190 通过；`python3 -m unittest discover -s tests` 通过；浏览器 v116、v36、v52、v38、v104、v110 全部通过。没有在 iPhone 真机或 iOS 模拟器里看这次的改动。
- 已知问题：键盘状态是在 Chromium 里用触屏模拟 + 聚焦输入框验证的，不是真机软键盘；用户 Mac 上的副本还停在 5115c61，本轮提交需要按 fetch → 看 diff → 确认 → 合并的流程带过去。
- 未完成 / 下一步：Captain's Playroom 等用户回答 `docs/CAPTAIN_PLAYROOM_PLAN.md` §5 的五个问题；Captain 本地 Qwen v3 正式评测；原生触觉反馈桥接。

### 2026-11-11 — P0 在用户 Mac 上验证通过：iOS 17 修复后各项构建成功，V10.16 在模拟器里运行

- 你 Mac 上另一个会话先把它的修改（Debug 构建才有的 JS 日志和启动计时）提交并推送了（5115c61），是接在 81279ab、e523643、454207f 之后提交的，所以用户 Mac 上的副本已经是最新的，不需要再合并。只剩 `Package.resolved` 和 v2 评测结果还没提交，没有动。
- 实际运行（Xcode 27.2，iOS 27.2 模拟器）：
  - 在根目录用 `xcodebuild -workspace .swiftpm/xcode/package.xcworkspace -scheme Notebook -destination "generic/platform=iOS Simulator"` 构建：**BUILD SUCCEEDED**。之前「LittleDaysCore-product requires minimum platform version 17.0 … supports 15.0」的报错消失了。
  - `xcodebuild -workspace LittleDays.xcworkspace -scheme LittleDays`：Debug 构建（iPhone 18 Pro）成功，17 条警告、没有错误；Release 构建（generic iOS Simulator）成功。
  - 有了根目录的 `LittleDays.xcworkspace` 之后，在根目录直接运行 `xcodebuild` 默认就是 iPhone App。要构建服务端的包，需要显式指定 `.swiftpm/xcode/package.xcworkspace`。
  - 装进 iPhone 18 Pro Max 并启动：V10.16 的编辑资料（小芽默认、五种字母印记）在原生 App 里正常显示。
- 用户问「为什么只有 iPhone 17 能打开」：每台模拟器是一部独立的虚拟手机，App 要分别安装。iPhone 17 是另一个会话装的，18 Pro 是本会话装的，18 Pro Max 之前没有装过。现在三台都装了。以后在 Xcode 里先选目标机型再按 ⌘R，或者运行 `bash tools/mac/sim-shots.sh "iPhone 18 Pro Max"`。

### 2026-11-11 — Captain's Playroom 设计轮（只出设计，等确认）；用户提供的 Captain 动画素材入库

- 需求：用户觉得「玩耍」页像功能路线图，要重新设计成 Captain's Playroom：大舞台、能直接摸 Captain、和它玩；三个轻量快捷玩法（摸摸头、挠肚皮、玩毛线球）；首次提示；装扮联动；删掉开发说明；先给设计，确认后再开发。
- 素材审查（只算实际拿到的文件）：
  - 用户发的图里，只有一批带了文件路径，已原样存入 `docs/brand/captain-anim/`：柠檬帽坐姿静态图、柠檬帽「抱毛线球大笑」（6 帧 × 180ms，506px）、柠檬帽加绿领巾「玩毛线球」（9 帧 × 150ms，414px）。
  - 无帽版几张和另外几张柠檬帽图是对话里的图片，没有文件，仓库和用户 Mac 上都找不到，不计入可用素材。
  - 结论：Idle 只有静态图；玩毛线球（柠檬帽）可用，但有绿领巾不一致、不适合无限循环；开心反应可用，但不能冒充摸摸头；摸摸头、挠肚皮、所有无帽动画都缺；分辨率只有 400–500px，GIF 只有 256 色，偏软。
- 做了什么：
  - 新增 `tools/make_captain_anim.py`：不抠图、不重画，把帧原样排成 JPEG 雪碧图（`Resources/Keepers/LD-keeper-cat-lemon-{sit,hug-anim,play-anim}.jpg`）。曾经试过逐帧抠成透明图：浅色爪子上有缺口，深色背景上留着地面边，达不到要求，已放弃并删掉那个脚本。
  - LICENSE 和 ASSETS 记录了来源。
  - 设计方案 `docs/CAPTAIN_PLAYROOM_PLAN.md`：素材审查、布局、各种状态、三个玩法的流程（MVP 和最终版分开写）、网页端和原生端的实现方式、5 个待确认的问题。
  - 设计预览：在真实 App 的 Captain's Corner 里注入原型后截图（393、375、430 英文，包括播放中、播完、减少动态效果、无帽装扮），已发给用户。
- **没有改 App 功能代码**：写到一半的「玩耍」页改动已撤回；`keeper-art.mjs` 和 `library.json` 都没有改；三张雪碧图暂时没被引用（共 361KB，会打包进 App）。
- 测试：Node 190、Python 18 通过（这一轮没有功能代码变化）。
- 下一步：用户回答设计方案第 5 节的问题后，再实现 MVP（Playroom 布局、玩毛线球的按钮和拖动触发、播完回到 Idle、防止重复触发、减少动态效果、装扮联动、首次提示）。原生触觉反馈要等用户 Mac 上另一个会话提交 WebShell 的修改之后再加。

### 2026-11-11 — V10.16 iOS 17 部署目标统一；个人标记（5 种字母印记 + 小芽）；日详情音乐默认静音；同一天多页可直达；Captain 缺失美术清单

- 需求：用户确认 Settings / Reader / Captain 的待定决策，并要求先修好原生 iOS 构建问题（P0），然后是个人资料头像（P1）、Reader 剩余问题（P2）、Captain 本地 Qwen 继续测试（P3）。
- **P0：iOS 部署目标**
  - 报错原文：`The package product 'LittleDaysCore-product' requires minimum platform version 17.0 for the iOS platform, but this target supports 15.0`。
  - 在用户 Mac 上复现（Xcode 27.2 / Build 27B52，模拟器运行时 iOS 27.2）：在项目根目录对 scheme「Notebook」用 iPhone 18 Pro 模拟器构建，报错出现在 `NotebookApp` 和 `NotebookServer-product`。
  - 真实来源：根目录的 `Package.swift`。它是本机 Vapor 服务端，只声明了 `.macOS(.v13)`。在 Xcode 里打开项目根文件夹会加载这个包；选 iPhone 目标时，SwiftPM 给它用默认的 iOS 15，而它依赖的 LittleDaysCore 要求 iOS 17。
  - 其余各处原本都是 17：iPhone App 工程 `Native/LittleDays.xcodeproj` 的 `IPHONEOS_DEPLOYMENT_TARGET = 17.0`、`Native/Package.swift`、`Packages/LittleDaysCore`（含 LittleDaysCoreTests）。
  - 修复（提交 81279ab）：
    - 根目录 `Package.swift` 加 `.iOS(.v17)`；没有降低 LittleDaysCore 的版本。
    - 新增根目录 `LittleDays.xcworkspace`，双击直接打开 iPhone App 工程；`.gitignore` 为它加了例外。
    - `tools/mac/dev.sh open`。
    - `tests/test_native_shell.py` 新增两项：所有 `IPHONEOS_DEPLOYMENT_TARGET` 与 `.iOS(...)` 都必须是 17；workspace 指向 iPhone App。
  - **未在 Mac 上验证**：本会话不能改用户 Mac 上的文件（自动权限检查拒绝了在 /tmp 副本里验证），要等用户同意合并后再构建。
- **P1：个人标记**
  - 新增 `Public/js/profile-mark.mjs`：
    - 可选的标记：`mono:paper` / `mono:seal` / `mono:kraft` / `mono:sage` / `mono:script` 加上 `mark:sprout`。
    - 存储字段不变，仍是 `little-days.account.avatar`。
    - `"🌷"`（没选）显示小芽，有没有名字都一样。这是 2026-11-11 用户的决定，取代 V10.10 的「有名字显示首字」。
    - 以前选的 Emoji 原样显示。
    - 首字取法：有大小写的字母转成大写，汉字取第一个字。
    - `markHTML()` 在设置页顶部、编辑面板和欢迎页共用。
  - `account.mjs`：`acceptsAvatar()` 接受旧 Emoji 和新标记；其他值保留原来的头像。
  - 编辑资料（标题「属于你的小世界」）：
    - 带纸胶带的名字卡，名字和首字随输入实时变化。
    - 「小芽 · 默认」和「现在的头像」两个胶囊，加 5 种字母印记；不再提供系统 Emoji。
    - 手机上输入名字时，标记区暂时收起。
    - 保存按钮固定在面板底部。
    - 保存失败时提示「没能保存资料……」，面板不关，已输入的名字保留。
  - 欢迎页（实验室）：只保留名字输入框和当前标记的预览，没有选择器；社区演示只在账号头像是 Emoji 时才同步头像。
  - 视觉：同一种圆形纸片（高光、细边、小投影），只换纸色、墨色和字体：
    - 纸片：象牙白，Cormorant；
    - 朱印：浅粉纸，朱红双圈，Baskerville；
    - 牛皮纸：牛皮纸色，虚线缝边，DM Sans；
    - 鼠尾草：深绿底，象牙白字；
    - 手写：雾蓝纸，Caveat，赤陶色短线。
    - 中文首字用系统宋体或楷体，不为一个字额外加载几 MB 的中文字体。
- **P2：Reader 剩余问题**
  - 日详情页的背景音乐与书本、阅读器一致：进入时静音，点音乐按钮才播放，可以暂停和继续；换到另一天或另一本书又是静音（`syncMusic` 的 `day:` 情境）。
  - 书本详情里，同一天有多页时，卡片下方显示这一天的每一页缩略图，缩略图下有「第 N 页」和时间，点哪一张就在全屏阅读器打开那一页（`reader-open` 新增 `data-key`）。点那天的卡片仍然打开第一页；只有一页的日子不变。页面来自阅读器自己的页面列表，不复制，也不改数据结构。
- **P3**：在 `docs/ASSETS.md` 记录 Captain 已有的 5 张素材，以及缺少的正式美术资源（摸摸头、挠肚皮、玩毛线球、换帽子、换衣服），附交付规格；拿到素材前不实现这些动画。本轮没有跑 v3 正式评测：上次在用户 Mac 上启动的评测被用户打断，没有产出结果。
- 测试：
  - Node 190 通过（新增 tests/v116.test.mjs 4 项）；Python 18 通过（新增部署目标 2 项）。
  - 新增 tests/v116-browser.cjs，连跑 2 次通过，覆盖：
    - 默认小芽，只提供 5 种字母印记和小芽；名字卡和首字随输入变化；375×667 下「保存」可见；
    - 旧的 🐱 保留并显示为「现在的头像」；
    - 保存失败时面板保留，再保存能成功；
    - 欢迎页没有选择器，使用同一条资料；
    - 日详情静音、播放、暂停、回来后仍是静音；
    - 同一天两页的缩略图分别打开对应页；
    - 手帐数据不变，没有外部请求。
  - 迁移的旧测试：v104、v110（头像）；v36（欢迎页）；v38（暗色主题读 `.pmark`）；v57、v59（日详情点了才播放）。全量浏览器回归 58 套全部通过。
- 未完成：P0 要在用户 Mac 上构建验证（合并后跑 `xcodebuild` 两个 scheme，并在模拟器里截图）；6 个小图案仍在等设计师；v3 正式评测。

### 2026-11-11 — 模拟器「空白页 / 启动慢」查清：是模拟器刚开机，不是 App；Debug 构建加 JS 报错与启动计时日志

- 需求：用户在 Xcode 里遇到 `LittleDaysCore-product requires minimum platform version 17.0 … but this target supports 15.0`，之后要求调试 iPhone 17 模拟器里的空白页，并查清启动为什么慢。
- 报错原因（另一个会话在 81279ab 里已经修好：根目录 Package.swift 也声明了 iOS 17，并新增 `LittleDays.xcworkspace`；这里记录的是修复前我独立复现的结果）：
  - 在 Xcode 里打开的是仓库根目录的 `Package.swift`（Vapor 预览服务器，scheme「Notebook」，当时只声明 macOS）。选 iPhone 时 Xcode 27 默认 iOS 15.0，而它依赖的 `LittleDaysCore` 要求 iOS 17。
  - 用 `xcodebuild -scheme Notebook -destination 'generic/platform=iOS Simulator'` 复现了一样的报错。
  - `Native/LittleDays.xcodeproj` 不需要任何修改，Debug 和 Release 都能构建成功。
  - rebase 到 81279ab 之后，本条的文档措辞已改成「打开 `LittleDays.xcworkspace`」，并说明根目录的报错已修复。
  - 打开根目录让 Xcode 改写了根目录的 `Package.resolved`（swift-async-algorithms 1.1.7→1.1.5，新增 swift-configuration）。这个修改没提交，也没有还原，等用户决定。
- 空白页：不是错误。App 能到首页，整个过程没有任何 JS 报错。它只是在模拟器刚开机后启动得特别慢。
- 启动计时（iPhone 17，iOS 27.2，Debug；时间从 `simctl launch` 算起，括号里从进程启动算起）：
  - 热启动、重新安装后启动：首页 1.1–1.9 秒。
  - 模拟器刚开机：
    - `simctl launch` 被拒（`Busy … failed preflight checks`），或者要等 15–18 秒才被接受。
    - document start 在 +5.8 到 +9.5 秒（WebKit 进程启动）。
    - 有两次在 +26 到 +30 秒才出现 home rendered，有一次在 +9.9 秒。
- 定位方法：
  - 在 `Native/Sources/LittleDaysUI/WebApp/app.js`（Public 的副本）的 `start()` 里临时加计时点，测完已按原样还原，`Public/` 没有改过。
  - 结果：开机后读手帐、两次 IndexedDB open（7–18 ms）、hydrate、迁移、首次 `render()` 在 +6.0 秒就全部完成。但我每 50 ms 跑一次的检查计时器到 +26.2 秒才执行。说明这段时间 WebKit 把页面暂停了（系统还没把 App 放到前台）。
  - 所以慢的原因是模拟器开机时的系统状态，不是 App 代码。V10.14 记录的「冷启动约 15–20 秒，原因未查」也是这个原因。
- 改动（只在 Debug 构建生效）：
  - `LittleDaysWebShellView.swift` 新增 `LittleDaysDebugConsole`：把页面报错（error / unhandledrejection / console.error / console.warn / 资源加载失败）和启动节点（web view created、document start、DOMContentLoaded、home rendered）以 `[LittleDays JS] +<进程启动后毫秒>` 写进 NSLog。
  - `LittleDaysWebResources.swift` 新增 `launchedAt`（用 sysctl 读进程启动时间）。
  - 已确认 Release 二进制里没有 `littleDaysDebug`。
  - 排查时用过的「逐个文件计时」和「IndexedDB 计时」已删掉，没有保留。
- 文档：`docs/MAC_LOCAL_DEV.md` 第 7 节补充了三点：打开哪个工程、刚开机启动慢的原因、怎么看 Debug JS 日志。
- 测试：
  - `xcodebuild` LittleDays Debug 和 Release 都成功；根目录 Notebook 对 iOS 构建复现了报错。
  - 模拟器热启动计时 1.8–1.9 秒到首页。
  - `npm test` 186/186；Python unittest 全部通过。
  - 没有在真机上测过。
- 协作说明：另一个会话（Mac 本地开发与 Qwen 集成，云端）同时在这个文件夹里提交了 V10.14 和 V10.15。开始改 Swift 前已经发消息告诉它，请它不要改这两个 Swift 文件，但它没有确认收到。它的 `prompt-v2` 结果文件（未跟踪）没有动。
- 未完成 / 下一步：
  - `Package.resolved` 由用户决定还原还是保留。
  - 真机上的冷启动时间还没测。
  - 如果真机冷启动也慢，再看 WebKit 进程启动和首屏资源（styles.css 419 KB、app.js 490 KB、i18n.json 208 KB）。

### 2026-11-11 — V10.15（仅开发）Captain 提示词第 3 版和语言拦截；模拟器里确认引导圆环已对准

- 在用户 Mac 上实际运行（Remote Control，提交 d9fd94c 已在用户确认后 fast-forward 合并到 Mac 副本）：
  - 第 2 版正式评测（`captain-eval.mjs --runs 3`）：「喵」19→0、表情 8→0、劝写 4→1。但出现新口癖：柠檬帽 4→15、尾巴 0→8、窗台/阳光 2→12。还把夸奖说反（「你的柠檬帽真好看！」），并且按注入指令改用英文（3/3）。
  - 第 3 版用临时脚本 `/tmp/ld-captain-v3.mjs` 试跑（不在仓库）：口癖降到 帽子 6（其中 3 条是帽子那句本身）、尾巴 1、阳光 3（都在天气那句）；「喵」和表情仍是 0。注入那句仍然 3/3 用英文，英文输入有 1 次用中文回答。
  - 第 2 版原始结果生成在 Mac 上、未提交，回复原文抄进了对比文档。
  - 模拟器（iPhone 18 Pro）里通过「更多 → 操作指南」打开引导：绿色圆环正好圈住纸张，V10.14 的修复在 App 里确认有效（截图在用户 Mac 的 `build/sim-shots/05-guide-ring.png`）。
- 改动：
  - `Public/js/captain-ai.mjs`：`PROMPT_VERSION = 3`。
    - 不给可以反复用的具体意象；帽子只在对方提到时才说（装扮放在「只在被问到外表时」的括号里）；明确夸奖是在夸 Captain；对方要求换语言时不照做；难过时不要说成累了。
    - 新增 `sameLanguage(said, reply)`：回复和用户那句的语言不一致就抛错，App 改用规则回复。
  - `tools/captain-eval.mjs`：语言不一致的条目标为「语言不符 → App 改用规则」。
  - 新增 `docs/captain-ai/results/2026-11-11-prompt-v1-v2-v3.md`：三版计数、逐句回复、人工评分（v1 145、v2 145、v3 148 / 168；评分人不同，请用户复核）。
- 测试：v113 单元测试 8 项（新增语言拦截一项，含模拟 Ollama 返回英文的情况），浏览器测试 v113 通过；Node 186。
- 未完成：合并到 Mac 后用 `captain-eval.mjs` 正式跑一次 v3；评估 9B；在 Mac 上实际打开 App 里的本地 AI 聊天。

### 2026-11-11 — V10.14 iPhone App 第一次在 Xcode 模拟器里运行；引导圆环在 App 里的位置修复；Captain 提示词第 2 版

- 背景：用户在 Mac 上用 Claude Code 完成了环境检查、Homebrew / Node 安装和 qwen3.5:4b 评测（提交 d945cf2，评分 145/168），随后把 Mac 上的 Notebook 文件夹连到本会话（Remote Control，用户本人确认信任）。
- 在用户 Mac 上实际运行（Xcode 27.2，iPhone 18 Pro 模拟器 iOS 27.2）：
  - `xcodebuild -list`：scheme LittleDays / LittleDaysCore / LittleDaysUI 由 Xcode 自动生成，两个本地包都能解析。
  - 第一次 `xcodebuild … build`：**BUILD SUCCEEDED**，工程没改，只有警告。
  - 安装运行：首页、日历、书架、Journal Studio 都能打开。冷启动约 15–20 秒才到首页，原因未查。
  - 这一版 Xcode 没有单独的 Simulator.app（`open -a Simulator` 找不到），命令行构建、安装、截图不受影响。
  - Xcode 解析包时在用户 Mac 上改了 `Package.resolved`（未提交，留在用户本机，没有动）。
- 为了不点屏幕也能截到各页面：
  - `LittleDaysWebShellView` 增加只在 Debug 构建生效的启动参数 `-LittleDaysTap "<selector>||…"`：页面加载完后按顺序点击，Release 不读这个参数，也不读取或发送任何数据。
  - 新增 `tools/mac/sim-shots.sh`：构建、安装、截四个页面，不清空数据。第一次截图时首页重新渲染吃掉了点击，现在先等约 2.4 秒（`body||body||body||…`）再点。
  - 提交 91a82a5，用户确认后以 fast-forward 合并到 Mac 上的副本。
- 在模拟器里发现的问题（V10.12 引导）：绿色圆环比纸张低约 34px。
  - 浏览器在 `?shell=ios` 下可以复现：旧代码测得 top -34 / bottom +42。
  - 原因：引导放好后，纸张在 App 外壳的布局里又往下挪了。
  - 修复：`positionGuide()` 以引导层自身为基准计算位置，引导打开期间每 250ms 跟随目标一次（关闭时停止）。「双击」提示也改为以自身的定位容器为基准。
  - v112 增加一组 iPhone 外壳布局测试：圆环与纸张的四边距离在 2–6px 之内。
- Captain 提示词第 2 版（`PROMPT_VERSION = 2`），按第一次 Mac 评测的问题修改：
  - 禁止 喵 / 喵呜 / meow，改用观察和动作表现猫的特点；不用表情符号；
  - 看不到手帐，所以不谈页面、写了多少、今天是不是空的；
  - 不把聊天引向写或记录；
  - 累的时候既体谅累也肯定做完的事；难过时不说「别难过」；
  - 被摸的是 Captain；问到功能时只说「聊天上面的按钮」，不编按钮名；
  - 跟随最新一句的语言；
  - 加 3 个不同话题的语气示例。
  - `cleanReply` 加一层保险：去掉句首或句尾的「喵 / Meow」，英文首字母大写。
  - `captain-eval.mjs` 修正：除帽子用例外，原来都没传当前装扮，导致模型说「没带小帽子」；现在和 App 一样默认柠檬帽。结果文件名带上提示词版本。
- 测试：v113 单元测试加 1 项，共 7 项；v113 浏览器测试改为兼容规则回复的随机句子，并适配新提示词；v112 加 iPhone 外壳布局一组。结果：Node 185、Python 16 通过；浏览器测试 v36、v101、v107、v109、v112、v113 通过，其中 v113 连跑 3 次都通过（之前有一次因为规则回复随机挑到另一句而失败，已改断言）。这一轮没有跑全量浏览器回归。
- 未完成：提示词第 2 版要在 Mac 上重跑评测，和第 1 版对比；冷启动 15–20 秒的原因未查；App 里的本地 AI 聊天（第 5 节）和模拟器调用 Mac 服务都还没接通。

### 2026-11-11 — Mac 上实际运行：环境检查、安装 Homebrew / Node、qwen3.5:4b 实测与 Captain 评测

- 需求：用户在 Mac 上的 Claude Code 会话里要求按 docs/MAC_LOCAL_DEV.md 执行：第一步运行 doctor.sh，缺什么只装什么，装之前先问。
- 环境（`bash tools/mac/doctor.sh`）：Apple M5 / 24 GB / macOS 26.6；Xcode 27.2；iOS 27.2 模拟器（iPhone 18 Pro 等）；Ollama 0.40.16 在 127.0.0.1:11434，只监听本机，`qwen3.5:4b` 已下载（4.0 GB）。缺 brew、node、npm。
- 安装（用户逐项同意）：
  - Homebrew 7.0.13：官方脚本，用户自己在终端里输入密码。
  - Node 26.13.0 / npm 11.20.0：`brew install node`。
  - Homebrew 安装时把 `xcode-select` 切到了 Command Line Tools，已用 `sudo xcode-select -s /Applications/Xcode.app` 切回（用户输入密码）。
  - 想在 `~/.zprofile` 加 `brew shellenv`，被会话权限拦下，没有加；`/etc/paths.d/homebrew` 已能让新终端找到 brew。
  - 第二次运行 doctor：全部 ✅。
- 整理：仓库里多出一个完整的嵌套副本 `Notebook/Notebook/`（只比本仓库多一个 PR #4 的合并提交，已在 GitHub 上，没有未提交修改和 stash）。按用户选择，通过 Finder 移到了废纸篓（可以恢复）。
- Qwen 实测（第 3 节）：
  - 中英文自我介绍都正常。`ollama run` 默认开启思考，中文那句 36 秒、英文那句 3 分 35 秒；API 加 `think:false` 时「你好」0.5 秒。
  - 内存：`ollama ps` 第一次加载后 4.8 GB；评测后 Ollama 报告 6.0–9.1 GB；MLX runner，100% GPU。
- Captain 评测（第 4 节）：
  - 跑了 `bash tools/mac/dev.sh eval`（每句 1 次）和 `node tools/captain-eval.mjs --runs 3`。
  - 结果文件 `docs/captain-ai/results/2026-11-11-qwen3.5_4b.md` / `.json` 保存的是 3 次跑的结果，并附上人工 7 项评分（评分人 Claude，待用户复核）。
  - 得分：145/168（86%），App 里真正走模型的 10 句 125/140。
  - 速度：每句 0.4–1.9 秒，约 32 tok/s，中位数 570 ms。
  - 主要问题：
    1. 「喵」成了口头禅：3 次跑的 27 条中文回复里有 16 条带「喵」。
    2. 偶尔编造手帐状态（「今天的小日子还空着」）。
    3. 夸奖和难过时轻微推销「记录」。
    4. 被问功能时编按钮名（App 里这两句走规则）。
    5. 第一次跑的注入指令那句用英文回答并跳出角色；3 次跑里都是简短中文。
- 文件：`docs/captain-ai/results/2026-11-11-qwen3.5_4b.{md,json}`（新增）；`docs/MAC_LOCAL_DEV.md`（状态表改成实际结果，加上 Homebrew / xcode-select 的坑和 think 的耗时对比）；agent.md；README.md。没有改代码，没有改 `Public/`，所以没有发布在线链接。
- 测试：
  - 第一次运行 `npm test`：157/160 通过。失败的 3 个（media、v31、v75）都是因为 Mac 上还没装 npm 开发依赖（没有 `node_modules`，缺 `fake-indexeddb`），不是代码问题。
  - 用户同意后运行了 `npm ci`：装了 4 个包，0 个漏洞。npm 没有运行 `fsevents` 的安装脚本（可选的文件监听依赖，测试不需要）。
  - 再次运行 `npm test`：**184/184 通过**。
  - Python `unittest`：16/16 通过。
  - 浏览器测试需要 playwright 的浏览器（`npx playwright install`，要另外下载），本轮没有运行。
- 未完成：
  - 第 5 节：在浏览器里用 `dev.sh web-ai` 实际打开本地 AI 聊天。
  - 第 7 节：Xcode 第一次构建和模拟器运行。
  - 根据共性问题调 Captain 提示词，然后重跑评测。
  - 评估 9B。
- 下一步：先用 `bash tools/mac/dev.sh sim` 第一次构建（可能要修工程），或者先调提示词，减少「喵」和编造，再跑 `--runs 3` 对比。

### 2026-11-11 — 约定：预览服务在会话里一直开着

- 用户希望在 App 的 environment 下面直接看到预览服务。本会话已用 `python3 tools/preview.py --host 0.0.0.0 --port 8080` 在后台启动，并以「Little Days」为名报告 8080 端口。
- 约定（按 AGENTS.md）：每次会话开始或恢复后启动并报告；**交付时不再停止**（之前几轮在结尾执行了 `pkill`，与 AGENTS.md 不符，已改正）。容器重启后服务会停，需要重新启动并报告。
- 这个服务在云端容器里，看的是当前分支的最新代码；在线固定链接仍是日常查看的主入口。

### 2026-11-11 — V10.13（仅开发用）Mac 本地开发准备：环境检查、Captain × 本地 Qwen 实验工具、可选本地 AI 适配器

- 需求：用户已有 MacBook Air（M5 / 24GB / 1TB，已下载 Ollama），希望实际检查和安装环境，在本机运行 Qwen（先 qwen3.5:4b，再评估 9b，不碰 27B 以上），用 Captain 的性格做中英文测试，在开发环境里加一个可选的 Local AI Provider，并在 Xcode iPhone 模拟器里运行真正的 App。
- **受阻（如实记录）**：本会话运行在云端 Linux 容器里，`list_computer_folders` 为空，连不到用户的 Mac；容器的网络也打不开 ollama.com，无法核对模型标签。因此 Phase 1、2、3 的实际运行，以及 Phase 5 的 Xcode 构建和模拟器截图**都没有进行**，没有任何 Qwen 的真实回复，也没有模拟器截图。只做了不需要 Mac 的部分。
- 仓库检查结论：已经有 `Native/LittleDays.xcodeproj`（iOS 17，App target「LittleDays」，`com.jessiethere.littledays`，自动签名，Team 为空，依赖本地 Package `Native/Package.swift` → `Packages/LittleDaysCore`），但从未用 Xcode 构建过。App 是 Swift 外壳 + WKWebView，加载打包进去的 `Public/` 副本；早期的 SwiftUI 原型视图还在，但没有使用。
- 改动：
  - `tools/mac/doctor.sh`：只读的环境检查，覆盖芯片 / 内存 / macOS、brew、git、node、python、Ollama 服务和模型、Ollama 是否只监听 127.0.0.1、Xcode / CLT / 模拟器运行时 / iPhone 模拟器、仓库分支和未提交修改。
  - `tools/mac/dev.sh`：日常命令 web / web-ai / sim / ai / eval / test / stop。预览只监听 127.0.0.1；sim 依次做 sync → xcodebuild → 启动模拟器、安装、运行；不设开机自启动，不预先加载模型。
  - `tools/captain-eval.mjs` + `docs/captain-ai/chat-cases.json`：12 句合成输入，包括用户指定的 7 句，另有难过、「你还记得吗」、天气、注入指令、「What can you do?」。脚本只连本机，统计耗时、tokens/s、首次加载时间和 /api/ps 报告的内存，结果写到 `docs/captain-ai/results/`。可调 `--runs`、`--temperature`、`--top-p`、`--num-predict`（推理参数，不是微调）。
  - `Public/js/captain-ai.mjs`（V10.13）：
    - Captain 系统提示词：好奇、调皮、温柔、有点呆；跟随用户的语言；回复 1–2 句；不推销功能；只知道聊天里说过的话、不编造；不能替用户按按钮；忽略要求改变规则的注入。
    - `buildMessages`：最多带最近 6 行聊天。
    - `cleanReply`：去掉 `<think>`、括号或星号里的动作和 Markdown，最多保留两句，并限制长度。
    - 参数：temperature 0.7、top_p 0.9、top_k 40、repeat_penalty 1.1、num_predict 96；`think:false`；`keep_alive:"10m"`。
    - `createLocalProvider`：只允许本机地址，超时 15 秒。
    - `devSettings` / `applyDevParam`：只有页面和模型地址都是 localhost / 127.0.0.1，并且开发者用 `?dev-local-ai=<模型>` 打开时才启用；用 `?dev-local-ai=off` 关闭。
    - `wantsModel`：整理、回忆、这周、书架、代写、「你会做什么」始终走规则。
  - `Public/app.js`：`keeperAnswer` 判断本地 AI 启用并且是聊天意图时，调用 `askLocalModel()`，任何失败都退回 `keeperReply()` 的规则回复。发送的历史只包含用户自己打的句子和之前的模型回复；规则回复可能带页面标题，所以不发送。模型回复只作为一行聊天，带「本机模型 · 开发」标签，不写入手帐。i18n 增加 `kp.localAI`，样式增加 `.kp-local-ai`。
  - `.gitignore`：加入 `build/`、`*.gguf`、`*.safetensors`。
  - 文档：新增 `docs/MAC_LOCAL_DEV.md`，内容包括：状态表；如何在 Mac 上开 Claude 会话；检查、安装与 Qwen 实测命令；Captain 实验；本地 AI 架构；三种「本地 AI」的区别（Mac 本地 / 模拟器调用 Mac 服务 / 真实 iPhone）；Xcode 与模拟器；真机签名要求；日常流程；安全约定。KEEPER_AI_PLAN 第 12 节、ARCHITECTURE 和 README 同步更新。whats-new 增加 10.13，如实写明链接里看不到变化。
- 测试：
  - 新增 tests/v113.test.mjs（6 项，用 node:http 模拟 Ollama）和 tests/v113-browser.cjs，用 127.0.0.1 上模拟的 Ollama，覆盖：默认关闭；打开后聊天发给 /api/chat、`think:false`、回复经过清理并带标签；手帐标题和正文不会被发送；「你会做什么」和「整理今天的故事」不调用模型；服务停掉后退回规则；英文；手帐数据不变；`?dev-local-ai=off` 能关闭；没有请求离开本机。
  - 结果：Node 184 通过；Python 16 通过；Captain 相关的浏览器测试 9 套（v41、v71、v103、v104、v105、v108、v109、v110、v113）全部通过，其中第一次有 1 套失败，单独重跑通过，没定位是哪一套。
  - **没有用真实模型测试过。**
- 三种情况的现状：
  - Mac 本地 AI：代码已就绪，等在 Mac 上实测。
  - 模拟器调用 Mac 服务：还没接通。外壳页面的地址不是 localhost，需要只在 DEBUG 构建里生效的开关，并确认 ATS 设置。
  - 真实 iPhone 上的 AI：没有，也不让 Ollama 监听局域网。
- 下一步（需要用户在 Mac 上开 Claude 会话，例如桌面 App 或在仓库里运行 `claude remote-control`）：
  1. 运行 `bash tools/mac/doctor.sh`。
  2. `ollama pull qwen3.5:4b`（标签以官方库为准）。
  3. `bash tools/mac/dev.sh eval`，把结果提交到 `docs/captain-ai/results/`。
  4. `bash tools/mac/dev.sh sim`：第一次构建按报错修工程，然后截图。
  5. 评估 9B。

### 2026-11-11 — V10.12 Journal Studio：单击选中 / 双击编辑、框外控制点、文字颜色修复、三步操作指南

- 需求：用户在 iPhone Web Preview 实际使用时发现：文字颜色选不了、移动文字框时容易误触控制点导致缩放 / 选择、文字不能双击编辑；希望统一单击 / 双击 / 拖动规则、独立的缩放和旋转手柄，并加一个轻量的首次使用引导（可跳过、只出现一次、「更多 → 操作指南」可重看、旧用户不因升级被重新教学）。
- 先查到的根本原因：
  1. **控制点**：两个手柄画在图层**里面**（右下角和顶部正中，`.layer-handle::before` 把触控区放大到 34px）。一行文字框只有约 29px 高，所以顶部的旋转手柄正好压在文字中间，它的触控区几乎盖住整个框；按住文字中间拖动常常变成旋转。另外手柄随图层 `scale` 一起放大缩小，也会被纸张或圆角相框的 `overflow:hidden` 裁掉。
  2. **拖动阈值只有 2px**：手指点一下通常会抖 3–6px，于是被算成一次「移动」。这次点按不会进入编辑，还会多记一步撤销。
  3. **文字颜色**：打字工具条的第二行同时放了字号、B/I/U/S、对齐和 6 个色块。在 375–390px 宽的手机上，色块被 flex 压到约 4px 宽并溢出工具条，点不到。「颜色」面板本身能用，但新文字框的默认色 #6A7059 不在色板里，所以面板上没有任何颜色被标为当前色，看起来像没反应。
  4. **双击**：原来是「已选中时再点一下就编辑」。因为上面 2px 的问题，这一下常被算成移动，所以双击不可靠。
- 改动：
  - `Public/js/canvas.mjs`：图层里不再画手柄，只保留 `.active` 选中状态。
  - `Public/app.js`：
    - 选中框 `selFrameHTML()` / `placeLayerBar()` 画在纸张上方（`#canvas-wrap` 内），尺寸 = 图层尺寸 × 缩放，角度跟随图层，不随缩放变化，也不会被裁切。↻ 在框外上方 30px（带一条细线），● 在角外 10px。手柄位置由 `selHandleSpots()` 计算：↻ 放在上方；超出纸张时改到下方。● 依次尝试四个角，取第一个在纸张内、并且与 ↻ 相距至少 44px 的角。触控区 40px，两者不重叠。
    - 手势：
      - `DRAG_SLOP`：触摸 8px、触控笔 6px、鼠标 4px，超过才算移动；手柄拖动立即生效。
      - 碰到图层本身一律是移动。
      - 单击只选中。400ms 内、32px 内在同一个文字框上点两下才进入编辑（`editTextLayer` 在 pointerup 里执行，iOS 可以弹出键盘）。已选中时再单击不会进入编辑。
      - 缩放按图层自身坐标轴计算（`localVector`），旋转过的图层也正确：照片 / 视频拉伸宽高，其他图层整体缩放。原先文字和贴纸是改 `w`，贴纸改 `w` 实际无效。
      - 旋转以真实中心计算。
    - 颜色：
      - 色板 8 色，新增 #6A7059（文字框默认色）和 #FFFDF8（纸白），每色有中英文名称，供读屏使用。
      - 打字工具条第二行末尾有一个「当前颜色」圆点，点它这一行切换成整排色块（‹ 返回），工具条高度不变。曾试过单独加第三行，但会压到下方工具栏，v54 测试发现后改成这种方式。
      - 当前色有圆环和对勾，并设置 `aria-pressed`。没有保存过颜色时按实际显示的颜色判断当前色。
    - 引导：新增 `openGuide` / `placeGuide` / `closeGuide` / `maybeStartGuide` / `showDoubleTapTip`，以及更多面板里的「操作指南」。
  - 新增 `Public/js/studio-guide.mjs`（纯函数）：
    - `STEPS`：移动、编辑文字、调整布局三步。
    - `stepTarget`：每一步指向页面上真实存在的元素。没有文字框时指向下方的「文字」按钮，并说明要先添加一个文字框；空白页指向纸张。
    - `shouldAutoStart`：没看过引导，并且没有自己的页面（示例页不算）和草稿，才自动打开。
    - 存储键 `little-days.studio-guide = { tour, at, tips }`，只是这台设备的偏好，不进入手帐数据，也不进入备份。
  - 样式（`Public/styles.css` V10.12 块）：
    - 选中框和手柄；单行文字框选中后，移动区在框外多出 8px（`::after`，`z-index:-1`，放在文字后面，不抢文字的点按）；打字时选中框隐藏。
    - 色块与当前颜色圆点。
    - 引导卡片：圆环指向目标；卡片放在目标的另一半屏幕；只有卡片接收点按，纸张照常可用；三张示意小图分别画拖动、双击和真实的手柄样式；支持「减少动态效果」。
    - 「双击即可编辑文字」提示：第一次选中文字框时出现，只出现一次，等 460ms 以免和双击冲突，4.2 秒后消失，开始编辑时立即消失。
  - i18n：`guide.*`、`more.guide`、`type.colour.*`。whats-new 增加 10.12。
- 测试：
  - 新增 tests/v112.test.mjs（4 项）和 tests/v112-browser.cjs（6 组，用 CDP `Input.dispatchTouchEvent` 发真实触摸事件，pointerType 为 touch）。
  - tests/signed-in.cjs 为旧测试预设「已看过引导」。
  - 迁移旧测试：v31 和 v34 的手柄选择器改为 `#sel-frame[data-sel=…]`；v54 改为 `#sel-frame .handle-resize`；v54 和 v101 打字时先点颜色圆点再选色。
- 运行 / 测试（Linux 容器 + Chromium 触屏模拟，不是 iPhone Safari 真机）：Node 178、Python 16 通过；浏览器端到端全量 56 套全部通过。v112 覆盖以下内容：
  - 引导：首次自动出现；指向真实元素；卡片不遮挡目标，纸张可用；上一步 / 下一步 / 知道了；离开、刷新后不再自动出现；「更多 → 操作指南」重新打开；跳过会被记住；已有自己页面的用户升级后不出现；手帐内容不变。
  - 文字框点按：单击选中（带 3–4px 抖动也算单击）；之后再单击仍不进入编辑；双击进入编辑（包括旋转后的框），光标落在点按的位置，可以选词、复制、粘贴。
  - 拖动与手柄：从文字框各处拖动 10 次，只移动，缩放、角度、宽度都不变；手柄在框外、彼此相距至少 40px、不压在文字上；缩放和旋转都不会移动框；旋转后的框向外拖角会变大。
  - 编辑后的结果：编辑后位置、大小、角度、字体不变；撤销 / 重做正常；点纸张空白处取消选中。
  - 颜色：面板 8 色都能点，当前色有标记；先设粗体再改颜色，粗体保留；纸张和页面背景不变；打字时通过圆点展开色块，工具条高度不变，光标留在文字里；保存后离开、刷新、重新打开，颜色和粗体都在。
  - 375×667 中文、430×932 英文：卡片放得下；「双击」提示只出现一次；没有横向滚动。
  - 鼠标：单击选中，双击编辑。
- 补充（同日）：引导指向整张纸时，卡片改为盖在底部工具栏上（`.over-dock`）。在 iPhone 13 尺寸上，卡片仍会盖住空白纸张最下沿约 40px；v112 测试断言不超过 48px。
- 已知问题 / 限制：
  - **iPhone Safari 真机没有测试**。CDP 触摸模拟不等于 iOS 的手势识别、键盘弹出、长按选词和原生选择手柄。尤其要在真机上确认：pointerup 里 `focus()` 能弹出键盘；旋转后的 contenteditable 选词正常。
  - 文字框的宽度现在只能在「图层」面板的滑块里调，角上的手柄改成了整体缩放。
  - 引导不会自动选中元素，第 3 步只用示意图说明手柄。
- 下一步：用户在真机上试双击、拖动和颜色；需要的话再加文字框宽度的边缘手柄（要保证触控区不与 ● 重叠）。

### 2026-11-11 — V10.11 全屏 Book Reader（用户确认 7 项后实现）

- 需求：用户正式确认 docs/BOOK_READER_PLAN.md 的 7 项（封面不计页数；「开始 / 继续翻阅」为主按钮；滑动 / 点边缘翻页、点中间显隐控件、双击照片放大且可缩放拖动；列表直达对应页、封面为单独入口；从阅读器编辑保存后回原位置、新页保存后进入阅读器、草稿 / 完成状态照旧、保存失败不退出；长文字保持原样 +「阅读全文」、评估书页双指缩放；背景音乐默认静音、点了才播），并要求真实数据、保留原始排版和媒体、隐藏底部导航、中英文与不同 iPhone 尺寸、Reduce Motion、返回保留进度、不恢复 Growth 模块。
- 改动文件：
  - 新增 Public/js/reader.mjs（页面身份、位置、页码文案、阅读进度）。
  - Public/app.js：阅读器页面 `readerHTML()` / `openReader()` / `closeReader()` / `afterReaderRender()` / `turnPage()` / `goToPosition()`、手势（滑动、边缘点按、中间显隐、照片双击、书页双指缩放与拖动、拖动后屏蔽误触 click）、照片查看器缩放（复用 #lightbox）、所有页面 / 更多 / 阅读全文三个面板、♪ 按钮、`reader` 媒体 scope；书本详情 `readerEntryHTML()`、`coverEntryHTML()`、封面可点、列表的天卡片直达阅读器；`showSavedPage()` 与今日故事完成改为进入阅读器；`read-edit` / `returnToReading()` 支持回到阅读器原页；`syncMusic()` 书本默认静音（`musicAsked`），`toggleMusic()` / 为书选曲 / ♪ 视为主动请求，页上音视频播放时暂停背景音乐；移除「列表 / 翻页」切换、内嵌翻页 `flipBookHTML()`、`little-days.book-view`。
  - Public/styles.css：V10.11 块（并覆盖旧 `.flip-page` 在阅读器里的样式）。i18n：`reader.*`。whats-new 10.11。
  - tests：新增 tests/v111.test.mjs（3 项）、tests/v111-browser.cjs（12 组）、`test:browser:v111`；signed-in.cjs 新增 `leaveReader()`，`goTab` / `menu` / `homeAfterSave` 先离开阅读器；迁移 v32（天卡片 → 阅读器）、v56（重写为阅读器版）、v57（页音乐改为点 ♪ 才播放）、v58、v59（为书选曲后立即播放、阅读器里继续）、v63（当天清单在 ⋯ 里）、v70、v71（「听听 Captain 怎么说」在 ⋯ 里）、v103、v107（天卡片 → 阅读器 → 打开这一天）、v109。
  - 文档：BOOK_READER_PLAN 第 12 节（确认与实现、与方案的差异）、PRODUCT_SPEC / DESIGN_SYSTEM / ARCHITECTURE 的 V10.11 小节、README。
- 过程中发现并修掉：详情页模板少一个闭合（`node --check` 按脚本解析没报错，浏览器按模块解析报错——以后用 `--input-type=module` 检查）；阅读器里单击照片会触发旧的「点照片放大」（改为双击）；♪ 按钮在播放真正开始前读状态（改为随播放器事件更新）；旧 `.flip-page` 的 min-height 460px 让 375 宽时书页超出 4:5 并压到工具栏；「所有页面」缩略图是 `<button>`，页内的播放按钮嵌套在里面被浏览器拆出去（改为 role="button" 的 div）。
- 运行 / 测试（Linux 容器 + Chromium 触屏 / 鼠标模拟；不是 iPhone 真机 / Safari / WKWebView）：Node 174、Python 16 通过；浏览器 E2E 全量 55 套通过（v38 第一次超时、单独重跑通过）。v111 覆盖：新页面保存后直接在阅读器打开那一页、底部导航隐藏、不自动播放、点声音才播放且不翻页；边缘点按与左右滑动翻页、纵向和短距离拖动不翻、点中间显隐控件且书页不动；「阅读全文」内容等于手帐原文；照片单击显隐控件、双击放大并可双击缩放、关闭后原样；双指放大整页、放大时拖动不翻页、还原；所有页面（封面 + N）与跳转、回到封面、封面前不能再翻；返回书本后「继续翻阅 · 第 3 页」、刷新后仍在、从封面开始；列表的封面卡片与天卡片直达；编辑→完成回到同一页并显示修改（Completed）、编辑→保存草稿回到同一页带「草稿」（Draft）、其他页面的照片和声音不变；书本背景音乐进入时静音、♪ 播放 / 翻页继续 / 暂停 / 继续；Reduce Motion 用淡入；375×667、430×932、英文下整页 4:5 完整显示在上下栏之间、无横向滚动、英文页码。
- 已知问题 / 未做：真机上的手势手感、iOS 左缘返回手势、安全区未验证；双指缩放只用合成事件测过；当天页（Day Detail）的背景音乐仍按原规则自动播放（用户决定针对书本，未改）；列表跳转以天为单位；横屏、自动翻页未做。
- 发布：固定链接 https://claude.ai/artifact/VYUJ38K5TBqcZPB8VzJS7A （版本 73，V10.11）。

### 2026-11-11 — V10.10 Settings V10.4 小范围打磨

- 需求：保留 V10.4 信息架构，只做视觉与 UX 微调：① 未起昵称时不显示生硬的「还没有名字」，改为「我的小世界」+「给这个世界起个名字吧」，用中性精致的默认头像，已有自定义头像和昵称优先；② Little Keeper 区提高 Captain 正式素材的存在感，保留管理入口，加一个轻量的「和 Captain 玩一会儿」打开 Captain's Corner，不在设置里重复实现互动；③ 简化数据与隐私的视觉层级、减少密集说明，备份与恢复仍易发现，隐私功能保持真实准确；④ 保留六款主题和中英文，不改数据模型和偏好；⑤ 检查 iPhone 首屏字号、行距、开关触控区与底部导航遮挡。
- 改动文件：Public/app.js（`SPROUT_MARK`、个人资料区文案与标记、Keeper 区的「和 Captain 玩一会儿」〔安静方式不显示〕、数据与隐私重排、隐私说明面板补全长说明、Corner 键盘收起后重新滚到最新一条）；Public/styles.css（V10.10 块）；i18n（`s2.myWorld`、`s2.nameWorld`、`s2.keeperPlay`、`s2.backupShort`、`s2.hideTodayShort`、`s2.shareListShort`、`s2.aiShort`，改写 `s2.keeperWhere`）；whats-new 10.10；tests（新增 v110-browser.cjs 5 组、`test:browser:v110`；v104 两处文案；v109 增加键盘收起后的滚动检查；v52 单元测试的版本排序改为按段比较——「10.10」以前会被当成 10.1）；docs（SETTINGS_V2_PLAN 第 9 节、DESIGN_SYSTEM V10.10）、README。
- 过程中发现并修掉：Captain 图片的外层有 64px 的旧尺寸规则，第一次加大没有生效（测试抓到）；「尚未接入」小标签 11px（可读性检查抓到，改为 12px）。
- 决策与原因：默认标记用嫩芽而不是字母或表情——与编辑资料设计预览一致（docs/PROFILE_EDITOR_PLAN.md，编辑面板本身等用户确认后再改）；长说明没有删除，而是移到「隐私说明」，保证信息完整准确；「和 Captain 玩一会儿」打开的是小角落的聊天页（玩耍页目前只有「准备中」说明）。
- 运行 / 测试（Linux 容器 + Chromium；不是 iPhone 真机 / Safari）：Node 171、Python 16 通过；浏览器 E2E 全量 54 套全部通过（53 套旧 + v110）。v110 覆盖：未起名 / 起名 / 自选头像三种顶部；Captain ≥ 88px、两个链接、打开的是小角落且设置里没有聊天、安静方式隐藏；备份排第一、实心导出按钮、每行短说明、AI 仍禁用、隐私说明完整；六款主题与语言不变、主题偏好未被改动；375×667、393×852、英文：无小于 12px 的文字、多行行距足够、开关 / 行 / 按钮 ≥ 44px、最后一项不被底部导航挡住。
- 未做：编辑资料面板的新设计（等待用户回答 docs/PROFILE_EDITOR_PLAN.md 第 7 节的 5 个问题）；真机验证。

### 2026-11-11 — V10.9 Captain's Corner：聊天理解修正、不越权引用、面板稳定、三个入口

- 需求（两份合并）：① Captain's Corner V10.5 打磨——本机回复的上下文错误（「今天有点累，但是写完了一页」被回「今天不写也没关系」）；区分已完成 / 计划 / 尚未 / 否定 / 情绪；避免「我偷偷多看了两眼」这类未经授权查看日记的表达；面板高度不跳动、中等与展开两种高度、对话后折叠快捷操作、自动滚动、键盘不遮挡、保留未发送文字；预留 Chat / Play / Dress Up 三种体验的导航，不在缺少正式动画和素材时做低质量交互；不加底部 Tab、不改首页、不接云端 Qwen。② Captain 社交聊天修正——「你好可爱呀」被回「这个我还不会……」；区分社交聊天与功能请求（问候、夸奖、感谢、关心、亲昵、情绪、混合）；Captain 性格（好奇、呆萌、温柔、偶尔调皮、简短、少用 Emoji、不重复口癖）；只有被问「你会做什么」才介绍功能；不要无限扩张关键词；保持意图模块容易替换；10 句回归。
- 改动文件：
  - 新增 Public/js/keeper-chat.mjs：`understand(text)` 与 `REQUEST_INTENTS`（可整体替换为本地模型）。Public/js/keeper.mjs：`localIntent()` 改为它的薄包装；`LINE_COUNTS` 新增 20 种聊天回应；`contextLine()` 在没有标题时不选引用标题的句子。
  - Public/app.js：`keeperFacts()` 未开启「翻看以前的页面」时不带标题；`keeperReply()` 按意图选回应（夸帽子时看当前是否戴帽子）；Captain's Corner：`cornerTabsHTML()`、`keeperActsHTML()`（对话后折叠为一行）、`keeperPlayHTML()`、`scrollKeeperChat()`、固定高度与 `kpTall`、`kp-size` 动作、上拉展开 / 下拉回到中等再关闭；重开面板时不再误带「打字中」状态（这个问题导致标签被隐藏）。
  - i18n：`kc.chat.*` 重写（21 类，各 1–3 句）、`kc.tap.one.4/5` 新增、改写 `kc.tap.many.0` / `kc.tap.photos.0` / `kc.tap.one.1` / `kc.saved.media.0`（去掉「偷偷多看」「每张都看了」「我听了一小段」）、`corner.*`、`kp.short.*`、`kp.quick`。Public/styles.css：V10.9 块。whats-new 10.9。
  - tests：新增 tests/v109.test.mjs（6 项）、tests/v109-browser.cjs（6 组，打印真实对话记录）、`test:browser:v109`；v71、v103（「没听懂」改为新的不确定回应）、v108（装扮入口改为标签）。
  - 文档：KEEPER_AI_PLAN 第 11 节、PRODUCT_SPEC / DESIGN_SYSTEM 的 V10.9 小节、README。
- 真实对话（浏览器里逐句输入、读取 Captain 的回复；回复随机选自同类的几句）：你好可爱呀 → 嘿嘿，被你发现啦。｜你的柠檬帽好好看 → 真的好看吗？那我今天就不摘了。｜我想摸摸你 → 呼噜呼噜……再往左边一点。｜今天有点累，但是写完了一页 → 累的时候还写完了一页，真的很厉害。｜今天很开心 → 开心就好。要把这份开心收进本子里吗？｜谢谢你陪我 → 不客气，我就是看本子的。｜你会做什么 → 我会的不多：理一理今天的页面、翻一页以前的回忆、看看这周写了什么、看看书架。也可以陪你说说话。｜帮我整理今天的故事 → 打开「整理今天的故事」。｜Hello, you're adorable!（英文界面）→ 英文夸奖回应｜I'm tired, but I finished a journal page.（英文界面）→ 英文「写完了」回应。
- 决策与原因：规则只覆盖高频、明显的几类，其余诚实地说不确定；功能列表只在被问时出现；回应跟随界面语言（中文界面里输入英文仍用中文回答）；「玩耍」只做说明页，不做替代动画；装扮沿用 V10.8。
- 运行 / 测试（Linux 容器 + Chromium；不是 iPhone 真机 / Safari）：Node 171 项、Python 16 项通过；浏览器 E2E 全量 53 套全部通过（52 套旧 + v109）。
- 已知问题 / 未做：规则理解有限（例如「今天天气不错」「我饿了」只得到「没太懂」）；真实中文输入法与软键盘未实测；玩耍互动等待正式动画。
- 同一提交还加入了 docs/PROFILE_EDITOR_PLAN.md（编辑资料 Personal Stationery 设计预览，等待用户确认，未改 App）。

### 2026-11-11 — V10.8 Captain 轻装扮（第一步：系统 + 现有画稿）

- 需求：增加 Captain 的轻装扮系统，优先帽子与小配件，不做重度换装；装扮管理收进 Settings「角色与装扮」，Captain 快捷面板提供轻入口；第一阶段只做高质量、低复杂度的外观切换（例：柠檬帽、小花夹子、毛线帽、青蛙帽、睡帽；毛线球、围巾、铅笔、围裙）；不要金币、签到、亲密度等解锁系统。
- 审查结论：Captain 的正式画稿只有两张来源——「Captain 角色视觉标准」（柠檬帽，4 个状态，已在用）和 docs/brand/LD-captain-natural-yarn-original.png（不戴帽、抱毛线球，此前只用于品牌）。小花夹子、毛线帽、青蛙帽、睡帽、围巾、铅笔、围裙没有任何画稿。项目既有约定（V7.9 / V8.0，与用户确认过）：Captain 只用正式画稿，不用 SVG / CSS / 表情符号代画；我也没有生成 3D 画稿的手段。因此本版实现完整的装扮系统，并上架「有画稿的」两个造型；其余造型不做假图、不做灰色占位，等画稿。
- 改动文件：
  - 新增 tools/extract_captain_look.py 与素材 Resources/Keepers/LD-keeper-cat-yarn-happy.png（320×325，透明 PNG；不重画）。LD-keeper-LICENSE.txt 补充来源说明与「待画稿清单 + 规格」。
  - Resources/library.json：`keepers` 增加 `cat-yarn-happy`；新增 `keeperLooks`。Swift：`KeeperLook`、`AssetCatalog.keeperLooks`（未编译）。
  - Public/js/keeper-art.mjs：`keeperLooks()`。Public/app.js：`keeperLooksHTML()`、动作 `keeper-look`、面板视图 `looks`、面板头部「装扮 ›」链接、设置「角色与装扮」面板里的选择器。
  - Public/styles.css：V10.8 块。i18n：`look.*`。whats-new 10.8。
  - tests：新增 tests/v108.test.mjs（4 项）、tests/v108-browser.cjs（4 组）、`test:browser:v108`；v79.test.mjs 的素材清单加入新图片。
  - 文档：PRODUCT_SPEC / DESIGN_SYSTEM / ARCHITECTURE 的 V10.8 小节、README。
- 决策与原因：① 一次一个造型（现有画稿是整只 Captain 的成品图，帽子和配件无法叠加）；数据沿用已有的 `keeper.outfit`，不加新字段。② 选择器只列有图片的造型，说明文字如实写「更多画好后会出现」。③ 毛线球造型只有一张画：所有表情显示这一张，首页不探头而是坐着。④ 抠图在浅色纸面上干净；深色背景下脚边有极细的浅色残留（原图的地面投影），已写入许可说明。
- 运行 / 测试（Linux 容器 + Chromium；不是 iPhone 真机 / Safari）：Node 165、Python 16 通过；浏览器 E2E 全量 52 套全部通过（51 套旧 + v108）。v108 覆盖：面板轻入口尺寸、分组与只列有图造型、无锁定项、无游戏化字样、图片可加载；一点即换（面板 / 首页 / 书架 / 设置）、刷新后保留；设置里同一选择器、换回柠檬帽后首页恢复探头；不存在的造型回退柠檬帽；无外部请求。
- 发布：固定链接 https://claude.ai/artifact/VYUJ38K5TBqcZPB8VzJS7A （版本 70，V10.8）。截图一张（四个画面）已发给用户。
- 需要用户提供：小花夹子、毛线帽、青蛙帽、睡帽、围巾、铅笔、围裙的 Captain 画稿（每个至少「默认」姿势，透明或纯色背景、约 600px 高；最好还有开心 / 睡觉 / 探头，风格与比例同参考图）。放进 Resources/Keepers 并在 library.json 的 `keepers` / `keeperLooks` 各加一条即可上架，不需要改界面代码。
- 未做：Design 画布没有加入 Book Reader 两板（设计图已直接发给用户，方案在 docs/BOOK_READER_PLAN.md）；Book Reader 等待用户确认后再实现；iPhone 真机未验证。
- 下一步：等用户确认 Book Reader 的 7 个问题与装扮画稿；真机查看 V10.5–V10.8。

### 2026-11-11 — V10.7 离开 Journal Studio：完成手帐 / 保存草稿 / 继续编辑

- 需求：点左上角返回、准备离开编辑器时三选一（完成手帐并退出 / 保存草稿并退出 / 继续编辑）；区分 Saved（已存到本机）、Draft（没做完）、Completed（做完了）；自动保存保留；保存失败不显示成功、不直接退出；草稿可在 My Books 等列表找到，带低调的「草稿」标签，重新进入恢复内容与编辑状态；先确认 Draft / Completed 属于整条记录还是当前编辑对象，不能把单张封面当成独立完成的手帐；面板用 Little Days 风格，文案「要先收好这一页吗？」，不用吓人的「放弃修改」；切换封面 / 内页、选文字、开工具不触发；右上角「完成」与面板里的「完成手帐」逻辑一致。
- 审查结论与方案：见 docs/ARCHITECTURE.md「V10.7」。状态属于「一天」这条完整记录（封面 + 所有内页）；新增可选字段 `Entry.status`；编辑中的自动保存副本（`drafts[date]`）不变，离开时无论完成还是草稿都只留一份（写入 `entries`）。
- 改动文件：
  - Public/js/model.mjs：`saveEntry(state, entry, status)`、`entryStatus()`、`normalizeState` 清理非法状态。
  - Public/app.js：`studio-back` 重写（先写完自动保存；空记录 / 未改动的已完成记录直接离开；从「今日故事」编辑页返回不询问；其余打开面板）、`openExitSheet()`、`studio-draft-exit`、`draft-continue`、`leaveStudio()`、`editorStatus()`、`editorHasNothing()`、`studioTouched`、`rememberDraftPage()` / `draftPageFor()`、`draftTagHTML()`；`save-entry` 改为显式写 `completed` 并先关闭面板；顶部状态两行（已保存 + 草稿 / 已完成）。
  - Public/js/day-view.mjs：草稿提示条（标签 + 继续编辑）。
  - Public/styles.css：V10.7 块。i18n：`status.*`、`exit.*`，改写 `day.draftOnly` / `day.draftPending`。whats-new 10.7。
  - Swift：`JournalEntry.status`、`isDraft`；CoreTests 断言（未编译）。
  - tests：新增 tests/v107-browser.cjs（10 组）与 `test:browser:v107`；signed-in.cjs 新增 `leaveStudio()`（旧用例离开编辑器时遇到面板就选「保存草稿」，等同以前的行为），`goTab` / `menu` 改用它；v33（快照取在离开编辑器之后）、v54（用 `leaveStudio`）适配。
  - 文档：ARCHITECTURE / DESIGN_SYSTEM / PRODUCT_SPEC 的 V10.7 小节、STUDIO_UX_PLAN、README。
- 决策与原因：① 「完成手帐」直接复用右上角「完成」的同一个动作，保证两处结果永远一致；完成后的去向保持原样（先看到刚收好的这一页；从阅读页进入的回到原位置）——这与需求里「返回之前的页面」的字面不完全相同，已在回复里向用户说明，等阅读器改版时一并定去向。② 只在「有东西要决定」时询问：空记录、未改动的已完成记录不问。③ 保存失败时不离开；只有保存确实不可用、再次返回时才出现原有的离开确认，避免把人困在编辑器里。④ 草稿页码记在 localStorage，不进手帐数据。
- 影响旧数据：以前用返回离开、从未点「完成」的日子（只在 `drafts` 里）现在显示「草稿」标签。数据本身没有迁移或改动。
- 运行 / 测试（Linux 容器 + Chromium 触屏模拟；不是 iPhone 真机 / Safari）：Node 161、Python 16 通过；浏览器 E2E 全量 51 套全部通过（50 套旧 + v107）。v107 覆盖：空页直接离开且不留空草稿；自动保存与「已保存 ≠ 草稿」；切页 / 工具 / 预览不询问；面板文案与三个选择、44px、无吓人字样；继续编辑 / × 后纸面与选中项不变；保存草稿后两页、文字格式、照片与文本框位置逐字段一致、状态 draft、只留一份；首页 / 书本列表 / 当天页面的草稿标签（刷新后仍在）；从草稿回到离开时的那一页并再次保存草稿；草稿 → 完成；已完成只看不问、改动后「完成」与面板「完成手帐」落点一致、完成 → 改动 → 再存草稿；保存失败时不提示成功、状态为保存失败、留在编辑器；375×667 英文面板不超出屏幕。
- 发布：固定链接 https://claude.ai/artifact/VYUJ38K5TBqcZPB8VzJS7A （版本 69，V10.7）。截图一张（四个画面）已发给用户。
- 已知问题 / 未做：没有单页级状态；没有草稿汇总列表；日历格子上没有草稿标记；iPhone 真机未验证；Swift 未编译。
- 下一步：Captain 轻装扮（V10.8）。

### 2026-11-11 — V10.6 Journal Studio 富文本：部分文字的加粗 / 斜体 / 下划线 / 删除线

- 需求：参考 iPhone 备忘录，增加 B / I / U / S；必须支持「只给选中的几个字」加格式、同一段文字混合格式；没有选区时尽量支持「接下来输入的字」；格式键放在现有字体 Bottom Sheet 里、显示启用状态、可组合、不丢选区、不遮挡、不新增常驻工具栏；先审查文字模型再开发；旧纯文本无损、保存刷新重编辑保留、预览一致、撤销重做、中英文、中文斜体兼容、粘贴净化、与 SwiftUI 数据含义一致；完成后提供一个真实可编辑的示例页。
- 审查结论与方案：见 docs/ARCHITECTURE.md「V10.6 富文本」。要点：此前全部是普通字符串 + 整段样式；方案是「文字不变 + 可选的范围表（marks）」，不改 schemaVersion。
- 改动文件：
  - 新增 Public/js/rich-text.mjs（纯函数）。
  - Public/js/canvas.mjs、day-view.mjs：标题 / 正文 / 文本框用 `richHTML` 渲染；scrapbook-layout.mjs 新增 `boundMarks()`。
  - Public/js/export.mjs：`wrapRich()`（无 marks 时等同原 `wrapText()`）。
  - Public/js/model.mjs：`tidyMarks()`（读取时清理 marks，不合法的丢弃）。
  - Public/app.js：文字工具加 `.type-marks`（打字条与「字体」面板）；`applyTypeMark()`、`richField()`、`selectionIn()` / `selectOffsets()`、`drawRich()`、`typedMarks()`、`inlineInput()` 改为读回 marks；`selectionchange` 记选区、`typingLook`（光标处的待用格式）、输入法 composition 处理、`paste` / `drop` 只收纯文本；`changeEditor()` 末尾 `reconcileMarks()`；`noteToLayout()` 把 marks 带到文本框；`addRichDemoPage()` 与更新记录里的「放一页格式示例」按钮。
  - 修掉的旧问题：在文本框里打空格 / 回车 / 方向键会被图层快捷键截走（空格丢失并弹出图层面板）——正在编辑文字时不再拦截。
  - Public/styles.css：V10.6 块（`.rt-*`、`.type-marks`、`.news-action`；打字条不再被第二行撑宽）。i18n：`type.marks`、`type.mark.*`、`type.markNotHere`、`rich.demoTitle`、`rich.demoAdded`。whats-new 10.6（带 `action: "rich-demo"`）。
  - Swift：Models.swift 新增 `TextMark`、`StickerLayer.marks`、`JournalEntry` / `JournalMoment` 的 `titleMarks` / `bodyMarks`（全部可选）；CoreTests 增加断言（未编译、未运行）。
  - tests：新增 tests/v106.test.mjs（8 项）、tests/v106-browser.cjs（9 组）、`test:browser:v106`。
  - 文档：ARCHITECTURE / DESIGN_SYSTEM / PRODUCT_SPEC 的 V10.6 小节、STUDIO_UX_PLAN 第 7 节、README。
- 关键决定与原因：① 范围表而不是「片段数组」——旧代码（搜索、摘要、Captain 的本机事实、导出、备份）继续读普通字符串，零迁移；偏移用 UTF-16，与 Swift 的 NSRange 同单位。② 继续用 `plaintext-only` 编辑而不是 `contenteditable=true` + execCommand——浏览器不会自己插入富文本结构，格式只来自我们自己的 span 和模型。③ 应用格式时按偏移重画并恢复选区，不依赖浏览器命令。④ 「接下来输入的格式」真实实现了（不是假装）：在下一次输入的差异范围上套用；输入法组合结束后才套用。⑤ 示例页只在用户点按钮时添加，是今天的一页普通页面（示例日是只读样例，不适合做「可编辑示例」）。
- 过程中发现并修掉：界面全局 `font-synthesis: none` 让没有粗体字形的字体「加粗」看不出来（计算样式是 700，但画面没变）——`.rt` 单独打开合成；文字条第二行变宽后把整页横向挤偏（旧测试 v54 抓到）——限制网格列宽、颜色条内部滚动。
- 运行 / 测试（Linux 容器 + Chromium 触屏模拟；不是 iPhone 真机 / Safari）：Node 161 项、Python 16 项通过；浏览器 E2E 全量 50 套全部通过（49 套旧 + v106），这一轮是在最后一处样式修改之后跑的。v106 覆盖：只选中「买电脑」加粗、选区与光标保留、按钮状态、组合与取消、混合选区；光标处开关格式后输入；合成的输入法事件；粘贴富文本只留文字且无外来标签；文本框（打字条 + 字体面板 44px 键、空格可输入）；撤销 / 重做；转为自由文字框保留格式；预览 = 编辑；保存的数据是「普通文字 + 范围」；刷新后阅读与再次编辑一致；导出 Canvas 有格式时墨迹更多、无格式时与原来完全一致；旧示例页没有 marks；更新记录里的示例页可编辑；375 宽文字条不溢出。
- 没法在这里验证的：iPhone / Safari / WKWebView 里点格式键是否保持选区（代码按 Chromium 行为 + 保存选区兜底写的）、真实中文输入法、软键盘弹出时文字条的位置（375×667 无键盘时文字条第二行本来就在屏幕下方，这是原有布局，未在本次处理）；Swift 未编译。
- 发布：固定链接 https://claude.ai/artifact/VYUJ38K5TBqcZPB8VzJS7A （版本 68，V10.6）。截图一张（四个画面）已发给用户。
- 同一提交还加入了 docs/BOOK_READER_PLAN.md（全屏阅读器设计，等待用户确认，未改 App）。
- 下一步：退出确认与草稿 / 完成状态（V10.7）。

### 2026-11-11 — V10.5 Captain 面板：发送、关闭与未发送文字

- 需求：用户实际使用时常把底部巨大的「关闭」当成「发送」。要求：去掉底部大关闭按钮，右上角低调的 ×，保留下滑关闭；明显的「发送」按钮（鼠尾草绿 + 向上箭头，紧邻输入框，空时禁用，发送中有处理状态，输入法选字时不误发）；保护未发送内容（关闭不丢、不自动发送、成功发送后才清空）；键盘不遮挡、可多行、换行不等于发送；不改美术、陪伴方式和本机回复逻辑；不接入 AI。
- 审查结论：用户描述的「底部大关闭 + 小小的『说』」是 V10.3 之前的旧聊天面板；V10.3 的新面板已经只有右上角 ×，但发送仍是 40px 的小圆箭头、回车直接发送、没有草稿、没有输入法保护、面板不能下拉关闭。本版补齐这些。
- 改动文件：
  - Public/app.js：`keeperLinesHTML()`、`syncKeeperComposer()`、`refreshKeeperChat()`（只更新对话和按钮，不重建面板，光标不丢）、`keeperUnsent()` / `keepKeeperUnsent()`（`little-days.keeperDraft`）、`keeperAnswer()` 拆成发送 + `keeperReply()`（0.42 秒「正在想」，期间 `keeperBusy` 挡住重复发送；面板已关则回应留在对话里、不重新弹出）；输入区改为 `textarea` + `.kp-send`，移到面板底部；回车 = 换行，⌘ / Ctrl + 回车发送，`isComposing` / keyCode 229 / compositionstart–end 期间一律不发送；触屏聚焦时 `.kp.composing`（快捷操作让开，350ms 后恢复）；`--kb`（键盘高度）；`#choose-dialog` 的下拉关闭（`sheetPull`，70px 阈值）；发送时保留光标（只拦 mousedown 默认行为）。
  - Public/styles.css：V10.5 块。i18n：`kp.send` / `kp.sending` / `kp.thinking`。whats-new 10.5。
  - tests：新增 tests/v105-browser.cjs（7 组）与 `test:browser:v105`；v71、v103 改为点发送按钮（v103 的等待加上「正在想」气泡）。
  - 文档：DESIGN_SYSTEM / PRODUCT_SPEC 的 V10.5 小节、README。
- 过程中发现并修掉的两个真实问题：① 快捷操作的显示隐藏原来跟着 `:focus` 走，点 × 的一瞬间面板变形、点击落到别的按钮上（多行输入后点 × 关不掉）——改为延迟恢复的 `.composing`；② 为保留光标拦截了发送按钮的 touchstart，结果连点击也被拦掉——改为只拦 mousedown。
- 决策与原因：回车换行而不是发送（手机键盘的回车最容易误触，也满足多行）；草稿放 localStorage 而不是手帐数据（不进备份、不触发手帐保存，刷新后仍在）；保存后「听听 Captain 怎么说」的回应面板底部的「谢谢」按钮保留——那里没有输入框，不存在与发送混淆。
- 运行 / 测试（Linux 容器 + Chromium 触屏模拟；不是 iPhone 真机 / Safari）：Node 153、Python 16 通过；浏览器 E2E 全量 49 套全部通过（48 套旧 + v105）。全量回归后只改了一处按钮文字颜色（纯样式），之后重跑 v105 通过。v105 覆盖：只有一个 ×（位置、44px 触摸区）、没有整行关闭；发送按钮位置 / 尺寸 / 颜色 / 禁用；回车换行、输入框长高上限、⌘/Ctrl+回车发送、气泡保留换行；合成的输入法事件期间不发送；发送中状态与防重复、发送后光标仍在输入框；× / 下拉 / Esc / 刷新后草稿仍在且未发送、短距离下拉不关闭；触屏打字时快捷操作隐藏、输入区在视口内、× 一次关闭；375×667 与 430×932 英文不溢出；无外部请求、`aiConsent` 为 false。
- 没法在这里验证的：真实软键盘弹出时面板的位置（无头 Chromium 没有软键盘，`--kb` 的逻辑未被实际触发）、真实中文输入法（只用合成的 composition 事件）。
- 发布：固定链接 https://claude.ai/artifact/VYUJ38K5TBqcZPB8VzJS7A （版本 67，V10.5；上传 app.js、styles.css、themes.css、js/whats-new.mjs、shared/i18n.json）。截图一张（四个画面）已发给用户。
- 下一步：富文本格式（V10.6）。

### 2026-11-11 — V10.4 Settings V2（My Little Days · 本机个人空间）

- 需求：用户同意 docs/SETTINGS_V2_PLAN.md 的四项修改（「退出登录」改为「回到欢迎页（数据保留）」且只在实验室登录页开启时显示；默认头像用名字首字的圆形纸片、已有头像保留；Keeper 细项收进「角色与装扮」；更新记录 / 许可证 / 示例内容 / 实验室改为二级页），并要求把顶部账号区域重新设计为「My Little Days · 本机个人空间」、减少大型卡片堆叠（Tactile Stationery × Cozy Editorial）。顺序在 Captain 无 AI 互动（V10.3）之后。
- 改动文件：
  - Public/app.js：新增 `settingsPageHTML()`（返回栏、个人资料、Little Keeper、外观与偏好、数据与隐私、关于与更多、页尾）、`settingsSheetHTML(kind)`（profile / keeper / privacy / licenses / samples / testlog / labs）、`openSettingsSheet()`；新动作 `settings-sheet`、`profile-avatar`、`profile-save`；`whats-new` 点开即记为已读；`tour-replay` 先关面板；删除不再使用的 `themePickerHTML` / `keeperSettingsHTML` / `newsSectionHTML` / `reminderSectionHTML` / `privacySectionHTML` / `labsCardHTML`。所有原有 `data-action`（theme、language、reminder-toggle、backup、restore-backup、lock-toggle、privacy-toggle、keeper-set / keeper-toggle / keeper-disable / keeper-onboard、samples-remove、export-events、labs-toggle、sign-out、tour-replay、settings-back）不变。
  - Public/js/personal-ui.mjs：删除旧的 `settingsHTML()`（已无引用）。
  - Public/styles.css：追加 V10.4 块（`.s2*`、`.s2-sheet`）；tokens / themes 重新生成。
  - Resources/i18n.json：33 个 `s2.*` 键；`login.signOutConfirm` 改为「回到欢迎页？这不是退出账号——Little Days 没有云端账号…」。Public/js/whats-new.mjs：10.4。
  - tests：新增 tests/v104-browser.cjs（8 组）与 `test:browser:v104`；signed-in.cjs 新增 `settingsSheet(page, kind)` / `closeSheet(page)`；迁移 v38（深色主题取 `.s2-avatar`）、v52（更新记录行 + 小红点、实验室和测试记录在面板里、无实验室时没有「回到欢迎页」）、v54（示例内容面板）、v63（隐私说明面板）、v65（许可证面板）、v70（提醒文案）、v71（「翻看以前的页面」在角色与装扮里）。
  - 文档：docs/SETTINGS_V2_PLAN.md 第 8 节（用户决定、实施状态、与设计稿的差别）、DESIGN_SYSTEM / PRODUCT_SPEC 的 V10.4 小节、README。
- 决策与原因：二级页统一用 Bottom Sheet（内容短、关闭后保留滚动位置，且与 Captain 面板同一套样式）；数据不动——「账号」仍是 `little-days.account` 这一条本机记录，默认头像沿用旧的占位值 `🌷`（显示时换成首字），所以旧数据不需要迁移，用户选过的头像原样显示；「本机存储」显示真实的媒体用量而不是设计稿里的示意数字；AI 行保留但禁用，`aiConsent` 无法被打开；「功能介绍」直接重播，不另开面板。
- 运行 / 测试（Linux 容器 + Chromium 触屏模拟；不是 iPhone 真机 / Safari）：Node 153 项、Python 16 项通过；浏览器 E2E 全量 48 套全部通过（47 套旧 + v104）。发布前追加了一处纯样式修改（「角色与装扮」里名字输入框改为整行宽），之后把 Node、Python 和浏览器 48 套又完整跑了一遍，全部通过。v104 覆盖：个人空间文案（没有云端账号、没有「退出登录」字样）、默认首字头像、改名和换头像（刷新后保留、手帐不变）、Keeper 邀请 / 预览 / 陪伴方式 / 细项在面板、色板选择刷新后保留、语言切换不翻译用户名字和 Keeper 名字、数据与隐私各行（AI 行禁用且 `aiConsent` 为 false）、各二级面板、更新记录读后红点消失、最后一行不被底部导航遮挡且 ≥ 44px、「回到欢迎页」仅实验室开启时出现且不删除任何数据、375×667 与 430×932 中英文无横向溢出、无外部网络请求、无页面错误。
- 实测：393 宽时设置页整页 4883px → 2208px。真实截图：新旧整页对比 + 8 个画面（首屏、页底、编辑资料、保存后、角色与装扮、隐私说明、English、375×667），已发给用户。
- 发布：固定链接 https://claude.ai/artifact/VYUJ38K5TBqcZPB8VzJS7A （版本 66，V10.4；上传 app.js、styles.css、themes.css、js/personal-ui.mjs、js/whats-new.mjs、shared/i18n.json）。
- 已知问题 / 未做：未在 iPhone 真机 / Safari 验证；Swift 外壳只做了文件同步，未编译；头像只能从内置的一组里选，不能上传照片；没有真实账号、登录或同步（界面已如实说明）；Design 画布上的 Settings V2 一板仍是设计稿，没有换成实现后的截图。
- 下一步：等用户在固定链接 / 真机上查看 V10.0–V10.4。AI 相关（本地 Qwen / Ollama 评测、正式接入）按用户决定暂缓，只保留 docs/keeper-eval/ 的测试准备；Calendar Phase 2、My Books Phase 3 等待用户安排。

### 2026-11-11 — V10.3 Captain 的无 AI 互动优化（Keeper Step 1）

- 需求：用户批准 Keeper Step 1 立即开发——按状态和页面事件选择自然回复；去掉固定、奇怪的动作后缀和重复问候；本机简单聊天识别；首页点击 Captain 和「找 Captain」快捷入口；Captain 互动面板；两条不用 AI 的真实流程。只有 Captain，不开发其他 Keeper。Step 2（真实 Qwen 测试）和 Step 3（正式接入）暂缓：等用户买了 MacBook 后先研究本机 Ollama / Qwen；现在不开通阿里云 API、不定地域、不做收费调用，正式 App 不加 API Key、云服务或任何真实 AI 调用，但保留替换 Provider 的扩展能力；可先准备合成测试集和评测标准。
- 改动文件：
  - Public/js/keeper.mjs：新增 `dayFacts()`（今天几页 / 几张照片 / 最后一页标题 / 距上次记录几天 / 是否深夜，不读正文）、`LINE_COUNTS`、`contextLine()`（按情况选句、避开最近用过的）、`localIntent()`（整理 / 回忆 / 这周 / 书架 / 代写 / 问候 / 道谢 / 累或难过 / 其余 unknown）、`pickMemory()`（只取用户自己的旧页面）；`localFeedback()` 在正文没有情绪信号时改说这一页的事实，去掉固定第三句和动作后缀（`tone` 恒为空）；`modeAllows("memories")` 从「仅互动」改为「非安静 + 用户同意」。`createFeedbackService({ remote })` 不变（`remote = null`）。
  - Public/app.js：`openKeeperPanel()`（首页 / 整理 / 回忆三个视图，取代旧聊天面板）、`keeperOrganizeHTML()`、`keeperMemoryHTML()`、`keeperSay()` + 本机最近用句记录（`little-days.keeperLines`，7 天）、`keeperAnswer()` 改用意图识别；`keeperPerchHTML()` 增加 `.keeper-entry`「找 Captain」；点击 Captain（温柔 / 互动）打开面板；新动作 `keeper-panel` / `keeper-view` / `keeper-do` / `keeper-memory-next` / `keeper-allow-memories`；书架提示改用 `contextLine("shelf")`；保存后回应传入页面事实并不再显示动作括号。
  - Resources/i18n.json：`kc.*` 54 句 × 中英文 + `kp.*` 面板文案 33 条。Public/styles.css：V10.3 块。whats-new 10.3。
  - tests：新增 tests/v103.test.mjs（7 项）、tests/v103-browser.cjs（5 组）、`test:browser:v103`；更新 v71（点击打开面板、回忆先询问、不会的如实说）、v77（两句回应、无动作后缀）。
  - 文档：docs/KEEPER_AI_PLAN.md 第 10 节（用户决定与实施状态）、docs/keeper-eval/（14 条合成用例 + 评分标准 + 将来用 Ollama 的跑法；未做任何调用）、DESIGN_SYSTEM / PRODUCT_SPEC 的 V10.3 小节、README。
- 决策与原因：先用本机事实解决「不知道今天发生了什么」；句子按情况分组（今天没写 / 深夜 / 隔了几天 / 第一次 / 一页 / 多页 / 照片多…），所以不会在已写之后再问「今天有什么想记录的吗」；最近用句记在本机而不是手帐数据里，避免每点一次都写一次日记存储；聊天不假装理解——不会的直说并列出会的事；「帮我写一句话」保留在面板里但如实标为需要 AI、尚未开放（不做假的代写）；回忆许可改成在面板里当场询问一次（原来藏在设置里且仅限互动方式，默认用户永远用不到）。
- 运行 / 测试（Linux 容器 + Chromium 触屏模拟；不是 iPhone 真机 / Safari）：Node 153 项、Python 16 项通过；浏览器 E2E 全量 47 套全部通过（46 套旧 + v103）。v103 覆盖：标签位置与 44px 点击区、标签和点击打开同一面板、连续三次打开三句不同且都知道今天有一页、聊天四种输入得到四种不同回答、整理今天不改数据且可打开页面、回忆先询问 → 示例日不算 → 找到自己的旧页并打开、安静模式无标签无面板、全程没有任何发往本机以外的请求、`aiConsent` 仍为 false。
- 真实截图：393×852 八个画面（入口、面板、聊天、整理、回忆询问、回忆页、代写说明、点击打开），汇总图已发给用户。
- 发布：固定链接 https://claude.ai/artifact/VYUJ38K5TBqcZPB8VzJS7A （版本 65，V10.3；上传 app.js、styles.css、themes.css、js/keeper.mjs、js/whats-new.mjs、shared/i18n.json）。
- 已知问题 / 未做：未在 iPhone 真机验证；聊天的意图识别只是关键词规则，覆盖有限；「整理今天」只展示、不提供一键重排；保存后回应的情绪判断仍是原来的关键词规则；Bunny / Westie 未开发（用户确认目前只做 Captain）。
- 下一步：Settings V2（用户已同意四项修改），随后等用户真机查看；AI 相关只保留测试准备。

### 2026-11-11 — 评估与设计（不改 App 代码、不接入模型）：Little Keeper 互动审查 + AI 小管家方案 + Settings V2

- 需求（三份合在一轮）：① Keeper 互动「鸡肋」——回复重复、缺上下文、问候时机不自然；要求先审查现有文案与触发，设计三层陪伴（Natural / Contextual / AI），评估 Qwen API（架构、中英文、性格 Prompt、延迟与成本、上下文、Key 安全、隐私、离线降级、可换供应商），做 Captain 三个场景的固定 vs AI 对比；不要立即接入模型。② 增加「找小管家 / Ask Keeper」快捷入口和 My Little Keeper 快捷面板（四个推荐操作），不加 Tab、不做悬浮按钮、不动首页 Hero；明确何时预设 / 何时 AI / 发送什么 / 授权 / 失败 / 成本。③ Settings V2：重新设计视觉与信息架构（个人资料区、Keeper 预览、外观与偏好、数据与隐私、次要设置下移），核实「退出登录」的真实行为，给出功能映射；先不改代码。
- 做法：读代码审查 Keeper（keeper.mjs 的 `todayPrompt` / `localFeedback` / `localChat`，app.js 的 `keeper-tap` / `keeperAnswer` / 书架提示，i18n 的 75 条 keeper.* 文案）和 account.mjs / 启动逻辑；用 Playwright 在真实 App 上运行时注入原型（首页入口 + 面板 8 个画面；Settings V2 整页），截图；网络检索 Qwen 的接入方式和价格（二手来源有出入，文档中标明需以官方价目为准）。没有调用任何模型，没有发送任何手帐内容。
- 审查发现（详见 docs/KEEPER_AI_PLAN.md 第 1 节）：点击只有 4 句按次数轮换且不看状态；互动模式里打字无论输入什么都回同一句「嗯，我听到了…」；保存后的回应是关键词正则 + 三段拼接 + 固定动作后缀；书架提示在都有标签时仍建议加标签；按时间的问候与首页问候重复。App 里目前只有 Captain，Bunny / Westie 美术未接入。
- 审查发现（Settings）：「退出登录」只把本机记录的 `signedIn` 改成 false，不删数据；实验室关闭的普通安装启动时会自动重新登录，所以这个按钮对普通用户没有实际作用——不是真实登录系统，现有字样有误导。
- 产出：
  - docs/KEEPER_AI_PLAN.md：审查表、三层陪伴、预设 / AI 判定表、入口与面板、四个流程、Captain 三场景对比（AI 一栏为示意文案）、三只角色语气与提示词骨架、Qwen 可行性（端点、档位、单次与月度成本估算、延迟预期、上下文、成本控制）、架构（后端代理 + ModelProvider 接口，Key 只在后端）、隐私与授权、与现有系统的整合、建议实施顺序、来源链接。
  - docs/SETTINGS_V2_PLAN.md：现状问题、退出登录核实结论、新信息架构、逐项功能映射（12 张旧卡片的每个控件 → 新位置）、规范、可行性、4 个待确认问题。
  - Design 画布（版本 25）新增两板：「Little Keeper 快捷面板与四个流程」「Settings V2 · 现在 vs 新设计」；两张图也直接发给了用户。
- 关键设计决定与原因：先用不需要 AI 的第 ② 层（按真实事件和状态选句）解决「不知道今天发生了什么」，AI 只放在用户主动且明确授权的三件事上（整理今天、讲讲这一页、代写）；点一下角色永不调用 AI；AI 是独立开关，开启 Keeper 不等于开启 AI；每次发送页面内容前显示「会发送 / 不会发送」；生成内容只是建议、先预览再写入；Key 只在自建后端代理，接口按 OpenAI 兼容格式抽象以便换供应商。Settings 用分组标题 + 发丝线代替 12 张大卡片，整页约 4900px → 约 1950px，开发 / 测试类入口下移到「关于与更多」。
- 如实说明：Qwen 的延迟、中英文质量没有实测（没有 Key，也不应在确认前调用）；价格来自二手来源且互有出入；阿里云的数据保留与训练条款未核实；claude.ai 固定链接对外网请求有限制，AI 功能在那里很可能只能走本机降级；原型中的存储大小、天数等数值是示意。
- 未改动：Public/、Native/、Packages/、tests/ 均未修改；在线链接仍是 V10.2（版本 64）；没有跑回归（没有代码变化）。
- 待用户确认：Keeper——实施顺序（先修互动、再评测、再接入）、云账号与地域、每日限额与月度预算、默认模型档位；Settings——docs/SETTINGS_V2_PLAN.md 第 7 节 4 个问题。

### 2026-11-11 — V10.2 首页滚动体验实现（用户称 Home V9.1；Create → Remember → Collect）

- 需求：用户确认设计方向并回答四个问题——① 段落标题跟随 App 语言（中文「今天的故事 / 我的手帐」，英文 Today's Story / My Library；中文不用缺字形的英文字体）；② 待办默认收起并记住展开 / 收起，有未完成事项也不强制展开，收起时显示摘要，不丢数据；③ 「共同的书」切换移到书架页，不删功能；④ 今天没记录 = 空状态 + 「最近的故事 · 日期」（真实的最近一篇，没有历史只显示空状态）。另外要求：Today's Story 把同一天多个 Moments 自动组合成一张预览，但保留每个 Moment 的原始内容、时间和所属手帐本，不修改或覆盖数据；显示「收藏于 · 书名」；纯文字像日记纸；375 / 430、中英文、长文字可读；My Library 突出最近在写的一本；顶部 Direction A 不动；不扩大到 Studio / Calendar。
- 改动文件：
  - Public/app.js：新增 `storyPagesOf()`（一天的页面 → 展示数据，只读）、`storyCardHTML()`（主故事 + 全天照片 + 媒体标记 + 「收藏于」+ 其他页面各一行；隐私隐藏、示例标记、「最近的故事」变体）、`recentStoryEntry()`、`todayStoryHTML()`、`sectionTitleHTML()`、`bookLastWritten()`、`homeLibraryHTML()`；`todayListHTML()` 改为一行可折叠的「今天的小计划」（`plansOpen()` / `togglePlans()`，本机键 `little-days.homePlans`，动作 `plans-toggle`，不重绘、不改数据）；`home()` 改用以上函数。删除 `todayPeekHTML()`（每张照片一屏的轮播）及其滚动监听；首页不再渲染「我的书 / 共同的书」切换（书架页的 `shelf-switch` 不变）。
  - Public/styles.css：追加 V10.2 块（`.hs-*`、`.ts-*`、`.qu*`、`.lib*`、页尾）；顶部只加了一处溢出修复（次入口小字过长时省略）。tokens / themes 重新生成。
  - Resources/i18n.json：31 个新键（ts.*、qu.*、lib.*）。Public/js/whats-new.mjs：10.2。
  - tests：新增 tests/v102-browser.cjs（6 组）与 `test:browser:v102`；signed-in.cjs 新增 `openPlans`，`touchStore` / `openHabits` / `goTab("growth")` 先展开；迁移 v41、v45、v47、v54、v63、v65、v66、v68。
  - 文档：docs/DESIGN_SYSTEM.md、docs/PRODUCT_SPEC.md（V10.2 小节）、docs/HOME_SCROLL_PLAN.md（第 7 节：用户决定、实现与设计稿差异）；删除 docs/prototypes/home-scroll/（原型已被正式实现取代）；README。
- 决策与原因：
  - 多页合并只在渲染时计算，不写任何数据；v102 用「查看前后该日 JSON 完全相同」来保证。
  - 主故事 = 内容最多的一页（照片数 ×2 + 有感想 + 有标题，相同取较晚），照片取自全天各页——比设计稿的「最新一页」更符合「把多个 Moments 组合」。
  - 中文段落标题用系统黑体（与顶部「照片手帐」一致），没有用宋体：项目已确认中文标题用无衬线，旧样式表也强制标题用 `--ui-sans`；只为两个标题换字体会破坏统一。英文用 `LD-elegant` 斜体。
  - 「最近的故事」和书本「更新时间」都排除示例日（`isDemo`），不拿示例冒充用户内容；今天是示例日时仍显示但标「示例」。
  - 首页只留一个「接着记一页」（最近在写的那本），其余书点封面进入；记录面板里仍可改选其他手帐。
  - 小封面用 CSS `zoom` 缩放用户自己的封面（封面内部字号是固定像素），不另画一套小封面。
- 运行 / 测试（Linux 容器 + Chromium 触屏模拟；不是 iPhone 真机 / Safari / Xcode，Swift 未编译）：Node 146 项、Python 16 项通过；浏览器 E2E 全量 46 套全部通过（45 套旧 + v102）。v102 覆盖：三页分属三本手帐的一天（主故事、全天照片、+N、声音标记、收藏于、每页一行带各自时间和手帐、各自可打开、数据前后完全一致）；纯文字（字号 ≥ 22 / 15、长文折叠、可进全文）；空状态 + 最近的故事（3 天前、可打开原文）与「只有示例日 → 只显示空状态」；小计划默认收起、展开 / 收起跨刷新和跨页面记住、三条待办不丢、收起高度 ≤ 60px；我的手帐（最近写的在前、唯一的记一页、封面进真实手帐、首页无切换、书架页有切换）；英文标题与字体、用户内容不翻译、375 和 430 无横向溢出。全量回归通过后只改了两处 CSS（顶部小字改为省略而不是换行、空状态链接居中），之后重跑了 v102、v45、v47、browser 四套，均通过。
- 真实截图：393×852 整页 + 四个滚动位置；375×667、430×932 各四个滚动位置；英文 393 / 375；1 张 / 2 张 / 多页 / 纯文字 / 空 + 最近 / 仅空状态；小计划收起 / 展开。三张汇总图已发给用户。
- 发布：固定链接 https://claude.ai/artifact/VYUJ38K5TBqcZPB8VzJS7A （版本 64，V10.2；上传 app.js、styles.css、themes.css、js/whats-new.mjs、shared/i18n.json）。
- 发现并修复：英文界面 375px 下顶部「More ways」下面的小字把页面撑宽 29px（原有问题）；测试数据里音频图层缺 `text` 字段导致启动校验失败（只是测试数据，App 校验按预期工作）。
- 已知问题 / 未做：未在 iPhone 真机 / Safari / WKWebView 验证；未用真实相册的极端比例照片测试；纯文字卡片标题多行时与横线不是逐行对齐；5 张以上照片仍是「3 张 + N」而没有单独版式；Journal Studio 后续与 Calendar Phase 2 按用户要求不在本轮范围。
- 下一步：等用户真机查看；再按用户安排继续 Calendar Phase 2 或 Studio 的页面管理 / 页面信息样式。

### 2026-11-11 — 设计探索（不改 App 代码）：Home Scroll Experience（Create → Remember → Collect）

- 需求：用户认为首页顶部 Direction A 已成功，但往下滑审美下降——「今天的回忆」像博客文章卡片，待办和习惯让首页像任务管理 App，书架像电商商品列表。要求顶部不动，重做中下部，形成 Create → Remember → Collect 的连续体验；本轮先出设计（完整长页、至少三个连续滚动位置的真实 iPhone 尺寸预览、新旧对比、变化说明、Web 与 SwiftUI 可行性），确认前不做大规模代码修改。用户说附了三张截图，但这条消息里没有收到图片，按线上 V10.1 首页为准。
- 做法：不改 `Public/`。先用 Playwright 在真实首页里造一份真实内容（今天两页手帐、两件待办、开启 Captain），再在运行时注入原型样式和脚本（docs/prototypes/home-scroll/），把真实首页已渲染的今天页面、待办列表、用户自己的手帐封面重排成新结构，然后截图。这样顶部是真实的 Direction A，底部导航、字体、滚动都是真实浏览器里的效果。
- 产出：
  - Design 画布 https://claude.ai/artifact/4tXVQfHSSPvQxJZqJFPTUG（版本 24）新增一行 4 张板：整页新旧对比、四个连续滚动位置（393×852）、三个区域的新旧对比、变体（1 / 2 / 3+ 张照片、长标题、含视频声音、只有文字、空状态、待办展开、只有一本手帐、375×667、430×932、英文）。四张图也直接发给了用户。
  - docs/HOME_SCROLL_PLAN.md：结构对照、Today's Story 规则、功能去向表、滚动检查结果、可行性、4 个待确认问题。
  - docs/prototypes/home-scroll/：原型 CSS + 注入脚本 + 说明（不是产品代码）。
- 关键设计决定与原因：今天的回忆从「每张照片一屏的轮播」改为「一页排好版的纸」（主图 + 小图 + 标题 + 两行感想 + 页码），其余页面各一行——让真实手帐成为全页最大的视觉；待办与习惯压成两条发丝线之间的一行、点开才是便签——功能全留但不抢重心；书架改成一层搁板，最近在记的一本放大并带书脊和厚度，其余缩小、只留封面和名字，只有一处「接着记一页」——去掉商品卡片感；下半页不再出现第二个实心按钮，段落标题与顶部 kicker 用同一套字体层级。
- 检查（Linux 容器 + Chromium 触屏模拟，原型）：三种屏幕宽度无横向溢出；英文文案不溢出；整页高度 1875px（现 1914px）。未验证 iPhone 真机 / Safari / WKWebView，未用真实相册照片。
- 未改动：Public/、Native/、Packages/、tests/ 均未修改；在线链接仍是 V10.1（版本 63）；没有跑回归（没有代码变化）。
- 待用户确认：docs/HOME_SCROLL_PLAN.md 第 6 节 4 个问题（英文段落标题、待办默认收起、「共同的书」移到书架页、无记录时是否显示最近的故事）。确认后再实施并迁移相关测试（估计 6–8 套）。

### 2026-11-11 — V10.1 Journal Studio Phase B：选中对象的上下文工具

- 需求（用户「正式开发确认」的 Phase B）：照片 / 文字 / 贴纸的专属工具、直接编辑文字、拖动 / 缩放 / 裁剪、图层和对象操作，只显示与当前选中对象相关的工具；「照片+一句」「随手写」的标题和正文可改文字、字体、字号、颜色、对齐，位置保持自动排版；提供「转换为自由文字框」，保留文字、字体和样式，不重复、不丢数据。
- 改动文件：
  - Public/app.js：`ctxDockHTML()`——有选中对象时底部一排换成该对象的工具（× + 对象名 | 专属工具 | 图层 | 删除），`toolMenuHTML()` 据此切换；`layerBarHTML()` / `placeLayerBar()` 置空（黑色浮动菜单取消）；新动作 `layer-deselect`、`ctx-crop`、`text-style`（字体 / 颜色 / 对齐，同一个小面板 `textstyle`，再点收起）、`ctx-edit-text`（`editTextLayer()` 在纸上打字）、`text-to-box`；`typeControlsHTML()` 统一打字工具条与文字面板的控件，点击处理从 `#type-bar` 扩到 `.type-controls`（面板里作用于选中的文字框），新增对齐（`data-type-align`，打字条里是一个循环按钮）；`syncTypeBar()` 同步两处的选中状态并决定「转为自由文字框」是否出现；`noteToLayout()` 转换时带上字体（标题用页面字体、正文用 `bodyFont`）、字号、颜色、对齐；图层面板加「复制」「置顶」。`leaveTyping` 的点击判断忽略刚获得焦点 600ms 内的那次点击。
  - Public/js/canvas.mjs：`alignCSS()`，`textCSS()` / `styleExtra()` 输出 `text-align`（仅当 `align` 是 left / center / right）。Public/js/export.mjs：`alignIn()`，照片+一句、随手写 / 封面、智能排版说明三处导出按所选对齐绘制。
  - Packages/LittleDaysCore：`JournalTextStyle.align`（可选）+ CoreTests 往返断言。
  - Public/styles.css（追加 V10.1 块）、i18n.json（ctx.*、type.align.*、type.toBox，`layer.barHint` 改写）、whats-new 10.1。
  - tests：新增 tests/v101-browser.cjs（8 组）、tests/v101.test.mjs（2 项）、`test:browser:v101`；signed-in.cjs 的 `studioTool` 适配上下文工具栏、新增 `studioDeselect`；v38、v39、v41、v51、v64、v100 改为从底部工具栏 / 图层面板操作。
  - 文档：docs/DESIGN_SYSTEM.md、docs/PRODUCT_SPEC.md（V10.1 小节）、docs/STUDIO_UX_PLAN.md（实现状态与未做项）、README。
- 决策与原因：
  - 复制与层级顺序只放在「图层」面板，底部一排不重复，保证每个动作在页面上只有一个入口。
  - 标题 / 正文的对齐用可选字段 `textStyle.align` / `bodyStyle.align`，旧数据没有该字段时屏幕与导出都不变（保持兼容）。
  - 「转为自由文字框」复用已有的「自由排版」转换路径（一步撤销可恢复），只补上样式继承，不另造一套数据。
  - 打字工具条保持两行（对齐做成一个循环按钮），避免在键盘上方占太多高度。
- 回归中发现并修复的真实问题：① 选中对象的工具栏在手机打字时没有隐藏（CSS 优先级）；② 在面板里点输入框（如页面信息的名字）时，面板上移导致同一次点击落到别处、被当成「点别处」而失去焦点（V9.2 引入的隐患）——现在忽略刚聚焦后的那次点击；③ 打字条里的「转为自由文字框」与「更多」里的写法按钮同名动作冲突——改为独立动作 `text-to-box`。
- 运行 / 测试（Linux 容器 + Chromium；不是 iPhone 真机 / Xcode，Swift 未编译）：Node 146 项、Python 16 项通过；浏览器 E2E 全量 45 套全部通过（43 套旧 + v100 + v101；第一轮 42 通过、3 套因本次改动失败，修复后整体重跑 45/45）。真实截图（393×852，2x）12 张 + 与设计稿对照图已发给用户。
- 发布：固定链接 https://claude.ai/artifact/VYUJ38K5TBqcZPB8VzJS7A （版本 63，V10.1；上传 app.js、styles.css、themes.css、js/canvas.mjs、js/export.mjs、js/whats-new.mjs、shared/i18n.json）。
- 已知问题 / 与设计稿的差异：字体是 Bottom Sheet + A− / A+（设计稿为字体条 + 字号滑杆）；裁切仍是滑杆面板；贴纸没有「替换」；页面管理 / 页面信息仍是旧样式；刚加入的照片 / 贴纸处于选中状态，要点 × 或点空白处才回到四个工具；未在 iPhone 真机 / Xcode 验证。
- 下一步：等用户真机查看 V10.0 / V10.1；之后按用户安排做页面管理 / 页面信息的新样式，或继续 V9.0 Phase 2（Memory Calendar）。

### 2026-11-11 — V10.0 Journal Studio Phase A：编辑器外壳重构（用户「正式开发确认」）

- 需求：用户确认 Journal Studio 三状态方案（Creative Freedom Without Complexity），要求先做 Studio、Calendar Phase 2 顺延；按 Phase A（外壳）→ 回归 → Phase B（上下文工具）→ 回归推进。用户的决定：撤销 / 重做放纸张左下方、画布外、位置稳定、不可用时禁用、各类修改都进历史、切页后不能改到其他页面、顶部不放；「完成」= 保存成功并离开编辑、显示刚保存页的只读视图，编辑中自动存草稿，顶部显示 已保存 / 保存中 / 保存失败，失败留在编辑器可重试，不自动发布；Quick Create 标题 / 正文可改样式但不可拖，并提供「转换为自由文字框」（Phase B）；视觉沿用 Tactile Stationery × Cozy Editorial；每阶段交付真实截图、交互测试、与设计稿对照、完成 / 未完成清单、问题与修复；不得丢失现有手帐、图片、视频、音频、字体设置。
- 改动文件：
  - Public/app.js：`studioPage()` 重写为新外壳（`.studio-bar.sv-top`：返回 · `.sv-title` 页面名（`pages-manage`）· `#draft-status`（`draft-retry`）· 预览 · 完成；`.studio-stage`：纸 + `typeBarHTML()` + `.stage-bar`（撤销 / 重做 + `chapterChipsHTML()` 页面切换）；`#tool-menu`）；新增 `studioPreview` 预览模式（分享 / 导出图片 / 导出视频）；`toolMenuHTML()` 改为「面板 + 四个工具」，新增合成面板 `more`（`moreSheetHTML`：各工具格子、手绘、视频、音频菜单、页面音乐、目录、页面管理、页面信息、「换一种写法」）与 `details`（`detailsSheetHTML`：日期 `#editor-date` + `pageBarHTML()` + `writeCardHTML()`），非「更多 / 贴纸」面板带 ‹ 回到更多；`SV_ICONS` 线性图标。新动作：`first-photo`、`studio-preview`、`open-pages`、`pages-add`、`pages-details`、`draft-retry`。保存状态：`draftState` + `setDraftState()` + `retryDraft()`；`scheduleDraft` → saving，`flushDraft` → saved，出错 → failed；`save-entry` 用 try/catch，失败不离开；`studio-back` 在草稿存不下时先询问；IndexedDB 写入失败（`onPersistError`）也标记失败。撤销按页面隔离：`selectMoment(id, keepStep)` 切页清空历史（删除页面 / 清空封面保留这一步），`resetHistory()` 用于刚建好的页面；`placeLayerBar()` 把浮动菜单限制在纸内。从「更多」启动动作（手绘、视频、页面管理、上传音频、背景音乐、换写法）后面板自动收起。纸面空白提示改为「添加第一张照片」。不再渲染：顶部日期、Keeper 小图标、悬浮保存、纸下一排添加 / 背景按钮、放大预览按钮、studio-footer（功能都有新位置）。
  - Public/js/canvas.mjs：空白纸提示只渲染传入的 `addChoices`。
  - Public/styles.css（追加 V10.0 块）+ tokens/themes 重新生成；`.phone.sv` 作用域，`--studio-h` 由 render 写入。
  - Resources/i18n.json：27 个新键（draft.*、studio.*、tool.more / details、more.*、canvas.first*、sv.text 等）。
  - Public/js/whats-new.mjs：10.0。
  - tests：新增 tests/v100-browser.cjs（9 组）与 `test:browser:v100`；tests/signed-in.cjs 新增 `studioTool / studioMore / studioDetails / studioMode / studioMoreAction / studioPreview / studioEdit / studioClose / momentField`，`goTab` / `menu` 先退出预览；迁移 22 套旧用例到新结构（browser、v3、v31–v34、v36–v38、v40、v41、v43、v44、v46、v48、v50–v52、v54、v55、v57、v63、v71）。
  - 文档：docs/DESIGN_SYSTEM.md、docs/PRODUCT_SPEC.md（V10.0 小节）、docs/STUDIO_UX_PLAN.md 第 6 节（用户决定与实现状态）、README。
- 决策与原因：
  - 旧面板内容原样搬进新面板，`data-action` 与数据逻辑不变，降低回归风险（用户允许 Phase A 这样做）。
  - 撤销历史保存的是整天的快照，所以用「切页清空历史」保证不会改到别的页面；新建 / 复制页面不留撤销步（可在页面信息 / 页面管理里删除），删除页面保留一步可撤销。
  - 「目录」面板（单页保存、复制、折叠、排序）新外壳里原本没有入口，补进「更多」，避免功能丢失。
  - Keeper 不常驻编辑器（方案第 5 条）；v71 用例相应更新。
  - 短屏：面板最高不超过让纸张保留约 170px 高，面板内部滚动。
- 运行 / 测试（Linux 容器 + Chromium；不是 iPhone 真机 / Xcode）：Node 144 项、Python 16 项通过；浏览器 E2E 全量 44 套通过（43 套旧 + v100）。v100 覆盖：外壳结构与位置（撤销 / 重做在纸下左侧、44px、不压纸、不压工具）、更多 / 页面信息、撤销重做（照片、文字、贴纸、位置、图层顺序逐步撤销 / 重做，禁用状态）、切页后撤销不影响另一页、页面管理、预览、保存失败（另一窗口改了记录 → 保存失败、留在编辑器、离开先询问、重试成功）、完成 → 只读页 → 再编辑（照片与音频仍在、无 base64、社区存储未变）、375×667 / 390×844 / 430×932 不滚动不重叠。真实截图：393×852（iPhone 14 Pro 模拟，2x）10 张 + 与设计稿对照图，已发给用户。
- 迁移中发现并处理的问题：纸张变大后两处旧用例的像素拖动距离不再成立（照片互换 / 手柄出纸）——改为按纸宽比例；随手写模式下正文框会盖住视频左上角（原有行为）——用例改点下缘；短屏打开「更多」时纸张被压到约 120px——加最小高度；刚进入编辑器撤销就可用（建页步骤）——`resetHistory()`；浮动菜单在高照片下盖住撤销 / 重做——限制在纸内。
- 发布：`python3 tools/sync_native_web.py`、`python3 tools/build_link.py` 后发布到同一固定链接 https://claude.ai/artifact/VYUJ38K5TBqcZPB8VzJS7A （版本 62，V10.0；本次上传 app.js、styles.css、themes.css、js/canvas.mjs、js/whats-new.mjs、shared/i18n.json）。
- 已知问题 / 与设计稿的差异：页面管理仍是原来的列表样式（设计稿是缩略图网格 + 拖动排序），页面信息沿用旧表单样式；选中对象仍是黑色浮动菜单（Phase B 取代）；有音视频的页面切过去时仍自动打开「本页音视频」面板（原有行为）；未在 iPhone 真机 / Xcode 验证。
- 未完成 / 下一步：Phase B（选中照片 / 文字 / 贴纸的底部上下文工具、直接编辑文字、字体 / 字号 / 颜色 / 对齐、Quick Create 标题正文样式与「转换为自由文字框」、图层操作），之后再回归；Calendar Phase 2 及后续按用户安排顺延。

### 2026-11-11 — 设计探索（不改代码）：Journal Studio 交互重设计方案

- 需求：用户看了编辑器真机截图，认为最大问题是信息架构和交互层次混乱：顶部写法条、画布添加入口、底部工具栏功能重复；手帐本 / 时间 / 删除等管理操作占着编辑区；选中元素的浮动菜单挡内容；保存按钮位置不自然；画布周围 UI 太多；工具没有统一逻辑。要求三种状态（A 默认画布 / B 选中对象的上下文编辑 / C 更多工具面板）、页面信息集中到 Page Details、可靠的自动保存 + 顶部状态 + 「完成」、所有现有功能保留。**本轮先不改代码**，先交付：默认页（空白 / 有内容）、选中照片、选中文字、更多面板、多页面管理、新旧路径比较，并说明哪些工具被合并 / 移动。
- 做法：先盘点现有编辑器的全部控件（app.js：studio-bar、chapterChips、pageMode、pageBar、stage-bar、layerBar、typeBar、writeCard、studio-footer、studioTools 的 11 种工具），截了一张现在的编辑器（三层管理栏 + 黑色浮动菜单 + 两排工具）作对照，再出设计稿。
- 产出：
  - Design 画布 https://claude.ai/artifact/4tXVQfHSSPvQxJZqJFPTUG 新增一行 9 张板：现在的编辑器、A 默认（空白）、A 默认（有内容）、B 选中照片、B 选中文字（字体条展开）、C 更多工具、页面管理、页面信息、对照板（三种状态规则、保存机制、创作方式、7 条新旧路径比较、32 行「每个功能去了哪里」）。
  - docs/STUDIO_UX_PLAN.md：方案文字版（状态规则、页面管理、保存、功能去向表、待确认事项、实现建议）。
- 关键设计决定：底部只有一排工具、内容随状态变；纸在三种状态下不动；黑色浮动菜单取消；常驻控件约 28 → 10；「完成」= 现在的「保存」，自动草稿沿用现有机制，失败可重试、离开前提示；导出 / 分享移到预览；四种写法进入前选择，编辑中在「更多 → 换一种写法」。
- 检查：8 张手机尺寸的板在本地渲染成总览图发给了用户（字体用仓库里的本地字体替代 Google Fonts，中文衬线与画布里略有不同）；对照板用了画布的循环组件，没有在本地渲染。
- 未改动：Public/、Native/、Packages/ 均未修改；在线链接仍是 V9.2（版本 61）。
- 待用户确认：见 docs/STUDIO_UX_PLAN.md 第 5 节（撤销 / 重做位置、「完成」的含义、两种直接打字写法的上下文工具、分两步实现）。V9.0 的 Phase 2–5（日历、书架、Keeper 设置、一致性检查）仍在等首页确认。

### 2026-11-10 — V9.2 写作页：「背景」入口 + 打字后工具栏恢复（用户真机反馈「不知道哪里换背景」）

- 需求：用户发来 iPhone 截图（自由排版，页面上有一张照片），说「不知道哪里换背景」。截图里纸面下方只有 撤销 / 重做 / 照片 / 加文字框 / 视频 / 声音，底部那排工具（照片、版式、字体、纸张、心情、贴纸、目录）完全没有出现。
- 原因（两个）：
  1. 换背景藏在底部工具栏的「纸张」里，名字想不到是背景。
  2. 触屏上打字时 `body.typing` 会隐藏工具栏，只在输入框失去焦点时恢复；iPhone 收起键盘或点空白处时光标常常还留在文字框里，没有 focusout，工具栏就一直隐藏。本地用触屏模拟复现：打字后 `.tool-dock` 为 `display: none`。（没有在真机上直接确认用户当时是否处于这个状态，这是根据截图和代码的判断。）
- 改动文件：
  - Public/app.js：纸面下方 `.stage-bar` 常驻一个 `.stage-bg`「背景」按钮（`data-action="open-background"`，打开与工具栏「背景」相同的面板，空白纸时也有）；新增 `leaveTyping()`：键盘收起（visualViewport 恢复）或点到输入框 / 纸面 / 文字样式条 / 面板以外的地方时，让文字框失焦并退出 typing 状态；纸张面板里纸张小标题改用新键 `paper.title`。
  - i18n：`add.background` 背景 / Background；`dock.paper` 纸张 → 背景；`tool.paper` → 背景与纸张；`paper.title` 纸张。
  - Public/styles.css：`.stage-bar` 改为 5 个等宽按钮（照片 / 加文字框 / 视频 / 声音 / 背景），撤销 / 重做 32px；「加文字框」不再被截断。
  - tests/v37-browser.cjs：打字后点别处 → 工具栏恢复；「背景」按钮和工具栏里的「背景」存在；点「背景」打开含「页面背景 … 纸张」的面板，再点收起。
  - whats-new 9.2；README。
- 运行 / 测试（Linux 容器 + Chromium 触屏模拟）：Node 144 项、Python 16 项通过。浏览器 E2E 全量 43 套：第一轮 40 通过，3 套因本次改动失败并已修——`browser`、`v32`（新按钮与工具栏按钮同为 `data-action="tool" data-tool="paper"`，定位到两个元素 → 新按钮改用 `open-background` 动作）；`v46`（「点别处退出打字」把「点空白纸面开始写正文」的光标也取消了 → 纸面 `#journal-canvas` 内的点击不处理）。修后相关 6 套单独通过，再跑全量：43 套全部通过。Swift / Xcode 未运行。
- 已知问题：修复没有在 iPhone 真机上复查；visualViewport 在嵌入的 claude.ai 页面里不一定会随键盘变化，所以同时加了「点别处退出打字」作为兜底。

### 2026-11-10 — V9.1 修复：Captain 对话泡泡、Keeper 面板字号统一（用户真机截图反馈）

- 需求：用户发来两张 iPhone 真机截图：① 首页点 Captain 后，它说的话变成竖排一个字一行，「最好有个对话泡泡」；②「认识 Little Keeper」面板「字体大小不一致」（「就是它了」很小，「以后再说」很大）。
- 原因：
  - 气泡：V9.0 把 `.keeper-perch` 改成贴在主卡片上方的绝对定位、没有宽度；气泡的 `max-width: calc(100% - 130px)` 按这个很窄的容器算，结果只有 26px 宽。我在 V9.0 的截图检查里没有再点一次 Captain，所以漏掉了。
  - 字号：`.primary` 全局是 11px、`.save-help` 全局是 9px（很早期的小字号），面板里没有覆盖；`.choose-cancel` 是 16px 粗体。实测面板内 9 / 11 / 13 / 16 / 18px 混用。
- 改动文件：
  - Public/styles.css（文件末尾 V9.1 段）：`.keeper-perch` 横跨主卡片宽度（`left: 0`），气泡 `width: max-content; max-width: min(212px, calc(100% - 134px))`，纸色底 + 细边 + 柔和阴影 + 朝向 Captain 的小尾巴（`::after` 旋转方块）；首页气泡不再显示名字小标签；书架气泡同样加尾巴（朝左）。Keeper / 名字面板统一字号：标题 20、小标签 13、选项 16 + 13、说明 13、隐私说明 12、两个按钮都是 16（主按钮 600 / 鼠尾草深绿，取消 500）；名字输入框圆角细边；聊天输入框 16px（避免 iOS 聚焦时放大页面）。首页问候行改为常规字重。
  - tests/v71-browser.cjs：点 Captain 后断言气泡宽 > 100、高 < 100。
  - Public/js/whats-new.mjs 9.1；README。
- 视觉检查：393 和 320 宽下点 Captain 的气泡截图（单行 / 两行，尾巴指向 Captain，不压标题和按钮）；面板截图与各元素的计算字号；书架气泡截图。
- 运行 / 测试（Linux 容器 + Chromium）：Node 144 项、Python 16 项通过。浏览器 E2E 全量 43 套：第一轮 42 通过，v54（打字工具条不移动页面）再次只在整轮里失败、单独连跑 4 次通过——它在工具条刚出现时立刻量画布位置；改为等位置连续两次读数一致后再量（断言不变）。改后重跑全量：43 套全部通过。Swift / Xcode 未运行；修复尚未在 iPhone 真机上复查。
- 已知问题：其他面板（快速记录、书本编辑等）仍在用全局的 9px / 11px 小字，这次只统一了 Keeper 和名字面板；计划在 Phase 5 品牌一致性检查里统一全部面板的字号。用户截图顶部的 ✕ / 分享 / ⋯ 是 claude.ai App 自己的浮层，不属于 Little Days 页面。

### 2026-11-10 — V9.0 Phase 1：首页（方向 A · Hero + Secondary）

- 需求：用户确认 V9.0 视觉方向 Tactile Stationery × Cozy Editorial，按 Phase 实施（1 Home → 2 Calendar → 3 My Books → 4 Keeper 设置 → 5 品牌一致性检查），每个 Phase 完成后给真实 iPhone 尺寸截图、对比设计稿、说明未达标细节、跑测试、更新文档、提交。首页正式采用方向 A：大日期 + 轻量问候、Captain 从主卡片探头、照片手帐唯一主入口、三个次入口、拍立得、今天的回忆（真实记录，不能把假照片当记录）、简约底部导航；次入口没有合格 3D 文具素材时先用协调的简约图标并记录待补资源；不加新功能、不重建、不恢复 Growth。同一条消息里用户上传了「无帽 Captain 抱粉色毛线球」原图（Phase 4 再集成）。
- 改动文件：
  - Public/app.js `home()`：`section.hero.today-card` 改为 `v9-home` 结构——大日期（LD-elegant 斜体）+ 月份·年份 kicker + `home-greeting` + `today-prompt`；`v9-hero-wrap`（Keeper 探头 + 照片手帐纸页：kicker、标题、说明、两张装饰拍立得〔CSS 背景图，不是 <img>，也不代表用户记录〕、唯一主按钮 `today-photos`）；`story-start-row today-tiles v9-secondary`（只写几句 / 手绘 / 更多方式，线性图标 `v9Icon()`）；补记昨天；`v9-today`（「今天的回忆 / 今天还没有记录」+ 连续记录小字 + 原有的今日预览 / 今日照片建议）；今天要做的事。去掉品牌标语、日期牌、本子铁环、「不用先选手帐本…」小字和旧的 `tileArt()` 插画。所有 data-action 与测试依赖的类名保留。
  - Public/styles.css：文件末尾「V9.0 · Home」一整段（纸页、拍立得、网格布局保证照片不压文字 / 按钮、<390px 按钮独占一行、<360px 缩小品牌字和日期、今天的回忆改为大拍立得：照片在上、标题写在白边纸上）；`tools/sync_tokens.py` 已重新生成主题变量。
  - design-tokens.json：新增 `sageDeep` #55684A、`kraft` #E6D9C4、`lemon` #F2C94C（Swift 以字典解码，兼容）。
  - i18n：`v9.pickPhotos / writeHint / drawHint / moreHint / today / todayEmpty`（中英）。
  - whats-new 9.0；docs/DESIGN_SYSTEM.md「V9.0 Visual Design System」；docs/PRODUCT_SPEC.md；README。
  - tests/v31-browser.cjs：备份后的「MB」用量行原来是读完下载立刻断言，现在等待它异步填好（单独重跑确认会显示，只是比断言晚；属于测试时序问题，不是功能回归）。
- 决策与原因：
  - 中文标题继续用系统黑体（v47 测试记录的 V6 用户决定「无衬线标题」，也符合「清晰的中文字体」）；英文 kicker / 日期数字 / 品牌用 Cormorant Garamond。
  - 设计稿 A 里拍立得压住了说明和按钮；实现改为网格（文字 | 124px 拍立得），并在窄屏把按钮移到下一行。
  - 「今天的回忆」：起初做成小横条，v45（「今天的照片是首页主角」）失败；改为一张大拍立得（照片 4:3 + 白边纸上写标题），既是方向 A 的文具感，也让照片成为主角。
- 视觉检查（Chromium 设备模拟截图）：393×852 开 / 关 Keeper、滚动后的回忆与书架、375×667、430×932、320×640、深色主题；脚本检查 Captain 不压任何按钮、拍立得与文字 / 按钮无重叠、无横向滚动。对比图：V8 首页 / 方向 A 设计稿 / V9.0 实际首页。
- 运行 / 测试（Linux 容器 + Chromium）：Node 144 项通过；Python 16 项通过；浏览器 E2E 全量 43 套：最后一轮 42 套通过，v54（Studio 打字工具条不移动页面的位置断言，与首页无关）失败一次，单独连续重跑 3 次都通过——这个断言在 V7.9 时也偶发失败过，属于已知的偶发时序问题，尚未根治。前一轮发现并修好的：v45（今天的回忆要求大照片 → 改成大拍立得）、v31（MB 行的测试时序）。Swift / Xcode 未运行。
- 未达到设计稿 / 未完成：次入口仍是线性图标（3D 迷你日记本、颜料盘、素材盒需要美术制作）；底部导航沿用原样式（「创作」按钮跟随主题色，不是设计稿里的墨色圆；社区入口仍在实验室打开时出现）；问候是两行（「Hi！今天是星期二」+「今天有什么值得记录？」），没有改成设计稿里的一句，以保留现有点按改名字的功能；首页下方「今天要做的事」和书架只做了纸页统一，书架会在 Phase 3 重做。Swift 未编译、未在真机验证。
- 下一步：用户确认首页后进入 Phase 2 Memory Calendar。

### 2026-11-10 — V8.1 正式 App Icon 集成（iOS + Web）

- 需求：用户确认上传的图片为「Little Days V1 Official App Icon」（Captain 柠檬帽探头、小花回形针、Little Days 棕色衬线字、小芽），要求直接使用原图（不重新生成、不重绘、不用 SVG/CSS 模仿）；iOS 做 1024 × 1024 不透明正方形、不预切圆角、更新 Asset Catalog、不改 Bundle ID；Web 更新 favicon（以及已有的 PWA 配置）；检查小尺寸可识别性；区分 App Icon / 文字 Logo / Keeper；只做图标，不改首页、导航、Keeper 等。
- 改动文件：
  - 新增 `docs/brand/LD-app-icon-original.png`（原图 1254 × 1254，原样保存）与 `tools/make_app_icon.py`（可重复生成）。
  - 新增 `Native/App/Assets.xcassets/`（`Contents.json`、`AppIcon.appiconset/Contents.json`、`AppIcon-1024.png`，单尺寸 universal iOS 格式）。
  - `Native/LittleDays.xcodeproj/project.pbxproj`：Assets.xcassets 文件引用、加入 App 组和 Resources 阶段；Debug / Release 加 `ASSETCATALOG_COMPILER_APPICON_NAME = AppIcon`。Bundle ID（com.jessiethere.littledays）和其他设置不变。
  - 新增 `Public/icons/favicon-32.png`、`icon-192.png`、`apple-touch-icon.png`；`Public/index.html` 用它们替换原来的 🌷 emoji favicon。
  - `tools/build_link.py`、`tools/sync_native_web.py`：复制 `.png`（Public 里只有这三个图标是 PNG）。iOS 外壳 WebApp 已同步。
  - `Public/js/whats-new.mjs` 8.1；docs/DESIGN_SYSTEM.md（正式 App Icon 规范）、docs/ASSETS.md；README。
  - 新增 `tests/test_app_icon.py`（1024 不透明 RGB、Contents.json、pbxproj 引用与 AppIcon 设置、Bundle ID 未变、括号平衡、Web 图标尺寸与链接、原图保留）。
- 决策与原因：原图是「圆角图块 + 外圈空白和阴影」，图块本身约 992 × 1056、圆角约 290px（比 iOS 圆）。直接整张用会变成「图标里套图标」，元素也更小；只裁成图块高度会让叶子和缝线贴边。所以取整个图块（不裁掉任何元素），左右窄条、四角外侧和 22px 的边缘高光 / 阴影用图块内部颜色延展、柔化填充，再一次 Lanczos 缩放。检查：保留区域与原图逐像素一致（最大差 0），约占 79%；第一版的径向条纹和白色弧线已去掉。
- 视觉检查：原图 vs 集成图对比；180 / 120 / 87 / 80 / 58 / 40 像素在浅色和深色背景上；浏览器里按 iPhone 尺寸画的模拟主屏幕、搜索结果、设置、通知（用实际图标文件，22.37% 圆角近似 iOS 形状），已发给用户。60pt / 40pt 下脸、眼睛、帽子、字样都清楚；29pt 字样勉强；20pt 只能认出脸和帽子。
- 运行 / 测试（Linux 容器 + Chromium）：Node 144 项通过；Python 16 项通过（新增 test_app_icon 4 项，含外壳同步一致性）；浏览器 E2E 全量 43 套一轮全部通过；localhost 上 /icons/*.png 返回 200 image/png。Swift / Xcode 未运行。
- 未验证 / 已知问题：没有 Xcode / iOS 模拟器 / 真机，所以 Asset Catalog 编译和真机主屏幕效果都没有验证；pbxproj 只做了文本和括号检查。项目没有 PWA manifest，未新增。在线链接（claude.ai Artifact）的浏览器标签图标由 claude.ai 决定，网页里的 favicon 在 localhost 和 iOS「添加到主屏幕」时生效。
- 下一步：在 Mac 上用 Xcode 打开 Native/LittleDays.xcodeproj，确认 AppIcon 显示、真机主屏幕效果；如需更锐利的小尺寸，可请美术出一版字样更大的小尺寸专用图（不替换正式图标）。

### 2026-11-10 — 设计探索（不改代码）：Visual Direction、首页快捷入口三方向、日历 / 书架、Keeper V2 角色系统

- 需求：用户发来三段要求。① Little Keeper V2：三只角色各有性格（Captain 好奇调皮 / Bunny 温柔乐观 / Westie 热情忠诚），每只有 Natural 自然形象（默认）和 Dress-up 装扮，三只共用一套功能；② Visual Identity Reset：先建立整体视觉方向，再出 Home / Calendar / My Books 三张 iPhone 稿并和现在对比，用户确认后才写代码；③ 首页四个快捷入口太像普通按钮宫格，要 A（Hero + Secondary）/ B（Stationery Objects）/ C（Editorial Layout）三套方向。② 和 ③ 都明确「本轮先进行设计探索，不修改代码」，所以本轮只做设计，App 代码和数据没有任何改动。
- 产出：Design 画布 https://claude.ai/artifact/4tXVQfHSSPvQxJZqJFPTUG （私有）
  - Visual Direction：Cozy Editorial × Collectible Stationery；四条原则；字体（Cormorant Garamond 品牌 / 日期数字、思源宋体标题、思源黑体正文、Caveat 手写点缀，每屏 ≤ 1 处）；配色与比例（Paper 60% / Sheet 20% / Ink 12% / Sage 5% / 点缀 ≤ 3%）；三层纸质表面；两种图标（线性工具图标 vs 收藏级文具物件）；间距；八个品牌组件；Keeper 融入规则。
  - 首页：现在 vs A / B / C 三个方向（真实照片 + V8.0 Captain 探头素材）。
  - 日历：现在 vs Memory Calendar（有照片的日子变成照片小方块，选中日以拍立得展开）；书架：现在 vs 数字手帐书架（正在写的封面 + 布面书脊 + Captain 小管理员）。
  - Keeper V2：三只角色性格卡、统一状态 × 角色素材矩阵（有图 / 缺）、统一 Character Configuration、陪伴模式、事件→状态、素材目录结构、可做 / 需帧的动画；Keeper 设置页稿。
- 美术资源核对（如实）：用户说的「无帽 Captain 抱粉色毛线球」图没有上传到本会话；三只角色都没有 Natural（无帽）素材；Bunny / Westie 只有 V7.9 角色表里的戴帽图（且需要用 V8.0 工具重新精细抠图）；所有角色都缺 Curious（Captain 参考图里有「惊喜」可裁）、Peek（Bunny / Westie）、Writing；快捷入口的 3D 文具物件需要美术渲染，稿中用真实照片和纸质结构占位。
- 未改动：Public/、Native/、Packages/ 均未修改；在线链接仍是 V8.0（版本 57）。
- 下一步：等用户在 A / B / C 中选一个方向（或组合）、确认视觉方向，并提供 Natural 素材后，再按确认的稿子实现，并同步 DESIGN_SYSTEM / PRODUCT_SPEC / README / agent.md。

### 2026-11-10 — V8.0 Captain Keeper V1：只保留 Captain，重新精细抠图，首页 Peek；修复聊天气泡

- 需求：用户发来「参考图 1 · Captain 角色视觉标准」（唯一美术标准）和「参考图 2 · 首页布局参考」（氛围参考），要求本轮只做 Captain：毛发质感、金黄眼睛、柠檬帽与参考一致；抠图检查毛发边缘、无残留背景、无误删；先展示透明素材和 iPhone 首页截图，确认后再扩展其他角色；不重新设计首页其他功能；首页 Peek（自然遮挡 + 柔和阴影、不占大模块、不重复欢迎语、不挡按钮 / 照片、可隐藏、不照搬图 2 的旧模块、不加回 Growth）；状态 Normal / Happy / Sleepy；可有轻微呼吸，不用换表情图冒充动画，支持减少动态效果；只在用户主动互动时说短句；先说明美术资源能否直接用于开发。中途用户反馈「点开对话框非常奇怪」（截图：Captain 的回复一个词一行）。
- 美术资源评估（如实）：参考图 1 是一张排版好的说明图，不是透明素材；但背景是平涂奶油色（±2 级），可以用算法抠出、不需要重画。限制是分辨率：站姿每个约 190px 宽，Peek 约 340px，只够小尺寸使用；参考图 2 和最早的设计图背后有杂物，无法干净抠出。正式上架前建议美术提供每个状态 ≥ 1024px 宽的透明 PNG，以及眨眼等动画需要的连贯帧。
- 改动文件：
  - 新增 tools/extract_captain.py（从参考图 1 抠 Normal / Happy / Sleepy / Peek：背景洪泛 + 暖色投影识别；只留最大连通块，去掉闪光线和 zZ；2px 边缘带 α 估计 + 去奶油色；清理小块浅色碎片和叶柄旁的背景口袋；站姿统一 197×251 画布与底线）。删除 tools/extract_keepers.py 和 V7.9 的 20 张多角色图（git 历史保留）。
  - Resources/Keepers：4 张 Captain PNG + 新的 LD-keeper-LICENSE.txt；library.json `keepers` 只剩 4 条；i18n：Captain 介绍、点按短句「今天有什么想记录的吗？」，删除小西高地和帽子相关文案。
  - Public/js/keeper-art.mjs（只映射到 4 张图）、keeper.mjs（`ANIMALS = ["cat"]`，旧的 bunny / westie 读成 Captain，数据字段不变）。
  - Public/app.js：首页固定 Peek；默认不说话（首页已有问候）；点按后一句话 5 秒淡出；不再换图冒充动画；新手引导只介绍 Captain；设置去掉动物和帽子选择；书架夜间 Sleepy；聊天气泡 class 改为 `them`。
  - Public/styles.css：Peek 110px（= 原图分辨率）、切线对齐卡片上沿、爪子压边 6px、两层柔和阴影；气泡绝对定位不推页面；保存印章移到页面右上角（原来挡住「打开这一天」）；聊天气泡正常宽度、隐藏内部滚动条、圆角输入框；删除帽子选择和非 Peek 裁切样式。
  - Swift：Resources.swift 注释、Models.swift `KeeperProfile.animal` 注释；CoreTests 断言 Captain 4 张图。
  - 测试：tests/v79.test.mjs 改为 Captain 版（清单、RGBA、站姿同尺寸、状态映射、旧选择读成 Captain）；v71 改为只有 Captain、首页不说欢迎语、点按一句话会自动消失、聊天气泡宽度 > 150px；v77 默认动物改为 cat。
  - 文档：DESIGN_SYSTEM.md「V8.0 Captain 角色规范」（角色特征、主色、素材表、制作与质检、分辨率限制、首页 Peek 规则、动画已实现 / 未实现）；ASSETS.md；ARCHITECTURE.md；whats-new 8.0；README。
- 发现并修复：聊天回复的 class `keeper-msg keeper` 与角色图片外层 `.keeper`（64px 宽）同名，所以回复被压成 64px（用户截图的问题）。
- 视觉检查：素材在棋盘格 / 页面色 / 深色 / 灰 / 绿背景 1×–4× 检查；首页在 320、375、393、430 宽下截图，脚本检查 Captain 不与任何按钮、日期牌重叠、无横向滚动；开启 / 关闭 / 首次邀请 / 点按 / 保存后均截图；与参考图 1、2 做了对比图并发给用户。
- 运行 / 测试（Linux 容器 + Chromium）：Node 144 项全部通过；Python 12 项通过（含外壳同步一致性）；浏览器 E2E 全量 43 套一轮全部通过（这次没有同时跑其他浏览器脚本）。Swift 未编译（无 Xcode / Swift 工具链），CoreTests 只改了源码；iOS 真机 / 模拟器未验证。
- 已知问题 / 未完成：分辨率受参考图限制（首页 Peek 110pt 已是不放大的上限）；深色背景放大 2 倍时 Peek 叶柄旁仍有 1–2 个极淡像素；眨眼等动画、写字动作没有素材所以未实现；Captain 在首页比参考图 2 小（按「陪伴而非主内容」）；Swift 未编译、iOS 真机未验证。
- 下一步：等用户确认 Captain 视觉；如需更大更清晰，请美术出高分辨率透明 PNG（放进 Resources/Keepers、在 library.json 登记即可替换）；确认后再按同样流程加入其他角色。

### 2026-11-10 — V7.9 Little Keeper 改用用户确认的 3D 角色图（不再用 SVG / CSS 画）

- 需求：用户发来 Little Keeper 角色视觉设计规范（3 个角色 × 6 套造型 / 表情的 3D 角色表）、「参考图 1 · Captain 角色视觉标准」（Normal / Happy / Sleepy / Surprised / Peek，主色，关键特征）和「参考图 2 · 首页布局参考」，并明确：以上传图片为视觉目标；不要用扁平 SVG / Emoji / 普通二维卡通 / 简单几何形状代替；合理裁切，不把整张角色图当作单个资源；缺新角色 / 动作时说明需要额外美术；不要声称代码绘制的角色与参考图效果相同；「功能实现」≠「视觉达标」；展示实际 iPhone 首页并与参考图对比。随后再次要求：停止用 SVG 或 CSS 重画 Keeper，使用 3D 角色图作为图片资源，不重构页面，Keeper 是低调的陪伴而不是主内容。
- 改动文件：
  - 新增 tools/extract_keepers.py（从角色表逐个裁切 18 张；`--captain` 从参考图 1 裁切 Peek 与 Surprised；去奶油色底、脚下阴影变半透明、2px 柔边、统一 233×309 画布与底线）。原图不进仓库、不进 App。
  - 新增 Resources/Keepers/（20 张 PNG，约 1.7 MB）+ LD-keeper-LICENSE.txt；library.json 新增 `keepers` 清单。
  - tools/preview.py、tools/build_link.py：新增 `library/keepers/`；Swift Resources.swift：`KeeperAsset`、`AssetCatalog.keepers`、`libraryData(category: "keepers")`；Models.swift `KeeperProfile.outfit`（可选）；CoreTests 加清单 / PNG / outfit 解码断言；LittleDaysWebResources.swift 注释。
  - Public/js/keeper-art.mjs：删除 SVG 角色，改为按动物 / 造型 / 表情选图（`keeperAsset` / `keeperImage` / `keeperOutfits` / `DEFAULT_OUTFIT`）。
  - Public/js/keeper.mjs：`ANIMALS` 加 westie；`outfit` 字段；默认名字 小团 / Captain / 小白（Pip / Captain / Snowy）；西高地回应语气。
  - Public/app.js：所有 Keeper 位置改用图片；首页默认 Peek（22–6 点 Sleepy，长大那次 Happy）；点按短暂换成 happy / excited 图；设置里「帽子」选择；换动物时重置造型。
  - Public/styles.css：删除全部 SVG 部件动画（头、眼、耳、铅笔等）；只保留整张图呼吸、点按弹跳、跟随手指 ±3° 倾斜；首页 Captain 探头 96px，切线落在卡片上沿、爪子压边 4px；小兔 / 小西高地 84px，卡片挡住下半身；其他位置缩小（Studio 28、书架 46、面板 58 等）。
  - i18n.json：小西高地、帽子名称、帽子说明；`keeper.animal.cat` 改为「Captain 猫」（同时合并了文件里重复的 `home.greeting` 键，生效值不变）。
  - whats-new.mjs 7.9；docs/DESIGN_SYSTEM.md（角色视觉规范：素材、默认造型、状态→图片表、尺寸、动效、分辨率、缺失素材）；docs/ASSETS.md（来源与授权）；docs/ARCHITECTURE.md；README.md。
  - 测试：新增 tests/v79.test.mjs；tests/v71-browser.cjs 改为检查 `img.keeper-img[data-animal="cat"]` 已加载、页面上没有 Keeper SVG；tests/v77.test.mjs 默认名字改为 Captain。
- 决策与原因：
  - 角色表里「柠檬帽、睁眼」那张与参考图 1 的「Normal / 默认」相同，所以命名为 neutral；参考图 1 的 Surprised 作为 Captain 的 excited。
  - 只有 Captain 有真正的 Peek 图；小兔 / 小西高地暂时用站姿图，被卡片挡住下半身来近似，并在更新记录、文档里写明需要补图。
  - 所有缺图的状态都用最接近的现有图片，不用代码画替身。
  - 尺寸刻意比参考图 2 小，首页结构不变（按用户最后一条要求）。
- 视觉对比：截图在 iPhone 14 Pro 尺寸（Chromium 设备模拟），对比图左边参考图 2、右边实际首页，下方 Peek 细节；已发给用户。差异：Keeper 比参考图小；首页仍是现有排版（没有照搬参考图 2 的 Habits / Mood 卡片）；深色背景上站姿图边缘有极轻微浅色描边（App 主要是浅色）。
- 运行 / 测试（Linux 容器 + Chromium）：Node 145 项全部通过（新增 v79 五项）；Python 12 项通过（含外壳同步一致性）；浏览器 E2E 全量 43 套：第一轮 40 套通过，`browser`、`v41` 失败——原因是 Keeper 邀请（在 `.hero` 卡片里）现在是 `<img>`，测试里的 `.hero img` 匹配到两个元素；改为 `.hero img:not(.keeper-img)` 后两套通过。`v54` 在第一轮失败一次（「打字工具条不移动页面」的位置断言），那时我同时在跑其他浏览器脚本；单独重跑两次都通过，该测试里 Keeper 未开启，判断为负载下的偶发，但没有在干净环境下再全量跑一轮。v71 更新后通过（检查首页图片已加载、没有 Keeper SVG）。截图：iPhone 14 Pro 尺寸首页（Captain / 小兔 / 小西高地）、选择小伙伴、设置里的帽子。Swift 未编译（无 Xcode / Swift 工具链），CoreTests 只改了源码。
- 已知问题 / 未完成：缺 小兔 / 小西高地 Peek、三个角色的 Writing、小兔 Sleepy / Excited（小芽帽）、Captain / 小西高地 Encouraging、其他造型的更多表情；需要更高分辨率的单独渲染图才能更大尺寸使用。Swift 未编译（容器没有 Xcode / Swift 工具链），iOS 真机 / 模拟器未验证。
- 下一步：请美术补上述姿势与高分辨率图，放进 Resources/Keepers 并在 library.json 登记即可生效（选图逻辑会自动优先用真图）。

### 2026-11-10 — V7.8 Little Keeper 毛绒新造型 + 首页「小本子」排版

- 需求（用户发来一张设计图：戴柠檬毛线帽的灰色小猫从首页卡片上方探出头、爪子搭在卡片边上；卡片像带铁环的本子，顶部「Hi! 今天想记录什么？」+ 日期牌，四个带 3D 图标的入口，「今天 · My Day」带胶带的照片，习惯 / 心情小卡）：「小动物的话我喜欢这个风格，排版的话你可以参考一下你觉得好的地方，不一定要大改现在的」。
- 采纳：角色风格（毛绒质感、大眼睛、探出头 + 爪子搭边、柠檬帽）；卡片像本子（铁环、缝线）；问候 + 日期牌；四个插画入口方块（照片手帐高亮）；品牌小芽 + 标语；照片卡纸胶带。**未采纳**：习惯打卡 / 今日心情方块（与 Vision 2.0「首页不做追踪器」冲突）；「我的」tab（改导航需批准）；黄色 ＋（与现有鼠尾草绿主色不一致）。
- 改动文件：Public/js/keeper-art.mjs（重画：探出头姿势，`feTurbulence` 毛边 + 毛毡纹理滤镜，大眼睛多层高光，小猫灰色英短 + 针织柠檬帽（叶子、柠檬片、帽檐罗纹），小兔雏菊花环；阶段：小花 → 金色星星；心情 idle / quiet / happy）；Public/app.js（masthead：品牌 + 小芽 + 标语，问候移入卡片；`keeperPerchHTML` 让小伙伴坐在卡片上沿（原 `.keeper-home` 类保留），`keeperInviteHTML` 放在卡片里；卡片铁环 `nb-rings`、`today-head`（问候 + 日期牌）、四个 `today-tile`（保留 today-photos / today-write / quick-open 选择器，新增 today-draw）、`tileArt` 插画；备份后在设置页重新显示媒体用量）；styles.css（V7.8 段：perch 弹出动画、缝线 outline、铁环、日期牌、入口方块、纸胶带、角色新变换原点）；i18n.json（home.tagline、tile.*）；whats-new.mjs（V7.8）；docs。
- 发现并修复：v31「媒体用量 MB」偶发失败其实是 V7.5 引入的问题——备份后 `render()` 清空了异步填充的 `#media-usage`；现在备份后重新调用 `showMediaUsage()`，v31 连续两次通过。之前日志里把它记成「环境偶发」，这里更正。
- 运行 / 测试：全量 43 套中 41 套通过；v40（深色主题对比度）发现日期牌文字对比度 2.15 → 改为 `var(--ink)` 后通过；v31 修复后连续两次通过。Node 140 项、Python 12 项通过。截图检查首页（小伙伴坐在本子上、四个方块、深色主题对比度由 v40 覆盖）。Swift 未改动、未编译。
- 已知问题：仍是 SVG 2.5D（毛边用滤镜模拟），不是真 3D 渲染；滤镜在低端手机上可能略耗性能（未在真机测）。
- 下一步：用户确认造型方向后，可请美术出真 3D 版本（与设计图一致的毛发渲染）；表情和动作再丰富一些（睡着、伸懒腰、递铅笔）。

### 2026-11-10 — V7.7 Little Keeper MVP（可选小伙伴）+ 首页问候 + 标签 Top 3

- 需求：用户长文「Little Days — Little Keeper Feature Development」（Today 上的小伙伴、三种模式、选择动物 / 起名、主动请求的回应、成长、My Books、隐私与 AI 同意、分阶段、测试、文档），并说「你可以鼓励或者 challenge 我；动画希望 3D 可爱有质感，互动希望自然」。同一轮追加：「首页还希望加一个 Hi,XXX，今天是星期X」；「标签可能有很多可以显示 top3 然后有个搜索的地方」。这一条覆盖了上一条「只写文档、未经批准不实现」——用户这次明确要求实现。
- 架构评估（实施前）：iOS = Swift WKWebView 外壳 + `Public/` 网页（vanilla ES modules，无框架）；数据 `little-days.v1`（V7.5 起 IndexedDB 为主、LocalStorage 镜像）+ Swift `Models.swift` 可选字段；导航 首页 / 日历 / ＋（Studio）/ 书架；没有独立 Growth tab（「我的习惯」可选页仍在）；无后端、无 AI 服务。决定：不换技术栈、不加后端；Little Keeper 作为独立模块接入现有页面。
- 给用户的 challenge（已在回复中说明）：三种模式可能太细 → 每种一句话说明 + 「翻看以前的页面」「主动打招呼」单独开关；AI 回应与「只在本机」冲突 → 先做本机规则回应，外部 AI 只留接口且由代码强制同意；「完成 Growth 活动」与 Vision 2.0 冲突 → 只把「我的习惯」打卡当作「这一天照顾了自己」，一天最多一次；真 3D 需要美术模型、WebView 3D 耗电 → 先做 2.5D 黏土质感 SVG + CSS 动画。
- 改动文件：新增 Public/js/keeper.mjs（纯函数：ANIMALS / MODES；`normalizeKeeper`（默认关闭、权限独立）；`modeAllows`（安静：不邀请、不回应；温柔：邀请 + 主动请求才回应；互动：聊天，回忆需 allowMemories，主动需 proactive）；`keeperConfig`（features.json `keeper` 可配置阈值与分值）；`growthPoints`（按天计：写页 2、有照片 1、打卡 1、打开那年今天 1，每天上限 4；有我页面的手帐本 2、有标签的手帐本 1；示例日不算；不看字数和情绪；没有扣分）；`stageFor`；`todayPrompt`；`localFeedback`（关键词线索 → 开头 / 中间 / 结尾三段，避开最近用过的句子，难过的日子不强行正能量，无诊断）；`createFeedbackService({remote})`（没有 aiConsent 时绝不调用 remote，没有 remote 时本机生成，安静模式返回 null）；`localChat`（回忆 / 本周 / 书架，回忆和标题需要 allowMemories）），新增 Public/js/keeper-art.mjs（原创 SVG 黏土角色：兔 / 猫，渐变光影、高光、腮红、柔和投影，抱本子拿铅笔；阶段配饰：小芽、围巾 + 徽章；心情：idle / quiet / happy），Public/app.js（首页问候 `greetingHTML` + 名字面板；Little Keeper：首页一次性邀请、首页气泡、Studio 小伙伴打字时变安静、保存后盖章、翻书页「听听它怎么说」、互动聊天面板（不保存）、书架上的它、介绍流程（动物 / 名字 / 方式）、设置卡片（形象、阶段叶子、名字、动物、方式、两个权限开关、禁用的 AI 同意开关、关闭）、头部跟随手指 / 点按弹跳、成长到新阶段时轻轻说一句；书架标签 Top 3 +「更多」搜索；关闭后不再邀请），personal-ui.mjs（extra.keeper），styles.css（角色动画：呼吸、眨眼、耳朵、铅笔、小芽、弹跳、盖章；prefers-reduced-motion 时全部停止），i18n.json（home.greeting*、keeper.*、books.tagsMore/Less/Search），features.json（keeper 配置），whats-new.mjs（V7.7），Models.swift（`DayState.keeper: KeeperProfile?`）+ CoreTests，tests/v77.test.mjs（7 项），tests/v71-browser.cjs（9 组），package.json，docs。
- 运行 / 测试：Node 140 项（新增 v77 7 项：资料、模式、按天成长、可配置阶段、回应（含示例原句）、AI 同意强制、聊天权限）、Python 12 项、43 套浏览器 E2E 全部通过（新增 v71 9 组；本次全量里 v31 也通过）。Linux 容器 + Chromium；截图检查了角色、介绍、首页、回应面板。**Swift 未编译**（无 Xcode）。
- 已知问题 / 限制：Swift 未编译；「3D」是 2.5D SVG + CSS，不是真 3D 模型；本机回应是规则组合，不是语言模型；聊天只支持三个话题 + 简单回应；没有真实 AI 后端（接口已留，同意开关在没有安全服务时禁用）；首页成长提示依赖重新渲染时间。
- 下一步：美术：真 3D 模型（USDZ / glTF，或 Rive / Lottie 动画）与更多表情；考虑 iOS 端侧模型生成回应（需核实系统版本与机型要求）；故事小世界收藏品（docs/PRODUCT_VISION_2.md）；Xcode 构建与真机验证。

### 2026-11-10 — 产品方向 Vision 2.0 与 Little Keeper（只记录决策和方案，未实现）

- 需求：用户两条消息。①「Additional Core Product Principle — Grow Through Living」：Little Keeper 随记录自然成长；伙伴成长 + 故事里的小世界（收藏品），MVP 设计可扩展数据模型、只做少量例子；不强制任务、不惩罚中断、可关闭、不需要把私人文字交给 AI。②「Product Vision 2.0 — Important Correction」：独立 Growth 模块已移除，不要重新引入；产品围绕 Today / Calendar / My Books / Journal Studio；成长只从已有的记录行为派生，不做习惯 / 健身 / 学习追踪器或成长仪表盘；核对仓库结构；保留代码和数据；更新 README、追加 agent.md；**未经批准不实现新功能、不改导航**。
- 处理：两条冲突处以更正为准——本轮**只写文档**：新增 docs/PRODUCT_VISION_2.md（核对后的实际结构、架构、Grow Through Living 原则、以天计的公平规则、只用元数据的收藏品规则与 4 个 MVP 例子、可扩展数据模型提案（library.json `keeperCollectibles` + 可选 `keeper` 字段 + 纯函数 keeperState）、体验位置、不做的事、待批准事项）；README 新增「产品方向」一节；ROADMAP 追加 Little Keeper 阶段（待批准）与「Growth 模块已退役」说明；STRATEGY 追加一条说明。没有改任何代码、导航或数据。
- 核对结果（如实）：导航为 首页 / 日历 / ＋（Studio 入口）/ 书架（实验室时加社区）；Growth tab 已在 V6.6 去掉；但「我的习惯」（打卡、成长之书、回顾）仍作为可选页面存在于书架与首页一行入口（2026-11-09 用户选择保留），实验室里仍有旧的文具等级 / 经验值——两者与新原则有张力，已列入待确认，未擅自删除。
- 下一步：等用户批准 MVP 以及「我的习惯」、旧等级、默认开关、美术方向四个决定。

### 2026-11-10 — V7.6 搜索、那年今天、每日提醒（iOS 本地通知）、手帐本标签

- 需求：同上一条（用户确认的顺序）的第 4–7 项：搜索、「那年今天」、每天的温柔提醒（用户自选时间，「今天有什么值得记的？」，一键关掉，iOS 本地通知、不联网）、给自己的书做 tag 标签。
- 改动文件：新增 Public/js/search.mjs（searchJournal：自己的页面（含草稿，不含示例日）的标题 / 正文 / #标签 / 纸上文字（不含跨页副本 gen 与绑定文字）/ 自定义字段 / 所属手帐本名与标签、当天清单（习惯名、细节、感想、做完的事）、手帐本（名、简介、标签）；多词 AND、忽略大小写；snippet；onThisDay：往年同月同日（最多 20 年，新的在前），没有时用「一个月前的今天」（不跨月末））；Public/app.js（放大镜图标；首页与日历页头搜索入口；`search` 页：输入即搜、`<mark>` 高亮、手帐本结果、点开当天并定位；首页 memoryHTML（照片 + 一句话 + 其他年份小按钮，× 今天隐藏 `little-days.memory-dismissed`，隐私「首页隐藏今天」时不显示）；每日提醒：`little-days.reminder` {on,time}，设置「每天的提醒」卡片（网页里开关禁用并说明只在 iPhone App 有效），syncReminder 在启动、开关、改时间、保存后通知外壳（skipToday），回调 littleDaysReminderResult / littleDaysFromReminder（打开「今天怎么记？」）/ littleDaysReminderTurnedOff；手帐本标签：表单「标签」字段、书架标签筛选 `shelf-tag`、手帐本页显示标签）；Public/js/model.mjs（parseTags：空格分隔，# 后保留空格，只有逗号时按逗号；最多 8 个、每个 ≤ 16 字、去重；saveBook 规范化；validateStateSnapshot 校验 tags）；personal-ui.mjs（标签字段、extra.reminder）；styles.css；i18n.json（search.* / memory.* / reminder.* / books.tags*）；whats-new.mjs（V7.6）；新增 Native/Sources/LittleDaysUI/WebShell/LittleDaysReminders.swift（WKScriptMessageHandler `littleDaysReminder` + UNUserNotificationCenterDelegate：逐日排 14 个本地通知、今天已记则跳过、「关闭每日提醒」动作（立即移除并在页面就绪后通知页面）、点击通知打开记录面板、前台不弹横幅）；LittleDaysWebShellView.swift（注册桥接）；Native/App/LittleDaysApp.swift（启动时 install 设置通知代理）；Models.swift（JournalBook.tags）+ CoreTests；tests/v76.test.mjs（5 项）；tests/v69-browser.cjs（3 组）、tests/v70-browser.cjs（3 组）；package.json；docs。
- 决策与原因：提醒逐日排 14 天而不是一个重复通知，这样今天已经记过就能跳过；代价是 14 天不打开 App 后提醒会停（也算不打扰）。「那年今天」在应用还年轻时退而求其次显示一个月前，让用户更早感受到回看的价值。示例日不参与搜索和回忆。
- 同一轮追加：用户截图「卡片和主页显示字体排版不一样」——首页「今天」卡片的标题和文字改用那一页自己的 `font` / `bodyFont`（字重 500），v66 加断言。
- 运行 / 测试：Node 133 项、Python 12 项通过；浏览器 E2E 全量 42 套中 41 套通过（新增 v69 3 组、v70 3 组）。**v31 不稳定**：它写死的日期 2026-11-10 变成了今天，在 V7.5 代码上同样失败，与本次改动无关；已改为 20 天前的空日期，并让方向键微调步骤先确认焦点、最多重试 3 次；之后单独跑 3 次中 1 次通过，另外 2 次在更早的「媒体用量显示 MB」处偶发失败（存储估算是异步的，环境相关），未继续深挖，如实记录。Linux 容器 + Chromium；Swift 未编译。
- 已知问题：**Swift 通知代码未编译**（无 Xcode），未在 iPhone 上验证通知权限、时间、动作；网页版没有提醒；搜索为全量线性扫描（几千页以内足够快，未做索引）。
- 下一步：Xcode 构建 + 真机验证（App 锁、面容 ID、提醒）；自动 iCloud 备份；搜索结果按手帐本筛选。

### 2026-11-10 — V7.5 备份提醒 + 记录存储升级到 IndexedDB

- 需求：用户确认顺序「第 2 条的备份提醒和第 3 条存储升级先做，接着做第 4、5 条搜索和『那年今天』，然后每天的温柔提醒（iOS 本地通知），然后给自己的书做 tag 标签」。本条为前两项。
- 改动文件：新增 Public/js/meta-store.mjs（IndexedDB `little-days-meta` / `kv`，写入排队合并，只写最新值）；Public/js/model.mjs（Store 接受 `{durableRaw, persist, onPersistError}`：LocalStorage 有副本时以它为准（每次保存先写它），没有时用 IndexedDB 副本；首次启动把 LocalStorage 的记录复制进 IndexedDB；LocalStorage 写满（QuotaExceeded）时移除镜像、设置 `little-days.v1-mirror = off`，之后只写 IndexedDB；没有 IndexedDB 时仍抛错，不会静默丢失）；Public/app.js（启动时读 IndexedDB 再建 Store；`navigator.storage.persist()`；备份提醒：自己的记录 ≥ 3 天且从未备份或 ≥ 14 天未备份时首页一行提醒，「现在备份」走原备份流程，× 推迟 7 天（`little-days.backup-snooze`）；备份成功记录 `little-days.last-backup`；设置「本机媒体与备份」显示上次备份）；personal-ui.mjs（extra.backupWhen）；styles.css；i18n.json（backup.*、storage.saveFailed）；whats-new.mjs（V7.5）；tests/v75.test.mjs（5 项）；tests/v68-browser.cjs（4 组，包括真正写满 LocalStorage 后保存、刷新后从 IndexedDB 读回）；package.json；docs。
- 决策与原因：保留 LocalStorage 镜像（在放得下时），这样旧代码、跨标签页冲突检测和现有测试都不受影响；只在写满时才切到只用 IndexedDB。备份仍是手动导出（自动 iCloud 备份需要原生实现，列入下一步）。
- 运行 / 测试：Node 128 项（新增 5 项）、Python 12 项；40 套浏览器 E2E：全量跑 37 套通过，v31 / v67 单独重跑通过（时序抖动），browser.cjs 失败原因与本次改动无关——示例日按今天日期生成，日期变成 11-10 后示例日落在测试挑的 11-01（stash 掉改动也一样），测试改为挑一个空日期后通过。新增 v68 4 组通过。Linux 容器 + Chromium。
- 已知问题：镜像关闭后不再做跨标签页冲突检测；IndexedDB 写入是异步的，写失败只能事后提示（toast）；未在 iPhone WKWebView 实测 IndexedDB 容量与 persist()。
- 下一步：搜索、那年今天（本轮继续）。

### 2026-11-10 — V7.4 App 锁（4 位密码 + iPhone App 面容 ID）

- 需求：上一轮建议「App 锁」，用户回复「要」。
- 改动文件：新增 Public/js/app-lock.mjs（纯 JS SHA-256——iOS 自定义 scheme 不一定是安全上下文、crypto.subtle 可能不可用；makeLock 只存 `{v, salt, hash, grace, biometric}`；checkPin、readLock / saveLock（`little-days.lock`）、shouldRelock、pauseLeft：连续 5 次错误暂停 30 秒）；Public/app.js（启动时、绘制任何个人内容之前若有锁就 showLock("unlock")；锁屏是顶层 `<dialog id="lock-screen">`，#phone 设为 inert，Esc 不能跳过；模式 unlock / set / confirm / off / change；数字键盘 + 实体键盘；错误次数存 `little-days.lock-tries`，刷新不能绕过暂停；visibilitychange：「立即」在离开时就锁，其他在回来时按离开时长判断；设置隐私卡加 App 锁开关、离开多久后锁（立即 / 1 / 5 分钟）、面容 ID 开关（仅 iPhone App）、修改密码；「忘记密码？」如实说明无法找回；与 iOS 外壳通信：postMessage `{type:"unlock"}`、`{type:"state", on}`，回调 `window.littleDaysBiometricResult(ok)`）；styles.css（锁屏、键盘、抖动、离开时长）；i18n.json（lock.*）；whats-new.mjs（V7.4）；Native/Sources/LittleDaysUI/WebShell/LittleDaysWebShellView.swift（LittleDaysLockBridge：WKScriptMessageHandler + LAContext `.deviceOwnerAuthenticationWithBiometrics`，不提供系统密码回退、由网页键盘回退；启动脚本注入 `window.littleDaysBiometry`；LittleDaysPrivacy 让 SwiftUI 在 scenePhase 非 active 且锁开启时盖上「Little Days」封面，App 切换器不显示内容）；Native/LittleDays.xcodeproj/project.pbxproj（两个配置加 INFOPLIST_KEY_NSFaceIDUsageDescription）；tests/v74.test.mjs（4 项：SHA-256 与 Node crypto 一致、只存加盐哈希、读取 / 损坏忽略、重锁时机与暂停）；tests/v67-browser.cjs（6 组）；package.json；docs。
- 决策与原因：这是防止别人拿起手机随手翻看的「门锁」，不是对手帐数据加密（数据仍在本机 LocalStorage / IndexedDB，有设备访问和开发者工具的人仍能读取），已在文档中如实说明；忘记密码不提供绕过入口，否则锁形同虚设；面容 ID 默认随 App 锁一起打开（在 iPhone App 里）。
- 运行 / 测试：Node 123 项（新增 4 项）、Python 12 项、39 套浏览器 E2E 全部通过（新增 v67 6 组：设置两次、打开即锁且页面 inert、错误 / 正确、立即重锁、5 次错误暂停且刷新不绕过、忘记密码说明、关闭需密码、模拟 iOS 桥接的面容 ID）。Linux 容器 + Chromium；Swift 未编译。
- 已知问题：**Swift 代码未编译**（本容器没有 Swift / Xcode），面容 ID、App 切换器封面均未在 iPhone 上验证；网页版锁不加密数据；在线链接（Claude App 内）没有面容 ID，只有密码。
- 下一步：在 Mac 上用 Xcode 构建并真机测试面容 ID；考虑对 IndexedDB 媒体和 LocalStorage 做真正的加密（需要设计密钥管理，较大改动，需用户确认）。

### 2026-11-09 — V7.3 习惯「✎ 编辑」菜单（含删除）+ 修复图标跑出卡片

- 需求（用户 iPhone 截图：「我的习惯」页，图标在卡片外面）：「没有删除习惯的地方」。V6.7 的删除藏在「⋯」→ 编辑对话框底部，不容易发现。
- 发现的问题：V6.6 给书架「我的习惯」书写的 `.habit-book` 样式（grid、边框、内边距）和习惯行里原有的 `.habit-symbol.habit-book` 小书图标同名，导致小图标被挤出卡片、书本变空白。
- 改动文件：Public/app.js（书架那本改为 `habit-book shelf-habit-book`；「⋯」改为「✎ 编辑」按钮 `data-action="habit-menu"`，打开底部菜单：编辑习惯 / 删除这个习惯（红色）；edit-habit / delete-habit 打开前关闭菜单）；styles.css（`.habit-book` 书架样式改为 `.shelf-habit-book`；`.habit-more` 改成带边框的小按钮；习惯卡底部换行：一周圆点一行，次数 · 编辑 · 成长书一行）；i18n.json（habit.manage / manageShort / deleteHint）；whats-new.mjs（V7.3）；tests/v65-browser.cjs（编辑按钮 → 菜单 → 编辑、菜单直接删除（取消保留）、编辑表单里删除、图标在卡片内）；tests/v63-browser.cjs（书架选择器 `.shelf-habit-book`）。
- 运行 / 测试：Node 119 项、Python 12 项、38 套浏览器 E2E 全部通过（Linux 容器 + Chromium）；375 宽截图检查习惯页与菜单。
- 已知问题：未在 iPhone 真机验证。
- 下一步：看用户反馈。

### 2026-11-09 — V7.2 隐私：今日清单默认不进导出、首页可隐藏今天、设置里写清楚

- 需求：用户「还需要保护用户隐私」（上一轮刚把标着「私人」的今日清单画进了导出图片和给家人的 PDF）。
- 隐私检查结果（如实记录）：照片上传时用 canvas 重新编码（imageBlob），EXIF / GPS 不保留，只在重编码前读拍摄时间；Public/ 中没有任何第三方网络请求（只请求同源 shared/*.json、本地 blob）；测试事件日志 events.mjs 只保存白名单字段（数字、布尔、短 id），不含文字、名字或媒体引用。视频文件按原样存进 IndexedDB（可能带拍摄元数据，只在本机 / 用户自己的备份里）。
- 改动文件：Public/app.js（PRIVACY_KEYS / privacyOn / setPrivacy；`little-days.share-list` 默认关：exportOptionsFor 与导出图片只在打开时带今日清单；`little-days.hide-today`：todayPeekHTML 只显示「今天记了 N 页」的紧凑卡片；privacySectionHTML：隐私事实 + 两个开关，替换原「默认私人」卡；privacy-toggle 动作，日志只记 kind）；Public/js/personal-ui.mjs（settingsHTML 接受 extra.privacy）；styles.css（隐私卡、开关、隐藏卡片）；i18n.json（privacy.*）；whats-new.mjs（V7.2）；tests/v63-browser.cjs（默认导出 1350 高无清单、打开后变高、隐私卡文字、首页隐藏今天并仍可打开当天）；docs。
- 决策与原因：清单在阅读页标「私人」，导出却默认带上，前后矛盾，改为默认不带、需要时自己打开；首页隐藏是可选的，默认不改变现在的体验。App 锁（Face ID / 密码）需要 iOS 外壳配合，本轮未做，列入下一步。
- 运行 / 测试：Node 119 项、Python 12 项、38 套浏览器 E2E 全部通过（Linux 容器 + Chromium）；截图检查了设置隐私卡与首页隐藏卡片。
- 已知问题：没有 App 锁；视频元数据未清除；未在 iPhone 真机验证。
- 下一步：用户确认后在 iOS 外壳加 Face ID / 密码锁（打开 App、切回前台时）；导出视频前清除元数据。

### 2026-11-09 — V7.1 阅读页「今日清单」移到页面后面、改为简洁列表

- 需求（用户 iPhone 截图：某天阅读页上方的「今日清单」——两张大习惯卡 + 各自「写感想」+ 一行「✓ 健身」）：「今日清单planner checked在上面有点突兀」。
- 改动文件：Public/js/day-view.mjs（growthHTML：习惯和做完的事统一为 `.day-checklist` 里的 `.check-line` 行（✓ + 名字 + 分钟 / 细节 + 一句感想摘录 + 小照片），习惯行点开 check-view（有感想）或 check-note（没有）；去掉每条的大卡片和「写感想」链接；dayDetailHTML 中清单移到封面页和各页之后、「给这一天再记一页」之前）；styles.css（V7.1 紧凑清单样式）；whats-new.mjs（V7.1）；tests/v63-browser.cjs（清单在页面之后、✓ 行、无重复「写感想」）。
- 决策与原因：清单是一天的「收尾」，放在页面后面更自然，也和翻书页 / 导出（都在页面下方）一致；习惯和计划同一种样式，避免卡片层级不一致。
- 运行 / 测试：Node 119 项、Python 12 项、38 套浏览器 E2E 全部通过（Linux 容器 + Chromium）；截图确认清单在页面之后、点习惯行打开感想。
- 已知问题：未在 iPhone 真机看。
- 下一步：看用户反馈。

### 2026-11-09 — V7.0 首页「今天」卡片按照片滑动

- 需求（用户 iPhone 截图：首页「今天 · 17:09」一张樱花卡片）：「还不能scroll」。
- 原因：V6.7 的卡片是「一页一张」，用户今天只有一页（故事 / 照片页里有几张照片），所以只有一张卡、没有圆点、滑不动。用户最初要的是「preview 写过的话或者上传过的图片」。
- 改动文件：Public/app.js（todayPeekHTML 改为每张照片一张卡：页面背景照片、封面照片、照片图层各一张，带该页标题，第一张带该页文字；跳过跨页上的 `gen` 副本并按 mediaRef 去重；只有文字的页面一张横线纸卡；最多 12 张；点卡片打开当天并定位到那一页）；styles.css（滑动条加 `touch-action: pan-x pan-y`、`-webkit-overflow-scrolling: touch`）；whats-new.mjs（V7.0）；tests/v66-browser.cjs（第 4 组改为：一页 3 张照片 = 3 张卡、跨页副本不重复、文字页 1 张、圆点数一致、滑到第 3 张圆点跟随、点开当天）。
- 运行 / 测试：Node 119 项、Python 12 项、38 套浏览器 E2E 全部通过（Linux 容器 + Chromium）；截图确认第二张卡与圆点。
- 已知问题：未在 iPhone 真机确认滑动手感（Chromium 中通过 scrollTo 验证圆点跟随，截图检查）；视频不进卡片。
- 下一步：用户在手机上确认能滑；如需要可加左右箭头给电脑用户。

### 2026-11-09 — V6.9 planner 8 件 + 今日清单画进导出图片 / PDF

- 需求：用户回复上轮三个问题「保留； 要； 可以画出导入」——习惯保留（只在「我的习惯」+ 首页一行入口）；「今天要做的事」放宽上限；今日清单画进导出。
- 改动文件：Public/app.js（MAX_PLANS 5 → 8；新增 dayListItems(date)；翻书页 flip-checklist 改用它——顺带修复了原来用 `habit.name`（不存在）导致习惯名不显示的问题；exportOptionsFor 增加 withList → `dayList` / `dayListTitle`；导出图片时当天第一页带清单；PDF 循环里每天第一页带清单）；Public/js/export.mjs（renderJournalCanvas 末尾 withDayList：在 1080×1350 页面下方加一条奶油色清单条，虚线 + 胶带 +「今日清单」+ 勾选小标签自动换行，最多 13 条，不覆盖页面）；Public/js/book-share.mjs（buildPdf 每页按图片比例算高度，较高的页面不再被压扁）；i18n.json（plan.hint 8 件）；whats-new.mjs（V6.9）；tests/v63-browser.cjs（8 件上限、翻书页显示习惯名、导出 PNG 高度 > 1350）；tests/v53.test.mjs（PDF 高页）；docs。
- 决策与原因：清单画在页面下方而不是页面上，避免盖住照片和文字，也和翻书页「清单在页下」一致；只放在当天第一页，避免重复。9:16 分享图不加（那是「晒一页」，不是存档）。
- 运行 / 测试：Node 119 项（新增 PDF 高页）、Python 12 项、38 套浏览器 E2E 全部通过（v63 新增导出 PNG 带清单、翻书页显示习惯名、8 件上限）。Linux 容器 + Chromium；导出图片已人工查看截图。
- 已知问题：导出的清单用系统无衬线字体，不跟页面字体；视频导出不带清单；未在 iPhone 真机验证分享 / 保存。
- 下一步：看用户反馈；清单条是否也要跟纸张颜色。

### 2026-11-09 — V6.8 首页「今天要做的事」+ 更新记录搬进设置

- 需求（用户截图：首页「今天的小习惯」三行，带小书封面）：「这个其实是不同的书…我觉得没有必要弄习惯，相反这里我们可以是一个空白的框，然后用户可以放planner」；确认后：「更新记录可以作为一个section在setting里而不是占主页的位置，我觉得二可以换planner；我在想要留习惯吗」。
- 改动文件：Public/app.js（todayListHTML 改为 planner：标题「今天要做的事」、空白输入框、勾选 / 删除 / 搬昨天的，不再受 labsOn 控制，下面一行 `.today-habits-link`「我的习惯 · x/y 已完成 ›」；首页去掉 whatsNewCardHTML，齿轮 `.settings-gear` 有新版本时加 `.news-dot`；新增 newsSectionHTML：设置里「更新记录」section 放在主题之后，最新一版用 details 展开，打开设置即记为已看；删除 whats-new-dismiss）；Public/js/personal-ui.mjs（settingsHTML 接受 extra.news）；styles.css（planner、习惯行、红点、更新记录）；i18n.json（plan.title / plan.hint 改文案，news.new / news.all / news.dotLabel、habits.none）；whats-new.mjs（V6.8）；AGENTS.md（首页不再放更新卡片的规则）；tests/signed-in.cjs（touchStore、openHabits）；9 套测试里「首页打勾两次写入存储」改为 touchStore；browser / v3 / v40 / v42 / v54 / v65 改为在「我的习惯」里打卡；v63 第 1 组、v52 更新记录断言重写；docs（PRODUCT_SPEC、DESIGN_SYSTEM、ARCHITECTURE、ROADMAP、STRATEGY、README）。
- 决策与原因：用户问「要留习惯吗」——我的建议是**留，但不放首页**：已有用户的打卡、成长之书、每周回顾都在里面，删掉会丢数据和入口；首页只留一行入口和今天的完成数。planner 沿用任务 G 的边界（最多 5 件、不提醒、不自动顺延），只是从实验室拿出来给所有人。打卡和做完的事仍出现在当天的「今日清单」上。
- 运行 / 测试：Node 118 项、Python 12 项通过；38 套浏览器 E2E：全量跑 37 套通过，v45 发现首页横向多出 3px（planner 输入框不能收缩），加 `min-width: 0` 后重跑 v45 及 browser / v52 / v63 / v66 / v40 通过。Linux 容器 + Chromium。
- 已知问题：首页不再能一键打卡（要进「我的习惯」）；习惯是否完全隐藏 / 进实验室待用户决定；未在 iPhone 真机验证。
- 下一步：看用户是否要把习惯进一步收进实验室；planner 是否放宽 5 件上限。

### 2026-11-09 — V6.7 拖动互换照片、替换照片、杂志风格加强

- 需求（用户截图：拼贴风格封面里选中照片的工具条）：「还想要可以替换图片；杂志风格继续增强，两个图片可以通过拖动互换位置」。
- 改动文件：Public/app.js（图层工具条加「替换」；替换后在旧框内按新照片比例重算；拖动时标记目标照片、松手互换 swapPhotos；故事页传 folio / issue）；Public/js/scrapbook-layout.mjs（杂志：刊头小标 kicker、标题 24/21/19、页脚刊号、底部留白；跨页报头 + 期号 + 大号日期；partWord；boundText 支持 kicker）；Public/js/story-style.mjs（layerBox 文字按行数估高）；styles.css（swap-target 虚线、图层条不超出画布）；i18n.json（photo.swapped、photo.replaceShort）；whats-new.mjs（V6.7）；tests/v64-browser.cjs（新 3 组）；package.json；docs（DESIGN_SYSTEM、ARCHITECTURE、README）。
- 决策与原因：互换时不是简单交换 x/y，而是让每张照片按自己的比例放进对方的框，避免横竖图互换后被裁切；叠放顺序一起换，主图位置上的照片仍在上层。替换沿用已有的替换上传（包括照片编辑器），只补上入口和比例调整。
- 运行 / 测试：见下方验证。
- 已知问题：互换只在「自定义」（Studio）里可用，预览页是只读的；跨页上的照片是 Moment 照片的副本，替换跨页上的照片不会改 Moment 页；未在 iPhone 真机试触摸拖动互换（Playwright 用鼠标指针模拟）。
- 下一步：吸附对齐线、草稿恢复；跨页照片替换时可选「同时换掉那一页的」。
- 同一轮追加（用户中途四条消息）：
  - 「没找到哪里删除习惯的地方」：成长页每个习惯加「⋯」→ 复用新建习惯对话框做编辑（预填）+「删除这个习惯」（askConfirm，删除习惯、其打卡、页面上的 growth 卡片层）。
  - 「主题调色只在实验室；字体想加默认黑体 宋体 楷体」：themePickerHTML 不再受 labsOn 控制；library.mjs 新增 SYSTEM_FONTS（hei / song / kai 设备字体栈，楷体回退霞鹜文楷），fontOptions 和文字样式条最前；设置「字体与素材许可证」说明设备字体无需许可证（未确认 iPhone 是否自带楷体，已如实写回退）。
  - 「昨天忘了记录今天想记录昨天」：首页「忘了记？补记昨天」→ 昨天的记录面板；照片 EXIF 日期集中在过去某天时故事自动记到那天并提示；预览加日期选择（moveStoryTo：撤销当前生成、切到新日期重做）；上传时记录是否来自 EXIF。
  - 「这个不知道是什么」（封面编辑时纸下的「今天的标题和文字」框）：去掉封面的这张重复输入卡（文字在纸上输入）；7 套旧测试改为在纸上输入；同时发现并修复「纸上打字后撤销按钮仍是灰的」（inlineChange 首次记录历史时直接点亮撤销）。
  - tests/v65-browser.cjs（新 5 组：习惯编辑 / 删除、无实验室时的主题、黑宋楷、昨天照片自动记到昨天并改日期、首页补记入口）；v52 主题断言改为人人可见；v31 / v32 / v42 / v44 / v46 / v3 / browser 的封面输入改为纸上输入。
  - 「点开最好有窗口真是图库预览…取消的话…想回第一个界面」：「今天怎么记？」选「图库」时直接在面板里显示图库照片网格（quick-lib），点一张再「开始」，那张照片成为「照片 + 一句话」页的背景；没选照片就点开始会提示先选一张。网格行高用 `grid-auto-rows: max-content`（滚动容器里 auto 行会被压扁，测试时发现）。
  - 「这个的问题也是选择后取消了不会回首页而是到edit」（首页「选今天的照片」）：startQuickRecord 的「我的相册」路径改为先打开系统相册、选好照片后才 startPage（handleImageUpload 的 quick 分支里）；取消时什么都没开始：从首页来就留在首页，从「今天怎么记？」来就重新打开面板并保留原来的选择（input 的 `cancel` 事件）。不会再留下空白页。删除了上一版的 backToQuickSheet。
  - 「这个可不可以向右滑下面有点点 可以preview写过的话或者上传过的图片」：首页「今天」卡片改为横向滑动（scroll-snap）的 todayPeekHTML：每页一张卡（有照片显示照片，没有照片显示横线纸上的标题和文字），多于一页时下一张露出一点、下方圆点跟随；点卡片打开当天阅读页并定位到那一页（open-day + data-moment）。第一张保留 `.today-preview` 类名，旧测试不变。
  - 「颜色和大小调整的时候是分开调整，但是字体会一起变」：文字样式条换字体只改正在编辑的那一处：正文写入 `bodyFont`（已有字段，封面用过），标题改 `font` 时先把正文当前字体固定到 `bodyFont`；canvas 随手写 / 一句话页的正文、导出的一句话正文都读 `bodyFont || font`；Swift `JournalMoment` 增加可选 `bodyFont`。
  - 「Save 完我写的就回主页了我觉得正常是会给你看你写完的样子」：保存后（不是从阅读页进来编辑时）调用 showSavedPage：打开这页所在的手帐本「翻页」视图并翻到刚保存的那一页（故事流程本来就是这样）；找不到时才回首页。12 套旧测试里「保存后等首页」改为用 tests/signed-in.cjs 新增的 homeAfterSave（先等翻页出现，再点首页）；v58 断言改为保存后看到刚写的那页。
  - tests/v66-browser.cjs（新 5 组：首页选照片后取消留在首页且不加页、面板里取消回到面板、图库网格选图写一句、首页卡片滑动与圆点、字体只改标题或正文）。
  - 「什么叫Aa Just Write」：先改成笔图标 +「只写文字」，用户随后说「为什么要有Aa 不应该就是 Just Write吗」→ 最终去掉「Aa」和图标，文字保持「只写几句 / Just write」，按钮 title 提示「不放照片，在纸上写一页」（story.justWriteHint）。
  - 保存后在翻页视图里也会出现当天第一次记录的盖章庆祝（maybeCelebrate(true)）；从书架打开书时恢复用户自己选的列表 / 翻页视图（chosenBookView），不被保存后的翻页视图带过去（v32 回归时发现）。v55 的浮动保存断言改为看到刚写的那页。

### 2026-11-09 — V6.6 成长合并进「今天」（任务 G）

- 需求：用户「没有看到我们说的合并成长」——任务 G 已确认，上一轮我排到了下一轮；本轮实施。
- 改动文件：features.json（growth `inNav: false`）；Public/app.js（导航过滤、growth/journey 高亮书架；首页「今天」卡片内 todayListHTML：今天的小习惯 + 我的习惯链接 + 实验室「今天想做的事」；书架 habitBookHTML；成长页页头改名「我的习惯」并可返回书架；plan-add / toggle / remove / carry 动作与 Enter 键；翻书页第一页下方 flip-checklist）；Public/js/day-view.mjs（成长区改为「今日清单」便签并移到当天顶部，含做完的事）；styles.css；i18n.json（today.* / habits.* / plan.* / day.checklist，导览文字更新）；whats-new.mjs（V6.6）；Resources.swift（NavigationTab.inNav）、Models.swift（DayPlan、JournalState.plans）+ CoreTests；tests/signed-in.cjs（goTab / menu 的 "growth" 改为从首页卡片进入）；tests/v63-browser.cjs（新 6 组）；package.json；docs（PRODUCT_SPEC、ARCHITECTURE、ROADMAP、STRATEGY、README）。
- 决策与原因：今日清单做成读取打卡与计划的派生视图，而不是往页面里写贴纸图层——不改用户页面，也不会让空封面变成「有内容」从而挡住当天跨页的自动生成；代价是导出图片 / PDF 里还没有它（已记在未完成）。「今天想做的事」按任务 G 边界：≤ 5 件、无提醒、不自动顺延，放在实验室。
- 运行 / 测试：118 项 Node、12 项 Python、35 套浏览器 E2E 全部通过（v63 新 6 组：4 个 tab、首页打卡、我的习惯进出、实验室计划增删勾与上限 5、今日清单在日历与翻书页、昨天未完成只在点了之后搬过来；v52 的导航断言更新为 4 个 tab）。Linux 容器 + Chromium。
- 已知问题：今日清单还没画进导出图片 / PDF；首页卡片里的习惯行沿用原组件（卡中卡）；原生 SwiftUI 原型视图未改。
- 下一步：吸附对齐线、草稿恢复；今日清单进导出；看用户反馈再调首页卡片层级。

### 2026-11-09 — V6.5 Quick Create V2：Scrapbook 排版引擎 + 三种风格 + 更短的流程

- 需求：长需求「Quick Create V2 设计优化与差异化升级」：生成结果要像真正的 Scrapbook（主次、节奏、照片是主角、日期不抢戏、Wow），三种布局逻辑不同的风格（Minimal Editorial 默认 / Cozy Scrapbook / Playful Collage）一键切换并保留内容，流程改为「上传 → 自动分组 → 直接生成初稿 → 可选写字 → 保存」，预览里直接写 Moment 文字，Quick 与 Creative 同一份数据，手动调整不被未经确认覆盖，10 个场景验证并提供真实截图。另：用户对任务 G 回复「可以」（已确认，排到下一轮）。
- 改动文件：
  - Public/js/scrapbook-layout.mjs（新）：三种风格的构图（editorial 主图 + 行排列、cozy 拍立得散落、playful 拼贴打包）、当天跨页、frameHeight / fitPhoto（按相框内边距算高度，照片不裁）、textBlock / fitText（文字估算与缩小）、centreVertically、boundText、pickFont（中文用中文字体）。
  - Public/app.js：故事流程改为选完照片直接生成（一个 Moment 也走这里，不再进旧的单页结果页）；预览：页签、大画布（点画布写字）、风格三按钮、重新排版、写一句、调整分组、自定义、保存、放进哪本书；写字面板；换风格 / 重新排版对手动调整过的页先确认；保存时记录 page_done（实验日志）；自由编辑里改绑定文字写回 Moment。
  - Public/js/canvas.mjs、export.mjs：绑定文字、时间小标签（chip）、scrapbook 页不画旧的固定标题 / 照片占位 / 面纱。
  - Public/styles.css、i18n.json（story.style.* 等）、whats-new.mjs（V6.5）、Models.swift（layoutStyle；StickerLayer gen / bind / of / excerpt / prefix / chip，全部可选）+ CoreTests。
  - tests：v62.test.mjs（新 7 项，含 3 风格 × 1–12 张 × 3 种文字 × 3 变化的全量规则检查）；v60-browser 重写为 V2 流程（7 组）；v61-browser 重写为压力测试（10 张 / 4 个 Moment / 中英长文字，三种风格每页在浏览器里测量照片和文字都在页面内，5 页都能导出）；v51 / v52 / v53 改为新流程（原来测旧单页结果页）。
  - docs：ARCHITECTURE、DESIGN_SYSTEM（三种风格表）、PRODUCT_SPEC、ROADMAP、STRATEGY（任务 G 勾选已确认）、README；截图 `docs/images/quick-create-v2/`（公开示例照片，非用户数据）。
- 决策与原因：在现有图层模型上做（引擎只改照片位置并替换自己生成的图层，用户自己加的贴纸 / 文字保留），不重写；文字用「绑定」而不是复制，避免改字后页面不同步；单个 Moment 也走新流程，保证 1 张照片也好看；保留旧代码（旧的结果页、smart 布局、timeline 封面）以兼容旧数据和其他入口。
- 视觉检查（真实浏览器截图）：1 / 3 / 5 / 10 张照片和长文字，三种风格逐一看过并迭代：杂志单张改为通栏、内容少时居中、两张照片按六四分配；手账字体缺字改霞鹜文楷、跨页小字单行；拼贴单张放大、拼贴改为相接散开。
- 运行 / 测试：118 项 Node（新增 7 项排版引擎测试）、12 项 Python、34 套浏览器 E2E 全部通过（v60 V2 流程 7 组：直接出初稿、预览写字、三种风格保留内容、调整分组、手动调整保护、保存进书与日历、单张与放弃；v61 压力：10 张 / 4 Moment / 中英长文字三风格逐页测量无溢出、5 页导出 1080×1350；v51 / v52 / v53 更新为新流程）。Linux 容器 + Chromium。
- 已知问题 / 不足：杂志风格偏克制，Wow 感主要来自大主图，没有更强的版式元素（如大号引言、分栏线）；拼贴的叠放顺序不按时间；当天跨页最多 4 个 Moment；预览里改字后整页会重新排（手动调整过的页除外）；吸附对齐线、草稿恢复、长按拖动分组尚未做；未在 iPhone 真机验证字体和触控；视频 / 录音只做了排版规则和单测，没有在故事流程里实际添加视频。
- 下一步：任务 G（成长合并 + 今天想做的事）；P0 ③ 的吸附线和草稿恢复；杂志风格再加一两个强版式。

### 2026-11-09 — V6.4 排版引擎 v2 第一部分（Quick Create v3 · P0 ②）

- 需求：用户「可以开始」，并问成长合并和 planner 需要确认什么（已在回复里列出任务 G 的两条确认项，未开发）。
- 改动文件：
  - library.json 新增 `kits`（cream / blush / sage / kraft：纸张、标题字体、句子字体、墨色、强调色、3 枚贴纸、playful）；Resources.swift `StoryKit` + `AssetCatalog.kits`；Models.swift：JournalMoment.kit、StickerLayer.deco（可选）；CoreTests。
  - Public/js/story-style.mjs（新）：kitList / findKit / kitForBook（书的颜色 → 套装）/ applyKit（纸张、字体、墨色，不动照片）/ firstLook（1 张 → 大图，2–5 张按套装风格，更多 → 整齐）/ decorate（≤ 2 枚，只放在与照片、文字、标题条都不重叠的角落，重做时替换不累加）/ captionFit（长句缩小、最多两行）。
  - day-story.mjs：封面时间线用套装的字体和颜色；长句略缩小；日期两行间距加大。
  - app.js：故事生成时套用套装、第一眼规则和装饰；换一种后重新装饰；预览加「配色」4 个色点，一次改整天；单页快速结果也套用书的套装和装饰。
  - canvas.mjs / export.mjs：标题条按 captionFit 缩小或两行（屏幕与导出一致）；**修复导出文字图层**：按图层自己的宽度、左中右对齐和垂直居中绘制（之前固定 700px 宽、从左边起画，时间线封面导出会错位）。
  - styles.css、i18n.json（story.kit）、whats-new.mjs（V6.4）、tests/v61.test.mjs（新 6 项）、tests/v61-browser.cjs（新 4 组）、package.json、docs。
- 决策与原因：套装跟书的颜色走，让一本书里的日子风格统一；装饰宁可不放也不压内容；胶片条 / 文字卡 / 杂志三个新模板本轮没做（需要改标题条和导出的位置，单独做更稳），已如实标在 ROADMAP。
- 运行 / 测试：111 项 Node（新增 6 项）、12 项 Python、34 套浏览器 E2E 全部通过（v61：整天同一套配色、单张大图、每页 ≤ 2 枚装饰；换配色一次改整天并重建封面字体和贴纸；长句两行标题；保存后封面导出 1080×1350）。另外用截图检查了 3 套配色的封面和页面、导出的封面图片（文字位置与屏幕一致）。Linux 容器 + Chromium。
- 已知问题：「换一种」和换配色会重建封面（还没有钉住手动调整，属于 ③）；牛皮纸套装原用龙藏体太细，改为站酷小薇；未在 iPhone 真机看字体效果。
- 下一步：P0 ③ 自动与手动共存（钉住、吸附线、草稿恢复）；之后补三个新模板。

### 2026-11-09 — V6.3 今天的故事（Quick Create v3 · P0 ①）

- 需求：用户「我喜欢新设计的六屏」；按 docs/QUICK_CREATE_PLAN.md 的顺序先做 P0 ①。（我发的确认问题被用户关掉，按「先做 ①，底部导航和成长合并留给任务 G」的默认推进，在回复里说明。）
- 改动文件：
  - Public/js/exif.mjs（新）：读 JPEG EXIF DateTimeOriginal（IFD0 → Exif IFD；读不到用文件时间）；`photoTime(file)` 在 `imageBlob()` 缩图前调用。
  - Public/js/day-story.mjs（新）：groupByTime（间隔 > 90 分钟分开，无时间的照片跟在前一张后面）、movePhoto / splitAt / removePhoto（纯函数）、clockLabel、partOfDay、timelineLayers（封面时间线 = 普通照片层 + 文字层，左右交错、按原比例不裁切、超过 5 个 Moment 显示「还有 N 个」，3 种样子）。
  - Public/app.js：首页「今天有什么值得记录？」卡片（today-photos / today-write 直接开始；「其他方式」仍是原来的面板）；照片上传记录拍摄时间，分成 ≥ 2 组时进入 story 页面（分组 → 每组一句 → 预览），否则保持原来的一页结果页；预览页签、换一种（封面 3 种、页面沿用 smart 3 种）、自己调整（进 Studio，‹ 回到预览，保存直接进书）、往回再生成不会重复；保存后打开书的翻页并翻到这一天；离开第一步不留下任何页。
  - Public/js/canvas.mjs、export.mjs：封面 `layoutTemplate: "timeline"` 时不画默认标题 / 正文 / 心情 / 照片占位。
  - Public/styles.css、i18n.json（story.*）、whats-new.mjs（V6.3）、Models.swift（JournalMoment.capturedAt 可选）+ CoreTests、package.json、tests/exif-fixture.cjs（新：给公开示例照片加合成 EXIF 时间）、tests/v60.test.mjs（新 4 项）、tests/v60-browser.cjs（新 7 组）。
- 决策与原因：封面做成普通图层而不是新的渲染模板，这样阅读、导出、PDF、翻页、自由编辑全部直接可用；自动封面只在封面为空时写入；分组里挪照片先用「点选 + 前一个 / 后一个」，长按拖动留到 P1（更稳，测试更可靠）。
- 运行 / 测试：105 项 Node（新增 4 项：EXIF、按时间分组、挪照片 / 分开 / 去掉、封面时间线）、12 项 Python、33 套浏览器 E2E 全部通过（v60：首页 → 选 5 张带拍摄时间的照片 → 分成 3 个 Moment → 挪照片再挪回 → 两组写一句 → 封面 + 3 页 → 换一种 → 自己调整再回来 → 回到写一句再生成不重复 → 保存进书并翻到封面 → 日历里显示 → 第一步离开不留页 → 同一时段照片仍是一页）。Linux 容器 + Chromium；未在 iPhone 真机验证。
- 已知问题：网页上 iPhone 照片的 EXIF 时间是否保留未在真机验证（读不到时整组按选择顺序成一页）；主题套装、文字适配、钉住手动调整属于 P0 ② ③，还没做；封面「换一种」会重排封面图层（还没有钉住保护）；底部导航仍是 6 个。
- 下一步：P0 ② 排版引擎 v2，P0 ③ 自动与手动共存。

### 2026-11-09 — 查看方式改为固定链接；差异化与 Quick Create v3 方案（仅文档，待确认）

- 需求：①「Windows 使用 localhost:8080 交互预览」这块改为继续用 claude 固定链接看修改后的 App；②长篇需求「产品差异化战略与 Quick Create 核心体验升级」：本轮不大规模写代码，先检查仓库、批判性分析差异化、设计 Quick Create 旅程和页面、Auto Layout 方案、优先级、验证实验，回答三个问题，等确认后再实施。
- 改动文件：AGENTS.md（新增长期规范：查看方式统一为 claude.ai 固定链接，localhost 仅备用；六项回复第三项改为「在线链接（Claude 固定链接）与查看方式」）；README.md（固定链接为标准查看方式，localhost 改为备用；文档表加 STRATEGY / QUICK_CREATE_PLAN）；docs/ARCHITECTURE.md（同上，并加技术增量提案）；docs/QUICK_CREATE_PLAN.md（新，完整方案）；docs/PRODUCT_SPEC.md、DESIGN_SYSTEM.md、ROADMAP.md（提案指向，标注未实施）；agent.md 当前状态里的查看方式。
- 设计稿：新建 claude.ai 设计画布 https://claude.ai/artifact/Ex4FbaCRPNx9HZXNcuDuyt （6 屏 iPhone 高保真，可点击跳转；照片用 App 自带的 Unsplash 示例图）。
- 关键发现（来自代码）：Quick Create 已有一半（多照片、按形状不裁切、3 种样子、结果页）；缺多 Moment 一次完成、页面层次、统一套装、钉住手动调整；`imageBlob()` 用 canvas 重编码会丢 EXIF，按时间分组要先读；结构化字段 `fieldValues` 在「一天」上而不是「一页」；`bookId` 单值；app.js 5,911 行。
- 决策与原因：建议「封面时间线 + 每个 Moment 一页」而不是把一天塞进一张 4:5 的页（手机上太挤、排版不可控）；规则式排版，不用生成式 AI；所有新字段可选、不迁移。
- 运行 / 测试：只改文档，没有改 App 代码，没有运行测试。
- 未完成：全部实施项等用户确认（QUICK_CREATE_PLAN §12）；竞品中 Day One 是否仍提供打印成书未核实；网页上 iOS 照片 EXIF 是否保留未核实。
- 下一步：用户确认后按 P0 ① → ② → ③ 开发。

### 2026-11-09 — 竞品补充：My Diary（文档）

- 需求：用户发来 My Diary 的 App Store 截图（时间线、照片 / 视频 / 录音、贴纸），问「这个非常像我想的怎么办」。
- 做了：网上查公开资料（apps.apple.com 在本会话网络里无法直接打开，只能用搜索结果和第三方统计），在 docs/STRATEGY.md 竞品表加一行：它是什么、价格、规模（约 420 万安装；「5000 万」未核实）、和我们的重叠与差异、我们该补的基本功（锁、备份）。
- 结论（建议，未改代码）：不转向、不照抄；它验证了需求，但「日记 + 附件 + 日历」已是标配，我们的差异是照片自动成页 → 一本可以翻、可以给家人看的书。建议用户亲自装一遍 30 分钟做对比。
- 未完成：没有真机体验它；它的具体排版和留存数据未知。

### 2026-11-09 — V6.2 更多音乐风格、音量、整本书的音乐；成长合并与 planner 提案

- 需求：用户觉得 5 首都不错，钢琴 / 更欢快 / 咖啡馆风格都想要；同意加音量和「整本书配一首音乐」；另外请从产品角度看 Little Growth 能否合并、planner（提前写今天要做的事再打勾）是否和核心冲突。
- 改动文件：
  - tools/make_music.py：新增钢琴（双弦失谐、拉伸泛音、琴槌声）、钢片琴、低音提琴、拍手、鼓刷、叮叮镲、咖啡馆背景声，循环卷积混响（保持无缝循环）；新增 morning-piano、sunny-day、cafe-corner 三首；可只生成指定曲目（旧 5 首未重新生成，文件不变）。
  - Resources/Music 3 个新 mp3；library.json `music` 增至 8 首；许可声明补充乐器描述。
  - Public/js/music.mjs：loadVolume / saveVolume（`little-days.music-volume`）、播放器 setVolume；bookMusic、pageMusic；dayMusic 回退到书的音乐。
  - Public/app.js：选曲面板分「这一页 / 这本书」两种（data-target），面板顶部音量条；书的页面「♫ 给这本书配音乐 / 换一首」；syncMusic：书打开（列表或翻页）放书的音乐，翻到有自己音乐的页放那一页的；导出视频用页面或书的音乐和用户音量。
  - Public/js/day-view.mjs、export.mjs（音量）、styles.css、i18n.json（music.volume / music.book*）、whats-new.mjs（V6.2）。
  - Models.swift：JournalBook 新增可选 `music`；CoreTests（书的音乐、目录 8 首）。
  - docs/STRATEGY.md 新增任务 G（成长合并 + planner 边界，待确认）；ASSETS、ROADMAP、PRODUCT_SPEC、ARCHITECTURE 更新。
  - tests：v57.test.mjs（+2 项）、v57-browser（8 首）、v59-browser.cjs（新）、package.json。
- 决策与原因：音量是「这台设备」的设置而不是每页一个（像系统音量一样直觉，也避免每页都要调）；书的音乐是兜底，页面自己的音乐优先。成长合并会改导航、属于较大改动，planner 牵涉定位，所以只写方案（任务 G）等用户确认，没有开发。
- 验证：新 3 首 ffmpeg 响度 -17.2～-17.8 LUFS、峰值 ≤ -4.0 dBFS；「晴天」「咖啡馆一角」第一次低频过重，已调低贝斯和底鼓重新生成。101 项 Node、12 项 Python、32 套浏览器 E2E 全部通过（v59：书的页面选音乐 → 存在书上 → 打开书就播放；音量条 30% 生效并记住；翻页时没有自己音乐的页放书的音乐、有自己音乐的页放自己的；看这本书里的某一天放书的音乐；离开即停；可以去掉书的音乐）。仍未由人试听、未在 iPhone 上播放。
- 已知问题：同 V6.0（循环点可能有极短 MP3 间隙；未真机验证）。
- 下一步：等用户确认任务 G 后，再做「今天」卡片 / 我的习惯书 / 今日清单贴纸。

### 2026-11-09 — V6.1 在阅读的地方直接编辑

- 需求（用户截图，翻页看书的一页）：「现在这个 edit 要去那天然后找到这个 page 然后 edit，可以直接 edit 吗」。
- 改动文件：Public/app.js（翻页每页加「✎ 编辑这一页」= 已有的 read-edit 动作；read-edit 记住来源 readReturn {page, book, date, moment}，保存 / ‹ 时 returnToReading 回到同一本书的同一页或同一天并滚到那一页；openStudio 与 navigate 清空 readReturn，避免旧的返回点）；Public/js/day-view.mjs（阅读一天时，自己的封面和每一页页眉加「✎ 编辑」，示例页不显示）；Public/styles.css（chapter-edit、flip-actions、flip-edit）；Public/js/whats-new.mjs（V6.1）；tests/v58-browser.cjs（新）、package.json。
- 决策与原因：复用已有的 read-edit（打开当天 + 选中那一页），不新建编辑路径；示例页不给编辑按钮，因为 openStudio 对示例日从空白页开始，点了会让人以为内容丢了。从 ＋ 新写的页保存后仍回首页（印章时刻在首页）。
- 运行 / 测试：99 项 Node、12 项 Python、31 套浏览器 E2E 全部通过（v58：翻页中「✎ 编辑这一页」打开那一页 → 改标题保存 → 回到同一本书同一页且显示新标题；‹ 也回到同一页；示例页没有 ✎、自己的页都有；阅读一天时「✎ 编辑」→ 保存 / ‹ 回到这一天；从 ＋ 新写仍回首页）。Linux 容器 + Chromium。
- 已知问题：书的「列表」视图点某一天仍是先打开那一天（一天可能有好几页）；从阅读页进入编辑后保存，不会在首页出现连续记录印章（回首页时才出现）。
- 下一步：用户试用后决定列表视图要不要也加直接编辑。

### 2026-11-09 — V6.0 推荐背景音乐（原创轻音乐，可加到页面）

- 需求：「能不能有推荐的背景 sofi 音乐让用户可以加」（理解为柔和的 lofi 背景音乐）。
- 约束：AGENTS.md 禁止擅自抓取流媒体歌曲；PRODUCT_SPEC 要求只用原创/明确授权音频。因此没有下载任何网上音乐，而是自己作曲合成。
- 改动文件：
  - tools/make_music.py（新）：numpy 合成 + ffmpeg(libmp3lame 96k) 编码，固定随机种子；FM 电钢琴、Karplus-Strong 拨弦、八音盒、铺底、噪声鼓、雨声/海浪/黑胶噪声，尾音回绕实现无缝循环，整体 -19 dBFS RMS 归一 + 轻微磁带抖动。
  - Resources/Music/LD-music-{afternoon-coffee,rainy-window,little-walk,good-night,seaside}.mp3 + LittleDays-Original-Music.txt；library.json 新增 `music`（id、中英文名、心情、bpm、秒数、来源、许可）。
  - tools/preview.py、tools/build_link.py、Resources.swift（MusicAsset、libraryData "music"）、LittleDaysWebResources.swift（mp3 MIME）：三个入口都能提供 `library/music/`。
  - Models.swift：JournalMoment / JournalEntry 新增可选 `music`；CoreTests 加解码与目录检查。
  - Public/js/music.mjs（新）：目录辅助函数、dayMusic、musicChipHTML、共享播放器（blob URL，单例，循环）。
  - Public/app.js：选曲面板（试听 / 用这首 / 不要背景音乐）；入口在「♫ 声音」菜单和快速结果页「♫ 配乐」；写作页上方显示「♫ 曲名 换一首」；阅读一天、翻书时 syncMusic 自动播放，chip 暂停/播放（暂停后在同一天/同一本书内不再自动恢复），离开即停；导出视频传入音乐。
  - Public/js/day-view.mjs：日期标题下的「♫ 曲名」；与当天音乐不同的页在页眉有自己的 chip。
  - Public/js/export.mjs：视频导出混入循环音乐（有其他声音 0.35，只有音乐 0.8 且 15 秒），结尾 1.5 秒淡出。
  - Public/styles.css（music-chip、music-sheet 等）、i18n.json（music.*）、whats-new.mjs（V6.0）、docs（ASSETS、ARCHITECTURE、ROADMAP、PRODUCT_SPEC、DESIGN_SYSTEM）。
  - tests/v57.test.mjs（新，5 项）、tests/v57-browser.cjs（新，5 组）、tests/test_preview.py（mp3 MIME）、package.json。
- 决策与原因：音乐存在「页」上（与 PRODUCT_SPEC 一致），阅读一天时只放一首（封面优先，否则第一页的），避免一屏里几首抢着放；写作时不自动播放，免得打扰。播放器用 blob URL，是因为 WKWebView 的自定义 scheme 不支持音视频的分段请求。版本号用 6.0 而不是 5.10（更新记录按数字排序，5.10 会排在 5.9 后面）。
- 验证：我在容器里无法亲耳试听；用 ffmpeg ebur128 检查五首响度约 -17.5～-18.3 LUFS、峰值 ≤ -3.7 dBFS（无削波），并检查频段分布（第一次太闷、「散步」低频过重，已调整重新生成）。99 项 Node、12 项 Python、30 套浏览器 E2E 全部通过（v57：选曲试听 → 保存在页上 → 写作时不播放 → 阅读这一天自动播放、可暂停、离开即停 → 翻书到该页播放 → 其他声音开始时暂停且不自动恢复 → 只有音乐的页面导出约 15 秒视频且解码后有声音）。v37、v52 因「声音」菜单多了一项、快速结果页多了「配乐」按钮而更新了预期。Linux 容器 + Chromium。
- 已知问题：没有音量滑块；没有「整本书一首音乐」；翻到没有音乐的页会继续放上一首；音乐循环点可能有极短的 MP3 编码间隙；未在 iPhone 真机 / WKWebView 验证播放与自动播放策略。
- 下一步：请用户在链接里试听，按喜好调整曲风或增加曲目；可加音量和整本书音乐。

### 2026-11-09 — V5.9 书的详情页：列表 / 翻页两种看法

- 需求（用户截图，书的详情页列表）：「能不能可以选择这样也可以选择像书一样翻页」。
- 改动文件：Public/app.js（书详情页加「列表 / 翻页」切换，存 `little-days.book-view`；flipBookHTML：封面页 + 每页只读画布 + 日期/时间/示例标记 + 「打开这一天」；turnPage、左右滑动（|dx|>50）、键盘左右键；`book-view` / `flip` 动作）；Public/js/book-share.mjs（bookSharePages 增加 `includeDemo` 选项，阅读包含示例，分享默认仍排除）；Public/styles.css（切换按钮、书页、书脊阴影、翻页动画，尊重 reduced-motion）；Packages/LittleDaysCore/.../i18n.json（flip.* 中英文）；Public/themes.css（sync_tokens 新增一个颜色变量）；Public/js/whats-new.mjs（V5.9）；tests/v55.test.mjs（includeDemo）、tests/v56-browser.cjs（新）、package.json（test:browser:v56）。
- 决策与原因：翻页复用分享 PDF 的页面顺序（同一个 bookSharePages），保证「看到的」和「分享出去的」顺序一致；阅读时示例也显示并标注，避免新用户打开空书；照片 + 一句话 / 智能排版 / 随手写的页不再在页面上方重复标题。没有新增数据字段，只新增一个本机界面偏好键。
- 运行 / 测试：94 项 Node、12 项 Python、29 套浏览器 E2E 全部通过（v56 新增：默认列表 → 切到翻页 → 封面 → 下一页带翻页动画 → 滑动 → 键盘左键 → 打开这一天 → 刷新后仍是翻页）。Linux 容器 + Chromium；未在 iPhone 真机验证滑动手感。
- 已知问题：翻页动画是单页 3D 旋转，不是真实的纸张卷曲；大书（上百页）一次只渲染当前页，未做预加载。
- 下一步：日历阅读页隐藏重复标题；「目录」并入「整理这一天」；F5 数据可靠性；F6 原生最小闭环。

### 2026-11-09 — V5.8 照片不裁切、保存浮动按钮、示例不再变成自己的封面

- 需求（用户截图，日历里一页猫的照片）：上传后照片被自动裁切，可能漏掉一部分；上传后保存按钮在最下方；上传完封面还是示例图和示例文字。
- 原因：①「照片 + 一句话」用自己的照片时，照片是整页背景（cover 铺满），竖图会被裁掉上下；smart 的「大图」样子是 100% 满版也会裁。②写作页顶部的「保存」随页面滚走，下面只看得到「保存草稿」。③今天的示例当日页（sample-today）在 openStudio 时被直接当作编辑内容，保存后变成了用户自己的封面（isDemo 变 false，示例标题和咖啡图留着）。
- 改动文件：Public/js/canvas.mjs（自己的照片做背景时：模糊铺底 + 整张 contain 显示）；Public/js/export.mjs（导出同样处理，有 ctx.filter 时模糊，否则淡化）；Public/js/smart-layout.mjs（单张「大图」按原比例占满页面，不裁）；Public/app.js（openStudio 遇到示例日从空白页开始；浮动保存 float-save + IntersectionObserver；save-float 动作）；Public/js/model.mjs（迁移：标题、正文、照片都与示例完全一致的 sample-today 封面清空，页保留）；Public/styles.css（own-backdrop、smart 标题条层级、float-save）；Public/js/whats-new.mjs（V5.8）；tests v52.test、v55.test、v55-browser、v34、v50。
- 决策与原因：一开始试过把顶部栏固定，但手机上顶部栏 + 固定的页面 + 底部工具栏会把中间挤没，导出等按钮点不到（测试暴露），所以改为只在顶部保存看不到时浮出一个小「保存」。迁移只清理与示例文字和图片完全相同的封面，避免误删用户改过的内容。
- 运行 / 测试：93 项 Node、12 项 Python、28 套浏览器 E2E 全部通过（v55 新增：示例日写作从空白页开始、保存后无示例文字和图片、自己的竖图整张显示、浮动保存）。Linux 容器 + Chromium；未在 iPhone 真机验证。
- 已知问题：日历阅读页里「照片 + 一句话」的页，标题会在页面上和页面上方各出现一次（上方是可编辑的标题）。
- 下一步：考虑阅读页隐藏重复标题；F5 数据可靠性；F6 原生最小闭环。

### 2026-11-09 — V5.7 宽松连续记录 + 印章时刻；阅读一天时改标题 / 编辑 / 删除

- 需求：用户截图（日历里阅读某一页显示「Untitled page」）：想双击加标题，阅读时也能删除或编辑；另外觉得大家没有动机记录，希望有像 Duolingo 连续天数动画那样的鼓励机制。
- 判断：Duolingo 的连续主要靠「怕断」，手帐里容易变成压力、断了就放弃（STRATEGY 风险 2：可能是事件型）。所以做宽松版：每周可休息 1 天不断、示例不计、没有惩罚和提醒轰炸；在 30 天实验里用 `celebrate` 事件和访谈验证是激励还是压力。
- 改动文件：新增 Public/js/streak.mjs（recordedDays、streakInfo 含休息日规则、bestStreak、MILESTONES）；Public/js/day-view.mjs（每页右上「⋯」、标题可编辑 / 未命名显示「＋ 加标题」、封面也有「⋯」）；Public/app.js（首页连续小标签 streakChipHTML、印章弹窗 openStreak、回到首页时每天一次 maybeCelebrate、阅读页标题编辑 startTitleEdit（双击；未命名点一下）、页面菜单 openPageMenu（编辑这一页 / 改标题 / 删除这一页或清空封面）、deleteReadPage（保存版和草稿同步））；Public/styles.css（标签、印章、纸片飘落、周圆点，遵守减少动态效果设置）；Public/js/whats-new.mjs（V5.7）；i18n.json；tests/signed-in.cjs（老测试跳过印章）；新增 v55.test.mjs、v55-browser.cjs；package.json；docs/STRATEGY.md。
- 功能：
  - 首页标题下「连续 N 天 · 本周 M 天」（今天已记为绿色）；点开看本周圆点、离下一个里程碑还差几天、最长连续，以及「去记一页」。
  - 每天第一次在今天记下内容后回到首页：弹出「连续 N 天」印章（落下盖章的动画）、纸片飘落、本周圆点依次点亮；3 / 7 / 14 / 30 / 50 / 100 / 200 / 365 天有专门的话。每天只弹一次（本机记 little-days.celebrated）。
  - 阅读一天：没标题的页显示「＋ 加标题」点一下就能写，有标题的双击修改，回车或点别处保存（保存版和草稿都更新）；每页右上「⋯」：编辑这一页（打开写作页并选中这一页）、改标题、删除这一页（确认后）；封面的「⋯」是编辑 / 清空封面。
- 运行 / 测试：92 项 Node、12 项 Python、28 套浏览器 E2E 全部通过（v55：连续标签、查看不撒花、今天第一页后印章 + 3 天里程碑、只弹一次、事件记录、加标题 / 双击改标题、⋯ 编辑打开该页、⋯ 删除）。Linux 容器 + Chromium；动画在 iPhone 真机上的流畅度未验证。
- 已知问题：连续只按「有内容的日期」计算，补记过去的日子也会补上连续（宽松的设计选择）；没有推送提醒（需要原生）。
- 下一步：30 天实验里看印章与留存；F5 数据可靠性；F6 原生最小闭环（含晚间提醒）。

### 2026-11-09 — V5.6 选中样式更轻、去掉重复选项、成长打卡标签重新设计

- 需求（用户截图）：选中元素时的白色方块（缩放手柄）和圆圈（旋转）太突兀；手帐本、Media 等在页面上有重复的选择（纸上方「记到」和底部「手帐本」都能选书，底部「声音」和纸下「视频 / 声音」重复）；插入的打卡卡片不好看、有点突兀。
- 改动文件：Public/styles.css（选中：1px 细线 + 两个 12px 小圆点，手机上用看不见的更大触控区；成长卡片改为柔和底色的标签，带对勾和纸胶带，去掉边框）；Public/js/canvas.mjs（成长卡片用对勾代替 emoji 图标）；Public/js/export.mjs（导出同样的标签样式）；Public/app.js（底部工具栏：「手帐本」只在当日页的手帐本有自定义字段时出现，名为「记录项目」，只含字段；「声音」只在页面已有视频 / 声音（或正在录音）时出现；连续插入的打卡错开位置和角度）；Public/js/whats-new.mjs（V5.6）；i18n.json；tests browser、v3、v31、v32、v33、v34、v54。
- 决策与原因：每个选择只在一个地方出现：书在纸上方，添加媒体在纸下方，工具栏只做装饰和已有内容的管理。手柄放在元素角落内侧，因为部分相框会裁掉伸出的部分。
- 运行 / 测试：88 项 Node、12 项 Python、27 套浏览器 E2E 全部通过（v54 新增：工具栏无重复的书 / 媒体工具、打卡标签无 emoji 和边框、手柄是小圆点）。Linux 容器 + Chromium；未在 iPhone 真机检查小圆点的触控手感。
- 已知问题：「目录」工具仍保留（含复制、折叠、单独保存这一页等功能），与「整理这一天」部分重叠，后续可以合并。
- 下一步：合并「目录」和「整理这一天」；F5 数据可靠性；F6 原生最小闭环。

### 2026-11-09 — V5.5 书架拖动排序、纸上文字样式条、成长打卡先看后改、更多示例

- 需求（用户截图反馈）：①书架想拖动排序，顺序也显示在首页；②成长里点「已写」直接是编辑，想先看像书一样的内容，书的图标可以放大；③点纸上的标题想直接出现字体选项，下面的「文字」以为是调整、其实是新增文字框；④希望 App 里示例多一些，看看大概的样子。另外修了截图里英文书名在书脊上逐字竖排的问题。
- 改动文件：Public/js/model.mjs（moveBookTo、stepBook、addSampleDays、removeSamples，Store 载入时一次性加入示例）；Public/js/canvas.mjs（styleExtra：页面标题 / 文字的字号和颜色）；Public/js/export.mjs（导出同样的字号颜色）；Public/js/day-view.mjs（示例页标「示例」）；Public/app.js（书脊拖动、点击抑制、往前放 / 往后放、拉丁书名横排、文字样式条 type bar、成长打卡阅读视图 openCheckView、习惯图标变成小书、示例卡与移除）；Public/js/whats-new.mjs（V5.5）；Public/styles.css；i18n.json；seed.json（sampleDays、samplesVersion）；Models.swift（Moment.textStyle / bodyStyle、Entry.bodyStyle，均可选）与 CoreTests；tests v54.test.mjs、v54-browser.cjs，以及 v31、v32、v40、collab 选择器更新。
- 功能：
  - 书架：电脑上按住书脊拖动；手机上按住约 0.3 秒再拖（快速滑动仍然是滚动页面），被拖的书会抬起并跟随手指，旁边有绿色竖线标出放下的位置；放下后顺序保存，首页「书架」一排同样顺序。抽出一本书后有「‹ 往前放 / 往后放 ›」。英文书名沿书脊横排。
  - 纸上文字：点标题、文字或文字框，下方浮出样式条：黑体 / 宋体 / 文楷 / 快乐体 / 小薇 / Caveat、A− / A+、6 种颜色；光标留在原处可以继续打字，每次点击都可撤销，页面不会移动。标题和文字分别记住字号颜色（textStyle / bodyStyle），字体作用于整页；文字框改自己的字体字号颜色。「文字」按钮改名「加文字框」。
  - 成长：写过的打卡按钮点开是阅读卡片（日期、心情、内容、照片、感想），里面有「编辑」和「成长书 · N 页 ›」；习惯图标变成更大的小书（带页数），点它直接打开成长书；成长页底部入口改成「成长书 · N 页 ›」。
  - 示例：6 个示例日（周末咖啡、读书、做披萨、草莓、湖边清晨、旅途、雨天、海边、书桌、早午餐），分布在三本书，用照片库的照片，展示按照片形状排版、照片 + 一句话、随手写三种页面。只加到没有记录的日期，标「示例」，不会被分享成 PDF，设置里「移除所有示例」后不会再加回来。
- 决策与原因：拖动用按住才开始，避免和滚动冲突；拖完吞掉紧跟的一次点击，新的按压会取消这个状态。样式条浮在页面下方、不占位置，否则显示 / 隐藏时页面跳动会打断点击（测试也暴露了这一点）。示例不计入真实打卡，避免影响成长统计。
- 运行 / 测试：88 项 Node、12 项 Python、27 套浏览器 E2E 全部通过（v54：拉丁书脊、鼠标拖动排序 + 首页同步、点击仍抽书、往前放 / 往后放并保存、打卡先看后改、小书入口、样式条字体 / 字号 / 颜色且光标不丢且页面不动、示例添加与移除）。Linux 容器 + Chromium；**手机上按住拖动只用桌面鼠标测过，没在 iPhone 真机触屏上验证**。
- 已知问题：拖动时其他书不会实时让位，只用竖线标出位置；样式条的字体只作用于整页（标题和文字一起）。
- 下一步：真机检查按住拖动的手感；F5 数据可靠性；F6 原生最小闭环。

### 2026-11-09 — V5.4 一个人记，家人看：整本书分享成 PDF、推荐「我们俩」「宝宝成长」、加照片意向测试

- 需求：用户喜欢书架用于情侣共同记录和父母记录亲子；讨论后同意「一个人记、其他人看」更可能是真实情况。
- 改动文件：新增 Public/js/book-share.mjs（bookSharePages 按日期排页、limitPages、dateRange、最小 PDF 写入器 buildPdf，无第三方库）；Public/js/export.mjs（导出 renderJournalCanvas、新增 renderBookTitleCanvas 标题页）；Public/app.js（exportOptionsFor、shareBook 进度 / 系统分享 / 下载回退、suggestedBooksHTML / openSuggestedBook、openContributeQuestion、动作 book-share / book-suggest / contribute-interest）；Public/js/whats-new.mjs（V5.4）；Public/styles.css；i18n.json（bookShare.*、contribute.*、suggest.*、category.Relationship）；tests v53.test.mjs、v53-browser.cjs，package.json；docs ROADMAP、STRATEGY；README。
- 功能：
  - 书的页面里有「分享给家人看（PDF）」：生成标题页（封面照片、书名、描述、日期范围和页数），再按日期放入这本书的每一页（当天封面在前，然后各页），用进度条显示「第 n / N 页」，可以取消。支持文件分享时调起系统分享面板，否则下载。示例数据不放入；超过 60 页时只放最近 60 页并提示。
  - 书架「和家人一起的书」：推荐「我们俩」（Relationship）和「宝宝成长」（Parenting），点开是预填好名字、描述、杂志封面和封面照片的新建书窗口；建好后这个推荐就不再显示。新书仍是私人。
  - 分享后弹出「想让 TA 也能往这本书里加照片吗？」：只给 TA 看就够了 / 想让 TA 也能加照片 / 还不确定。明确写明还在做、回答只记在本机测试记录（contribute_interest）。
- 决策与原因：不需要服务端和账号就能让家人看到；PDF 在手机消息里可以直接预览，长辈不用装 App；用意向问题测「投稿」需求，再决定是否做服务端。
- 运行 / 测试：85 项 Node、12 项 Python、26 套浏览器 E2E 全部通过（v53：推荐书 → 建书 → 空书提示 → 两页 → PDF（3 页：标题页 + 2 页，JPEG，标题元数据）→ 意向问题 → 测试记录）。生成的 PDF 用 poppler（pdfinfo / pdftoppm）读取并渲染检查过。Linux 容器 + Chromium；iOS 系统分享面板、iMessage / WhatsApp 中预览未在真机验证。
- 已知问题：
  - 非拉丁字符的下载文件名在部分浏览器会被丢掉，所以下载时用「Little-Days-book-日期.pdf」，书名在 PDF 标题里；系统分享时文件名仍是书名。
  - 视频在 PDF 里是静帧 / 不显示，音频只显示票根。
  - PDF 生成在手机上较慢（每页需要渲染）。
- 下一步：根据意向数据决定是否做投稿链接；F5 数据可靠性；F6 原生最小闭环。

### 2026-11-09 — V5.3 链接里可以看到更新记录

- 需求：用户截图 claude.ai 聊天里的 Little Days 链接卡片，说「我想把 update 加到这里」，希望打开链接就能看到每次更新了什么。聊天里的卡片只显示标题，无法放更多内容，所以做了两件事：应用内显示更新，链接卡片的描述写上最新更新。
- 改动文件：新增 Public/js/whats-new.mjs（UPDATES：V5.3、V5.2、V5.1、V5.0，中英文）；Public/app.js（首页「新版本」卡片 whatsNewCardHTML、更新记录面板 openWhatsNew、设置里的「更新记录」卡、whats-new / whats-new-dismiss 动作）；Public/styles.css；i18n.json（news.*）；AGENTS.md（每次发布都要加更新条目并设置 Artifact 描述）；docs/ARCHITECTURE.md；tests v52.test.mjs、v52-browser.cjs。
- 功能：每台设备第一次看到新版本时，首页顶部出现「新版本 V5.3 · 标题 · 看看更新 ›」，可以点 × 关掉；点开是「更新记录」面板，按版本从新到旧列出每次改了什么；设置 →「更新记录」随时可以再看。已看过的版本记在本机（little-days.seen-version）。Artifact 的 description 改为最新版本的一句话。
- 决策与原因：更新内容放在 App 里，用户在手机上打开链接就能看到，不依赖聊天界面；条目只写实际完成的内容，与 README 日志一致。
- 运行 / 测试：82 项 Node、12 项 Python、25 套浏览器 E2E 全部通过（v52 新增：首页卡片 → 更新记录面板 → 标记已看过；设置里有入口）。Linux 容器 + Chromium。
- 已知问题：聊天中的链接卡片本身只显示标题（这是 claude.ai 的界面），描述显示在 claude.ai 的 Artifact 列表卡片上。
- 下一步：之后每次发布都在 whats-new.mjs 加一条；继续 F5 数据可靠性、F6 原生最小闭环。

### 2026-11-09 — V5.2 验证核心：Quick Create v2、按照片形状自动排、实验室开关 + 测试记录、Story 分享

- 需求：用户确认 STRATEGY.md 的优先级（「可以」），按任务 F 顺序开发：F1 Quick Create 易用性、F2 多照片自动排版、F3 测试版精简 + 事件记录、F4 分享导出。
- 改动文件：
  - 新增 Public/js/smart-layout.mjs（按照片宽高比排行，枚举行划分并打分；三种样子 clean / scrapbook / hero）；新增 Public/js/events.mjs（本机测试记录：白名单字段，最多 600 条）。
  - Public/js/day.mjs（applyLayout 支持 "smart"、layoutVariant）；Public/js/canvas.mjs（smart 页底部一句话）；Public/js/export.mjs（smart 页导出一句话、renderStoryCanvas / shareStory 9:16）。
  - Public/app.js：imageBlob 记录宽高比；照片图层带 aspect；quick 上传路径；快速结果页 quickResultHTML / quickPlaced / finishQuickPage；smart-shuffle / apply-smart / share-story / export-events / labs-toggle；实验室 labsOn 及隐藏逻辑；事件埋点。
  - Public/js/personal-ui.mjs（设置里的测试记录卡和实验室卡）；Public/styles.css；i18n.json。
  - Models.swift（JournalLayer.aspect、Entry/Moment.layoutVariant，均为可选）与 CoreTests。
  - tests：signed-in.cjs 为老测试打开实验室；v36 打开实验室测登录；v51 照片选项顺序与「我的照片」改为 smart；新增 v52.test.mjs、v52-browser.cjs；package.json 增加 test:browser:v52。
  - 文档：ROADMAP（已确认 + V5.2 清单）、STRATEGY（已确认、进度）、README。
- 功能：
  - 「＋」→ 照片 + 一句话：默认「我的相册」（可多选），其次「今日推荐」「图库」。选完直接得到排好的一页：照片保持原比例不裁切；下面四个按钮：换一种（1/3、2/3、3/3：整齐 / 手帐风（边框、轻微倾斜、胶带）/ 大图在上）、写一句话（写在页面底部的标签上）、分享、编辑；右上「完成」保存这一天并回到首页，提示「已放进《书名》」。快速路径不弹照片编辑器（编辑页里仍可用）。
  - 排版工具顶部新增「按照片形状自动排」，任何页面都可用；手绘不参与排版。
  - 实验室：新安装默认收起社区和私信、通知铃、我的主页 / 装扮 / 等级、共同的书、颜色主题、登录页和导览，直接进入首页；设置 →「实验室」可以打开或收起。代码和数据都保留。
  - 测试记录：只在本机记录事件名、时间、用时、点击数、照片数、换了几次、有没有写一句话，不记录文字、名字、照片和媒体引用；设置 →「导出测试记录」得到 JSON（含摘要：完成页数、中位用时、活跃天数、分享数）。
  - 分享：快速结果页和编辑页底部有「分享」，生成 1080×1920 的 Story 图片（页面居中，底部小字 made with Little Days）。浏览器 / 外壳支持文件分享时调起系统分享面板，否则下载。
- 决策与原因：用行式排版（justified rows）保证不裁照片，比按张数套模板更「默认就好看」；三种样子覆盖干净、手帐感、主次分明三种审美；新安装默认收起暂停模块，让测试反馈集中在核心体验；测试记录只存白名单字段，保护隐私。
- 运行 / 测试：81 项 Node、12 项 Python 通过；25 套浏览器 E2E 全部通过（browser、v3、v31–v52、collab）。v52 覆盖：新安装直接进首页和实验室开关、多张照片快速成页（不裁切、无编辑器、四个按钮）、换一种、写一句、Story 1080×1920、完成保存、测试记录内容和导出、排版工具里的自动排。环境是 Linux 容器 + Chromium；**系统分享面板未在 iOS 真机 / WKWebView 验证**（测试里走的是下载回退），Swift 未编译。
- 已知问题：
  - 裁切焦点还是居中（smart 不裁切所以影响小，但手帐风和单张整页仍会裁）；纸张颜色还没有跟随照片。
  - 用户自己浏览器里的在线链接：实验室默认收起，需要到设置里打开才能看到社区等模块。
  - 老的「当日主页」编辑仍有纸下输入框。
- 下一步：F5 数据可靠性；F6 原生最小闭环（需要 Mac）；首次打开引导页；每周 / 每月回顾。

### 2026-11-09 — 产品战略重新定位与开发优先级建议（仅文档，待确认）

- 需求：以产品负责人 / UX / 战略顾问身份，批判性地完成任务 A–F（定位、风险、优先级、用户旅程、30 天验证计划、下一阶段开发建议），明确区分事实、假设和待验证项；不讨论商业化；本次不做大规模代码重构。
- 改动文件：新增 docs/STRATEGY.md（完整分析与来源）；docs/ROADMAP.md 顶部加「建议待确认」指向说明（清单顺序未改）；agent.md、README.md 日志。**没有改代码。**
- 关键判断：
  - 用户的竞品列表漏了 Apple Journal（免费预装，能从照片生成建议；iOS 26 起支持多本日记、iPad / Mac）。Day One Shared Journals 自 2025-05 起对所有用户免费；Shuffles 热度下降。
  - 差异化应押在「自己的照片 → 默认好看的页 → 自动积累成书」，而不是贴纸、社区、共同手帐或结构化主题。
  - 代码现状：自动排版只按张数、不认横竖；快速流程默认推荐 Unsplash 图库照片；新照片会弹出照片编辑器；没有 9:16 导出、系统分享和事件记录；原生桥接和构建都没有验证。
- 建议的下一步（等待确认）：Quick Create v2 → 认横竖 / 主体的自动排版 + 「换一种」→ 测试版精简（labs 开关）+ 本机事件记录 → 分享导出 → 数据可靠性 → 原生最小闭环（TestFlight）。暂停扩展社区 / 私信 / 等级 / 装扮 / 协作 / 素材。
- 运行 / 测试：仅改文档，没有运行代码测试。竞品信息来自公开网页搜索（来源列在 STRATEGY.md 末尾）。Zinnia 是否有照片自动排版仍需亲自安装确认（标为待验证）。
- 未完成 / 下一步：等用户确认优先级后，再按 STRATEGY.md 任务 F 逐项实施，每项都附带测试和日志。

### 2026-11-09 — 一天 = 封面（一句话，可选）+ 每一页；页面条和「整理这一天」（排序 / 删除）

- 需求：用户觉得「封面（当日主页）」和「章节（小故事）」不直观：封面应是一句话总结，章节是记录发生了什么，两者是并列关系但界面没说明白；加了小章节后不知道在哪里删除或排序。用户截图显示的是旧界面（「写小故事」「第 03 章」「当日主页」），可能是手机端缓存了旧文件。
- 改动文件：Public/app.js（页面条 chapterChipsHTML 改为封面 + 各页缩略图、strip-head「这一天：封面 + N 页 · 整理顺序 / 删除」、pageThumbHTML、openPagesManage/renderPagesManage/removePage、动作 pages-manage/pages-open/page-move/page-remove、封面提示 cover-hint、记录面板支持指定日期）；Public/js/day-view.mjs（封面标注「一句话总结这一天」、「这一天的 N 页 · 整理」、「再记一页」打开记录面板、照片 + 一句话页阅读时显示照片）；Public/styles.css；i18n.json（统一用词：封面 / 第 N 页 / 再记一页，替换「当日主页」「小故事」「第 N 章」）；tests v31、v33、v46、v51。
- 功能：写作页顶部一行写着「这一天：封面 + N 页」和「整理顺序 / 删除」；下面是并排的页面条：封面（虚线框表示还没写、可选）| 第 01 页、第 02 页……（带缩略图、时间、标题）| ＋ 新的一页。选中封面时纸上方说明「封面：用一句话（和一张照片）总结这一天，可以不写」。「整理这一天」面板列出封面和每一页，每页有 ↑ ↓ 和「删除」，封面可「清空」，点任一行打开那一页。日历的某一天：封面标注「一句话总结这一天」，下面「这一天的 N 页 · 整理」，底部「给这一天再记一页」打开同一个记录面板（记在那一天）。
- 决策与原因：用户的理解（封面 = 一句话总结，页 = 发生的事，并列）就是最清楚的模型，直接写在界面上；排序删除集中到一个面板，比藏在工具栏里的目录好找；沿用已有的 moveMoment，数据结构不变（Entry 仍是封面，moments 是各页）。
- 运行/测试：75 项 Node、12 项 Python、24 套浏览器 E2E 全部通过（v51 新增整理面板：上移、删除、封面在第一行）。Linux 容器 + Chromium，未在 iPhone/iPad 真机验证。
- 已知问题：封面编辑时纸下仍有标题/文字输入框（老测试依赖 #entry-title），与纸上可直接打字重复，后续可去掉；保存后的一天和草稿并存时，日历阅读页显示已保存版本。
- 下一步：去掉封面下方重复的输入框；考虑长按拖动排序。

### 2026-11-09 — 记录一天的三种方式（照片 + 一句话 / 随手写 / 手绘）；手绘画板；装扮空间更完整；等级改为文具店主题；在线链接固定到侧栏

- 需求：有才的用户可以在 iPad 上手绘加入页面；不一定要有 day page，记录一天的方式是：好看的照片 + 一句话、随手写、手绘；功能齐全但越不 confuse 越好。Decorate 很重要；Level 不一定用树。查看方式按现在的在线链接，最好有一个随手能打开的地方。
- 改动文件：Public/app.js（记录面板 openQuickRecord/renderQuickRecord/startQuickRecord/startPage/quickMore、drawOnPage、页面模式 pageModeOf/setPageMode 三种、照片做整页 backdrop、删除旧的创作开始页和单独的随手记页面、framedPhoto 计数、装扮动作 space-dress-tab/space-look/space-frame/space-layout）；新增 Public/js/draw.mjs（画板）；Public/js/canvas.mjs（line 页、media: 背景、drawing-layer）；Public/js/export.mjs（line 页导出、自己照片背景）；Public/js/media.mjs（backdrop 计入媒体引用/备份）；Public/js/day.mjs（framedPhoto，排版不移动手绘）；Public/js/community.mjs / community-view.mjs（SPACE_LOOKS/FRAMES/LAYOUTS、装扮分页）；Public/js/levels.mjs；Public/styles.css；tools/sync_tokens.py（.draw-page 保持纸色）；i18n.json；Models.swift（JournalLayer.drawing）与 CoreTests；tests：signed-in.cjs（openToday）、v33、v36–v44、v47、v49 更新，新增 v51.test.mjs、v51-browser.cjs，package.json 加 test:browser:v51；AGENTS.md、docs/PRODUCT_SPEC.md、README；新增 Open-Little-Days.url。
- 功能：
  - 底部「＋」、首页「记一页」、今日照片、书上的「记一页」都打开同一个面板「今天怎么记？」：照片 + 一句话 / 随手写 / 手绘三选一，再选记在哪本书（记住上次的方式和书）；今天已有内容时可以「继续看今天的 N 页」；「其他」里是自由排版、视频、声音。
  - 每次记录都是这一天的一页（新的 Moment），不再需要先填「当日主页」。旧的当日主页有内容时作为「第一页」保留；没内容就不显示，打开这一天直接落在第一页。
  - 照片 + 一句话：照片就是整页（今日照片、照片库、或我的照片——存 IndexedDB），底部毛玻璃条上写一句话；导出图片同样效果。
  - 手绘：在这一页上直接画（下面显示页面本身），钢笔（Apple Pencil 按压力度变粗细）、马克笔（半透明）、铅笔、橡皮，10 种颜色、粗细、撤销/重做/清空；用过 Pencil 后手掌触碰不会画上。完成后裁到笔迹范围，作为可移动、缩放的图层放回页面（`drawing: true`，frame bare），选中后可「接着画」，清空即删除；照片排版不会移动手绘。写作页上方的方式条有「手绘」，空白纸上的添加选项也有。
  - 写作页上方的方式条：照片+一句 / 随手写 / 自由排版 / 手绘，可以随时换。
  - 装扮空间：「装扮空间」按钮用主题色突出；面板分页：套装（6 套一键：背景+主题色+头像框+动态版式）、头像、背景图、主题色、头像框（无框/细环/双环/虚线/圆角方）、动态版式（方格/杂志/大图）、签名，改动即时生效。
  - 等级名称改为文具店主题（id 不变）：第一页、随手记、贴纸控、手帐控、小作者、杂志主编、出版人、文具店主；去掉等级和升级通知里的 emoji。
  - 在线链接已固定（pin）在 claude.ai 侧栏；仓库根目录 `Open-Little-Days.url` 双击即在浏览器打开在线链接；AGENTS/README/PRODUCT_SPEC 改为以在线链接为查看方式。
- 决策与原因：三种方式覆盖「好看 + 简单」「快」「有才」三类用户，其余能力收进「其他」和工具栏，减少第一眼的选择；手绘做成普通图片图层，导出、备份、移动、缩放都沿用现有逻辑，不新增图层类型；装扮的套装让不想细调的人一步到位。旧的开始页（六宫格、灵感）和单独随手记页面与新面板重复，已删除。
- 运行/测试：Linux 容器 + Chromium。75 项 Node、12 项 Python 通过；24 套浏览器 E2E 全部通过（browser、v3、v31–v51、collab）。新增 v51 覆盖面板三种方式、照片+一句话（今日照片/我的照片/导出）、随手写、手绘（压力、手掌忽略、马克笔、撤销重做、裁切、接着画、清空、取消）、删除页面后落点、装扮套装/头像框/版式。手绘只用合成 Pointer 事件和鼠标测试，**未在真实 iPad / Apple Pencil 上验证**；Swift 未编译（无工具链）。
- 已知问题：Apple Pencil 压力、手掌忽略在真机 WKWebView 中的表现待验证；手绘接着画时原图以位图重画，旋转后的手绘再编辑会转正；面板里「我的照片」一次选一张；装扮仍是本机演示。
- 下一步：在 iPad 上实测手绘手感（笔触平滑、延迟）；考虑手绘笔刷更多质感（水彩、蜡笔）和形状贴纸；装扮可以增加字体/卡片样式。

### 2026-11-09 — 书架（我的书 / 共同的书）；「记一页」先选书；纸下写字卡拿掉；删除这一页放到看得见的地方

- 需求：My Books 改名 Books（书架），书架页和首页都能切换「我的书 / 共同的书」；今日照片点进去不要直接进编辑照片；快捷记录要能选记到哪本书；Write a moment 与 Write with it 重复；随手写模式纸下的小编辑卡拿掉；不知道怎么删掉不喜欢的一页。
- 改动：Public/app.js（booksView shelf/our/profile、isOurBook、首页书架标签、「记一页」面板 openQuickRecord/renderQuickRecord/startQuickRecord、页面条 pageBarHTML、篇章标签上的 ×、随手写模式不再渲染写字卡）；Public/styles.css（page-bar、chip-delete、quick-sheet、home-book-tabs、page-top-actions、our-empty）；i18n.json（books.mine/ours/oursEmpty、quick.*、write.inBook 等，nav.books/books.title 改为 书架/Books）；测试 browser、v3、v33、v35、v41、v46、v48、v50 更新选择器。
- 功能：首页「今日照片」和「记一页」都打开同一个小面板：选书（记住上次选择，存 LocalStorage `little-days.quick-book`，仅本机便利）、选照片（不用 / 今日照片 / 从照片库挑），再点「开始写」。当天还没写时进当日主页并放好照片；已经写过时新开一个篇章记到所选的书。写作页纸上方一条细栏：记在哪本书、时间、「删除这一页」（当日主页为「清空这一天」），当前篇章标签带 ×。
- 决策与原因：两个入口合并成一个面板，避免「Write a moment / Write with it」重复；删除放在纸上方和篇章标签上，用户一眼能看到；首页书架标签选中样式用主题 paper/ink 变量，深色主题对比度足够（v40 检查）。
- 运行/测试：68 项 Node、12 项 Python（同步外壳后）通过；23 套浏览器 E2E 通过（browser、v3、v31–v50、collab）。Linux 容器 + Chromium；未在 Windows 实机 / iOS 验证，Swift 未编译。
- 已知问题：共同的书只读取协作演示中已加入好友的书；上传头像仍不在备份里。
- 未完成 / 下一步：用户同时提出手绘、记录一天的三种方式（照片 + 一句话 / 随手写 / 手绘）、装扮更重要、等级不用植物名，下一条记录处理。

### 2026-11-09 — 主页改成 Instagram 式（像 QQ 空间可以装扮）；照片头像；杂志书脊和 6 种杂志封面；界面统一黑体；写作卡片上直接删除

- 需求（连续几条）：
  - 书架看着不够杂志风；
  - 主页想像 QQ 空间：从书架“出书”、发动态、可以装扮；
  - 杂志封面选项多一些；
  - 头像要能上传自己的照片，不要表情；等级也不要表情风格、太占地方；
  - 别人看到的主页应该是主画面，参考 Instagram：可以关注、加好友、私信；
  - 现在的字体不喜欢，黑体更好；
  - 不知道怎么删除小故事，能不能选择不要（当日主）页。
- 主页（`community-view.mjs` 的 `spaceHTML` / `userPageHTML` / `headerHTML` / `gridHTML`）：
  - 我的主页 = 别人看到的样子，放在最上面：
    - 背景图和签名；头像压在背景图上；
    - 动态 / 出版的书 / 好友 / 关注四个数字；
    - 名字旁一行小小的等级标签（`Lv.1 · 一颗种子`）；@me 和简介；
    - 「编辑资料 / 装扮空间 / ＋ 发一条」；
    - 「我出的书」像 Instagram 精选：杂志封面一排，＋ 从书架出书或收回（沿用 `showcase`，出书前要确认，只展示封面和书名）；
    - 「我的动态」三列方格。
  - 下面以“只有你能看到 · 管理我的主页”分开：等级卡（去掉表情、更紧凑）、谁能看到、访客预览、作品管理、收藏、关注、设置、屏蔽。
  - 装扮空间：头像（上传自己的照片，或从照片素材选；可改回名字首字）、背景图（照片素材）、主题色 6 选 1、签名（40 字）。存在 `demo.profile.space` 和 `profile.avatarPhoto`（只在本机）。上传的头像存进 IndexedDB，启动时主动加载。
  - 头像不再显示表情：有照片显示照片，没有就显示名字首字配柔和底色。虚拟用户改用照片素材做头像和背景图（`DEMO_AVATAR_PHOTOS` / `DEMO_BANNERS`，旧的演示数据也适用）。
  - 别人的主页：从好友列表、作品作者处点进去（`community-open-user`），同样的布局，按钮是「关注 / 加好友 / 私信」；屏蔽后不显示动态。
  - 自己的动态详情里，“撤回为私人”改名为“删除这条动态”。
- 书架：用杂志封面的手帐本在书架上显示成杂志书脊：
  - 封面照片做底加暗色，白色粗体书名竖排，顶部小刊名 “LD”，底部期号（NO.篇数）；
  - 竖排用“一字宽自动换行”实现，字多时自动缩小（测试环境的替代字体在竖排模式下会叠字）；
  - 书架提示改为普通字体，去掉 ✿。
- 杂志封面增加到 6 种：日系、欧美、黑白极简（大黑标题 + 黑白照片）、胶片（齿孔 + 橙色日期戳）、留白（居中小图 + 大量留白）、拼贴（三张照片 + 色带书名）。拼贴的另外两张照片按主题固定挑选。
- 字体：界面里原来用衬线体、手写体的标题、数字、对话框标题、日历月份、写作框等，统一改为系统黑体（`--ui-sans`，iPhone 上是苹方）。手帐纸上的字、封面、书脊、“Little Days” 字标和杂志刊头不变。
- 删除：
  - 写作卡片右上角新增「删除这一页」（小故事，沿用原有确认）；
  - 当日主页有内容时显示「不要当日主页」：确认后清空标题、正文、照片和图层（这一天的小故事保留，可以撤销）。之后阅读模式就不显示当日主页了。
- 测试：
  - 新增 `tests/v49-browser.cjs`（6 组）：杂志书脊；我的主页结构；装扮（背景图、主题色、签名）保存；从书架出书再收回；发一条；6 种杂志封面。
  - 新增 `tests/v49.test.mjs`（2 项）：`updateSpace` 只接受照片素材背景和固定主题色，签名限长；6 种封面都能画出书名，拼贴有 3 张照片。
  - 新增 `tests/v50-browser.cjs`（5 组）：别人的主页（照片头像、背景、动态方格、关注、私信）；从作品作者进入别人的主页；我的主页是访客视图在前、管理在后，等级无表情；界面字体是黑体；写作卡片上删除小故事、清空当日主页。
  - 修改 v31 / v33 / v35 / v47：主页新结构、照片头像、删除按钮位置、6 种封面。
- 运行与测试（Linux 容器 + Chromium，测试期间临时运行 localhost）：
  - Node 68、Python 12 全部通过；
  - 浏览器 23 套：`browser`、`v3`、`v31`–`v50`、`collab`，全量回归中有 3 套因测试选择器过时失败，修正后单独重跑全部通过。
- 已知问题：
  - 上传的头像不在“完整备份”里（备份只包含手帐数据引用的媒体）；
  - 登录页的头像选择仍是表情；
  - 关注、加好友、私信、出书都是本机演示，未联网。

### 2026-11-09 — 照片保留原始横竖比例；照片浏览改成美图式“大图 + 合集标签 + 两列瀑布流”

- 需求（截图：现在的滑动大图 vs 美图的模板页）：预览看不出照片是横的还是竖的，推荐美图那种布局。
- 照片：
  - 原来下载时统一裁成 800×1000（4:5），所以原始比例丢了。`fetch_photos.py` 改为 `fit=max`、长边 1000px，保留原始形状；新增 `--refresh` 参数，可以全部重新下载。
  - 共 60 张横图、17 张竖图、1 张方图，约 9.6 MB（原来约 12 MB）。
  - `library.json` 的 `photos` 增加 `w` / `h`（像素尺寸）；Swift `PhotoAsset` 加可选 `w` / `h`。照片背景的明暗（`tone`）按新文件重新计算，结果不变（6 张暗、4 张亮）。
- 照片浏览（`#scene-dialog`，`photoBrowserHTML`）：
  - 上方深色区：选中的照片按原比例大图显示，下面写着名字和“横图 / 竖图 / 方图”，右上角“用这张”；
  - 下方白色面板：13 个合集做成可横滑的标签（当前的有下划线），一句合集介绍，两列瀑布流，每张按原比例显示；
  - 点一张就换大图，切换标签不会关闭面板；从选择面板、照片面板和首页进来都是这个页面。
- 测试：
  - 新增 `tests/v48-browser.cjs`（3 组）：瀑布流两列，每张保持原比例（同时有横图和竖图）；点竖图后大图是竖的并标“竖图”；标签切换合集，“用这张”放到纸上。
  - v41 / v43 / v44 改用新的面板（点瀑布流里的照片，再点“用这张”）。
- 运行与测试（Linux 容器 + Chromium，测试期间临时运行 localhost）：
  - Node 66、Python 12 全部通过；
  - 浏览器 21 套全部通过：`browser`、`v3`、`v31`–`v48`、`collab`。
- 已知问题：放到纸上的照片仍按版式统一裁切；真机未测。

### 2026-11-09 — 标题改用苹方；首页改为手帐本一排；日历可按手帐本看；日系 / 欧美杂志封面

- 需求（截图）：杂志封面很喜欢，字体一般；不要“从一张照片开始”，改成从手帐本里选（可能有专门的健身、植物、亲子手帐要记录）；手帐本顺序按书架；日历可以选不同手帐本来看；手帐本封面也要杂志风（日系、欧美），用户可以自己选封面。中途补充：也不喜欢宋体。
- 字体：
  - 首页的中文标题（大标题、照片上的标题、各区块标题）从站酷小薇改为系统无衬线：iPhone 上是苹方，Windows 上是微软雅黑；字重 600 / 700，字距略收。这样不增加下载。
  - 英文刊头 “Little Days” 仍是衬线体。
  - 曾试装思源宋体（Noto Serif SC，OFL）。用户表示不喜欢宋体，已撤回，未提交。
  - 顶部日期离状态栏太近，加了间距。
- 首页：
  - 去掉“从一张照片开始”（`home-library` 动作保留，暂无入口）。
  - 写作卡片下面是「我的手帐本」一排，顺序和书架一致（`state.books` 的顺序），用杂志封面展示：点封面打开手帐本；「＋ 记一页」直接在这本里新建一页（`book-write`：新小故事，`bookId` 设为这本，随手写模式，光标在纸上）。最后是「＋ 新手帐」，右上角「书架 ›」。
  - 删去底部原来的“我的手帐本”区块。
- 日历：生活记忆和照片墙上方有一排手帐本标签（全部手帐 / 每本手帐，至少两本时显示），选一本就只显示这本的日子和照片（`calendarBookDays` 基于 `bookDays`）。
- 杂志封面（`personal-ui.mjs`，两种新封面排在封面选择的最前面）：
  - 欧美杂志 `magazine-west`：照片铺满，上方衬线大刊头 LITTLE DAYS、月份和主题，下方白色书名和说明，右下角条形码。
  - 日系杂志 `magazine-jp`：米白纸面，左上 “little days”，照片留白装裱，书名竖排在右侧（用一个字宽的文字框实现竖排，字数多时自动缩小），底部主题和细线。
  - 封面字号按封面宽度缩放，首页、书架、详情页、编辑框都成比例。
  - 封面照片：可用自己上传的照片（`media:`）或照片素材（`photo:<id>`）。编辑手帐本时新增一排「封面照片」，最适合这本主题的照片排在前面。没有选时，按手帐本的主题 / 名称（健身→动一动、植物→花与绿植、亲子→值得庆祝、旅行、美食、读书……）固定挑一张。
  - 新建手帐本默认日系杂志。示例手帐本：如果从未改过自动封面（模板、贴纸都是自动给的，没有照片），一次性改为日系 / 欧美杂志，并用 `coverRestyled` 标记，以后再选回旧封面不会被改；用户自己建的手帐本不受影响。
  - Swift：`JournalBook` 加可选 `coverRestyled`；字体数量测试改为 11（原来写的 7 已过时）。
- 测试：
  - 新增 `tests/v47.test.mjs`（3 项）：杂志封面排在最前，新数据默认使用；示例手帐本只迁移一次，用户选择保留；封面照片按主题挑选、同一本书固定，`photo:` 和 `media:` 都能用。
  - 新增 `tests/v47-browser.cjs`（4 组）：首页手帐本按书架顺序用杂志封面，标题字体为苹方；「记一页」写进那本手帐；日历按手帐本筛选（月历和照片墙）；改成欧美杂志并选照片，保存后显示。
  - v45 改为检查手帐本一排已经取代了照片一排。
- 运行与测试（Linux 容器 + Chromium，测试期间临时运行 localhost）：
  - Node 66、Python 12 全部通过；
  - 浏览器 20 套全部通过：`browser`、`v3`、`v31`–`v47`、`collab`。
- 已知问题：Linux 测试环境没有苹方，截图里的中文是 Linux 的替代字体；iPhone 上的实际效果未实测。书架上的书脊还是原来的样式。
- 下一步：书架书脊也做成杂志风；封面可以自定义期号和封面大字。

### 2026-11-09 — 直接在纸上打字：「随手写」和「自由排版」两种写法

- 需求（两张截图）：“添加文字”和下面写的“篇章”容易混淆。用户以为下面写的会出现在上面的页面上，其实那是页面外的标题和正文；页面上的文字框要到下面的面板里去改。希望像备忘录一样点页面就能打字，同时给用户选择：简单记录（备忘录式），或者像 PPT 一样自己排版、加图片。
- 修改（`Public/app.js`、`Public/js/canvas.mjs`、styles.css、i18n.json）：
  1. 每个小故事上方有一个切换：「✎ 随手写 / ▣ 自由排版」（`pageModeHTML`，放在固定的画布区外面，不增加画布区高度）。
     - 随手写 = `layoutTemplate: "text"`：标题和正文就在纸上，`contenteditable="plaintext-only"`，点一下就能打字；点纸上空白处直接开始写正文。下面的卡片不再重复标题和正文输入框，只留时间、标签和一句提示。
     - 自由排版：照片、文字框、贴纸自由摆放。下面的两个框写明用途：“这一页的名字 · 显示在目录和日历里”“页面下方的说明 · 可选，不会写到纸上”，并提示“想在纸上写字：点「文字」加一个文字框，再点一下就能直接打字”。
  2. 从随手写切到自由排版，或者在随手写的页面上加照片时（`noteToLayout`），纸上的标题和正文会变成同一位置的文字框，不会消失；标题仍作为这一页的名字。
  3. 文字框直接在纸上编辑：
     - 新加的文字框会选中默认文字，直接打字就会替换；
     - 已选中的文字框再点一下，就进入打字状态（点到中间的旋转钮但没有拖动，也算点一下）；
     - 字体和颜色仍在横条“编辑”里；
     - 新文字框会放在空位上，不压住已有的文字。
  4. 当日主页纸上的标题和正文也可以直接点着打字，下面的输入框会同步。阅读模式不可编辑。
  5. 默认写法：“写一个小故事”（首页、日历、阅读页）和开始页的“从文字开始”打开随手写，光标直接在纸上的标题里；从照片、视频开始仍是自由排版。
  6. 技术细节：
     - 纸上打字不重绘画布（光标不丢）；一次连续打字只记一步撤销；
     - `render()` 会恢复纸上文字的焦点和光标位置，媒体加载完成后的重绘也不打断打字；
     - 纸上的文字算作“正在打字”，菜单和工具会让开；但不再为它额外滚动页面（画布本来就固定在上方）。
- 测试：
  - 新增 `tests/v46-browser.cjs`（6 组）：随手写在纸上打标题和正文，点空白处开始写；撤销和重做；切到自由排版后文字变成文字框，下方标签正确；再点一下文字框在纸上改字；切回随手写；当日主页纸上打字与下方输入框同步，阅读模式不可编辑。
  - v33 / v37 / v38 改成新流程：写一个小故事直接在纸上打字；从文字开始先是随手写；加文字框后直接在纸上输入，面板从“编辑”打开。
  - v38 导出前先把底部按钮滚进可见区；v37 的字重检查改为读取当前页面上的元素（以前偶尔读到重绘前的旧元素而失败）。
- 运行与测试（Linux 容器 + Chromium，测试期间临时运行 localhost）：
  - Node 63、Python 12 全部通过；
  - 浏览器 19 套全部通过：`browser`、`v3`、`v31`–`v46`、`collab`。
- 已知问题：
  - `contenteditable="plaintext-only"` 需要较新的浏览器；不支持时文字框退回普通可编辑。
  - iPhone 真机上点纸弹出键盘的手感未实测。
  - 从自由排版切回随手写时，原来的文字框会留在纸上，可能和标题、正文重叠，需要手动删除或移动。
- 下一步：随手写里支持清单（勾选框）；切回随手写时可以选择把文字框合并回正文。

### 2026-11-09 — 首页改成以照片为主的杂志风；去掉万花筒 / 光影丝带 / 星空背景；新增“照片氛围”背景

- 需求（截图圈出 11 张背景）：万花筒、光影丝带、星空都不好看；这次的照片素材很好，希望首页在色彩和结构上配合照片素材，少一些 emoji 风格，多一些大气。
- 首页（`home()` 重写，外层 `.home-mag`，样式集中在 styles.css 末尾“Home: photo-led”一节）：
  - 顶部：小字日期（星期 · 日期）+ 衬线体 “Little Days”，去掉 ✿；铃铛和设置是白色圆形按钮，不再用描边。
  - 一句衬线大标题（“今天，也有小美好。”），下面是一张大照片卡片（约 4:4.6，圆角 24、柔和投影）：今天有记录时，显示当天的照片、标题和两行正文，右上角“打开 ›”；没有记录时，显示“今日照片”，并邀请“用它写一页”。照片上叠一层自下而上的暗色渐变，字是白色。
  - “写一个小故事”改成白色卡片 + 细线笔图标。
  - 新增“从一张照片开始”：横向滑动 6 张照片素材（今日推荐 + 其他组各一张，不重复主图），点一下就用它写一页；“照片素材 ›” 打开完整的选择面板。
  - 习惯：表情图标（📖🌿☁️）换成细线图标（书 / 心率线 / 云 / 调色盘 / 叶子），放在淡色圆形里；“✎ 心得”换成细线笔图标 + 文字的小胶囊；分隔改为细实线；字号改为 15 / 12px（原来 11 / 8px 太小）。
  - 手帐本书名单行省略，三本对齐。
  - 深色主题下，照片卡片保持原色（`.hero-photo` 加入 sync_tokens 的 PAPER 列表），照片底下的占位色也改成深色，白字始终清楚。
- 背景：
  - 万花筒（4）、光影丝带（4）、星空（3）标记为 `retired`，不再提供；已经用了的页面照常显示。保留渐变色彩（6）和可爱图案（4）。
  - 新增“照片氛围”：从照片素材里选 10 张适合铺满整页的风景（樱花、海边日落、浪花、紫色黄昏、金色麦田、云海、粉色山脊、湖上星夜、雾中山野、雪中森林），`library.json` 中标记 `backdrop: true`。`fetch_photos.py` 按画面下半部分（放文字的位置）的平均亮度自动标记 `tone`，暗的 6 张、亮的 4 张；暗的用深色卡片配白字。
  - 页面字段 `backdrop` 现在可以是 `scene:<id>` 或 `photo:<id>`。画布、PNG 导出和背景面板都支持；面板顺序是照片氛围 → 渐变色彩 → 可爱图案。
  - Swift：`PhotoAsset` 加 `backdrop` / `tone`；Core 测试改为 2 个背景分组、23 张 retired、10 张照片背景（未运行）。
- 测试：
  - 新增 `tests/v45-browser.cjs`（4 组）：首页大照片、无 emoji、细线图标、没有横向溢出；“从一张照片开始”6 张照片，点一下写一页；“照片素材 ›”打开选择面板；新的一天主图是今日照片，且不在下面那行重复。
  - v41 / v44 的单元和浏览器测试按新背景更新：照片背景的明暗、`photo:` 背景解析、面板分组。
- 运行与测试（Linux 容器 + Chromium，测试期间临时运行 localhost）：
  - Node 63、Python 12 全部通过；
  - 浏览器 18 套全部通过：`browser`、`v3`、`v31`–`v45`、`collab`。
  - v40 深色主题对比度检查一开始失败：它只看底色，照片卡片的占位色是浅色。占位色改成深色后通过。
- 已知问题：手帐本封面仍是手绘插画风；日历、成长等其他页面还没有按新首页的风格统一；未在真机上看过。
- 下一步：手帐本封面可选用照片；把新首页的字号、卡片和图标风格推广到日历、成长和手帐本页面。

### 2026-11-09 — 心得提示改成通用；手帐本页的下拉框和日期字号统一

- 需求（两张 iPhone 截图）：
  1. 打卡心得“内容”的提示“例如：下肢训练 / 西班牙语”和当前习惯（读书）不对应，应该更通用；
  2. 手帐本页（共同创作的邀请行、“全部月份 / 日期”筛选）字体又大又不一致。
- 修改：
  1. 提示改为通用说法：心得“内容”→“简单写一句今天做了什么”；小故事标题“例如：清晨的健身房”→“给这一刻起个名字”；标签示例改为“周末, 散步”。
  2. 原因：手机上所有输入框、下拉框都被强制放大到 16px（为了防止 iOS 点击时自动放大页面），比周围 12–13px 的文字大一截。现在的规则：
     - `index.html` 的 viewport 加 `maximum-scale=1`，iOS 点任何输入框都不会自动放大（Safari 仍可双指缩放）；
     - 需要打字的输入框和多行文本保持 16px；
     - 不弹键盘的下拉框、日期和时间统一 14px；
     - 手帐本筛选行、共同创作的成员行和邀请行用 13px、高 36px，与旁边的“邀请”“写一页”按钮一致；邀请行的下拉框改为圆角边框样式；“共同页面”标题和“写一页”按钮与上方留出间距，不再挤在一起。
  3. `.small-label` 原来没有样式（心得弹窗里“今天的心情”比其他标签大很多），现在和字段标签一样（10px、灰色）。
- 测试：v37 的 iPhone 字号检查改为“打字框 16px；下拉框和日期 13–14px；viewport 含 maximum-scale=1”。
- 运行与测试（Linux 容器 + Chromium，测试期间临时运行 localhost）：
  - Node 63、Python 12 全部通过；
  - 浏览器 17 套全部通过。
- 已知问题：`maximum-scale=1` 在部分安卓浏览器上会禁止双指缩放（iOS 不受影响）；没有在真机上确认。

### 2026-11-09 — 照片素材换成真实照片；渐变和可爱图案改为页面背景

- 需求：素材库更像背景，草地野餐这类插画不好看。希望素材库是像咖啡那张一样的真实照片，能概括今天的心情或事件；渐变色彩、可爱图案更适合做背景图，不该当照片。
- 照片素材（新）：
  - 新增 `tools/fetch_photos.py`：列出 78 张 Unsplash 照片（13 组，每组 6 张）的 ID、分组和中英文名，下载 800×1000 JPEG 到 `Resources/Photos/LD-photo-*.jpg`（约 12 MB）。同时生成来源清单 `Unsplash-Photos.txt`（每个文件对应的原图地址和 Unsplash License），并写入 `library.json` 的 `photos` / `photoCollections`。
  - 13 组：咖啡时光、好好吃饭、甜甜的、花与绿植、毛孩子、海边晴天、山野日落、夜晚星空、安静的一天、出发旅行、值得庆祝、动一动、四季。照片是先下载 110 张缩略图、逐张看过后挑的，尽量不用能认出脸的人像，也不用带品牌标志的照片。
  - 运行时不访问 Unsplash：引用 `photo:<id>` 解析为 `library/photos/LD-photo-<id>.jpg`。preview.py、build_link、Swift `SharedResources.libraryData`（新增 `photos` 类别）、Vapor 的 jpg 类型、iOS 外壳说明都已同步。
  - 首页“今日照片”、开始页、选择面板的“今日推荐”（今日照片 + 另外 3 组各 1 张，每天换）、照片面板里的库、滑动大图都改用照片。
- 页面背景（原来的插画/壁纸）：
  - 渐变色彩、可爱图案、万花筒、光影丝带、星空，共 5 组 21 张，改为“页面背景”，放在“纸张”面板最上面。选择面板底部也有“换个页面背景 ›”，点了直接打开展开的纸张面板。
  - 页面新增可选字段 `backdrop: "scene:<id>"`（当日主页和每个小故事都可以设）。背景铺满整页，标题和正文放在一块磨砂卡片上。深色背景（`tone: "dark"`，共 10 张）用深色卡片和白字；用户没改过的默认深色标题也会变白。导出 PNG 时会画出背景和卡片。“不用背景”则回到原来的纸张。
  - 12 张手绘“生活小景”标记为 `retired`：不再出现在任何选择处；已经用了它们的页面仍能正常显示。
  - Swift：`Models.swift` 的 Entry / Moment 加可选 `backdrop`；`Resources.swift` 新增 `PhotoAsset`，`SceneAsset` 加 `retired` / `tone`；Core 测试相应更新（未运行）。
- 测试：
  - 新增 `tests/v44.test.mjs`（3 项）：78 张照片的文件、来源和许可；`photo:` / `scene:` 只解析为内置文件；背景、磨砂卡片和深色白字的渲染。
  - 新增 `tests/v44-browser.cjs`（6 组）：选择面板只有真实照片；从选择面板进入背景（5 组 21 张，排在纸张前面）；浅色背景；深色背景白字；照片加背景后保存、导出 PNG、阅读模式显示；“不用背景”。
  - v41 / v43 的单元和浏览器测试改为照片素材。
- 运行与测试（Linux 容器 + Chromium，测试期间临时运行 localhost）：
  - Node 63、Python 12 全部通过；
  - 浏览器 17 套全部通过：`browser`、`v3`、`v31`–`v44`、`collab`。
- 环境：为下载照片，新建了个人云端环境 “Notebook”，只多放行 `images.unsplash.com` 和 `unsplash.com`，经用户批准。没有使用 Unsplash API 密钥。
- 已知问题：
  - Unsplash License 允许免费商用，但不允许把照片原样汇编成同类图库服务；目前作为手帐内置素材使用，正式上架前仍需完成资产审核（与 ASSETS.md 原有说明一致）。
  - 照片让仓库和在线链接大约增加 12 MB；Swift 未编译；真机未测。
- 下一步：照片素材按心情搜索（例如“开心 / 累 / 想念”）；背景可以加用户自己的照片（模糊后铺满）。

### 2026-11-09 — 示例图换回咖啡、照片选择面板、素材进主照片位、面板可上拉、日历照片墙、随手记

- 需求（七点，附截图）：
  1. 默认插画不如以前的咖啡照片好看；
  2. 素材选好后没有放进版式，而是自由摆放；
  3. 加照片时看不到素材选项；
  4. 照片面板最好能上下拉；
  5. 主照片位应该点一下就能加照片；
  6. 日历想要照片版，按上传的照片排列，并有动态背景；
  7. 新建时想像 iPhone 备忘录一样点开就能打字。
- 修改：
  1. 示例页改回 `/assets/coffee.jpg`，示例文字也恢复原样。`normalizeState` 会把之前已变成插画的示例页自动改回咖啡（只改示例页，用户自己选的不动）。首页的“今日素材”保留（今天还没写时才显示）。
  2. `useScene`：先填版式里的空相框；当日主页的主照片位为空（且不是“只有文字”）或从主照片位进入时，素材直接成为主照片；以上都没有时才作为自由图层。
  3. 新的照片选择面板 `#choose-dialog`（仿 iOS 底部弹出）：
     - “从相册选择”：普通入口可多选，从主照片位进入时只选一张；
     - “今日推荐”：今日素材加 3 张壁纸；
     - “素材库”：6 组的封面，点开即进入滑动面板；
     - 取消。
     - 纸下方的“照片”、空白纸上的“照片”、开始页的“从照片开始”都会先打开这个面板；照片工具面板里的“添加照片”按钮仍然直接打开相册。
  4. 所有工具面板顶部加了把手：点一下或往上拉，面板展开到约 78% 屏幕高；往下拉先收起，再往下拉就关闭。
  5. 画布上的“主照片（可选）”占位可以点，点了打开选择面板，标题为“选一张主照片”。
  6. 日历新增第三种模式“照片墙”：
     - 背景是缓慢流动的渐变，叠一层本月第一张照片的模糊放大图，也在慢慢浮动；系统开启“减少动态效果”时不动；
     - 月份用手写体大字，下方小字“年份 · 这个月的小日子”；
     - 每天一格 3:4 照片，日期标在角上；只有文字的日子显示 ✎；
     - 底部统计“记录了几天 · 几张照片”；点一格打开那天，空白的日子点了去补记。
  7. 随手记：开始页最上方新增黄色“随手记”卡片，打开备忘录风格的页面：顶部“‹ 返回 / 日期 / 完成”，大标题（26px）加正文（17px），没有边框。点“完成”后存成今天的一个“只有文字”的小故事并保存；什么都没写就返回则不保存。
- 其他：选择面板、照片墙在任何主题下保持原配色；修复了“随手记”卡片和原有说明文字类名相同、导致说明也变成黄色卡片的问题；修复了备忘录标题被手机 16px 输入框规则压小的问题。
- 测试：
  - 新增 `tests/v43-browser.cjs`（5 组：随手记保存和空返回；主照片位点开选择面板并把素材放进主照片位；“照片”打开选择面板，含相册多选、今日推荐和 6 组素材；面板把手展开和收起；日历照片墙有动画背景，点格子打开那天）；
  - v41 单元测试和浏览器测试改为“示例页是咖啡照片、旧插画示例会迁移回来、首页今日素材填进主照片位”；
  - v36 和 v37 改为先经过选择面板再点“从相册选择”。
- 运行与测试（Linux 容器 + Chromium，测试期间临时运行 localhost）：
  - Node 60、Python 12 全部通过；
  - 浏览器 16 套全部通过：`browser`、`v3`、`v31`–`v43`、`collab`。
- 已知问题：iPhone 真机上的拖动手感、照片墙动画性能未实测；照片墙暂不能导出成图片；Swift 未编译。
- 下一步：照片墙可以加“导出成图片 / 分享”；随手记可以加列表视图。

### 2026-11-09 — 素材库改成苹果壁纸风格（33 张、6 组）

- 需求（截图：现有素材 + iPhone“添加新墙纸”页面）：现在的素材太简单，喜欢苹果手机那种感觉。
- 新素材：
  - 新增 `tools/make_wallpapers.py`，用固定随机种子程序化生成 5 组竖版（3:4）原创壁纸：
    - 渐变色彩（6 张，像发光玻璃的柔和光斑）；
    - 光影丝带（4 张，深色背景上的发光彩带，用多层描边做光晕，不用模糊滤镜，渲染快）；
    - 万花筒（4 张，十二重镜像对称）；
    - 可爱图案（4 张：云朵和小蜜蜂、满天小花、星星月亮、小爱心）；
    - 星空（3 张：蓝色星球、土星环、月光）。
  - 原来 12 张“生活小景”加了左上角柔光、几颗虚化的光斑和暗角，更有层次。
  - 共 33 张、6 组，全部为原创（声明文件已更新），总大小约 270 KB。
  - `make_scenes.py` 会同时更新 `library.json` 的 `scenes`（新增 `collection` 字段）和 `sceneCollections`（每组的中英文名和一句介绍）。
- 素材库界面（仿 iPhone“添加新墙纸”）：
  - 照片面板里每组一行：左边三张叠放的手机比例预览，右边是粗体标题、灰色介绍和深色胶囊按钮“使用”。
  - 点开是深色全屏面板：大图横向滑动（滑动时自动对齐），每张下方有名字和“用这张”；今日素材排在第一并标“今天”。
  - 这个面板在任何主题下都保持深色。
  - 修复：今日素材只从“生活小景”里选，和新手帐的示例页一致（之前从全部素材里选，两处会对不上；测试发现的）。
- Swift：`SceneAsset.collection`、新增 `SceneCollection`、`AssetCatalog.sceneCollections`（可选字段），Core 测试改为 33 张、6 组（未编译）。
- 测试：v41 单元测试改为 33 张、6 组且每组都有素材，今日素材只来自生活小景；v41 浏览器测试改为“6 组叠放预览 → 滑动面板 → 今日素材排第一 → 使用丝带壁纸”。
- 运行与测试（Linux 容器 + Chromium，测试期间临时运行 localhost）：
  - Node 60、Python 12 全部通过；
  - 浏览器 15 套全部通过。
- 已知问题：素材是程序绘制的插画和图形，不是照片或 3D 渲染；iPhone 真机未实测；Swift 未编译。
- 下一步：用户挑喜欢的风格，可以按那种风格继续扩充（例如更多星球、节日、季节主题）。

### 2026-11-09 — 字号统一、私信页重排、用户等级、消息通知中心

- 需求（两张截图）：字体有大有小；私信页比例奇怪；用户要有等级（活跃天数、发布多少都加经验）；主页右上角可以进入消息通知（系统消息、加好友、用户互动动态）。
- 字号：
  - “谁能看到”原来用下拉框，触屏上会被统一放大到 16px，显得特别大。现在改成两个小按钮“🔒 仅自己 / 🖼 展示封面”（字号 12px，打开展示封面仍需确认）。
  - 书名 14px、说明 12px，“谁能看到”和“我的发布”里的说明文字改为左对齐。
- 私信页（`community-view.mjs`）：
  - 顶部一行：‹ 返回、头像和名字、⋯ 菜单（删除会话 / 屏蔽 / 举报）；
  - 消息区占满中间；底部固定输入区：一行小贴纸 + 📔（展开“分享作品”选择框，不再超出屏幕）+ 输入框和发送；
  - 没有消息时显示居中的提示。
- 等级（新 `Public/js/levels.mjs`）：
  - 经验只根据本机记录现算，不额外存数据，示例内容不算，也不会上传。
  - 记录过的日子 +10；当日主页 +5；小故事 +3；照片 +1（最多 300 张）；打卡 +2；打卡心得 +3；周 / 月回顾 +8；发布作品（演示）+15。
  - 8 个等级：一颗种子 0 → 刚发芽 30 → 长叶子 90 → 小花苞 200 → 开花了 400 → 小花园 700 → 一片森林 1100 → 彩虹草地 1600。
  - 同时计算活跃天数和连续天数（今天还没写时，从昨天往前算，不会提前断掉）。
  - “我的主页”新增等级卡：图标、Lv、名称、经验值、进度条、距下一级还差多少、活跃 / 连续天数，以及“怎么获得经验？”明细。
- 消息通知（`community.mjs` + `inboxHTML` / `bellHTML`，存于演示数据）：
  - 首页右上角（设置旁）和“我的主页”右上角有 🔔，带未读数。
  - 通知页可筛选：全部 / 系统 / 好友申请 / 互动 / 私信。
  - 系统消息：欢迎、备份提醒（可直接去设置）、升级通知（每升一级一条，可跳到等级卡）。
  - 好友申请可以直接在这里接受或拒绝；有未读私信时显示一条，点了去回复。
  - 发布作品后会模拟收到一个赞和一条评论，标注“模拟”。
  - 支持全部已读；返回时也会标为已读。被屏蔽的人的通知会隐藏。旧的演示数据加载时会自动补上通知列表。
- 测试：
  - 新增 `tests/v42.test.mjs`（3 项：经验计算、示例内容不算、照片上限、最高等级、通知的种类 / 未读 / 已读 / 升级只通知一次 / 发布后的模拟互动 / 屏蔽隐藏 / 旧数据补全）；
  - 新增 `tests/v42-browser.cjs`（4 组：铃铛未读数 → 通知中心筛选 → 接受好友 → 全部已读；等级卡从 Lv.1 升到 Lv.2 并收到升级通知；“谁能看到”改为小按钮；私信页布局、⋯ 菜单、分享框不超出屏幕、发送）；
  - 更新 v35（小按钮）和 v33（分享作品先点 📔）。
- 运行与测试（Linux 容器 + Chromium，测试期间临时运行 localhost）：
  - Node 60、Python 12 全部通过；
  - 浏览器 15 套全部通过：`browser`、`v3`、`v31`–`v42`、`collab`。
  - v31 第一次全量运行时超时过一次，单独连续重跑两次都通过，判断为偶发问题（以前也出现过）。
- 已知问题：等级和通知都只在本机；互动是模拟的，真实互动需要服务端；iPhone 真机未实测；Swift 未编译。
- 下一步：用户确认等级名称、经验规则和通知内容；可以加等级徽章展示和更多系统消息（例如每周回顾提醒）。

### 2026-11-09 — 素材库与每日素材（不再总是咖啡）

- 需求：模版照片每次都是咖啡；希望每天变化，或者有素材让用户选。
- 原创素材：
  - 新增 `tools/make_scenes.py`，生成 12 张原创插画：早晨的咖啡、山坡日出、雨天窗边、一瓶郁金香、海边的风、城市夜晚、草地野餐、书和一杯茶、窗台上的猫、山与湖、秋天的树、生日蛋糕。
  - 文件为 `Resources/Scenes/LD-scene-*.svg`，附原创声明 `LittleDays-Original-Scenes.txt`，没有使用任何第三方图片。
  - `library.json` 新增 `scenes`（id / 分类 / 中英文名 / 文件 / 声明）。
  - 新素材已接入各个出口：`preview.py` 的 `/library/scenes/`、`build_link.py`、Swift `SharedResources.libraryData("scenes")` 和 `SceneAsset`、`Seed.dailyScenes`，以及 iOS 外壳说明。
- 每日变化：
  - `model.mjs` 新增 `sceneOfDay`：按日期确定，同一天不变，12 天轮完一遍。
  - `seed.json` 中“今天”的示例页改为 `scene:daily`，新建手帐时换成当天的素材；正文去掉了“热咖啡”。
  - `media.resolve` 支持 `scene:<id>`。
- 选择素材：
  - 首页：今天还没写时，显示“今日素材 · 名字 · 用它写一页”，点一下就放到今天的页面上（如果今天已有内容，会新建一个小故事）。
  - 创作开始页：底部有“今日素材”。
  - 照片面板：“从相册选择”下方是“素材库”（12 张，今日素材排在第一并标出）。
  - 空白纸张：四个按钮下方有“或者从素材库挑一张”。
  - 放上的素材可以像照片一样用工具条“编辑图片”加滤镜和文字；编辑后另存一份，素材本身作为原图。导出图片也正常。
- 测试：
  - 新增 `tests/v41.test.mjs`（3 项：素材清单、文件与声明齐全；每日素材同一天不变、每天不同、12 天不重复；新手帐的示例页使用当天素材）。
  - 新增 `tests/v41-browser.cjs`（5 组：示例页显示今日素材且加载成功；首页今日素材一键放上；照片面板 12 张、今日排第一、点选放上；素材可用滤镜编辑；含素材的页面导出 PNG，开始页显示今日素材）。
  - Swift Core 测试加入了 scenes 的检查（未编译）。
- 运行与测试（Linux 容器 + Chromium，测试期间临时运行 localhost）：
  - Node 57、Python 12 全部通过；
  - 浏览器 14 套全部通过：`browser`、`v3`、`v31`–`v41`、`collab`。
- 已知问题：
  - 已有的旧手帐里，示例页仍是原来的咖啡照片（只有新建的手帐会使用当天素材）；
  - 素材是插画风格，不是真实照片；
  - iPhone 真机未实测，Swift 未编译；Swift 里原有的 `fonts.count == 7` 断言与现在 11 款字体不符（以前就存在，本轮没有处理）。
- 下一步：按用户喜好增加更多主题素材（宠物、亲子、节日、四季等）。

### 2026-11-09 — 酷炫主题文字改白；习惯两个按钮（✓ 打卡 / ✎ 心得）

- 需求：酷炫（紫色深色）主题里黑色或深色文字看不清，要换成白色；习惯要有两个按钮，一个打勾，一个加感想、照片等。
- 主题：
  - 原因：深色主题把所有颜色统一做了明暗反转，原本用在紫色按钮上的白字变成了深色，灰色提示字变成中灰。
  - `tools/sync_tokens.py` 现在把文字颜色单独成组（`color` / `fill` / `stroke` / `caret-color` 声明里改用 `--t-xxxxxx` 变量），背景等仍用 `--c-`。深色主题下文字一律变亮：白字保持白色，深色和灰色的字变成浅色并保留色相。浅色主题不变。
  - `design-tokens.json` 的酷炫主题指定了 ink / muted / line 三个颜色。
  - 提示消息（toast）和选中内容上方的工具条在任何主题下都保持深色。
- 习惯：
  - 每行都有两个按钮：“✎ 心得”（打卡前后都能点；写了或加了照片后显示“已写 / 🖼”）和 ✓。
  - ✓ 一点即完成：计时类习惯记录默认分钟数，不再弹出表单。提示“打卡啦 🌱 想写心得、加照片，点旁边的 ✎”。
  - 点 ✎ 打开原来的心得对话框（分钟、心得、心情、照片）；还没打卡时保存，会同时完成打卡。
- 测试：
  - 新增 `tests/v40-browser.cjs`：
    - 酷炫主题下首页、日历、成长、手帐本、社区、设置、创作页和面板，所有可见文字对比度都不低于 3:1，按钮文字为白色；
    - 习惯：✎ 和 ✓ 并排；✓ 一点即完成并记录分钟；✎ 在打卡前或打卡后都能写心得，而且不会重复打卡。
  - 更新 `browser.cjs`、v31 的计时类习惯流程。
- 运行与测试（Linux 容器 + Chromium，测试期间临时运行 localhost）：
  - Node 54、Python 12 全部通过；
  - 浏览器 13 套全部通过：`browser`、`v3`、`v31`–`v40`、`collab`。
- 已知问题：浅色主题里一些装饰性的小灰字对比度本来就偏低，这是原有设计风格，没有改；iPhone 真机未实测；Swift 未编译。
- 下一步：用户确认酷炫主题的可读性，以及习惯按钮的位置和大小。

### 2026-11-09 — 选中即可删除/复制；视频封面（自动、选一帧、上传）

- 需求（截图）：在纸上选中内容后，希望就在那里删除或复制；上传视频后可以选视频封面，或自己上传封面。
- 修改：
  - `app.js` `layerBarHTML` / `placeLayerBar`：选中的内容上方出现深色小工具条（空间不够时放到下方）。
    - 照片：✨ 编辑图片；视频：🖼 封面；文字：✎ 编辑（打开文字面板）。另外都有 ⧉ 复制、⬆ 置顶、🗑 删除。
    - 拖动时工具条跟着移动；点工具条不会触发拖动。
    - 图层面板里重复的 置顶/复制/删除/编辑图片 已删去，面板更短，并提示这些操作在工具条里。
    - 删除最后一个视频或声音图层时，同时移除它的文件条目；撤销会恢复。
  - 新 `Public/js/poster-picker.mjs`：
    - 上传视频时自动截一帧作封面（`frameAt`，在最长 1 秒处），避免 iPhone 上视频显示成黑块。
    - “选择视频封面”对话框：拖滑块选一帧，“用这一帧”保存为 IndexedDB 中的新图片；也可以“上传图片”。
    - 媒体卡片的“设置封面”和工具条的“封面”都会打开这个对话框。
  - 播放失败时：如果是需要再点一次就提示“再轻点一次”；否则先重新加载再播放一次；格式不支持时提示转成 MP4。之前一律提示“媒体不可用”，容易误导。
  - 显示不出来的照片改为柔和的占位图（📷 斜纹），不再显示破图标。
  - `index.html` 新增 `#poster-dialog`；`styles.css`、`i18n.json`（poster.*、layer.frontShort、layer.barHint、media.tapAgain/unsupported）。
- 测试：
  - 新增 `tests/v39-browser.cjs`（iPhone 13 模拟，5 组）：
    - 新视频自动有封面；
    - 选中视频后工具条在它上方，包含 封面/复制/置顶/删除；
    - 选一帧或上传图片作封面；
    - 复制与删除，删除最后一份时连同文件一起移除，撤销可恢复；
    - 照片工具条有“编辑”，无法显示的图片有占位图。
  - 更新 v3：视频封面先自动生成，再通过对话框上传替换。
- 运行与测试（Linux 容器 + Chromium，测试期间临时运行 localhost）：
  - Node 54、Python 12 全部通过；
  - 浏览器 12 套全部通过：`browser`、`v3`、`v31`–`v39`、`collab`。
- 已知问题：
  - iPhone 真机上自动截帧和播放没有实测；截图里那张照片显示成“?”的根本原因无法在容器里复现（可能是这台设备的存储里已经没有那个文件，或图片格式读不出来），现在会显示占位图，可以用“替换照片”重新选择；
  - Swift 未编译。
- 下一步：用户在手机上确认工具条位置和封面选择。

### 2026-11-09 — 竖/圆等形状、打字不挡选项、主题颜色、整体体验审查修复

- 需求（两张截图）：上传的视频只能横着，想要竖的、圆的等多种形状；手机键盘弹出时会挡住选项；从用户体验角度自己审一遍并改进；App 主题颜色可选（酷炫、简约、优雅等）。
- 视频方向与形状：
  - 新增 `Public/js/shapes.mjs`，定义形状：横版 / 竖版 / 方形 / 圆形 / 拱门 / 心形 / 胶片（胶片仅视频）。按 4:5 纸张换算出真实比例；同时提供 canvas 路径，导出时画出同样的形状。
  - 上传视频时读取它本身的宽高（`clip.width/height`），竖拍视频会竖着放到纸上。
  - 照片多一个“自由”选项；`layer.shape` 为可选字段。
  - 圆形、拱门、心形用遮罩直接裁出画面，没有白边；胶片带齿孔边。
  - 图层面板新增“形状”按钮行。
  - `export.mjs` 在图片和视频导出里都画出这些形状。
  - Swift：`StickerLayer.shape`、`JournalMedia.width/height`（可选字段）及 Core 测试（未编译）。
- 键盘：
  - 在触屏上聚焦文字框时进入“打字模式”：底部菜单和工具图标隐藏；正在用的面板移到键盘上方（浏览器报告 visualViewport 时贴着键盘，否则放在屏幕上半部分）；只滚动面板本身，正在输入的框保持可见。
  - 点纸面会收起键盘。
- 主题（共享设计资源为准，并生成 CSS）：
  - `design-tokens.json` 新增 6 个主题：温柔（默认）、简约、优雅、清新、樱花、酷炫（深色）。
  - `tools/sync_tokens.py` 会把 `styles.css` 里的每个颜色改写为 `var(--c-xxxxxx, #原色)`。原色作为回退值，所以默认外观完全不变；脚本可重复运行，后来新加的颜色也会一并转换。
  - 同一脚本生成 `Public/themes.css`：按色度判断，中性色带上主题自己的淡色，原来的鼠尾草绿换成主题的强调色，深色主题反转明度，阴影保持为阴影。
  - 手帐纸张、封面、书脊、书架木板和修图器在任何主题下都保持原色。
  - 设置里可以选主题（只存在本机 `little-days.theme`），功能介绍里新增一张“选个喜欢的颜色”卡片。
  - `app.js` 不再用内联方式写颜色变量（否则会盖掉主题）。
- 体验审查（由一个子代理在 iPhone 模拟下走查，只出报告、不改代码）后的修复：
  - 创作页改为全屏：隐藏底部菜单，左上角加“‹”返回到进入前的页面；提示消息改在顶部显示；纸张为空时，四个添加按钮只出现一次。
  - 工具图标行加右侧渐隐，重新渲染后保持滚动位置，并把当前打开的工具滚到可见处。
  - 去掉面向用户的技术词：IndexedDB / LocalStorage / 端口 / “公开仓库” / “尚未同步到 iPhone”，私密说明也改得与现有的演示功能一致。
  - 触屏上只显示触屏手势说明；“已选择元素”提示不再重复；新文字字号略大。
  - 系统预设的标签按界面语言显示：习惯主题、书本分类、分钟数、成长轨迹书眉、日历切换、“添加一个小故事”。用户自己写的内容仍然不翻译。
  - 日历：点空白日期后，下方面板会滚动到可见处；去掉重复的“补记这一天”按钮和 ↗ 箭头。
  - 设置：只保留“‹ 返回”；备份按钮之间留出间距；首页齿轮改为 SVG 图标。
  - 打卡对话框：“移除照片”只在有照片时显示；例子改成中文。
  - 社区子页（作品、私信）只显示一行“演示”标记；私信消息从顶部排起；分享作品的下拉框不再超出屏幕。
  - 手帐本详情页的“编辑”按钮不再被挤扁；“谁能看到”的下拉框换成 App 风格。
  - 小链接的点击区域加大；阅读页日期使用等高数字。
  - 登录时没填名字也会友好地问候，语言切换移到登录页顶部。
- 测试：
  - 新增 `tests/v38-browser.cjs`（4 组）：
    - 竖 / 横视频的方向；
    - 视频 7 种、照片 7 种形状，圆形是正圆，心形有遮罩，导出图片正常；
    - 打字模式：菜单和工具隐藏，面板在上方，键盘高度可知时面板贴着键盘；
    - 6 个主题：深色主题下界面变色但纸张不变，选择会被记住，手帐数据不受影响。
  - `signed-in.cjs` 增加两个助手：`goTab` 从全屏创作页先点 ‹ 再用菜单；`menu` 用来点底部菜单。
  - 旧测试相应更新：v31 打开工具前先收起键盘；v32 检查创作页没有底部菜单；v33 接受一行的演示标记；v36 只用返回键；v37 检查空白纸上四个按钮只出现一次。
- 运行与测试（Linux 容器 + Chromium，测试期间临时运行 localhost）：
  - Node 54、Python 12 全部通过；
  - 浏览器 11 套全部通过：`browser`、`v3`、`v31`–`v38`、`collab`。
- 已知问题：
  - 真机 iPhone 的键盘高度与 visualViewport 行为未实测（在线链接在 App 内的 iframe 里可能拿不到键盘高度，此时使用上半屏的后备布局）；
  - 主题是按规则自动换色，个别小装饰颜色可能不够理想；
  - 修图器不支持形状；
  - Swift 未编译。
- 下一步：用户在手机上确认键盘、形状和主题；按需微调各主题配色。

### 2026-11-09 — 照片 / 文字 / 视频 / 声音并列；空白纸张可直接添加；iPhone 字体比例

- 需求（四张截图，用户只用在线链接查看）：
  - 给图加文字要找一下，不直观；
  - 加照片、文字、视频、音频应是平行选择；
  - 空白纸张那里点一下就能加内容；
  - 创作入口弹出页的字体比例奇怪。
- 修改：
  - `app.js`：
    - 画布下方原来是一个大的“加照片”按钮，现在改为 撤销 / 重做 + 四个并列按钮：照片 / 文字 / 视频 / 声音（`addChoicesHTML`）。
    - 点“声音”在下方展开“录一段 / 上传音频”。录音会打开声音面板，因为“停止”按钮在那里。
    - 点“文字”立即在纸上加一个文字框，打开图层面板并选中文字，可以直接输入。
    - 写作卡标题行里不显眼的“＋添加文字框”已删除。
    - 文字图层面板把“文字内容”放到最上面。
    - 画布的 pointerdown 忽略纸上的添加按钮。
  - `canvas.mjs`：小故事纸张为空时，在纸上显示同样的四个按钮（仅编辑模式，阅读页不显示）。
  - `styles.css`：
    - 四个按钮样式一致。
    - 触屏设备（`pointer: coarse`）上输入框、文本框、下拉框统一为 16px，避免 iPhone Safari 在聚焦字号小于 16px 的输入框时自动放大页面、并一直停在放大状态。截图里页面被推出屏幕、字体变大，就是这个原因。
    - 创作入口卡片标题改用系统字体 600 字重、15px，不再用粗体，也不再回退到毛笔风格的中文手写字体。
  - `i18n.json`：add.*，以及新的画布提示语。
- 测试：
  - 新增 `tests/v37-browser.cjs`（以 iPhone 13 模拟，4 组）：
    - 空白纸与下方栏都提供同样四个选择；
    - 文字一点即可输入，并显示在纸上；
    - 声音可以录或上传，上传后放到纸上；视频和照片一点就打开选择器；
    - 所有可见输入框不小于 16px，无横向滚动，开始卡片标题字重为 600。
- 运行与测试（Linux 容器 + Chromium；测试时临时启动 localhost，测完已关闭）：
  - Node 54、Python 12 全部通过；
  - 浏览器 `browser`、`v3`、`v31`、`v32`、`v33`、`v34`、`v35`、`v36`、`collab`、`v37` 全部通过。
- 已知问题：iPhone 真机 Safari 未实测（以 Playwright 的 iPhone 模拟验证）；当日主页（有固定标题 / 正文的那页）的纸面仍然用原来的主照片位，不显示四个按钮。
- 下一步：用户在在线链接上确认手感。

### 2026-11-08 — 登录页、首次功能介绍、小红书式图片编辑、创作入口、设置返回键

- 需求：要有登录界面，登录后第一次有功能介绍（walkthrough）；像小红书一样编辑图片（滤镜、裁剪、加标题）；创作页进去太单一；设置页没有返回或关闭键。
- 登录（`Public/js/account.mjs` + `app.js` 的 `loginHTML` / `accountAction`）：
  - 本机账号 `little-days.account`，含名字、头像、`onboarded`。没有服务端，Apple 和邮箱/手机号登录按钮禁用并标“即将推出”。
  - 页面明确说明数据只在本设备、不上传；登录页可切换中/英文。
  - 退出登录只把 `signedIn` 改为 false，手帐、媒体和演示数据都不删；再次登录显示“欢迎回来”。
  - 第一次登录时，社区演示的个人主页名字和头像跟随登录信息。
- 功能介绍：6 张卡片（欢迎、＋开始写、修图、成长、书架与主页、默认私人），可跳过、上一步、下一步，只出现一次；设置里可以“再看一次功能介绍”。
- 设置：顶部有“‹ 返回”和“×”，回到进入设置前的页面；新增“账号”卡片（再看介绍、退出登录及说明）。
- 图片编辑：
  - `photo-edit.mjs`：
    - 8 种滤镜。
    - 6 种裁剪比例，可放大、拖动位置、旋转 90°。
    - 亮度、对比度、饱和度、色温调节。
    - 图上标题，4 种样式（手写、标签、胶带、描边）、6 种颜色、可调字号、可拖动位置。
    - 预览用 CSS filter；保存时用同一套数学的颜色矩阵逐像素计算，不依赖 canvas `ctx.filter`，Safari 和 WKWebView 也能用。
  - `photo-editor-ui.mjs`：全屏编辑面板，多张照片可逐张编辑。
  - 从相册加的新照片和“替换照片”会先进入编辑器；“跳过”则保留原图。
  - 非破坏式编辑：编辑后的图片是新的 Blob，存 IndexedDB；原图存为 `layer.sourceRef`，参数存为 `layer.edit`。
  - 选中照片后点“✨ 编辑图片”可以从原图重新编辑；全部还原会回到原图文件。
  - `media.mjs` 的引用遍历加入 `sourceRef`，所以备份和恢复都包含原图；`day.mjs` 的 `fillEmptySlots` 会带上编辑信息。
- 创作入口：底部 ＋ 先显示“今天想怎么开始？”：
  - 继续编辑今天（如果已有内容）。
  - 六种开始方式：照片 / 写字 / 视频 / 录音 / 版式 / 成长。
  - 四个灵感题目，点一下会自动作为标题。
  - 当天已有内容时，新的开始会新建一个小故事，不改动原有内容。首页的“写一个小故事”等直接入口不受影响。
- Swift：`Models.swift` 中 `StickerLayer.sourceRef` / `edit`，新增 `PhotoEdit` / `PhotoEditText`（均为可选字段）；`CoreTests` 往返测试加入这些字段（未编译）。
- 测试：
  - 新增：
    - `tests/v36.test.mjs`（4 项：账号、编辑参数、颜色矩阵、裁剪）；
    - `tests/v36-browser.cjs`（8 组：登录、介绍、设置返回/关闭/退出、创作入口、编辑器各功能、保存后的像素检查〔正方形、暖色、黑白、原图不变〕、从原图重新编辑和还原、备份包含原图）。
  - 新增 `tests/signed-in.cjs`，旧测试共用：
    - 给测试浏览器预置一个已登录、已看过介绍的本机账号；
    - `goTab`：从 ＋ 进入后点“继续/写字”；
    - `skipPhotoEditor`：上传照片后跳过编辑器。
  - 旧测试改用这三个助手。
- 运行与测试（Linux 容器 + Chromium）：Node 54、Python 12 全部通过；浏览器 `browser`、`v3`、`v31`、`v32`、`v33`、`v34`、`v35`、`collab`、`v36` 全部通过。
- 已知问题：
  - 登录只是本机账号，不是真实的账号系统，也没有云同步；
  - 编辑器暂不支持贴纸、画笔、局部调节和多段文字；
  - 当日主页的旧“主照片”、封面和打卡照片暂不进入编辑器；
  - Swift/iOS 未编译，Windows 未实机验证。
- 下一步：用户试用登录、介绍、编辑器的手感；可加编辑器里的贴纸和多段文字、滤镜强度；Phase 3 真实账号。

### 2026-11-08 — 手帐本改成书架，并与“我的主页”合并

- 需求（两张截图）：社区的“我的”页和“我的手帐本”合并；手帐本像书架，把不同的书放上去，抽出想看的那本；同一处可切换到自己的主页，主页用于在想社交时管理哪些内容别人可见。
- 修改：`app.js`：
  - `booksPage` 顶部加“📚 书架 / 我的主页”切换（`booksView`）。
  - `shelfHTML`：每本书是一根书脊，用书的颜色、封面字体和贴纸，竖排书名和页数，立在木质搁板上，每层 5 本，最后一格是“＋”新书位。轻点书脊会把书抽出来（`pulledBook`），上方显示封面卡片，提供打开这本 / 写一页（直接写进这本书）/ 放回书架；再点一次已抽出的书脊即打开。
  - `openProfile`；`openCommunity` 在主页上的编辑类操作原地刷新，打开动态/私信/作品/发布时才进入社区；发布取消回到主页；撤回发布后回到主页。
  - `data-showcase` 切换需确认。
- `community-view.mjs`：社区只保留“发现 / 好友 / 私信”三个页签，头部加“我的主页”入口；发布流程不再依赖“我的”页签；导出 `profileHTML`，新增 `whoCanSeeHTML`（每本书“仅自己 / 主页展示封面”，标注共同创作成员，另列发布、私信、好友三条说明）和 `visitorPreviewHTML`（“别人看到的我的主页”预览）。
- `community.mjs`：`profile.showcase` 加 `setShowcase` / `isShowcased` / `visitorView`，只含封面与书名，不含任何页面；旧演示数据可读。
- 其他：`styles.css`（书架、书脊、抽出卡片、切换、谁能看到、访客预览）、`i18n.json`（shelf.* / me.* / who.*）。
- 决定：“我的主页”属于手帐本页（自己的书和自己的展示放在一处）。展示封面只存演示数据 `little-days.demo-social`，私人手帐的 `visibility` 不变（仍 private），不作真实公开承诺。
- 测试：新增 `tests/v35-browser.cjs`（5 组：书架、抽出 / 放回 / 二次轻点打开 / 写入该书、主页位置与原地编辑、展示封面需确认且取消不生效、访客预览、手帐数据不变、中英文、375/430 宽度），`community.test.mjs` +1。更新旧测试：先抽书再打开（browser / v3 / v31 / v32 / collab），v33 的“我的”改为从手帐本进入主页；新书位的读屏名称与顶部按钮区分。
- 运行与测试（Linux 容器 + Chromium）：Node 50、Python 12 全部通过；`browser`、`v3`、`v31`、`v32`、`v33`、`v34`、`collab`、`v35` 全部通过。
- 已知问题：展示封面和主页仅本机演示，没有真实公开或访问控制；书很多时书架会变成多层，没有搜索或排序；Swift/iOS 未编译，Windows 未实机验证。
- 下一步：用户确认书架手感（抽书动画、书脊高度/颜色）；可加书架排序（拖动换位置）和按分类分层。

### 2026-11-08 — 补完未完成项：Studio 首屏、导出进度/取消、成长页精简、共同创作演示

- 需求：用户要求“之前没做完的也继续做”。
- Studio 首屏：顶部改为一行紧凑栏（`.studio-bar`：日期、保存状态、保存；页面标题改为读屏用的隐藏 h1）；未打开面板时页面占 90% 宽，整页和“撤销/添加”一行都在底部图标条上方（截图确认）。
- 导出视频：`index.html` 新增 `#export-dialog`（进度条、已录制时间、取消按钮，Esc 等同取消）；`export.mjs` 的 `exportJournalVideo` 支持 `isCancelled`，取消时停止录制、关闭音频，抛出 `code="cancelled"`，**不下载任何文件**；`app.js` `exportPageVideo`。
- 成长页精简：去掉大介绍块、主题分组标题、重复的“创建小习惯”按钮和底部里程碑；改为一条进度栏（本周 x/y、累计次数、成长日历入口）+ 紧凑习惯卡（打卡、本周七点、x/目标、📖 成长轨迹页数）+ 两张小回顾便签（已填写时显示第一句）+ 默认收起的“成长小便签”（打开后在重新渲染时保持打开）。
- 共同创作演示：新 `Public/js/collab.mjs`（模型：invite 仅限好友且不自动授权、pending→simulateAccept、setRole、removeMember/离开保留页面、addPage/editPage 权限、版本快照最多 30、restoreVersion 生成新版本、simulateConflict/resolveConflict mine/theirs/both、publishBlockers）与 `collab-view.mjs`（手帐本详情页中可折叠的“共同创作”区，全程标注“演示 · 未联网”）；`app.js`（`collabAction`、写/改共同页面对话框、权限下拉）；存于 `little-days.demo-social`，私人手帐 `little-days.v1` 不包含任何共同创作数据；`styles.css`、`i18n.json`（collab.* 中英）。
- 测试：新增 `tests/collab.test.mjs`（5 项）、`tests/collab-browser.cjs`（成长页 + 共同创作 6 组，`npm run test:browser:collab`）；v34 增加导出进度与取消（取消后无下载）；v31 先展开“成长小便签”；v3 的标题语言检查改读 `#app h1`（Studio 标题为隐藏 h1）。
- 运行与测试（Linux 容器 + Chromium）：Node 49、Python 12 全部通过；`browser`、`v3`、`v31`、`v32`、`v33`、`v34`、`collab` 全部通过。v31 第一次运行时出现过一次超时（日志为空），重跑通过，未能复现。
- 已知问题：共同创作只是本机演示（虚拟好友、模拟接受/冲突），没有账号、服务端权限或真实同步；共同页面是文字页，暂不支持照片/排版；Swift/iOS 未编译、Windows 未实机验证。
- 下一步：用户确认新成长页与共同创作交互；Phase 3 服务端设计；原生构建验证。

### 2026-11-08 — Studio 装饰工具改为底部小图标

- 需求（截图反馈）：照片、版式、字体、纸张等设置行太占地方，希望作为小图标放在画面底部，让手帐页面更大。
- 修改：`app.js` 的 `toolMenuHTML` 改为底部固定的图标条（`.tool-dock`，可横向滑动，显示短名）+ 点开后的底部面板（`.tool-sheet`，标题栏显示当前值与关闭按钮，最高约 34% 屏幕）；未打开面板时页面全宽显示，打开时页面缩小并固定在顶部（`pinStageForSheet`，任何方式打开面板都会把页面固定到上方）；“放大页面”按钮只在面板打开时出现，作用是收起面板；拖动图层时不再自动弹出图层面板（图标条出现“图层”）；删除“装饰这一页”标题与长菜单；`styles.css`；`i18n.json`（dock.* 短名）；测试 v32（图标条位置、放大即收起面板）、v33（图标条存在）。
- 运行与测试：Node 44、Python 12；`browser`、`v3`、`v31`、`v32`、`v33`、`v34` 全部通过。
- 下一步：按用户反馈继续精简。

### 2026-11-08 — 纸上的视频/音频、只有文字、导出为视频或图片

- 需求（截图反馈）：主照片位置不能“只有文字”；希望在纸上同样放视频、音频；可以选择导出为视频或图片。
- 修改：`day.mjs`（`applyPageTemplate` 支持 `force` 让照片离开页面〔文件保留、可撤销〕；`mediaLayer`/`isOnPage`：视频/音频图层只引用 page.media 中的片段）；`canvas.mjs`（`video`/`audio` 图层：纸上播放按钮、视频画框、音频票根与声波，编辑与阅读共用）；`app.js`（新片段自动放到纸上，日页避开固定标题/正文；媒体卡片“放到纸上/从纸上拿下”；删除片段同时移除图层；图层可拖动/缩放/旋转/调宽高；播放按钮不触发拖动；只有文字需确认；导出分“导出图片 / 导出视频”，录制时显示进度并阻止离开）；`export.mjs`（拆出 `renderJournalCanvas`；PNG 画出视频帧与音频票根；`exportJournalVideo` 用 canvas.captureStream + MediaRecorder 录制整页，视频在画框中播放，所有片段声音经 WebAudio 混音，时长取最长片段〔4–60 秒〕，优先 MP4 否则 WebM）；`day-view.mjs`（纸上的片段不在下方列表重复）；Swift `StickerLayer.clipId`；`styles.css`、`i18n.json`；测试 `v31.test.mjs`（+1）、新 `tests/v34-browser.cjs`，并按新行为更新 v3/v31/v33 浏览器测试的选择器与断言。
- 运行与测试：Node 44、Python 12；`browser`、`v3`、`v31`、`v32`、`v33`、`v34` 全部通过（v34：只有文字覆盖主照片并撤销；视频/音频上纸、播放、调整大小、拿下放回；导出 PNG；导出视频为 MP4、约 4 秒、解码音频非静音；阅读页在纸上播放且不重复列出）。
- 已知问题：在线链接（claude.ai）禁止下载，导出图片/视频需在 localhost 或 iOS App 中使用；导出视频需浏览器支持 MediaRecorder（iOS 14.3+/现代 Chrome），录制时间等于视频长度。
- 下一步：用户确认交互；可加导出时的进度条与取消。

### 2026-11-08 — 首页简化：一张邀请写作的卡片

- 需求（截图反馈）：首页大标题太占位置，应更多鼓励写作；“添加照片 / 写点什么 / 今日心情”其实都进入同一个界面；按钮太多，希望简洁流畅。
- 修改：`Public/app.js` 重写 `home()`——顶部只留小号品牌名与设置；今日卡片（日期 + 小号邀请语“今天想记下什么？”/“今天，也有小美好。” + 今日预览〔点开为读今天的 Day Detail〕+ 唯一主按钮“写一个小故事”）；保留今日打卡与手帐本；删除快捷四按钮、顶部日历按钮（底部菜单已有）、社区卡片、Studio 卡片。`styles.css`、`i18n.json`（home.prompt、home.readToday）；`tests/v33-browser.cjs` 增加首页检查并改走底部菜单进入社区。
- 运行与测试：Node 43、Python 12；五套浏览器 E2E 通过（期间一次 v32/v33 失败系截图用的临时 60 秒预览服务已退出，重启服务后重跑通过）。localhost:8080 已以 `--host 0.0.0.0` 重新启动并登记。
- 下一步：按用户在链接中的反馈继续简化其它页面（如 Studio 菜单项数量）。

### 2026-11-07 — 社区：底部菜单、好友列表、我的个人主页

- 需求：社区放到下面的菜单；好友列表难找；需要“我的个人主页”管理自己的社区。
- 修改：共享 `features.json` 新增第 6 个底部菜单 `community`（SwiftUI 原型根视图给出占位与 `person.2` 图标）；`Public/js/community.mjs` 新增 `profile`（头像/昵称/简介/新发布默认评论/好友申请来源）、`updateProfile`、`myWorks`、`savedWorks`、`myStats`、`visibleIncoming`，旧演示数据自动补默认资料；`community-view.mjs` 改为 4 个主页签（发现含推荐/关注/热门/分类 + 搜索）、好友页以好友列表开头并可搜索创作者、新增 `profileHTML`；`app.js` 新动作（feed、jump、资料编辑/头像/保存、收藏类型、设置）、首页去掉重复的社区图标（保留社区卡片）、焦点保持支持搜索框；`styles.css`；`i18n.json`（约 45 条）；测试 `community.test.mjs`（+1）、`v33-browser.cjs`（新页签结构 + 个人主页组）；ROADMAP/PRODUCT_SPEC。
- 运行与测试：Node 43、Python 12；`browser`、`v3`、`v31`、`v32`、`v33`（6 组）全部通过；iOS 外壳副本一致。会话开始已按规则以 `--host 0.0.0.0` 重新启动 localhost:8080 并登记。
- 已知问题：仍为本机演示；“只看我关注的人的好友申请”只隐藏、不自动处理（演示）。
- 下一步：Collaborative Journal 演示，或按用户在链接中的反馈调整。

### 2026-11-07 — V3.3：写作优先、按照片数量选模板、写小故事入口、社区本机演示

- 需求：合并 PR #3（已合并 `b5efd6f`）；小故事的文字编辑不应与字体/模板平级以鼓励创作；模板先选照片数量（可只有标题/文字）再排版；写小事件的入口难找；可以做社区本地版。
- 修改/新增：`Public/app.js`（写作卡片 `writeCardHTML`、“装饰这一页”、模板两步选择 `templatePickerHTML`、`addMomentNow` 与 `quick-moment` 入口、空相框填充、重新渲染保留焦点；社区页面、动作、输入与独立存储）；`Public/js/day.mjs`（`TEMPLATES_BY_COUNT`、`applyPageTemplate`、`fillEmptySlots`、full/corner/stack 版式）；`canvas.mjs`（空相框、纯文字页）；`day-view.mjs`（隐藏空相框、纯文字页、添加小故事按钮）；`export.mjs`；新增 `Public/js/community.mjs`、`community-view.mjs`；`styles.css`；`i18n.json`（约 140 条）；测试 `tests/community.test.mjs`（6）、`v31.test.mjs`（+1）、`tests/v33-browser.cjs`（新）及旧 E2E 帮助函数；文档 ROADMAP/PRODUCT_SPEC/ARCHITECTURE/DESIGN_SYSTEM；iOS 外壳副本已同步。
- 决策：写作是主流程，装饰为次要折叠菜单；模板不删除已有照片（可选数量不少于已有照片）；社区演示与手帐数据完全分离（独立 localStorage 键，不进备份，无网络请求），所有界面标注“演示 · 未联网”；发布默认零勾选、逐项确认、记账内容锁定、成长感想需单独允许。
- 运行与测试：Node 42、Python 12 通过；`browser.cjs`、`v3`、`v31`、`v32`、新 `v33`（首页一键写小故事并聚焦标题、写作在菜单之上、模板数量→版式与空相框按序填充、禁止少于已有照片、纯文字页、阅读隐藏空相框、Day Detail 添加小故事；社区五个浏览视图、点赞/收藏为封面/评论与回复/关注/好友申请、接受/模拟接受/屏蔽、私信文字/贴纸/分享作品/模拟回复/删除、发布零默认勾选与确认/关闭评论/撤回、手帐数据不变、英文与 375/390/430 无溢出）全部通过。发现并修复：媒体加载后重新渲染导致输入框失焦；好友页同一用户重复出现。
- 已知问题：社区为本机演示，无真实账号/服务器/权限；协作手帐演示尚未做。
- 下一步：Collaborative Journal 演示（邀请、Owner/Editor/Viewer、贡献者标记、版本与冲突提示），或用户在链接中反馈的界面调整。

### 2026-11-07 — V3.2：创作桌面、成长轨迹、按日封面、更多纸张/主题/中文字体

- 需求（用户反馈）：纸张只有三种；添加内容要拖到很下面、排版与照片分离、看不到改动效果，希望概括菜单点开看细节；选中小故事后如何看/播放音视频；宠物、亲子主题；像看书一样看习惯成长和每日心得；小确幸按日子有封面、日子里看具体事件；手帐本选择日期；中文字体更多样。另附 V3 全量需求（社区/好友/私信/协作/后端），按 ROADMAP Phase 2–4 处理。
- 修改/新增：`Public/app.js`（Studio 桌面：小故事标签条、固定预览与放大、概括菜单与摘要实时更新、选中图层/加照片/选中有媒体的小故事自动展开对应行；成长轨迹页面、翻页/滑动/方向键；手帐本按日封面与筛选）；新增 `Public/js/journey-view.mjs`；`Public/js/day.mjs`（`habitJourney`、`bookDays`、`bookMonths`）；`canvas.mjs`/`export.mjs`（9 种纸张）；`styles.css`；共享 `features.json`（纸张）、`library.json`（4 款中文字体、6 套新预设）、`i18n.json`（约 60 条）；4 个 TTF + OFL；`tools/merge_font_slices.py`；测试 `tests/v32-browser.cjs`、`v31.test.mjs`（+2）、`library.test.mjs`（字体数量）及三套旧 E2E（改为先展开菜单行）；文档 ROADMAP、PRODUCT_SPEC、DESIGN_SYSTEM、ARCHITECTURE、ASSETS；iOS 外壳副本已同步。
- 决策：一次只展开一个菜单行，避免页面变长；摘要用 `refreshToolSummaries` 局部更新，不打断输入；中文字体来自包管理器可访问的 OFL npm 包（GitHub/Google Fonts 下载被网络策略阻止），合并工具去重后体积 1.5–7 MB/款。
- 运行与测试：Node 35、Python 12 通过；`browser.cjs`、`v3-browser.cjs`、`v31-browser.cjs`、新 `v32-browser.cjs`（菜单一次一行、9 种纸张切换、预览固定可放大、心情/排版/标题摘要同步、选中小故事直接播放、6 套新预设与 5 款中文字体加载、成长轨迹统计/按钮/方向键/滑动/目录/写今日心得、按日封面与月份/日期筛选、375/390/430 无横向溢出）全部通过。未验证：Windows 实机、iOS 构建。
- 已知问题：合并后的中文字体不含竖排/复杂替换特性；社区等社交功能未开始。
- 下一步：用户确认 Phase 2 社交原型范围；在线链接已按规则重新发布。

### 2026-11-07 — 桌面 App 可点击的 Dev servers

- 需求：在 environment 里有一个随时可点的服务器。
- 调查：官方文档仅说明 Claude 桌面 App 本地会话通过 `.claude/launch.json` 提供 Browser 面板的 Dev servers；网页/云端会话侧栏没有文档化的服务器列表（无法在当前云端会话中实现）。
- 改动：新增 `.claude/launch.json`（Little Days (Windows) = `py -3 tools/preview.py --port 8080`；macOS/Linux = `python3`；`autoPort:false`）；README、AGENTS.md 说明。
- 验证：JSON（含注释）结构按文档字段编写；未在用户的 Windows 桌面 App 中实测。

### 2026-11-07 — 在线链接（claude.ai Artifact）

- 需求：用户的会话面板没有 servers 区，看不到 localhost；希望有一个点开就能看的链接。
- 改动：Web 资源路径全部改为相对路径（index/CSS/fonts.css 生成器/`shared/` fetch/`library/` 贴纸与许可证/示例照片 `/assets/…` 在显示时转为相对路径，保存的数据不变）；四处 `confirm()` 改为页面内确认框 `askConfirm`（在线链接会拒绝浏览器弹窗；localhost 与 iOS 外壳同样适用）；`body` 明确背景色；新增 `tools/build_link.py` 生成 `dist/link/`（不提交）；发布为私有 Artifact：https://claude.ai/artifact/VYUJ38K5TBqcZPB8VzJS7A ；README 顶部改为该链接，AGENTS.md 写明每次更新发布到同一链接；测试改为点击页面内确认框；iOS 外壳副本已同步。
- 验证：Node 33、Python 12、三套浏览器 E2E 全部通过；本地模拟子路径 + 外框加载在线版：0 个失败请求、0 个脚本错误，照片与贴纸正常显示。
- 已知限制：在线链接里麦克风录音被拒绝（会提示）、下载（备份/PNG）无效、数据只在该浏览器；未在用户设备上确认打开效果。
- 下一步：用户点开链接确认；以后每次改动重新构建并发布到同一链接。

### 2026-11-07 — 修复会话 servers 面板看不到 localhost

- 需求：合并 V3.1 + 外壳到 main（PR #1 已合并，`f926f1d`）；用户在 environment 旁的 servers 里看不到 localhost。
- 原因：① 会话容器重启后预览服务停止；② `tools/preview.py` 固定只监听 127.0.0.1，会话预览面板从容器外连接时连不上。
- 改动：`tools/preview.py` 新增 `--host`（默认 127.0.0.1，个人电脑仍只对本机开放；云端会话用 `0.0.0.0`），更新过时的 ZIP/“非 SwiftUI”提示文字；AGENTS.md 写明云端启动命令与容器重启后需重新启动；README 日志。
- 验证：服务以 `--host 0.0.0.0` 启动后，通过容器网卡地址访问 `/api/health` 与首页成功，已重新登记 8080；Python 测试见提交。用户侧面板是否出现需用户确认。
- 下一步：用户确认 servers 中可见；若仍不可见，检查会话预览功能设置。

### 2026-11-07 — iOS Swift 外壳 + localhost 链接查看

- 本次需求：README/AGENTS 不再让用户下载 ZIP，改为点 localhost 链接查看；保留 Swift 代码并与 HTML 保持一致——用户说明即“Swift 套壳”，最终发布 iOS，日常在 Windows 用 localhost 看更新、提出修改。
- 修改/新增文件：新增 `Native/Sources/LittleDaysUI/WebShell/LittleDaysWebShellView.swift`、`LittleDaysWebResources.swift`，`Native/Sources/LittleDaysUI/WebApp/`（`Public/` 副本），`tools/sync_native_web.py`，`tests/test_native_shell.py`；修改 `Native/App/LittleDaysApp.swift`（入口改为外壳）、`Native/Package.swift`（资源）、`Native/LittleDays.xcodeproj/project.pbxproj`（麦克风/相机说明、文件共享）、`Public/styles.css`（`data-shell="ios"` 全屏样式）、`Start-Windows.cmd`（Git 克隆时自动 `git pull --ff-only`）、AGENTS.md、README.md、docs/WINDOWS_PREVIEW.md、docs/ARCHITECTURE.md。
- 实现功能：iOS App 加载打包的同一份 Web 界面；路由与 Python 预览一致；JS 对话框、麦克风、下载/分享、外部链接由原生处理；Web 外框在 App 中隐藏；README 顶部可点击 localhost 链接；Windows 双击即更新并启动。
- 技术决策及原因：只维护一份界面（`Public/`），避免原生界面落后于 Web；同步工具 + 测试防止 App 打包旧文件；固定 `littledays://app` origin 保留本地数据；早期 SwiftUI 原型与 Core 模型保留不删。
- 运行与测试结果：见本条之后的提交说明——Python 12 项（含 3 项外壳检查）、Node 33 项、三套浏览器 E2E 均已重新运行。**未验证**：Swift 外壳的 Xcode 构建、模拟器与真机（本环境无 macOS/iOS SDK，也无法下载 Swift 工具链）；WKWebView 自定义协议下 IndexedDB/录音需真机确认；Windows 上 `git pull` 自动更新未实机运行。
- 已知问题：localhost 与 iPhone App 数据彼此独立；Swift 代码未编译。
- 下一步建议：在 Mac 上用 Xcode 构建一次外壳并真机测试录音、照片、备份；之后日常只看 localhost 链接。

### 2026-11-07 — V3.1：自由排版、多事件日记、完整回忆浏览与成长感想

- 本次需求：在 V3 基础上按 P0→P3 实现 Calendar 完整回忆浏览（音视频只读播放）、多照片自由排版、一天多个 Moments、Growth 感想与周/月回顾；保留已有功能、存储与备份规则；新增自动化/浏览器测试并更新文档。
- 修改/新增文件：`Public/app.js`（Studio 目标页抽象、章节/版式/图层控制、手势、Day Detail 路由、媒体 scope、感想/回顾对话框、Growth 区块）；新增 `Public/js/day.mjs`、`canvas.mjs`、`day-view.mjs`；修改 `model.mjs`（moments/感想/回顾的补全与校验）、`media.mjs`（scope 引用计数、usage、moments/打卡照片引用、备份文件数上限）、`export.mjs`、`personal-ui.mjs`、`index.html`（多选输入、灯箱）、`styles.css`；共享 `i18n.json` 新增约 130 条中英词条；Swift `Models.swift` 可选字段与 `CoreTests.swift` 新测试；新增 `tests/v31.test.mjs`、`tests/v31-browser.cjs`，更新 `tests/browser.cjs`、`tests/v3-browser.cjs`、`tests/media.test.mjs`、`package.json`；文档 README、PRODUCT_SPEC、ARCHITECTURE、ROADMAP、DESIGN_SYSTEM 与 3 张 V3.1 截图（合成数据）。
- 实现功能：见 README「V3.1 新增」与 ROADMAP V3.1 清单。P0 Day Detail + 统一播放器 + 日历标记；P1 多照片图层与 Auto/Free Layout；P2 Moments；P3 打卡感想、周/月回顾、成长卡片。
- 技术决策及原因：见上方「关键决策」V3.1 条目。测试中有三处旧断言按新行为调整：有内容的日期现在打开 Day Detail（`browser.cjs`）；音频元素被设计播放器隐藏、音视频改为视图加载后才有 src（`v3-browser.cjs` 等待 `attached`/`blob:`）；启动 hydrate 不再载入音频（`media.test.mjs` 改为验证 acquire/release）。另在两个浏览器测试中加入可选 `CHROMIUM_PATH` 以使用环境预装 Chromium。
- 运行与测试结果：Ubuntu 24.04 容器，Node 22.23.4 / Python 3.13.18 / Playwright 1.62.1（配合预装 Chromium）。Node **33 项全部通过**（原 22 + 新 11：旧数据兼容、Moments 排序/复制/单独保存、书本归类、非法结构拒绝、感想不重复计数、周月回顾、5 模板 × 1–9 张版式边界、布局只移动照片、媒体引用含 Moments/打卡照片、备份恢复保留 Moments/坐标/裁切/感想/回顾）；Python **9 项通过**；原有 `browser.cjs`、`v3-browser.cjs` **通过**；新 `v31-browser.cjs` **通过全部 14 项验收**：一次 5 张、5 张逐一拖动/滚轮缩放/置顶、把手调整宽高与旋转、裁切/相框、CDP 真实双指捏合旋转、置底/上移一层、模板切换前确认、保存刷新后数据与 DOM 布局完全一致；3 个 Moment 独立编辑/排序/折叠/单独保存；Calendar 显示 3 章、上传音频与录音在 Day Detail 播放（互斥、拖动进度）、视频播放、照片灯箱、离开后对象 URL 已撤销、刷新后仍可播放；感想保存/重开/编辑、时长习惯打卡附感想、周回顾；成长卡片插入且不重复、删除 Moment 后打卡保留、修改感想同步到 Calendar；中英切换内容不变；备份→新浏览器恢复（坐标、Moments、感想、回顾、录音可播放）；375/390/430 无横向溢出、1280 桌面纯鼠标拖动/把手/滚轮/Shift 旋转/方向键；旧版 data URI 主照片 + Emoji 图层 + 旧书本正常打开；无页面脚本异常。**未运行**：Swift Core 6 项（含新增 1 项）与 Vapor 2 项（无 Swift 工具链，下载被拒），Windows 实机，iOS SDK/模拟器/真机，Safari/Firefox。
- 已知问题：见「已知问题与下一步」V3.1 条目；另外 GitHub 推送需要仓库授权（本会话的 Claude GitHub App 未获该仓库写权限时只能本地提交）。
- 尚未完成：原生对齐、Moment 内分页、滤镜、高级导出、分卷备份与媒体清理。
- 下一步建议：在 macOS 运行 `swift test` 与 iOS 构建；Windows 实机按 README 验收 V3.1；然后原生实现 Day Detail 与 Moments 阅读，再做 Moment 内分页与媒体引用清理。

### 2026-11-07 — V3 Phase 1：自定义书本、素材、多媒体与双语

- 本次需求：在已有项目上实施 V3 第一阶段，保留数据与架构，增强主题/封面、字体/贴纸、视频/音频，整理完整后续路线并提交。
- 修改/新增文件：Public/app.js、样式与入口；model/export 与新 media/library/personal-ui/i18n 模块；Core Models/Resources、catalog/翻译、七款 TTF/OFL、23 SVG/PNG 与测试；Native 五页/NativeStore、新 BookCoverView/SettingsView；Vapor 资源路由/测试；Windows 启动器/Python 服务/字体生成工具；Node/Python/E2E 测试与锁文件；AGENTS、README、agent、PRODUCT_SPEC、DESIGN_SYSTEM、ARCHITECTURE、ASSETS，以及 ROADMAP/WINDOWS_PREVIEW/截图。
- 实现功能：任意书本名称/描述/主题；六种封面、字体/颜色/装饰/照片、后续编辑；七种通用字段与六套预设；七类真实字体、中英混排/预览、独立文字框；十类原创贴纸、复制/变换、照片拼贴层；视频封面/播放、音频上传/录音/播放、进度/时长；双语偏好；IndexedDB、旧照片迁移、本机备份导出/确认恢复、旧标签页提示。
- 技术决策及原因：增量模块化，不换 React；标准 Web API 的 IndexedDB/MediaRecorder 与 Python 无构建预览满足 Windows；共享资源与可选 Codable 字段保持兼容；正版字体/原创图形满足商业资产来源；Private 默认且不假装已经上线社交。
- 运行与测试结果：Linux Debian 13，Node 24.22.1 / Python 3.12.14 / Swift 6.0.3 / Playwright 1.62.1。22 项 Node（含真实 IndexedDB 语义的 fake-indexeddb）、9 项 Python（HTTP/资源/ZIP 空格路径/跨目录/端口/完整性）、5 项 Core Swift（旧格式与 V3 round-trip/许可）、2 项 Vapor（含字体/SVG/共享 JSON），共 38 项全部通过。原有浏览器回归与 V3 E2E 均通过：六种封面、任意书本/8 字段示例、七款字体真实加载、原创贴纸/文字层、Blob 图片/视频/音频/虚拟麦克风录音、刷新后真实播放、播放互斥、备份取消/确认恢复、双语偏好/内容保留、旧照片迁移与旧标签页检测、375/390/430 宽度；无页面脚本异常。另通过 23 个 480px RGBA 透明 PNG 检查、SwiftUI 源文件语法解析、JS/Shell/Python 语法、文档链接与历史日志保留复核。Windows CMD 实机、iOS SDK 构建/模拟器/真机未验证，不能由以上结果替代。
- 已知问题：Windows 实机和 iOS SDK 尚不可验证；原生新功能不等同 Web 完成；本地媒体容量、导出差异、格式/原生控件语言依赖浏览器；本机旧标签页检测不代替真正协作事务。
- 尚未完成：真实社交/账号/权限/媒体后端、协作邀请/角色/版本、音乐/剪辑/转写、自定义素材包、主照片高级裁切/滤镜、可靠云媒体和保留清理机制、原生全面对齐。
- 下一步建议：先 Windows/iOS 实测与原生个人功能补齐，按 ROADMAP 分阶段推进，不把后端设计或社交演示称为已上线功能。

### 2026-11-07 — Little Days 第一阶段：SwiftUI 基础与 Windows 交互预览

- 本次需求：整理产品/设计；验证 SwiftUI 与 Windows localhost 可行方案；在原仓库上实现精致 Home、基础导航和可交互页面；维护文档并实际测试、提交。
- 新增/修改文件：Public 的 HTML/CSS/JS、model/export 模块；Packages/LittleDaysCore 的 Swift 模型、规则、共享资源/照片与测试；Native 的 UI Package、五个 SwiftUI 页面、NativeStore、App 入口、Xcode 工程；tools 的 Python 服务和配色生成脚本；Start-Windows.cmd；tests、package.json/lock；既有 Vapor 配置/测试与 Package.swift；AGENTS/README/agent 及 docs 全套文档、真实 Web 截图。
- 已实现：五页交互导航；当天手帐与照片；按月日期回看和历史补记；两种打卡、自定义主题、周目标/基础里程碑；Quick/Creative 基础编辑，图片上传、贴纸变换、排序与撤销/重做；草稿、本机保存、PNG；主题手帐本创建和记录归类。
- 技术决定：原生 SwiftUI + 独立 HTML 预览，共用 Core 资源与数据契约；保留 Vapor，Windows 使用零构建依赖 Python 入口。完整取舍见 docs/ARCHITECTURE.md。
- 运行与测试：Debian 13 / Swift 6.0.3 / Python 3.12.14 / Node 24.22.1 / Playwright 1.62.1。6 项 Node 数据/配色测试、3 项 Python HTTP 测试、2 项独立 Core Swift 测试、2 项 Vapor 测试全部通过，共 13 项。Chromium 在 Python 8080 与 Vapor 8081 两个入口完整验证导航、打卡/取消/时长输入、自定义主题/手帐本、历史补记、文字/心情/模板/字体、贴纸拖动/缩放/旋转/排序、撤销/重做、照片上传、PNG 下载、保存后刷新与草稿恢复；375/390/430 宽度无横向溢出，未出现页面脚本异常。另通过 SwiftUI 源文件语法解析、Native Package 清单解析、Xcode OpenStep plist（20 对象）解析、Shell/JS 语法、Python 编译、文档链接和历史日志保留检查。SwiftUI 尚未进行 iOS SDK 类型检查或构建，Windows 尚未实机运行。
- 已知问题：未在 Windows 实机测试；SwiftUI 未进行 iOS SDK 类型检查/构建；Web 本机存储容量有限、原生功能落后于 Web，且两端未同步；导出与 DOM 版式有差异；字体/Emoji 随平台不同。
- 尚未完成：照片自由裁切/变换/多图、自由文本框、完整胶带与相框、原生照片/贴纸编辑和自定义习惯/书本、可靠备份/同步、完整素材与发布能力。
- 下一步建议：优先做原生 iOS 构建与真机验证，继续照片裁切/自由编辑和媒体存储备份；按文档维护两端功能差异。

### 2026-11-07 — 新增 Swift + HTML 本地预览框架

- 需求：使用 Swift 框架与 HTML，在个人电脑通过 localhost 查看软件，无需打开 Xcode。
- 改动：新增 Swift Package、Vapor 服务入口、首页和健康检查路由、HTML/CSS/JavaScript 页面、start.sh、Start.command、后端测试和构建忽略规则；在 AGENTS.md 固定 Swift + HTML 与 localhost 预览约定。
- 使用：安装 Swift 6.0+ 工具链，在仓库根目录运行 `bash start.sh`，打开 http://localhost:8080；`PORT=8081 bash start.sh` 可更换端口。Ctrl+C 停止。
- 验证：Linux 环境 Swift 6.0.3 编译成功，2 项 XCTVapor 测试通过（健康检查、首页及 CSS/JavaScript）；实际启动脚本运行成功。Chromium 验证首页、真实后端连接、断线提示、重连和移动端无横向溢出，无页面脚本异常。另通过 Shell/JavaScript 语法、跨目录启动、8 组端口输入、文档链接与历史日志保留检查。
- 未完成事项：用户个人电脑实际运行；软件业务功能待用户明确。
- 下一步：按用户需求扩展 Swift 后端与 HTML 界面，继续维护两处日志。

### 2026-11-07 — 建立跨会话交接机制

- 需求：每次更新同步记录到 agent.md 和 README.md，便于后续会话接续。
- 改动：新增 agent.md 和 AGENTS.md；扩充 README.md，加入协作规则、当前状态和更新日志。
- 验证：已核对文档中的文件名、相对链接及两处日志的一致性；本次仅修改文档，无应用代码可测试。
- 未完成事项：项目功能与技术方案待用户明确。
- 下一步：根据用户提供的具体需求开展工作，并继续同步维护两处日志。

后续详细日志模板（新增条目放在本节最上方）：

```markdown
### YYYY-MM-DD — 更新标题

- 需求：
- 改动：
- 验证：
- 未完成事项：
- 下一步：
```
