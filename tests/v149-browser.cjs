// V10.51 · 今天的故事 and Journal Studio text, from TestFlight:
//  - the words sheet (and the keyboard) covered the page: a new font or A+
//    could not be seen until the sheet was closed;
//  - 保存 did not open the page just made (it opened the day's first page);
//  - Studio text: a new box started with its words selected (iPhone shows
//    Cut / Copy / Paste over it); typing showed two rows of controls.
// Synthetic data only (the app's own library photos).
const { chromium, devices } = require("playwright");
require("./signed-in.cjs")(chromium);
const assert = require("node:assert/strict");
const base = process.env.PREVIEW_URL || "http://127.0.0.1:8080";
const photo = (n) => `${__dirname}/../Packages/LittleDaysCore/Sources/LittleDaysCore/Resources/Photos/LD-photo-${n}.jpg`;

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || undefined });
  const passed = [];
  try {
    const context = await browser.newContext({ ...devices["iPhone 13"], locale: "zh-CN" });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(base);
    await page.waitForSelector(".hero");
    const today = await page.evaluate(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; });

    // 0. An older page on today first (so "the day's first page" is not the new one).
    await page.locator('[data-action="today-write"]').first().tap();
    await page.waitForSelector('#journal-canvas [data-inline="title"]');
    await page.keyboard.type("早上的一页");
    await page.evaluate(() => document.activeElement?.blur?.());
    await page.locator('.sv-top [data-action="save-entry"]').tap();
    await page.waitForFunction(() => !document.querySelector("#phone.in-studio"));
    await page.locator('#navigation [data-page="home"]').tap().catch(() => {});
    if (await page.locator('[data-action="reader-back"]').count()) await page.locator('[data-action="reader-back"]').first().tap();
    await page.locator('#navigation [data-page="home"]').tap().catch(() => {});
    await page.waitForSelector(".hero");

    // 1. A story; the words sheet shows the real page live at its top.
    const [chooser] = await Promise.all([page.waitForEvent("filechooser"), page.locator('[data-action="today-photos"]').first().tap()]);
    await chooser.setFiles(["frost", "bouquet", "corner-cafe"].map(photo));
    await page.waitForSelector('[data-action="story-save"]');
    await page.locator('.qe-tools [data-action="story-text"]').tap();
    await page.waitForSelector("#choose-dialog[open] [data-sw-text]");
    await page.locator("#choose-dialog [data-sw-text]").fill("周六的咖啡，风很轻");
    await page.waitForFunction(() => /周六的咖啡/.test(document.querySelector("#choose-dialog .sw-preview")?.textContent || ""), null, { timeout: 5000 });
    const look = () => page.evaluate(() => {
      const el = [...document.querySelectorAll("#choose-dialog .sw-preview *")].find((e) => e.children.length === 0 && /周六的咖啡/.test(e.textContent));
      const cs = el && getComputedStyle(el.closest("[data-layer]") || el);
      return cs ? { font: cs.fontFamily, size: parseFloat(cs.fontSize), color: cs.color, align: cs.textAlign } : null;
    });
    const box = await page.locator("#choose-dialog .sw-preview").boundingBox();
    const sheet = await page.locator("#choose-dialog .sw").boundingBox();
    assert.ok(box && box.height >= 110 && box.y >= sheet.y, "the live page sits at the top of the sheet");
    passed.push("words sheet: the real page shows live at its top, centred on the words, as they are typed");

    // 2. Font, size, colour, alignment: seen at once in the live page.
    const l0 = await look();
    await page.locator("#choose-dialog .sw-more summary").tap().catch(() => {});
    await page.locator('#choose-dialog [data-action="sw-font"][data-font="song"]').first().tap();
    await page.waitForFunction((f) => { const el = [...document.querySelectorAll("#choose-dialog .sw-preview *")].find((e) => e.children.length === 0 && /周六的咖啡/.test(e.textContent)); return el && getComputedStyle(el.closest("[data-layer]") || el).fontFamily !== f; }, l0.font, { timeout: 5000 });
    const l1 = await look();
    await page.locator('#choose-dialog [data-action="sw-size"][data-dir="1"]').first().tap();
    await page.waitForFunction((s) => { const el = [...document.querySelectorAll("#choose-dialog .sw-preview *")].find((e) => e.children.length === 0 && /周六的咖啡/.test(e.textContent)); return el && parseFloat(getComputedStyle(el.closest("[data-layer]") || el).fontSize) > s; }, l1.size, { timeout: 5000 });
    await page.locator('#choose-dialog [data-action="sw-color"]').nth(3).tap();
    await page.waitForFunction((c) => { const el = [...document.querySelectorAll("#choose-dialog .sw-preview *")].find((e) => e.children.length === 0 && /周六的咖啡/.test(e.textContent)); return el && getComputedStyle(el.closest("[data-layer]") || el).color !== c; }, l1.color, { timeout: 5000 });
    assert.ok((await look()).font !== l0.font);
    passed.push("宋体 / A+ / a colour: each shows at once in the live page (no closing the sheet)");

    // 3. 保存 → the reader opens on the page this story made, not the day's first page.
    await page.locator('#choose-dialog [data-action="story-text-done"]').tap();
    await page.waitForSelector("#choose-dialog:not([open])", { state: "attached" });
    const made = await page.evaluate(() => JSON.parse(localStorage.getItem("little-days.v1")));
    await page.locator('[data-action="story-save"]').tap();
    await page.waitForSelector(".reader");
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("little-days.v1")));
    const day = saved.entries.find((e) => e.date === today && !e.isDemo);
    assert.ok(day.moments.length >= 2, "the older page and the new one");
    const older = day.moments.find((m) => m.title === "早上的一页");
    const fresh = day.moments.find((m) => m.title === "周六的咖啡，风很轻");
    assert.ok(older && fresh);
    const pos = await page.evaluate(() => JSON.parse(localStorage.getItem("little-days.reader-pos") || "{}"));
    const keys = Object.values(pos).map((p) => p.key);
    assert.ok(keys.includes(`${today}|${fresh.id}`), `the reader is on the new page (${keys})`);
    assert.ok(made, "");
    passed.push("保存 waits for the save, then opens the reader on the new page (not the day's first page)");

    // 4. Studio text: a new box starts empty with the caret (nothing selected);
    //    typing shows one short row; an empty new box goes away without an undo step.
    await page.goto(base);
    await page.waitForSelector(".hero");
    await page.locator('[data-action="today-write"]').first().tap();
    await page.waitForSelector('#journal-canvas [data-inline="title"]');
    await page.evaluate(() => document.activeElement?.blur?.());
    await require("./signed-in.cjs").studioDeselect(page).catch(() => {});
    const boxes = () => page.locator("#journal-canvas .text-layer").count();
    const n0 = await boxes();
    const undoBefore = await page.locator('[data-action="undo"]').isDisabled();
    await page.locator('.tool-dock [data-action="add-text-layer"]').tap();
    await page.waitForFunction(() => document.activeElement?.classList.contains("layer-text"));
    const sel = await page.evaluate(() => ({ text: document.activeElement.textContent, selected: String(getSelection()), hint: document.activeElement.dataset.placeholder }));
    assert.equal(sel.text, "", "a new box starts empty");
    assert.equal(sel.selected, "", "nothing selected (no Cut / Copy / Paste over it)");
    assert.equal(sel.hint, "写点什么…");
    await page.waitForSelector('#type-bar:not([hidden])[data-mode="box"] .type-done');
    assert.equal(await page.locator("#type-bar .type-fonts").isVisible(), false, "no font row over the keyboard");
    assert.equal(await page.locator("#type-bar .type-style-open").isVisible(), true);
    await page.locator("#type-bar .type-done").tap();
    await page.waitForFunction((n) => document.querySelectorAll("#journal-canvas .text-layer").length === n, n0);
    assert.equal(await page.locator('[data-action="undo"]').isDisabled(), undoBefore, "no extra undo step");
    // A box with words stays, and 完成 keeps them.
    await page.locator('.tool-dock [data-action="add-text-layer"]').tap();
    await page.waitForFunction(() => document.activeElement?.classList.contains("layer-text"));
    await page.keyboard.type("今天的风");
    await page.locator("#type-bar .type-done").tap();
    await page.waitForFunction(() => !document.activeElement?.classList.contains("layer-text"));
    assert.equal(await boxes(), n0 + 1);
    assert.equal(await page.locator("#journal-canvas .text-layer .layer-text").last().innerText(), "今天的风");
    passed.push("Studio: a new box starts empty with the caret; typing shows 样式 · B I U S · 完成; an empty new box goes away (no undo step); words stay");

    assert.deepEqual(errors, []);
    console.log(`V10.51 passed (${passed.length} groups):\n - ${passed.join("\n - ")}\nNo page errors.`);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
