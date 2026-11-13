// V6.5 E2E — Quick Create V2 under stress: 10 photos (landscape + portrait)
// in 4 Moments with long Chinese / English words. In every style, every
// photo is on some page, every photo and every word stays inside its page
// (measured in the real browser), and every page exports as a picture.
const { chromium, devices } = require("playwright");
require("./signed-in.cjs")(chromium);
const { studioTool, studioDetails, studioMode, studioPreview, studioEdit, studioClose, studioMore, studioMoreAction, momentField } = require("./signed-in.cjs");
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
    const context = await browser.newContext({ ...devices["iPhone 13"] });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(base);
    await page.waitForSelector(".hero");
    const today = await page.evaluate(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; });
    const day = today.replace(/-/g, ":");
    const list = [["morning-yoga", "07:50"], ["running", "08:05"], ["strength", "08:30"], ["latte-art", "12:30"], ["brunch", "12:45"], ["pizza", "13:00"], ["forest-walk", "16:10"], ["golden-field", "16:30"], ["home-dinner", "19:20"], ["fresh-salad", "19:35"]];
    const pics = list.map(([id, time]) => ({ name: `${id}.jpg`, mimeType: "image/jpeg", buffer: withExifTime(fs.readFileSync(path.join(lib, `LD-photo-${id}.jpg`)), `${day} ${time}:00`) }));
    const words = ["Morning run 晨跑 5km，然后去健身房练腿，深蹲终于突破 60kg", "Brunch with friends 和朋友吃早午餐，聊了很多毕业以后的事情", "Golden hour walk 和妈妈在田边散步，看了一场很美的日落", "晚饭自己做了牛排和沙拉，配了一杯红酒 so good"];

    const chooser = page.waitForEvent("filechooser");
    await page.locator('[data-action="today-photos"]').first().tap();
    await (await chooser).setFiles(pics);
    await page.waitForSelector(".story-canvas .scrapbook-page");
    assert.equal(await page.locator(".story-tabs button").count(), 5, "a spread + 4 Moment pages");
    await require("./signed-in.cjs").storyLines(page, words);
    await page.waitForFunction(() => /Morning run/.test(document.querySelector(".story-canvas").innerText));
    const d = await page.evaluate((t) => JSON.parse(localStorage.getItem("little-days.v1")).drafts[t], today);
    const pages = d.moments.slice(-4);
    assert.equal(pages.reduce((n, m) => n + m.layers.filter((l) => l.kind === "photo" && !l.gen).length, 0), 10, "all 10 photos are on their pages");
    assert.equal(d.layers.filter((l) => l.kind === "photo" && l.gen).length, 4, "the spread shows one photo per Moment");
    passed.push("10 photos → 4 Moments; long CN/EN words written; every photo kept");

    // Every style: measure every photo and word on every page.
    const problems = [];
    for (const style of ["editorial", "cozy", "playful"]) {
      await require("./signed-in.cjs").storyStyle(page, style);
      await page.waitForSelector(`.story-canvas .scrapbook-page.style-${style}`);
      for (let i = 0; i < 5; i++) {
        await page.locator(".story-tabs button").nth(i).tap();
        await page.waitForTimeout(250);
        const found = await page.evaluate(() => {
          const canvas = document.querySelector(".story-canvas .journal-canvas").getBoundingClientRect();
          const out = [];
          const pad = 2;
          for (const el of document.querySelectorAll(".story-canvas .photo-layer, .story-canvas .text-layer")) {
            const r = el.getBoundingClientRect();
            // Rotated frames poke out a hair; anything more is a real overflow.
            if (r.left < canvas.left - pad || r.right > canvas.right + pad || r.top < canvas.top - pad || r.bottom > canvas.bottom + pad) out.push(`${el.className.split(" ").slice(0, 3).join(".")} ${Math.round(r.left - canvas.left)},${Math.round(r.top - canvas.top)} ${Math.round(r.width)}×${Math.round(r.height)} in ${Math.round(canvas.width)}×${Math.round(canvas.height)}`);
          }
          return out;
        });
        for (const f of found) problems.push(`${style} page ${i}: ${f}`);
        if (shots) await page.locator(".story-canvas .journal-canvas").screenshot({ path: `${shots}/v61-${style}-${i}.png` });
      }
    }
    assert.deepEqual(problems, [], problems.join("\n"));
    passed.push("Editorial / Cozy / Collage: on all 5 pages every photo and every word stays inside the page");

    // Every page exports (pictures / PDF use the same drawing).
    const sizes = await page.evaluate(async (t) => {
      const { renderJournalCanvas } = await import("./js/export.mjs");
      const catalog = await (await fetch("shared/library.json")).json();
      const entry = JSON.parse(localStorage.getItem("little-days.v1")).drafts[t];
      const out = [];
      out.push(await renderJournalCanvas(entry, { dayPage: true, catalog }));
      for (const m of entry.moments.slice(-4)) out.push(await renderJournalCanvas(m, { dayPage: false, catalog }));
      return out.map((c) => `${c.width}x${c.height}`);
    }, today);
    assert.deepEqual(sizes, Array(5).fill("1080x1350"));
    passed.push("the spread and every page export as 1080 × 1350 pictures");

    assert.deepEqual(errors, []);
    console.log(`V6.5 stress E2E passed (${passed.length} groups):\n - ${passed.join("\n - ")}\nNo page errors.`);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
