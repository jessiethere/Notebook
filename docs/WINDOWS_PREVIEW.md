# Windows 打开 Little Days（localhost 链接）

日常检查更新只需要点 **[http://localhost:8080](http://localhost:8080)**。这个页面就是 iOS App（Swift 外壳）里运行的同一个界面，不需要 Mac、Xcode，也不需要下载 ZIP。

## 第一次设置（只做一次）

1. 安装 [Python 3.10+](https://www.python.org/downloads/windows/)（勾选 Python Launcher / Add to PATH）和 [Git for Windows](https://git-scm.com/download/win)。
2. 在想存放项目的文件夹地址栏输入 `cmd` 回车，运行：

```cmd
git clone https://github.com/jessiethere/Notebook.git
```

## 以后每次查看

1. 双击 `Notebook` 文件夹里的 **Start-Windows.cmd**：它会先自动 `git pull --ff-only` 获取最新代码，再启动服务并打开浏览器。
2. 点 **[http://localhost:8080](http://localhost:8080)**（README 顶部也有这个链接）。保持黑色窗口开启，Ctrl+C 停止。

## 手动启动

在上面那层文件夹的地址栏输入 `cmd` 并回车，运行：

```cmd
py -3 tools\preview.py --open
```

`--open` 是可选的自动打开浏览器参数。没有 `py` 时可用 `python tools\preview.py --open`。

## 常见报错

| 报错 | 原因和操作 |
| --- | --- |
| `'git' is not recognized` | 安装 Git for Windows 后重新打开终端；没有 Git 时 Start-Windows.cmd 会跳过更新，显示电脑上已有的版本。 |
| `can't open file C:\Users\...\tools\preview.py` | 终端仍在用户目录。先 `cd Notebook`，或直接双击目录内的 Start-Windows.cmd。 |
| 文件路径写成 `preview\.py` | 正确文件名是 `preview.py`；只有 tools 与文件名之间有一个反斜杠。 |
| Python 未找到或版本过旧 | 安装 Python 3.10+，启用 Python Launcher；安装后重新打开终端。 |
| Incomplete project | 不在完整的项目目录里运行；Public、tools、Packages 必须同在项目目录。 |
| 端口被占用 | 先停止旧窗口，或明确使用 `py -3 tools\preview.py --port 8081 --open` 并访问 localhost:8081。 |
| 浏览器没有自动打开 | 手动输入 http://localhost:8080；服务会继续运行。 |

## 更新与数据

更新由 Start-Windows.cmd 自动 `git pull` 完成，不需要重新下载。文字、照片、视频与音频保存在当前浏览器的 localhost 站点存储，不在项目文件夹里，更新代码不会删除它们。**继续使用同一个浏览器、localhost 地址和端口**，并先在 Settings 导出完整本机备份。

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
