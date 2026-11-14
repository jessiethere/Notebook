// V10.49 · The music volume on iPhone. iOS ignores <audio>.volume (it always
// reads back 1), so the slider in "♫ 这本书的音乐" changed nothing on the phone.
// There the music now goes through a Web Audio gain. This test makes Chromium
// behave like iOS (volume ignored) and checks the gain follows the slider;
// where volume works, nothing changes. Synthetic data only.
const { chromium, devices } = require("playwright");
require("./signed-in.cjs")(chromium);
const assert = require("node:assert/strict");
const base = process.env.PREVIEW_URL || "http://127.0.0.1:8080";

const spy = ({ iosVolume }) => {
  window.__gains = [];
  window.__routed = 0;
  const AC = window.AudioContext;
  const gain = AC.prototype.createGain;
  AC.prototype.createGain = function () {
    const node = gain.call(this);
    window.__gains.push(node);
    return node;
  };
  const source = AC.prototype.createMediaElementSource;
  AC.prototype.createMediaElementSource = function (el) {
    window.__routed++;
    return source.call(this, el);
  };
  if (iosVolume) {
    // Like iOS: setting volume does nothing and it always reads 1.
    Object.defineProperty(HTMLMediaElement.prototype, "volume", { configurable: true, get: () => 1, set: () => {} });
  }
};

async function run(browser, iosVolume, device = devices["iPhone 13"]) {
  const context = await browser.newContext({ ...device, locale: "zh-CN" });
  await context.addInitScript(spy, { iosVolume });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(base);
  await page.waitForSelector(".hero");
  await require("./signed-in.cjs").touchStore(page);
  await page.reload();
  await page.waitForSelector(".hero");
  await require("./signed-in.cjs").openBookPage(page, "food");
  await page.waitForSelector(".book-music");
  await page.locator('.book-music [data-action="music-sheet"]').tap();
  await page.waitForSelector('#choose-dialog[open] .music-sheet[data-target="book"]');
  await page.locator("[data-music-volume]").fill("40");
  await page.locator('[data-action="music-preview"][data-music="morning-piano"]').tap();
  await page.waitForFunction(() => { const a = document.querySelector("#background-music"); return a && !a.paused && a.dataset.music === "morning-piano"; });
  await page.waitForTimeout(400);
  const state = () => page.evaluate(() => ({ routed: window.__routed, gain: window.__gains.length ? Math.round(window.__gains.at(-1).gain.value * 100) : -1, element: Math.round(document.querySelector("#background-music").volume * 100) }));
  const first = await state();
  await page.locator("[data-music-volume]").fill("15");
  await page.waitForTimeout(100);
  const second = await state();
  await page.locator("[data-music-volume]").fill("0");
  await page.waitForTimeout(100);
  const third = await state();
  assert.match(await page.locator(".music-volume output").innerText(), /0%/);
  assert.deepEqual(errors, []);
  await context.close();
  return [first, second, third];
}

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || undefined });
  const passed = [];
  try {
    const ios = await run(browser, true);
    assert.equal(ios[0].routed, 1, "on iOS the music goes through the gain");
    assert.deepEqual(ios.map((s) => s.gain), [40, 15, 0], "the gain follows the slider");
    passed.push("iOS-like (volume ignored): music routed through a gain; 40% → 15% → 0% changes the gain");

    // The iOS Simulator reads the volume back but real iPhones ignore it: an
    // iPhone goes through the gain whatever the element says.
    const phone = await run(browser, false);
    assert.equal(phone[0].routed, 1, "an iPhone always goes through the gain");
    assert.deepEqual(phone.map((s) => s.gain), [40, 15, 0]);
    passed.push("iPhone whose element reads the volume back (like the Simulator): still routed through the gain");

    const web = await run(browser, false, { viewport: { width: 430, height: 900 }, hasTouch: true });
    assert.equal(web[0].routed, 0, "where volume works, the music is not rerouted");
    assert.deepEqual(web.map((s) => s.element), [40, 15, 0], "the element's own volume follows the slider");
    passed.push("desktop browsers: unchanged (the <audio> volume follows the slider, no Web Audio)");

    console.log(`V10.49 music volume passed (${passed.length} groups):\n - ${passed.join("\n - ")}\nNo page errors.`);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
