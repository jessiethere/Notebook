// V10.21 · P0 media persistence: photos and videos added today are still
// there after leaving Studio, after a reload, after the browser is closed and
// opened again, and in the reader — 1 photo, 5 photos, 2 photos + a video
// (with its cover), a cropped photo, a page made in the magazine view and
// opened in Customize. Media is stored as bytes (not Blob / File objects);
// older Blob records still open (converted in place); a file that is really
// gone is shown as missing and the page is not reported "saved".
// Chromium with a persistent profile (closing / reopening is real) — not
// iPhone Safari and not the iOS Simulator.
const { chromium, devices } = require("playwright");
const SS = require("./signed-in.cjs");
SS(chromium);
const { withExifTime } = require("./exif-fixture.cjs");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const base = process.env.PREVIEW_URL || "http://127.0.0.1:8080";
const lib = path.join(__dirname, "../Packages/LittleDaysCore/Sources/LittleDaysCore/Resources/Photos");
const iphone = devices["iPhone 13"];
const opts = { headless: true, executablePath: process.env.CHROMIUM_PATH || undefined, viewport: iphone.viewport, userAgent: iphone.userAgent, isMobile: true, hasTouch: true };
const PHOTOS = ["latte-art", "corner-cafe", "home-dinner", "coffee-cheers", "morning-yoga"].map((n) => path.join(lib, `LD-photo-${n}.jpg`));

(async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ld-v121-"));
  // SS(chromium) seeds a signed-in account on newContext only; a persistent
  // profile gets the same seed here (it only fills keys that are missing).
  const launch = async () => {
    const c = await chromium.launchPersistentContext(dir, opts);
    await c.addInitScript(SS.seed);
    await c.addInitScript(SS.acceptGroups);
    return c;
  };
  let ctx = await launch();
  let page = ctx.pages()[0] || (await ctx.newPage());
  const passed = [];
  passed.push = (line) => { console.log("✓", line); return Array.prototype.push.call(passed, line); };
  const errors = [];
  const watch = (p) => p.on("pageerror", (e) => errors.push(e.message));
  watch(page);
  try {
    await page.goto(base);
    await page.waitForSelector(".hero");
    const today = await page.evaluate(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; });
    // What the page shows now: photos that really loaded, clips with a source.
    const shown = () =>
      page.evaluate(() => {
        const imgs = [...document.querySelectorAll("#journal-canvas .photo-layer img, .reader .photo-layer img")];
        const vids = [...document.querySelectorAll("#journal-canvas video, .reader video")];
        return { imgs: imgs.length, loaded: imgs.filter((i) => i.complete && i.naturalWidth > 0).length, missing: document.querySelectorAll(".photo-missing, .media-layer.missing").length, vids: vids.length, vidOk: vids.filter((v) => (v.getAttribute("src") || "").startsWith("blob:") && !v.error).length, posters: vids.filter((v) => (v.getAttribute("poster") || "").startsWith("blob:")).length };
      });
    const settle = () => page.waitForFunction(() => document.querySelector("#draft-status")?.dataset.state === "saved", null, { timeout: 10000 });
    const pageWith = async (n) => {
      // The chapter chip of the page that has n photos (its thumbnail shows one).
      const chips = page.locator(".chapter-chip").filter({ has: page.locator("img") });
      for (let i = 0; i < (await chips.count()); i++) {
        // (the strip scrolls sideways under undo / redo: tap the chip itself)
        await chips.nth(i).evaluate((el) => { el.scrollIntoView({ inline: "center" }); el.click(); });
        await page.waitForTimeout(500);
        const s = await shown();
        if (s.imgs === n) return s;
      }
      return shown();
    };
    const reopenStudio = async () => {
      await page.locator('[data-action="today-write"]').first().tap();
      await page.waitForSelector("#journal-canvas");
    };
    const leaveStudio = async () => {
      await SS.leaveStudio(page);
      await page.waitForSelector(".hero");
    };
    const addPage = async () => {
      await page.locator('.chapter-chips [data-action="add-moment"]').tap();
      await page.waitForTimeout(300);
    };

    // ------------------------------------------------ three pages: 1 photo · 5 photos · 2 photos + video
    await reopenStudio();
    await page.evaluate(() => document.activeElement?.blur?.());
    const add = async (files) => {
      await page.locator("#photos-input").setInputFiles(files);
      await page.waitForTimeout(1200);
      if (await page.locator("#photo-editor[open]").count()) await SS.skipPhotoEditor(page);
      await page.waitForFunction((n) => document.querySelectorAll("#journal-canvas .photo-layer img").length >= n, files.length, { timeout: 10000 });
    };
    await add([PHOTOS[0]]);
    await settle();
    await addPage();
    await add(PHOTOS);
    await settle();
    await addPage();
    await add(PHOTOS.slice(0, 2));
    const video = Buffer.from(await page.evaluate(async () => {
      const c = document.createElement("canvas"); c.width = 160; c.height = 120; const x = c.getContext("2d");
      const s = c.captureStream(10); const rec = new MediaRecorder(s, { mimeType: "video/webm;codecs=vp8" }); const ch = [];
      rec.ondataavailable = (e) => ch.push(e.data); const done = new Promise((r) => (rec.onstop = r)); rec.start();
      for (let i = 0; i < 10; i++) { x.fillStyle = i % 2 ? "#C9D7C1" : "#E8CFCF"; x.fillRect(0, 0, 160, 120); await new Promise((r) => setTimeout(r, 70)); }
      rec.stop(); await done; s.getTracks().forEach((t) => t.stop());
      return [...new Uint8Array(await new Blob(ch, { type: "video/webm" }).arrayBuffer())];
    }));
    await page.locator("#video-input").setInputFiles({ name: "walk.webm", mimeType: "video/webm", buffer: video });
    await page.waitForSelector('#journal-canvas video[src^="blob:"]');
    // Crop the first photo of this page with the crop editor.
    // (the video sits on top of part of it: tap a corner that shows)
    const photo = page.locator("#journal-canvas .photo-layer").first();
    const pb = await photo.boundingBox();
    const vb = await page.locator("#journal-canvas .video-layer").boundingBox();
    const corners = [[pb.x + 10, pb.y + 10], [pb.x + pb.width - 10, pb.y + 10], [pb.x + 10, pb.y + pb.height - 10], [pb.x + pb.width - 10, pb.y + pb.height - 10]];
    const [cx, cy] = corners.find(([x, y]) => !(x > vb.x && x < vb.x + vb.width && y > vb.y && y < vb.y + vb.height)) || corners[0];
    await page.touchscreen.tap(cx, cy);
    await page.waitForSelector('.tool-dock.ctx[data-ctx="photo"]');
    await page.locator('.tool-dock [data-action="crop-open"]').tap();
    await page.waitForSelector("#crop-editor[open] .ce-box");
    await page.locator('#crop-editor [data-ce-ratio="1:1"]').tap();
    await page.locator('#crop-editor [data-ce="done"]').tap();
    await page.waitForSelector("#crop-editor:not([open])", { state: "attached" });
    await settle();
    const now = await shown();
    assert.deepEqual([now.imgs, now.loaded, now.vids, now.vidOk], [2, 2, 1, 1]);
    passed.push("added: a page with 1 photo, one with 5, one with 2 photos + a video (cover made) and a cropped photo — all shown; 已保存 only after the media check");

    // Stored as bytes, every reference has its record.
    const store = () =>
      page.evaluate(async () => {
        const s = JSON.parse(localStorage.getItem("little-days.v1"));
        const refs = [...new Set(JSON.stringify(s).match(/media:[a-f0-9-]{36}/g) || [])].map((r) => r.slice(6));
        const db = await new Promise((res) => { const r = indexedDB.open("little-days-media"); r.onsuccess = () => res(r.result); });
        const all = await new Promise((res) => { const q = db.transaction("media").objectStore("media").getAll(); q.onsuccess = () => res(q.result); });
        db.close();
        const byId = new Map(all.map((r) => [r.id, r]));
        return { refs: refs.length, missing: refs.filter((id) => !byId.has(id)).length, asBytes: refs.filter((id) => byId.get(id)?.bytes instanceof ArrayBuffer && !byId.get(id).blob).length, sized: refs.filter((id) => byId.get(id)?.bytes?.byteLength > 0).length };
      });
    let st = await store();
    assert.ok(st.refs >= 9, `${st.refs} media referenced`);
    assert.deepEqual([st.missing, st.asBytes, st.sized], [0, st.refs, st.refs], "every reference stored as real bytes");
    passed.push(`IndexedDB: all ${st.refs} referenced files stored as their bytes (no Blob / File objects), none missing`);

    // ------------------------------------------------ leave Studio, come back
    const check = async (label) => {
      for (const n of [1, 5]) {
        const s = await pageWith(n);
        assert.deepEqual([s.imgs, s.loaded, s.missing], [n, n, 0], `${label}: the ${n}-photo page`);
      }
      const s = await pageWith(2);
      assert.deepEqual([s.imgs, s.loaded, s.missing, s.vids, s.vidOk, s.posters], [2, 2, 0, 1, 1, 1], `${label}: 2 photos + video (+ cover)`);
    };
    await leaveStudio();
    await reopenStudio();
    await check("left Studio and came back");
    passed.push("left Studio and came back: 1 / 5 / 2 photos + video and its cover all load");

    await page.reload();
    await page.waitForSelector(".hero");
    await reopenStudio();
    await check("after a reload");
    passed.push("after a reload: all load");

    // ------------------------------------------------ close the browser, open it again
    await leaveStudio();
    await ctx.close();
    ctx = await launch();
    page = ctx.pages()[0] || (await ctx.newPage());
    watch(page);
    await page.goto(base);
    await page.waitForSelector(".hero");
    await reopenStudio();
    await check("browser closed and opened again");
    passed.push("browser closed and opened again (same profile): all load");

    // ------------------------------------------------ 完成 → the reader
    await page.locator('.sv-top [data-action="save-entry"]').tap();
    await page.waitForSelector(".reader", { timeout: 10000 });
    const ok = page.locator("dialog[open] button").filter({ hasText: "好" });
    if (await ok.count()) await ok.first().tap();
    // Every page of the book, through the page list (目录).
    let readerOk = 0;
    await page.locator('.reader [data-action="reader-thumbs"]').first().tap();
    await page.waitForSelector('[data-action="reader-go"]');
    const pagesInBook = await page.locator('[data-action="reader-go"]').count();
    for (let at = 0; at < pagesInBook; at++) {
      // (the list folds away after a choice; the same buttons stay in the page)
      await page.locator(`[data-action="reader-go"][data-at="${at}"]`).first().evaluate((el) => el.click());
      await page.waitForTimeout(700);
      const s = await shown();
      if (s.imgs) {
        assert.equal(s.loaded, s.imgs, `reader page ${at}: every photo loads`);
        assert.equal(s.missing, 0);
        if (s.vids) assert.equal(s.vidOk, s.vids);
        readerOk++;
      }
    }
    assert.ok(readerOk >= 3, `reader pages with media checked: ${readerOk}`);
    await page.reload();
    await page.waitForSelector(".hero, .reader");
    passed.push(`完成 → the reader: ${readerOk} pages with media, every photo / video loads`);

    // ------------------------------------------------ an older Blob record still opens (converted in place)
    const legacyId = "00000000-0000-4000-8000-00000000c0de";
    await page.evaluate(async ([id, t]) => {
      const bytes = await (await fetch("library/photos/LD-photo-latte-art.jpg")).arrayBuffer();
      const db = await new Promise((res) => { const r = indexedDB.open("little-days-media"); r.onsuccess = () => res(r.result); });
      await new Promise((res, rej) => { const tx = db.transaction("media", "readwrite"); tx.objectStore("media").put({ id, blob: new Blob([bytes], { type: "image/jpeg" }), mime: "image/jpeg", size: bytes.byteLength, kind: "photo", name: "old" }); tx.oncomplete = res; tx.onerror = () => rej(tx.error); });
      db.close();
      const s = JSON.parse(localStorage.getItem("little-days.v1"));
      const d = s.drafts[t] || s.entries.find((e) => e.date === t);
      d.moments.push({ id: "legacy-page", time: "", title: "旧照片", body: "", tags: [], layers: [{ id: "legacy-layer", kind: "photo", text: "old.jpg", mediaRef: `media:${id}`, x: 50, y: 40, w: 60, h: 40, scale: 1, rotation: 0 }], media: [] });
      if (!s.drafts[t]) s.drafts[t] = d;
      localStorage.setItem("little-days.v1", JSON.stringify(s));
    }, [legacyId, today]);
    await page.reload();
    await page.waitForSelector(".hero");
    await reopenStudio();
    await page.locator(".chapter-chip").filter({ hasText: "旧照片" }).tap();
    const legacy = await page.evaluate(async (id) => {
      for (let i = 0; i < 30 && !document.querySelector(`.photo-layer img[src^="blob:"]`); i++) await new Promise((r) => setTimeout(r, 100));
      const img = [...document.querySelectorAll("#journal-canvas .photo-layer img")].find((i) => i.complete && i.naturalWidth > 0);
      const db = await new Promise((res) => { const r = indexedDB.open("little-days-media"); r.onsuccess = () => res(r.result); });
      const rec = await new Promise((res) => { const q = db.transaction("media").objectStore("media").get(id); q.onsuccess = () => res(q.result); });
      db.close();
      return { shown: Boolean(img), bytes: rec?.bytes instanceof ArrayBuffer, blob: Boolean(rec?.blob), name: rec?.name };
    }, legacyId);
    assert.deepEqual(legacy, { shown: true, bytes: true, blob: false, name: "old" }, "an older record opens and is rewritten as bytes, same id, its fields kept");
    passed.push("an older Blob record (as V10.20 and before stored it) still opens and is rewritten as bytes in place (same id, nothing deleted)");

    // ------------------------------------------------ a file that is really gone
    const goneId = "00000000-0000-4000-8000-0000000000ff";
    await page.evaluate(async ([id, t]) => {
      const s = JSON.parse(localStorage.getItem("little-days.v1"));
      const d = s.drafts[t];
      d.moments.push({ id: "gone-page", time: "", title: "缺失", body: "", tags: [], layers: [{ id: "gone-layer", kind: "photo", text: "gone.jpg", mediaRef: `media:${id}`, x: 50, y: 40, w: 60, h: 40, scale: 1, rotation: 0 }], media: [] });
      localStorage.setItem("little-days.v1", JSON.stringify(s));
    }, [goneId, today]);
    await page.reload();
    await page.waitForSelector(".hero");
    await reopenStudio();
    await page.locator(".chapter-chip").filter({ hasText: "缺失" }).tap();
    await page.waitForSelector("#journal-canvas .photo-missing");
    assert.match(await page.locator("#journal-canvas .photo-missing").first().innerText(), /照片读取不到/);
    // Typing makes the page save: it must not claim 已保存 while a file is missing.
    await page.locator('#journal-canvas [data-inline="title"]').click().catch(() => {});
    await page.keyboard.type("！");
    await page.waitForFunction(() => document.querySelector("#draft-status")?.dataset.state === "failed", null, { timeout: 8000 });
    assert.match(await page.locator("#toast").innerText(), /没能存进这台设备/);
    st = await store();
    assert.equal(st.missing, 1, "reported, not replaced");
    passed.push("a file that is really gone: the page says 照片读取不到 (no fake picture), and saving shows 保存失败 with a clear message instead of 已保存");

    // ------------------------------------------------ backup: export with the media, restore on an empty device
    const backupJSON = await page.evaluate(async () => {
      const { MediaStore } = await import("./js/media.mjs");
      const s = JSON.parse(localStorage.getItem("little-days.v1"));
      for (const d of Object.values(s.drafts)) d.moments = d.moments.filter((m) => m.id !== "gone-page");
      const m = new MediaStore();
      const b = await m.backup(s);
      m.close();
      return JSON.stringify(b);
    });
    const backup = JSON.parse(backupJSON);
    assert.ok(backup.media.length >= 10 && backup.media.every((x) => /^data:(image|video|audio)\//.test(x.data)), `${backup.media.length} files`);
    assert.ok(backup.media.some((x) => x.data.startsWith("data:video/")), "the video itself is in the backup");
    passed.push(`backup export includes the media themselves (${backup.media.length} files, the photos and the video as data)`);

    await ctx.close();
    const dir2 = fs.mkdtempSync(path.join(os.tmpdir(), "ld-v121-new-"));
    ctx = await chromium.launchPersistentContext(dir2, opts);
    await ctx.addInitScript(SS.seed);
    await ctx.addInitScript(SS.acceptGroups);
    page = ctx.pages()[0] || (await ctx.newPage());
    watch(page);
    await page.goto(base);
    await page.waitForSelector(".hero");
    await page.locator("#backup-input").setInputFiles({ name: "backup.json", mimeType: "application/json", buffer: Buffer.from(backupJSON) });
    await page.locator("#confirm-dialog[open] #confirm-ok").click();
    await page.waitForFunction(() => /恢复/.test(document.querySelector("#toast")?.innerText || ""), null, { timeout: 30000 });
    await reopenStudio();
    await check("restored on an empty device");
    st = await store();
    assert.deepEqual([st.missing, st.asBytes], [0, st.refs]);
    passed.push("restored into an empty profile: 1 / 5 / 2 photos + video (+ cover) all load, stored as bytes");
    fs.rmSync(dir2, { recursive: true, force: true });

    // ------------------------------------------------ magazine view → Customize → leave → reload
    await leaveStudio();
    await ctx.close();
    const dir3 = fs.mkdtempSync(path.join(os.tmpdir(), "ld-v121-mag-"));
    ctx = await chromium.launchPersistentContext(dir3, opts);
    await ctx.addInitScript(SS.seed);
    await ctx.addInitScript(SS.acceptGroups);
    page = ctx.pages()[0] || (await ctx.newPage());
    watch(page);
    await page.goto(base);
    await page.waitForSelector(".hero");
    const chooser = page.waitForEvent("filechooser");
    await page.locator('[data-action="today-photos"]').first().tap();
    await (await chooser).setFiles(PHOTOS.slice(0, 3));
    await page.waitForSelector(".story-canvas .scrapbook-page");
    if (await page.locator('.story-tabs [data-action="story-page"]').count() > 1) await page.locator('.story-tabs [data-action="story-page"]').nth(1).tap();
    await page.locator('[data-action="story-adjust"]').tap();
    await page.waitForSelector("#journal-canvas .photo-layer img");
    await settle();
    const magN = (await shown()).imgs;
    assert.ok(magN >= 1);
    await page.reload();
    await page.waitForSelector(".hero");
    await reopenStudio();
    const mag = await pageWith(magN);
    assert.deepEqual([mag.imgs, mag.loaded, mag.missing], [magN, magN, 0], "magazine → Customize page after a reload");
    passed.push(`a page made in the magazine view and opened in Customize: its ${magN} photos load after a reload`);
    await ctx.close();
    fs.rmSync(dir3, { recursive: true, force: true });

    assert.deepEqual(errors, []);
  } catch (error) {
    await page.screenshot({ path: path.join(os.tmpdir(), "v121-fail.png") }).catch(() => {});
    throw error;
  } finally {
    await ctx.close().catch(() => {});
    fs.rmSync(dir, { recursive: true, force: true });
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
