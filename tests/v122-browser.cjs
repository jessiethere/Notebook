// V10.22 · P0 media regression, in Chromium or WebKit (BROWSER=webkit):
// one photo from the photo picker, several photos, a video — then save as a
// draft and come back, 完成 and come back, reload, close the page and open it
// again, close the browser and open it again, and restart the dev server.
// After every step the app's own read-only check (检查照片和视频) must find
// every file "ok", every picture must really load, and no media failure may
// be logged. It starts its own preview server (PORT, default 8093) so the
// restart is real. Not iPhone Safari, not the iOS Simulator.
const pw = require("playwright");
const { spawn } = require("node:child_process");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const SS = require("./signed-in.cjs");
const ROOT = path.join(__dirname, "..");
const PORT = Number(process.env.PORT || 8093);
const base = `http://127.0.0.1:${PORT}`;
const engine = process.env.BROWSER === "webkit" ? pw.webkit : pw.chromium;
const lib = path.join(ROOT, "Packages/LittleDaysCore/Sources/LittleDaysCore/Resources/Photos");
const PHOTOS = ["latte-art", "corner-cafe", "home-dinner", "coffee-cheers"].map((n) => path.join(lib, `LD-photo-${n}.jpg`));
const opts = { headless: true, viewport: { width: 390, height: 844 }, hasTouch: true, ...(engine === pw.chromium ? { executablePath: process.env.CHROMIUM_PATH || undefined, isMobile: true } : {}) };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let server;
async function startServer() {
  server = spawn("python3", ["tools/preview.py", "--host", "127.0.0.1", "--port", String(PORT)], { cwd: ROOT, stdio: "ignore" });
  for (let i = 0; i < 50; i++) {
    try {
      const r = await fetch(base + "/index.html");
      if (r.ok) return;
    } catch {}
    await sleep(200);
  }
  throw new Error("preview server did not start");
}
async function stopServer() {
  if (!server) return;
  const done = new Promise((r) => server.once("exit", r));
  server.kill();
  await done;
  server = null;
}

(async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ld-v122-"));
  const results = [];
  const errors = [];
  let ctx, page;
  const launch = async () => {
    ctx = await engine.launchPersistentContext(dir, opts);
    await ctx.addInitScript(SS.seed);
    page = ctx.pages()[0] || (await ctx.newPage());
    page.setDefaultTimeout(20000);
    page.on("pageerror", (e) => errors.push(e.message));
  };
  const home = async () => {
    await page.goto(base);
    await page.waitForSelector(".hero");
  };
  const studio = async () => {
    await page.locator('[data-action="today-write"]').first().tap();
    await page.waitForSelector("#journal-canvas");
    await page.evaluate(() => document.activeElement?.blur?.());
  };
  const leave = async () => {
    await page.locator('[data-action="studio-back"]').first().tap();
    await page.waitForFunction(() => !document.querySelector("#phone.in-studio") || document.querySelector("#choose-dialog[open] .exit-sheet"));
    if (await page.locator("#choose-dialog[open] .exit-sheet").count()) await page.locator('.exit-sheet [data-action="studio-draft-exit"]').tap();
    await page.waitForSelector(".hero");
  };
  const settle = () => page.waitForFunction(() => ["saved", "failed"].includes(document.querySelector("#draft-status")?.dataset.state), null, { timeout: 20000 });
  // The page with n pictures (pages are tapped in the strip like a person would).
  const toPage = async (n) => {
    const chips = page.locator(".chapter-chip").filter({ has: page.locator("img") });
    for (let i = 0; i < (await chips.count()); i++) {
      await chips.nth(i).evaluate((el) => { el.scrollIntoView({ inline: "center" }); el.click(); });
      await sleep(600);
      if ((await page.locator("#journal-canvas .photo-layer img").count()) === n) return;
    }
  };
  const toVideo = async () => {
    const chips = page.locator(".chapter-chip:not(.add)");
    for (let i = 0; i < (await chips.count()); i++) {
      await chips.nth(i).evaluate((el) => { el.scrollIntoView({ inline: "center" }); el.click(); });
      await sleep(600);
      if (await page.locator("#journal-canvas video").count()) {
        await page.waitForFunction(() => { const v = document.querySelector("#journal-canvas video"); return v && (v.readyState >= 1 || v.error); }, null, { timeout: 15000 }).catch(() => {});
        return;
      }
    }
  };
  const shown = () =>
    page.evaluate(async () => {
      for (let i = 0; i < 40; i++) {
        const imgs = [...document.querySelectorAll("#journal-canvas .photo-layer img, .reader .photo-layer img")];
        if (imgs.every((x) => x.complete)) break;
        await new Promise((r) => setTimeout(r, 100));
      }
      const imgs = [...document.querySelectorAll("#journal-canvas .photo-layer img, .reader .photo-layer img")];
      const vids = [...document.querySelectorAll("#journal-canvas video, .reader video")];
      return { imgs: imgs.length, loaded: imgs.filter((x) => x.naturalWidth > 0).length, missing: document.querySelectorAll(".photo-missing, .media-layer.missing, .media-broken").length, vids: vids.length, vidErr: vids.filter((v) => v.error).length };
    });
  // The app's own read-only check (the same code as Settings → 检查照片和视频).
  const check = () =>
    page.evaluate(async () => {
      const { MediaStore } = await import("./js/media.mjs");
      const MC = await import("./js/media-check.mjs");
      const m = new MediaStore();
      const state = JSON.parse(localStorage.getItem("little-days.v1"));
      const r = await MC.inspectMedia(m, state);
      const env = await MC.environment();
      m.close();
      const events = JSON.parse(localStorage.getItem("little-days.events") || "[]").filter((e) => /^media_(save_failed|missing|read_failed|unreadable|decode_failed|url_failed|not_saved)$/.test(e.e));
      return { counts: r.counts, used: r.referenced, legacy: r.legacy, engine: env.engine, persisted: env.persisted, failures: events.map((e) => e.e + (e.err ? ":" + e.err : "")) };
    });
  const step = async (label, expect) => {
    const s = await shown();
    const c = await check();
    results.push({ label, ...s, ...c.counts, used: c.used, failures: c.failures.length });
    assert.equal(s.missing, 0, `${label}: nothing shown as missing`);
    if (expect.imgs != null) assert.deepEqual([s.imgs, s.loaded], [expect.imgs, expect.imgs], `${label}: pictures load`);
    if (expect.vids != null) assert.deepEqual([s.vids, s.vidErr], [expect.vids, 0], `${label}: video has no error`);
    assert.equal(c.counts.ok, c.used, `${label}: every stored file checks ok ${JSON.stringify(c.counts)}`);
    assert.deepEqual(c.failures, [], `${label}: no media failure logged`);
    return c;
  };

  try {
    await startServer();
    await launch();
    await home();
    await studio();
    // ---- one photo, through the photo picker (a file chooser, as on a phone)
    const chooser = page.waitForEvent("filechooser");
    await page.locator('.tool-dock [data-action="add-photos"]').tap();
    await page.locator('#choose-dialog [data-action="choose-album"], #choose-dialog .choose-album, #choose-dialog [data-action="album"]').first().tap();
    await (await chooser).setFiles(PHOTOS[0]);
    await sleep(1500);
    if (await page.locator("#photo-editor[open]").count()) await page.locator('#photo-editor [data-pe-action="cancel"]').click();
    await page.waitForSelector("#journal-canvas .photo-layer img");
    await settle();
    const first = await step("1 photo from the picker", { imgs: 1 });
    // ---- several photos on a new page
    await page.locator('.chapter-chips [data-action="add-moment"]').evaluate((el) => el.click());
    await sleep(400);
    await page.locator("#photos-input").setInputFiles(PHOTOS.slice(1));
    await sleep(1500);
    if (await page.locator("#photo-editor[open]").count()) await page.locator('#photo-editor [data-pe-action="cancel"]').click();
    await page.waitForFunction(() => document.querySelectorAll("#journal-canvas .photo-layer img").length >= 3);
    await settle();
    await step("3 photos on a second page", { imgs: 3 });
    // ---- a video on a third page (recorded by the browser itself)
    await page.locator('.chapter-chips [data-action="add-moment"]').evaluate((el) => el.click());
    await sleep(400);
    const vid = await page.evaluate(async () => {
      const type = ["video/webm;codecs=vp8", "video/mp4"].find((t) => MediaRecorder.isTypeSupported(t));
      const c = document.createElement("canvas"); c.width = 320; c.height = 240; const x = c.getContext("2d");
      const st = c.captureStream(12); const rec = new MediaRecorder(st, { mimeType: type }); const ch = [];
      rec.ondataavailable = (e) => ch.push(e.data); const done = new Promise((r) => (rec.onstop = r)); rec.start(100);
      for (let i = 0; i < 14; i++) { x.fillStyle = i % 2 ? "#C9D7C1" : "#E8CFCF"; x.fillRect(0, 0, 320, 240); await new Promise((r) => setTimeout(r, 70)); }
      rec.stop(); await done; st.getTracks().forEach((t) => t.stop());
      return { type: type.split(";")[0], bytes: [...new Uint8Array(await new Blob(ch, { type }).arrayBuffer())] };
    });
    await page.locator("#video-input").setInputFiles({ name: vid.type === "video/mp4" ? "walk.mp4" : "walk.webm", mimeType: vid.type, buffer: Buffer.from(vid.bytes) });
    await page.waitForSelector('#journal-canvas video[src^="blob:"]');
    await sleep(1500);
    await settle();
    await step(`a video (${vid.type}) on a third page`, { vids: 1 });
    const all = async (label) => {
      await toPage(1);
      await step(label + " · 1-photo page", { imgs: 1 });
      await toPage(3);
      await step(label + " · 3-photo page", { imgs: 3 });
      await toVideo();
      const v = await step(label + " · video page", { vids: 1 });
      const ready = await page.evaluate(() => document.querySelector("#journal-canvas video")?.readyState || 0);
      assert.ok(ready >= 1, `${label}: the video's data loads (readyState ${ready})`);
      return v;
    };
    // ---- saved as a draft, back in
    await leave();
    await studio();
    await all("draft, back in");
    // ---- 完成, back in
    await page.locator('.sv-top [data-action="save-entry"]').tap();
    await page.waitForSelector(".reader");
    await sleep(800);
    await step("完成 → reader", {});
    if (await page.locator("#choose-dialog[open]").count()) await page.evaluate(() => document.querySelector("#choose-dialog").close());
    await page.locator('[data-action="reader-back"]').tap();
    await page.waitForSelector("#phone:not(.in-reader)");
    await home();
    await studio();
    await all("完成, back in");
    await leave();
    // ---- reload
    await page.reload();
    await page.waitForSelector(".hero");
    await studio();
    await all("reload");
    await leave();
    // ---- close the page, open a new one
    await page.close();
    page = await ctx.newPage();
    page.setDefaultTimeout(20000);
    page.on("pageerror", (e) => errors.push(e.message));
    await home();
    await studio();
    await all("page closed and opened again");
    await leave();
    // ---- close the browser, open it again
    await ctx.close();
    await launch();
    await home();
    await studio();
    await all("browser closed and opened again");
    await leave();
    // ---- restart the dev server
    await stopServer();
    await startServer();
    await page.reload();
    await page.waitForSelector(".hero");
    await studio();
    const last = await all("dev server restarted");
    await leave();
    // ---- Settings → 检查照片和视频 (read-only), as a person would open it
    await page.locator('[data-action="nav"][data-page="settings"]').first().tap();
    await page.locator('[data-action="media-check"]').tap();
    await page.waitForSelector("#choose-dialog[open] .media-check .check-row");
    const sheet = await page.locator("#choose-dialog .media-check").innerText();
    assert.match(sheet, /正常\s*6/);
    assert.match(sheet, /运行地址\s*http:\/\/127\.0\.0\.1/);
    if (process.env.SHOTS) await page.screenshot({ path: path.join(process.env.SHOTS, `v122-check-${process.env.BROWSER || "chromium"}.png`) });
    await page.locator('[data-action="media-check-copy"]').tap();
    await page.waitForFunction(() => /已复制|长按全选/.test(document.querySelector("#toast")?.innerText || ""));
    const shownText = await page.locator("#choose-dialog .check-text").evaluate((el) => (el.hidden ? "" : el.value));
    if (shownText) assert.match(shownText, /media check[\s\S]*ok 6 · missing 0/);
    results.push({ label: "Settings → 检查照片和视频", imgs: 0, loaded: 0, vids: 0, vidErr: 0, ok: 6, missing: 0, unreadable: 0, decode: 0, badref: 0, failures: 0 });
    assert.ok(first.used >= 1);
    assert.deepEqual(errors, []);
  } finally {
    await ctx?.close().catch(() => {});
    await stopServer().catch(() => {});
    fs.rmSync(dir, { recursive: true, force: true });
    const engineName = process.env.BROWSER === "webkit" ? "WebKit" : "Chromium";
    console.log(`\n${engineName} · step | pictures shown/loaded | videos (errors) | check: ok / missing / unreadable / decode / badref | failures logged`);
    for (const r of results) console.log(`  ${r.label.padEnd(44)} ${r.loaded}/${r.imgs}  ${r.vids}(${r.vidErr})  ${r.ok}/${r.missing}/${r.unreadable}/${r.decode}/${r.badref}  ${r.failures}`);
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
