# 仓库协作入口

本说明适用于整个仓库。

- 产品为 Little Days（手帐文具店），最终发布 **iOS App**。2026-11-07 用户确认架构：iOS App 是 **Swift 外壳（SwiftUI + WKWebView，`Native/Sources/LittleDaysUI/WebShell/`）**，加载与 localhost 预览完全相同的 HTML/CSS/JavaScript（`Public/`）。界面只维护 `Public/` 一份；不得改为 React，不另写一套会落后的原生界面。原 SwiftUI 原型视图（`LittleDaysRootView` 等）与共享 Core 保留、不删除。
- **用户通过在线链接查看每次更新**（2026-11-09 用户确认：https://claude.ai/artifact/VYUJ38K5TBqcZPB8VzJS7A ，已固定在 claude.ai 侧栏；仓库根目录 `Open-Little-Days.url` 双击即开）。看到的就是 iOS 外壳里的同一个界面，不需要 Mac/Xcode。localhost（http://localhost:8080 ，`tools/preview.py`）仅作录音/导出等受限功能的备用；保留现有 Vapor 服务入口。
- **云端会话**：开始工作时就用持久后台任务运行 `python3 tools/preview.py --host 0.0.0.0 --port 8080`（必须 `--host 0.0.0.0`，只监听 127.0.0.1 时会话的 servers 面板连不上；已在运行则复用），并把 8080 报告为预览端口。容器重启/会话恢复后服务会停止，要重新启动并再次报告，让用户点链接即可查看；交付前确认它仍在运行、显示的是最新代码。
- **在线链接**：https://claude.ai/artifact/VYUJ38K5TBqcZPB8VzJS7A 是用户日常点开查看的主入口（README 顶部）。每次修改 `Public/` 或共享资源后运行 `python3 tools/build_link.py`，并把 `dist/link/index.html`（`root: dist/link`，文件清单见 `dist/link-files.json`）发布到**同一个链接**，不要新建链接。网页里不要用 `alert/confirm/prompt`（在线链接中会被自动拒绝），使用页面内 `askConfirm`；所有资源路径保持相对路径。
- **每次发布更新都要让用户在链接里看到更新内容**（2026-11-09 用户要求）：在 `Public/js/whats-new.mjs` 的 `UPDATES` 最前面加一条（版本号递增、中英文标题和要点，只写实际完成的内容），首页会自动出现「新版本」卡片，设置里有完整「更新记录」；发布 Artifact 时把 `description` 设为「V版本 · 这次更新的一句话」，`label` 写简短版本名。
- `.claude/launch.json` 为 Claude 桌面 App 本地会话提供可点击的 Dev servers（Windows 用 `py -3`，macOS/Linux 用 `python3`，端口 8080）；改启动方式时同步更新它。云端/网页会话侧栏没有服务器列表，不要承诺。
- **不要让用户下载 ZIP。** 用户本机：只需第一次 `git clone`，之后每次双击 `Start-Windows.cmd`（会自动 `git pull --ff-only` 再打开 localhost:8080）；手动方式是在项目目录运行 `git pull` 和 `py -3 tools\preview.py --open`。
- **每次修改 `Public/` 后运行 `python3 tools/sync_native_web.py`**，把同样的文件同步进 iOS 外壳（`Native/Sources/LittleDaysUI/WebApp/`）；`tests/test_native_shell.py` 会检查两者一致。数据模型新增字段同时更新 `Packages/LittleDaysCore` 的 `Models.swift`（可选字段）与 Core 测试，保持 Swift 与 HTML 数据一致。
- 开始或接续任何任务前，先阅读 [agent.md](agent.md) 和 [README.md](README.md)，了解最新进度、约定和待办。
- 随后检查仓库最新代码、分支与提交记录；同时阅读相关的 docs/PRODUCT_SPEC.md、DESIGN_SYSTEM.md、ARCHITECTURE.md，基于已完成工作继续，不从零重复创建。
- **每次更新都必须同步更新 agent.md 和 README.md 中的更新日志**，包括代码、配置和文档修改；日志应随对应改动一起提交。
- 在 agent.md 中维护当前状态、关键决定、验证结果、未完成事项和下一步；README.md 保留面向使用者的更新摘要，确保两处记录一致。
- 追加历史记录，不删除旧日志；同日多次更新使用不同条目。只记录实际完成的工作，如实标注未验证或受阻事项。
- 具体交接规则和日志模板以 [agent.md](agent.md) 为准。
- 设计颜色、导航/素材定义与示例数据以 Packages/LittleDaysCore/Sources/LittleDaysCore/Resources 为准；修改颜色后运行 tools/sync_tokens.py，不手工维护第二套 CSS 颜色。
- V3 以 docs/ROADMAP.md 分阶段推进。保持旧 schema/ID/正文/图层兼容，失败不能清空或重置；新媒体进 IndexedDB，不把视频/音频/图片字节写入 LocalStorage。
- 字体和素材以共享 library.json 为准，保留来源、许可证、原始内部字体名与原创声明；改字体目录后运行 tools/sync_library.py。禁止擅自抓取流媒体歌曲。
- 新旧私人手帐默认 Private；好友不等于私人访问权。公开/协作/私信必须有明确授权和服务端访问控制，未实现时不作真实联网承诺。
- 语言切换只改界面与格式，不翻译或重写用户的名称、正文、字段值和媒体。
- 禁止把真实用户数据、录音/视频、备份或密钥提交到公开仓库；测试使用合成或公开示例数据。
- agent 日志必须含日期/任务、需求、文件、功能、决策与原因、运行/测试、已知问题、未完成和下一步；README 必须含摘要、可运行功能、最新启动方法、未完成事项。
- 真实记录环境限制；语法解析不能写成 iOS 编译通过，Linux 上运行 Python 不能写成 Windows 实机通过；外壳同步测试通过不等于 Xcode 构建或真机通过。
- 完成任务用中文按六项回复：完成内容、可用功能、localhost 预览链接与本机查看方式、未完成内容、运行的测试及结果、下一步建议。
