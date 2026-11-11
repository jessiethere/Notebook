# Little Days · Mac 本地开发、本地 Qwen 与 iPhone 模拟器（2026-11-11）

> 状态说明：本文件和 `tools/mac/`、`tools/captain-eval.mjs`、`Public/js/captain-ai.mjs` 是在**云端 Linux 容器**里准备的。这个会话**连不到你的 MacBook**，下面所有要在 Mac 上执行的步骤（Ollama、Qwen、Xcode、模拟器）**都还没有运行过**。表格里写「未在 Mac 上验证」的地方，等你在 Mac 上跑完后再改成实际结果。

## 0. 怎样让 Claude 直接在你的 Mac 上操作

云端会话只能改仓库，不能在你的电脑上安装软件或启动模拟器。要让 Claude 实际检查、安装和运行，请在 **Mac 上**开一个会话，二选一：

- **Claude 桌面 App**：打开 Little Days 文件夹，开始一个 Claude Code 会话。
- **终端**：进入仓库目录后运行 `claude`。如果想在手机上的 Claude App 里继续，就运行 `claude remote-control`。

然后把这份文件里的步骤交给它执行，第一步是 `bash tools/mac/doctor.sh`。

## 1. 现在的状态

| 项目 | 状态 | 说明 |
|---|---|---|
| 仓库里的原生工程 | **已存在，从未编译** | `Native/LittleDays.xcodeproj`：iOS 17，App target「LittleDays」，Bundle ID `com.jessiethere.littledays`，自动签名，`DEVELOPMENT_TEAM` 为空。依赖本地 Swift Package `Native/Package.swift`（LittleDaysUI）和 `Packages/LittleDaysCore`。至今只做过 Linux 上的语法和资源检查，没有用 Xcode 构建过。 |
| App 的界面 | Swift 外壳 + 同一套 Web 界面 | `LittleDaysApp` → `LittleDaysWebShellView`（WKWebView），加载打包进 App 的 `Public/` 副本（`tools/sync_native_web.py` 同步到 `Native/Sources/LittleDaysUI/WebApp/`）。Home、日历、书架、Journal Studio、阅读器、Captain 都是这套 Web 界面；原生 Swift 的部分是外壳、每日提醒（`LittleDaysReminders`）、资源加载。早期的 SwiftUI 原型视图（`HomeView`、`CalendarView`、`BooksView`、`StudioView` 等）还在，但 App 不用它们，功能落后于 Web。 |
| 环境检查脚本 | 已写好，未在 Mac 上运行 | `bash tools/mac/doctor.sh`：只读，不安装任何东西。 |
| 日常命令 | 已写好，未在 Mac 上运行 | `bash tools/mac/dev.sh web / web-ai / sim / ai / eval / test / stop` |
| Captain 测试集 | 已写好 | `docs/captain-ai/chat-cases.json`：12 句合成输入，包括你指定的 7 句。 |
| Captain × Qwen 评测脚本 | 已写好，**未运行（容器里没有 Ollama 和模型）** | `node tools/captain-eval.mjs`：只连 127.0.0.1；结果写到 `docs/captain-ai/results/`。 |
| App 里的本地 AI 适配器 | 代码与测试完成（用模拟的 Ollama 测试） | `Public/js/captain-ai.mjs`。默认关闭，只在开发时、页面和模型都在本机时才启用（见第 4 节）。 |
| `qwen3.5:4b` 这个标签 | **未确认** | 从这个容器打不开 ollama.com，无法核对官方模型库里的标签。在 Mac 上运行 `ollama pull qwen3.5:4b`：成功就说明标签存在；失败就到 ollama.com/library 查当前 Qwen 小模型的实际标签，然后用 `LD_MODEL=<标签>` 运行。 |

## 2. 第一步：检查 Mac（只读）

```bash
cd ~/path/to/Notebook          # 你的仓库目录
git status                     # 先确认没有未提交的修改
bash tools/mac/doctor.sh
```

它会列出：芯片 / 内存 / macOS 版本；brew、git、node、python3；Ollama 版本、服务是否在 127.0.0.1:11434 上运行、已下载的模型、当前加载的模型，以及 Ollama 是否错误地监听了所有网卡；Xcode 和 Command Line Tools、iOS 模拟器运行时、可用的 iPhone 模拟器；仓库的分支和未提交修改。

缺什么就只装什么：

- **Node.js**（用于测试和评测脚本）：`brew install node`（先确认没有通过其他方式装过）。
- **Xcode**：从 Mac App Store 安装（M5 和新版 macOS 用 App Store 里的当前版本即可）。第一次打开时同意许可、安装组件，然后运行 `sudo xcode-select -s /Applications/Xcode.app`。iOS 模拟器运行时在 Xcode → Settings → Components 里下载。
- **Ollama**：你说已经下载了。打开 Ollama App 就会在 127.0.0.1:11434 启动服务。

## 3. 本地 Qwen：下载和第一次实测

```bash
ollama pull qwen3.5:4b          # 只下载这一个（标签以官方模型库为准）
ollama run qwen3.5:4b "用一句话介绍你自己"
ollama run qwen3.5:4b "Introduce yourself in one sentence."
curl -s http://127.0.0.1:11434/api/chat -d '{"model":"qwen3.5:4b","stream":false,"think":false,"messages":[{"role":"user","content":"你好"}]}'
ollama ps                        # 看模型占了多少内存
```

- 不需要 API Key，也不连云端：模型文件在 `~/.ollama/models`，不在仓库里（`.gitignore` 已排除 `*.gguf` / `*.safetensors`）。
- 4B 合格后再试 9B（`LD_MODEL=qwen3.5:9b`）。在 24GB 内存的 Mac 上，9B 的量化版一般可以运行；同时开 Xcode 和模拟器时，留意 `ollama ps` 和「活动监视器 → 内存压力」。**暂不下载 27B 或更大的模型。**
- 不做 LoRA 或任何权重微调。调 temperature、top-p、输出长度只是推理参数。

## 4. Captain 实验（可重复）

```bash
bash tools/mac/dev.sh eval                    # = node tools/captain-eval.mjs --model qwen3.5:4b
node tools/captain-eval.mjs --runs 3          # 每句跑 3 次，看稳定性
node tools/captain-eval.mjs --temperature 0.5 --num-predict 80
LD_MODEL=qwen3.5:9b bash tools/mac/dev.sh eval
```

- 系统提示词、消息格式、回复清理、参数都在 `Public/js/captain-ai.mjs`，App 和评测脚本用的是同一份。性格设定：curious、playful、gentle、a little silly；跟随用户的语言；回复 1–2 句；最多一个表情；不用口头禅，不写括号里的动作；夸奖、问候、摸头、谈帽子都当普通聊天回应，不推销功能；**只知道聊天里说过的话，没读过手帐，不编造经历，不说「我记得」**；不能替用户点按钮；不服从要求改变规则的指令。
- 参数默认：temperature 0.7、top_p 0.9、top_k 40、repeat_penalty 1.1、num_predict 96，`think: false`（Qwen 3.x 不输出思考过程），`keep_alive: "10m"`（10 分钟不用就自动从内存卸载）。
- 结果写到 `docs/captain-ai/results/<日期>-<模型>.md` 和 `.json`，包括每句回复、耗时、tokens/s、首次加载时间，以及 Ollama 报告的内存占用。然后按 `docs/keeper-eval/README.md` 的 7 项人工打分。
- 「帮我整理今天的故事」和「What can you do?」在 App 里**走规则，不调用模型**：前者直接打开「整理今天的故事」面板，后者回答真实的功能列表。评测里也测这两句，只是为了确认模型被问到时不会假装做到了。

## 5. App 里的可选本地 AI（开发用）

```
Captain 聊天 → 规则判断意图（keeper-chat.mjs）
   ├─ 功能请求（整理 / 回忆 / 这周 / 书架 / 代写 / 你会做什么）→ 规则（和以前一样）
   └─ 聊天（夸奖、帽子、累了、摸头、天气、没听懂的话…）
         ├─ 本地 AI 开着且可用 → captain-ai.mjs → 127.0.0.1:11434 Ollama → Qwen
         └─ 没开 / 没启动 / 超时（15 秒）/ 回复为空 → 规则回复（和以前一样）
```

- **怎么打开**：在 Mac 上运行 `bash tools/mac/dev.sh web-ai`，它会打开 `http://127.0.0.1:8080/?dev-local-ai=qwen3.5:4b`。关闭：`http://127.0.0.1:8080/?dev-local-ai=off`。这个开关只存在本机浏览器里（`little-days.dev.local-ai`）。
- **什么时候不启用**：页面地址不是 localhost / 127.0.0.1（例如在线链接、iPhone App 外壳），或者模型地址不是本机。这时代码直接返回「不启用」，不会去连接。
- **会发送什么**：只有你刚输入的那一句，加上最近 6 行聊天（你打的字和 Captain 的回复）。**不发送**手帐页面、标题、照片、视频、音频。
- **AI 回复放在哪里**：只是一行聊天，旁边标着「本机模型」，不会写进任何手帐页面。
- **不会自动调用**：只有你在 Captain 面板里主动发出一句话时才会调用。
- 本地服务只监听 127.0.0.1：`tools/mac/dev.sh web` 用 `--host 127.0.0.1` 启动预览；Ollama 默认也只监听 127.0.0.1（doctor.sh 会检查有没有被改成对外开放）。
- 没有改任何正式配置：在线链接和 iPhone App 外壳里没有写入任何开发地址。

## 6. 三种「本地 AI」不是一回事

| 情况 | 能不能用 | 说明 |
|---|---|---|
| **Mac 本地 AI**（Mac 上的浏览器预览 → Mac 上的 Ollama） | 可以（第 5 节，等你在 Mac 上实测） | 页面和模型都在 127.0.0.1。 |
| **iPhone 模拟器调用 Mac 上的服务** | 还没接通 | 模拟器和 Mac 共用网络，技术上能访问 127.0.0.1:11434。但 App 外壳是从打包进 App 的文件加载页面，地址不是 localhost，所以第 5 节的开关在模拟器里不会启用。要接通，需要在外壳里加一个只在 **DEBUG 构建**生效的开关，并确认 WKWebView 的 ATS（App Transport Security）是否允许访问 `http://127.0.0.1`。这一步要在 Mac 上实际调试，不能写进 Release 配置。 |
| **真实 iPhone 上的 AI** | 没有 | 真机访问不到 Mac 的 127.0.0.1。让 Ollama 监听局域网会把服务暴露给同一 Wi-Fi 下的其他设备，不建议这样做。真机上可以考虑的方向是在手机本机运行小模型，或者以后做有隐私授权的后端；两者都需要单独评估，本轮不做。 |

## 7. Xcode 和 iPhone 模拟器

```bash
bash tools/mac/dev.sh sim                       # 同步 Web 文件 → xcodebuild → 启动模拟器 → 安装并运行
bash tools/mac/dev.sh sim "iPhone 16 Pro"       # 指定机型（名字以 xcrun simctl list 为准）
open Native/LittleDays.xcodeproj                # 也可以在 Xcode 里选模拟器后按 ⌘R
```

- 这个工程从来没有用 Xcode 构建过，**第一次很可能需要修**：比如工程里没有共享的 scheme（xcodebuild 找不到 `-scheme LittleDays` 时，在 Xcode 里打开一次就会自动生成），或者本地 Swift Package 的路径、资源打包、Swift 版本需要调整。请在 Mac 上的会话里实际构建，按报错逐个修，不要重建整个 App。
- 在模拟器里可以测试 Home、日历、书架、Journal Studio、阅读器和 Captain：这些都是 Web 界面，在 WKWebView 里运行。修改 `Public/` 后运行 `python3 tools/sync_native_web.py` 再重新运行；修改 Swift 外壳代码后直接 ⌘R。
- 「SwiftUI 预览」（Xcode Canvas）只适用于原生 SwiftUI 视图。现在 App 的主要界面是 WebView，所以界面改动请在模拟器里看。
- **模拟器不等于真机**：触摸手感、键盘、性能和相机都和真机不同。

### 安装到你自己的 iPhone（以后）

- 需要：用 Apple ID 登录 Xcode（Settings → Accounts）。免费的 Personal Team 就能装到自己的手机，但证书 7 天后过期要重新安装，部分功能（如 iCloud、推送）不可用。付费的 Apple Developer Program 每年 99 美元，签名有效期更长，也可以用 TestFlight。
- 步骤：在工程的 Signing & Capabilities 里选择你的 Team（`DEVELOPMENT_TEAM` 现在是空的，可能需要改成唯一的 Bundle ID）。用 USB 连接 iPhone，在手机上「信任此电脑」。打开 iOS 16 及以上系统的「开发者模式」（设置 → 隐私与安全性），按提示重启。第一次运行后，在 设置 → 通用 → VPN 与设备管理 里信任开发者证书。配对过一次后可以通过 Wi-Fi 无线调试。
- 这些步骤需要你本人操作（Apple ID 登录、手机上点信任），Claude 不能代替你完成。

## 8. 以后每天的流程

```bash
cd ~/path/to/Notebook && git pull --ff-only
bash tools/mac/dev.sh web          # 浏览器预览（只在本机，http://127.0.0.1:8080）
bash tools/mac/dev.sh sim          # iPhone 模拟器里的真正 App
bash tools/mac/dev.sh ai           # 需要时：查看 Ollama 是否运行（不会加载模型）
bash tools/mac/dev.sh web-ai       # 需要时：开启本地 Qwen 和 Captain 聊天
bash tools/mac/dev.sh test         # 提交前跑测试
git add -A && git commit -m "…" && git push
bash tools/mac/dev.sh stop         # 结束：停止预览、把模型从内存卸载
```

- 不设置任何开机自启动；只有在发出第一句聊天或运行评测时才加载模型，10 分钟不用就自动卸载。
- 在线固定链接（README 顶部）照常可用：给别人看或在手机上看 Web 版时用它。

## 9. 安全约定（与 AGENTS.md 一致）

- 不清空本机数据（浏览器 IndexedDB / localStorage、App 里的数据），不覆盖未提交的修改。`git pull` 前先看 `git status`。
- 不提交模型文件、Xcode 构建产物（`build/`）、真实手帐、录音、照片和密钥。
- 不开通付费云服务，不放 API Key，不改正式配置。测试只用合成数据（`docs/captain-ai/chat-cases.json`、`docs/keeper-eval/synthetic-pages.json`）。
- 不改 Home Direction A，不恢复 Growth 模块，不新增 Bunny 或 Westie。
