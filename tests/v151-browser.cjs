// V10.54 · 创建手帐本: quick create + personal touches on demand.
//  1. The first view is short: the live cover, the name, six featured cover
//     styles (+ 更多封面), folded 更多个性化设置, and 创建 in sight.
//  2. 查看更多封面 opens the cover browser (groups, 22 templates, the 10 new
//     themed covers, the whole photo library); going back keeps every choice.
//  3. Folded sections keep their values and show a summary.
//  4. 创建 waits until the book is really stored: a failed write keeps the
//     dialog and everything in it; 再试一次 saves the same book once (no
//     second copy), then the new book opens.
//  5. An older template still loads and saves with the same id.
// zh at 375 and en at 430. Synthetic names only.
const { chromium } = require("playwright");
require("./signed-in.cjs")(chromium);
const { menu } = require("./signed-in.cjs");
const assert = require("node:assert/strict");
const base = process.env.PREVIEW_URL || "http://127.0.0.1:8080";
const NEW = ["botanical-herbarium", "cafe-receipt", "food-recipe", "travel-postcard", "pet-tag", "everyday-polaroid", "vintage-ticket", "editorial-grid", "pastel-cloud", "seasonal-almanac"];

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || undefined });
  const passed = [];
  try {
    for (const run of [{ lang: "zh", w: 375, h: 667 }, { lang: "en", w: 430, h: 932 }]) {
      const where = `${run.lang} ${run.w}`;
      const context = await browser.newContext({ viewport: { width: run.w, height: run.h }, isMobile: true, hasTouch: true });
      await context.addInitScript((lang) => {
        localStorage.setItem("little-days.language", lang);
        const put = IDBObjectStore.prototype.put;
        IDBObjectStore.prototype.put = function (value, key) {
          if (this.name === "kv" && window.__failMeta) throw new DOMException("simulated", "QuotaExceededError");
          return put.call(this, value, key);
        };
      }, run.lang === "zh" ? "zh-CN" : "en");
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("dialog", (d) => errors.push(`native dialog: ${d.message()}`));
      await page.goto(base);
      await page.waitForSelector(".hero");
      await menu(page, "books");
      await page.waitForTimeout(300);
      await page.locator('.page-top [data-action="new-book"]').tap();
      await page.waitForSelector("#form-dialog[open] .book-main");
      await page.waitForTimeout(300);

      // 1 · The short first view.
      const first = await page.evaluate(() => {
        const d = document.querySelector("#form-dialog");
        const submit = document.querySelector("#dialog-form .book-submit").getBoundingClientRect();
        const name = document.querySelector('#dialog-form [name="title"]').getBoundingClientRect();
        return {
          height: d.scrollHeight,
          featured: document.querySelectorAll(".cover-featured .cover-option").length,
          more: !!document.querySelector(".cover-featured .cover-more-tile") && !!document.querySelector(".cover-more-link"),
          open: document.querySelectorAll("#dialog-form details.book-more[open]").length,
          folds: document.querySelectorAll("#dialog-form details.book-more").length,
          submitIn: submit.bottom <= innerHeight && submit.top > 0,
          nameIn: name.top > 0 && name.bottom < innerHeight / 2,
          photoRows: document.querySelectorAll(".book-main .cover-photo-picks").length,
          description: !!document.querySelector('.book-main details [name="description"]'),
        };
      });
      assert.ok(first.featured >= 3 && first.featured <= 6, `${where}: ${first.featured} featured`);
      assert.ok(first.more, `${where}: 更多封面`);
      assert.equal(first.open, 0, `${where}: personal touches folded`);
      assert.equal(first.folds, 3, where);
      assert.ok(first.submitIn, `${where}: 创建 in sight`);
      assert.ok(first.nameIn, `${where}: the name near the top`);
      assert.equal(first.photoRows, 0, `${where}: no photo wall on the first view`);
      assert.ok(first.description, `${where}: the description is folded, not gone`);
      assert.ok(first.height < 820, `${where}: first view ${first.height}px (V10.52: about 887px)`);
      passed.push(`${where}: short first view — cover, name, ${first.featured} featured styles + more, folded touches, 创建 in sight (${first.height}px)`);

      // 2 · The cover browser.
      const name = run.lang === "zh" ? "猫咪的小日子" : "Our cat days";
      await page.locator('#dialog-form [name="title"]').fill(name);
      await page.locator(".cover-more-link").tap();
      await page.waitForSelector("#cover-browser:not([hidden]) #cover-browser-grid .cover-option");
      assert.ok(await page.locator(".book-main").isHidden(), `${where}: the first view steps aside`);
      assert.ok(await page.locator(".book-actions").isHidden(), `${where}: 创建 waits while browsing`);
      const all = await page.locator("#cover-browser-grid .cover-option").count();
      assert.equal(all, 22, `${where}: 22 templates`);
      for (const id of NEW) assert.equal(await page.locator(`#cover-browser-grid [data-template="${id}"] .cover-theme.cover-${id}`).count(), 1, `${where}: ${id}`);
      await page.locator('[data-action="cover-group"][data-group="life"]').tap();
      const life = await page.locator("#cover-browser-grid .cover-option").evaluateAll((els) => els.map((e) => e.dataset.template));
      assert.ok(life.length >= 6 && life.every((id) => !id.startsWith("magazine-")), `${where}: life themes ${life}`);
      await page.locator('#cover-browser-grid [data-template="pet-tag"]').tap();
      await page.locator('#cover-browser-photos [data-photo="lazy-cat"]').scrollIntoViewIfNeeded();
      await page.locator('#cover-browser-photos [data-photo="lazy-cat"]').tap();
      await page.waitForTimeout(200);
      // The photos load lazily, a few at a time.
      const lazy = await page.locator("#cover-browser-photos img[loading=lazy]").count();
      assert.ok(lazy >= 70, `${where}: library photos load lazily (${lazy})`);
      const top = await page.evaluate(() => ({ cls: document.querySelector("#cover-browser-preview .book-cover").className, src: document.querySelector("#cover-browser-preview img")?.getAttribute("src") || "", label: document.querySelector("#cover-browser-name").textContent }));
      assert.match(top.cls, /cover-pet-tag/);
      assert.match(top.src, /lazy-cat/);
      // The themed covers' library photos really load.
      await page.locator('[data-action="cover-group"][data-group="all"]').tap();
      await page.waitForTimeout(600);
      const broken = await page.evaluate(async () => {
        const imgs = [...document.querySelectorAll("#cover-browser-grid .cover-theme img")];
        await Promise.all(imgs.map((img) => (img.complete ? null : new Promise((r) => { img.onload = img.onerror = r; img.loading = "eager"; }))));
        return imgs.filter((img) => !img.naturalWidth).map((img) => img.getAttribute("src"));
      });
      assert.deepEqual(broken, [], `${where}: every cover photo loads`);
      await page.locator(".cb-back").tap();
      await page.waitForSelector(".book-main:not([hidden])");
      const back = await page.evaluate(() => ({ title: document.querySelector('#dialog-form [name="title"]').value, tpl: document.querySelector('#dialog-form [name="coverTemplate"]').value, cls: document.querySelector("#book-cover-preview .book-cover").className, featured: document.querySelector(".cover-featured .cover-option.selected")?.dataset.template }));
      assert.equal(back.title, name, `${where}: the name kept`);
      assert.equal(back.tpl, "pet-tag");
      assert.match(back.cls, /cover-pet-tag/);
      assert.equal(back.featured, "pet-tag", `${where}: the chosen cover shows in the short row`);
      passed.push(`${where}: cover browser — 22 templates in groups, 10 new themed covers with loading photos, a library photo, back keeps the name and choices`);

      // 3 · Folded values stay, with a summary.
      await page.locator('details[data-book-section="basics"] > summary').tap();
      const word = run.lang === "zh" ? "两只猫的日常" : "Two cats, every day";
      await page.locator('#dialog-form [name="description"]').fill(word);
      const entry = page.locator("#dialog-form [data-tag-entry]");
      await entry.fill(run.lang === "zh" ? "猫咪" : "cats");
      await entry.press("Enter");
      await page.locator('#dialog-form [name="category"]').fill("Pets");
      await page.locator('details[data-book-section="basics"] > summary').tap();
      await page.waitForTimeout(150);
      const hint = await page.locator('[data-section-hint="basics"]').innerText();
      assert.match(hint, /Pets/);
      assert.match(hint, run.lang === "zh" ? /#猫咪/ : /#cats/);
      assert.match(await page.locator('[data-section-hint="settings"]').innerText(), run.lang === "zh" ? /私人/ : /Private/);
      assert.equal(await page.locator('#dialog-form [name="description"]').inputValue(), word, `${where}: kept when folded`);
      passed.push(`${where}: folded sections keep their values; summaries say Pets · #tag and Private`);

      // 4 · Saving: a failed write keeps everything; a retry saves one book and opens it.
      await page.evaluate(() => (window.__failMeta = true));
      await page.locator("#dialog-form .book-submit").tap();
      await page.waitForSelector("#confirm-dialog[open]");
      assert.match(await page.locator("#confirm-message").innerText(), run.lang === "zh" ? /还没保存好/ : /isn't saved yet/);
      assert.ok(await page.locator("#form-dialog[open]").count(), `${where}: the dialog stays`);
      await page.locator("#confirm-cancel").tap();
      await page.waitForTimeout(200);
      assert.equal(await page.locator('#dialog-form [name="title"]').inputValue(), name);
      assert.equal(await page.locator('#dialog-form [name="description"]').inputValue(), word);
      assert.equal(await page.locator('#dialog-form [name="coverTemplate"]').inputValue(), "pet-tag");
      assert.ok(await page.locator("#dialog-form .book-submit").isEnabled(), `${where}: 创建 can be tapped again`);
      await page.evaluate(() => (window.__failMeta = false));
      // Two quick taps make one book.
      await page.locator("#dialog-form .book-submit").evaluate((b) => { b.click(); b.click(); });
      await page.waitForSelector(".book-share");
      const saved = await page.evaluate((name) => JSON.parse(localStorage.getItem("little-days.v1")).books.filter((b) => b.title === name), name);
      assert.equal(saved.length, 1, `${where}: one book, not two`);
      assert.equal(saved[0].coverTemplate, "pet-tag");
      assert.equal(saved[0].coverImage, "photo:lazy-cat");
      assert.equal(saved[0].description, word);
      assert.equal(saved[0].visibility, "private");
      assert.equal(await page.locator(".book-share").getAttribute("data-book"), saved[0].id, `${where}: the new book is open`);
      assert.ok(await page.locator(".book-detail-showcase .cover-pet-tag, .cover-pet-tag").count(), `${where}: the same cover on the book page`);
      passed.push(`${where}: a failed write keeps the dialog and every value; the retry saves one book (two taps → one) and opens it`);

      // 5 · An older template keeps its meaning.
      await page.locator('[data-action="edit-book"]').first().tap();
      await page.waitForSelector("#form-dialog[open] .book-main");
      await page.locator(".cover-more-link").tap();
      await page.locator('[data-action="cover-group"][data-group="paper"]').tap();
      await page.locator('#cover-browser-grid [data-template="vintage-leather"]').tap();
      await page.locator(".cb-done").tap();
      await page.locator("#dialog-form .book-submit").tap();
      await page.waitForFunction(() => !document.querySelector("#form-dialog").open);
      await page.locator('[data-action="edit-book"]').first().tap();
      await page.waitForSelector("#form-dialog[open] .book-main");
      assert.match(await page.locator("#book-cover-preview .book-cover").getAttribute("class"), /cover-vintage-leather/);
      assert.equal(await page.locator('.cover-featured .cover-option.selected').getAttribute("data-template"), "vintage-leather");
      await page.locator('[data-action="close-dialog"]').first().tap();
      passed.push(`${where}: an older template (vintage-leather) loads, saves and reopens the same`);

      // English text fits (no clipped labels in the short view).
      if (run.lang === "en") {
        await menu(page, "books");
        await page.waitForTimeout(300);
        await page.locator('.page-top [data-action="new-book"]').tap();
        await page.waitForSelector("#form-dialog[open] .book-main");
        const clipped = await page.evaluate(() => [...document.querySelectorAll(".cover-more-tile b, .book-more-title b, .book-more summary b, .book-actions button")].filter((el) => el.scrollWidth > el.clientWidth + 1).map((el) => el.textContent));
        assert.deepEqual(clipped, [], "en labels fit");
        await page.locator('[data-action="close-dialog"]').first().tap();
        passed.push("en 430: labels fit");
      }
      assert.deepEqual(errors, [], `${where}: ${errors.join(" | ")}`);
      await context.close();
    }
  } finally {
    await browser.close();
  }
  console.log(`V10.54 create-book E2E passed (${passed.length} groups):\n - ${passed.join("\n - ")}`);
  console.log("No page errors.");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
