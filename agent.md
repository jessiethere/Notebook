# Notebook 协作与交接记录

## 固定约定

- 仓库：https://github.com/jessiethere/Notebook
- 用户要求：**每次更新一定要把更新日志放到 agent.md 和 README.md，让未来的聊天会话能够继续工作。**
- 开始任务时先阅读本文件、README.md 和 AGENTS.md，再检查当前分支、文件与提交状态，以实际仓库内容为准。
- 每次代码、配置或文档更新都必须在本文件追加详细日志，并在 README.md 追加对应摘要；与实际改动一起提交。
- 每次结束任务前，更新当前状态、关键决定、验证结果、未完成事项和下一步。保留历史记录，不把计划写成已完成。
- 新会话需能够访问本仓库并读取上述文件；仓库文档是跨会话交接依据。

## 当前状态

- 已建立协作规则、双份更新日志和标准 AGENTS.md 入口。
- 已实现 Swift + Vapor 服务、HTML/CSS/JavaScript 启动首页，以及真实连接状态检测。
- 默认运行：在仓库根目录执行 `bash start.sh`，浏览器访问 http://localhost:8080；macOS 提供 Start.command。
- 需要 Swift 6.0+ 命令行工具链，无需打开 Xcode；默认仅监听 127.0.0.1，支持 PORT 环境变量。
- 具体软件业务功能尚未确定，目前是可扩展的本地启动框架。

## 关键决定

- 按用户指定，使用小写单数 agent.md 保存详细交接信息。
- 新增标准 AGENTS.md 作为 Codex 的协作入口，指向 agent.md 和 README.md。
- README.md 保存项目概览和更新摘要，agent.md 保存完整进度与接续信息。
- 用户要求使用 Swift 框架和 HTML 界面，在自己电脑通过 localhost 查看软件，无需用 Xcode 预览。
- 使用 Swift Package Manager + Vapor 4.110.1，HTML/CSS/JavaScript 静态界面；保持前端无需 Node.js。
- 启动脚本固定监听回环地址；具体业务功能按后续需求扩展。

## 未完成事项与下一步

- 等待用户确定具体软件功能和界面需求；目前仅实现本地启动基础框架。
- 已在 Linux 云端使用 Swift 6.0.3 编译并完成测试与浏览器验证；尚未在用户个人电脑或 macOS 实机运行。
- 下一位协作者应先读取三份文档并检查仓库最新状态，再按用户的新要求继续。

## 更新日志

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
