# Little Days · 手帐文具店

**记录生活的美好，也收藏一点点变好的自己。**
**Collect moments, grow gently.**

最新完成 **V3.1：自由排版、多事件日记、完整回忆浏览与成长感想**（Web 交互预览）。在现有项目上继续采用 **Swift + SwiftUI（最终 iPhone）+ HTML/CSS/JavaScript（Windows 交互预览）**，保留 Vapor 与共享 Core；没有切换 React。Web 页面不是实际运行的 SwiftUI。

## Windows 打开最新版（无需 Git）

你已经有 Python 3.10+ 时，不需要安装 Git、Swift、Node 或 Xcode 来预览。

1. [下载最新版 Notebook-main.zip](https://github.com/jessiethere/Notebook/archive/refs/heads/main.zip)。
2. 右键 **全部解压缩**，进入同时含 `Start-Windows.cmd`、`Public`、`tools`、`Packages` 的那层目录。
3. 双击 **Start-Windows.cmd**，脚本会检测 Python 并自动打开浏览器。
4. 访问 **http://localhost:8080**，保持终端开启，Ctrl+C 停止。

手动启动：在上述目录的资源管理器地址栏输入 `cmd`，回车后运行：

```cmd
py -3 tools\preview.py --open
```

没有 `py` 可用 `python tools\preview.py --open`。文件名是 `preview.py`，不是 `preview\.py`。端口占用可明确使用 `--port 8081`，但更换地址/端口会切换浏览器存储 origin。完整图解步骤和报错说明见 [Windows 启动指南](docs/WINDOWS_PREVIEW.md)。

更新时先停止旧服务，再下载/解压新 ZIP；继续使用同一浏览器、`localhost:8080`，并先在 Settings 导出本机备份。已有 Git 环境可在仓库目录 `git pull`。macOS/Linux 可运行 `python3 tools/preview.py --open`；现有 Swift/Vapor 仍为 `bash start.sh`（Swift 6.0+）。

## V3.1 新增（Web）

- **Calendar 回忆阅读（Day Detail）**：点有内容的日期，直接阅读当天全部 Moments、照片排版、文字/贴纸、心情、视频（直接播放）、音频与录音（设计感播放器：播放/暂停/拖动进度/时长）、成长打卡与感想；照片可放大；点 Edit 才进入 Studio。刷新或重选日期后从 IndexedDB 重新载入，离开页面释放临时 URL。日历格子用小圆点标记照片/视频/声音/成长，多个小故事显示数字。
- **多照片自由排版**：「添加照片」一次多选（单次最多 20 张），继续添加不会覆盖；每张照片可拖动、双指缩放旋转、鼠标拖右下角改宽高、拖顶部圆点旋转、滚轮缩放（Shift 旋转）、方向键微调；裁切、相框（拍立得/白边/圆角/无边框）、胶带、替换、复制、删除、前后/逐层顺序，全部可撤销重做，可与贴纸、文字框、成长卡片混排。
- **Auto / Free Layout**：双照片、三照片、四宫格、拍立得、拼贴；按照片数量自动建议；手动调整后再套模板会先提醒。
- **一天多个小故事（Moments）**：Studio「添加一个小故事」，每个有小标题、时间、正文、心情、标签、手帐本、照片/视频/录音和独立画布；可排序、复制、删除、折叠、单独保存。
- **Growth 感想**：打卡后点 ✎ 写内容/时长/感想/心情/照片，可随时回看修改；每周/每月回顾（全部可选）；感想可作为卡片插入手帐，修改感想会同步更新，不会重复计数；删除手帐页不会删除打卡。感想默认私人。

![V3.1 Day Detail（Web 预览截图，合成示例数据）](docs/images/little-days-v31-day-detail.png)

## 当前真正可用的 Web 功能

- **原有五页**：Home、Calendar、Growth、Studio、My Books；日期补记、每日习惯/时长、周目标、手帐归类、草稿与撤销/重做继续可用。
- **自由主题书本**：名称、描述、任意类别；创建后可继续编辑。六种封面有书脊/质感/边框、颜色、字体、原创装饰与上传照片。
- **通用记录字段**：文字、数字、日期、单选、复选框、时长、图片；Fitness/Recipe/Learning/Money/Skincare/Plant 预设，不为每个主题另写编辑器。
- **真实字体**：七款本地 OFL 字体，覆盖七种分类，含中文；实时预览、标题样式、独立正文字体、多文字框独立字体/大小/颜色/对齐/位置。保留旧系统字体和旧 Emoji 图层。
- **原创素材**：十类 23 个 SVG + 480px 透明 PNG；可拖动、缩放、旋转、复制、删除、排序。可额外加入自由变换的照片拼贴层。
- **视频与音频**：视频上传/设置封面/内嵌播放；音频上传/播放；麦克风授权后录音并保存。浏览器原生控制支持暂停、进度、时长、静音，刷新后可重开。
- **简体中文 / English**：Home 右上角 Settings 切换并保存偏好；界面、表单、状态双语，用户的书名、正文、文件名和媒体不翻译。
- **数据保护**：新媒体放进 IndexedDB，LocalStorage 存元数据和引用；旧主照片安全迁移。Settings 可导出/确认恢复完整本机备份；旧标签页更新会提示冲突。
- **始终私人**：新旧书本默认 Private，Public / Shared 暂禁用。本轮没有联网社区、好友、私信、协作或音乐，不假装已经有服务端权限控制。

![Little Days V3 Web 手帐本界面，非 SwiftUI 截图](docs/images/little-days-v3-books.png)

## 原生 SwiftUI 与共享资源

`Native/LittleDays.xcodeproj` / `Native/Package.swift` 提供 iOS 17+ 原生基础。共享 Core 已扩展 V3 媒体、字段、字体和素材类型；SwiftUI 基础页面增加双语 Settings、CoreText 字体注册/选择与原创 PNG 封面。

原生端尚未对齐 Web 的视频/录音导入、完整封面/字段编辑和自由画布，浏览器数据也未同步到 iPhone。当前仅验证 SwiftUI 语法与 Swift 模型/资源，**尚未运行 iOS SDK 构建或真机**；需在 macOS + Xcode 16+ 进一步验证。

## 项目文档

| 文档/目录 | 用途 |
| --- | --- |
| [AGENTS.md](AGENTS.md) / [agent.md](agent.md) | 长期规则、详细交接与保留的历史日志 |
| [PRODUCT_SPEC](docs/PRODUCT_SPEC.md) | 完整 V3 需求、实际范围与限制 |
| [DESIGN_SYSTEM](docs/DESIGN_SYSTEM.md) | 配色、精致封面、字体、素材和双语规范 |
| [ARCHITECTURE](docs/ARCHITECTURE.md) | 当前架构/兼容策略，以及未部署的社交后端和权限设计 |
| [ROADMAP](docs/ROADMAP.md) | Phase 1–5 的详细任务与验收清单 |
| [ASSETS](docs/ASSETS.md) | 素材来源、SIL OFL 和原创许可 |
| [Windows 指南](docs/WINDOWS_PREVIEW.md) | 无 Git 下载、启动、更新与故障排查 |
| `Public/js/` | 元数据、IndexedDB、通用 UI、素材、双语与图片导出模块 |
| `Packages/LittleDaysCore/` | 共享 Swift 模型/规则/JSON/字体/素材 |
| `Native/` | 原生 UI Package 和 iOS App 工程 |

## 本轮测试

V3.1 本轮在 Linux 容器验证：**33 项 Node、9 项 Python 全部通过**；原有两套浏览器 E2E 与新的 V3.1 浏览器验收（14 项要求）全部通过，详情见 agent.md。本轮环境没有 Swift 工具链，**Swift Core 与 Vapor 测试未运行**；也尚未在 Windows 实机、iOS SDK、Safari/Firefox 上验证。

Python HTTP/启动测试：

```cmd
py -3 -m unittest discover -s tests -p "test_*.py"
```

可选浏览器测试需要 Node.js 22+，预览本身不需要。先启动 localhost，再开另一终端：

```cmd
npm ci
npm test
npx playwright install chromium
npm run test:browser
npm run test:browser:v3
npm run test:browser:v31
```

测试使用合成媒体与虚拟麦克风、独立浏览器上下文，不读取真实用户手帐。Swift 环境运行根目录 `swift test --jobs 4`，以及 `swift test --package-path Packages/LittleDaysCore --jobs 4`。变更设计颜色/字体目录后运行 `python tools/sync_tokens.py` / `python tools/sync_library.py`。

## 限制与下一步

- 视频单文件 50 MB，音频 20 MB，录音单次最多 5 分钟；格式兼容性取决于浏览器，当前验证 Chromium。浏览器原生媒体/日期控件的语言跟随浏览器设置。
- 新媒体在 IndexedDB，仍属本机站点数据，清理浏览器数据可能删除。完整备份媒体导出上限 100 MB，导入文件上限 150 MB；尚无分卷、加密或云备份。
- 静态 PNG 不包含可播放的音视频；导出与 DOM 排版存在差异。主照片自由裁切、滤镜、完整相框和高级信息卡片仍未实现。
- 没有真实用户账号、社区/好友/私信服务、协作角色与原子版本控制、背景音乐或流媒体接入。旧标签页提示不等于多人协作。
- 优先做 Windows/iOS 平台实测与原生个人能力对齐；再按 Phase 2 做清楚标注的社交原型，Phase 3 服务端，Phase 4 协作，Phase 5 高级创作/授权音乐。

## 协作与会话接续

开始任务先读 AGENTS.md、agent.md、README.md 与三个规范文档，再检查最新代码/提交。每次修改必须同步维护 **agent.md 与 README 日志，并随代码提交**。保留历史，禁止将私人内容、备份或密钥提交到公开 GitHub。

## 更新日志

### 2026-11-07 — V3.1：自由排版、多事件日记、完整回忆浏览与成长感想

- P0：Calendar 只读 Day Detail，上传音频/录音/视频直接播放，刷新后仍可播放；日历多媒体标记；按视图释放对象 URL。
- P1：多照片一次上传、独立图层、拖动/双指/鼠标把手/滚轮/键盘操作、裁切/相框/胶带/图层顺序、五种 Auto Layout 与切换确认。
- P2：同一天多个 Moments，章节式编辑与阅读，排序/复制/删除/折叠/单独保存，My Books 按章节归类。
- P3：打卡感想、周/月回顾、成长卡片引用插入，不重复计数，默认私人。
- 数据：仍为 schemaVersion 1 可选字段；备份/恢复含全部新增数据；备份文件数上限 500 → 2000（100 MB/150 MB 不变）；Settings 显示媒体用量。
- 验证：33 项 Node、9 项 Python、三套浏览器 E2E 通过；Swift/Vapor 未运行（环境无 Swift），Windows/iOS 实机未验证。

### 2026-11-07 — V3 Phase 1：自定义书本、素材、多媒体与双语

- 在原架构上增强任意主题书本、六种封面、七种字段及主题预设；Private 默认，公开/协作暂禁用。
- 新增七款附 OFL 许可证的实际字体、十类 23 款原创 SVG/PNG、独立文字框和照片拼贴层。
- 新增视频、音频、录音与 IndexedDB；旧照片安全迁移、完整本机备份/确认恢复、旧标签页检测。
- 新增 Web 全界面双语、原生基础双语/字体/封面，以及无需 Git 的 Windows ZIP/双击启动说明。
- 整理完整 V3 需求、五阶段清单与未来 Vapor 后端/权限设计；未实现的社交、协作、音乐明确标注。
- 验证：38 项自动化测试全部通过，原有与 V3 两套浏览器 E2E 通过；覆盖媒体刷新播放/虚拟录音/备份恢复/双语/旧数据/手机布局。Windows 实机与 iOS SDK 构建未验证，详情见 agent.md。

### 2026-11-07 — Little Days 第一阶段：SwiftUI 基础与 Windows 交互预览

- 在已有 Vapor 项目上新增 Little Days 产品、设计、架构文档；确立 SwiftUI 原生 + 轻量 HTML 预览，共享 JSON / Swift 数据模型与素材，无 React。
- 实现精致 Home 和五页导航，以及日期补记、习惯打卡、基础手帐编辑、草稿/导出与主题手帐本。
- 新增 Windows Python 启动方式、独立 Core Package、SwiftUI UI Package 和 iOS App 工程；保留 Vapor 启动与资源服务。
- 验证：6 项 JavaScript、3 项 Python、2 项 Core Swift、2 项 Vapor 测试全部通过（13 项）；Python/Vapor 两个入口的浏览器端到端流程通过，375/390/430 布局无横向溢出。原生语法/工程结构检查通过，iOS 编译与 Windows 实机未验证，详见 agent.md。
- 未完成：照片自由裁切/变换、完整原生编辑器与原生编译实测、可靠媒体备份和跨端同步。

### 2026-11-07 — 新增 Swift + HTML 本地预览框架

- 使用 Vapor 搭建 Swift 服务，提供 HTML 首页、静态资源和健康检查接口。
- 新增终端启动脚本、macOS 双击入口、端口切换和 Swift 工具链检查；默认访问 http://localhost:8080，无需打开 Xcode。
- 已在 Linux + Swift 6.0.3 编译成功，2 项后端测试通过；浏览器连接、断线提示、重连、移动端布局及启动脚本检查通过。用户个人电脑与 macOS 实机运行尚待确认。
- 下一步：确定并实现具体软件功能。

### 2026-11-07 — 建立跨会话交接机制

- 新增 agent.md，保存协作约定、当前状态、关键决定、未完成事项和详细日志。
- 新增 AGENTS.md，要求每次更新同步维护 agent.md 和 README.md。
- 验证：已核对文档文件名、相对链接及两处日志的一致性；本次仅修改文档，无应用代码可测试。
- 下一步：等待具体项目需求，继续按上述规则记录每次更新。
