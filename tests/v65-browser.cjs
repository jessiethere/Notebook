// V6.7 E2E — edit / delete a habit; colour themes without Labs; the simple
// 黑体 / 宋体 / 楷体 defaults; filling in a day you forgot (photos taken
// yesterday go to yesterday; a date picker in the preview; a Home link).
const { chromium, devices } = require("playwright");
require("./signed-in.cjs")(chromium);
const { menu } = require("./signed-in.cjs");
const { withExifTime } = require("./exif-fixture.cjs");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const base = process.env.PREVIEW_URL || "http://127.0.0.1:8080";
const lib = path.join(__dirname, "../Packages/LittleDaysCore/Sources/LittleDaysCore/Resources/Photos");

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || undefined });
  const passed = [];
  try {
    const context = await browser.newContext({ ...devices["iPhone 13"] });
    // A person without Labs.
    await context.addInitScript(() => localStorage.setItem("little-days.labs", "0"));
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(base);
    await page.waitForSelector(".hero");
    const key = (n) => page.evaluate((n) => { const d = new Date(); d.setDate(d.getDate() - n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }, n);
    const [today, yesterday, twoDays] = [await key(0), await key(1), await key(2)];
    const store = () => page.evaluate(() => JSON.parse(localStorage.getItem("little-days.v1")));
    const photo = (id, day, time) => ({ name: `${id}.jpg`, mimeType: "image/jpeg", buffer: withExifTime(fs.readFileSync(path.join(lib, `LD-photo-${id}.jpg`)), `${day.replace(/-/g, ":")} ${time}:00`) });

    // 1. Edit a habit, then delete it (asked first; its check-ins go too).
    await page.locator('.today-list [data-action="check"][data-habit="move"]').first().tap();
    await page.waitForFunction(() => JSON.parse(localStorage.getItem("little-days.v1")).checks.some((c) => c.habitId === "move"));
    await page.locator('.today-list [data-action="nav"][data-page="growth"]').tap();
    await page.locator('[data-action="edit-habit"][data-habit="move"]').tap();
    await page.waitForSelector("#form-dialog[open]");
    assert.notEqual(await page.locator('#form-dialog input[name="title"]').inputValue(), "", "the habit's name is filled in");
    await page.locator('#form-dialog input[name="title"]').fill("每天走 8000 步");
    await page.locator('#form-dialog input[name="target"]').fill("5");
    await page.locator('#form-dialog button[type="submit"]').tap();
    await page.waitForFunction(() => JSON.parse(localStorage.getItem("little-days.v1")).habits.find((h) => h.id === "move")?.title === "每天走 8000 步");
    let s = await store();
    assert.equal(s.habits.find((h) => h.id === "move").target, 5);
    assert.ok(s.checks.some((c) => c.habitId === "move"), "editing keeps the check-ins");
    await page.locator('[data-action="edit-habit"][data-habit="move"]').tap();
    await page.locator('[data-action="delete-habit"]').tap();
    await page.waitForSelector("#confirm-dialog[open]");
    assert.match(await page.locator("#confirm-message").innerText(), /每天走 8000 步[\s\S]*1 次打卡/);
    await page.locator("#confirm-cancel").tap();
    assert.ok((await store()).habits.some((h) => h.id === "move"), "Cancel keeps it");
    await page.locator('[data-action="edit-habit"][data-habit="move"]').tap();
    await page.locator('[data-action="delete-habit"]').tap();
    await page.locator("#confirm-ok").tap();
    await page.waitForFunction(() => !JSON.parse(localStorage.getItem("little-days.v1")).habits.some((h) => h.id === "move"));
    s = await store();
    assert.ok(!s.checks.some((c) => c.habitId === "move"));
    assert.equal(await page.locator('[data-action="edit-habit"][data-habit="move"]').count(), 0);
    passed.push("a habit: ⋯ → edit (name, goal; check-ins kept) → delete (asked first; its check-ins go)");

    // 2. Colour themes without Labs.
    await menu(page, "home");
    await page.locator('[data-action="nav"][data-page="settings"]').tap();
    assert.ok((await page.locator('[data-action="theme"]').count()) > 1, "themes in Settings without Labs");
    await page.locator('[data-action="theme"]').nth(1).tap();
    await page.waitForFunction(() => Boolean(document.documentElement.dataset.theme));
    assert.match(await page.locator(".settings-card").filter({ hasText: /许可证|Licen/ }).innerText(), /黑体、宋体、楷体/);
    passed.push("colour themes for everyone; the licence card explains the device fonts");

    // 3. 黑体 / 宋体 / 楷体 in the type bar.
    await menu(page, "studio");
    await page.locator('[data-action="quick-way"][data-way="write"]').tap();
    await page.locator('[data-action="quick-start"]').tap();
    await page.waitForSelector('#journal-canvas [data-inline="title"]');
    await page.locator('#journal-canvas [data-inline="title"]').click();
    await page.waitForSelector("#type-bar:not([hidden])");
    const fonts = await page.$$eval("[data-type-font]", (els) => els.map((el) => el.textContent));
    assert.deepEqual(fonts.slice(0, 3), ["黑体", "宋体", "楷体"]);
    const family = await page.locator('[data-type-font="kai"]').evaluate((el) => el.style.fontFamily);
    assert.match(family, /Kaiti SC|STKaiti|KaiTi/);
    await page.locator('[data-type-font="kai"]').tap();
    await page.evaluate(() => document.activeElement?.blur());
    await page.locator('[data-action="studio-back"]').tap();
    passed.push("黑体 / 宋体 / 楷体 first in the type bar (device fonts)");

    // 4. Photos taken yesterday → yesterday's story; the date can be changed.
    await menu(page, "home");
    const c1 = page.waitForEvent("filechooser");
    await page.locator('[data-action="today-photos"]').tap();
    await (await c1).setFiles([photo("latte-art", yesterday, "14:30"), photo("coffee-cheers", yesterday, "14:40")]);
    await page.waitForSelector(".story-canvas .scrapbook-page");
    assert.match(await page.locator("#toast").innerText(), /已经记到那一天/);
    assert.equal(await page.locator("[data-story-date]").inputValue(), yesterday);
    assert.doesNotMatch(await page.locator(".story-bar h1").innerText(), /今天的故事/);
    await page.locator("[data-story-date]").fill(twoDays);
    await page.locator("[data-story-date]").dispatchEvent("change");
    await page.waitForFunction((d) => document.querySelector("[data-story-date]")?.value === d, twoDays);
    await page.locator('[data-action="story-save"]').tap();
    await page.waitForSelector(".flip-page");
    s = await store();
    assert.ok(s.entries.find((e) => e.date === twoDays)?.moments.some((m) => m.layoutTemplate === "scrapbook"), "saved on the chosen day");
    assert.ok(!(s.entries.find((e) => e.date === yesterday)?.moments || []).some((m) => m.layoutTemplate === "scrapbook"), "and not left on yesterday");
    passed.push("photos taken yesterday go to yesterday (told); the preview's date picker moves the story; saved there");

    // 5. Home: "Forgot? Fill in yesterday" opens the sheet for yesterday.
    await menu(page, "home");
    await page.locator(".backfill-link").tap();
    await page.waitForSelector("#choose-dialog[open] .quick-sheet");
    assert.doesNotMatch(await page.locator(".quick-sheet h2").innerText(), /今天/);
    passed.push("Home: “Forgot? Fill in yesterday” opens the record sheet for yesterday");

    assert.deepEqual(errors, []);
    console.log(`V6.7b E2E passed (${passed.length} groups):\n - ${passed.join("\n - ")}\nNo page errors.`);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
