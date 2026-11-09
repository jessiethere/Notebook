// Sign in on this device, the welcome tour, Settings back/close, the Studio
// start screen and the photo editor (filters / crop / adjust / title).
// Synthetic and bundled sample images only.
const { chromium } = require("playwright");
const { menu, openToday } = require("./signed-in.cjs");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const base = process.env.PREVIEW_URL || "http://127.0.0.1:8080";
const sample = fs.readFileSync(path.join(__dirname, "../Packages/LittleDaysCore/Sources/LittleDaysCore/Resources/Media/lake.jpg"));

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || undefined });
  const passed = [];
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, timezoneId: "America/New_York" });
    // The sign-in page and tour are Labs modules (hidden on a new install).
    await context.addInitScript(() => {
      if (localStorage.getItem("little-days.labs") === null) localStorage.setItem("little-days.labs", "1");
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const account = () => page.evaluate(() => JSON.parse(localStorage.getItem("little-days.account") || "null"));
    const draft = () =>
      page.evaluate(() => {
        const d = new Date();
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        return JSON.parse(localStorage.getItem("little-days.v1") || "null")?.drafts?.[key];
      });
    await page.goto(base);

    // 1. Sign-in page first; real providers are clearly "coming soon".
    await page.waitForSelector(".login");
    assert.equal(await page.locator("#navigation button").count(), 0, "no menu before signing in");
    assert.equal(await page.locator(".login-provider[disabled]").count(), 2);
    assert.match(await page.locator(".login-note").innerText(), /不会上传/);
    await page.locator('[data-action="login-language"][data-language="en"]').click();
    assert.match(await page.locator(".login").innerText(), /Start on this device/);
    await page.locator('[data-action="login-language"][data-language="zh-CN"]').click();
    await page.locator('[data-action="login-avatar"][data-avatar="🐰"]').click();
    await page.locator("#login-name").fill("小满");
    await page.locator('[data-action="login-local"]').click();
    passed.push("sign-in page: local account, providers marked coming soon, language switch");

    // 2. Welcome tour once: next / back / finish; replay from Settings.
    await page.waitForSelector(".tour-card");
    assert.match(await page.locator(".tour-card h2").innerText(), /小满/);
    const steps = await page.locator(".tour-dots i").count();
    await page.locator('[data-action="tour-next"]').click();
    await page.locator('[data-action="tour-prev"]').click();
    assert.match(await page.locator(".tour-count").innerText(), /^1 \//);
    for (let i = 0; i < steps; i++) await page.locator('[data-action="tour-next"]').click();
    await page.waitForSelector("#tour", { state: "hidden" });
    assert.equal((await account()).onboarded, true);
    await page.reload();
    await page.waitForSelector(".hero");
    assert.equal(await page.locator("#tour").isHidden(), true, "tour only once");
    // The demo profile starts with the same name and avatar.
    const demo = await page.evaluate(() => JSON.parse(localStorage.getItem("little-days.demo-social")));
    assert.deepEqual([demo.profile.name, demo.profile.avatar], ["小满", "🐰"]);
    passed.push(`welcome tour (${steps} cards) once; profile seeded from sign-in`);

    // 3. Settings: back and close return to where you were; replay; sign out keeps data.
    await menu(page, "growth");
    await menu(page, "home");
    await page.locator('[data-action="nav"][data-page="settings"]').click();
    await page.locator(".settings-nav .back-button").click();
    await page.waitForSelector(".hero");
    await page.locator('[data-action="nav"][data-page="settings"]').click();
    await page.locator(".settings-nav .back-button").click();
    await page.waitForSelector(".hero");
    await page.locator('[data-action="nav"][data-page="settings"]').click();
    await page.locator('[data-action="tour-replay"]').click();
    await page.waitForSelector(".tour-card");
    await page.locator('[data-action="tour-skip"]').click();
    await page.waitForSelector("#tour", { state: "hidden" });
    const before = await page.evaluate(() => localStorage.getItem("little-days.v1"));
    await page.locator('[data-action="sign-out"]').click();
    await page.locator("#confirm-dialog[open] #confirm-ok").click();
    await page.waitForSelector(".login-back");
    assert.match(await page.locator(".login-back").innerText(), /小满/);
    assert.equal(await page.evaluate(() => localStorage.getItem("little-days.v1")), before, "journal untouched by sign-out");
    await page.locator('[data-action="login-local"]').click();
    await page.waitForSelector(".hero");
    assert.equal(await page.locator("#tour").isHidden(), true, "no second tour after signing back in");
    passed.push("Settings back/close, replay tour, sign out and back in without losing data");

    // 4. The record sheet: three ways in, open today's pages, or close.
    await menu(page, "studio");
    await page.waitForSelector("#choose-dialog[open] .quick-sheet");
    assert.deepEqual(await page.$$eval('[data-action="quick-way"]', (els) => els.map((el) => el.dataset.way)), ["photo", "write", "draw"]);
    assert.equal(await page.locator('[data-action="quick-continue"]').count(), 1, "today already has a page");
    await page.locator('#choose-dialog [data-action="choose-close"]').click();
    await page.waitForSelector(".hero");
    await menu(page, "studio");
    await page.locator('[data-action="quick-way"][data-way="write"]').click();
    await page.locator('[data-action="quick-start"]').click();
    await page.waitForSelector('#journal-canvas [data-inline="title"]');
    await page.keyboard.type("让我开心的一件事");
    let d = await page.waitForFunction(() => {
      const d = new Date();
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      return JSON.parse(localStorage.getItem("little-days.v1"))?.drafts?.[key]?.moments?.some((m) => m.title === "让我开心的一件事");
    });
    passed.push("record sheet: three ways in, open today's pages, close, just write starts a new page");

    // 5. Photos on a free layout page → editor: filter, 1:1 crop, warmth, title.
    await menu(page, "studio");
    await page.locator('[data-action="quick-more"][data-more="layout"]').click();
    await page.locator('#journal-canvas [data-action="add-photos"]').click();
    await page.waitForSelector("#choose-dialog[open]");
    const chooser = page.waitForEvent("filechooser");
    await page.locator('#choose-dialog [data-action="choose-album"]').click();
    await (await chooser).setFiles([
      { name: "lake-a.jpg", mimeType: "image/jpeg", buffer: sample },
      { name: "lake-b.jpg", mimeType: "image/jpeg", buffer: sample },
    ]);
    await page.waitForSelector("#photo-editor[open] .pe-frame");
    assert.equal(await page.locator(".pe-strip button").count(), 2);
    assert.equal(await page.locator(".pe-filters button").count(), 8);
    await page.locator('[data-pe-action="filter"][data-filter="warm"]').click();
    assert.match(await page.locator(".pe-image").getAttribute("style"), /sepia/);
    await page.locator('[data-pe-action="tab"][data-tab="crop"]').click();
    await page.locator('[data-pe-action="ratio"][data-ratio="1:1"]').click();
    const frame = await page.locator(".pe-frame").boundingBox();
    assert.ok(Math.abs(frame.width - frame.height) < 2, "square frame");
    // Drag the picture inside the square crop.
    await page.mouse.move(frame.x + frame.width / 2, frame.y + frame.height / 2);
    await page.mouse.down();
    await page.mouse.move(frame.x + frame.width / 2 + 60, frame.y + frame.height / 2, { steps: 5 });
    await page.mouse.up();
    await page.locator('[data-pe-action="tab"][data-tab="adjust"]').click();
    await page.locator('[data-pe="warmth"]').evaluate((el) => {
      el.value = "30";
      el.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await page.locator('[data-pe-action="tab"][data-tab="text"]').click();
    await page.locator('[data-pe-text="value"]').fill("湖边的周末");
    await page.locator('[data-pe-action="text-style"][data-style="label"]').click();
    assert.match(await page.locator(".pe-text").innerText(), /湖边的周末/);
    // Second photo: mono only.
    await page.locator('[data-pe-action="pick"][data-index="1"]').click();
    await page.locator('[data-pe-action="tab"][data-tab="filter"]').click();
    await page.locator('[data-pe-action="filter"][data-filter="mono"]').click();
    await page.locator('[data-pe-action="done"]').click();
    await page.waitForSelector("#photo-editor:not([open])", { state: "attached" });
    await page.waitForFunction(() => {
      const d = new Date();
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const draft = JSON.parse(localStorage.getItem("little-days.v1"))?.drafts?.[key];
      return [draft, ...(draft?.moments || [])].some((p) => (p?.layers || []).filter((l) => l.sourceRef).length === 2);
    });
    d = await draft();
    const pageWithPhotos = [d, ...d.moments].find((p) => (p.layers || []).some((l) => l.sourceRef));
    const edited = pageWithPhotos.layers.filter((l) => l.sourceRef);
    assert.deepEqual(edited.map((l) => l.edit.filter), ["warm", "mono"]);
    assert.equal(edited[0].edit.ratio, "1:1");
    assert.equal(edited[0].edit.warmth, 30);
    assert.equal(edited[0].edit.text.value, "湖边的周末");
    assert.ok(edited[0].edit.x !== 50, "drag moved the crop");
    assert.ok(edited.every((l) => l.mediaRef !== l.sourceRef), "edited picture is a new file; original kept");
    passed.push("start with photos → editor: filter, square crop + drag, warmth, label title, per-photo edits");

    // 6. The saved pictures really are edited: square, warm, grey; originals intact.
    const check = await page.evaluate(async ([a, b]) => {
      const db = await new Promise((resolve, reject) => {
        const request = indexedDB.open("little-days-media");
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      const get = (id) =>
        new Promise((resolve) => {
          const r = db.transaction("media").objectStore("media").get(id.slice(6));
          r.onsuccess = () => resolve(r.result);
        });
      const stats = async (ref) => {
        const record = await get(ref);
        const bitmap = await createImageBitmap(record.blob);
        const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
        const ctx = canvas.getContext("2d");
        ctx.drawImage(bitmap, 0, 0);
        const data = ctx.getImageData(0, 0, bitmap.width, bitmap.height).data;
        let r = 0, g = 0, bl = 0, grey = 0, n = 0;
        for (let i = 0; i < data.length; i += 40) {
          r += data[i]; g += data[i + 1]; bl += data[i + 2];
          if (Math.abs(data[i] - data[i + 1]) < 3 && Math.abs(data[i + 1] - data[i + 2]) < 3) grey++;
          n++;
        }
        return { w: bitmap.width, h: bitmap.height, r: r / n, b: bl / n, grey: grey / n };
      };
      return { warm: await stats(a.mediaRef), original: await stats(a.sourceRef), mono: await stats(b.mediaRef) };
    }, edited);
    assert.equal(check.warm.w, check.warm.h, "square crop saved");
    assert.notEqual(check.original.w, check.original.h, "original keeps its shape");
    assert.ok(check.warm.r - check.warm.b > check.original.r - check.original.b + 10, "warm filter saved into pixels");
    assert.ok(check.mono.grey > 0.95, "mono saved as grey");
    passed.push("saved files: square + warm, grey for mono; original untouched");

    // 7. Re-edit from the original; resetting everything restores the original file.
    await page.locator(`[data-layer="${edited[1].id}"]`).focus();
    await page.keyboard.press("Enter");
    const layerTool = page.locator('[data-action="tool"][data-tool="layer"]');
    if ((await layerTool.getAttribute("aria-expanded")) !== "true") await layerTool.click();
    await page.locator('[data-action="photo-edit"]').click();
    await page.waitForSelector("#photo-editor[open] .pe-frame");
    assert.equal(await page.locator('[data-pe-action="filter"][data-filter="mono"][aria-pressed="true"]').count(), 1, "re-opens with the saved settings");
    await page.locator('[data-pe-action="filter"][data-filter="original"]').click();
    await page.locator('[data-pe-action="done"]').click();
    await page.waitForSelector("#photo-editor:not([open])", { state: "attached" });
    await page.waitForFunction((id) => {
      const d = new Date();
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const draft = JSON.parse(localStorage.getItem("little-days.v1")).drafts[key];
      const layer = [draft, ...draft.moments].flatMap((p) => p.layers || []).find((l) => l.id === id);
      return layer && !layer.sourceRef;
    }, edited[1].id);
    d = await draft();
    const restored = [d, ...d.moments].flatMap((p) => p.layers || []).find((l) => l.id === edited[1].id);
    assert.equal(restored.mediaRef, edited[1].sourceRef, "back to the original picture");
    passed.push("re-edit opens saved settings; back to Original restores the original file");

    // 8. Backups keep the originals of edited photos.
    const refs = await page.evaluate(async () => {
      const { mediaReferences } = await import("./js/media.mjs");
      return [...mediaReferences(JSON.parse(localStorage.getItem("little-days.v1")))];
    });
    assert.ok(refs.includes(edited[0].sourceRef.slice(6)), "original is part of the backup set");
    passed.push("backup includes originals of edited photos");

    assert.deepEqual(errors, []);
    console.log(`V3.6 E2E passed (${passed.length} groups):\n - ${passed.join("\n - ")}\nNo page errors.`);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
