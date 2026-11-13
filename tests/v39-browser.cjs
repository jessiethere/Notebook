// Quick actions on the selected item; video covers (automatic, a chosen
// frame, or an uploaded picture); friendly placeholder for broken pictures.
const { chromium, devices } = require("playwright");
require("./signed-in.cjs")(chromium);
const { studioTool, studioDetails, studioMode, studioPreview, studioEdit, studioClose, studioMore, studioMoreAction, momentField } = require("./signed-in.cjs");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const base = process.env.PREVIEW_URL || "http://127.0.0.1:8080";
const lake = fs.readFileSync(path.join(__dirname, "../Packages/LittleDaysCore/Sources/LittleDaysCore/Resources/Media/lake.jpg"));

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
    const story = () =>
      page.evaluate(() => {
        const d = new Date();
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        return JSON.parse(localStorage.getItem("little-days.v1")).drafts[key].moments.at(-1);
      });
    const waitStory = (fn, arg) =>
      page.waitForFunction(
        ([source, arg]) => {
          const d = new Date();
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
          const m = JSON.parse(localStorage.getItem("little-days.v1"))?.drafts?.[key]?.moments?.at(-1);
          return m && new Function("m", "arg", `return (${source})(m, arg)`)(m, arg);
        },
        [fn.toString(), arg],
      );
    const video = Buffer.from(
      await page.evaluate(async () => {
        const c = document.createElement("canvas");
        c.width = 90; c.height = 160;
        const g = c.getContext("2d");
        const recorder = new MediaRecorder(c.captureStream(15), { mimeType: "video/webm;codecs=vp8" });
        const chunks = [];
        recorder.ondataavailable = (e) => chunks.push(e.data);
        const done = new Promise((r) => (recorder.onstop = r));
        recorder.start();
        for (let i = 0; i < 20; i++) { g.fillStyle = `hsl(${i * 18},60%,60%)`; g.fillRect(0, 0, 90, 160); await new Promise((r) => setTimeout(r, 80)); }
        recorder.stop(); await done;
        return [...new Uint8Array(await new Blob(chunks).arrayBuffer())];
      }),
    );

    // 1. A new video gets a cover straight away (no black box).
    await page.locator('#navigation [data-page="studio"]').tap();
    await page.locator('[data-action="quick-way"][data-way="write"]').tap();
    await page.locator('[data-action="quick-start"]').tap();
    await page.waitForSelector("#journal-canvas");
    await page.locator("#video-input").setInputFiles({ name: "walk.webm", mimeType: "video/webm", buffer: video });
    await page.waitForSelector('#journal-canvas .video-layer video[poster^="blob:"]');
    let s = await story();
    const clip = s.media[0];
    assert.match(clip.poster, /^media:/, "automatic cover saved");
    const videoLayer = s.layers.find((l) => l.kind === "video");
    passed.push("new video gets an automatic cover");

    // 2. Selecting turns the bottom row into the clip's own tools (V10.1: no
    // menu floating over the paper); copy and the order are in 图层.
    await page.locator(`[data-layer="${videoLayer.id}"]`).tap({ position: { x: 6, y: 6 } });
    await page.waitForSelector('.tool-dock.ctx[data-ctx="video"]');
    assert.equal(await page.locator(".layer-bar").count(), 0, "nothing floats on the paper");
    const actions = await page.$$eval(".tool-dock.ctx button", (els) => els.map((el) => el.dataset.tool || el.dataset.action));
    // V10.20: videos also get 形状 (shapes moved out of 图层 into their own sheet).
    assert.deepEqual(actions, ["layer-deselect", "ctx-play", "video-cover", "shape", "layer", "layer-delete"] /* V10.23: 播放 · 换封面 · 形状 · 图层 · 移除 */);
    const bar = await page.locator(".tool-dock.ctx").boundingBox();
    const paper = await page.locator("#journal-canvas").boundingBox();
    assert.ok(bar.y >= paper.y + paper.height, "the tools sit under the paper, never on the item");
    passed.push("selected video: × · shape · cover · layer · delete in the bottom row");

    // 3. Cover: pick a frame with the slider.
    await page.locator('.tool-dock.ctx [data-action="video-cover"]').tap();
    await page.waitForSelector("#poster-dialog[open] video");
    await page.locator("[data-poster-time]").evaluate((el) => { el.value = "1.2"; el.dispatchEvent(new Event("input")); });
    await page.waitForTimeout(400);
    await page.locator('[data-poster="frame"]').tap();
    await waitStory((m, old) => m.media[0].poster && m.media[0].poster !== old, clip.poster);
    s = await story();
    const framePoster = s.media[0].poster;
    // …or upload a picture.
    await page.locator(`[data-layer="${videoLayer.id}"]`).tap({ position: { x: 6, y: 6 } });
    await page.locator('.tool-dock.ctx [data-action="video-cover"]').tap();
    await page.waitForSelector("#poster-dialog[open]");
    const chooser = page.waitForEvent("filechooser");
    await page.locator('[data-poster="upload"]').tap();
    await (await chooser).setFiles({ name: "cover.jpg", mimeType: "image/jpeg", buffer: lake });
    await waitStory((m, old) => m.media[0].poster !== old, framePoster);
    passed.push("cover: choose a frame, or upload a picture");

    // 4. Copy and delete from the bar (delete also clears the clip; undo restores).
    await page.locator(`[data-layer="${videoLayer.id}"]`).tap({ position: { x: 6, y: 6 } });
    await studioTool(page, "layer");
    await page.locator('.tool-sheet [data-action="layer-copy"]').tap();
    await waitStory((m) => m.layers.filter((l) => l.kind === "video").length === 2);
    await page.locator('.tool-dock.ctx [data-action="layer-delete"]').tap();
    await waitStory((m) => m.layers.filter((l) => l.kind === "video").length === 1);
    s = await story();
    assert.equal(s.media.length, 1, "clip kept while another copy is on the page");
    await page.locator("#journal-canvas .video-layer").tap({ position: { x: 6, y: 6 } });
    await page.locator('.tool-dock.ctx [data-action="layer-delete"]').tap();
    await waitStory((m) => !m.layers.some((l) => l.kind === "video") && m.media.length === 0);
    await page.locator('[data-action="undo"]').tap();
    await waitStory((m) => m.layers.some((l) => l.kind === "video") && m.media.length === 1);
    passed.push("copy and delete from the bar; deleting the last copy removes the clip; undo restores");

    // 5. Photo: the bar offers editing; a picture that can't load shows a soft placeholder.
    await page.locator("#photos-input").setInputFiles({ name: "lake.jpg", mimeType: "image/jpeg", buffer: lake });
    await page.locator('#photo-editor [data-pe-action="cancel"]').tap();
    await page.waitForSelector("#journal-canvas .photo-layer img");
    await page.locator("#journal-canvas .photo-layer").first().tap();
    await page.waitForSelector('.tool-dock.ctx [data-action="photo-edit"]');
    await page.evaluate(() => {
      const img = document.querySelector("#journal-canvas .photo-layer img");
      img.src = "data:image/jpeg;base64,AAAA";
    });
    await page.waitForSelector("#journal-canvas .photo-crop.broken");
    passed.push("photo bar has Edit; unreadable pictures show a placeholder, not a broken icon");

    assert.deepEqual(errors, []);
    console.log(`V3.9 E2E passed (${passed.length} groups):\n - ${passed.join("\n - ")}\nNo page errors.`);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
