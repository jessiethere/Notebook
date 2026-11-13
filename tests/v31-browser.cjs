// V3.1 acceptance: multi-photo free layout, Moments, Day Detail playback,
// Growth reflections, legacy data, backup/restore, bilingual, phone/desktop.
// Uses synthetic media only (repo sample JPEGs, generated WAV/WebM, fake mic).
const { chromium } = require("playwright");
require("./signed-in.cjs")(chromium);
const { studioTool, studioDetails, studioMode, studioPreview, studioEdit, studioClose, studioMore, studioMoreAction, momentField } = require("./signed-in.cjs");
const { goTab, skipPhotoEditor } = require("./signed-in.cjs");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const base = process.env.PREVIEW_URL || "http://127.0.0.1:8080";
const resources = path.join(
  __dirname,
  "../Packages/LittleDaysCore/Sources/LittleDaysCore/Resources",
);
const jpeg = (name) => fs.readFileSync(path.join(resources, "Media", name));
const photos = (count, prefix) =>
  Array.from({ length: count }, (_, i) => ({
    name: `${prefix}-${i + 1}.jpg`,
    mimeType: "image/jpeg",
    buffer: jpeg(i % 2 ? "lake.jpg" : "coffee.jpg"),
  }));
function wav() {
  const sampleRate = 8000,
    count = 16000,
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
    buffer.writeInt16LE(Math.sin((i / sampleRate) * Math.PI * 660) * 3000, 44 + i * 2);
  return buffer;
}
async function syntheticVideo(page) {
  return Buffer.from(
    await page.evaluate(async () => {
      const canvas = document.createElement("canvas");
      canvas.width = 160;
      canvas.height = 120;
      const ctx = canvas.getContext("2d");
      const stream = canvas.captureStream(10);
      const recorder = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp8" });
      const chunks = [];
      recorder.ondataavailable = (event) => chunks.push(event.data);
      const done = new Promise((resolve) => (recorder.onstop = resolve));
      recorder.start();
      for (let i = 0; i < 8; i++) {
        ctx.fillStyle = i % 2 ? "#C9D7C1" : "#E8CFCF";
        ctx.fillRect(0, 0, 160, 120);
        await new Promise((resolve) => setTimeout(resolve, 75));
      }
      recorder.stop();
      await done;
      stream.getTracks().forEach((track) => track.stop());
      return [...new Uint8Array(await new Blob(chunks, { type: "video/webm" }).arrayBuffer())];
    }),
  );
}
const D1 = "2026-11-03";
const localToday = () =>
  new Date().toLocaleDateString("sv-SE", { timeZone: "America/New_York" });

async function setup(browser, options = {}) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    timezoneId: "America/New_York",
    permissions: ["microphone"],
    acceptDownloads: true,
    hasTouch: true,
    ...options,
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("dialog", (dialog) => dialog.accept());
  return { context, page, errors };
}
const helpers = (page) => {
  const read = () => page.evaluate(() => JSON.parse(localStorage.getItem("little-days.v1")));
  const day = async (date) => {
    const s = await read();
    return s.drafts[date] || s.entries.find((e) => e.date === date);
  };
  return {
    read,
    day,
    nav: (tab) => goTab(page, tab),
    // Studio settings live in a summary menu; open one row (if closed).
    tool: async (id) => {
      if (id === "text") return; // writing is always open (write card)
      // Put the phone keyboard away first, as a person would (typing hides the tools).
      await page.evaluate(() => document.activeElement?.blur?.());
      await studioTool(page, id);
    },
    // Waits until the stored draft/entry for a date satisfies a predicate.
    waitDay: (date, predicate, arg) =>
      page.waitForFunction(
        ([date, source, arg]) => {
          const s = JSON.parse(localStorage.getItem("little-days.v1"));
          const entry = s && (s.drafts[date] || s.entries.find((e) => e.date === date));
          return entry && new Function("entry", "arg", `return (${source})(entry, arg)`)(entry, arg);
        },
        [date, predicate.toString(), arg ?? null],
      ),
  };
};
async function openStudioDate(page, nav, date) {
  await nav("studio");
  // The date sits in 页面信息 (More → Page details).
  await studioDetails(page);
  await page.locator("#editor-date").fill(date);
  await page.waitForFunction((d) => document.querySelector("#editor-date")?.value === d, date);
  await studioClose(page);
}
const photoGeometry = (layers) =>
  layers
    .filter((l) => l.kind === "photo")
    .map((l) => ({ id: l.id, x: l.x, y: l.y, w: l.w, h: l.h, scale: l.scale, rotation: l.rotation, crop: l.crop, frame: l.frame }));
async function center(page, selector) {
  await page.locator(selector).scrollIntoViewIfNeeded();
  const box = await page.locator(selector).boundingBox();
  return { x: box.x + box.width / 2, y: box.y + box.height / 2, box };
}
async function mouseDrag(page, from, dx, dy) {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(from.x + dx, from.y + dy, { steps: 8 });
  await page.mouse.up();
}
async function selectLayer(page, id) {
  await page.locator(`[data-layer="${id}"]`).focus();
  await page.keyboard.press("Enter");
  await page.waitForSelector(`[data-layer="${id}"].active`);
}
async function noOverflow(page, label) {
  assert.equal(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    true,
    `${label} overflows horizontally`,
  );
}

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROMIUM_PATH || undefined,
    args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"],
  });
  const passed = [];
  try {
    const { context, page, errors } = await setup(browser);
    const { read, day, nav, waitDay, tool } = helpers(page);
    await page.goto(base);
    await page.waitForSelector(".hero");

    // 1. Upload five photos in one pick; every photo is its own layer.
    await openStudioDate(page, nav, D1);
    await page.locator("#photos-input").setInputFiles(photos(5, "pick"));
    await skipPhotoEditor(page);
    await page.waitForFunction(() => document.querySelectorAll('.photo-layer img[src^="blob:"]').length === 5);
    await waitDay(D1, (e) => e.layers.filter((l) => l.kind === "photo").length === 5);
    let entry = await day(D1);
    const ids = entry.layers.filter((l) => l.kind === "photo").map((l) => l.id);
    assert.equal(new Set(ids).size, 5);
    assert.ok(entry.layers.every((l) => l.mediaRef.startsWith("media:")));
    assert.equal(entry.layoutTemplate, "collage");
    assert.ok(!JSON.stringify(await read()).includes("base64,"), "no image bytes in LocalStorage");
    // Adding more keeps the existing photos.
    await page.locator("#photos-input").setInputFiles(photos(1, "extra"));
    await skipPhotoEditor(page);
    await waitDay(D1, (e) => e.layers.filter((l) => l.kind === "photo").length === 6);
    entry = await day(D1);
    assert.deepEqual(entry.layers.filter((l) => l.kind === "photo").slice(0, 5).map((l) => l.id), ids);
    // Remove the extra one with undo, proving undo/redo spans photo uploads.
    await page.locator('[data-action="undo"]').click();
    await waitDay(D1, (e) => e.layers.filter((l) => l.kind === "photo").length === 5);
    await page.locator('[data-action="redo"]').click();
    await waitDay(D1, (e) => e.layers.filter((l) => l.kind === "photo").length === 6);
    await page.locator('[data-action="undo"]').click();
    await waitDay(D1, (e) => e.layers.filter((l) => l.kind === "photo").length === 5);
    passed.push("1 five photos in one pick");

    // 2. Each of the five photos moves, scales and changes layer order.
    for (const [index, id] of ids.entries()) {
      await selectLayer(page, id);
      await page.locator('[data-action="layer-front"]').click();
      await page.waitForFunction((id) => {
        const layers = [...document.querySelectorAll("#journal-canvas [data-layer]")];
        return layers.at(-1)?.dataset.layer === id;
      }, id);
      const before = (await day(D1)).layers.find((l) => l.id === id);
      const point = await center(page, `[data-layer="${id}"]`);
      // The same share of the paper as before the larger V10.0 paper (290px wide then).
      const unit = (await page.locator("#journal-canvas").boundingBox()).width / 290;
      const dx = (index % 2 ? 1 : -1) * (14 + index * 3) * unit,
        dy = (index % 2 ? -12 : 12) * unit;
      await mouseDrag(page, point, dx, dy);
      await page.mouse.move(point.x + dx, point.y + dy);
      await page.mouse.wheel(0, -120);
      await page.mouse.wheel(0, -120);
      await waitDay(
        D1,
        (e, arg) => {
          const l = e.layers.find((x) => x.id === arg.id);
          return l.x !== arg.x && l.scale > arg.scale && e.layers.at(-1).id === arg.id;
        },
        { id, x: before.x, scale: before.scale },
      );
    }
    // Resize and rotate handles (mouse) on one photo, crop on another.
    await selectLayer(page, ids[0]);
    const g0 = (await day(D1)).layers.find((l) => l.id === ids[0]);
    // Drags keep the share of the paper they had on the smaller pre-V10.0 paper.
    const paperW = (await page.locator("#journal-canvas").boundingBox()).width;
    await mouseDrag(page, await center(page, `#sel-frame[data-sel="${ids[0]}"] .handle-resize`), (20 * paperW) / 186, (16 * paperW) / 186);
    await mouseDrag(page, await center(page, `#sel-frame[data-sel="${ids[0]}"] .handle-rotate`), 40, 25);
    await waitDay(D1, (e, a) => {
      const l = e.layers.find((x) => x.id === a.id);
      return l.w > a.w && l.h > a.h && l.rotation !== a.rotation;
    }, { id: ids[0], w: g0.w, h: g0.h, rotation: g0.rotation });
    // V10.20: the in-canvas crop mode is gone. 裁剪画面 opens the full-screen
    // crop editor (zoom slider, 完成 writes crop.rect plus the older x/y/zoom),
    // and the frame select moved to the 形状 sheet.
    await page.locator('.tool-dock.ctx [data-action="crop-open"]').click();
    await page.waitForSelector("#crop-editor[open] .ce-box");
    await page.waitForFunction(() => document.querySelector("#crop-editor .ce-box").getBoundingClientRect().width > 50);
    await page.locator("#crop-editor [data-ce-zoom]").evaluate((el) => {
      el.value = "1.8";
      el.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await page.locator('#crop-editor [data-ce="done"]').click();
    await page.waitForSelector("#crop-editor:not([open])", { state: "attached" });
    await studioTool(page, "shape");
    await page.locator('.tool-sheet[data-tool-row="shape"] [data-layer-text="frame"]').selectOption("polaroid");
    await waitDay(D1, (e, id) => {
      const l = e.layers.find((x) => x.id === id);
      return Math.abs(l.crop.zoom - 1.8) < 0.01 && l.crop.rect && l.frame === "polaroid";
    }, ids[0]);
    await studioClose(page);
    // Two-finger pinch + rotate on a real touch screen (CDP touch points).
    await selectLayer(page, ids[2]);
    const g2 = (await day(D1)).layers.find((l) => l.id === ids[2]);
    const cdp = await context.newCDPSession(page);
    const c2 = await center(page, `[data-layer="${ids[2]}"]`);
    const touch = (type, points) => cdp.send("Input.dispatchTouchEvent", { type, touchPoints: points });
    await touch("touchStart", [{ x: c2.x - 12, y: c2.y, id: 1 }]);
    await touch("touchStart", [{ x: c2.x - 12, y: c2.y, id: 1 }, { x: c2.x + 12, y: c2.y, id: 2 }]);
    for (let step = 1; step <= 8; step++)
      await touch("touchMove", [
        { x: c2.x - 12 - step * 4, y: c2.y - step, id: 1 },
        { x: c2.x + 12 + step * 4, y: c2.y + step * 3, id: 2 },
      ]);
    await touch("touchEnd", []);
    await waitDay(D1, (e, a) => {
      const l = e.layers.find((x) => x.id === a.id);
      return l.scale > a.scale * 1.3 && l.rotation !== a.rotation;
    }, { id: ids[2], scale: g2.scale, rotation: g2.rotation });
    // Send one photo to the back and one step forward.
    await selectLayer(page, ids[4]);
    await page.locator('[data-action="layer-back"]').click();
    await waitDay(D1, (e, id) => e.layers[0].id === id, ids[4]);
    await page.locator('[data-action="layer-forward"]').click();
    await waitDay(D1, (e, id) => e.layers[1].id === id, ids[4]);
    entry = await day(D1);
    assert.equal(entry.layoutEdited, true);
    passed.push("2 move/scale/pinch/rotate/resize/crop/layer order for 5 photos");

    // Switching template after manual edits asks first (in-page dialog, undoable).
    await tool("layout");
    await page.locator('[data-action="apply-layout"][data-template="grid"]').click();
    const asked = (await page.locator("#confirm-dialog[open] #confirm-message").innerText()).length > 0;
    await page.locator("#confirm-dialog[open] #confirm-ok").click();
    await waitDay(D1, (e) => e.layoutTemplate === "grid" && !e.layoutEdited);
    assert.ok(asked, "template switch confirms before overriding manual layout");
    await page.locator('[data-action="undo"]').click();
    await waitDay(D1, (e) => e.layoutEdited === true);

    // 3. Save, reload and the layout is identical in data and on screen.
    const geometry = photoGeometry((await day(D1)).layers);
    const order = (await day(D1)).layers.map((l) => l.id);
    await page.locator('[data-action="save-entry"]').click();
    await require("./signed-in.cjs").homeAfterSave(page);
    await page.reload();
    await page.waitForSelector(".hero");
    entry = (await read()).entries.find((e) => e.date === D1);
    assert.deepEqual(photoGeometry(entry.layers), geometry);
    assert.deepEqual(entry.layers.map((l) => l.id), order);
    await openStudioDate(page, nav, D1);
    await page.waitForFunction(() => document.querySelectorAll('.photo-layer img[src^="blob:"]').length === 5);
    const domOrder = await page.$$eval("#journal-canvas [data-layer]", (els) => els.map((el) => el.dataset.layer));
    assert.deepEqual(domOrder, order);
    for (const g of geometry) {
      const style = await page.locator(`[data-layer="${g.id}"]`).getAttribute("style");
      assert.ok(style.includes(`left:${g.x}%`) && style.includes(`width:${g.w}%`), style);
    }
    passed.push("3 layout restored after save + reload");

    // 4/5. Three Moments on the same day, edited independently and reordered.
    const addMoment = async (title, time) => {
      await page.locator('[data-action="add-moment"]').first().click();
      await tool("text");
      await (await momentField(page, "title")).fill(title);
      await (await momentField(page, "time")).fill(time);
    };
    await addMoment("Gym Session", "08:00");
    await (await momentField(page, "body")).fill("今天的训练计划：深蹲 4 组。");
    await (await momentField(page, "tags")).fill("fitness, morning");
    await page.locator("#photos-input").setInputFiles(photos(3, "gym"));
    await skipPhotoEditor(page);
    await page.waitForFunction(() => document.querySelectorAll('.moment-canvas .photo-layer img[src^="blob:"]').length === 3);
    await addMoment("Coffee Time", "14:30");
    await (await momentField(page, "body")).fill("一杯燕麦拿铁。");
    await tool("mood");
    await page.locator('[data-action="moment-mood"][data-mood="☁️"]').click();
    await addMoment("Home Cooking", "19:00");
    await (await momentField(page, "body")).fill("番茄牛腩食谱");
    // Video goes in with 视频 under the paper; its list is then in the dock.
    await page.locator("#video-input").setInputFiles({ name: "cooking.webm", mimeType: "video/webm", buffer: await syntheticVideo(page) });
    await tool("media");
    await page.waitForSelector('.media-card video[src^="blob:"]');
    await page.locator("#audio-input").setInputFiles({ name: "kitchen-sounds.wav", mimeType: "audio/wav", buffer: wav() });
    await page.waitForSelector('.media-card audio[src^="blob:"]', { state: "attached" });
    await page.locator('[data-action="record-audio"]').click();
    await page.waitForSelector('[data-action="stop-recording"]');
    await page.waitForTimeout(900);
    await page.locator('[data-action="stop-recording"]').click();
    await page.waitForFunction(() => document.querySelectorAll('.media-card audio[src^="blob:"]').length === 2);
    await waitDay(D1, (e) => e.moments.length === 3 && e.moments[2].media.length === 3);
    entry = await day(D1);
    const [gymId, coffeeId, cookingId] = entry.moments.map((m) => m.id);
    assert.equal(entry.moments[2].media.find((c) => c.origin === "recording").kind, "audio");
    assert.equal(entry.moments[0].layers.length, 3);
    assert.equal(entry.layers.filter((l) => l.kind === "photo").length, 5, "day page photos untouched");
    // Edit only Coffee Time.
    await page.locator(`[data-action="select-moment"][data-moment="${coffeeId}"]`).first().click();
    await tool("text");
    await (await momentField(page, "title")).fill("Afternoon Coffee Time");
    await waitDay(D1, (e, id) => e.moments.find((m) => m.id === id).title === "Afternoon Coffee Time", coffeeId);
    entry = await day(D1);
    assert.equal(entry.moments.find((m) => m.id === gymId).title, "Gym Session");
    assert.equal(entry.moments.find((m) => m.id === cookingId).body, "番茄牛腩食谱");
    // Reorder: Home Cooking moves above Coffee; collapse Gym.
    await tool("chapters");
    await page.locator(`[data-action="moment-up"][data-moment="${cookingId}"]`).click();
    await page.locator(`[data-action="moment-collapse"][data-moment="${gymId}"]`).click();
    await waitDay(D1, (e, a) => e.moments.map((m) => m.id).join() === a.order && e.moments[0].collapsed, {
      order: [gymId, cookingId, coffeeId].join(),
    });
    // Save one Moment on its own: the saved day gains it before the full save.
    await page.locator(`[data-action="select-moment"][data-moment="${cookingId}"]`).first().click();
    await tool("chapters");
    await page.locator('[data-action="save-moment"]').click();
    await page.waitForFunction((id) => {
      const s = JSON.parse(localStorage.getItem("little-days.v1"));
      const saved = s.entries.find((e) => e.date === "2026-11-03");
      return saved.moments.length === 1 && saved.moments[0].id === id;
    }, cookingId);
    await page.locator('[data-action="save-entry"]').click();
    await require("./signed-in.cjs").homeAfterSave(page);
    entry = (await read()).entries.find((e) => e.date === D1);
    assert.deepEqual(entry.moments.map((m) => m.title), ["Gym Session", "Home Cooking", "Afternoon Coffee Time"]);
    passed.push("4/5 three Moments edited, reordered, saved individually and together");

    // 6/7/8. Calendar Day Detail shows every Moment and plays media in read mode.
    await page.reload();
    await page.waitForSelector(".hero");
    await nav("calendar");
    const cell = page.locator(`[data-action="select-date"][data-date="${D1}"]`);
    for (const dot of ["dot-photo", "dot-video", "dot-audio"])
      assert.equal(await cell.locator(`.${dot}`).count(), 1, dot);
    assert.equal(await cell.locator(".day-dots b").innerText(), "3");
    await cell.click();
    await page.waitForSelector(".day-detail");
    const chapterTitles = await page.$$eval(".moment-chapter .chapter-title", (els) => els.map((el) => el.textContent));
    assert.deepEqual(chapterTitles, ["Gym Session", "Home Cooking", "Afternoon Coffee Time"]);
    assert.match(await page.locator(".day-detail").innerText(), /番茄牛腩食谱/);
    assert.equal(await page.locator('.day-detail [data-action="remove-media"]').count(), 0, "read-only");
    assert.equal(await page.locator(".day-detail [data-layer]").count(), 0, "no editable layers");
    // V3.4: clips sit on the paper and play there.
    await page.waitForFunction(() => document.querySelectorAll('.day-detail .audio-layer audio[src^="blob:"]').length === 2);
    const playAndCheck = async (index) => {
      await page.locator(".day-detail .audio-layer .layer-play").nth(index).click();
      await page.waitForFunction((i) => {
        const player = document.querySelectorAll(".day-detail .audio-layer")[i];
        return player.classList.contains("playing") && player.querySelector("audio").currentTime > 0.05;
      }, index);
    };
    await playAndCheck(0); // uploaded WAV
    await playAndCheck(1); // microphone recording
    assert.equal(await page.locator(".day-detail .audio-layer").nth(0).evaluate((p) => p.querySelector("audio").paused), true, "only one plays");
    await page.locator(".day-detail .audio-layer .layer-play").nth(1).click();
    await page.waitForFunction(() => document.querySelectorAll(".day-detail .audio-layer.playing").length === 0);
    // Seek with the designed progress bar.
    await page.locator(".day-detail video").evaluate(async (video) => {
      video.muted = true;
      await video.play();
    });
    await page.waitForFunction(() => document.querySelector(".day-detail video").currentTime > 0.05);
    await page.locator(".day-detail video").evaluate((video) => video.pause());
    // Photo zoom.
    await page.locator('.day-detail .photo-layer[data-action="zoom-photo"]').last().click();
    await page.waitForFunction(() => document.querySelector("#lightbox").open && document.querySelector("#lightbox-image").src.startsWith("blob:"));
    await page.locator('#lightbox [data-action="close-lightbox"]').click();
    // Leaving the view revokes its temporary audio/video object URLs.
    const audioURL = await page.locator(".day-detail .audio-layer audio").first().getAttribute("src");
    await page.locator('[data-action="day-back"]').click();
    await page.waitForSelector(".calendar-grid");
    assert.equal(
      await page.evaluate((url) => fetch(url).then(() => "alive", () => "revoked"), audioURL),
      "revoked",
    );
    // Edit from Day Detail opens the Studio.
    await cell.click();
    await page.locator('.day-detail-top [data-action="edit-date"]').click();
    await studioDetails(page);
    assert.equal(await page.locator("#editor-date").inputValue(), D1);
    passed.push("6 Day Detail lists all Moments", "7 uploaded audio + recording play in Calendar", "8 video plays in Calendar; URLs revoked on leave");

    // 9/10. Growth notes: save, reopen, edit; no duplicate counts; linked to Journal.
    const today = localToday();
    await nav("growth");
    await page.locator(`.check-button[data-habit="move"][data-date="${today}"]`).first().click();
    await page.locator(`.note-button[data-habit="move"][data-date="${today}"]`).first().click();
    await page.locator('#dialog-form [name="detail"]').fill("Lower Body");
    await page.locator('#dialog-form [name="minutes"]').fill("60");
    await page.locator('#dialog-form [name="note"]').fill("今天左腿的发力感明显比之前好。");
    await page.locator('#dialog-form .mood-radio:has(input[value="✨"])').click();
    await page.locator('#dialog-form [type="submit"]').click();
    await page.locator(`.note-button[data-habit="move"][data-date="${today}"]`).first().click();
    // A written check-in opens to read first; Edit is inside.
    await page.locator('.check-view [data-action="check-note"]').click();
    assert.equal(await page.locator('#dialog-form [name="detail"]').inputValue(), "Lower Body");
    assert.equal(await page.locator('#dialog-form [name="note"]').inputValue(), "今天左腿的发力感明显比之前好。");
    assert.equal(await page.locator('#dialog-form [name="shareNote"]').isChecked(), false);
    await page.locator('#dialog-form [name="note"]').fill("今天左腿的发力感明显比之前好，深蹲更稳。");
    await page.locator('#dialog-form [type="submit"]').click();
    // Duration habit: the check-in dialog records minutes and a note at once.
    // ✎ before checking in: the dialog records minutes and a note at once.
    await page.locator(`.note-button[data-habit="reading"][data-date="${today}"]`).first().click();
    await page.locator('#dialog-form [name="minutes"]').fill("15");
    await page.locator('#dialog-form [name="detail"]').fill("Spanish");
    await page.locator('#dialog-form [name="note"]').fill("终于理解了一个语法点。");
    await page.locator('#dialog-form [type="submit"]').click();
    let s = await read();
    assert.equal(s.checks.filter((c) => c.habitId === "move" && c.date === today).length, 1);
    const move = s.checks.find((c) => c.habitId === "move" && c.date === today);
    assert.deepEqual([move.detail, move.minutes, move.mood, move.shareNote], ["Lower Body", 60, "✨", false]);
    assert.match(move.note, /深蹲更稳/);
    assert.equal(s.checks.find((c) => c.habitId === "reading").minutes, 15);
    // Check-in notes are folded by default; open them once and they stay open.
    await page.locator(".check-history > summary").click();
    assert.match(await page.locator(".check-history").innerText(), /深蹲更稳/);
    // Weekly reflection.
    await page.locator('[data-action="reflection-edit"][data-period="week"]').first().click();
    await page.locator('#dialog-form [name="wentWell"]').fill("完成三次训练");
    await page.locator('#dialog-form [name="nextFocus"]').fill("早点睡");
    await page.locator('#dialog-form [type="submit"]').click();
    assert.match(await page.locator(".reflections").innerText(), /完成三次训练/);
    passed.push("9 Growth notes saved, reopened and edited; weekly reflection");

    // Insert the note into today's journal as a card; deleting a Moment keeps the check-in.
    await nav("studio");
    await tool("growth");
    await page.locator('[data-action="insert-growth"][data-habit="move"]').click();
    await page.waitForSelector(".growth-layer");
    assert.match(await page.locator(".growth-layer").innerText(), /深蹲更稳/);
    assert.equal(await page.locator('[data-action="insert-growth"][data-habit="move"]').isDisabled(), true, "no duplicate card");
    await page.locator('[data-action="add-moment"]').first().click();
    await tool("text");
    await (await momentField(page, "title")).fill("Temporary");
    await tool("growth");
    await page.locator('[data-action="insert-growth"][data-habit="reading"]').click();
    await page.waitForSelector(".growth-layer");
    await tool("chapters");
    await page.locator('.moment-actions [data-action="moment-delete"]').click();
    await page.locator("#confirm-dialog[open] #confirm-ok").click();
    await page.locator('[data-action="save-entry"]').click();
    await require("./signed-in.cjs").homeAfterSave(page);
    s = await read();
    assert.equal(s.checks.filter((c) => c.date === today).length, 2, "check-ins survive page deletion");
    const todayEntry = s.entries.find((e) => e.date === today);
    assert.equal(todayEntry.layers.filter((l) => l.kind === "growth").length, 1);
    assert.equal(todayEntry.moments.length, 0);
    // Editing the original note updates the card and the calendar reading view.
    await nav("growth");
    await page.locator(`.check-history [data-action="check-note"][data-habit="move"]`).click();
    await page.locator('#dialog-form [name="note"]').fill("感想更新：发力更稳定。");
    await page.locator('#dialog-form [type="submit"]').click();
    await nav("calendar");
    await page.locator(`[data-action="select-date"][data-date="${today}"]`).click();
    await page.waitForSelector(".day-detail");
    const dayText = await page.locator(".day-detail").innerText();
    assert.match(dayText, /感想更新：发力更稳定。/);
    assert.match(await page.locator(".day-detail .growth-layer").innerText(), /感想更新/);
    s = await read();
    assert.equal(s.checks.filter((c) => c.habitId === "move" && c.date === today).length, 1);
    passed.push("10 Growth linked to Calendar/Journal without duplicate counting");

    // 13. Language switch changes only the interface.
    const contentBefore = JSON.stringify({ e: s.entries, c: s.checks, r: s.reflections });
    await page.locator('[data-action="day-back"]').click();
    await nav("home");
    await page.locator('[data-page="settings"]').click();
    await page.locator('[data-language="en"]').click();
    await nav("calendar");
    await page.locator(`[data-action="select-date"][data-date="${D1}"]`).click();
    await page.waitForSelector(".day-detail");
    const englishDay = await page.locator(".day-detail").innerText();
    assert.match(englishDay, /PAGE 01|Page 01/i);
    assert.match(englishDay, /Afternoon Coffee Time/);
    assert.match(englishDay, /番茄牛腩食谱/);
    assert.match(await page.locator(".day-detail .audio-layer .layer-play").first().getAttribute("aria-label"), /^Play /);
    await nav("growth");
    assert.match(await page.locator(".reflections").innerText(), /This week/);
    assert.match(await page.locator(".reflections").innerText(), /完成三次训练/);
    await nav("home");
    await page.locator('[data-page="settings"]').click();
    await page.locator('[data-language="zh-CN"]').click();
    s = await read();
    assert.equal(JSON.stringify({ e: s.entries, c: s.checks, r: s.reflections }), contentBefore);
    passed.push("13 zh/en switch keeps all content");

    // 12. Full backup includes photos, Moments, layouts, notes and reflections.
    const downloadPromise = page.waitForEvent("download");
    await page.locator('[data-action="backup"]').click();
    const download = await downloadPromise;
    await page.locator('#choose-dialog [data-bk="yes"]').click(); // V10.40 (C3): say the file was kept
    const chunks = [];
    for await (const chunk of await download.createReadStream()) chunks.push(chunk);
    const backupBuffer = Buffer.concat(chunks);
    const backup = JSON.parse(backupBuffer.toString("utf8"));
    const backupDay = backup.state.entries.find((e) => e.date === D1);
    assert.equal(backupDay.moments.length, 3);
    assert.ok(backup.media.length >= 5 + 3 + 3, "photos, moment photos and clips are included");
    // The usage line is filled in asynchronously after the backup render.
    await page.waitForFunction(() => /MB/.test(document.querySelector("#media-usage")?.textContent || ""), null, { timeout: 8000 });
    const restore = await setup(browser);
    const r = helpers(restore.page);
    await restore.page.goto(base);
    await restore.page.waitForSelector(".hero");
    await r.nav("home");
    await restore.page.locator('[data-page="settings"]').click();
    await restore.page.locator("#backup-input").setInputFiles({ name: "backup.json", mimeType: "application/json", buffer: backupBuffer });
    await restore.page.locator("#confirm-dialog[open] #confirm-ok").click();
    await restore.page.waitForFunction(() => {
      const s = JSON.parse(localStorage.getItem("little-days.v1"));
      return s?.entries.some((e) => e.date === "2026-11-03" && e.moments?.length === 3);
    });
    const restored = await r.read();
    const restoredDay = restored.entries.find((e) => e.date === D1);
    assert.deepEqual(
      photoGeometry(restoredDay.layers).map(({ id, ...g }) => g),
      geometry.map(({ id, ...g }) => g),
    );
    assert.deepEqual(restoredDay.moments.map((m) => m.title), ["Gym Session", "Home Cooking", "Afternoon Coffee Time"]);
    assert.match(restored.checks.find((c) => c.habitId === "move" && c.date === today).note, /感想更新/);
    assert.equal(restored.reflections[0].wentWell, "完成三次训练");
    await r.nav("calendar");
    await restore.page.locator(`[data-action="select-date"][data-date="${D1}"]`).click();
    await restore.page.waitForFunction(() => document.querySelectorAll('.day-detail .audio-layer audio[src^="blob:"]').length === 2);
    await restore.page.locator(".day-detail .audio-layer .layer-play").nth(1).click();
    await restore.page.waitForFunction(() => document.querySelectorAll(".day-detail .audio-layer audio")[1].currentTime > 0.05);
    assert.equal(await restore.page.locator(".day-detail .photo-layer img").count(), 5 + 3);
    assert.deepEqual(restore.errors, []);
    await restore.context.close();
    passed.push("12 backup + restore with Moments, layouts, notes, reflections, playable media");

    // 14. Phone widths: no horizontal overflow in new views.
    for (const width of [375, 390, 430]) {
      await page.setViewportSize({ width, height: 844 });
      await nav("calendar");
      await page.locator(`[data-action="select-date"][data-date="${D1}"]`).click();
      await page.waitForSelector(".day-detail");
      await noOverflow(page, `day detail ${width}`);
      await page.locator('[data-action="day-back"]').click();
      await openStudioDate(page, nav, D1);
      await page.locator(`[data-action="select-moment"][data-moment="${gymId}"]`).first().click();
      await noOverflow(page, `studio moment ${width}`);
      await nav("growth");
      await noOverflow(page, `growth ${width}`);
    }
    if (process.env.SCREENSHOT_DIR) {
      fs.mkdirSync(process.env.SCREENSHOT_DIR, { recursive: true });
      await page.setViewportSize({ width: 390, height: 844 });
      await nav("calendar");
      await page.locator(`[data-action="select-date"][data-date="${D1}"]`).click();
      await page.waitForSelector(".day-detail .audio-layer audio[src^='blob:']", { state: "attached" });
      await page.locator(".day-detail").screenshot({ path: path.join(process.env.SCREENSHOT_DIR, "little-days-v31-day-detail.png") });
      await page.locator('.day-detail-top [data-action="edit-date"]').click();
      await page.waitForSelector("#journal-canvas");
      await page.locator(".chapter-strip").screenshot({ path: path.join(process.env.SCREENSHOT_DIR, "little-days-v31-moments.png") });
      await page.locator("#canvas-wrap").screenshot({ path: path.join(process.env.SCREENSHOT_DIR, "little-days-v31-collage.png") });
    }
    assert.deepEqual(errors, []);
    await context.close();

    // 14 (desktop). Windows-style mouse only: drag, resize, rotate, wheel.
    const desk = await setup(browser, { viewport: { width: 1280, height: 900 }, hasTouch: false });
    const d = helpers(desk.page);
    await desk.page.goto(base);
    await desk.page.waitForSelector(".hero");
    // An empty past date (was a fixed deskDate, which became today):
    // 20 days ago is never today and never a sample day.
    const deskDate = await desk.page.evaluate(() => { const x = new Date(); x.setDate(x.getDate() - 20); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`; });
    await openStudioDate(desk.page, d.nav, deskDate);
    await desk.page.locator("#photos-input").setInputFiles(photos(2, "desk"));
    await skipPhotoEditor(desk.page);
    await d.waitDay(deskDate, (e) => e.layers.filter((l) => l.kind === "photo").length === 2);
    const deskIds = (await d.day(deskDate)).layers.map((l) => l.id);
    await selectLayer(desk.page, deskIds[1]);
    const before = (await d.day(deskDate)).layers.find((l) => l.id === deskIds[1]);
    await mouseDrag(desk.page, await center(desk.page, `[data-layer="${deskIds[1]}"]`), -40, 30);
    await mouseDrag(desk.page, await center(desk.page, `#sel-frame[data-sel="${deskIds[1]}"] .handle-resize`), 40, 30);
    await mouseDrag(desk.page, await center(desk.page, `#sel-frame[data-sel="${deskIds[1]}"] .handle-rotate`), 60, 40);
    const c = await center(desk.page, `[data-layer="${deskIds[1]}"]`);
    await desk.page.mouse.move(c.x, c.y);
    await desk.page.mouse.wheel(0, -120);
    await desk.page.keyboard.down("Shift");
    await desk.page.mouse.wheel(0, -120);
    await desk.page.keyboard.up("Shift");
    await d.waitDay(deskDate, (e, a) => {
      const l = e.layers.find((x) => x.id === a.id);
      return l.x < a.x && l.w > a.w && l.scale > a.scale && l.rotation !== a.rotation;
    }, { id: deskIds[1], x: before.x, w: before.w, scale: before.scale, rotation: before.rotation });
    // Arrow keys nudge the focused, selected layer by 1. (Focus is checked
    // before each try: a late draft-save re-render can take it away.)
    let nudgedOk = false;
    for (let attempt = 0; attempt < 3 && !nudgedOk; attempt++) {
      await desk.page.waitForTimeout(800);
      await selectLayer(desk.page, deskIds[1]);
      await desk.page.locator(`[data-layer="${deskIds[1]}"]`).focus();
      const focused = await desk.page.evaluate((id) => document.activeElement?.dataset?.layer === id, deskIds[1]);
      if (!focused) continue;
      const x0 = (await d.day(deskDate)).layers.find((l) => l.id === deskIds[1]).x;
      await desk.page.keyboard.press("ArrowRight");
      nudgedOk = await desk.page
        .waitForFunction(([date, id, x]) => {
          const s = JSON.parse(localStorage.getItem("little-days.v1"));
          const e = s.drafts[date] || s.entries.find((x) => x.date === date);
          return Math.abs(e.layers.find((l) => l.id === id).x - (x + 1)) < 1e-6;
        }, [deskDate, deskIds[1], x0], { timeout: 4000 })
        .then(() => true, () => false);
    }
    assert.ok(nudgedOk, "ArrowRight nudges the selected layer by 1");
    await noOverflow(desk.page, "desktop studio");
    assert.deepEqual(desk.errors, []);
    await desk.context.close();
    passed.push("14 iPhone touch (390/375/430) and desktop mouse/keyboard");

    // 11. Legacy V1/V3 data: data-URI main photo, emoji layer, old book, old check.
    const legacy = await setup(browser);
    const png =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFklEQVR4nGP4z8DAwMDAxMDAwMDAAAAMAAH7Wb1iAAAAAElFTkSuQmCC";
    const seed = JSON.parse(fs.readFileSync(path.join(resources, "seed.json"), "utf8"));
    const old = {
      schemaVersion: 1,
      habits: seed.habits,
      books: [{ id: "daily", title: "旧的日常本", category: "Daily Life", color: "blush", cover: "🌷" }],
      checks: [{ habitId: "move", date: "2026-10-20", minutes: 0 }],
      drafts: {},
      entries: [
        {
          id: "legacy-1",
          date: "2026-10-20",
          title: "很久以前的一天",
          body: "旧版正文仍然在。",
          mood: "🌷",
          bookId: "daily",
          photo: png,
          template: "vintage",
          font: "serif",
          layers: [{ id: "old-layer", kind: "sticker", text: "🌼", x: 70, y: 60, scale: 1, rotation: -12 }],
          isDemo: false,
          updatedAt: "2026-10-20T10:00:00.000Z",
        },
      ],
    };
    await legacy.page.addInitScript((value) => {
      if (!localStorage.getItem("little-days.v1")) localStorage.setItem("little-days.v1", value);
    }, JSON.stringify(old));
    const l = helpers(legacy.page);
    await legacy.page.goto(base);
    await legacy.page.waitForSelector(".hero");
    const migrated = await l.read();
    const legacyEntry = migrated.entries[0];
    assert.ok(legacyEntry.photo.startsWith("media:"), "legacy photo moved to IndexedDB");
    assert.equal(legacyEntry.body, "旧版正文仍然在。");
    assert.equal(legacyEntry.layers[0].text, "🌼");
    await l.nav("calendar");
    await legacy.page.locator('[data-action="month"][data-delta="-1"]').click();
    await legacy.page.locator('[data-action="select-date"][data-date="2026-10-20"]').click();
    await legacy.page.waitForSelector(".day-detail");
    assert.match(await legacy.page.locator(".day-detail").innerText(), /很久以前的一天/);
    assert.ok((await legacy.page.locator(".day-detail .canvas-photo img").getAttribute("src")).startsWith("blob:"));
    assert.match(await legacy.page.locator(".day-detail").innerText(), /让身体动起来/);
    await legacy.page.locator('.day-detail-top [data-action="edit-date"]').click();
    await l.tool("text");
    assert.equal(await legacy.page.locator('#journal-canvas [data-inline="title"]').innerText(), "很久以前的一天");
    await legacy.page.waitForSelector('.canvas-photo img[src^="blob:"]');
    await l.nav("books");
    await legacy.page.locator('[data-action="pull-book"][data-book="daily"]').click();
    await legacy.page.locator('[data-action="book"][data-book="daily"]').click();
    assert.match(await legacy.page.locator("#app").innerText(), /很久以前的一天/);
    assert.deepEqual(legacy.errors, []);
    await legacy.context.close();
    passed.push("11 legacy records, photos and books open");

    console.log(`V3.1 E2E passed (${passed.length} groups):\n - ${passed.join("\n - ")}\nNo page errors.`);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
