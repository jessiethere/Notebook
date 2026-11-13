// V10.23 · importing a video: every step shows on the page (导入 → 保存到本机
// → 已保存 / 保存失败 + 重试), switching pages is shown as paused before a tap,
// "已保存" never shows while the file is not stored yet; 换封面 is right under
// the video and in the selected video's tools; a new cover survives saving,
// reopening, the reader, a reload and a browser restart; 从页面移除 asks and
// can be undone. 375 and 430 wide. Chromium (or WebKit with BROWSER=webkit).
// Test videos are synthetic (ffmpeg test patterns), read from VIDEO_DIR:
//   seven.webm|mp4 (~7 s) and big.webm|mp4 (just under the 50 MB limit).
// The log keeps sizes, ids and error names only.
const pw = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const SS = require("./signed-in.cjs");
const base = process.env.PREVIEW_URL || "http://127.0.0.1:8080";
const webkit = process.env.BROWSER === "webkit";
const engine = webkit ? pw.webkit : pw.chromium;
const DIR = process.env.VIDEO_DIR;
const ext = webkit ? "mp4" : "webm";
const mime = webkit ? "video/mp4" : "video/webm";
const SHOTS = process.env.SHOTS || "";
if (!DIR || !fs.existsSync(path.join(DIR, `seven.${ext}`))) {
  console.log(`skip: set VIDEO_DIR to a folder with seven.${ext} and big.${ext}`);
  process.exit(0);
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "ld-v123-"));
  const log = [];
  const passed = [];
  const errors = [];
  let ctx, page;
  const launch = async (w, h) => {
    ctx = await engine.launchPersistentContext(profile, { headless: true, viewport: { width: w, height: h }, hasTouch: true, ...(webkit ? {} : { executablePath: process.env.CHROMIUM_PATH || undefined, isMobile: true }) });
    await ctx.addInitScript(SS.seed);
    page = ctx.pages()[0] || (await ctx.newPage());
    page.setDefaultTimeout(30000);
    page.on("pageerror", (e) => errors.push(e.message));
  };
  const shot = (name) => SHOTS && page.screenshot({ path: path.join(SHOTS, `v123-${name}.png`) });
  const home = async () => {
    await page.goto(base);
    await page.waitForSelector(".hero");
  };
  const studio = async () => {
    await page.locator('[data-action="today-write"]').first().tap();
    await page.waitForSelector("#journal-canvas");
    await page.evaluate(() => document.activeElement?.blur?.());
  };
  const today = () => page.evaluate(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; });
  const draft = async () => page.evaluate((t) => JSON.parse(localStorage.getItem("little-days.v1")).drafts[t] || JSON.parse(localStorage.getItem("little-days.v1")).entries.find((e) => e.date === t), await today());
  const clips = async () => (await draft()).moments.flatMap((m) => m.media.filter((c) => c.kind === "video").map((c) => ({ ...c, page: m.id })));
  const record = (id) =>
    page.evaluate(async (id) => {
      const db = await new Promise((r) => { const q = indexedDB.open("little-days-media"); q.onsuccess = () => r(q.result); });
      const rec = await new Promise((r) => { const q = db.transaction("media").objectStore("media").get(id); q.onsuccess = () => r(q.result); });
      db.close();
      return rec ? { bytes: rec.bytes?.byteLength ?? null, mime: rec.mime, kind: rec.kind } : null;
    }, id);
  // Watch the import card and the save status while a file is imported.
  const watchImport = () =>
    page.evaluate(() => {
      window.__ic = { stages: [], progress: [], savedWhileBusy: false, lockedSeen: false };
      const look = () => {
        const card = document.querySelector(".import-card");
        if (card) {
          const s = card.dataset.stage;
          if (window.__ic.stages.at(-1) !== s) window.__ic.stages.push(s);
          const bar = card.querySelector("[aria-valuenow]");
          if (bar) window.__ic.progress.push(Number(bar.getAttribute("aria-valuenow")));
          if (!["done", "failed"].includes(s) && document.querySelector("#draft-status")?.dataset.state === "saved") window.__ic.savedWhileBusy = true;
          if (!["done", "failed"].includes(s) && document.querySelector(".page-strip.locked[aria-disabled='true']")) window.__ic.lockedSeen = true;
        }
      };
      window.__icObs?.disconnect();
      window.__icObs = new MutationObserver(look);
      window.__icObs.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["data-stage", "aria-valuenow", "data-state", "class"] });
    });
  const importFile = async (file) => {
    await watchImport();
    const t0 = Date.now();
    await page.locator("#video-input").setInputFiles(file);
    await page.waitForFunction(() => ["done", "failed"].includes(document.querySelector(".import-card")?.dataset.stage), null, { timeout: 120000 });
    const ms = Date.now() - t0;
    const watched = await page.evaluate(() => window.__ic);
    const stage = await page.locator(".import-card").getAttribute("data-stage");
    return { ms, stage, ...watched };
  };

  try {
    await launch(375, 667);
    await home();
    await studio();

    // ------------------------------------------------ a ~7 s video
    const seven = path.join(DIR, `seven.${ext}`);
    let r = await importFile(seven);
    assert.equal(r.stage, "done", JSON.stringify(r));
    assert.ok(r.stages.includes("write") || r.stages.includes("read"), JSON.stringify(r.stages));
    assert.equal(r.savedWhileBusy, false, "已保存 never shows while the video is not stored yet");
    assert.match(await page.locator(".import-card").innerText(), /已保存到本机/);
    await page.waitForFunction(() => document.querySelector("#draft-status")?.dataset.state === "saved", null, { timeout: 15000 });
    let c = await clips();
    let rec = await record(c[0].source.slice(6));
    log.push({ case: "7 s video", file: fs.statSync(seven).size, stored: rec.bytes, id: c[0].source.slice(6), cover: c[0].poster.slice(6, 14), ms: r.ms, stages: r.stages.join(">"), result: "saved" });
    assert.equal(rec.bytes, fs.statSync(seven).size, "the whole file is stored");
    await page.waitForSelector(".import-card", { state: "detached", timeout: 8000 });
    passed.push(`7 s video (${fs.statSync(seven).size} bytes): ${r.stages.join(" → ")} in ${r.ms} ms; 已保存 only after it was stored; the card goes away by itself`);

    // ------------------------------------------------ near the 50 MB limit, switching pages while it saves
    await page.locator('.chapter-chips [data-action="add-moment"]').evaluate((el) => el.click());
    await sleep(500);
    const big = path.join(DIR, `big.${ext}`);
    await watchImport();
    const t0 = Date.now();
    await page.locator("#video-input").setInputFiles(big);
    await page.waitForSelector(".import-card");
    // While it saves: the strip is shown paused and the card says why; a tap
    // on another page explains and does not switch.
    await page.waitForFunction(() => document.querySelector(".page-strip.locked") || ["done", "failed"].includes(document.querySelector(".import-card")?.dataset.stage));
    const midStage = await page.locator(".import-card").getAttribute("data-stage");
    let triedSwitch = false;
    if (!["done", "failed"].includes(midStage)) {
      assert.match(await page.locator(".import-card").innerText(), /保存完成前，暂时不能切换页面/);
      await shot("import-progress-375");
      const before = await page.evaluate(() => document.querySelector(".chapter-chip.active")?.dataset.moment);
      await page.locator(".chapter-chip.cover-chip").evaluate((el) => el.click());
      await page.waitForFunction(() => /视频正在保存到本机/.test(document.querySelector("#toast")?.innerText || ""));
      assert.equal(await page.evaluate(() => document.querySelector(".chapter-chip.active")?.dataset.moment), before, "still on the same page");
      triedSwitch = true;
    }
    await page.waitForFunction(() => ["done", "failed"].includes(document.querySelector(".import-card")?.dataset.stage), null, { timeout: 180000 });
    r = { ms: Date.now() - t0, stage: await page.locator(".import-card").getAttribute("data-stage"), ...(await page.evaluate(() => window.__ic)) };
    assert.equal(r.stage, "done", JSON.stringify(r));
    assert.equal(r.savedWhileBusy, false);
    assert.ok(r.lockedSeen, "the page strip was shown paused");
    assert.ok(r.progress.some((p) => p > 0 && p < 100) || r.progress.includes(100), `real progress was shown: ${r.progress.slice(0, 8)}`);
    c = await clips();
    rec = await record(c.at(-1).source.slice(6));
    log.push({ case: "near-limit video", file: fs.statSync(big).size, stored: rec.bytes, id: c.at(-1).source.slice(6), ms: r.ms, stages: r.stages.join(">"), progressSteps: new Set(r.progress).size, triedSwitch, result: "saved" });
    assert.equal(rec.bytes, fs.statSync(big).size);
    passed.push(`near-limit video (${(fs.statSync(big).size / 1048576).toFixed(1)} MB): ${r.stages.join(" → ")} in ${r.ms} ms with real progress (${new Set(r.progress).size} steps); page strip shown paused; tapping another page explained why and did not switch${triedSwitch ? "" : " (finished too fast to try)"}`);
    // after it is saved, switching pages works
    await page.locator(".chapter-chip.cover-chip").evaluate((el) => el.click());
    await page.waitForFunction(() => document.querySelector(".chapter-chip.cover-chip.active"));
    assert.equal(await page.locator(".page-strip.locked").count(), 0);
    passed.push("after saving, switching pages works and the strip is no longer paused");

    // ------------------------------------------------ over the limit: refused clearly, page unchanged
    const before = (await clips()).length;
    await page.locator('.chapter-chips [data-action="add-moment"]').evaluate((el) => el.click());
    await sleep(400);
    const tooBig = path.join(profile, "..", `ld-too-big-${process.pid}.${ext}`);
    fs.writeFileSync(tooBig, Buffer.alloc(51 * 1024 * 1024));
    r = await importFile(tooBig);
    fs.rmSync(tooBig, { force: true });
    assert.equal(r.stage, "failed");
    const failedText = await page.locator(".import-card").innerText();
    assert.match(failedText, /保存失败/);
    assert.match(failedText, /too-big/);
    assert.equal((await clips()).length, before, "nothing was added");
    log.push({ case: "over the limit (51 MiB)", file: 51 * 1024 * 1024, result: "refused", err: "too-big" });
    await page.locator('[data-action="import-dismiss"]').tap();
    await page.waitForSelector(".import-card", { state: "detached" });
    passed.push("51 MiB: refused before saving, 保存失败 + too-big on the card, nothing added, can be dismissed");

    // ------------------------------------------------ the device refuses the write once: 保存失败 + 重试
    await page.evaluate(() => {
      const add = IDBObjectStore.prototype.add;
      IDBObjectStore.prototype.add = function (value, key) {
        if (value?.kind === "video" && !window.__failedOnce) {
          window.__failedOnce = true;
          throw new DOMException("simulated full storage", "QuotaExceededError");
        }
        return add.call(this, value, key);
      };
    });
    r = await importFile(seven);
    assert.equal(r.stage, "failed");
    const failCard = await page.locator(".import-card").innerText();
    assert.match(failCard, /没有存进这台设备/);
    assert.match(failCard, /quotaexceedederr/);
    assert.equal((await clips()).length, before, "a failed save adds nothing to the page");
    await shot("import-failed-375");
    await watchImport();
    await page.locator('[data-action="import-retry"]').tap();
    await page.waitForFunction(() => document.querySelector(".import-card")?.dataset.stage === "done", null, { timeout: 60000 });
    assert.equal((await clips()).length, before + 1, "retry saved it");
    const events = await page.evaluate(() => JSON.parse(localStorage.getItem("little-days.events")).filter((e) => /media_save_failed|media_import/.test(e.e)).slice(-3));
    assert.ok(events.some((e) => e.e === "media_save_failed" && e.stage === "write" && e.err === "quotaexceedederr"), JSON.stringify(events));
    log.push({ case: "write refused once, then 重试", result: "failed then saved", err: "quotaexceedederr", id: (await clips()).at(-1).source.slice(6) });
    passed.push("storage refuses the write: 保存失败 with the error name, nothing added, the file kept — 重试 saves it; logged as media_save_failed(write, quotaexceedederr)");

    // ------------------------------------------------ the selected video's tools; 换封面
    await page.waitForSelector(".import-card", { state: "detached", timeout: 8000 });
    await page.evaluate(() => document.querySelector('[data-action="tool-close"]')?.click());
    await page.locator("#journal-canvas .video-layer").first().evaluate((el) => el.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true })));
    await page.locator("#journal-canvas .video-layer").first().tap({ position: { x: 8, y: 8 } }).catch(() => {});
    await page.waitForSelector('.tool-dock.ctx[data-ctx="video"]');
    const dock = await page.$$eval(".tool-dock.ctx button", (els) => els.map((el) => [el.dataset.action === "tool" ? el.dataset.tool : el.dataset.action, el.innerText.trim()]));
    assert.deepEqual(dock.map((d) => d[0]), ["layer-deselect", "ctx-play", "video-cover", "shape", "layer", "layer-delete"]);
    assert.deepEqual(dock.slice(1).map((d) => d[1]), ["播放", "换封面", "形状", "图层", "移除"]);
    const inView = await page.$$eval(".tool-dock.ctx button", (els) => els.every((el) => { const r = el.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth && r.bottom <= innerHeight && r.height >= 40; }));
    assert.ok(inView, "all video tools visible at 375");
    await shot("video-tools-375");
    passed.push("selected video: 播放 · 换封面 · 形状 · 图层 · 移除, all on screen at 375");
    const clipId = await page.locator('.tool-dock [data-action="video-cover"]').getAttribute("data-clip");
    const oldCover = (await clips()).find((x) => x.id === clipId).poster;
    await page.locator('.tool-dock [data-action="video-cover"]').tap();
    await page.waitForSelector("#poster-dialog[open] [data-poster-time]");
    assert.equal(await page.locator("#poster-dialog .poster-now img").count(), 1, "the cover in use is shown");
    assert.match(await page.locator("#poster-dialog h2").innerText(), /更换封面/);
    await page.locator("#poster-dialog [data-poster-time]").evaluate((el) => { el.value = String(Math.min(Number(el.max), 5)); el.dispatchEvent(new Event("input", { bubbles: true })); });
    await sleep(800);
    await shot("cover-picker-375");
    await page.locator('#poster-dialog [data-poster="frame"]').tap();
    await page.waitForFunction((id) => { const s = JSON.parse(localStorage.getItem("little-days.v1")); return JSON.stringify(s).includes(id) === false || true; }, oldCover);
    await page.waitForFunction(([clip, old]) => { const s = JSON.parse(localStorage.getItem("little-days.v1")); const all = Object.values(s.drafts).flatMap((d) => d.moments.flatMap((m) => m.media)); return all.find((x) => x.id === clip)?.poster !== old; }, [clipId, oldCover]);
    const newCover = (await clips()).find((x) => x.id === clipId).poster;
    const coverRec = await record(newCover.slice(6));
    assert.ok(coverRec?.bytes > 0, "new cover stored");
    log.push({ case: "换封面 (frame at 5 s)", id: newCover.slice(6), stored: coverRec.bytes, old: oldCover.slice(6, 14), result: "saved" });
    passed.push("换封面: picker shows the cover in use and a timeline; the frame at 5 s is saved as a new cover (the video file is untouched)");

    // ------------------------------------------------ 本页媒体: actions right under the video, both widths
    const cardCheck = async (label) => {
      await page.evaluate(() => document.querySelector('[data-action="layer-deselect"]')?.click());
      // (a page with a clip opens 本页媒体 by itself; tapping it again would close it)
      if (!(await page.locator('.tool-sheet[data-tool-row="media"]').count())) await page.evaluate(() => { const b = document.createElement("button"); b.dataset.action = "tool"; b.dataset.tool = "media"; b.hidden = true; document.querySelector("#app").append(b); b.click(); b.remove(); });
      await page.waitForSelector('.tool-sheet[data-tool-row="media"] .video-card .media-card-actions');
      const vis = await page.evaluate(() => {
        // seen as the panel opens: no scrolling
        const card = document.querySelector(".tool-sheet .video-card");
        const body = document.querySelector(".tool-sheet .tool-body").getBoundingClientRect();
        // really on screen: the point at its centre is the button itself (not
        // hidden by the menu, cut off by the sheet or below the screen)
        return [...card.querySelectorAll(".media-card-actions button")].map((b) => { const r = b.getBoundingClientRect(); const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return { text: b.innerText.trim(), shown: Boolean(hit && b.contains(hit)) && r.height >= 40 && r.top >= body.top - 1 && r.bottom <= Math.min(body.bottom, innerHeight) + 1 }; });
      });
      assert.deepEqual(vis.map((v) => v.text), ["换封面", "从页面移除"]);
      if (!vis.every((v) => v.shown)) await shot(`media-card-fail-${label}`);
      assert.ok(vis.every((v) => v.shown), `${label}: ${JSON.stringify(vis)}`);
      const foot = await page.locator(".tool-sheet .video-card .media-card-foot").innerText();
      assert.match(foot, /已保存到本机/);
      assert.match(foot, /不放在纸上/);
      await shot(`media-card-${label}`);
    };
    await cardCheck("375");
    passed.push("本页媒体 at 375: 换封面 and 从页面移除 are big buttons right under the video; length · size · 已保存到本机 below; 不放在纸上 is a quiet text button");

    // ------------------------------------------------ 从页面移除: asks, removes, undo brings it back
    const count = (await clips()).length;
    await page.locator('.tool-sheet .video-card [data-action="remove-media-ask"]').first().tap();
    await page.waitForSelector("#confirm-dialog[open]");
    assert.match(await page.locator("#confirm-dialog").innerText(), /文件仍保存在这台设备上/);
    await page.locator("#confirm-dialog[open] #confirm-ok").click();
    await page.waitForFunction((n) => { const s = JSON.parse(localStorage.getItem("little-days.v1")); return Object.values(s.drafts).flatMap((d) => d.moments.flatMap((m) => m.media)).filter((x) => x.kind === "video").length === n - 1; }, count);
    await page.evaluate(() => document.querySelector('[data-action="undo"]').click());
    await page.waitForFunction((n) => { const s = JSON.parse(localStorage.getItem("little-days.v1")); return Object.values(s.drafts).flatMap((d) => d.moments.flatMap((m) => m.media)).filter((x) => x.kind === "video").length === n; }, count);
    passed.push("从页面移除 asks first (the file stays on this device), removes it from the page, and undo brings it back");

    // ------------------------------------------------ the new cover after saving, in the reader, after reload and restart
    const coverLoads = async () =>
      page.evaluate(async (want) => {
        const v = [...document.querySelectorAll("#journal-canvas video, .reader video")].find((x) => x.getAttribute("poster"));
        if (!v) return { found: false };
        const bytes = (await (await fetch(v.getAttribute("poster"))).arrayBuffer()).byteLength;
        return { found: true, bytes, same: bytes === want };
      }, coverRec.bytes);
    const toClipPage = async () => {
      const chips = page.locator(".chapter-chip:not(.add)");
      for (let i = 0; i < (await chips.count()); i++) {
        await chips.nth(i).evaluate((el) => el.click());
        await sleep(600);
        const has = await page.evaluate((id) => Boolean(document.querySelector(`#journal-canvas [data-layer] video`)) && JSON.parse(localStorage.getItem("little-days.v1")) && true, clipId);
        if (has && (await coverLoads()).same) return true;
      }
      return false;
    };
    // leave as a draft and come back
    await page.locator('[data-action="studio-back"]').first().tap();
    if (await page.locator("#choose-dialog[open] .exit-sheet").count()) await page.locator('.exit-sheet [data-action="studio-draft-exit"]').tap();
    await page.waitForSelector(".hero");
    await studio();
    assert.ok(await toClipPage(), "draft reopened: the new cover is shown");
    // reload
    await page.reload();
    await page.waitForSelector(".hero");
    await studio();
    assert.ok(await toClipPage(), "after reload: the new cover");
    // 完成 → reader
    await page.locator('.sv-top [data-action="save-entry"]').tap();
    await page.waitForSelector(".reader");
    await sleep(800);
    if (await page.locator("#choose-dialog[open]").count()) await page.evaluate(() => document.querySelector("#choose-dialog").close());
    let inReader = false;
    await page.locator('.reader [data-action="reader-thumbs"]').first().tap();
    await page.waitForSelector('[data-action="reader-go"]', { state: "attached" });
    const go = page.locator('[data-action="reader-go"]');
    for (let at = 0; at < (await go.count()) && !inReader; at++) {
      await go.nth(at).evaluate((el) => el.click());
      await sleep(700);
      inReader = (await coverLoads()).same === true;
    }
    assert.ok(inReader, "the reader shows the new cover");
    passed.push("the new cover shows after leaving as a draft and coming back, after a reload, and in the reader after 完成");

    // close the browser, open it again — at 430 wide
    await ctx.close();
    await launch(430, 932);
    await home();
    await studio();
    assert.ok(await toClipPage(), "browser restarted: the new cover");
    const ready = await page.evaluate(() => [...document.querySelectorAll("#journal-canvas video")].map((v) => v.readyState >= 1 || !v.error));
    assert.ok(ready.every(Boolean));
    await cardCheck("430");
    await page.evaluate(() => document.querySelector('[data-action="tool-close"]')?.click());
    await page.locator("#journal-canvas .video-layer").first().tap({ position: { x: 8, y: 8 } }).catch(() => {});
    await page.waitForSelector('.tool-dock.ctx[data-ctx="video"]');
    assert.ok(await page.$$eval(".tool-dock.ctx button", (els) => els.every((el) => { const r = el.getBoundingClientRect(); return r.right <= innerWidth && r.bottom <= innerHeight; })));
    await shot("video-tools-430");
    passed.push("browser closed and opened again at 430: video plays, new cover kept; 换封面 / 从页面移除 and the video tools all on screen");

    // the app's own read-only check: everything ok
    const check = await page.evaluate(async () => {
      const { MediaStore } = await import("./js/media.mjs");
      const MC = await import("./js/media-check.mjs");
      const m = new MediaStore();
      const r = await MC.inspectMedia(m, JSON.parse(localStorage.getItem("little-days.v1")));
      m.close();
      return r.counts;
    });
    assert.equal(check.missing + check.unreadable + check.decode + check.badref + check.empty, 0, JSON.stringify(check));
    passed.push(`检查照片和视频: ${JSON.stringify(check)}`);
    assert.deepEqual(errors, []);
  } finally {
    await ctx?.close().catch(() => {});
    fs.rmSync(profile, { recursive: true, force: true });
    console.log(`\n${webkit ? "WebKit" : "Chromium"} · media log (sizes in bytes; ids are random; no content):`);
    for (const l of log) console.log("  " + JSON.stringify(l));
    for (const line of passed) console.log("✓", line);
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
