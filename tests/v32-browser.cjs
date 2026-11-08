// Studio desk (pinned preview + summary menu), paper styles, Pet/Parenting
// presets, Chinese fonts, Moment media, habit journey and book day covers.
// Synthetic data only.
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const base = process.env.PREVIEW_URL || "http://127.0.0.1:8080";
const resources = path.join(__dirname, "../Packages/LittleDaysCore/Sources/LittleDaysCore/Resources");
const jpeg = (name) => fs.readFileSync(path.join(resources, "Media", name));
const catalog = JSON.parse(fs.readFileSync(path.join(resources, "library.json"), "utf8"));
const features = JSON.parse(fs.readFileSync(path.join(resources, "features.json"), "utf8"));
const seed = JSON.parse(fs.readFileSync(path.join(resources, "seed.json"), "utf8"));
function wav() {
  const rate = 8000, count = 16000, buffer = Buffer.alloc(44 + count * 2);
  buffer.write("RIFF"); buffer.writeUInt32LE(buffer.length - 8, 4); buffer.write("WAVEfmt ", 8);
  buffer.writeUInt32LE(16, 16); buffer.writeUInt16LE(1, 20); buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(rate, 24); buffer.writeUInt32LE(rate * 2, 28); buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34); buffer.write("data", 36); buffer.writeUInt32LE(count * 2, 40);
  for (let i = 0; i < count; i++) buffer.writeInt16LE(Math.sin((i / rate) * Math.PI * 520) * 3000, 44 + i * 2);
  return buffer;
}
const today = new Date().toLocaleDateString("sv-SE", { timeZone: "America/New_York" });
const shift = (key, days) => {
  const d = new Date(`${key}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("sv-SE");
};

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || undefined });
  const passed = [];
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, timezoneId: "America/New_York" });
    // Seed a synthetic history: four Fitness check-ins with notes, and two
    // older days filed in the Daily book (one of them last month).
    const lastMonth = shift(today.slice(0, 7) + "-01", -3);
    await context.addInitScript(
      ({ seed, today, days, lastMonth }) => {
        if (localStorage.getItem("little-days.v1")) return;
        const entry = (id, date, title, extra = {}) => ({
          id, date, title, body: "", mood: "🌷", bookId: "daily", photo: "", template: "cute", font: "serif",
          layers: [], media: [], moments: [], isDemo: false, updatedAt: new Date().toISOString(), ...extra,
        });
        const state = {
          schemaVersion: 1,
          habits: seed.habits,
          books: seed.books,
          drafts: {},
          reflections: [],
          checks: days.map(([date, minutes, note]) => ({ habitId: "move", date, minutes, note, detail: "Lower Body", shareNote: false })),
          entries: [
            entry("e-today", today, "今天的小确幸", { photo: "/assets/coffee.jpg" }),
            entry("e-month", lastMonth, "上个月的一天"),
          ],
        };
        localStorage.setItem("little-days.v1", JSON.stringify(state));
      },
      {
        seed,
        today,
        lastMonth,
        days: [
          [shift(today, -4), 40, "第一次深蹲到底"],
          [shift(today, -3), 30, ""],
          [shift(today, -2), 50, "左腿发力更好"],
          [shift(today, -1), 45, "跑步 3 公里"],
        ],
      },
    );
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(base);
    await page.waitForSelector(".hero");
    const nav = (tab) => page.locator(`#navigation [data-page="${tab}"]`).click();
    const tool = async (id) => {
      if (id === "text") return; // writing is always open (write card)
      const head = page.locator(`[data-action="tool"][data-tool="${id}"]`);
      if ((await head.getAttribute("aria-expanded")) !== "true") await head.click();
    };
    const read = () => page.evaluate(() => JSON.parse(localStorage.getItem("little-days.v1")));

    // Studio desk: summary rows, one open at a time, preview stays visible.
    await nav("studio");
    await page.waitForSelector("#journal-canvas");
    // Tools are small icons in a dock at the bottom of the screen.
    const rows = await page.$$eval(".tool-dock [data-action='tool']", (els) => els.map((el) => el.dataset.tool));
    assert.equal(await page.locator(".write-card #entry-title").count(), 1, "writing is always open");
    for (const id of ["photos", "layout", "font", "paper", "mood", "stickers", "media", "book", "chapters"])
      assert.ok(rows.includes(id), `menu has ${id}`);
    assert.equal(await page.locator(".tool-body").count(), 0, "all rows start closed");
    const dock = await page.locator(".tool-dock").boundingBox();
    const navBox = await page.locator("#navigation").boundingBox();
    assert.ok(Math.abs(dock.y + dock.height - navBox.y) < 12, "dock sits right above the tab bar");
    await tool("paper");
    await tool("font");
    assert.equal(await page.locator(".tool-body").count(), 1, "only one row open");
    await tool("paper");
    assert.equal(await page.locator('[data-action="template"]').count(), features.templates.length);
    assert.ok(features.templates.length >= 9, "at least 9 paper styles");
    for (const template of features.templates) {
      await page.locator(`[data-action="template"][data-template="${template.id}"]`).click();
      await page.waitForFunction((id) => document.querySelector("#journal-canvas").classList.contains(id), template.id);
    }
    await page.locator('[data-action="template"][data-template="kraft"]').click();
    assert.equal(await page.locator('[data-tool-value="paper"]').innerText(), "牛皮纸");
    // Scroll to the bottom of the open row: the preview is still on screen.
    await page.locator('[data-action="template"][data-template="watercolor"]').scrollIntoViewIfNeeded();
    await page.evaluate(() => (document.querySelector("#app-scroll").scrollTop += 400));
    const visible = await page.evaluate(() => {
      const box = document.querySelector("#journal-canvas").getBoundingClientRect();
      const frame = document.querySelector("#app-scroll").getBoundingClientRect();
      return box.top >= frame.top - 1 && box.bottom <= frame.bottom + 1 && box.height > 150;
    });
    assert.ok(visible, "preview pinned while editing");
    const small = (await page.locator("#journal-canvas").boundingBox()).width;
    await page.locator('[data-action="preview-size"]').click();
    assert.ok((await page.locator("#journal-canvas").boundingBox()).width > small * 1.3, "preview can be enlarged");
    assert.equal(await page.locator(".tool-sheet").count(), 0, "enlarging closes the sheet");
    // Mood change is visible in the summary and on the page at once.
    await tool("mood");
    await page.locator('[data-action="mood"][data-mood="✨"]').click();
    assert.equal(await page.locator('[data-tool-value="mood"]').innerText(), "✨");
    assert.equal(await page.locator("#journal-canvas .canvas-mood").innerText(), "✨");
    // Adding photos opens Layout right away; the summary follows the template.
    await page.locator("#photos-input").setInputFiles([0, 1, 2].map((i) => ({ name: `p${i}.jpg`, mimeType: "image/jpeg", buffer: jpeg(i % 2 ? "lake.jpg" : "coffee.jpg") })));
    await page.waitForSelector('[data-tool-row="layout"].open');
    await page.locator('[data-action="apply-layout"][data-template="polaroid"]').click();
    await page.waitForFunction(() => document.querySelector('[data-tool-value="layout"]').textContent.includes("拍立得"));
    // Typing the title updates the page preview and the summary row.
    await tool("text");
    await page.locator("#entry-title").fill("十一月的小日子");
    assert.match(await page.locator("#journal-canvas .canvas-title").innerText(), /十一月的小日子/);
    passed.push("studio desk: summary menu, one row open, pinned/enlargeable preview, 9 papers");

    // A Moment with audio: selecting it opens its players directly.
    await page.locator('[data-action="add-moment"]').first().click();
    await page.locator('[data-moment-field="title"]').fill("Evening walk");
    await tool("media");
    await page.locator("#audio-input").setInputFiles({ name: "walk.wav", mimeType: "audio/wav", buffer: wav() });
    await page.waitForSelector('.media-card audio[src^="blob:"]', { state: "attached" });
    await page.locator('.chapter-chip[data-moment=""]').click();
    await page.locator("[data-tool-row='media'] .tool-head").click(); // close
    const walk = page.locator(".chapter-chip", { hasText: "Evening walk" });
    assert.match(await walk.innerText(), /♫1/);
    await walk.click();
    await page.waitForSelector('[data-tool-row="media"].open .ld-player audio[src^="blob:"]', { state: "attached" });
    await page.locator('[data-tool-row="media"] .ld-play').click();
    await page.waitForFunction(() => document.querySelector('[data-tool-row="media"] audio').currentTime > 0.05);
    await page.locator('[data-tool-row="media"] .ld-play').click();
    await page.locator('[data-action="save-entry"]').click();
    await page.waitForSelector(".hero");
    passed.push("moment media plays right after selecting the moment");

    // Pet / Parenting presets and five Chinese fonts.
    await nav("books");
    await page.locator('[data-action="new-book"]').first().click();
    const presets = await page.$$eval("#book-preset option", (els) => els.map((el) => el.value));
    for (const id of ["pet", "parenting", "travel", "relationship", "wedding", "movie"]) assert.ok(presets.includes(id), id);
    await page.locator('#dialog-form [name="title"]').fill("毛孩子日记");
    await page.locator("#book-preset").selectOption("pet");
    assert.ok((await page.locator("[data-field-row]").count()) >= 7);
    await page.locator('#dialog-form [type="submit"]').click();
    const petBook = (await read()).books.at(-1);
    assert.equal(petBook.title, "毛孩子日记");
    assert.ok(petBook.fields.some((field) => field.id === "pet-pet-name"));
    const chineseFonts = catalog.fonts.filter((font) => font.supportsChinese);
    assert.ok(chineseFonts.length >= 5);
    const loaded = await page.evaluate(async (fonts) => {
      const out = [];
      for (const font of fonts) {
        const faces = await document.fonts.load(`24px "${font.family}"`, "小日子");
        out.push(faces.length > 0 && faces.every((face) => face.status === "loaded"));
      }
      return out;
    }, chineseFonts);
    assert.deepEqual(loaded, chineseFonts.map(() => true));
    passed.push("Pet/Parenting/Travel/Relationship/Wedding/Movie presets; 5 Chinese fonts load");

    // Habit journey: read check-ins like a book.
    await nav("growth");
    await page.locator('[data-action="habit-journey"][data-habit="move"]').click();
    await page.waitForSelector(".journey-cover");
    const cover = await page.locator(".journey-cover").innerText();
    assert.match(cover, /4\s*次打卡/);
    assert.match(cover, /165\s*累计分钟/);
    assert.match(cover, /4\s*当前连续/);
    assert.match(await page.locator(".journey-nav").innerText(), /第 1 \/ 5 页/);
    await page.locator('.journey-nav [data-action="journey-page"]').last().click();
    assert.match(await page.locator(".journey-note").innerText(), /第一次深蹲到底/);
    await page.keyboard.press("ArrowRight");
    await page.waitForFunction(() => document.querySelector(".journey-nav").textContent.includes("3 / 5"));
    // Swipe left with the mouse to turn to the next page.
    const box = await page.locator(".journey-page").boundingBox();
    await page.mouse.move(box.x + box.width * 0.8, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.2, box.y + box.height / 2, { steps: 6 });
    await page.mouse.up();
    await page.waitForFunction(() => document.querySelector(".journey-nav").textContent.includes("4 / 5"));
    assert.match(await page.locator(".journey-note").innerText(), /左腿发力更好/);
    // Contents jump straight to a day.
    await page.locator('.journey-day').last().click();
    await page.waitForFunction(() => document.querySelector(".journey-nav").textContent.includes("5 / 5"));
    // Write today's note from the journey; it becomes a new last page.
    await page.locator('.journey [data-action="check-note"]').first().click();
    await page.locator('#dialog-form [name="note"]').fill("今天的心得：休息日拉伸");
    await page.locator('#dialog-form [type="submit"]').click();
    await page.waitForFunction(() => document.querySelector(".journey-nav").textContent.includes("/ 6"));
    const checks = (await read()).checks.filter((c) => c.habitId === "move");
    assert.equal(checks.length, 5);
    assert.equal(checks.filter((c) => c.date === today).length, 1);
    passed.push("habit journey: cover stats, buttons/keys/swipe/contents, write today's note");

    // Books: one cover per day, filter by month or date, open the day.
    await nav("books");
    await page.locator('[data-action="pull-book"][data-book="daily"]').click();
    await page.locator('[data-action="book"][data-book="daily"]').click();
    await page.waitForSelector(".day-cover");
    const covers = await page.locator(".day-cover").count();
    assert.ok(covers >= 2);
    const todayCover = page.locator(`.day-cover[data-date="${today}"]`);
    assert.match(await todayCover.innerText(), /今天的小确幸|十一月的小日子/);
    assert.match(await todayCover.innerText(), /Evening walk/);
    assert.ok((await todayCover.locator("img").count()) >= 1);
    await page.locator('[data-book-filter="month"]').selectOption(lastMonth.slice(0, 7));
    await page.waitForFunction(() => document.querySelectorAll(".day-cover").length === 1);
    assert.match(await page.locator(".day-cover").innerText(), /上个月的一天/);
    await page.locator('[data-book-filter="date"]').fill(today);
    await page.waitForFunction((d) => document.querySelectorAll(".day-cover").length === 1 && document.querySelector(".day-cover").dataset.date === d, today);
    await page.locator('[data-book-filter="date"]').fill("2001-01-01");
    await page.waitForSelector(".book-filter + .empty");
    await page.locator('[data-action="book-filter-clear"]').click();
    await page.waitForFunction((n) => document.querySelectorAll(".day-cover").length === n, covers);
    await todayCover.click();
    await page.waitForSelector(".day-detail .moment-chapter");
    assert.match(await page.locator(".day-detail").innerText(), /Evening walk/);
    passed.push("book day covers with month/date filters open the full day");

    for (const width of [375, 390, 430]) {
      await page.setViewportSize({ width, height: 844 });
      for (const target of ["studio", "growth", "books"]) {
        await nav(target);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${target} ${width}`);
      }
      await nav("growth");
      await page.locator('[data-action="habit-journey"][data-habit="move"]').click();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `journey ${width}`);
    }
    if (process.env.SCREENSHOT_DIR) {
      fs.mkdirSync(process.env.SCREENSHOT_DIR, { recursive: true });
      await page.setViewportSize({ width: 390, height: 844 });
      await page.locator('[data-action="journey-page"][data-page="3"]').first().click();
      await page.locator(".journey").screenshot({ path: path.join(process.env.SCREENSHOT_DIR, "little-days-v32-journey.png") });
    }
    assert.deepEqual(errors, []);
    console.log(`V3.2 E2E passed (${passed.length} groups):\n - ${passed.join("\n - ")}\nNo page errors.`);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
