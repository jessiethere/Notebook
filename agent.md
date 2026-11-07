# Little Days · 开发日志与会话交接

## 固定约定

- 仓库：https://github.com/jessiethere/Notebook；产品名称 Little Days（手帐文具店）。
- 理念：记录生活的美好，也收藏一点点变好的自己。
- 最终 iPhone 使用 Swift / SwiftUI；Windows localhost 使用独立 HTML 交互预览。未经用户确认，不得改为 React；不能把 HTML 页面称为运行中的 SwiftUI。
- 任务开始先读 AGENTS.md、agent.md、README.md，检查最新代码/分支/提交，再接续现有进度。
- 每次修改代码、配置、设计或文档，必须更新本文件和 README 日志，并随对应代码一起提交。保留历史。
- 完成回复使用中文，说明完成内容、可用功能、Windows 启动、未完成事项、真实测试结果、下一步建议。

## 当前状态

- 第一阶段已有可运行、可交互的 Web 预览；产品/设计/架构文件齐全。
- Home、Calendar、Growth、Studio、My Books 全部可导航；Web 支持习惯/时长/自定义主题、历史补记、照片/文字/心情、模板/贴纸编辑、草稿/PNG 导出和手帐本。
- 原生 UI Package 与 iOS App 工程已建立五页基础，Core 与 Web 共用 JSON/照片及同名数据字段；NativeStore 写本机 JSON 文件。原生功能尚未与 Web 全部对齐。
- Windows 推荐 `py -3 tools/preview.py` → http://localhost:8080，无需 Swift/Node/Xcode；也可双击 Start-Windows.cmd。现有 Vapor `bash start.sh` 保留。
- 样例不是用户记录；初始手帐标注“示例”。Web 数据仅存当前 origin 的 LocalStorage，原生文件独立；没有跨端同步。

## 关键决定与原因

- 保留既有 Vapor，增加 Python 标准库开发服务器，以免 Windows 用户先安装/编译 Swift Web 依赖。
- 最终原生 SwiftUI 不依赖 Vapor：Native UI Package 只依赖 Packages/LittleDaysCore。
- 暂不采用 SwiftWasm/Tokamak，完整 SwiftUI/照片/手势兼容性未在本仓库验证，不引入未经验证的复杂栈。
- 共享 design-tokens.json、features.json、seed.json 与 Media；CSS 回退由脚本生成；模型字段、日期/去重规则保持一致。HTML 与 SwiftUI 视图分别实现，差异明确列出。
- 同一日期一篇 Journal，HabitCheck 以 (habitId,date) 唯一关联，不往 Journal 复制打卡信息。
- 基础阶段用 LocalStorage 和原子 JSON 文件；Web 存储失败不替换成功状态，不自动删除损坏记录。

## 未完成事项与下一步

- 需要 macOS + Xcode 16+ 执行原生 iOS 编译、模拟器/真机验证；目前只有语法、清单和工程 plist 检查。
- 需要 Windows 实机确认 Python Launcher 与 CMD 双击入口。Linux 已运行同一 Python 脚本，不能称作 Windows 实机测试。
- 先完善照片裁切/变换、自由文本、多图、胶带/相框，提升导出一致性；将 Web 功能移植到原生 PhotosPicker/手势。
- 迁移图片到 IndexedDB / 媒体文件，增加备份与数据交换；目前无浏览器/iPhone 自动同步。
- 后续实现素材商店、字体授权、习惯编辑/归档、提醒、复杂里程碑和发布配置。

## 更新日志

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
