// Words-only over the main photo, video/audio on the paper (Studio + reading
// view), PNG export and video export. Synthetic media only.
const { chromium } = require("playwright");
require("./signed-in.cjs")(chromium);
const { goTab } = require("./signed-in.cjs");
const assert = require("node:assert/strict");
const base = process.env.PREVIEW_URL || "http://127.0.0.1:8080";
function wav(seconds = 2) {
  const rate = 8000, count = rate * seconds, buffer = Buffer.alloc(44 + count * 2);
  buffer.write("RIFF"); buffer.writeUInt32LE(buffer.length - 8, 4); buffer.write("WAVEfmt ", 8);
  buffer.writeUInt32LE(16, 16); buffer.writeUInt16LE(1, 20); buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(rate, 24); buffer.writeUInt32LE(rate * 2, 28); buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34); buffer.write("data", 36); buffer.writeUInt32LE(count * 2, 40);
  for (let i = 0; i < count; i++) buffer.writeInt16LE(Math.sin((i / rate) * Math.PI * 440) * 3000, 44 + i * 2);
  return buffer;
}
async function size(download) {
  let n = 0;
  for await (const chunk of await download.createReadStream()) n += chunk.length;
  return n;
}

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROMIUM_PATH || undefined,
    args: ["--autoplay-policy=no-user-gesture-required"],
  });
  const passed = [];
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, timezoneId: "America/New_York", acceptDownloads: true });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(base);
    await page.waitForSelector(".hero");
    const nav = (tab) => goTab(page, tab);
    const tool = async (id) => {
      const head = page.locator(`[data-action="tool"][data-tool="${id}"]`);
      if ((await head.getAttribute("aria-expanded")) !== "true") await head.click();
    };
    const today = await page.evaluate(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; });
    const draft = () => page.evaluate((d) => JSON.parse(localStorage.getItem("little-days.v1")).drafts[d], today);

    // 1. Today's sample page has a main photo; words-only is still allowed.
    await nav("studio");
    await page.waitForSelector("#journal-canvas .canvas-photo img");
    await tool("layout");
    assert.equal(await page.locator('[data-action="template-count"][data-count="0"]').isDisabled(), false);
    await page.locator('[data-action="template-count"][data-count="0"]').click();
    await page.locator('[data-action="apply-layout"][data-template="text"]').click();
    assert.match(await page.locator("#confirm-message").innerText(), /只有文字/);
    await page.locator("#confirm-dialog[open] #confirm-ok").click();
    await page.waitForSelector("#journal-canvas.text-only");
    assert.equal(await page.locator("#journal-canvas .canvas-photo").count(), 0, "photo spot gone; words only");
    await page.locator('[data-action="undo"]').click();
    await page.waitForSelector("#journal-canvas .canvas-photo img");
    passed.push("words-only over the main photo (confirmed, undoable)");

    // 2. Video and audio land on the paper and play right there.
    const video = Buffer.from(await page.evaluate(async () => {
      const canvas = document.createElement("canvas");
      canvas.width = 160; canvas.height = 120;
      const ctx = canvas.getContext("2d");
      const stream = canvas.captureStream(15);
      const recorder = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp8" });
      const chunks = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      const done = new Promise((r) => (recorder.onstop = r));
      recorder.start();
      for (let i = 0; i < 16; i++) { ctx.fillStyle = i % 2 ? "#C9D7C1" : "#E8CFCF"; ctx.fillRect(0, 0, 160, 120); await new Promise((r) => setTimeout(r, 70)); }
      recorder.stop(); await done;
      return [...new Uint8Array(await new Blob(chunks, { type: "video/webm" }).arrayBuffer())];
    }));
    await tool("media");
    await page.locator("#video-input").setInputFiles({ name: "walk.webm", mimeType: "video/webm", buffer: video });
    await page.waitForSelector('#journal-canvas .video-layer video[src^="blob:"]');
    await page.locator("#audio-input").setInputFiles({ name: "birds.wav", mimeType: "audio/wav", buffer: wav(2) });
    await page.waitForSelector('#journal-canvas .audio-layer audio[src^="blob:"]', { state: "attached" });
    let d = await draft();
    assert.deepEqual(d.layers.filter((l) => l.clipId).map((l) => l.kind).sort(), ["audio", "video"]);
    // Play the audio ticket on the paper.
    await page.locator("#journal-canvas .audio-layer .layer-play").click();
    await page.waitForFunction(() => document.querySelector("#journal-canvas .audio-layer audio").currentTime > 0.05);
    assert.equal(await page.locator("#journal-canvas .audio-layer.playing").count(), 1);
    await page.locator("#journal-canvas .audio-layer .layer-play").click();
    // Move and resize the video like a photo (mouse).
    const videoId = d.layers.find((l) => l.kind === "video").id;
    await page.locator(`[data-layer="${videoId}"]`).focus();
    await page.keyboard.press("Enter");
    const before = (await draft()).layers.find((l) => l.id === videoId);
    const handle = page.locator(`[data-layer="${videoId}"] .handle-resize`);
    await handle.scrollIntoViewIfNeeded();
    const box = await handle.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + 30, box.y + 20, { steps: 6 });
    await page.mouse.up();
    await page.waitForFunction(([d, id, w]) => JSON.parse(localStorage.getItem("little-days.v1")).drafts[d].layers.find((l) => l.id === id).w > w, [today, videoId, before.w]);
    // The list player's progress bar still seeks.
    await tool("media");
    await page.locator('.media-card [data-player-seek]').first().evaluate((el) => {
      el.value = "500";
      el.dispatchEvent(new Event("input", { bubbles: true }));
    });
    assert.ok((await page.locator(".media-card .ld-player audio").first().evaluate((a) => a.currentTime)) > 0.5);
    // Take the audio off the paper: the clip stays in the list.
    await tool("media");
    const audioClip = d.media.find((c) => c.kind === "audio");
    await page.locator(`[data-action="clip-on-page"][data-clip="${audioClip.id}"]`).click();
    await page.waitForFunction(() => !document.querySelector("#journal-canvas .audio-layer"));
    d = await draft();
    assert.ok(d.media.some((c) => c.id === audioClip.id), "file kept");
    await page.locator(`[data-action="clip-on-page"][data-clip="${audioClip.id}"]`).click();
    await page.waitForSelector("#journal-canvas .audio-layer");
    passed.push("video + audio on the paper: play, resize, take off/put back");

    // 3. Export as photo or as video.
    const png = page.waitForEvent("download");
    await page.locator('[data-action="export"]').click();
    const pngFile = await png;
    assert.match(pngFile.suggestedFilename(), /\.png$/);
    assert.ok((await size(pngFile)) > 20000);
    const vid = page.waitForEvent("download", { timeout: 60000 });
    await page.locator('[data-action="export-video"]').click();
    await page.waitForSelector("#export-dialog[open]");
    await page.waitForFunction(() => /已录制/.test(document.querySelector("#export-time").textContent));
    await page.waitForFunction(() => parseFloat(document.querySelector("#export-progress").style.width) > 0);
    const videoFile = await vid;
    await page.waitForSelector("#export-dialog:not([open])", { state: "attached" });
    assert.match(videoFile.suggestedFilename(), /\.(webm|mp4)$/);
    const bytes = await size(videoFile);
    assert.ok(bytes > 20000, `video size ${bytes}`);
    // The recorded file really plays and lasts about as long as the page.
    const exported = Buffer.from(await (await videoFile.createReadStream()).toArray().then((c) => Buffer.concat(c)));
    const duration = await page.evaluate(async (data) => {
      const blob = new Blob([new Uint8Array(data)], { type: "video/webm" });
      const v = document.createElement("video");
      v.muted = true;
      v.src = URL.createObjectURL(blob);
      await new Promise((r) => (v.onloadedmetadata = r));
      if (!Number.isFinite(v.duration)) { v.currentTime = 1e6; await new Promise((r) => (v.ontimeupdate = r)); }
      return v.duration;
    }, [...exported]);
    assert.ok(duration >= 3, `duration ${duration}`);
    // The sound of the clips is mixed into the file (not silent).
    const loudness = await page.evaluate(async (data) => {
      const ctx = new OfflineAudioContext(1, 8000, 8000);
      const audio = await ctx.decodeAudioData(new Uint8Array(data).buffer);
      const samples = audio.getChannelData(0);
      let peak = 0;
      for (const v of samples) peak = Math.max(peak, Math.abs(v));
      return peak;
    }, [...exported]);
    assert.ok(loudness > 0.01, `audio peak ${loudness}`);
    // Cancel a running export: no file, a clear message, dialog closes.
    let extra = 0;
    const onDownload = () => extra++;
    page.on("download", onDownload);
    await page.locator('[data-action="export-video"]').click();
    await page.waitForFunction(() => /已录制/.test(document.querySelector("#export-time").textContent));
    await page.locator("#export-cancel").click();
    await page.waitForFunction(() => document.querySelector("#toast").textContent.includes("已取消导出"));
    await page.waitForSelector("#export-dialog:not([open])", { state: "attached" });
    await page.waitForTimeout(800);
    page.off("download", onDownload);
    assert.equal(extra, 0, "cancelled export makes no file");
    passed.push(`export photo (PNG) and video (${videoFile.suggestedFilename().split(".").pop()}, ${Math.round(duration)}s) with progress + cancel`);

    // 4. Reading view: clips play on the paper, not repeated below.
    await page.locator('[data-action="save-entry"]').click();
    await page.waitForSelector(".hero");
    await nav("calendar");
    await page.locator(`[data-action="select-date"][data-date="${today}"]`).click();
    await page.waitForSelector('.day-detail .video-layer video[src^="blob:"]');
    await page.locator(".day-detail .video-layer .layer-play").click();
    await page.waitForFunction(() => document.querySelector(".day-detail .video-layer video").currentTime > 0.05);
    assert.equal(await page.locator(".day-detail .day-media .media-card").count(), 0, "on-paper clips are not listed twice");
    passed.push("reading view plays clips on the paper");
    assert.deepEqual(errors, []);
    console.log(`V3.4 E2E passed (${passed.length} groups):\n - ${passed.join("\n - ")}\nNo page errors.`);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
