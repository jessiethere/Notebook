# 仓库协作入口

本说明适用于整个仓库。

- 产品为 Little Days（手帐文具店）。最终 iPhone App 使用 Swift / SwiftUI，未经用户确认不得整体改为 React。
- Windows 日常使用 `py -3 tools/preview.py` 提供 HTML/CSS/JavaScript 交互预览；这是独立 Web 层，不是实际运行的 SwiftUI。保留现有 Vapor 服务入口。
- Windows 用户可能没有 Git；优先给 ZIP 全部解压 + Start-Windows.cmd 的方法，或在正确项目目录运行 `py -3 tools\preview.py --open`。
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
- 真实记录环境限制；语法解析不能写成 iOS 编译通过，Linux 上运行 Python 不能写成 Windows 实机通过。
- 完成任务用中文按六项回复：完成内容、可用功能、Windows 最新启动方式、未完成内容、运行的测试及结果、下一步建议。
