// V6.7 E2E — cancelling the photo picker leaves me where I was (Home, or the
// record sheet), the 图库 grid inside the record sheet, and Home's today card
// swiping through today's pages with dots.
const { chromium, devices } = require("playwright");
require("./signed-in.cjs")(chromium);
const assert = require("node:assert/strict");
const base = process.env.PREVIEW_URL || "http://127.0.0.1:8080";
const shots = process.env.SHOTS_DIR || "";

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || undefined });
  const passed = [];
  try {
    const context = await browser.newContext({ ...devices["iPhone 13"] });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(base);
    await page.waitForSelector(".hero");
    const today = await page.evaluate(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; });
    const moments = () => page.evaluate((t) => { const s = JSON.parse(localStorage.getItem("little-days.v1")); if (!s) return 0; return (s.drafts[t] || s.entries.find((e) => e.date === t) || {}).moments?.length || 0; }, today);
    const cancelPicker = () => page.evaluate(() => document.querySelector("#attachment-image-input").dispatchEvent(new Event("cancel")));
    const before = await moments();

    // 1. Home → 选今天的照片 → Cancel: still on Home, no empty page.
    let chooser = page.waitForEvent("filechooser");
    await page.locator('[data-action="today-photos"]').tap();
    await chooser;
    await cancelPicker();
    await page.waitForTimeout(300);
    assert.equal(await page.locator(".hero .today-prompt").count(), 1, "still on Home");
    assert.equal(await page.locator("#journal-canvas").count(), 0, "not in the studio");
    assert.equal(await page.locator("#choose-dialog[open]").count(), 0);
    assert.equal(await moments(), before, "no empty page left behind");
    passed.push("Home: pick photos → Cancel stays on Home, nothing added");

    // 2. The record sheet → 我的相册 → Cancel: the sheet comes back.
    await page.locator('.story-start-row [data-action="quick-open"]').tap();
    await page.waitForSelector("#choose-dialog[open] .quick-sheet");
    await page.locator('[data-action="quick-way"][data-way="photo"]').tap();
    await page.locator('[data-action="quick-photo"][data-photo="mine"]').tap();
    chooser = page.waitForEvent("filechooser");
    await page.locator('[data-action="quick-start"]').tap();
    await chooser;
    await page.waitForSelector("#choose-dialog:not([open])", { state: "attached" });
    await cancelPicker();
    await page.waitForSelector("#choose-dialog[open] .quick-sheet");
    assert.equal(await page.locator('[data-action="quick-photo"][data-photo="mine"][aria-pressed="true"]').count(), 1, "same choices");
    assert.equal(await moments(), before);
    passed.push("record sheet: 我的相册 → Cancel brings the sheet back with the same choices");

    // 3. 图库: the library grid is in the sheet; a tapped photo becomes the page.
    await page.locator('[data-action="quick-photo"][data-photo="pick"]').tap();
    await page.waitForSelector(".quick-library button");
    assert.ok((await page.locator(".quick-library button").count()) > 4);
    await page.locator('[data-action="quick-start"]').tap();
    assert.match(await page.locator("#toast").innerText(), /\S/, "asks to choose one first");
    const second = page.locator(".quick-library button").nth(1);
    const photoId = await second.getAttribute("data-photo-id");
    await second.tap();
    await page.waitForSelector('.quick-library button[aria-pressed="true"]');
    if (shots) await page.screenshot({ path: `${shots}/v66-library.png` });
    await page.locator('[data-action="quick-start"]').tap();
    await page.waitForSelector('#journal-canvas [data-inline="title"]');
    await page.keyboard.type("图库里的一张");
    await page.waitForTimeout(1300);
    const m = await page.evaluate((t) => JSON.parse(localStorage.getItem("little-days.v1")).drafts[t].moments.at(-1), today);
    assert.equal(m.backdrop, `photo:${photoId}`);
    passed.push("图库: choose in the sheet's grid, then write its line on that photo");

    // 4. Home's today card: one slide per photo kept today (a page with three
    // photos is three slides; copies on the day spread are not repeated), and
    // the pages that are only words; a dot for each; swipe to move.
    await page.locator('[data-action="save-entry"]').tap();
    await require("./signed-in.cjs").homeAfterSave(page);
    await page.evaluate((d) => {
      const s = JSON.parse(localStorage.getItem("little-days.v1"));
      const e = s.entries.find((x) => x.date === d);
      const photo = (id, ref, extra = {}) => ({ id, kind: "photo", text: "", mediaRef: ref, x: 50, y: 50, w: 40, h: 30, rotation: 0, scale: 1, ...extra });
      e.layers = [...(e.layers || []), photo("spread-copy", "photo:latte-beans", { gen: true })];
      e.moments.push({ id: "three-photos", time: "17:09", title: "下午的咖啡", body: "", tags: [], layers: [photo("a", "photo:latte-beans"), photo("b", "photo:corner-cafe"), photo("c", "photo:desk-corner")], media: [], layoutTemplate: "scrapbook" });
      e.moments.push({ id: "only-words", title: "晚上", body: "早点睡。", tags: [], layers: [], media: [], layoutTemplate: "text" });
      localStorage.setItem("little-days.v1", JSON.stringify(s));
    }, today);
    await page.reload();
    await page.waitForSelector(".hero");
    const strip = page.locator(".today-peek");
    await strip.waitFor();
    const slides = await page.locator(".today-peek .peek-slide").count();
    // 图库 page (1 photo) + three photos + words only = 5.
    assert.equal(slides, 5, "one slide per photo, plus the words-only page");
    assert.equal(await page.locator(".peek-dots i").count(), slides, "one dot per slide");
    const text = await page.locator(".today-peek").innerText();
    assert.match(text, /图库里的一张[\s\S]*下午的咖啡[\s\S]*早点睡/, "photos with their page's line, then the words");
    assert.equal((text.match(/下午的咖啡/g) || []).length, 3, "each of the three photos");
    await strip.evaluate((el) => el.scrollTo({ left: el.children[2].offsetLeft, behavior: "instant" }));
    await page.waitForFunction(() => document.querySelectorAll(".peek-dots i")[2]?.classList.contains("on"));
    if (shots) await page.screenshot({ path: `${shots}/v66-peek.png` });
    await page.locator(".today-peek .peek-slide").nth(2).click();
    await page.waitForSelector(".day-detail");
    await page.locator('#navigation [data-page="home"]').click();
    passed.push("Home: today's card has a slide for every photo kept today and for words-only pages, with dots; tap opens the day");

    // 5. The type bar: a font chosen for the words leaves the title alone (and back).
    await page.locator('[data-action="today-write"]').tap();
    await page.waitForSelector('#journal-canvas [data-inline="title"]');
    await page.keyboard.type("Hello");
    const family = (k) => page.locator(`#journal-canvas [data-inline="${k}"]`).evaluate((el) => el.style.fontFamily);
    const titleBefore = await family("title");
    await page.locator('#journal-canvas [data-inline="body"]').click();
    await page.keyboard.type("Today I finished the task");
    await page.waitForSelector("#type-bar:not([hidden])");
    await page.locator('[data-type-font="kai"]').click();
    assert.match(await family("body"), /Kai/i, "the words take the font");
    assert.equal(await family("title"), titleBefore, "the title keeps its font");
    await page.locator('#journal-canvas [data-inline="title"]').click();
    await page.locator('[data-type-font="song"]').click();
    assert.match(await family("body"), /Kai/i, "the words keep theirs");
    await page.waitForTimeout(1300);
    const note = await page.evaluate((t) => JSON.parse(localStorage.getItem("little-days.v1")).drafts[t].moments.at(-1), today);
    assert.equal(note.font, "song");
    assert.equal(note.bodyFont, "kai");
    passed.push("type bar: the font changes only the title or only the words being edited, like size and colour");

    assert.deepEqual(errors, []);
    console.log(`V6.7c E2E passed (${passed.length} groups):\n - ${passed.join("\n - ")}\nNo page errors.`);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
