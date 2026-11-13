// V10.28 · Step 3: two photos and no words come out as a balanced pair —
// centred, no empty column kept for words — and "换个排版" goes through the
// three arrangements (side by side / one above the other / staggered) with
// every photo kept. A page saved before (an older two-photo layout) is never
// laid out again by itself: opening it in the calendar, the reader, the
// editor and after a reload leaves every place as it was. A page arranged by
// hand is not re-laid without asking.
// Chromium, emulated phones — not a real iPhone.
const { chromium } = require("playwright");
const SS = require("./signed-in.cjs");
SS(chromium);
const assert = require("node:assert/strict");
const path = require("node:path");
const base = process.env.PREVIEW_URL || "http://127.0.0.1:8080";
const lib = path.join(__dirname, "../Packages/LittleDaysCore/Sources/LittleDaysCore/Resources/Photos");

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
      // The story's pages live in today's draft until saved.
      const draftPhotos = async () => {
        const s = await stored();
        const entry = s.drafts[today] || s.entries.find((e) => e.date === today);
        const m = entry.moments.at(-1);
        return { m, photos: m.layers.filter((l) => l.kind === "photo" && !l.gen && l.mediaRef) };
      };

      // ------------------------------------------------ a balanced pair, no empty column
      const [chooser] = await Promise.all([page.waitForEvent("filechooser"), page.locator('[data-action="today-photos"]').first().tap()]);
      await chooser.setFiles(["corner-cafe", "cookies"].map((n) => path.join(lib, `LD-photo-${n}.jpg`)));
      await page.waitForSelector('[data-action="story-save"]');
      await page.waitForTimeout(400);
      const seen = [];
      for (let k = 0; k < 3; k++) {
        const { m, photos } = await draftPhotos();
        assert.equal(photos.length, 2, "both photos on the page");
        assert.ok(!String(m.title || "").trim(), "no words were written");
        assert.equal(m.layoutStyle, "editorial");
        const left = Math.min(...photos.map((p) => p.x - p.w / 2)) - 7;
        const right = 93 - Math.max(...photos.map((p) => p.x + p.w / 2));
        assert.ok(Math.abs(left - right) < 1, `variant ${k}: centred — ${left.toFixed(1)} / ${right.toFixed(1)}`);
        const areas = photos.map((p) => p.w * p.h);
        assert.ok(Math.min(...areas) / Math.max(...areas) >= 0.5, `variant ${k}: two photos of even size (${areas.map((a) => a.toFixed(0))})`);
        assert.equal(m.layers.filter((l) => l.bind === "title" || l.bind === "caption").length, 0, "no empty words box");
        seen.push(JSON.stringify(photos.map((p) => [p.mediaRef, p.x, p.y, p.w, p.h])));
        if (process.env.SHOTS) await page.locator(".story-canvas").screenshot({ path: `${process.env.SHOTS}/v128-pair-${run.lang}-${k}.png` });
        await SS.storyNextLayout(page);
        await page.waitForTimeout(150);
      }
      assert.equal(new Set(seen).size, 3, "three different arrangements");
      assert.equal(JSON.stringify((await draftPhotos()).photos.map((p) => [p.mediaRef, p.x, p.y, p.w, p.h])), seen[0], "a fourth tap comes back to the first");
      passed.push(`${run.lang} ${run.w}: two photos, no words → a centred, even pair; 换个排版 gives three different arrangements and comes back round, both photos kept`);

      // ------------------------------------------------ arranged by hand: not re-laid without asking
      await page.locator('[data-action="story-adjust"]').tap();
      await page.waitForSelector("#canvas-wrap");
      // A hand move (the same flag the editor sets when a photo is dragged).
      const moved = await page.evaluate(() => {
        const photo = document.querySelector('#canvas-wrap .layer[data-layer]');
        return photo?.getAttribute("data-layer");
      });
      assert.ok(moved);
      const box = await page.locator(`#canvas-wrap .layer[data-layer="${moved}"]`).boundingBox();
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width / 2 + 18, box.y + box.height / 2 + 24, { steps: 6 });
      await page.mouse.up();
      await page.waitForTimeout(200);
      // back to the story (the same way the editor goes back)
      await page.locator('[data-action="studio-back"]').first().tap();
      await page.waitForSelector('[data-action="story-save"]');
      const { m: handMade, photos: handPhotos } = await draftPhotos();
      assert.equal(handMade.layoutEdited, true, "the editor marked the page as arranged by hand");
      await SS.storyNextLayout(page);
      await page.waitForSelector("#confirm-dialog[open]");
      await page.locator("#confirm-cancel").tap();
      await page.waitForTimeout(200);
      assert.deepEqual((await draftPhotos()).photos.map((p) => [p.x, p.y]), handPhotos.map((p) => [p.x, p.y]), "cancel keeps the hand arrangement");
      passed.push(`${run.lang} ${run.w}: a page moved by hand asks before a new layout; cancelling keeps every place`);

      await page.locator('[data-action="story-save"]').tap();
      await page.waitForSelector("#phone.in-reader");
      await SS.leaveReader(page);

      // ------------------------------------------------ a page saved by an older version stays as it was
      const old = {
        id: "old-pair-page",
        time: "08:30",
        title: "",
        body: "",
        bookId: "daily",
        layoutTemplate: "scrapbook",
        layoutStyle: "editorial",
        layoutVariant: 0,
        template: "minimal",
        layers: [
          { id: "old-a", kind: "photo", text: "photo", mediaRef: "photo:latte-art", aspect: 1.5, x: 50, y: 30.64, w: 59.84, h: 31.91, scale: 1, rotation: 0, frame: "bare", tape: false, crop: { x: 50, y: 50, zoom: 1 } },
          { id: "old-b", kind: "photo", text: "photo", mediaRef: "photo:cookies", aspect: 0.8, x: 74.4, y: 66.1, w: 37.2, h: 37.2, scale: 1, rotation: 0, frame: "bare", tape: false, crop: { x: 50, y: 50, zoom: 1 } },
        ],
      };
      await page.evaluate(([d, m]) => {
        const s = JSON.parse(localStorage.getItem("little-days.v1"));
        const entry = s.entries.find((e) => e.date === d);
        entry.moments.unshift(m);
        localStorage.setItem("little-days.v1", JSON.stringify(s));
      }, [today, old]);
      await page.reload();
      await page.waitForSelector(".hero");
      const oldNow = async () => (await stored()).entries.find((e) => e.date === today).moments.find((m) => m.id === "old-pair-page");
      const places = (m) => JSON.stringify(m.layers.map((l) => [l.id, l.x, l.y, l.w, l.h, l.rotation]));
      const before = places(old);
      assert.equal(places(await oldNow()), before, "after a reload");
      await SS.menu(page, "calendar");
      await page.locator(`[data-action="select-date"][data-date="${today}"]`).first().tap();
      await page.waitForSelector(".day-detail .day-contents");
      await page.locator(".day-contents button").first().tap();
      await page.waitForSelector("#phone.in-reader");
      await SS.leaveReader(page);
      assert.equal(places(await oldNow()), before, "after the calendar and the reader");
      await SS.menu(page, "calendar");
      await page.locator(`[data-action="select-date"][data-date="${today}"]`).first().tap();
      await page.waitForSelector(".day-detail .day-contents");
      await page.locator('.day-detail .chapter-edit[data-moment="old-pair-page"]').tap();
      await page.waitForSelector("#canvas-wrap");
      await page.waitForTimeout(300);
      await SS.leaveStudio(page);
      await page.reload();
      await page.waitForSelector(".hero");
      const after = await oldNow();
      assert.equal(places(after), before, "after opening it in the editor and reloading");
      assert.equal(after.layers.length, 2);
      passed.push(`${run.lang} ${run.w}: a two-photo page saved by an older version keeps every place through the calendar, the reader, the editor and two reloads`);
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
