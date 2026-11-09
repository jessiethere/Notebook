// Photo / text / video / sound as equal choices (under the paper and on an
// empty paper), and iPhone-friendly fields. Synthetic media only.
const { chromium, devices } = require("playwright");
require("./signed-in.cjs")(chromium);
const { menu } = require("./signed-in.cjs");
const assert = require("node:assert/strict");
const base = process.env.PREVIEW_URL || "http://127.0.0.1:8080";
function wav(seconds = 1) {
  const rate = 8000, count = rate * seconds, buffer = Buffer.alloc(44 + count * 2);
  buffer.write("RIFF"); buffer.writeUInt32LE(buffer.length - 8, 4); buffer.write("WAVEfmt ", 8);
  buffer.writeUInt32LE(16, 16); buffer.writeUInt16LE(1, 20); buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(rate, 24); buffer.writeUInt32LE(rate * 2, 28); buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34); buffer.write("data", 36); buffer.writeUInt32LE(count * 2, 40);
  for (let i = 0; i < count; i++) buffer.writeInt16LE(Math.sin((i / rate) * Math.PI * 440) * 3000, 44 + i * 2);
  return buffer;
}

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
    const draft = () =>
      page.evaluate(() => {
        const d = new Date();
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        return JSON.parse(localStorage.getItem("little-days.v1") || "null")?.drafts?.[key];
      });

    // 1. A new, empty story: the paper itself offers the four choices.
    await menu(page, "studio");
    await page.locator('[data-action="start-words"]').tap();
    await page.waitForSelector("#journal-canvas .canvas-add-row");
    const onPaper = await page.$$eval("#journal-canvas .canvas-add-row button", (els) => els.map((el) => el.dataset.action));
    assert.deepEqual(onPaper, ["add-photos", "add-text-layer", "add-video", "add-sound"]);
    assert.equal(await page.locator(".stage-bar .stage-add").count(), 0, "shown once: on the empty paper only");
    assert.equal(await page.locator(".write-card [data-action='add-text-layer']").count(), 0, "no hidden text-box link");
    passed.push("empty paper offers photo / text / video / sound (once)");

    // 2. Text: one tap adds words to the paper with the typing box ready.
    await page.locator('#journal-canvas [data-action="add-text-layer"]').tap();
    await page.waitForSelector("#journal-canvas .text-layer, #journal-canvas [data-layer]");
    assert.equal(await page.evaluate(() => document.activeElement?.dataset.layerText), "text", "typing box focused");
    await page.keyboard.type("今天的风很温柔");
    await page.waitForFunction(() => document.querySelector("#journal-canvas").innerText.includes("今天的风很温柔"));
    assert.equal(await page.locator("#journal-canvas .canvas-add-row").count(), 0, "hint goes once the paper has something");
    const underPaper = await page.$$eval(".stage-bar .stage-add", (els) => els.map((el) => el.dataset.action));
    assert.deepEqual(underPaper, onPaper, "then the same four choices sit under the paper");
    passed.push("text: one tap, type straight away, shows on the paper");

    // 3. Sound: a small choice of record / upload; upload lands on the paper.
    await page.locator('[data-action="tool-close"]').first().tap().catch(() => {});
    await page.locator('.stage-bar [data-action="add-sound"]').tap();
    assert.equal(await page.locator(".sound-menu button").count(), 2);
    assert.equal(await page.locator('.stage-bar [data-action="add-sound"]').getAttribute("aria-expanded"), "true");
    const chooser = page.waitForEvent("filechooser");
    await page.locator('[data-action="add-audio-file"]').tap();
    await (await chooser).setFiles({ name: "wind.wav", mimeType: "audio/wav", buffer: wav(1) });
    await page.waitForSelector("#journal-canvas .audio-layer", { state: "attached" });
    assert.equal(await page.locator(".sound-menu").count(), 0, "menu closes");
    // Video opens the video picker directly.
    const videoChooser = page.waitForEvent("filechooser");
    await page.locator('.stage-bar [data-action="add-video"]').tap();
    const picker = await videoChooser;
    assert.equal(await picker.element().evaluate((el) => el.id), "video-input");
    await picker.setFiles([]);
    // Photos open the photo picker (multiple).
    // Photos first offer: album, today's picks and the scene library.
    await page.locator('.stage-bar [data-action="add-photos"]').tap();
    await page.waitForSelector("#choose-dialog[open]");
    const photoChooser = page.waitForEvent("filechooser");
    await page.locator('#choose-dialog [data-action="choose-album"]').tap();
    const photoPicker = await photoChooser;
    assert.equal(photoPicker.isMultiple(), true);
    await photoPicker.setFiles([]);
    const d = await draft();
    const story = d.moments.at(-1);
    assert.deepEqual(story.layers.map((l) => l.kind).sort(), ["audio", "text"]);
    passed.push("sound: record or upload (upload goes on the paper); video and photo pickers one tap away");

    // 4. iPhone: fields are 16px so Safari never zooms the page sideways.
    const small = await page.$$eval("input:not([type=range]):not([type=checkbox]):not([type=radio]):not([type=color]), textarea, select", (els) =>
      els.filter((el) => el.offsetParent && parseFloat(getComputedStyle(el).fontSize) < 16).map((el) => el.outerHTML.slice(0, 60)),
    );
    assert.deepEqual(small, []);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    // Start screen titles use a medium system weight, not heavy bold.
    await menu(page, "studio");
    const weight = await page.locator(".start-card b").first().evaluate((el) => getComputedStyle(el).fontWeight);
    assert.equal(weight, "600");
    passed.push("iPhone: 16px fields (no auto-zoom), no sideways scroll, calm start-screen type");

    assert.deepEqual(errors, []);
    console.log(`V3.7 E2E passed (${passed.length} groups):\n - ${passed.join("\n - ")}\nNo page errors.`);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
