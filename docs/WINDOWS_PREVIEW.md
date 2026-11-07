# Windows 打开 Little Days（无需 Git）

你已安装 Python 时，可以直接下载 ZIP，不需要先安装 Git、Swift、Node 或 Xcode。

1. [下载最新版 Notebook-main.zip](https://github.com/jessiethere/Notebook/archive/refs/heads/main.zip)。
2. 在资源管理器右键 ZIP → **全部解压缩**。
3. 打开解压目录，找到同时含 **Start-Windows.cmd、Public、tools、Packages** 的那一层；不要在压缩包内部运行。
4. 双击 **Start-Windows.cmd**。它会进入正确目录，检测 Python 3.10+，并打开浏览器。
5. 保持终端开启，访问 **http://localhost:8080**。按 Ctrl+C 停止服务。

## 手动启动

在上面那层文件夹的地址栏输入 `cmd` 并回车，运行：

```cmd
py -3 tools\preview.py --open
```

`--open` 是可选的自动打开浏览器参数。没有 `py` 时可用 `python tools\preview.py --open`。

## 常见报错

| 报错 | 原因和操作 |
| --- | --- |
| `'git' is not recognized` | 此流程无需 Git，直接下载并全部解压 ZIP。 |
| `can't open file C:\Users\...\tools\preview.py` | 终端仍在用户目录。进入实际解压目录，或使用目录内的 Start-Windows.cmd。 |
| 文件路径写成 `preview\.py` | 正确文件名是 `preview.py`；只有 tools 与文件名之间有一个反斜杠。 |
| Python 未找到或版本过旧 | 安装 Python 3.10+，启用 Python Launcher；安装后重新打开终端。 |
| Incomplete project | 只复制了脚本或没有完整解压；Public、tools、Packages 必须同在项目目录。 |
| 端口被占用 | 先停止旧窗口，或明确使用 `py -3 tools\preview.py --port 8081 --open` 并访问 localhost:8081。 |
| 浏览器没有自动打开 | 手动输入 http://localhost:8080；服务会继续运行。 |

## 更新与数据

更新时重新下载最新版 ZIP，解压到新目录后启动。文字、照片、视频与音频保存在当前浏览器的 localhost 站点存储，不在 ZIP 目录中。**继续使用同一个浏览器、localhost 地址和端口**，并先在 Settings 导出完整本机备份。

`localhost` 与 `127.0.0.1`、8080 与 8081 属于不同浏览器 origin，不能自动看到对方的数据。切换地址前导出备份，必要时从 Settings 明确确认恢复。恢复会替换该 origin 的当前记录。

## 测试

在项目目录运行 Python HTTP/ZIP 布局测试：

```cmd
py -3 -m unittest discover -s tests -p "test_*.py"
```

可选浏览器自动化需要 Node.js 22+：

```cmd
npm ci
npm test
npx playwright install chromium
npm run test:browser
npm run test:browser:v3
```

先保持预览服务运行。浏览器测试采用独立测试上下文与合成媒体/虚拟麦克风，不读取你日常浏览器里的手帐。

当前测试机器是 Linux。已验证相同 Python 程序、包含空格的 ZIP 解压布局、跨目录启动与浏览器交互；尚未在 Windows 系统实际执行 CMD/Python Launcher。
