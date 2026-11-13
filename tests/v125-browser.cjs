// V10.25 · P2 Phase 1–2: a selected item says what it is ("照片 · 已选中")
// and its first button is ← 返回 (never ×); 返回 leaves the item where it is;
// × only closes a strip; a sticker can be swapped in place (换一个); the
// item's options (形状 · 图层 · 字体 …) open as a compact strip and the paper
// stays much bigger than before (it shrank to 136 px wide at 375×667); 图层
// shows order and copy first, exact numbers fold under 精确调整.
// Chromium, emulated phones (375×667 and iPhone 13) — not a real iPhone.
const { chromium, devices } = require("playwright");
const SS = require("./signed-in.cjs");
SS(chromium);
const assert = require("node:assert/strict");
const path = require("node:path");
const base = process.env.PREVIEW_URL || "http://127.0.0.1:8080";
const lib = path.join(__dirname, "../Packages/LittleDaysCore/Sources/LittleDaysCore/Resources/Photos");

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || undefined });
  const passed = [];
  try {
    for (const [label, opts] of [["375×667", { viewport: { width: 375, height: 667 }, isMobile: true, hasTouch: true }], ["iPhone 13", devices["iPhone 13"]]]) {
      const context = await browser.newContext(opts);
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.goto(base);
      await page.waitForSelector(".hero");
      await page.locator('[data-action="today-write"]').first().tap();
      await page.waitForSelector("#journal-canvas");
      await page.evaluate(() => document.activeElement?.blur?.());
      await page.locator("#photos-input").setInputFiles(["latte-art", "corner-cafe"].map((n) => path.join(lib, `LD-photo-${n}.jpg`)));
      await page.waitForTimeout(1200);
      if (await page.locator("#photo-editor[open]").count()) await SS.skipPhotoEditor(page);
      await page.waitForFunction(() => document.querySelectorAll("#journal-canvas .photo-layer img").length >= 2);
      if (await page.locator('[data-action="layout-hint-close"]').count()) await page.locator('[data-action="layout-hint-close"]').tap();
      const paperW = () => page.evaluate(() => Math.round(document.querySelector("#journal-canvas").getBoundingClientRect().width));
      const full = await paperW();
      const layers = () => page.evaluate(() => { const t = new Date(); const k = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`; return JSON.parse(localStorage.getItem("little-days.v1")).drafts[k].moments.at(-1).layers; });

      // ------------------------------------------------ ← 返回 and "照片 · 已选中"
      await page.locator("#journal-canvas .photo-layer").first().tap();
      await page.waitForSelector('.tool-dock.ctx[data-ctx="photo"]');
      assert.match(await page.locator(".ctx-caption").innerText(), /照片\s*·\s*已选中/);
      const back = page.locator('.tool-dock.ctx [data-action="layer-deselect"]');
      assert.equal((await back.innerText()).trim(), "返回");
      assert.equal(await back.locator(".ctx-x").count(), 0, "no × on the back button");
      assert.equal(await back.getAttribute("aria-label"), "返回创作工具");
      // × closes a strip only; the photo stays selected
      await page.locator('.tool-dock [data-tool="shape"]').tap();
      await page.waitForSelector('.tool-sheet.strip[data-tool-row="shape"]');
      const withShape = await paperW();
      await page.locator('.tool-sheet [data-action="tool-close"]').tap();
      await page.waitForSelector(".tool-sheet", { state: "detached" });
      assert.equal(await page.locator('.tool-dock.ctx[data-ctx="photo"]').count(), 1, "× closed the strip, the photo is still selected");
      // 图层: order and copy first, 精确调整 folded
      await page.locator('.tool-dock [data-tool="layer"]').tap();
      await page.waitForSelector('.tool-sheet.strip[data-tool-row="layer"]');
      const withLayer = await paperW();
      assert.deepEqual(await page.$$eval(".layer-controls .layer-buttons button", (els) => els.map((e) => e.dataset.action)), ["layer-forward", "layer-backward", "layer-front", "layer-back", "layer-copy"]);
      assert.equal(await page.locator("details.layer-precise").getAttribute("open"), null, "exact numbers folded");
      assert.equal(await page.locator('details.layer-precise [data-layer-field="x"]').isVisible(), false);
      await page.waitForTimeout(1200);
      const before = (await layers()).length;
      await back.tap();
      await page.waitForSelector(".tool-dock:not(.ctx)");
      assert.equal(await page.locator(".ctx-caption").count(), 0);
      assert.equal((await layers()).length, before, "返回 leaves the photo where it is");
      passed.push(`${label}: 照片 · 已选中 above the tools, first button ← 返回 (no ×); × closes the strip and keeps the photo selected; 返回 deselects and keeps the photo; 图层 = 上移 · 下移 · 置顶 · 置底 · 复制, exact numbers folded`);

      // ------------------------------------------------ text: strip keeps the paper big
      await page.locator('.tool-dock [data-action="add-text-layer"]').tap();
      await page.waitForTimeout(300);
      await page.keyboard.type("一句话");
      await page.evaluate(() => document.activeElement.blur());
      await page.waitForTimeout(300);
      await page.locator("#journal-canvas .text-layer .layer-text").last().tap();
      await page.waitForSelector('.tool-dock.ctx[data-ctx="text"]');
      assert.match(await page.locator(".ctx-caption").innerText(), /文字\s*·\s*已选中/);
      await page.locator('.tool-dock [data-tab="font"]').tap();
      await page.waitForSelector('.tool-sheet.strip[data-tool-row="textstyle"]');
      const withFont = await paperW();
      await page.locator('.tool-dock [data-action="layer-deselect"]').tap();
      const small = 160; // (Playwright's "iPhone 13" viewport is 390×664 — as short as 375×667)
      for (const [name, w] of [["形状", withShape], ["图层", withLayer], ["字体", withFont]]) assert.ok(w >= small, `${label} ${name}: paper ${w}px wide with the strip open (was 136 at 375×667)`);
      passed.push(`${label}: paper ${full}px wide; with a strip open 形状 ${withShape} · 图层 ${withLayer} · 字体 ${withFont} (before V10.25 any sheet left 136 px at 375×667)`);

      // ------------------------------------------------ sticker: 换一个 keeps place, size and turn
      await page.locator('.tool-dock [data-tool="stickers"]').tap();
      await page.locator('[data-action="asset-sticker"]').first().tap();
      await page.locator('[data-action="tool-close"]').tap();
      await page.waitForSelector('.tool-dock.ctx[data-ctx="sticker"]');
      assert.match(await page.locator(".ctx-caption").innerText(), /贴纸\s*·\s*已选中/);
      // (drafts save about a second later)
      await page.waitForFunction(() => { const t = new Date(); const k = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`; return JSON.parse(localStorage.getItem("little-days.v1")).drafts[k].moments.at(-1).layers.at(-1)?.assetId; });
      const st = (await layers()).at(-1);
      await page.locator('.tool-dock [data-action="sticker-swap"]').tap();
      await page.waitForSelector('.tool-sheet[data-tool-row="stickers"]');
      const other = await page.locator(`[data-action="asset-sticker"]:not([data-sticker="${st.assetId}"])`).first().getAttribute("data-sticker");
      await page.locator(`[data-action="asset-sticker"][data-sticker="${other}"]`).tap();
      await page.waitForFunction(([id, a]) => { const t = new Date(); const k = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`; return JSON.parse(localStorage.getItem("little-days.v1")).drafts[k].moments.at(-1).layers.find((l) => l.id === id)?.assetId === a; }, [st.id, other]);
      const swapped = (await layers()).find((l) => l.id === st.id);
      assert.deepEqual([swapped.x, swapped.y, swapped.scale, swapped.rotation], [st.x, st.y, st.scale, st.rotation], "same place, size and turn");
      assert.equal((await layers()).length, before + 2, "swapped, not added");
      passed.push(`${label}: 贴纸 · 已选中; 换一个 swaps the sticker (${st.assetId} → ${other}) in place — same position, size and angle, no extra sticker`);
      // ------------------------------------------------ 更多: three groups; 页面目录 copies; 目录 still reachable
      if (label === "375×667") {
        await page.locator('.tool-dock [data-action="layer-deselect"]').tap().catch(() => {});
        await page.locator('.tool-dock [data-tool="more"]').tap();
        await page.waitForSelector(".more-group");
        assert.deepEqual(await page.$$eval(".more-group h4", (els) => els.map((e) => e.innerText.trim())), ["页面外观", "媒体与创作", "页面管理"]);
        const firstMake = page.locator(".more-group").nth(1).locator(".more-tile").first();
        assert.equal(await firstMake.getAttribute("data-action"), "draw-new");
        assert.match(await firstMake.getAttribute("class"), /accent/);
        assert.equal(await page.locator('.more-grid [data-tool="photos"], .more-grid [data-tool="chapters"]').count(), 0, "本页照片 / 目录 tiles gone");
        await page.screenshot({ path: process.env.SHOTS ? `${process.env.SHOTS}/v125-more-375.png` : "/dev/null" }).catch(() => {});
        const pagesBefore = await page.evaluate(() => { const t = new Date(); const k = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`; return JSON.parse(localStorage.getItem("little-days.v1")).drafts[k].moments.length; });
        await page.locator('.more-grid [data-action="open-pages"]').tap();
        await page.waitForSelector("#choose-dialog[open] .pages-sheet");
        assert.equal((await page.locator("#choose-dialog .pages-sheet h2").innerText()).trim(), "页面目录");
        await page.locator('#choose-dialog [data-action="page-copy"]').first().tap();
        await page.waitForFunction((n) => { const t = new Date(); const k = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`; return JSON.parse(localStorage.getItem("little-days.v1")).drafts[k].moments.length === n + 1; }, pagesBefore);
        await page.locator('#choose-dialog [data-action="pages-more"]').tap();
        await page.waitForSelector('.tool-sheet[data-tool-row="chapters"]');
        passed.push(`${label}: 更多 = 页面外观 · 媒体与创作 (手绘 first, highlighted) · 页面管理; no 本页照片 / 目录 tiles; 页面目录 copies a page; 更多页面操作 still opens the older 目录 (save one page, fold)`);
      }
      assert.deepEqual(errors, []);
      await context.close();
    }
  } finally {
    await browser.close();
  }
  for (const line of passed) console.log("✓", line);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
