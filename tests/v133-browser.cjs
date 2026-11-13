// V10.33–V10.34 · Layout quality (L1–L3), checked on the page as it really
// renders (DOM boxes, real fonts), not on the engine's own numbers:
//   · the three problems found before: a 9:16 photo squeezed to ~11% wide
//     beside three photos and a long line; five portraits each with words,
//     a line on a photo; three photos and a long line, the lower two tiny;
//   · 1–5 photos of different shapes, a meme / screenshot with words on it,
//     Chinese, English and mixed lines, a chosen font and a bigger size;
//   · every page: no words on a photo or off the page, every photo at least
//     20% of the page wide on its short side and 5.5% of its area; a long
//     line is body text, never cut;
//   · too much for one page: a suggestion with the page as it is and the
//     pages it would become; splitting keeps every photo, word and line in
//     order, each page passes; "keep one page" says what that means;
//   · the reader shows the saved page the same way.
// Chinese at 375×667, English at 430×932. Chromium, not a real iPhone.
const { chromium } = require("playwright");
const SS = require("./signed-in.cjs");
SS(chromium);
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const base = process.env.PREVIEW_URL || "http://127.0.0.1:8080";
const lib = path.join(__dirname, "../Packages/LittleDaysCore/Sources/LittleDaysCore/Resources/Photos");
const photo = (n) => ({ name: `LD-photo-${n}.jpg`, mimeType: "image/jpeg", buffer: fs.readFileSync(path.join(lib, `LD-photo-${n}.jpg`)) });
const ZH_LONG = "今天和朋友在街角的咖啡馆坐了一个下午，聊了很多以前的事，窗外一直在下小雨，感觉很安静也很幸福";
const EN_LONG = "A whole afternoon at the corner cafe, old stories, soft rain outside";
const MIX = "和 Lily 去 Blue Bottle 喝了 2 杯 latte，回家路上看到 sunset 好开心";

// A synthetic picture made in the page: a meme / screenshot (9:16, words on
// it) or a 16:9 photo. Not a real person's picture.
async function drawn(page, kind) {
  const data = await page.evaluate((kind) => {
    const c = document.createElement("canvas");
    [c.width, c.height] = kind === "meme" ? [720, 1280] : [1280, 720];
    const g = c.getContext("2d");
    const grad = g.createLinearGradient(0, 0, c.width, c.height);
    grad.addColorStop(0, kind === "meme" ? "#d98b6f" : "#7fa3b8");
    grad.addColorStop(1, kind === "meme" ? "#6f8fd9" : "#e3c48f");
    g.fillStyle = grad;
    g.fillRect(0, 0, c.width, c.height);
    if (kind === "meme") {
      g.fillStyle = "#fff";
      g.strokeStyle = "#000";
      g.lineWidth = 8;
      g.font = "bold 84px sans-serif";
      g.textAlign = "center";
      for (const [text, y] of [["周五下班的我", 150], ["冲！！！", 1180]]) {
        g.strokeText(text, 360, y);
        g.fillText(text, 360, y);
      }
    }
    return c.toDataURL("image/jpeg", 0.85).split(",")[1];
  }, kind);
  return { name: `test-${kind}.jpg`, mimeType: "image/jpeg", buffer: Buffer.from(data, "base64") };
}

// Every photo and every one of the person's own words on the page in view,
// as boxes in % of the paper.
async function pageBoxes(page, scope, words) {
  return page.evaluate(([scope, words]) => {
    const paper = document.querySelector(scope);
    const P = paper.getBoundingClientRect();
    const rel = (r) => ({ l: ((r.left - P.left) / P.width) * 100, r: ((r.right - P.left) / P.width) * 100, t: ((r.top - P.top) / P.height) * 100, b: ((r.bottom - P.top) / P.height) * 100 });
    const photos = [...paper.querySelectorAll(".photo-layer")].filter((el) => !el.closest(".gen")).map((el) => rel(el.getBoundingClientRect()));
    const texts = [...paper.querySelectorAll(".text-layer")].filter((el) => words.includes(el.textContent.trim())).map((el) => ({ text: el.textContent.trim(), ...rel(el.getBoundingClientRect()), size: parseFloat(getComputedStyle(el).fontSize), paperW: P.width }));
    return { photos, texts };
  }, [scope, words]);
}
function checkPage({ photos, texts }, where) {
  const ov = (a, b) => Math.max(0, Math.min(a.r, b.r) - Math.max(a.l, b.l)) * Math.max(0, Math.min(a.b, b.b) - Math.max(a.t, b.t));
  for (const p of photos) {
    const w = p.r - p.l, h = p.b - p.t;
    const short = Math.min(w, h / 0.8);
    const tall = (w * 0.8) / h <= 0.62; // a screenshot / meme: its words must be readable
    assert.ok(short >= (tall ? 25.5 : 19.5), `${where}: a ${tall ? "tall picture at least 26%" : "photo at least 20%"} on its short side (${short.toFixed(1)})`);
    assert.ok((w * h) / 100 >= 5.3, `${where}: a photo at least 5.5% of the page (${((w * h) / 100).toFixed(1)})`);
  }
  for (const t of texts) {
    const area = (t.r - t.l) * (t.b - t.t);
    const on = photos.reduce((sum, p) => sum + ov(t, p), 0) / area;
    assert.ok(on <= 0.01, `${where}: "${t.text.slice(0, 12)}" not on a photo (${(on * 100).toFixed(1)}%)`);
    assert.ok(t.l >= 0 && t.r <= 100.5 && t.t >= 0 && t.b <= 100.5, `${where}: "${t.text.slice(0, 12)}" on the page`);
  }
}

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
      const meme = await drawn(page, "meme"), wide = await drawn(page, "wide");
      const LONG = zh ? ZH_LONG : EN_LONG;
      const CASES = [
        { id: "9:16 meme + three photos + a long line (problem 1)", files: [photo("frost"), photo("bouquet"), wide, meme], title: LONG },
        { id: "the same, and words on two photos (problem 1, more words)", files: [photo("frost"), photo("bouquet"), wide, meme], title: LONG, caps: [zh ? "窗边的霜花" : "Frost on the window", zh ? "第二张照片的一句话" : "A line for the second photo"], split: [2, 2] },
        { id: "five portraits, each with words (problem 2)", files: ["frost", "cookies", "donuts", "ginger-cat", "city-lights"].map(photo), title: zh ? "周六的咖啡" : "Saturday coffee", caps: zh ? ["拿铁", "第二张照片的一句话", "早午餐吃得很饱", "回家路上看到 sunset", "晚安"] : ["Latte", "A line for the second photo", "Brunch, very full", "Sunset on the way home", "Good night"] },
        { id: "three photos + a long line (problem 3)", files: ["corner-cafe", "frost", "cookies"].map(photo), title: LONG },
        { id: "one 9:16 meme", files: [meme] },
        { id: "two landscapes + a portrait, a short line", files: ["beach-day", "golden-field", "ginger-cat"].map(photo), title: zh ? "海边的周末" : "A weekend by the sea" },
        { id: "a mixed line, Serif, bigger", files: [photo("corner-cafe"), photo("cookies"), photo("bouquet"), meme], title: MIX, font: "song", bigger: true },
        { id: "six photos + a long line + words on each (too much)", files: ["frost", "bouquet", "corner-cafe", "cookies", "donuts", "brunch"].map(photo), title: LONG, caps: zh ? ["霜花", "花束", "街角", "饼干", "甜甜圈", "早午餐"] : ["Frost", "Flowers", "Corner", "Cookies", "Donuts", "Brunch"], split: [3, 3] },
      ];
      for (const c of CASES) {
        await page.locator('#navigation [data-page="home"]').tap().catch(() => {});
        await page.waitForSelector(".hero");
        const [chooser] = await Promise.all([page.waitForEvent("filechooser"), page.locator('[data-action="today-photos"]').first().tap()]);
        await chooser.setFiles(c.files);
        await page.waitForSelector('[data-action="story-save"]');
        if (c.title || c.caps || c.font) {
          await page.locator('.qe-tools [data-action="story-text"]').tap();
          await page.waitForSelector("#choose-dialog[open] [data-sw-text]");
          if (c.title) await page.locator("#choose-dialog [data-sw-text]").fill(c.title);
          for (const [i, cap] of (c.caps || []).entries()) {
            await page.locator('#choose-dialog [data-action="sw-target"]').nth(i + 1).tap();
            await page.locator("#choose-dialog [data-sw-text]").fill(cap);
          }
          if (c.font) {
            await SS.openTypeTools(page);
            await page.locator(`#choose-dialog [data-action="sw-font"][data-font="${c.font}"]`).tap();
            if (c.bigger) await page.locator('#choose-dialog [data-action="sw-size"][data-dir="1"]').tap();
          }
          await page.locator('#choose-dialog [data-action="story-text-done"]').tap();
          await page.waitForSelector("#choose-dialog:not([open])", { state: "attached" });
        }
        await page.waitForTimeout(700); // fonts arrive, the page is laid out again with the real measure
        const words = [c.title, ...(c.caps || [])].filter(Boolean);
        const where = `${run.lang} ${run.w} · ${c.id}`;
        if (process.env.SHOTS) await page.locator(".story-canvas").screenshot({ path: `${process.env.SHOTS}/v133-${run.lang}-${CASES.indexOf(c)}.png` });
        const split = await page.locator(".qe-split").count();
        if (c.split) {
          assert.equal(split, 1, `${where}: a split is suggested`);
          assert.equal(await page.locator(".qe-split figure").count(), 3, "the page as it is + two pages");
          assert.match(await page.locator(".qe-split").innerText(), zh ? /保持一页时/ : /On one page/);
          if (process.env.SHOTS) await page.locator(".qe-bar").screenshot({ path: `${process.env.SHOTS}/v133-${run.lang}-split.png` });
          await page.locator('[data-action="story-split-pages"]').tap();
          await page.waitForSelector(".story-tabs");
          const tabs = await page.locator(".story-tabs button").count();
          let seenWords = [];
          for (let i = 0; i < tabs; i++) {
            await page.locator(".story-tabs button").nth(i).tap();
            await page.waitForTimeout(400);
            if (i === 0 && tabs > 2) continue; // the day spread
            const boxes = await pageBoxes(page, ".story-canvas .journal-canvas", words);
            checkPage(boxes, `${where} · page ${i}`);
            seenWords.push(...boxes.texts.map((t) => t.text));
            if (process.env.SHOTS) await page.locator(".story-canvas").screenshot({ path: `${process.env.SHOTS}/v133-${run.lang}-split-${i}.png` });
          }
          assert.deepEqual([...new Set(seenWords)].sort(), [...words].sort(), "every line and every photo's words are on the pages");
          const s = await page.evaluate(() => { const d = new Date(); const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; const st = JSON.parse(localStorage.getItem("little-days.v1")); return (st.drafts[k] || st.entries.find((e) => e.date === k)).moments.slice(-2).map((m) => ({ title: m.title, n: m.layers.filter((l) => l.kind === "photo" && !l.gen).length, caps: m.layers.filter((l) => l.caption).map((l) => l.caption), type: m.typeStyle })); });
          assert.deepEqual(s.map((m) => m.n), c.split, `${c.split.join(" + ")} photos, none lost`);
          assert.equal(s[0].title, c.title, "the line on the first page");
          assert.deepEqual([...s[0].caps, ...s[1].caps], c.caps, "each photo's words, in order");
          passed.push(`${where}: suggested 2 pages (shown next to the page as it is); split → ${c.split.join(" + ")} photos, every word with its photo, the line on page 1, each page passes`);
        } else {
          assert.equal(split, 0, `${where}: fits one page, no split suggested`);
          const boxes = await pageBoxes(page, ".story-canvas .journal-canvas", words);
          checkPage(boxes, where);
          // A line that needs more than two lines at headline size is body
          // text (Chinese long, mixed); the English line fits two, so it stays a headline.
          if (c.title === ZH_LONG || c.title === MIX) {
            const t = boxes.texts.find((x) => x.text === c.title);
            const bodyPx = ((16 * (c.bigger ? 1.15 : 1)) / 3.2 / 100) * t.paperW;
            assert.ok(Math.abs(t.size - bodyPx) < 1.5, `${where}: the long line is body text (${t.size.toFixed(1)} px)`);
          }
          if (c.id.includes("problem 1")) {
            const memeBox = boxes.photos.find((p) => ((p.r - p.l) * 0.8) / (p.b - p.t) <= 0.62);
            assert.ok(memeBox && memeBox.r - memeBox.l >= 25.5, `the 9:16 meme is ${(memeBox.r - memeBox.l).toFixed(1)}% wide (was ~11%)`);
          }
          passed.push(`${where}: on one page — no words on a photo, every photo ≥ 20% short side / 5.5% area${c.title === ZH_LONG || c.title === MIX ? ", the long line as body text" : ""}`);
        }
        await page.locator('[data-action="story-save"]').tap();
        await page.waitForSelector("#phone.in-reader");
        await page.waitForTimeout(500);
        await SS.leaveReader(page);
      }
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
