# Little Days · 开发日志与会话交接

## 固定约定

- 仓库：https://github.com/jessiethere/Notebook；产品 Little Days（手帐文具店）。理念：记录生活的美好，也收藏一点点变好的自己 / Collect moments, grow gently.
- 继续在现有 SwiftUI + HTML 交互预览 + Vapor + 共享 Core 上增量开发，不重建、不未经确认切换 React。
- 开始先读 AGENTS.md、agent.md、README.md、PRODUCT_SPEC、DESIGN_SYSTEM、ARCHITECTURE，检查最新分支/代码/提交。
- 每次改动同步维护本文件与 README 的日志，一起提交；保留历史。真实用户记录、媒体、备份和密钥不能提交公开 GitHub。
- 不把 HTML 预览称作 SwiftUI；不把本地私人状态/旧标签页提示称作服务端授权/多人协作。
- 完成时用中文说明功能、文件、Windows 测试方式、真实可用与演示/设计范围、测试结果和下一步。

## 当前状态

- V3 Phase 1 个人增强已实现于 Web：原五页保留，新增自定义封面/主题/通用字段、真实字体/原创贴纸、多文字/照片层、视频/音频/录音、双语 Settings、IndexedDB 与备份/恢复。
- Windows 默认无需 Git：下载 ZIP，全部解压，双击 Start-Windows.cmd；手动 `py -3 tools\preview.py --open` → http://localhost:8080。之前用户的错误来自没有 Git、终端在用户目录和将 preview.py 写成 preview\.py。
- schemaVersion 仍为 1，新增字段可选；旧记录 ID/日期/正文/旧 Emoji/系统字体保留。旧主照片写 Blob 成功后才替换引用。
- 新媒体在 IndexedDB，LocalStorage 只存轻量数据；本机备份是用户主动下载文件，不上传服务器。
- 原生 Core 支持 V3 Codable；SwiftUI 基础页面增加共享双语、字体注册/选择与 PNG 封面。原生音视频/完整封面字段编辑和画布未对齐 Web。
- 没有真实账号、社区、好友、私信、协作或背景音乐。未来后端方案仅为文档设计。

## 关键决策

- 保留 Vapor，Windows 预览使用 Python 标准库；不引入前端构建框架或未经验证的 SwiftUI Web 兼容层。
- 共享 library.json / i18n.json、TTF+完整 OFL、原创 SVG+透明 PNG；CSS 从共享目录生成；Native 与 Web 使用同名数据类型/资源 ID。
- generic BookField schema 统一渲染七种字段，系统预设标签可双语，用户的名称/正文/字段值不自动翻译。
- Private 是本轮唯一可用权限；公开和 Shared 禁用。真正的访问控制必须在未来 Vapor 后端实现，好友关系不继承私人内容权限。
- Blob 事务先完成再更新元数据；迁移/恢复失败不清除原记录。导出备份最多 100 MB 媒体，导入文件 150 MB；暂不自动删除旧 Blob，以保护撤销和恢复。
- 保存元数据比较已读快照，检测旧标签页；不是跨客户端原子事务。协作将采用数据库 expectedRevision/409 与版本历史。

## 已知问题与下一步

- Windows CMD/Python Launcher/默认浏览器仍未实机验证；Linux 已验证 ZIP 布局、空格路径、跨目录与 HTTP。
- SwiftUI 只有语法/共享模型检查，未进行 iOS SDK 类型检查、模拟器或真机验证；优先原生构建与个人能力对齐。
- Web 新媒体只在当前浏览器 origin；换 localhost/127.0.0.1/端口不会自动同步。需导出备份，暂无云同步、备份加密或分卷。
- 格式兼容性依浏览器；本轮为 Chromium。PNG 不含可播放媒体、不是完整所见即所得；主照片裁切、滤镜、完整相框和信息卡片待开发。
- Blob 清理/保留与大规模媒体存储后续完善；本轮不自动清理被替换文件。
- Phase 2 明确标记社交演示，Phase 3 真实 Vapor 后端，Phase 4 协作，Phase 5 高级创作/授权音乐；具体见 ROADMAP。

## 更新日志

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
