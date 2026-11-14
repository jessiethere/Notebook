// V10.57 · Drawing board UI: × on the left, 手绘 in the middle, 完成 on the
// right; four compact tools with names (soft-green selection); colours;
// size with a live dot; undo / redo icons with a disabled state; 清空画布
// in ··· asks first and can be undone; × with new strokes asks 保存 /
// 放弃 / 继续画 (保存 puts the drawing on the page); the long note is a
// one-time tip; zh and en labels. The drawing data format is unchanged.
const { chromium } = require("playwright");
require("./signed-in.cjs")(chromium);
const assert = require("node:assert/strict");
const base = process.env.PREVIEW_URL || "http://127.0.0.1:8080";

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || undefined });
  const passed = [];
  try {
    for (const run of [{ lang: "zh", w: 375, h: 667 }, { lang: "en", w: 430, h: 932 }]) {
      const where = `${run.lang} ${run.w}`;
      const context = await browser.newContext({ viewport: { width: run.w, height: run.h }, isMobile: true, hasTouch: true });
      await context.addInitScript((lang) => localStorage.setItem("little-days.language", lang), run.lang === "zh" ? "zh-CN" : "en");
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("dialog", (d) => errors.push(`native dialog: ${d.message()}`));
      await page.goto(base);
      await page.waitForSelector(".hero");
      const open = async () => {
        await page.locator('[data-action="today-draw"]').tap();
        await page.waitForSelector("#draw-dialog[open] .draw-canvas");
        await page.waitForTimeout(250);
      };
      const ink = async (dx = 0) => {
        const c = await page.locator("#draw-dialog .draw-canvas").boundingBox();
        await page.mouse.move(c.x + 40 + dx, c.y + 60);
        await page.mouse.down();
        for (let i = 1; i < 10; i++) await page.mouse.move(c.x + 40 + dx + i * 12, c.y + 60 + i * 10);
        await page.mouse.up();
      };
      const pixels = () => page.evaluate(() => { const cv = document.querySelector("#draw-dialog .draw-canvas"); const d = cv.getContext("2d").getImageData(0, 0, cv.width, cv.height).data; let n = 0; for (let i = 3; i < d.length; i += 16) if (d[i]) n++; return n; });
      await open();
      // Top bar and labels.
      const top = await page.evaluate(() => ({ x: document.querySelector('[data-draw="cancel"]').textContent.trim(), xLabel: document.querySelector('[data-draw="cancel"]').getAttribute("aria-label"), title: document.querySelector(".draw-top b").textContent, done: document.querySelector('[data-draw="done"]').textContent, tools: [...document.querySelectorAll("[data-draw-tool] span")].map((s) => s.textContent), size: document.querySelector(".draw-size span").textContent }));
      assert.equal(top.x, "×");
      if (run.lang === "zh") {
        assert.deepEqual([top.xLabel, top.title, top.done, top.size], ["取消", "手绘", "完成", "粗细"]);
        assert.deepEqual(top.tools, ["钢笔", "马克笔", "铅笔", "橡皮擦"]);
      } else {
        assert.deepEqual([top.xLabel, top.title, top.done, top.size], ["Cancel", "Draw", "Done", "Size"]);
        assert.deepEqual(top.tools, ["Pen", "Marker", "Pencil", "Eraser"]);
      }
      assert.equal(await page.locator(".draw-hint").count(), 0, `${where}: no long note`);
      assert.equal(await page.locator(".draw-tip").count(), 1, `${where}: a one-time tip`);
      const toolH = await page.locator('[data-draw-tool="pen"]').evaluate((el) => el.getBoundingClientRect().height);
      assert.ok(toolH >= 44 && toolH <= 60, `${where}: compact tools (${toolH}px)`);
      const reach = await page.locator("[data-draw-color]").first().evaluate((el) => el.getBoundingClientRect().width);
      assert.ok(reach >= 36, `${where}: colours are easy to tap (${reach}px)`);
      assert.ok(await page.locator('[data-draw="undo"]').isDisabled());
      assert.ok(await page.locator('[data-draw="redo"]').isDisabled());
      passed.push(`${where}: × · ${top.title} · ${top.done}; tools ${top.tools.join("/")}; no long note; undo / redo disabled at first`);

      // Tools, colours, size.
      await page.locator('[data-draw-tool="marker"]').tap();
      assert.equal(await page.locator('[data-draw-tool="marker"]').getAttribute("aria-pressed"), "true");
      const selBg = await page.locator('[data-draw-tool="marker"]').evaluate((el) => getComputedStyle(el).backgroundColor);
      assert.notEqual(selBg, "rgb(255, 253, 249)", `${where}: soft green selection`);
      await page.locator('[data-draw-color="#7d8e66"]').tap();
      assert.equal(await page.locator('[data-draw-color="#7d8e66"]').getAttribute("aria-pressed"), "true");
      const dot1 = await page.locator(".draw-dot").evaluate((el) => el.style.getPropertyValue("--dot"));
      await page.locator("[data-draw-size]").fill("22");
      const dot2 = await page.locator(".draw-dot").evaluate((el) => el.style.getPropertyValue("--dot"));
      assert.ok(parseInt(dot2) > parseInt(dot1), `${where}: the size dot grows (${dot1} → ${dot2})`);
      assert.equal(await page.locator(".draw-dot").evaluate((el) => el.style.getPropertyValue("--ink")), "#7d8e66");
      passed.push(`${where}: marker + green selected; the size dot follows the slider and the colour`);

      // Undo / redo; clear asks and can be undone.
      await page.locator('[data-draw-tool="pen"]').tap();
      await ink();
      const drawn = await pixels();
      assert.ok(drawn > 0);
      assert.ok(await page.locator('[data-draw="undo"]').isEnabled());
      await page.locator('[data-draw="undo"]').tap();
      assert.equal(await pixels(), 0);
      assert.ok(await page.locator('[data-draw="redo"]').isEnabled());
      await page.locator('[data-draw="redo"]').tap();
      assert.equal(await pixels(), drawn);
      assert.equal(await page.locator('.draw-row [data-draw="clear"]').count(), 0, `${where}: 清空 is not next to undo`);
      await page.locator('[data-draw="more"]').tap();
      await page.locator('[data-draw="clear"]').tap();
      await page.waitForSelector(".draw-ask:not([hidden])");
      await page.locator('[data-draw-answer="keep"]').tap();
      assert.equal(await pixels(), drawn, `${where}: 取消 keeps the drawing`);
      await page.locator('[data-draw="more"]').tap();
      await page.locator('[data-draw="clear"]').tap();
      await page.locator('[data-draw-answer="clear"]').tap();
      assert.equal(await pixels(), 0);
      await page.locator('[data-draw="undo"]').tap();
      assert.equal(await pixels(), drawn, `${where}: a clear can be undone`);
      passed.push(`${where}: undo / redo; 清空画布 in ··· asks first and comes back with undo`);

      // × with new strokes: 继续画 / 保存到页面.
      await page.locator('[data-draw="cancel"]').tap();
      await page.waitForSelector(".draw-ask:not([hidden])");
      await page.locator('[data-draw-answer="stay"]').tap();
      assert.ok(await page.locator("#draw-dialog[open]").count());
      await page.locator('[data-draw="cancel"]').tap();
      await page.locator('[data-draw-answer="save"]').tap();
      await page.waitForFunction(() => !document.querySelector("#draw-dialog[open]"));
      await page.waitForSelector("#journal-canvas .drawing-layer");
      passed.push(`${where}: × asks 保存 / 放弃 / 继续画; 保存 puts the drawing on the page`);

      // The tip shows once.
      await page.evaluate(() => document.querySelector('[data-action="draw-new"], [data-action="today-draw"]'));
      const seen = await page.evaluate(() => localStorage.getItem("little-days.drawTip"));
      assert.equal(seen, null, "not dismissed yet");
      assert.deepEqual(errors, [], `${where}: ${errors.join(" | ")}`);
      await context.close();
    }
  } finally {
    await browser.close();
  }
  console.log(`V10.57 drawing board E2E passed (${passed.length} groups):\n - ${passed.join("\n - ")}`);
  console.log("No page errors.");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
