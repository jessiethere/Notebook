// V10.58 · The grouping preview: pick photos → preview the pages → 生成.
//  1. Photos with only file dates start on ONE page (no 90-minute split), in
//     picking order, with an honest hint; nothing is a page yet.
//  2. ＋ between two photos starts a new page; a long-press drag moves a
//     photo (here: to the first place of page 1); 合并到上一页 joins pages.
//  3. 生成 makes the pages; each photo keeps its time, where that time came
//     from (file) and its order — saved, and not regrouped later.
//  4. Photos with real capture times (EXIF DateTimeOriginal) are suggested
//     as pages at gaps > 90 minutes ("仅供参考"); 全部放在一页 / 智能建议.
//  5. Back before 生成 leaves without making any page.
// zh at 390 (iPhone 13). Public sample photos (+ synthetic EXIF times).
const { chromium, devices } = require("playwright");
require("./signed-in.cjs")(chromium);
const { menu } = require("./signed-in.cjs");
const { withExifTime } = require("./exif-fixture.cjs");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const base = process.env.PREVIEW_URL || "http://127.0.0.1:8080";
const lib = path.join(__dirname, "../Packages/LittleDaysCore/Sources/LittleDaysCore/Resources/Photos");
const pic = (id) => path.join(lib, `LD-photo-${id}.jpg`);

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || undefined });
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "v155-"));
  const passed = [];
  try {
    const context = await browser.newContext({ ...devices["iPhone 13"] });
    await context.addInitScript(() => localStorage.setItem("test.keepGroups", "1"));
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("dialog", (d) => errors.push(`native dialog: ${d.message()}`));
    await page.goto(base);
    await page.waitForSelector(".hero");
    const pick = async (files) => {
      await menu(page, "studio");
      await page.locator('[data-action="quick-way"][data-way="photo"]').tap();
      await page.locator('[data-action="quick-book"]').first().tap();
      const chooser = page.waitForEvent("filechooser");
      await page.locator('[data-action="quick-start"]').tap();
      await (await chooser).setFiles(files);
      await page.waitForSelector('.story-group-step[data-first="1"]');
    };
    const pages = () => page.$$eval(".story-group-step .story-group", (els) => els.map((g) => [...g.querySelectorAll(".story-thumb")].map((t) => t.getAttribute("aria-label"))));
    const storedMoments = () => page.evaluate(() => {
      const s = JSON.parse(localStorage.getItem("little-days.v1") || '{"entries":[],"drafts":{}}');
      return [...(s.entries || []), ...Object.values(s.drafts || {})].flatMap((e) => e.moments || []);
    });

    // 1. File dates only → one page, picking order, honest hint, nothing made.
    const before = (await storedMoments()).length;
    await pick([pic("beach-sunset"), pic("latte-art"), pic("coffee-cheers"), pic("happy-dog")]);
    assert.deepEqual(await pages(), [["LD-photo-beach-sunset.jpg", "LD-photo-latte-art.jpg", "LD-photo-coffee-cheers.jpg", "LD-photo-happy-dog.jpg"]], "one page, in picking order");
    assert.equal(await page.locator(".story-intro").getAttribute("data-reason"), "unreliable");
    assert.match(await page.locator(".story-intro").innerText(), /没有可靠的拍摄时间/);
    assert.equal(await page.locator('.story-modes [data-mode="smart"].selected').count(), 1);
    assert.match(await page.locator('.story-foot [data-action="story-regroup"]').innerText(), /生成 1 页/);
    assert.equal((await storedMoments()).length, before, "no page is made before 生成");
    passed.push("file dates only: one page in picking order, 'no reliable time' hint, nothing made yet");

    // 2. ＋ splits; long-press drag; merge.
    await page.locator('.story-cut[data-g="0"][data-i="2"]').tap();
    assert.deepEqual((await pages()).map((p) => p.length), [2, 2]);
    assert.match(await page.locator(".story-group").nth(1).locator("header").innerText(), /第 2 页[\s\S]*2 张/);
    assert.equal(await page.locator('.story-modes [data-mode="manual"].selected').count(), 1, "my own groups now");
    // Drag the last photo (happy-dog) before the first one.
    const from = await page.locator('.story-thumb[data-g="1"][data-i="1"]').boundingBox();
    const to = await page.locator('.story-thumb[data-g="0"][data-i="0"]').boundingBox();
    await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(450);
    await page.mouse.move(to.x + 10, to.y + to.height / 2, { steps: 8 });
    await page.mouse.up();
    await page.waitForFunction(() => document.querySelector('.story-thumb[data-g="0"][data-i="0"]')?.getAttribute("aria-label") === "LD-photo-happy-dog.jpg");
    assert.deepEqual(await pages(), [["LD-photo-happy-dog.jpg", "LD-photo-beach-sunset.jpg", "LD-photo-latte-art.jpg"], ["LD-photo-coffee-cheers.jpg"]]);
    await page.locator('.story-merge[data-g="1"]').tap();
    assert.deepEqual((await pages()).map((p) => p.length), [4]);
    await page.locator('.story-cut[data-g="0"][data-i="3"]').tap();
    assert.deepEqual(await pages(), [["LD-photo-happy-dog.jpg", "LD-photo-beach-sunset.jpg", "LD-photo-latte-art.jpg"], ["LD-photo-coffee-cheers.jpg"]]);
    passed.push("＋ starts a page; a long-press drag reorders across pages; 合并到上一页 joins them; every photo stays once");

    // 3. 生成: the pages exactly as arranged, with time source and order kept.
    await page.locator('.story-foot [data-action="story-regroup"]').tap();
    await page.waitForSelector(".qe-tools");
    await page.locator('[data-action="story-save"]').tap();
    await page.waitForSelector(".flip-page");
    const saved = await page.evaluate(() => {
      const s = JSON.parse(localStorage.getItem("little-days.v1"));
      const all = s.entries.flatMap((e) => e.moments || []).filter((m) => (m.layers || []).some((l) => l.captureTimeSource));
      return all.slice(-2).map((m) => m.layers.filter((l) => l.kind === "photo" && !l.gen).map((l) => ({ name: l.text, src: l.captureTimeSource, order: l.photoOrder, at: l.capturedAt || "" })));
    });
    assert.deepEqual(saved.map((p) => p.map((l) => l.name)), [["LD-photo-happy-dog.jpg", "LD-photo-beach-sunset.jpg", "LD-photo-latte-art.jpg"], ["LD-photo-coffee-cheers.jpg"]], "pages as arranged");
    assert.ok(saved.flat().every((l) => l.src === "file"), "the time is kept as a file date, not a capture time");
    assert.deepEqual(saved.map((p) => p.map((l) => l.order)), [[0, 1, 2], [0]]);
    assert.ok(saved.flat().every((l) => /^\d{4}-\d{2}-\d{2}T/.test(l.at)));
    const times = await page.evaluate(() => JSON.parse(localStorage.getItem("little-days.v1")).entries.flatMap((e) => e.moments || []).filter((m) => (m.layers || []).some((l) => l.captureTimeSource)).slice(-2).map((m) => m.time || ""));
    assert.deepEqual(times, ["", ""], "a file date does not become the page's time");
    passed.push("生成 makes the pages as arranged; photos keep captureTimeSource 'file', capturedAt and photoOrder; no fake page time");

    // 4. Real capture times: pages suggested at > 90 minutes, as a hint.
    const exif = [["a", "2026:11:09 08:10:00", "latte-art"], ["b", "2026:11:09 08:40:00", "brunch"], ["c", "2026:11:09 14:30:00", "waves"]].map(([n, when, id]) => {
      const file = path.join(tmp, `${n}-${id}.jpg`);
      fs.writeFileSync(file, withExifTime(fs.readFileSync(pic(id)), when));
      return file;
    });
    await page.locator('[data-action="reader-back"]').tap().catch(() => {});
    await pick(exif);
    assert.equal(await page.locator(".story-intro").getAttribute("data-reason"), "reliable");
    assert.match(await page.locator(".story-intro").innerText(), /仅供参考/);
    assert.deepEqual((await pages()).map((p) => p.length), [2, 1], "a new page after more than 90 minutes");
    await page.locator('.story-modes [data-mode="single"]').tap();
    assert.deepEqual((await pages()).map((p) => p.length), [3]);
    await page.locator('.story-modes [data-mode="smart"]').tap();
    assert.deepEqual((await pages()).map((p) => p.length), [2, 1]);
    passed.push("real capture times: two pages suggested ('仅供参考'); 全部放在一页 ↔ 智能建议");

    // 5. Back before 生成: nothing made.
    const n = (await storedMoments()).length;
    await page.locator('[data-action="story-back"]').tap();
    await page.waitForSelector(".hero");
    assert.equal((await storedMoments()).length, n, "leaving the preview makes no page");
    passed.push("back from the preview leaves without making a page");

    assert.deepEqual(errors, [], errors.join(" | "));
  } finally {
    await browser.close();
    fs.rmSync(tmp, { recursive: true, force: true });
  }
  console.log(`V10.58 grouping preview E2E passed (${passed.length} groups):\n - ${passed.join("\n - ")}`);
  console.log("No page errors.");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
