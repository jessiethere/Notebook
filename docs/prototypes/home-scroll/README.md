# Home Scroll Experience — 设计原型（未接入 App）

这两个文件是 2026-11-11 设计轮用的原型，不是产品代码，`Public/` 不引用它们。

- `home-scroll.css`：新版「Today's Story / 轻量待办 / My Library」的样式。
- `home-scroll.inject.js`：在浏览器里对**真实首页**执行的函数：读取首页已渲染的今天的页面、待办和书本封面，重排成新结构（用于截图评审）。

用法（Playwright）：打开预览 → `page.addStyleTag({ content: css })` → `page.evaluate("(" + js + ")({})")`。
可选参数：`photos`（首页故事的照片数）、`empty`、`open`（待办展开）、`books`、`video`、`en`。

确认方案后，按 docs/HOME_SCROLL_PLAN.md 在 `Public/app.js` 的 `home()` 和 `Public/styles.css` 里正式实现；实现完成后可删除本目录。
