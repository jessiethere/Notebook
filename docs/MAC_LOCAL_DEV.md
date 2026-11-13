# Little Days · Mac 本地开发、本地 Qwen 与 iPhone 模拟器（2026-11-11）

> 状态说明：本文件和 `tools/mac/`、`tools/captain-eval.mjs`、`Public/js/captain-ai.mjs` 是在**云端 Linux 容器**里准备的。**2026-11-11 更新**：已在 Mac 上的 Claude Code 会话里跑完第 2 节（环境检查和安装）、第 3 节（Qwen 实测）和第 4 节（Captain 评测）。第 7 节（Xcode / 模拟器）也已在 Mac 上跑通（见下表）。第 5 节（App 里的本地 AI 聊天）也已在 Mac 上实测通过（2026-11-12，见第 5 节末尾）。

## 0. 怎样让 Claude 直接在你的 Mac 上操作

云端会话只能改仓库，不能在你的电脑上安装软件或启动模拟器。要让 Claude 实际检查、安装和运行，请在 **Mac 上**开一个会话，二选一：

- **Claude 桌面 App**：打开 Little Days 文件夹，开始一个 Claude Code 会话。
- **终端**：进入仓库目录后运行 `claude`。如果想在手机上的 Claude App 里继续，就运行 `claude remote-control`。

然后把这份文件里的步骤交给它执行，第一步是 `bash tools/mac/doctor.sh`。

## 1. 现在的状态

| 项目 | 状态 | 说明 |
|---|---|---|
| 仓库里的原生工程 | **2026-11-11 第一次构建成功，并在模拟器里运行** | `Native/LittleDays.xcodeproj`：iOS 17，App target「LittleDays」，Bundle ID `com.jessiethere.littledays`，自动签名，`DEVELOPMENT_TEAM` 为空。依赖本地 Swift Package `Native/Package.swift`（LittleDaysUI）和 `Packages/LittleDaysCore`。Xcode 27.2 + iPhone 18 Pro 模拟器（iOS 27.2）：工程**没有改就 BUILD SUCCEEDED**（scheme 由 Xcode 自动生成，只有警告）；安装后首页、日历、书架、Journal Studio 都能打开（截图：`bash tools/mac/sim-shots.sh` → `build/sim-shots/`）。冷启动到首页约 15–20 秒（先空白，再「正在打开你的文具店…」），原因未查。这一版 Xcode 里没有单独的 Simulator.app，用 Xcode 打开工程按 ⌘R 才会显示模拟器窗口；命令行构建、安装、截图不受影响。 |
| App 的界面 | Swift 外壳 + 同一套 Web 界面 | `LittleDaysApp` → `LittleDaysWebShellView`（WKWebView），加载打包进 App 的 `Public/` 副本（`tools/sync_native_web.py` 同步到 `Native/Sources/LittleDaysUI/WebApp/`）。Home、日历、书架、Journal Studio、阅读器、Captain 都是这套 Web 界面；原生 Swift 的部分是外壳、每日提醒（`LittleDaysReminders`）、资源加载。早期的 SwiftUI 原型视图（`HomeView`、`CalendarView`、`BooksView`、`StudioView` 等）还在，但 App 不用它们，功能落后于 Web。 |
| 环境检查脚本 | **2026-11-11 已在 Mac 上运行，全部 ✅** | `bash tools/mac/doctor.sh`：只读。机器：Apple M5 / 24 GB / macOS 26.6；Xcode 27.2、iOS 27.2 模拟器；Ollama 0.40.16 只监听 127.0.0.1。当时缺 Homebrew 和 Node，经用户同意后装了 Homebrew 7.0.13 和 Node 26.13.0。 |
| 日常命令 | `sim-shots.sh` 已在 Mac 上运行；`web-ai` 的功能已实测（2026-11-12，当时 8080 被 Xcode 里的服务端占着，改用 8081 手动启动；`dev.sh web-ai` 只验证了新加的「8080 被别的程序占用」提示）；其余未全部运行 | `bash tools/mac/dev.sh web / web-ai / sim / ai / eval / test / stop`；`bash tools/mac/sim-shots.sh`（构建 + 四个页面截图；靠只在 Debug 构建生效的启动参数 `-LittleDaysTap` 打开页面） |
| Captain 测试集 | 已写好 | `docs/captain-ai/chat-cases.json`：12 句合成输入，包括你指定的 7 句。 |
| Captain × Qwen 评测脚本 | **2026-11-11 已在 Mac 上运行（qwen3.5:4b，每句 3 次）** | 结果和人工评分在 `docs/captain-ai/results/2026-11-11-qwen3.5_4b.md`：145/168（86%），每句约 0.4–1.9 秒，约 32 tokens/s。主要问题是「喵」成了口头禅、偶尔编造手帐状态。 |
| App 里的本地 AI 适配器 | 代码与测试完成（用模拟的 Ollama 测试）；**提示词第 3 版**（2026-11-11，在 Mac 上实测 v1 → v2 → v3：「喵」19→0→0，v2 带出的帽子 / 尾巴 / 阳光口癖在 v3 基本消失；回复语言和用户不一致时由代码拦截，改用规则回复；对比见 `docs/captain-ai/results/2026-11-11-prompt-v1-v2-v3.md`），v3 还要用 `captain-eval.mjs` 正式跑一次 | `Public/js/captain-ai.mjs`。默认关闭，只在开发时、页面和模型都在本机时才启用（见第 4 节）。 |
| `qwen3.5:4b` 这个标签 | **已确认存在**（2026-11-11） | 已经下载到 Mac 上（4.0 GB，ID `7f3251fa6878`），用 Ollama 的 MLX runner 运行，100% 在 GPU 上。 |

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
- **注意（2026-11-11 实际遇到）**：Homebrew 的安装程序会顺带装 Command Line Tools，并把 `xcode-select` 切到 `/Library/Developer/CommandLineTools`，之后 `xcodebuild` 就用不了了。装完 Homebrew 后要运行 `sudo xcode-select -s /Applications/Xcode.app`，再用 `xcode-select -p` 确认。
- Homebrew 安装程序会写 `/etc/paths.d/homebrew`，所以新开的终端就能找到 `brew` 和 `node`；它提示的在 `~/.zprofile` 里加 `brew shellenv` 可加可不加。

## 3. 本地 Qwen：下载和第一次实测

```bash
ollama pull qwen3.5:4b          # 只下载这一个（标签以官方模型库为准）
ollama run qwen3.5:4b "用一句话介绍你自己"
ollama run qwen3.5:4b "Introduce yourself in one sentence."
curl -s http://127.0.0.1:11434/api/chat -d '{"model":"qwen3.5:4b","stream":false,"think":false,"messages":[{"role":"user","content":"你好"}]}'
ollama ps                        # 看模型占了多少内存
```

- **实测（2026-11-11，M5 / 24 GB）**：`ollama run` 默认开启思考，「用一句话介绍你自己」要 36 秒，英文那句要 3 分 35 秒（模型一直在和自己来回讨论）。用 API 加 `"think":false` 时「你好」只要 0.5 秒。Captain 和评测脚本都用 `think:false`。内存方面，`ollama ps` 第一次加载后显示 4.8 GB，跑完评测后显示 9.1 GB。
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
- **Mac 上实测（2026-11-12，qwen3.5:4b，提示词 v3，Claude 桌面 App 里的浏览器）**：
  - 「你的柠檬帽真好看」「今天有点累，但是写完了一页」都由本机模型回复，旁边标着「本机模型 · 开发」，几秒内出现。
  - 发给 Ollama 的内容只有：系统提示词、你打的字、Captain 的回复，以及 `think: false` 和推理参数；没有任何手帐内容。
  - 「What can you do?」和「帮我整理今天的故事」走规则，不调用模型：前者回答真实的功能列表，后者直接打开「今天的故事」面板。
  - 把模型地址指到一个没开的本机端口：请求失败，Captain 立刻改用规则回复，页面不报错。
  - `?dev-local-ai=off`：开关从浏览器里删除，之后聊天不再发出任何请求。
- **8080 被占用时**：如果在 Xcode 里运行过根目录的服务端（scheme「Notebook」，进程名 `NotebookServer`），它会一直占着 8080，打开的页面是 500 错误。`dev.sh web` / `web-ai` 现在会发现这种情况，打印占用的程序并停止；在 Xcode 里按 ■ Stop（或 `kill` 它打印的进程号）后再运行。也可以临时换端口：`python3 tools/preview.py --host 127.0.0.1 --port 8081`，再打开 `http://127.0.0.1:8081/?dev-local-ai=qwen3.5:4b`（换端口后浏览器里的数据和 8080 不共用）。

## 6. 三种「本地 AI」不是一回事

| 情况 | 能不能用 | 说明 |
|---|---|---|
| **Mac 本地 AI**（Mac 上的浏览器预览 → Mac 上的 Ollama） | 可以（第 5 节，2026-11-12 在 Mac 上实测通过） | 页面和模型都在 127.0.0.1。 |
| **iPhone 模拟器调用 Mac 上的服务** | 还没接通 | 模拟器和 Mac 共用网络，技术上能访问 127.0.0.1:11434。但 App 外壳是从打包进 App 的文件加载页面，地址不是 localhost，所以第 5 节的开关在模拟器里不会启用。要接通，需要在外壳里加一个只在 **DEBUG 构建**生效的开关，并确认 WKWebView 的 ATS（App Transport Security）是否允许访问 `http://127.0.0.1`。这一步要在 Mac 上实际调试，不能写进 Release 配置。 |
| **真实 iPhone 上的 AI** | 没有 | 真机访问不到 Mac 的 127.0.0.1。让 Ollama 监听局域网会把服务暴露给同一 Wi-Fi 下的其他设备，不建议这样做。真机上可以考虑的方向是在手机本机运行小模型，或者以后做有隐私授权的后端；两者都需要单独评估，本轮不做。 |

## 7. Xcode 和 iPhone 模拟器

> **打开哪个文件**：双击仓库根目录的 `LittleDays.xcworkspace`（或运行 `bash tools/mac/dev.sh open`），它会打开 iPhone App 工程 `Native/LittleDays.xcodeproj`。**不要直接打开项目根文件夹**：那样加载的是本机 Vapor 服务端的 `Package.swift`（scheme「Notebook」），它是跑在 Mac 上的服务，不是 iPhone App。2026-11-11 出现的「LittleDaysCore-product requires minimum platform version 17.0 … supports 15.0」就是用 iPhone 目标构建这个服务端包导致的；现在它也声明了 iOS 17，所有地方统一为 iOS 17。

```bash
bash tools/mac/dev.sh sim                       # 同步 Web 文件 → xcodebuild → 启动模拟器 → 安装并运行
bash tools/mac/dev.sh sim "iPhone 16 Pro"       # 指定机型（名字以 xcrun simctl list 为准）
open Native/LittleDays.xcodeproj                # 也可以在 Xcode 里选模拟器后按 ⌘R
```

- 这个工程从来没有用 Xcode 构建过，**第一次很可能需要修**：比如工程里没有共享的 scheme（xcodebuild 找不到 `-scheme LittleDays` 时，在 Xcode 里打开一次就会自动生成），或者本地 Swift Package 的路径、资源打包、Swift 版本需要调整。请在 Mac 上的会话里实际构建，按报错逐个修，不要重建整个 App。
- 在模拟器里可以测试 Home、日历、书架、Journal Studio、阅读器和 Captain：这些都是 Web 界面，在 WKWebView 里运行。修改 `Public/` 后运行 `python3 tools/sync_native_web.py` 再重新运行；修改 Swift 外壳代码后直接 ⌘R。
- 「SwiftUI 预览」（Xcode Canvas）只适用于原生 SwiftUI 视图。现在 App 的主要界面是 WebView，所以界面改动请在模拟器里看。
- **模拟器不等于真机**：触摸手感、键盘、性能和相机都和真机不同。
- 如果不小心打开过仓库根文件夹，Xcode 会改写根目录的 `Package.resolved`（2026-11-11 实际遇到：swift-async-algorithms 被降级，并新增了 swift-configuration）。不是有意改的就用 `git checkout Package.resolved` 还原。
- **模拟器刚开机时启动 App 会很慢，这不是 App 的问题**（2026-11-11 在 iPhone 17 上实测）：
  - 平常启动（热启动、重新安装后启动）约 1–2 秒到首页。
  - 模拟器刚开机就启动时：先等系统接受启动请求（会报 `Busy … failed preflight checks`，或者 `simctl launch` 等 15–18 秒）；接着 WebKit 进程启动要 5–7 秒；然后页面在系统把 App 放到前台之前一直暂停，计时器和绘制都停着，大约 20 秒。这段时间屏幕是空白或「正在打开你的文具店…」，总共 26–45 秒。
  - 用 Debug 日志确认过：App 自己的启动代码（读手帐、打开媒体库 IndexedDB、首次绘制首页）在开机后也只要几十到一百多毫秒。
  - 所以看到空白页时，先等一会儿，或者开机后等 30 秒再按 ⌘R。
- **Debug 构建的 JS 日志**：页面报错（未捕获异常、Promise 拒绝、`console.error/warn`、脚本或样式加载失败）和启动节点（web view created / document start / DOMContentLoaded / home rendered，单位是启动后的毫秒）会以 `[LittleDays JS]` 开头出现在 Xcode 控制台。在命令行看：`xcrun simctl spawn booted log show --last 5m --predicate 'eventMessage CONTAINS "[LittleDays JS]"'`。Release 构建里没有这段代码。

### 安装到你自己的 iPhone（2026-11-12 更新：一步一步）

2026-11-12 检查：`xcrun devicectl list devices` 只列出了 3 台模拟器，还没有连接过真机。

**你需要准备**：一部 iOS 17 或更新的 iPhone、数据线、你的 Apple ID。免费账号就可以。

1. **Xcode 登录 Apple ID**：Xcode → Settings → Accounts → 左下角「+」→ Apple ID。登录后会出现一个「(你的名字) (Personal Team)」。
2. **打开工程**：在 Finder 里双击仓库根目录的 `LittleDays.xcworkspace`。
3. **选签名团队**：左侧点最上面的蓝色工程图标 → TARGETS 选「LittleDays」→「Signing & Capabilities」：
   - 勾上「Automatically manage signing」；
   - Team 选你的 Personal Team；
   - 如果提示 Bundle Identifier 已被占用或无法注册，把 `com.jessiethere.littledays` 改成只属于你的，例如 `com.你的名字.littledays`。这个改动只在你的 Mac 上，不要提交到仓库。
4. **连接手机**：用数据线连接 iPhone → 手机上点「信任此电脑」并输入锁屏密码。
5. **打开开发者模式**（第一次需要）：iPhone 设置 → 隐私与安全性 → 拉到最下面「开发者模式」→ 打开 → 按提示重启 → 重启后点「打开」。如果找不到这个开关，先做第 6 步，Xcode 尝试安装一次后它就会出现。
6. **运行**：Xcode 顶部的设备菜单里选你的 iPhone（不要选模拟器）→ 按 ⌘R。第一次会花几分钟准备手机。
7. **信任开发者**（第一次需要）：如果手机上提示「不受信任的开发者」，到 设置 → 通用 → VPN 与设备管理 → 你的 Apple ID → 信任。然后再按一次 ⌘R，或者直接点手机上的 App 图标。
8. **以后**：免费账号签的 App 7 天后会打不开，再连上 Mac 按一次 ⌘R 就好，手帐数据还在。第一次连线成功后，可以在 Xcode → Window → Devices and Simulators 里勾选「Connect via network」，之后同一 Wi-Fi 下不插线也能安装。

这些步骤需要你本人操作（Apple ID 登录、手机上点信任），Claude 不能代你完成。手机连上并信任之后，Claude 可以在 Mac 上用 `xcrun devicectl list devices` 确认手机已连接，并用命令行构建、安装。

**装好后请重点试这些**（模拟器验证不了）：
- Captain →「玩耍」：拖毛线球是否跟手；接住时有没有一下轻震；拖动舞台会不会误关面板。
- 戳 Captain、点毛线球，动画是否流畅（3 倍屏上图会略软，这是素材分辨率的限制）。
- 写手帐时键盘弹出：输入框和工具栏有没有被挡住。
- 照片、相机、录音：第一次使用时系统会请求权限。
- 真机上的 Captain 聊天只用规则回复：本地 Qwen 在 Mac 上，手机访问不到，这是预期行为。

### 每台模拟器都要单独安装

模拟器里的每台 iPhone 都是一部独立的虚拟手机，在一台上运行过，另一台上也不会有这个 App。在 Xcode 顶部选好机型（例如 iPhone 18 Pro Max）再按 ⌘R，就会装到那一台；也可以运行 `bash tools/mac/sim-shots.sh "iPhone 18 Pro Max"`。2026-11-11 已经在 iPhone 17、18 Pro、18 Pro Max 上装好并能运行。

### 构建验证（2026-11-11）

- 服务端的包（iOS 目标）：`xcodebuild -workspace .swiftpm/xcode/package.xcworkspace -scheme Notebook -destination "generic/platform=iOS Simulator" build` → 成功（iOS 17 修复之后）。
- iPhone App：`xcodebuild -workspace LittleDays.xcworkspace -scheme LittleDays …` → Debug 和 Release 都成功。

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


## P0 媒体测试（Debug 启动参数，2026-11-13）

`-LittleDaysTap` 除了点击，还支持：
- `upload:<input 选择器>|<Mac 上的文件路径>|<mime>`：把测试文件交给页面自己的文件输入框（之后走 App 真实的导入 / 保存代码，只跳过系统选择器）；
- `wait:<毫秒>`：等待。
- 2026-11-13 起，`upload:` 可以一次给多个文件，路径之间用逗号隔开，就像在相册里选了好几张。

例：`xcrun simctl launch <设备> com.jessiethere.littledays -LittleDaysTap 'body||body||body||[data-action="today-write"]||upload:#photos-input|/tmp/test.jpg|image/jpeg||wait:3000'`。只在 Debug 构建生效。

快速编辑（今天的故事）的例子：`[data-action="today-photos"]||upload:#attachment-image-input|/路径/a.jpg,/路径/b.jpg|image/jpeg||.qe-tools [data-panel="photo"]||.qe-thumbs button:nth-child(2)||[data-action="story-replace"]||upload:#attachment-image-input|/路径/c.jpg|image/jpeg`。用脚本点击不是真的触摸，所以 iOS 不会弹出键盘；键盘要用手点着测。

注意：iOS WebKit 只在用户点击后加载视频数据，用脚本交给 `#video-input` 的视频会在读取信息时超时（`media-timeout`），所以不能用来判断真实选择器的结果。完整步骤见 `docs/P0_MEDIA_TEST.md`。

## S1–S4 模拟器检查（V10.41–V10.44，2026-11-13）

两个脚本，都用 `-LittleDaysCheck <文件>`（只在 Debug 构建生效），各打印一行 `LittleDaysCheck: {json}`：

1. `tools/mac/ios-sprint-check.js`：**先删除再安装 App**，然后跑：新安装只有一本空书 → 三张图库照片（08:10 / 12:40 / 19:20）做今天的故事 → 没有自动封面 → 从「这一天」复用照片 → 加可选封面 → 保存 → 阅读器隐藏封面。
2. `tools/mac/ios-sprint-restart.js`：**不重装**，只 `simctl terminate` 再 `launch`：检查保存的内容、共用的照片、隐藏的封面重启后都还在，然后重新显示封面。

```
xcrun simctl uninstall <设备> com.jessiethere.littledays && xcrun simctl install <设备> <构建>/LittleDays.app
xcrun simctl launch --console-pty <设备> com.jessiethere.littledays -AppleLanguages "(zh-Hans)" -AppleLocale zh_CN -LittleDaysCheck <路径>/ios-sprint-check.js
xcrun simctl terminate <设备> com.jessiethere.littledays
xcrun simctl launch --console-pty <设备> com.jessiethere.littledays -AppleLanguages "(zh-Hans)" -AppleLocale zh_CN -LittleDaysCheck <路径>/ios-sprint-restart.js
```

首页「选照片」用的是 `#attachment-image-input`（不是 `#photos-input`）；脚本把这个输入框的 `click()` 换成空函数，所以不会弹出 iOS 原生菜单，**真实的相册选择界面没有被测试**。结果记录在 `docs/DEVICE_TEST_PLAN.md` 2.3。
