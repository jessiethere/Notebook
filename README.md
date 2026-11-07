# Notebook

Swift + HTML 的本地软件框架，使用 Vapor 提供服务，在浏览器通过 **http://localhost:8080** 查看界面。

仓库地址：https://github.com/jessiethere/Notebook

## 本地启动（无需打开 Xcode）

准备 Git 和 **Swift 6.0 或更新版本**的命令行工具链。安装说明：https://www.swift.org/install/ 。macOS 请使用 macOS 13 或更新版本；安装后先运行 `swift --version` 确认工具链可用。运行本项目无需打开 Xcode 或创建 Xcode 工程。

首次下载并启动：

```bash
git clone https://github.com/jessiethere/Notebook.git
cd Notebook
bash start.sh
```

如果已有仓库，在仓库目录运行 `git pull` 后再运行 `bash start.sh`。

看到终端输出服务启动成功后，打开 **http://localhost:8080**。首次启动需要联网下载依赖并编译，可能需要几分钟；后续复用编译缓存。保持终端运行，按 **Ctrl+C** 停止服务。

macOS 也可双击根目录的 **Start.command** 启动，再打开上述网址；如果系统不允许直接打开，使用终端的 `bash start.sh`。

端口被占用时可以运行 `PORT=8081 bash start.sh`，改为访问 http://localhost:8081 。服务默认只监听 `127.0.0.1`，运行在执行命令的那台电脑上。localhost 指你自己的电脑；云端预览地址不能替代本地启动。

## 当前状态

目前提供启动首页、真实服务连接状态和重新检测按钮。具体业务功能尚待确定。

| 路径 | 用途 |
| --- | --- |
| `Package.swift` / `Package.resolved` | Swift 包定义与依赖版本 |
| `Sources/NotebookApp/` | Vapor 配置、首页路由和健康检查接口 |
| `Sources/NotebookServer/` | Swift 服务启动入口 |
| `Public/` | HTML、CSS、JavaScript 界面 |
| `Tests/NotebookAppTests/` | 健康检查、首页和静态资源测试 |
| `start.sh` / `Start.command` | 命令行启动 / macOS 双击入口 |

- 后端：Swift + Vapor；前端：HTML/CSS/JavaScript，无需 Node.js。
- `GET /`：启动首页；`GET /api/health`：服务健康检查。
- 修改 `Public/` 后刷新浏览器；修改 Swift 代码后停止服务并重新启动。
- 在仓库根目录运行 `swift test --jobs 4` 进行后端测试。

## 协作与会话接续

**每次更新都必须同步更新 [agent.md](agent.md) 和本 README 的更新日志，并与对应改动一起提交。**

- [AGENTS.md](AGENTS.md)：Codex 协作入口和仓库规则。
- [agent.md](agent.md)：详细更新日志、当前进度、关键决定、验证结果及下一步。
- README.md：项目概览及更新摘要。

开启新聊天时，请提供本仓库链接，并让协作者先读取以上三份文档，再检查最新仓库状态继续工作。历史聊天内容不会自动成为新会话的上下文，接续信息应保存在仓库中。

## 下一步

根据用户提出的具体软件功能，继续扩展 Swift 服务和 HTML 界面，保留 localhost 浏览器预览方式。

## 更新日志

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
