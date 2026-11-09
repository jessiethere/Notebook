// Dark theme readability (no low-contrast text) and the two habit buttons.
const { chromium, devices } = require("playwright");
require("./signed-in.cjs")(chromium);
const { menu } = require("./signed-in.cjs");
const assert = require("node:assert/strict");
const base = process.env.PREVIEW_URL || "http://127.0.0.1:8080";

const scan = (page) =>
  page.evaluate(() => {
    const lum = (c) => {
      const m = c.match(/[\d.]+/g);
      if (!m) return null;
      const [r, g, b] = m.slice(0, 3).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
      return { L: 0.2126 * r + 0.7152 * g + 0.0722 * b, a: m[3] == null ? 1 : +m[3] };
    };
    const bgOf = (el) => {
      for (let e = el; e; e = e.parentElement) {
        const s = getComputedStyle(e);
        if (s.backgroundImage !== "none" && !s.backgroundImage.includes("gradient")) return null;
        const c = lum(s.backgroundColor);
        if (c && c.a > 0.5) return c.L;
      }
      return 1;
    };
    const bad = [];
    for (const el of document.querySelectorAll("#app *, #navigation *, .tool-sheet *, #toast")) {
      if (el.closest(".journal-canvas, .book-cover, .spine, .work-cover, .day-cover-photos, .journey-page, .cover-option")) continue;
      if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height || +getComputedStyle(el).opacity === 0) continue;
      const fg = lum(getComputedStyle(el).color), bg = bgOf(el);
      if (fg == null || bg == null) continue;
      const ratio = (Math.max(fg.L, bg) + 0.05) / (Math.min(fg.L, bg) + 0.05);
      if (ratio < 3) bad.push(`${el.tagName.toLowerCase()}.${String(el.className).trim()} "${el.textContent.trim().slice(0, 16)}" ${ratio.toFixed(2)}`);
    }
    return bad;
  });

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || undefined });
  const passed = [];
  try {
    const context = await browser.newContext({ ...devices["iPhone 13"] });
    await context.addInitScript(() => localStorage.setItem("little-days.theme", "cool"));
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(base);
    await page.waitForSelector(".hero");
    const checks = () => page.evaluate(() => JSON.parse(localStorage.getItem("little-days.v1") || '{"checks":[]}').checks);

    // 1. Dark theme: every text readable on every main page.
    const pages = {};
    pages.home = await scan(page);
    for (const tab of ["calendar", "growth", "books", "community"]) {
      await menu(page, tab);
      await page.waitForTimeout(200);
      pages[tab] = await scan(page);
    }
    await menu(page, "home");
    await page.locator('[data-action="nav"][data-page="settings"]').tap();
    pages.settings = await scan(page);
    await page.locator(".settings-nav .back-button").tap();
    await menu(page, "studio");
    await page.locator('[data-action="start-continue"]').tap();
    await page.waitForSelector("#journal-canvas");
    pages.studio = await scan(page);
    await page.locator('[data-action="tool"][data-tool="layout"]').tap();
    pages.sheet = await scan(page);
    for (const [name, bad] of Object.entries(pages)) assert.deepEqual(bad, [], `${name}: low-contrast text`);
    const save = await page.locator('[data-action="save-entry"]').evaluate((el) => getComputedStyle(el).color);
    assert.ok(save.match(/\d+/g).slice(0, 3).every((v) => +v > 240), `button text stays white on the accent (${save})`);
    passed.push("dark theme: no low-contrast text on home, calendar, growth, books, community, settings, studio + sheet");

    // 2. Habits: ✎ and ✓ side by side; ✓ is one tap (duration habits too).
    await page.locator('[data-action="studio-back"]').tap();
    await menu(page, "home");
    const row = page.locator(".habit-row").filter({ has: page.locator('[data-habit="reading"]') }).first();
    assert.equal(await row.locator('[data-action="check-note"]').count(), 1, "✎ before checking in");
    assert.equal(await row.locator('[data-action="check"]').count(), 1);
    await row.locator('[data-action="check"]').tap();
    let c = (await checks()).find((x) => x.habitId === "reading");
    assert.ok(c && c.minutes > 0, "one tap records the usual minutes");
    assert.match(await page.locator("#toast").textContent(), /✎/);
    assert.equal(await page.locator("#form-dialog[open]").count(), 0, "no form on ✓");
    // ✎ adds a note to that check (no second check).
    await row.locator('[data-action="check-note"]').tap();
    await page.locator('#dialog-form [name="note"]').fill("读了两章");
    await page.locator('#dialog-form [type="submit"]').tap();
    c = (await checks()).filter((x) => x.habitId === "reading");
    assert.equal(c.length, 1);
    assert.equal(c[0].note, "读了两章");
    assert.equal(await page.locator('.habit-row [data-action="check-note"][data-habit="reading"].has-note').count() >= 1, true);
    // ✎ on a habit not done yet records it together with the note.
    await page.locator('.habit-row [data-action="check-note"][data-habit="move"]').first().tap();
    await page.locator('#dialog-form [name="note"]').fill("散步二十分钟");
    await page.locator('#dialog-form [type="submit"]').tap();
    assert.ok((await checks()).some((x) => x.habitId === "move" && x.note === "散步二十分钟"));
    passed.push("habits: ✓ one tap (with minutes), ✎ adds note/photo — before or after checking in");

    assert.deepEqual(errors, []);
    console.log(`V3.10 E2E passed (${passed.length} groups):\n - ${passed.join("\n - ")}\nNo page errors.`);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
