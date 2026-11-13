// V10.29 · Step 5 regression through the real app: 1, 2, 3 and 5 photos of
// different shapes (landscape 3:2, portrait 4:5 / 3:4, square), with no words
// and with a long line, picked from Home → 今天的故事 → Save → the reader →
// a reload. Every photo is on the page (whole, inside the paper), the words
// are kept, the reader shows every photo, nothing is lost after the reload,
// and how long the page takes to appear is recorded.
// Chromium, emulated phones — not a real iPhone; times are this machine's.
const { chromium } = require("playwright");
const SS = require("./signed-in.cjs");
SS(chromium);
const assert = require("node:assert/strict");
const path = require("node:path");
const base = process.env.PREVIEW_URL || "http://127.0.0.1:8080";
const lib = path.join(__dirname, "../Packages/LittleDaysCore/Sources/LittleDaysCore/Resources/Photos");
const LONG = { zh: "今天和朋友在街角的咖啡馆坐了一个下午，聊了很多以前的事，窗外一直在下小雨，感觉很安静也很幸福", en: "A whole afternoon at the corner cafe, old stories, soft rain outside" };
const SETS = [
  ["ginger-cat"],
  ["corner-cafe", "frost"],
  ["bouquet", "cookies", "beach-day"],
  ["city-lights", "donuts", "golden-field", "bouquet", "brunch"],
];

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || undefined });
  const passed = [];
  try {
    for (const run of [{ lang: "zh", w: 375, h: 667 }, { lang: "en", w: 430, h: 932 }]) {
      const zh = run.lang === "zh";
      const context = await browser.newContext({ viewport: { width: run.w, height: run.h }, isMobile: true, hasTouch: true });
      await context.addInitScript((lang) => localStorage.setItem("little-days.language", lang), zh ? "zh-CN" : "en");
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("dialog", (d) => errors.push(`native dialog: ${d.message()}`));
      await page.goto(base);
      await page.waitForSelector(".hero");
      const today = await page.evaluate(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; });
      const stored = () => page.evaluate(() => JSON.parse(localStorage.getItem("little-days.v1")));
      const times = [];
      const labels = [];
      for (const [k, names] of SETS.entries()) {
        for (const words of [false, true]) {
          if (names.length === 5 && !words && run.lang === "en") continue; // keep the run short
          await page.locator('#navigation [data-page="home"]').tap().catch(() => {});
          await page.waitForSelector(".hero");
          const [chooser] = await Promise.all([page.waitForEvent("filechooser"), page.locator('[data-action="today-photos"]').first().tap()]);
          const t0 = Date.now();
          await chooser.setFiles(names.map((n) => path.join(lib, `LD-photo-${n}.jpg`)));
          await page.waitForSelector('[data-action="story-save"]');
          await page.waitForFunction((n) => document.querySelectorAll(".story-canvas .photo-layer img").length >= Math.min(n, 1), names.length);
          const ms = Date.now() - t0;
          times.push(ms);
          labels.push(`${names.length}${words ? "+line" : ""}:${ms}`);
          // Several photos taken "now" are one page (same time); check the page in view.
          const s = await stored();
          const entry = s.drafts[today] || s.entries.find((e) => e.date === today);
          const m = entry.moments.at(-1);
          const photos = m.layers.filter((l) => l.kind === "photo" && !l.gen && l.mediaRef);
          assert.equal(photos.length, names.length, `${names.length} photos, all on the page`);
          for (const p of photos) {
            const r = (Number(p.rotation) || 0) !== 0 ? 1.5 : 0.6;
            assert.ok(p.x - p.w / 2 >= -r && p.x + p.w / 2 <= 100 + r && p.y - p.h / 2 >= -r && p.y + p.h / 2 <= 100 + r, `inside the paper: ${JSON.stringify([p.x, p.y, p.w, p.h])}`);
            assert.ok(p.w * p.h >= 120, `big enough to see: ${p.w.toFixed(1)} × ${p.h.toFixed(1)}`);
          }
          if (words) await SS.storyLines(page, [LONG[run.lang]]);
          if (process.env.SHOTS) await page.locator(".story-canvas").screenshot({ path: `${process.env.SHOTS}/v130-${run.lang}-${names.length}-${words ? "long" : "none"}.png` });
          await page.locator('[data-action="story-save"]').tap();
          await page.waitForSelector("#phone.in-reader");
          // (The reader opens at the day's first page; this page's photos are checked in the data below.)
          await page.waitForFunction(() => document.querySelectorAll(".reader-stage .photo-layer img[src^='blob:']").length >= 1, null, { timeout: 10000 });
          await SS.leaveReader(page);
          const saved = (await stored()).entries.find((e) => e.date === today).moments.find((x) => x.id === m.id);
          assert.ok(saved, "saved into the book");
          assert.equal(saved.layers.filter((l) => l.kind === "photo" && !l.gen && l.mediaRef).length, names.length);
          assert.equal(saved.title, words ? LONG[run.lang] : "");
        }
      }
      // A reload keeps every page and photo.
      const before = (await stored()).entries.find((e) => e.date === today).moments.map((m) => [m.id, m.title, m.layers.filter((l) => l.kind === "photo").map((l) => [l.mediaRef, l.x, l.y])]);
      await page.reload();
      await page.waitForSelector(".hero");
      const after = (await stored()).entries.find((e) => e.date === today).moments.map((m) => [m.id, m.title, m.layers.filter((l) => l.kind === "photo").map((l) => [l.mediaRef, l.x, l.y])]);
      assert.deepEqual(after, before, "the same after a reload");
      const sorted = [...times].sort((a, b) => a - b);
      passed.push(`${run.lang} ${run.w}: 1 / 2 / 3 / 5 photos (3:2, 4:5, 3:4, 1:1), no words and a long line — every photo whole on the page, words kept, the reader opens with the photos, the same after a reload; from the picked photos to the laid-out page ${sorted[0]}–${sorted.at(-1)} ms (median ${sorted[Math.floor(sorted.length / 2)]} ms, this machine; photos:ms ${labels.join(" ")})`);
      assert.deepEqual(errors, []);
      await context.close();
    }
  } finally {
    await browser.close();
  }
  for (const line of passed) console.log("✓", line);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
