// V6.7 E2E — swap photos by dragging one onto the other, replace a photo
// (the frame keeps its place and takes the new photo's own shape), and the
// stronger Editorial style (kicker, headline, folio, masthead).
const { chromium, devices } = require("playwright");
require("./signed-in.cjs")(chromium);
const { studioTool, studioDetails, studioMode, studioPreview, studioEdit, studioClose, studioMore, studioMoreAction, momentField } = require("./signed-in.cjs");
const { skipPhotoEditor } = require("./signed-in.cjs");
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
    const photo = (id, time) => ({ name: `${id}.jpg`, mimeType: "image/jpeg", buffer: withExifTime(fs.readFileSync(path.join(lib, `LD-photo-${id}.jpg`)), `${day} ${time}:00`) });
    const page0 = async () => (await page.evaluate((t) => JSON.parse(localStorage.getItem("little-days.v1")).drafts[t], today)).moments.find((x) => x.time === "08:10");

    // 1. Editorial (default) pages: a kicker, a headline, a folio; the spread has a masthead.
    const chooser = page.waitForEvent("filechooser");
    await page.locator('[data-action="today-photos"]').first().tap();
    await (await chooser).setFiles([photo("beach-sunset", "08:10"), photo("latte-art", "08:20"), photo("home-dinner", "19:05")]);
    await page.waitForSelector(".story-canvas .scrapbook-page.style-editorial");
    // V10.44 (S4-A): the day spread is optional now — this suite adds it, as a person would.
    await page.locator('[data-action="story-cover-add"]').tap();
    await page.waitForTimeout(300);
    assert.match(await page.locator(".story-canvas").innerText(), /CAPIDAY[\s\S]*NO\. \d\d/, "the spread's masthead");
    await page.locator('.story-tabs [data-action="story-page"]').nth(1).tap();
    const text = await page.locator(".story-canvas").innerText();
    assert.match(text, /— 08:10 · MORNING/, "a magazine kicker");
    assert.match(text, /CAPIDAY · NO\. \d\d/, "a folio");
    if (shots) await page.screenshot({ path: `${shots}/v64-editorial.png` });
    passed.push("Editorial: masthead on the spread, kicker and folio on each page");

    // 2. Customize: drag the first photo onto the second — they change places.
    await page.locator('[data-action="story-adjust"]').tap();
    await page.waitForSelector("#journal-canvas .photo-layer");
    let m = await page0();
    const photos = m.layers.filter((l) => l.kind === "photo" && !l.gen);
    assert.equal(photos.length, 2);
    const [a, b] = photos;
    const boxA = await page.locator(`#journal-canvas [data-layer="${a.id}"]`).boundingBox();
    const boxB = await page.locator(`#journal-canvas [data-layer="${b.id}"]`).boundingBox();
    await page.mouse.move(boxA.x + boxA.width / 2, boxA.y + boxA.height / 2);
    await page.mouse.down();
    await page.mouse.move(boxB.x + boxB.width / 2, boxB.y + boxB.height / 2, { steps: 10 });
    assert.equal(await page.locator(`#journal-canvas [data-layer="${b.id}"].swap-target`).count(), 1, "the photo under the finger is marked");
    await page.mouse.up();
    await page.waitForFunction(() => /换了位置/.test(document.querySelector("#toast").textContent));
    await page.waitForTimeout(1300); // the draft is saved a moment later
    m = await page0();
    const a2 = m.layers.find((l) => l.id === a.id),
      b2 = m.layers.find((l) => l.id === b.id);
    assert.deepEqual([a2.x, a2.y], [b.x, b.y], "the dragged photo takes the other's spot");
    assert.deepEqual([b2.x, b2.y], [a.x, a.y], "and the other takes its spot");
    for (const l of [a2, b2]) assert.ok(Math.abs(((l.w / l.h) * 0.8) / l.aspect - 1) < 0.03, "each in its own shape (nothing cropped)");
    assert.ok(a2.w <= b.w + 0.01 && a2.h <= b.h + 0.01, "fitted into the other's frame");
    assert.equal(m.layoutEdited, true);
    passed.push("drag a photo onto another: they change places, each fitted in its own shape");

    // 3. Replace a photo: same place, the new photo's shape, no crop.
    await page.locator(`#journal-canvas [data-layer="${a.id}"]`).click();
    await page.waitForSelector('.tool-dock.ctx [data-action="replace-photo"]');
    const before = (await page0()).layers.find((l) => l.id === a.id);
    const pick = page.waitForEvent("filechooser");
    await page.locator('.tool-dock.ctx [data-action="replace-photo"]').click();
    // V10.43 (S3): 替换 first offers the photos already here; this step uses 从相册添加.
    await page.locator('#choose-dialog [data-action="ps-album"]').click();
    await (await pick).setFiles({ name: "portrait.jpg", mimeType: "image/jpeg", buffer: fs.readFileSync(path.join(lib, "LD-photo-latte-beans.jpg")) });
    await skipPhotoEditor(page);
    await page.waitForFunction(([t, id, ref]) => JSON.parse(localStorage.getItem("little-days.v1")).drafts[t].moments.find((x) => x.time === "08:10").layers.find((l) => l.id === id).mediaRef !== ref, [today, a.id, before.mediaRef]);
    await page.waitForTimeout(800);
    const replaced = (await page0()).layers.find((l) => l.id === a.id);
    assert.ok(replaced.aspect < 0.9, "the new portrait photo's shape");
    assert.deepEqual([replaced.x, replaced.y], [before.x, before.y], "in the same place");
    assert.ok(replaced.w <= before.w + 0.01 && replaced.h <= before.h + 0.01, "within the old frame");
    assert.ok(Math.abs(((replaced.w / replaced.h) * 0.8) / replaced.aspect - 1) < 0.03, "not cropped");
    if (shots) await page.screenshot({ path: `${shots}/v64-studio.png` });
    passed.push("replace a photo from the toolbar: same place, its own shape, not cropped");

    assert.deepEqual(errors, []);
    console.log(`V6.7 E2E passed (${passed.length} groups):\n - ${passed.join("\n - ")}\nNo page errors.`);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
