// V5.2 E2E: a new install opens straight onto Home with the paused modules
// in Labs; Quick Create v2 (my photos, several, laid out in their own shapes,
// shuffle / a line / share / edit / done); the shape-aware layout in the
// layout tool; the Story-size share picture; the local test log.
const { chromium, devices } = require("playwright");
require("./signed-in.cjs")(chromium);
const { menu, skipPhotoEditor } = require("./signed-in.cjs");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const base = process.env.PREVIEW_URL || "http://127.0.0.1:8080";
const shots = process.env.SHOTS_DIR || "";
// Public sample photos from the library (Unsplash License): two landscape, two portrait.
const lib = path.join(__dirname, "../Packages/LittleDaysCore/Sources/LittleDaysCore/Resources/Photos");
const pics = ["coffee-cheers", "latte-art", "corner-cafe", "latte-beans"].map((id) => ({ name: `${id}.jpg`, mimeType: "image/jpeg", buffer: fs.readFileSync(path.join(lib, `LD-photo-${id}.jpg`)) }));

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || undefined });
  const passed = [];
  try {
    // 1. A brand-new install (no account, Labs never chosen): straight to Home.
    const fresh = await browser.newContext({ ...devices["iPhone 13"] });
    await fresh.addInitScript(() => {
      if (!sessionStorage.getItem("v52-reset")) {
        sessionStorage.setItem("v52-reset", "1");
        localStorage.removeItem("little-days.account");
        localStorage.removeItem("little-days.labs");
      }
    });
    const first = await fresh.newPage();
    await first.goto(base);
    await first.waitForSelector(".hero");
    assert.equal(await first.locator("section.login, #tour:not([hidden])").count(), 0, "no sign-in page or tour");
    assert.deepEqual(await first.$$eval("#navigation [data-page]", (els) => els.map((el) => el.dataset.page)), ["home", "calendar", "studio", "growth", "books"]);
    assert.equal(await first.locator(".bell").count(), 0, "no notification bell");
    // What's new: a card on Home after an update; the full list opens from it.
    await first.locator(".whats-new-open").tap();
    await first.waitForSelector("#choose-dialog[open] .news-sheet");
    const latest = await first.locator(".news-entry .news-version").first().innerText();
    assert.match(latest, /^V\d+\.\d+$/);
    await first.locator('#choose-dialog [data-action="choose-close"]').tap();
    await first.waitForFunction(() => !document.querySelector(".whats-new"));
    assert.equal(await first.evaluate(() => localStorage.getItem("little-days.seen-version")), latest.slice(1), "seen on this device");
    assert.equal(await first.locator(".home-book-tabs").count(), 0, "no shared-books tabs");
    await first.locator('#navigation [data-page="books"]').tap();
    assert.equal(await first.locator(".me-chip, .shelf-switch").count(), 0, "no profile / shared books on the shelf");
    // Labs can be switched on (and off) in Settings.
    await first.locator('#navigation [data-page="home"]').tap();
    await first.locator('[data-action="nav"][data-page="settings"]').tap();
    assert.equal(await first.locator(".theme-picker, [data-action='theme']").count(), 0, "colour themes are in Labs");
    assert.equal(await first.locator('.news-card [data-action="whats-new"]').count(), 1, "update history in Settings");
    await first.locator('[data-action="labs-toggle"]').tap();
    await first.waitForSelector('[data-action="labs-toggle"][aria-pressed="true"]');
    assert.equal(await first.locator('#navigation [data-page="community"]').count(), 1);
    await first.locator('[data-action="labs-toggle"]').tap();
    await first.waitForFunction(() => !document.querySelector('#navigation [data-page="community"]'));
    await fresh.close();
    passed.push("new install: straight to Home with a what's-new card; community, profile, shared books, themes and sign-in wait in Labs");

    // 2. Quick Create v2 with my own photos (several).
    const context = await browser.newContext({ ...devices["iPhone 13"] });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(base);
    await page.waitForSelector(".hero");
    await page.evaluate(() => localStorage.removeItem("little-days.events"));
    const today = await page.evaluate(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; });
    const story = () => page.evaluate((d) => JSON.parse(localStorage.getItem("little-days.v1") || "null")?.drafts?.[d]?.moments?.at(-1) || JSON.parse(localStorage.getItem("little-days.v1")).entries.find((e) => e.date === d)?.moments?.at(-1), today);
    await menu(page, "studio");
    await page.locator('[data-action="quick-way"][data-way="photo"]').tap();
    assert.deepEqual(await page.$$eval('#choose-dialog [data-action="quick-photo"]', (els) => els.map((el) => el.dataset.photo)), ["mine", "today", "pick"]);
    assert.equal(await page.locator('#choose-dialog [data-action="quick-photo"][aria-pressed="true"]').getAttribute("data-photo"), "mine", "my own photos first");
    assert.match(await page.locator('[data-action="quick-start"]').innerText(), /选照片/);
    const chooser = page.waitForEvent("filechooser");
    await page.locator('[data-action="quick-start"]').tap();
    const picker = await chooser;
    assert.equal(picker.isMultiple(), true, "several photos at once");
    await picker.setFiles(pics);
    await page.waitForSelector(".quick-result-bar");
    assert.equal(await page.locator("#photo-editor[open]").count(), 0, "no photo editor in the quick path");
    assert.deepEqual(await page.$$eval(".quick-result-bar [data-action]", (els) => els.map((el) => el.dataset.action)), ["smart-shuffle", "smart-caption", "music-sheet", "share-story", "quick-edit"]);
    assert.equal(await page.locator(".tool-dock-wrap, .chapter-chips, .page-mode").count(), 0, "only the five choices (music since V6.0)");
    await page.waitForTimeout(1300);
    let s = await story();
    assert.equal(s.layoutTemplate, "smart");
    const photos = s.layers.filter((l) => l.kind === "photo");
    assert.equal(photos.length, 4);
    assert.ok(photos.every((l) => l.aspect > 0), "each photo remembers its shape");
    assert.ok(photos[0].aspect > 1.2 && photos[1].aspect < 0.9, "landscape and portrait");
    // Each frame has the photo's own shape (page is 4:5): nothing cropped.
    for (const l of photos) assert.ok(Math.abs(((l.w / l.h) * 0.8) / l.aspect - 1) < 0.03, `frame fits photo ${l.aspect}`);
    if (shots) await page.screenshot({ path: `${shots}/v52-result.png` });
    passed.push("Quick Create v2: several of my photos → laid out in their own shapes, no editor in the way");

    // 3. Shuffle through three looks; add the line on the paper; done.
    const look = async () => JSON.stringify((await story()).layers.map((l) => [l.x, l.y, l.w, l.frame]));
    const before = await look();
    await page.locator('[data-action="smart-shuffle"]').tap();
    await page.waitForTimeout(1300);
    assert.equal((await story()).layoutVariant, 1);
    assert.notEqual(await look(), before);
    assert.match(await page.locator('[data-action="smart-shuffle"]').innerText(), /2 \/ 3/);
    await page.locator('[data-action="smart-caption"]').tap();
    assert.equal(await page.evaluate(() => document.activeElement?.dataset.inline), "title");
    await page.keyboard.type("和朋友喝咖啡的下午");
    await page.evaluate(() => document.activeElement.blur());
    // Share: a Story-size picture (no share sheet in this browser → saved).
    const download = page.waitForEvent("download");
    await page.locator('[data-action="share-story"]').tap();
    const file = await download;
    assert.match(file.suggestedFilename(), /story\.png$/);
    const size = await page.evaluate(async (url) => {
      const img = new Image();
      img.src = url;
      await img.decode();
      return [img.naturalWidth, img.naturalHeight];
    }, `data:image/png;base64,${fs.readFileSync(await file.path()).toString("base64")}`);
    assert.deepEqual(size, [1080, 1920]);
    await page.locator('[data-action="quick-done"]').tap();
    await page.waitForSelector(".hero");
    const saved = await page.evaluate((d) => JSON.parse(localStorage.getItem("little-days.v1")).entries.find((e) => e.date === d).moments.at(-1), today);
    assert.equal(saved.title, "和朋友喝咖啡的下午");
    assert.equal(saved.layoutTemplate, "smart");
    passed.push("shuffle (three looks), a line typed on the page, Story-size share picture (1080×1920), done saves the day");

    // 4. The test log: what happened and how long, no content.
    const events = await page.evaluate(() => JSON.parse(localStorage.getItem("little-days.events")));
    const names = events.map((e) => e.e);
    for (const name of ["quick_open", "quick_start", "quick_placed", "layout_shuffle", "export", "page_done"]) assert.ok(names.includes(name), name);
    const done = events.find((e) => e.e === "page_done");
    assert.ok(done.ms > 0 && done.taps >= 4 && done.photos === 4 && done.shuffles === 1 && done.line === true, JSON.stringify(done));
    assert.doesNotMatch(JSON.stringify(events), /咖啡|coffee|media:/);
    await page.locator('[data-action="nav"][data-page="settings"]').tap();
    const logFile = page.waitForEvent("download");
    await page.locator('[data-action="export-events"]').tap();
    const log = JSON.parse(fs.readFileSync(await (await logFile).path(), "utf8"));
    assert.equal(log.summary.quickPages, 1);
    passed.push("local test log: steps, time and taps of the quick page, no words or photos; exportable from Settings");

    // 5. The shape-aware layout is also a choice in the layout tool.
    await page.locator(".settings-nav .back-button, [data-action='settings-back']").first().tap();
    await menu(page, "studio");
    await page.locator('[data-action="quick-more"][data-more="layout"]').tap();
    const add = page.waitForEvent("filechooser");
    await page.locator('#journal-canvas [data-action="add-photos"]').tap();
    await page.locator('#choose-dialog [data-action="choose-album"]').tap();
    await (await add).setFiles(pics.slice(0, 3));
    await skipPhotoEditor(page);
    await page.waitForFunction(() => document.querySelectorAll("#journal-canvas .photo-layer img").length === 3);
    const dock = page.locator('.dock-btn[data-tool="layout"]');
    if ((await dock.getAttribute("aria-expanded")) !== "true") await dock.tap();
    await page.locator('[data-action="apply-smart"]').tap();
    await page.waitForTimeout(1300);
    s = await story();
    assert.equal(s.layoutTemplate, "smart");
    assert.ok(s.layers.filter((l) => l.kind === "photo").every((l) => Math.abs(((l.w / l.h) * 0.8) / l.aspect - 1) < 0.03));
    passed.push("layout tool: 按照片形状自动排 on any page");

    assert.deepEqual(errors, []);
    console.log(`V5.2 E2E passed (${passed.length} groups):\n - ${passed.join("\n - ")}\nNo page errors.`);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
