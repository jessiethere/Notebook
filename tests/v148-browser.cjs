// V10.50 · P0 from TestFlight:
//  - a voice note recorded and saved played no sound on the iPhone;
//  - a 10.5 MB video failed the first import ("media-timeout") and worked on 重试.
// Root causes (docs/BUGFIX_LOG.md): the iPhone web view kept the audio session
// in "play and record" after the microphone was used (sound from the
// earpiece), and it did not load a file's details without a fresh tap (so the
// first import, right after the picker, waited 10 s and failed).
// Chromium has no navigator.audioSession, so a stand-in records what the app
// asks for. Synthetic media only (fake microphone, a canvas video).
const { chromium, devices } = require("playwright");
require("./signed-in.cjs")(chromium);
const assert = require("node:assert/strict");
const base = process.env.PREVIEW_URL || "http://127.0.0.1:8080";

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

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROMIUM_PATH || undefined,
    args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream", "--autoplay-policy=no-user-gesture-required"],
  });
  const passed = [];
  try {
    const context = await browser.newContext({ ...devices["iPhone 13"], locale: "zh-CN" });
    await context.addInitScript(() => {
      // A stand-in for iOS 17+ navigator.audioSession: remembers each type set.
      window.__sessions = [];
      let type = "auto";
      Object.defineProperty(navigator, "audioSession", {
        configurable: true,
        value: {
          get type() { return type; },
          set type(v) { type = v; window.__sessions.push(v); },
          state: "inactive",
        },
      });
      // Like the iPhone web view before the fix: a video's details never load
      // (only the onloadedmetadata property the import listens with).
      window.__noMeta = false;
      const desc = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "onloadedmetadata");
      Object.defineProperty(HTMLMediaElement.prototype, "onloadedmetadata", {
        configurable: true,
        get() { return desc.get.call(this); },
        set(fn) { desc.set.call(this, window.__noMeta && fn ? null : fn); },
      });
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(base);
    await page.waitForSelector(".hero");
    const events = (name) => page.evaluate((name) => JSON.parse(localStorage.getItem("little-days.events") || "[]").filter((e) => e.e === name), name);
    const draftClips = () => page.evaluate(() => { const s = JSON.parse(localStorage.getItem("little-days.v1")); return Object.values(s.drafts || {}).flatMap((d) => [d, ...(d.moments || [])]).flatMap((p) => p.media || []); });

    // 1. Voice: 更多方式 → 声音 → 录音 → 停止. The session is "play and record"
    //    only while recording and "playback" after; the clip lands on the page.
    await page.locator('[data-action="quick-open"]').first().tap();
    await page.locator('[data-action="quick-way"][data-way="voice"]').first().tap();
    await page.locator(".quick-start").tap();
    await page.waitForSelector('[data-action="record-audio"]');
    await page.locator('[data-action="record-audio"]').tap();
    await page.waitForSelector('[data-action="stop-recording"]');
    assert.equal(await page.evaluate(() => navigator.audioSession.type), "play-and-record", "recording session while recording");
    await page.waitForTimeout(1500);
    await page.locator('[data-action="stop-recording"]').tap();
    await page.waitForFunction(() => document.querySelector('#journal-canvas .audio-layer audio[src^="blob:"]'));
    assert.equal(await page.evaluate(() => navigator.audioSession.type), "playback", "back to playback after recording");
    const voice = (await draftClips()).find((c) => c.origin === "recording");
    assert.ok(voice && voice.size > 1000 && voice.kind === "audio", "the recording is saved with its bytes");
    passed.push("record → stop: session play-and-record while recording, playback after; the clip is saved and on the page");

    // 2. Play: the clip shows "playing" only once sound really plays, and the
    //    play is written to the local log.
    await page.evaluate(() => {
      // Hold the real start back a little, like a slow first load.
      const audio = document.querySelector("#journal-canvas .audio-layer audio");
      const real = audio.play.bind(audio);
      audio.play = () => new Promise((resolve, reject) => setTimeout(() => real().then(resolve, reject), 800));
    });
    await page.locator("#journal-canvas .audio-layer .layer-play").click({ force: true });
    await page.waitForTimeout(300);
    assert.equal(await page.locator("#journal-canvas .audio-layer.playing").count(), 0, "not 'playing' before sound plays");
    await page.waitForSelector("#journal-canvas .audio-layer.playing", { timeout: 5000 });
    await page.waitForFunction(() => JSON.parse(localStorage.getItem("little-days.events") || "[]").some((e) => e.e === "media_play"));
    const plays = await events("media_play");
    assert.equal(plays.at(-1).stage, "playing");
    assert.equal(plays.at(-1).kind, "audio");
    passed.push("play: 'playing' shows only once sound plays (not on the tap); logged locally");

    // 3. A clip that cannot play says so (no silent "playing").
    await page.evaluate(() => {
      const audio = document.querySelector("#journal-canvas .audio-layer audio");
      audio.pause();
      audio.play = () => Promise.reject(Object.assign(new Error("x"), { name: "NotSupportedError" }));
    });
    await page.waitForFunction(() => !document.querySelector("#journal-canvas .audio-layer.playing"));
    await page.locator("#journal-canvas .audio-layer .layer-play").click({ force: true });
    await page.waitForSelector("#toast.visible");
    assert.equal(await page.locator("#journal-canvas .audio-layer.playing").count(), 0);
    assert.equal((await events("media_play")).at(-1).stage, "failed");
    assert.equal((await events("media_play")).at(-1).err, "notsupported");
    passed.push("a clip that cannot play: a message, no 'playing' look, logged");

    // 4. Video import when the file's details never arrive (the iPhone before
    //    the shell fix): saved anyway after the wait, once, no failure.
    await page.evaluate(() => (window.__noMeta = true));
    const before = (await draftClips()).filter((c) => c.kind === "video").length;
    await page.locator("#video-input").setInputFiles({ name: "walk.webm", mimeType: "video/webm", buffer: await syntheticVideo(page) });
    await page.waitForFunction((n) => { const s = JSON.parse(localStorage.getItem("little-days.v1")); return Object.values(s.drafts || {}).flatMap((d) => [d, ...(d.moments || [])]).flatMap((p) => p.media || []).filter((c) => c.kind === "video").length > n; }, before, { timeout: 25000 });
    await page.waitForTimeout(500);
    const videos = (await draftClips()).filter((c) => c.kind === "video");
    assert.equal(videos.length, before + 1, "exactly one video added");
    assert.equal(await page.locator('.import-card[data-stage="failed"]').count(), 0, "no failure shown");
    assert.ok((await events("media_meta_timeout")).length >= 1, "the wait is logged");
    assert.equal((await events("media_import_failed")).length, 0);
    passed.push("video whose details never load: saved after the wait (no media-timeout failure), once");

    // 5. Recorder states: ready (start + permission hint) → recording (red
    //    dot, time, live level, stop) → saving at once on stop (shown until
    //    the file is really stored) → saved.
    await page.evaluate(() => (window.__noMeta = false));
    await page.waitForSelector('.voice-rec[data-phase="saved"], .voice-rec[data-phase="ready"]', { state: "attached" });
    if (!(await page.locator('.voice-rec[data-phase="ready"]').count())) {
      await page.locator('.voice-rec [data-action="record-audio"]').tap();
    } else await page.locator('.voice-rec [data-action="record-audio"]').tap();
    await page.waitForSelector('.voice-rec[data-phase="recording"] .vr-dot.live');
    await page.waitForTimeout(1300);
    assert.match(await page.locator("#vr-time").innerText(), /^00:0[1-9]$/, "time counts");
    assert.match(await page.locator(".voice-rec").innerText(), /正在录音/);
    assert.ok(Number(await page.locator("#vr-wave").getAttribute("data-level")) >= 0, "the live level is drawn");
    await page.evaluate(() => {
      // Hold the save back a little (reading the recording's bytes).
      const real = Blob.prototype.arrayBuffer;
      Blob.prototype.arrayBuffer = function () { return new Promise((r) => setTimeout(r, 900)).then(() => real.call(this)); };
      window.__restoreBlob = () => (Blob.prototype.arrayBuffer = real);
    });
    const voicesBefore = (await draftClips()).filter((c) => c.origin === "recording").length;
    await page.locator('[data-action="stop-recording"]').tap();
    await page.waitForSelector('.voice-rec[data-phase="saving"]', { timeout: 1500 });
    assert.match(await page.locator(".voice-rec").innerText(), /正在保存录音/);
    assert.equal((await draftClips()).filter((c) => c.origin === "recording").length, voicesBefore, "not saved yet while 'saving'");
    await page.waitForSelector('.voice-rec[data-phase="saved"]', { timeout: 10000 });
    assert.equal((await draftClips()).filter((c) => c.origin === "recording").length, voicesBefore + 1, "saved when it says saved");
    await page.evaluate(() => window.__restoreBlob());
    passed.push("recorder: ready → recording (dot, 00:0n, live level) → 正在保存录音… right at stop → 录音已保存 only once stored");

    // 6. A failed save keeps the recording: 重新保存 stores it once.
    await page.evaluate(() => {
      const real = IDBObjectStore.prototype.add;
      let failOnce = true;
      IDBObjectStore.prototype.add = function (value, ...rest) {
        if (failOnce && value && value.kind === "audio") { failOnce = false; throw new DOMException("full", "QuotaExceededError"); }
        return real.call(this, value, ...rest);
      };
    });
    await page.locator('.voice-rec [data-action="record-audio"]').tap();
    await page.waitForSelector('.voice-rec[data-phase="recording"]');
    await page.waitForTimeout(1000);
    await page.locator('[data-action="stop-recording"]').tap();
    await page.waitForSelector('.voice-rec[data-phase="failed"]', { timeout: 10000 });
    assert.match(await page.locator(".voice-rec").innerText(), /没有保存成功[\s\S]*录音还在/);
    assert.equal((await draftClips()).filter((c) => c.origin === "recording").length, voicesBefore + 1, "nothing half-saved");
    await page.locator('[data-action="voice-retry"]').tap();
    await page.waitForSelector('.voice-rec[data-phase="saved"]', { timeout: 10000 });
    assert.equal((await draftClips()).filter((c) => c.origin === "recording").length, voicesBefore + 2, "saved once on retry");
    passed.push("failed save: says so, keeps the recording in memory; 重新保存 stores it exactly once");

    // 7. The app going to the background while recording: stopped and saved.
    await page.locator('.voice-rec [data-action="record-audio"]').tap();
    await page.waitForSelector('.voice-rec[data-phase="recording"]');
    await page.waitForTimeout(900);
    await page.evaluate(() => {
      Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await page.waitForSelector('.voice-rec[data-phase="saved"]', { timeout: 10000 });
    assert.equal((await draftClips()).filter((c) => c.origin === "recording").length, voicesBefore + 3);
    assert.ok((await events("voice_stopped")).length >= 1);
    passed.push("going to the background while recording: stopped and saved (not lost)");

    assert.deepEqual(errors, []);
    console.log(`V10.50 P0 voice / video passed (${passed.length} groups):\n - ${passed.join("\n - ")}\nNo page errors.`);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
