# 仓库协作入口

本说明适用于整个仓库。

- 产品为 Little Days（手帐文具店）。最终 iPhone App 使用 Swift / SwiftUI，未经用户确认不得整体改为 React。
- Windows 日常使用 `py -3 tools/preview.py` 提供 HTML/CSS/JavaScript 交互预览；这是独立 Web 层，不是实际运行的 SwiftUI。保留现有 Vapor 服务入口。
- 开始或接续任何任务前，先阅读 [agent.md](agent.md) 和 [README.md](README.md)，了解最新进度、约定和待办。
- 随后检查仓库最新代码、分支与提交记录；同时阅读相关的 docs/PRODUCT_SPEC.md、DESIGN_SYSTEM.md、ARCHITECTURE.md，基于已完成工作继续，不从零重复创建。
- **每次更新都必须同步更新 agent.md 和 README.md 中的更新日志**，包括代码、配置和文档修改；日志应随对应改动一起提交。
- 在 agent.md 中维护当前状态、关键决定、验证结果、未完成事项和下一步；README.md 保留面向使用者的更新摘要，确保两处记录一致。
- 追加历史记录，不删除旧日志；同日多次更新使用不同条目。只记录实际完成的工作，如实标注未验证或受阻事项。
- 具体交接规则和日志模板以 [agent.md](agent.md) 为准。
- 设计颜色、导航/素材定义与示例数据以 Packages/LittleDaysCore/Sources/LittleDaysCore/Resources 为准；修改颜色后运行 tools/sync_tokens.py，不手工维护第二套 CSS 颜色。
- agent 日志必须含日期/任务、需求、文件、功能、决策与原因、运行/测试、已知问题、未完成和下一步；README 必须含摘要、可运行功能、最新启动方法、未完成事项。
- 真实记录环境限制；语法解析不能写成 iOS 编译通过，Linux 上运行 Python 不能写成 Windows 实机通过。
- 完成任务用中文按六项回复：完成内容、可用功能、Windows 最新启动方式、未完成内容、运行的测试及结果、下一步建议。
