# 素材来源

示例照片来自 Unsplash 的公开图片服务，下载为仓库内本地 JPEG，运行时不请求第三方域名：

- 咖啡：<https://images.unsplash.com/photo-1495474472287-4d71bcdd2085>，通过 `w=900&q=85&fit=crop` 获取。
- 湖畔：<https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1>，通过 `w=600&q=85&fit=crop` 获取。
- Unsplash License：<https://unsplash.com/license>。照片仅用作第一阶段示例内容，不表示 Little Days 已建立原创摄影/素材商店；发布前应完成全部资产授权与来源审核。

位置：`Packages/LittleDaysCore/Sources/LittleDaysCore/Resources/Media/`。

页面线性图标使用项目内 SVG 路径；Emoji/符号贴纸由系统字体呈现，外观可能随 Windows/iPhone 改变。未捆绑付费字体或第三方贴纸包；V3 新增的 OFL 字体见下文。

`docs/images/` 是真实 Chromium 浏览器截图，使用仓库自带示例内容，不是 SwiftUI 截图。


## V3 字体许可与原创素材

实际打包七款字体：Cormorant Garamond（Elegant Serif）、Caveat（Handwritten）、Quicksand（Cute Rounded）、Libre Baskerville（Vintage）、DM Sans（Minimal Sans）、Pacifico（Decorative）、Ma Shan Zheng（Chinese Fonts）。均来自 Google Fonts 的 ofl 目录，附各自完整 SIL Open Font License 1.1 文本。每个原始下载地址、文件 SHA-256、PostScript 名和字重范围记录在共享 library.json。

OFL 允许遵守许可的商业使用、嵌入及再分发；字体文件中的作者、许可和 Reserved Font Names 保持原样。CSS 的 LD-* 家族是应用别名，不修改字体内部名称。本轮未抓取商业字体或音乐平台资源。

Stickers 目录包含本项目原创的 23 个 SVG 与对应透明 480px PNG，覆盖十类素材。原创许可见 LittleDays-Original-Assets.txt，允许随项目/衍生应用商业使用与修改，并保留声明；不含第三方贴纸包。

测试中的视频、波形音频和虚拟麦克风由测试程序合成，不是用户媒体，不用作背景音乐资源。真实用户媒体和导出的本机备份不得提交到仓库。真实 Web 截图使用公开示例或明确的合成测试内容，不是 SwiftUI 截图。

## V3.2 新增中文字体

| 字体 | 风格 | 来源与生成 |
| --- | --- | --- |
| 站酷快乐体 ZCOOL KuaiLe | 可爱圆润 | npm `@fontsource/zcool-kuaile@5.3.0`（Google Fonts ofl/zcoolkuaile） |
| 站酷小薇 ZCOOL XiaoWei | 雅致宋 | npm `@fontsource/zcool-xiaowei@5.3.0`（Google Fonts ofl/zcoolxiaowei） |
| 龙藏体 Long Cang | 手写行书 | npm `@fontsource/long-cang@5.3.0`（Google Fonts ofl/longcang） |
| 霞鹜文楷 LXGW WenKai | 楷体，适合正文与心得 | npm `lxgw-wenkai-webfont@1.7.0`（字体 v1.250，github.com/lxgw/LxgwWenKai） |

npm 包里是按 unicode-range 切开的网页子集。`tools/merge_font_slices.py` 把同一字体的子集合并回一个 TTF：字形轮廓、字体名称、版权与 OFL 均不改变，每个字形只保留一份；只删除引用子集内部字形编号的排版/竖排表（GSUB/GPOS/GDEF、vhea/vmtx、morx 等），因此复杂排版特性（如竖排替换）不可用。四款字体的 OFL 均未声明 Reserved Font Name；许可证文本随文件放在 `Fonts/LD-zh-*-OFL.txt`，SHA-256 记录在 library.json。
