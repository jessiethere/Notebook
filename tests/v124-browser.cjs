// V10.24 · P1: mood is optional page metadata (页面信息, More → 心情 opens the
// same picker; named stamps; change / clear; saved; the cover has none; a new
// day gets no ☀️); background and paper replace each other (no hidden paper
// under a background, undo works); small fixes (形状 has no ‹, 贴纸 sheet
// title, 排版 name, no "added" toast over the paper); while typing with the
// keyboard up the type bar sits above it. Chromium, emulated iPhone 13.
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
    const context = await browser.newContext({ ...devices["iPhone 13"] });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(base);
    await page.waitForSelector(".hero");
    const today = await page.evaluate(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; });
    const draft = () => page.evaluate((t) => JSON.parse(localStorage.getItem("little-days.v1")).drafts[t], today);
    // the page being edited (its chip is the active one); drafts save about a second later
    const moment = async () => {
      const id = await page.evaluate(() => document.querySelector(".chapter-chip.active")?.dataset.moment || "");
      return (await draft())?.moments.find((m) => m.id === id) || (await draft())?.moments.at(-1) || {};
    };
    const stored = (field, value) =>
      page.waitForFunction(([t, field, value]) => {
        const id = document.querySelector(".chapter-chip.active")?.dataset.moment;
        const d = JSON.parse(localStorage.getItem("little-days.v1")).drafts[t];
        return (d?.moments.find((m) => m.id === id)?.[field] ?? "") === value;
      }, [today, field, value], { timeout: 8000 });
    const more = async () => {
      await page.evaluate(() => document.activeElement?.blur?.());
      if (!(await page.locator('.tool-sheet[data-tool-row="more"]').count())) await page.locator('.tool-dock [data-tool="more"]').tap();
      await page.waitForSelector(".more-grid");
    };
    const close = async () => {
      if (await page.locator('.tool-sheet [data-action="tool-close"]').count()) await page.locator('.tool-sheet [data-action="tool-close"]').tap();
      await page.waitForSelector(".tool-sheet", { state: "detached" });
    };

    await page.locator('[data-action="today-write"]').first().tap();
    await page.waitForSelector("#journal-canvas");
    await page.evaluate(() => document.activeElement?.blur?.());
    // ------------------------------------------------ a new day has no mood
    await page.waitForFunction((t) => JSON.parse(localStorage.getItem("little-days.v1") || "{}").drafts?.[t], today).catch(() => {});
    await page.keyboard.press("Escape");
    // ------------------------------------------------ More → 心情 opens 页面信息 at the picker
    await more();
    const tiles = await page.$$eval(".more-grid .more-tile", (els) => els.map((e) => e.innerText.trim()));
    assert.ok(tiles.includes("排版") && !tiles.includes("版式"), `排版, not 版式: ${tiles}`);
    await page.locator('.more-grid [data-action="mood-open"]').tap();
    await page.waitForSelector('.tool-sheet[data-tool-row="details"] #mood-picker');
    const stamps = await page.$$eval("#mood-picker .mood-stamp", (els) => els.map((e) => e.innerText.replace(/\s+/g, " ").trim()));
    assert.deepEqual(stamps, ["☀️ 开心", "🌷 温暖", "☁️ 平静", "🌧️ 低落", "✨ 雀跃", "— 清除"]);
    assert.equal(await page.locator("#mood-picker .mood-clear").isDisabled(), true, "nothing to clear yet");
    assert.equal((await moment()).mood || "", "", "no mood unless chosen");
    passed.push("More → 心情 opens 页面信息 at the mood stamps: 开心 · 温暖 · 平静 · 低落 · 雀跃 · 清除; none chosen by default");
    await page.locator('#mood-picker [data-mood="🌷"]').tap();
    await page.waitForFunction(async () => document.querySelector('#mood-picker [data-mood="🌷"]')?.getAttribute("aria-pressed") === "true");
    await stored("mood", "🌷");
    await page.locator('#mood-picker [data-mood="✨"]').tap();
    await page.waitForFunction(() => document.querySelector('#mood-picker [data-mood="✨"]')?.getAttribute("aria-pressed") === "true");
    await stored("mood", "✨");
    await page.locator("#mood-picker .mood-clear").tap();
    await page.waitForFunction(() => document.querySelector("#mood-picker .mood-clear")?.disabled);
    await stored("mood", "");
    await page.locator('#mood-picker [data-mood="☁️"]').tap();
    await stored("mood", "☁️");
    await page.reload();
    await page.waitForSelector(".hero");
    await page.locator('[data-action="today-write"]').first().tap();
    await page.waitForSelector("#journal-canvas");
    // (the draft reopens; find the page that has the mood)
    const kept = (await draft()).moments.some((m) => m.mood === "☁️");
    assert.ok(kept, "the mood was saved and survives a reload");
    passed.push("choose 温暖 → change to 雀跃 → 清除 → choose 平静: each saved as the same emoji value; kept after a reload");
    // the cover has no picker
    await page.locator(".chapter-chip.cover-chip").evaluate((el) => el.click());
    await page.waitForTimeout(400);
    await more();
    assert.equal(await page.locator('.more-grid [data-action="mood-open"]').count(), 0, "no 心情 on the cover");
    await page.locator('.more-grid [data-tool="details"]').tap();
    await page.waitForSelector('.tool-sheet[data-tool-row="details"]');
    assert.equal(await page.locator("#mood-picker").count(), 0);
    const day = await draft();
    assert.equal(day.mood || "", "", "a new day gets no ☀️");
    await close();
    passed.push("the cover (the whole day) has no mood picker, and today's new day was not given ☀️");

    // ------------------------------------------------ background and paper replace each other
    await page.locator(".chapter-chip:not(.cover-chip):not(.add)").first().evaluate((el) => el.click());
    await page.waitForTimeout(400);
    await more();
    await page.locator('.more-grid [data-tool="paper"]').tap();
    await page.waitForSelector('.tool-sheet[data-tool-row="paper"]');
    await page.locator('[data-action="moment-template"][data-template="kraft"]').tap();
    await page.waitForFunction(() => document.querySelector('[data-template="kraft"]')?.getAttribute("aria-pressed") === "true");
    const scene = await page.locator('.backdrop-option[data-backdrop^="scene:"]').first().getAttribute("data-backdrop");
    await page.locator(`.backdrop-option[data-backdrop="${scene}"]`).tap();
    await page.waitForFunction((s) => document.querySelector(`.backdrop-option[data-backdrop="${s}"]`)?.getAttribute("aria-pressed") === "true", scene);
    await stored("backdrop", scene);
    await stored("template", "minimal"); // the background replaced the paper (none kept underneath)
    assert.equal(await page.locator('.paper-option[aria-pressed="true"]').count(), 0, "no paper shown as chosen under a background");
    await page.locator('[data-action="moment-template"][data-template="lined"]').tap();
    await page.waitForFunction(() => document.querySelector('[data-template="lined"]')?.getAttribute("aria-pressed") === "true");
    await stored("template", "lined");
    await stored("backdrop", ""); // the paper replaced the background — no undo needed
    await page.evaluate(() => document.querySelector('[data-action="undo"]').click());
    await page.waitForFunction((s) => { const t = new Date(); const k = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`; return JSON.parse(localStorage.getItem("little-days.v1")).drafts[k].moments.some((x) => x.backdrop === s); }, scene);
    passed.push("paper → library background (paper goes back to plain, none shown as chosen) → lined paper (background removed); undo brings the background back");
    await close();

    // ------------------------------------------------ small fixes
    await page.locator('.tool-dock [data-tool="stickers"]').tap();
    await page.waitForSelector('.tool-sheet[data-tool-row="stickers"]');
    assert.equal((await page.locator('.tool-sheet[data-tool-row="stickers"] .sheet-head b').innerText()).trim(), "贴纸");
    await close();
    await page.locator("#photos-input").setInputFiles(["latte-art", "corner-cafe"].map((n) => path.join(lib, `LD-photo-${n}.jpg`)));
    await page.waitForTimeout(1200);
    if (await page.locator("#photo-editor[open]").count()) await SS.skipPhotoEditor(page);
    await page.waitForFunction(() => document.querySelectorAll("#journal-canvas .photo-layer img").length >= 2);
    await page.waitForTimeout(300);
    assert.doesNotMatch(await page.locator("#toast").innerText().catch(() => ""), /已加入/, "no 'added' toast over the paper");
    await page.locator("#journal-canvas .photo-layer").first().tap();
    await page.locator('.tool-dock [data-tool="shape"]').tap();
    await page.waitForSelector('.tool-sheet[data-tool-row="shape"]');
    assert.equal(await page.locator('.tool-sheet[data-tool-row="shape"] .sheet-back').count(), 0, "形状 has no ‹ (it belongs to the photo, not to More)");
    passed.push("贴纸 sheet is titled 贴纸; More says 排版; adding photos shows no toast over the paper; 形状 has no ‹ to More");

    // ------------------------------------------------ typing with the keyboard up: the bar sits above it
    await page.locator('[data-action="layer-deselect"]').tap().catch(() => {});
    await page.locator('.tool-dock [data-action="add-text-layer"]').tap();
    await page.waitForTimeout(400);
    await page.keyboard.type("一句话");
    const kb = 300;
    const where = await page.evaluate((kb) => {
      // what the app sets on an iPhone when the keyboard is up (updateVisibleArea)
      document.documentElement.style.setProperty("--vv-h", innerHeight - kb + "px");
      document.documentElement.style.setProperty("--kb", kb + "px");
      const bar = document.querySelector("#type-bar");
      const r = bar.getBoundingClientRect();
      return { hidden: bar.hidden, typing: document.body.classList.contains("typing"), bottom: Math.round(r.bottom), top: Math.round(r.top), keyboardTop: innerHeight - kb };
    }, kb);
    assert.ok(!where.hidden && where.typing, JSON.stringify(where));
    assert.ok(where.bottom <= where.keyboardTop && where.top > 60, `the type bar sits right above the keyboard: ${JSON.stringify(where)}`);
    passed.push(`typing with a ${kb}px keyboard: the type bar sits right above it (bottom ${where.bottom} ≤ keyboard top ${where.keyboardTop}) — Chromium with the app's own keyboard measure, not a real iPhone keyboard`);
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
  for (const line of passed) console.log("✓", line);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
