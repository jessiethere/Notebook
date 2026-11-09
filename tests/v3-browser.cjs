const { chromium } = require("playwright");
require("./signed-in.cjs")(chromium);
const { goTab } = require("./signed-in.cjs");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const base = process.env.PREVIEW_URL || "http://127.0.0.1:8080";
const resources = path.join(
  __dirname,
  "../Packages/LittleDaysCore/Sources/LittleDaysCore/Resources",
);
const image = path.join(resources, "Media/coffee.jpg");
function wav() {
  const sampleRate = 8000,
    count = 8000,
    buffer = Buffer.alloc(44 + count * 2);
  buffer.write("RIFF");
  buffer.writeUInt32LE(buffer.length - 8, 4);
  buffer.write("WAVEfmt ", 8);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(count * 2, 40);
  for (let i = 0; i < count; i++)
    buffer.writeInt16LE(
      Math.sin((i / sampleRate) * Math.PI * 880) * 3000,
      44 + i * 2,
    );
  return buffer;
}
async function streamBytes(download) {
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
}
(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROMIUM_PATH || undefined,
    args: [
      "--use-fake-device-for-media-stream",
      "--use-fake-ui-for-media-stream",
    ],
  });
  try {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      timezoneId: "America/New_York",
      permissions: ["microphone"],
      acceptDownloads: true,
    });
    const page = await context.newPage(),
      errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(base);
    await page.waitForSelector(".hero");
    const nav = (tab) => goTab(page, tab);
    // Studio settings live in a summary menu; open one row (if closed).
    const toolOn = async (target, id) => {
      if (id === "text") return; // writing is always open (write card)
      const head = target.locator(`[data-action="tool"][data-tool="${id}"]`);
      if ((await head.getAttribute("aria-expanded")) !== "true") await head.click();
    };
    const tool = (id) => toolOn(page, id);
    const read = () =>
      page.evaluate(() => JSON.parse(localStorage.getItem("little-days.v1")));
    const saved = () =>
      page.waitForFunction(
        () =>
          document
            .querySelector("#draft-status")
            ?.textContent.includes("草稿已保存在本机") ||
          document
            .querySelector("#draft-status")
            ?.textContent.includes("Draft saved on this device"),
      );
    await nav("books");
    await page.locator('[data-action="new-book"]').first().click();
    await page
      .locator('#dialog-form [name="title"]')
      .fill("小小植物园 · Plant Days");
    await page
      .locator('#dialog-form [name="description"]')
      .fill("保持我的文字，不要自动翻译。");
    await page
      .locator('#dialog-form [name="category"]')
      .fill("Plant care / 自定义");
    for (const template of [
      "vintage-leather",
      "pastel-cute",
      "travel-album",
      "scrapbook-collage",
      "floral-notebook",
    ]) {
      await page
        .locator(`[data-action="cover-template"][data-template="${template}"]`)
        .click();
      assert.equal(
        await page.locator('[name="coverTemplate"]').inputValue(),
        template,
      );
    }
    await page.locator('[name="coverFont"]').selectOption("handwritten");
    await page.locator('[name="color"]').selectOption("blue");
    await page.locator('[name="coverDecoration"]').selectOption("bear");
    await page.locator('[data-action="cover-photo"]').click();
    await page.locator("#attachment-image-input").setInputFiles(image);
    await page.waitForFunction(() =>
      document
        .querySelector("#book-cover-preview .cover-photo")
        ?.src.startsWith("blob:"),
    );
    await page.locator("#book-preset").selectOption("plant");
    for (const [label, type, options] of [
      ["叶片数量", "number", ""],
      ["今天施肥了吗", "checkbox", ""],
      ["照料时长", "duration", ""],
      ["光照情况", "select", "Small,Large"],
    ]) {
      await page.locator('[data-action="field-add"]').click();
      const row = page.locator("[data-field-row]").last();
      await row.locator("[data-definition-label]").fill(label);
      await row.locator("[data-definition-type]").selectOption(type);
      if (options) await row.locator("[data-definition-options]").fill(options);
    }
    assert.equal(
      await page.locator('[name="visibility"]').inputValue(),
      "private",
    );
    assert.equal(
      await page
        .locator('[name="visibility"] option[value=public]')
        .evaluate((option) => option.disabled),
      true,
    );
    await page.locator('#dialog-form [type="submit"]').click();
    let book = (await read()).books.at(-1);
    assert.equal(book.visibility, "private");
    assert.equal(book.fields.length, 8);
    assert.equal(book.coverTemplate, "floral-notebook");
    assert.ok(book.coverImage.startsWith("media:"));
    await page.locator('[data-action="book-new-entry"]').click();
    await tool("text");
    await page.locator("#entry-title").fill("我的第一片新叶 · My little leaf");
    await page
      .locator("#entry-body")
      .fill("这些是用户自己的文字，不应随语言切换改变。");
    await tool("book");
    await page
      .locator('[data-custom-field="plant-name"]')
      .fill("Monstera / 龟背竹");
    await page.locator('[data-custom-field="plant-water"]').fill("2026-11-05");
    const fieldByLabel = (label) => book.fields.find((f) => f.label === label);
    await page
      .locator(`[data-custom-field="${fieldByLabel("叶片数量").id}"]`)
      .fill("8");
    await page
      .locator(`[data-custom-field="${fieldByLabel("今天施肥了吗").id}"]`)
      .check();
    await page
      .locator(`[data-custom-field="${fieldByLabel("照料时长").id}"]`)
      .fill("12");
    await page
      .locator(`[data-custom-field="${fieldByLabel("光照情况").id}"]`)
      .selectOption("Large");
    await page
      .locator('[data-action="field-image"][data-field="plant-photo"]')
      .click();
    await page.locator("#attachment-image-input").setInputFiles(image);
    await page.waitForSelector(".field-image img");
    await tool("font");
    await page
      .locator('[data-editor-field="font"]')
      .selectOption("handwritten");
    await page
      .locator('[data-editor-field="bodyFont"]')
      .selectOption("chinese");
    const catalog = JSON.parse(
      fs.readFileSync(path.join(resources, "library.json")),
    );
    const fontStatuses = await page.evaluate(async (fonts) => {
      const results = [];
      for (const font of fonts) {
        const faces = await document.fonts.load(`24px "${font.family}"`);
        results.push(
          faces.length > 0 && faces.every((face) => face.status === "loaded"),
        );
      }
      return results;
    }, catalog.fonts);
    assert.ok(fontStatuses.every(Boolean));
    assert.equal(
      await page.evaluate(() => document.fonts.check('24px "LD-handwritten"')),
      true,
    );
    await tool("stickers");
    await page.locator('[data-action="asset-sticker"]').first().click();
    await tool("layer");
    await page.locator('[data-action="layer-copy"]').click();
    assert.equal(await page.locator(".layer img").count(), 2);
    await tool("stickers");
    await page.locator('[data-action="add-text-layer"]').first().click();
    await tool("layer");
    await page.locator('[data-layer-text="text"]').fill("Grow gently");
    await page.locator('[data-layer-text="fontId"]').selectOption("decorative");
    await tool("stickers");
    await page.locator('[data-action="add-text-layer"]').first().click();
    await tool("layer");
    await page.locator('[data-layer-text="text"]').fill("慢慢长大");
    await page.locator('[data-layer-text="fontId"]').selectOption("chinese");
    await tool("stickers");
    await page.locator('[data-action="collage-photo"]').click();
    await page.locator("#attachment-image-input").setInputFiles(image);
    await page.waitForSelector('.art-layer img[src^="blob:"]');
    // Create a synthetic silent video; no user recordings or external music are used.
    const video = await page.evaluate(async () => {
      const canvas = document.createElement("canvas");
      canvas.width = 160;
      canvas.height = 120;
      const ctx = canvas.getContext("2d");
      const stream = canvas.captureStream(10);
      const recorder = new MediaRecorder(stream, {
        mimeType: "video/webm;codecs=vp8",
      });
      const chunks = [];
      recorder.ondataavailable = (event) => chunks.push(event.data);
      const done = new Promise((resolve) => (recorder.onstop = resolve));
      recorder.start();
      for (let i = 0; i < 7; i++) {
        ctx.fillStyle = i % 2 ? "#C9D7C1" : "#E8CFCF";
        ctx.fillRect(0, 0, 160, 120);
        await new Promise((resolve) => setTimeout(resolve, 75));
      }
      recorder.stop();
      await done;
      stream.getTracks().forEach((track) => track.stop());
      return [
        ...new Uint8Array(
          await new Blob(chunks, { type: "video/webm" }).arrayBuffer(),
        ),
      ];
    });
    // Video is added with 视频 under the paper (the dock lists clips once there are some).
    await page.locator("#video-input").setInputFiles({
      name: "A little moving moment.webm",
      mimeType: "video/webm",
      buffer: Buffer.from(video),
    });
    await tool("media");
    await page.waitForSelector(".media-card video");
    // A cover is grabbed automatically; the picker can replace it with a picture.
    await page.waitForFunction(() => document.querySelector(".media-card video")?.poster.startsWith("blob:"));
    const autoPoster = await page.locator(".media-card video").getAttribute("poster");
    await page.locator('[data-action="video-poster"]').click();
    await page.waitForSelector("#poster-dialog[open]");
    const posterChooser = page.waitForEvent("filechooser");
    await page.locator('[data-poster="upload"]').click();
    await (await posterChooser).setFiles(image);
    await page.waitForFunction(
      (old) => { const p = document.querySelector(".media-card video")?.poster; return p?.startsWith("blob:") && p !== old; },
      autoPoster,
    );
    await page.locator("#audio-input").setInputFiles({
      name: "Original test voice.wav",
      mimeType: "audio/wav",
      buffer: wav(),
    });
    await page.waitForSelector(".media-card audio", { state: "attached" });
    await page.locator('[data-action="record-audio"]').click();
    await page.waitForSelector('[data-action="stop-recording"]');
    await page.waitForTimeout(650);
    await page.locator('[data-action="stop-recording"]').click();
    await page.waitForFunction(
      () => document.querySelectorAll(".media-card audio").length === 2,
    );
    await saved();
    const beforeSave = await read(),
      draft = Object.values(beforeSave.drafts).find(
        (entry) => entry.title === "我的第一片新叶 · My little leaf",
      );
    assert.equal(draft.media.length, 3);
    assert.ok(draft.media.every((clip) => clip.source.startsWith("media:")));
    assert.equal(draft.fieldValues[fieldByLabel("叶片数量").id], 8);
    assert.equal(draft.fieldValues[fieldByLabel("今天施肥了吗").id], true);
    assert.ok(!JSON.stringify(beforeSave).includes("data:image/"));
    assert.ok(!JSON.stringify(beforeSave).includes("base64,"));
    await page.locator('[data-action="save-entry"]').click();
    await page.reload();
    await page.waitForSelector(".hero");
    await nav("studio");
    await tool("text");
    assert.equal(
      await page.locator("#entry-title").inputValue(),
      "我的第一片新叶 · My little leaf",
    );
    await tool("font");
    assert.equal(
      await page.locator('[data-editor-field="font"]').inputValue(),
      "handwritten",
    );
    await tool("book");
    assert.equal(await page.locator(".field-image img").count(), 1);
    await tool("media");
    // V3.1 loads audio/video Blobs for the open view only, after IndexedDB reads.
    await page.waitForFunction(
      () =>
        document.querySelectorAll('.media-card audio[src^="blob:"]').length === 2 &&
        document.querySelector('.media-card video[src^="blob:"]'),
    );
    assert.equal(await page.locator(".media-card video").count(), 1);
    assert.equal(await page.locator(".media-card audio").count(), 2);
    await page.locator(".media-card video").evaluate(async (video) => {
      video.muted = true;
      await video.play();
    });
    await page.waitForFunction(
      () => document.querySelector(".media-card video").currentTime > 0.05,
    );
    await page
      .locator(".media-card audio")
      .first()
      .evaluate((audio) => audio.play());
    await page.waitForFunction(() => document.querySelector(".media-card video").paused);
    await page
      .locator(".media-card audio")
      .first()
      .evaluate((audio) => {
        audio.pause();
        audio.currentTime = 0.2;
      });
    await page
      .locator(".media-card audio")
      .last()
      .evaluate((audio) => audio.play());
    await page.waitForFunction(
      () => document.querySelectorAll(".media-card audio")[1].currentTime > 0.05,
    );
    await page
      .locator(".media-card audio")
      .last()
      .evaluate((audio) => audio.pause());
    const exportPromise = page.waitForEvent("download");
    await page.locator('[data-action="export"]').click();
    assert.ok((await streamBytes(await exportPromise)).length > 10000);
    await nav("home");
    await page.locator('[data-page="settings"]').click();
    const originalRecords = JSON.stringify((await read()).entries);
    await page.locator('[data-language="en"]').click();
    assert.equal(await page.locator(".page-title").innerText(), "Settings");
    assert.equal(JSON.stringify((await read()).entries), originalRecords);
    await page.reload();
    await page.waitForSelector(".hero");
    assert.match(await page.title(), /Stationery Shop/);
    assert.equal(
      await page.locator('#navigation [data-page="books"]').innerText(),
      "Books",
    );
    for (const tab of ["calendar", "growth", "books", "studio"]) {
      await nav(tab);
      assert.ok(
        // The Studio keeps its title as a screen-reader heading (compact bar).
        !/[\u3400-\u9fff]/.test(await page.locator("#app h1").first().textContent()),
        tab,
      );
    }
    await nav("books");
    await page.locator(`[data-action="pull-book"][data-book="${book.id}"]`).click();
    await page.locator(`[data-action="book"][data-book="${book.id}"]`).click();
    assert.match(
      await page.locator(".book-detail-copy").innerText(),
      /小小植物园/,
    );
    await page.locator('[data-action="edit-book"]').click();
    assert.equal(
      await page.locator('#dialog-form [name="description"]').inputValue(),
      "保持我的文字，不要自动翻译。",
    );
    assert.equal(
      await page.locator('[name="coverFont"]').inputValue(),
      "handwritten",
    );
    await page.locator('[data-action="close-dialog"]').click();
    await nav("home");
    await page.locator('[data-page="settings"]').click();
    const backupPromise = page.waitForEvent("download");
    await page.locator('[data-action="backup"]').click();
    const backupBytes = await streamBytes(await backupPromise),
      backup = JSON.parse(backupBytes);
    assert.ok(backup.media.length >= 6);
    assert.equal(backup.state.books.at(-1).title, book.title);
    const stable = JSON.stringify(await read());
    await page.locator("#backup-input").setInputFiles({
      name: "backup.json",
      mimeType: "application/json",
      buffer: backupBytes,
    });
    await page.locator("#confirm-dialog[open] #confirm-cancel").click();
    await page.waitForTimeout(150);
    assert.equal(JSON.stringify(await read()), stable);
    await page.locator("#backup-input").setInputFiles({
      name: "backup.json",
      mimeType: "application/json",
      buffer: backupBytes,
    });
    await page.locator("#confirm-dialog[open] #confirm-ok").click();
    await page.waitForFunction(() =>
      document
        .querySelector("#toast")
        .textContent.includes("Records and media restored"),
    );
    assert.ok(
      (await read()).books.every((book) => book.visibility === "private"),
    );
    await nav("studio");
    await tool("media");
    // V3.1 loads audio/video Blobs for the open view only, after IndexedDB reads.
    await page.waitForFunction(
      () =>
        document.querySelectorAll('.media-card audio[src^="blob:"]').length === 2 &&
        document.querySelector('.media-card video[src^="blob:"]'),
    );
    assert.equal(await page.locator(".media-card video").count(), 1);
    await page
      .locator(".media-card audio")
      .first()
      .evaluate((audio) => audio.play());
    await page.waitForFunction(() => !document.querySelector(".media-card audio").paused);
    await page
      .locator(".media-card audio")
      .first()
      .evaluate((audio) => audio.pause());
    // A second tab must not silently replace a newer metadata snapshot.
    const second = await context.newPage();
    await second.goto(base);
    await second.waitForSelector(".hero");
    await goTab(second, "studio");
    await nav("home");
    await page.locator('[data-action="check"][data-habit="move"]').click();
    const newer = JSON.stringify(await read());
    await toolOn(second, "text");
    await second.locator("#entry-body").fill("Unsaved work in the older tab");
    await second.waitForFunction(() =>
      document.querySelector("#toast").textContent.includes("Another tab"),
    );
    assert.equal(JSON.stringify(await read()), newer);
    await second.close();
    for (const width of [375, 390, 430]) {
      await page.setViewportSize({ width, height: 844 });
      for (const tab of ["home", "calendar", "growth", "books", "studio"]) {
        await nav(tab);
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          true,
          `${tab} overflow at ${width}`,
        );
      }
    }
    assert.deepEqual(errors, []);
    // Import a legacy v1 state into a fresh context and preserve it through migration/save.
    const old = JSON.parse(JSON.stringify(backup.state));
    old.entries = old.entries.slice(0, 1);
    old.entries[0].photo =
      "data:image/jpeg;base64," + fs.readFileSync(image).toString("base64");
    delete old.entries[0].media;
    old.entries[0].legacyFlag = "keep me";
    old.entries[0].layers = [
      {
        id: "legacy-emoji",
        kind: "sticker",
        text: "🌷",
        x: 50,
        y: 50,
        scale: 1,
        rotation: 0,
      },
    ];
    old.books[0].legacyFlag = 42;
    delete old.books[0].visibility;
    const legacyContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
    });
    await legacyContext.addInitScript((state) => {
      if (!sessionStorage.getItem("seeded")) {
        localStorage.setItem("little-days.v1", JSON.stringify(state));
        sessionStorage.setItem("seeded", "yes");
      }
    }, old);
    const legacy = await legacyContext.newPage();
    await legacy.goto(base);
    await legacy.waitForSelector(".hero");
    const migrated = await legacy.evaluate(() =>
      JSON.parse(localStorage.getItem("little-days.v1")),
    );
    assert.ok(migrated.entries[0].photo.startsWith("media:"));
    assert.equal(migrated.entries[0].legacyFlag, "keep me");
    assert.equal(migrated.books[0].legacyFlag, 42);
    assert.equal(migrated.books[0].visibility, "private");
    assert.equal(migrated.entries[0].layers[0].text, "🌷");
    await legacyContext.close();
    const deniedContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
    });
    await deniedContext.addInitScript(() => {
      navigator.mediaDevices.getUserMedia = () =>
        Promise.reject(new DOMException("Denied", "NotAllowedError"));
    });
    const denied = await deniedContext.newPage();
    await denied.goto(base);
    await denied.waitForSelector(".hero");
    await goTab(denied, "studio");
    // Recording starts from 声音 under the paper.
    await denied.locator('.stage-bar [data-action="add-sound"]').click();
    await denied.locator('[data-action="add-record"]').click();
    await denied.waitForFunction(() =>
      document.querySelector("#toast").textContent.includes("麦克风"),
    );
    assert.equal(
      await denied.locator('[data-action="stop-recording"]').count(),
      0,
    );
    await goTab(denied, "books");
    await deniedContext.close();
    console.log(
      "V3 E2E passed: custom books/8 fields/6 covers, real licensed fonts, original stickers/text boxes, Blob photos/video/audio/recording, playback after reload, backup cancel/restore, bilingual persistence, legacy migration, stale-tab protection, phone layouts. No page errors.",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
