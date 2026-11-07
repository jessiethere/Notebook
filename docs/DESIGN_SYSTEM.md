# Little Days · 视觉规范

方向：精品文具店的克制界面，搭配有温度、可自由创作的纸张与素材。默认界面留白、柔和、易读；创作画布可以丰富。避免把成长页面做成高压任务清单。

## 颜色

权威来源：`Packages/LittleDaysCore/Sources/LittleDaysCore/Resources/design-tokens.json`。

| 名称 | Token | 色值 | 用途 |
| --- | --- | --- | --- |
| Cream White | cream | #F8F5EF | 主背景 |
| Soft Ink | ink | #2F2A26 | 主文字 |
| Blush Pink | blush | #E8CFCF | 封面、胶带、柔和强调 |
| Sage Green | sage | #C9D7C1 | 成长、自然与积极状态 |
| Powder Blue | blue | #D8E3EE | 分类与封面 |
| Butter Yellow | butter | #F3E7B3 | 温暖纸张与封面 |

辅助色：accent #7D8D6D、muted #8D857B、line #E8E1D7、paper #FFFDFA。浅色只用于装饰/填充，不单独表示状态；完成按钮同时显示勾选与 `aria-pressed`。

Web 运行时加载共享 JSON。`Public/tokens.css` 是加载前的回退，由 `python tools/sync_tokens.py` 自动生成；禁止手工修改后形成第二套颜色源。SwiftUI 从同一资源解码生成 Color。

## 字体与层级

- 品牌与英文页标题：Georgia / 系统 Serif；中文主文案：平台系统黑体；手帐温柔宋体采用 Songti SC / SimSun 回退。
- Rounded 模式采用 Trebuchet MS / Microsoft YaHei 回退，目前未打包手写或商用字体。
- iPhone 内容区标题 25–30 px；区域标题 14–17 px；正文随场景 11–15 px；小型英文标签仅作辅助，不承载唯一操作说明。
- 原生采用系统字体与语义字号，后续须做 Dynamic Type 与 VoiceOver 实测。

## 布局与组件

- 优先 iPhone 375 / 390 / 430 宽；主内容左右边距 23 px，区域间距 20–24 px。
- 卡片圆角约 18–22 px，按钮约 12–14 px；边框轻、阴影少。
- 底部五个入口固定可达，Studio 以绿色创作按钮突出；页面内容独立滚动，避免导航随内容消失。
- 桌面浏览器展示 iPhone 预览框及品牌留白；手机宽度填满视口。外框/顶栏始终明确 Web Preview 身份。
- 习惯完成态：勾选 + 柔和绿色；草稿显示保存中/已保存/失败反馈；模态表单支持取消与键盘输入。
- 贴纸同时提供触控拖动与位置/大小/旋转滑杆，键盘可选择贴纸并使用滑杆调整。

## 创作语言

| 风格 | 表现 |
| --- | --- |
| Cute | 奶油点阵纸、粉色胶带、花朵/水果/小动物 |
| Minimal | 干净白纸、少量图形与线条 |
| Vintage | 暖黄横线纸、棕色胶带、信封/蝴蝶/旧物 |

当前三个模板是固定照片框 + 标题/正文，贴纸层自由叠加。高级照片变换与完整素材包后续实现。材质不要遮挡内容或降低输入控件可读性。

## 资产

照片在 Core 资源中只保存一份，两个预览服务器及原生共用。来源和说明见 [ASSETS.md](ASSETS.md)。Web 截图位于 `docs/images/`，由初始示例资料生成，不能替代交互验收。
