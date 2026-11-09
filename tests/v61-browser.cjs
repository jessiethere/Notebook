// V6.4 E2E — layout engine v2 (P0 ②): today's story uses one kit for the
// whole day (the book's colour by default), single photos open big, a few
// stickers only in empty corners; the preview's 配色 switches every page at
// once; long lines shrink; the timeline cover exports as a picture.
const { chromium, devices } = require("playwright");
require("./signed-in.cjs")(chromium);
const { withExifTime } = require("./exif-fixture.cjs");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const base = process.env.PREVIEW_URL || "http://127.0.0.1:8080";
const shots = process.env.SHOTS_DIR || "";
const lib = path.join(__dirname, "../Packages/LittleDaysCore/Sources/LittleDaysCore/Resources/Photos");

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || undefined });
  const passed = [];
  try {
    const context = await browser.newContext({ ...devices["iPhone 13"], acceptDownloads: true });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(base);
    await page.waitForSelector(".hero");
    const today = await page.evaluate(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; });
    const day = today.replace(/-/g, ":");
    const pics = [["strength", "08:40"], ["latte-art", "14:30"], ["coffee-cheers", "14:50"], ["home-dinner", "19:05"]].map(([id, time]) => ({ name: `${id}.jpg`, mimeType: "image/jpeg", buffer: withExifTime(fs.readFileSync(path.join(lib, `LD-photo-${id}.jpg`)), `${day} ${time}:00`) }));
    const draft = () => page.evaluate((d) => JSON.parse(localStorage.getItem("little-days.v1")).drafts[d], today);

    const chooser = page.waitForEvent("filechooser");
    await page.locator('[data-action="today-photos"]').tap();
    await (await chooser).setFiles(pics);
    await page.waitForSelector(".story-group");
    await page.locator('[data-action="story-step"][data-step="lines"]').tap();
    await page.locator('[data-story-line="1"]').fill("和小雨在新开的店里喝了一杯很好喝的拿铁，还买了一包豆子回家");
    await page.locator('.story-foot [data-action="story-make"]').tap();
    await page.waitForSelector(".story-canvas .timeline-cover");

    // 1. One kit for the day (the book's colour), first looks by rule, decorations.
    const d1 = await draft();
    const story = d1.moments.slice(-3);
    const kit = d1.kit;
    assert.ok(kit, "the day has a kit");
    assert.ok(story.every((m) => m.kit === kit && m.template === d1.template), "every page in the same kit");
    assert.equal(await page.locator(`.story-kits [data-kit="${kit}"][aria-pressed="true"]`).count(), 1);
    const single = story.find((m) => m.layers.filter((l) => l.kind === "photo").length === 1);
    assert.equal(single.layoutVariant, 2, "one photo opens big");
    const decos = story.concat([d1]).map((p) => p.layers.filter((l) => l.deco).length);
    assert.ok(decos.every((c) => c <= 2) && decos.some((c) => c > 0), `a few decorations (${decos})`);
    passed.push(`one kit for the whole day (${kit}); one photo opens big; ≤ 2 decorations per page`);

    // 2. 配色: switch every page at once; the cover follows.
    await page.locator('.story-kits [data-kit="sage"]').tap();
    await page.waitForFunction((d) => { const e = JSON.parse(localStorage.getItem("little-days.v1")).drafts[d]; return e.kit === "sage" && e.moments.slice(-3).every((m) => m.kit === "sage" && m.template === "grid"); }, today);
    const d2 = await draft();
    assert.equal(d2.layers.find((l) => l.kind === "text" && l.fontSize === 32).fontId, "vintage-serif", "the cover's date in the kit's font");
    assert.ok(d2.layers.filter((l) => l.deco).every((l) => ["leaf", "label", "pencil"].includes(l.assetId)), "the kit's own stickers");
    if (shots) {
      await page.waitForTimeout(500);
      await page.screenshot({ path: `${shots}/v61-sage.png` });
    }
    passed.push("配色 switches the whole day: papers, fonts, cover and stickers");

    // 3. A long line: smaller on its page, wraps instead of being cut.
    await page.locator(".story-tabs button").nth(2).tap();
    await page.waitForSelector(".story-canvas .line-title.fit-two");
    passed.push("a long line gets a smaller, two-line caption");

    // 4. Save; the timeline cover exports as a picture (text in its boxes).
    await page.locator('[data-action="story-save"]').tap();
    await page.waitForSelector(".flip-page:not(.is-cover) .timeline-cover");
    const size = await page.evaluate(async (d) => {
      const { renderJournalCanvas } = await import("./js/export.mjs");
      const entry = JSON.parse(localStorage.getItem("little-days.v1")).entries.find((e) => e.date === d);
      const canvas = await renderJournalCanvas(entry, { dayPage: true, catalog: await (await fetch("shared/library.json")).json() });
      return [canvas.width, canvas.height];
    }, today);
    assert.deepEqual(size, [1080, 1350]);
    passed.push("saved; the timeline cover renders as a 1080 × 1350 picture");

    assert.deepEqual(errors, []);
    console.log(`V6.4 E2E passed (${passed.length} groups):\n - ${passed.join("\n - ")}\nNo page errors.`);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
