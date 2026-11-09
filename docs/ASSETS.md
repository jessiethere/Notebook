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

Music 目录（V6.0 / V6.2）包含 8 首本项目原创的背景音乐（LD-music-*.mp3，96 kbps，38–53 秒循环）：午后咖啡、窗外下雨、出门散步、晚安、海边、清晨钢琴、晴天、咖啡馆一角。全部由 tools/make_music.py 用代码合成（FM 电钢琴、钢琴、拨弦/尤克里里、低音提琴、八音盒、钢片琴、铺底、噪声鼓与鼓刷、雨声、海浪、咖啡馆背景声、黑胶噪声），不使用任何采样、录音、他人歌曲或流媒体平台内容；和弦是常见进行，旋律为本项目编写。许可见 LittleDays-Original-Music.txt：用户可在 App 内播放，并用于自己的页面、视频和书（包括分享给家人朋友）。每首的来源、时长、BPM 记录在 library.json `music`。

测试中的视频、波形音频和虚拟麦克风由测试程序合成，不是用户媒体，不用作背景音乐资源。真实用户媒体和导出的本机备份不得提交到仓库。真实 Web 截图使用公开示例或明确的合成测试内容，不是 SwiftUI 截图。

## V3.2 新增中文字体

| 字体 | 风格 | 来源与生成 |
| --- | --- | --- |
| 站酷快乐体 ZCOOL KuaiLe | 可爱圆润 | npm `@fontsource/zcool-kuaile@5.3.0`（Google Fonts ofl/zcoolkuaile） |
| 站酷小薇 ZCOOL XiaoWei | 雅致宋 | npm `@fontsource/zcool-xiaowei@5.3.0`（Google Fonts ofl/zcoolxiaowei） |
| 龙藏体 Long Cang | 手写行书 | npm `@fontsource/long-cang@5.3.0`（Google Fonts ofl/longcang） |
| 霞鹜文楷 LXGW WenKai | 楷体，适合正文与心得 | npm `lxgw-wenkai-webfont@1.7.0`（字体 v1.250，github.com/lxgw/LxgwWenKai） |

npm 包里是按 unicode-range 切开的网页子集。`tools/merge_font_slices.py` 把同一字体的子集合并回一个 TTF：字形轮廓、字体名称、版权与 OFL 均不改变，每个字形只保留一份；只删除引用子集内部字形编号的排版/竖排表（GSUB/GPOS/GDEF、vhea/vmtx、morx 等），因此复杂排版特性（如竖排替换）不可用。四款字体的 OFL 均未声明 Reserved Font Name；许可证文本随文件放在 `Fonts/LD-zh-*-OFL.txt`，SHA-256 记录在 library.json。

## V4.4 照片素材（真实照片）与页面背景

- **照片素材**：78 张来自 Unsplash 的照片，按心情和事件分 13 组，位于 `Resources/Photos/LD-photo-*.jpg`（JPEG，保留原始横竖比例、长边 1000px，约 9.6 MB；尺寸记录在 `photos[].w/h`）。由 `tools/fetch_photos.py` 一次性下载并随 App 打包，运行时不请求 Unsplash。每个文件的原图地址写在 `Photos/Unsplash-Photos.txt` 和 `library.json` 的 `photos[].source`。
- 许可：Unsplash License（<https://unsplash.com/license>）允许免费商用、修改，不要求署名，但不允许把照片原样汇编成同类图库或壁纸服务。Little Days 只把它们作为写手帐时可选的配图；正式上架前仍应按上文完成全部资产的来源与授权审核。挑选时尽量避开可辨认的人脸和品牌标志。
- **页面背景**：`Scenes/` 里的渐变、可爱图案、万花筒、光影丝带、星空（21 张）是项目原创，用作页面背景（`backdrop`）；12 张手绘“生活小景”标记为 `retired`，只为兼容已使用它们的页面而保留。
- 2026-11-09 更新：万花筒、光影丝带、星空也标记为 `retired`（只为兼容保留）。照片素材中有 10 张标记 `backdrop: true`，可作为整页背景（“照片氛围”），`tone` 由 `tools/fetch_photos.py` 按画面下半部分亮度计算。
