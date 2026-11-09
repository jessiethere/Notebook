// V6.0 E2E: recommended background music. While writing: ♫ → choose one of
// the original soft pieces (listen first). Reading that day plays it (pause
// with the chip); leaving stops it; flipping the book plays it on that page;
// the page's video carries it.
const { chromium, devices } = require("playwright");
require("./signed-in.cjs")(chromium);
const assert = require("node:assert/strict");
const base = process.env.PREVIEW_URL || "http://127.0.0.1:8080";
const shots = process.env.SHOTS_DIR || "";

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || undefined, args: ["--autoplay-policy=user-gesture-required"] });
  const passed = [];
  try {
    const context = await browser.newContext({ ...devices["iPhone 13"] });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(base);
    await page.waitForSelector(".hero");
    const today = await page.evaluate(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; });
    const bgm = () => page.evaluate(() => { const a = document.querySelector("#background-music"); return a ? { music: a.dataset.music, playing: !a.paused } : { music: "", playing: false }; });

    // 1. Writing: ♫ in the sound menu opens the music sheet; listen, then choose.
    await page.locator('#navigation [data-page="studio"]').tap();
    await page.waitForSelector("#choose-dialog[open] .quick-sheet");
    await page.locator('[data-action="quick-way"][data-way="write"]').tap();
    await page.locator('[data-action="quick-start"]').tap();
    await page.waitForSelector('#journal-canvas [data-inline="title"]');
    await page.keyboard.type("有音乐的一页");
    await page.evaluate(() => document.activeElement.blur());
    await page.locator('.stage-bar [data-action="add-sound"], #journal-canvas [data-action="add-sound"]').first().tap();
    await page.locator('.sound-menu [data-action="music-sheet"]').tap();
    await page.waitForSelector("#choose-dialog[open] .music-sheet");
    assert.equal(await page.locator(".music-row").count(), 5);
    assert.match(await page.locator(".music-sheet").innerText(), /原创/);
    assert.match(await page.locator(".music-row").first().innerText(), /午后咖啡[\s\S]*轻松 · 0:49/);
    await page.locator('[data-action="music-preview"][data-music="rainy-window"]').tap();
    await page.waitForFunction(() => { const a = document.querySelector("#background-music"); return a && !a.paused && a.dataset.music === "rainy-window" && a.currentTime > 0.2; });
    assert.equal(await page.locator('[data-music-preview="rainy-window"].playing').count(), 1, "the preview button shows it is playing");
    if (shots) await page.screenshot({ path: `${shots}/v57-sheet.png` });
    await page.locator('[data-action="music-pick"][data-music="rainy-window"]').tap();
    await page.waitForSelector("#choose-dialog:not([open])", { state: "attached" });
    assert.deepEqual(await bgm(), { music: "", playing: false }, "no music while writing");
    assert.match(await page.locator(".studio-music .music-chip").innerText(), /窗外下雨/);
    await page.locator('[data-action="save-entry"]').tap();
    await page.waitForSelector(".hero");
    const saved = await page.evaluate((d) => JSON.parse(localStorage.getItem("little-days.v1")).entries.find((e) => e.date === d), today);
    const withMusic = saved.moments.find((m) => m.title === "有音乐的一页");
    assert.equal(withMusic.music, "rainy-window", "saved on the page");
    passed.push("writing: ♫ background music → listen → choose; saved with the page; nothing plays while writing");

    // 2. Reading the day plays it; the chip pauses / plays; leaving stops it.
    await page.locator('#navigation [data-page="calendar"]').tap();
    await page.locator(`[data-action="select-date"][data-date="${today}"]`).first().tap();
    await page.waitForSelector(".day-detail .day-music .music-chip");
    await page.waitForFunction(() => { const a = document.querySelector("#background-music"); return a && !a.paused && a.dataset.music === "rainy-window"; });
    await page.waitForSelector('.day-music .music-chip.playing[aria-pressed="true"]');
    if (shots) await page.screenshot({ path: `${shots}/v57-day.png` });
    await page.locator(".day-music .music-chip").tap();
    await page.waitForFunction(() => document.querySelector("#background-music").paused);
    assert.equal(await page.locator(".day-music .music-chip.playing").count(), 0);
    await page.locator(".day-masthead h1").click();
    await page.waitForTimeout(300);
    assert.equal((await bgm()).playing, false, "stays paused after a tap elsewhere");
    await page.locator(".day-music .music-chip").tap();
    await page.waitForFunction(() => !document.querySelector("#background-music").paused);
    await page.locator('[data-action="day-back"]').tap();
    await page.waitForFunction(() => document.querySelector("#background-music").paused);
    assert.equal((await bgm()).music, "", "leaving the day stops the music");
    passed.push("reading the day plays its music; the chip pauses and plays; leaving stops it");

    // 3. Flipping the book: the page with music plays it.
    await page.locator('#navigation [data-page="home"]').tap();
    await page.waitForSelector(".hero");
    await page.locator(`.home-book-cover[data-book="${withMusic.bookId || saved.bookId}"]`).first().tap();
    await page.waitForSelector(".book-view-switch");
    await page.locator('[data-action="book-view"][data-view="flip"]').tap();
    await page.waitForSelector(".flip-page.is-cover");
    for (let i = 0; i < 80 && !(await page.locator('[data-action="flip"][data-dir="1"]').isDisabled()); i++) {
      if (await page.locator(".flip-head .music-chip").count()) break;
      await page.locator('[data-action="flip"][data-dir="1"]').tap();
    }
    await page.waitForSelector(".flip-head .music-chip");
    await page.waitForFunction(() => { const a = document.querySelector("#background-music"); return a && !a.paused && a.dataset.music === "rainy-window"; });
    if (shots) await page.screenshot({ path: `${shots}/v57-flip.png` });
    await page.locator('#navigation [data-page="home"]').tap();
    await page.waitForFunction(() => document.querySelector("#background-music").paused);
    passed.push("flipping the book plays the page's music; leaving the book stops it");

    // 4. A voice note or video pauses the music (one sound at a time).
    await page.locator('#navigation [data-page="calendar"]').tap();
    await page.locator(`[data-action="select-date"][data-date="${today}"]`).first().tap();
    await page.waitForFunction(() => !document.querySelector("#background-music").paused);
    await page.evaluate(() => {
      const ctx = new AudioContext();
      const dest = ctx.createMediaStreamDestination();
      const voice = document.createElement("audio");
      voice.srcObject = dest.stream;
      voice.id = "test-voice";
      document.querySelector("#app").append(voice);
      voice.play().catch(() => {});
    });
    await page.waitForFunction(() => document.querySelector("#background-music").paused);
    await page.waitForTimeout(400);
    assert.equal(await page.evaluate(() => document.querySelector("#background-music").paused), true, "the music does not come back by itself");
    passed.push("another sound starting pauses the background music");

    // 5. The page's video carries the music (a page with only music: 15 s).
    const result = await page.evaluate(async () => {
      const { exportJournalVideo } = await import("./js/export.mjs");
      const blob = await exportJournalVideo(
        { template: "minimal", font: "serif", layers: [], media: [], title: "♫", body: "", layoutTemplate: "text" },
        { music: "library/music/LD-music-seaside.mp3", catalog: { fonts: [] } },
      );
      const decoded = await new AudioContext().decodeAudioData(await blob.arrayBuffer());
      const data = decoded.getChannelData(0);
      let sum = 0;
      for (let i = 0; i < data.length; i += 7) sum += data[i] * data[i];
      return { seconds: decoded.duration, rms: Math.sqrt(sum / (data.length / 7)) };
    });
    assert.ok(result.seconds > 12, `about 15 s (${result.seconds})`);
    assert.ok(result.rms > 0.01, `the music is in the video (${result.rms})`);
    passed.push(`the page's video carries the music (${result.seconds.toFixed(1)} s, audible)`);

    assert.deepEqual(errors, []);
    console.log(`V6.0 E2E passed (${passed.length} groups):\n - ${passed.join("\n - ")}\nNo page errors.`);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
