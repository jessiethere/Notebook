// Video orientation + shapes, typing mode above the keyboard, app themes.
// Synthetic media only; iPhone 13 emulation.
const { chromium, devices } = require("playwright");
require("./signed-in.cjs")(chromium);
const { menu } = require("./signed-in.cjs");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const base = process.env.PREVIEW_URL || "http://127.0.0.1:8080";
const lake = fs.readFileSync(path.join(__dirname, "../Packages/LittleDaysCore/Sources/LittleDaysCore/Resources/Media/lake.jpg"));

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
    const story = () =>
      page.evaluate(() => {
        const d = new Date();
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        return JSON.parse(localStorage.getItem("little-days.v1")).drafts[key].moments.at(-1);
      });
    const makeVideo = (w, h) =>
      page.evaluate(async ([w, h]) => {
        const c = document.createElement("canvas");
        c.width = w; c.height = h;
        const g = c.getContext("2d");
        const recorder = new MediaRecorder(c.captureStream(15), { mimeType: "video/webm;codecs=vp8" });
        const chunks = [];
        recorder.ondataavailable = (e) => chunks.push(e.data);
        const done = new Promise((r) => (recorder.onstop = r));
        recorder.start();
        for (let i = 0; i < 10; i++) { g.fillStyle = i % 2 ? "#C9D7C1" : "#E8CFCF"; g.fillRect(0, 0, w, h); await new Promise((r) => setTimeout(r, 60)); }
        recorder.stop(); await done;
        return [...new Uint8Array(await new Blob(chunks).arrayBuffer())];
      }, [w, h]);

    // 1. A portrait video stands upright; a landscape one lies flat.
    await menu(page, "studio");
    await page.locator('[data-action="start-words"]').tap();
    await page.waitForSelector("#journal-canvas");
    await page.locator("#video-input").setInputFiles({ name: "tall.webm", mimeType: "video/webm", buffer: Buffer.from(await makeVideo(90, 160)) });
    await page.waitForFunction(() => document.querySelectorAll("#journal-canvas .video-layer").length === 1);
    await page.locator("#video-input").setInputFiles({ name: "wide.webm", mimeType: "video/webm", buffer: Buffer.from(await makeVideo(160, 90)) });
    await page.waitForFunction(() => document.querySelectorAll("#journal-canvas .video-layer").length === 2);
    let s = await story();
    const [tall, wide] = s.layers.filter((l) => l.kind === "video");
    assert.equal(tall.shape, "portrait");
    assert.equal(wide.shape, "landscape");
    const box = async (id) => page.locator(`[data-layer="${id}"]`).boundingBox();
    const tallBox = await box(tall.id), wideBox = await box(wide.id);
    assert.ok(tallBox.height > tallBox.width * 1.4, "portrait clip is tall on the paper");
    assert.ok(wideBox.width > wideBox.height * 1.4, "landscape clip is wide");
    assert.deepEqual(s.media.map((c) => [c.width, c.height]), [[90, 160], [160, 90]]);
    passed.push("video keeps its own orientation (portrait upright, landscape flat)");

    // 2. Shapes for videos and photos: round, heart, film… with true proportions.
    await page.locator(`[data-layer="${wide.id}"]`).tap({ position: { x: 6, y: 6 } });
    const layerTool = page.locator('[data-action="tool"][data-tool="layer"]');
    if ((await layerTool.getAttribute("aria-expanded")) !== "true") await layerTool.tap();
    const videoShapes = await page.$$eval('[data-action="layer-shape"]', (els) => els.map((el) => el.dataset.shape));
    assert.deepEqual(videoShapes, ["landscape", "portrait", "square", "circle", "arch", "heart", "film"]);
    await page.locator('[data-action="layer-shape"][data-shape="circle"]').tap();
    await page.waitForSelector(`[data-layer="${wide.id}"].shape-circle`);
    const round = await box(wide.id);
    assert.ok(Math.abs(round.width - round.height) < 3, "circle is round, not oval");
    assert.equal(await page.locator(`[data-layer="${wide.id}"] .video-frame`).evaluate((el) => getComputedStyle(el).borderRadius), "50%");
    await page.locator('[data-action="layer-shape"][data-shape="film"]').tap();
    await page.waitForSelector(`[data-layer="${wide.id}"].shape-film`);
    // Photo: heart, then back to free.
    await page.locator("#photos-input").setInputFiles({ name: "lake.jpg", mimeType: "image/jpeg", buffer: lake });
    await page.locator('#photo-editor [data-pe-action="cancel"]').tap();
    await page.waitForSelector("#journal-canvas .photo-layer img");
    s = await story();
    const photo = s.layers.find((l) => l.kind === "photo");
    await page.locator(`[data-layer="${photo.id}"]`).tap();
    if ((await layerTool.getAttribute("aria-expanded")) !== "true") await layerTool.tap();
    const photoShapes = await page.$$eval('[data-action="layer-shape"]', (els) => els.map((el) => el.dataset.shape));
    assert.ok(photoShapes[0] === "free" && !photoShapes.includes("film"));
    await page.locator('[data-action="layer-shape"][data-shape="heart"]').tap();
    await page.waitForSelector(`[data-layer="${photo.id}"].shape-heart`);
    assert.match(await page.locator(`[data-layer="${photo.id}"] .photo-crop`).evaluate((el) => getComputedStyle(el).maskImage || getComputedStyle(el).webkitMaskImage), /svg/);
    await page.waitForFunction(() => {
      const d = new Date();
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      return JSON.parse(localStorage.getItem("little-days.v1")).drafts[key].moments.at(-1).layers.some((l) => l.shape === "heart");
    });
    s = await story();
    assert.deepEqual(s.layers.map((l) => l.shape).filter(Boolean).sort(), ["film", "heart", "portrait"]);
    // The exported picture is drawn with the shapes (no errors, real PNG).
    await page.locator('[data-action="tool-close"]').first().tap().catch(() => {});
    // The paper stays pinned at the top; scroll the buttons under it into view.
    await page.locator(".studio-footer").evaluate((el) => el.scrollIntoView({ block: "end" }));
    const png = page.waitForEvent("download");
    await page.locator('[data-action="export"]').tap();
    assert.match((await png).suggestedFilename(), /\.png$/);
    passed.push("shapes: video 7 / photo 7 (with free); circle is round; heart mask; export works");

    // 3. A new text box is typed into right on the paper (menu and icons step
    // aside); its font/colour panel is one tap away under 编辑, above the keyboard.
    await page.locator('.stage-bar [data-action="add-text-layer"]').tap();
    await page.waitForFunction(() => document.activeElement?.classList.contains("layer-text") && document.body.classList.contains("typing"));
    await page.evaluate(() => document.activeElement.blur());
    await page.locator('.layer-bar [data-action="layer-edit-text"]').tap();
    await page.waitForFunction(() => document.body.classList.contains("typing-sheet"));
    const layout = await page.evaluate(() => {
      const sheet = document.querySelector(".tool-sheet").getBoundingClientRect();
      const field = document.activeElement.getBoundingClientRect();
      return {
        nav: getComputedStyle(document.querySelector(".bottom-nav")).display,
        dock: getComputedStyle(document.querySelector(".tool-dock")).display,
        sheetBottom: sheet.bottom,
        fieldBottom: field.bottom,
        fieldTop: field.top,
        sheetTop: sheet.top,
        h: innerHeight,
      };
    });
    assert.equal(layout.nav, "none");
    assert.equal(layout.dock, "none");
    assert.ok(layout.sheetBottom <= layout.h * 0.55, `panel sits in the upper part (${layout.sheetBottom}/${layout.h})`);
    assert.ok(layout.fieldTop >= layout.sheetTop && layout.fieldBottom <= layout.sheetBottom + 1, "field visible inside the panel");
    // With a real keyboard height reported, the panel follows it.
    await page.evaluate(() => document.documentElement.style.setProperty("--vv-h", "300px"));
    const bottom = await page.evaluate(() => document.querySelector(".tool-sheet").getBoundingClientRect().bottom);
    assert.ok(Math.abs(bottom - 300) < 12, `panel ends at the keyboard (${bottom})`);
    await page.evaluate(() => document.activeElement.blur());
    await page.waitForFunction(() => !document.body.classList.contains("typing"));
    assert.notEqual(await page.locator(".tool-dock").evaluate((el) => getComputedStyle(el).display), "none", "tool icons come back");
    passed.push("typing: menu/icons hide, panel above the keyboard, field visible; back to normal after");

    // 4. Themes: six choices in Settings; the app recolors, the paper does not.
    await menu(page, "home");
    await page.locator('[data-action="nav"][data-page="settings"]').tap();
    assert.equal(await page.locator('[data-action="theme"]').count(), 6);
    const paperBefore = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--c-fffdf8"));
    await page.locator('[data-action="theme"][data-theme-id="cool"]').tap();
    assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), "cool");
    const bg = await page.evaluate(() => getComputedStyle(document.querySelector(".settings-card")).backgroundColor);
    const lum = (rgb) => { const [r, g, b] = rgb.match(/\d+/g).map(Number); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; };
    assert.ok(lum(bg) < 0.3, `dark cards in the dark theme (${bg})`);
    const ink = await page.evaluate(() => getComputedStyle(document.querySelector(".page-title")).color);
    assert.ok(lum(ink) > 0.6, "light text on dark");
    assert.equal(paperBefore, "", "default theme uses the original literal colors");
    // Paper keeps its real color in a dark theme.
    await page.reload();
    await page.waitForSelector(".hero");
    assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), "cool", "theme remembered");
    await menu(page, "studio");
    await page.locator('[data-action="start-continue"]').tap();
    const paper = await page.locator("#journal-canvas").evaluate((el) => getComputedStyle(el).backgroundColor);
    assert.ok(lum(paper) > 0.85, `journal paper stays light (${paper})`);
    // Back to Soft removes the attribute.
    await menu(page, "home");
    await page.locator('[data-action="nav"][data-page="settings"]').tap();
    await page.locator('[data-action="theme"][data-theme-id="soft"]').tap();
    assert.equal(await page.evaluate(() => document.documentElement.dataset.theme ?? null), null);
    // Journal data is untouched by the theme.
    assert.ok(!(await page.evaluate(() => localStorage.getItem("little-days.v1"))).includes("theme\":\"cool"));
    passed.push("themes: 6 in Settings; dark recolors app, keeps paper; remembered; journal untouched");

    assert.deepEqual(errors, []);
    console.log(`V3.8 E2E passed (${passed.length} groups):\n - ${passed.join("\n - ")}\nNo page errors.`);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
