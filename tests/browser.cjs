const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROMIUM_PATH || undefined,
  });
  try {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      timezoneId: "America/New_York",
      acceptDownloads: true,
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(process.env.PREVIEW_URL || "http://127.0.0.1:8080");
    await page.waitForSelector(".hero");
    const nav = (target) =>
      page.locator(`#navigation [data-page="${target}"]`).click();

    // Studio settings live in a summary menu; open one row (if closed).
    const tool = async (id) => {
      if (id === "text") return; // writing is always open (write card)
      const head = page.locator(`[data-action="tool"][data-tool="${id}"]`);
      if ((await head.getAttribute("aria-expanded")) !== "true") await head.click();
    };
    const savedState = () =>
      page.evaluate(() => JSON.parse(localStorage.getItem("little-days.v1")));
    const waitSaved = () =>
      page.waitForFunction(() =>
        document
          .querySelector("#draft-status")
          ?.textContent.includes("草稿已保存在本机"),
      );
    assert.equal(await page.title(), "Little Days · 手帐文具店");
    assert.equal(
      await page
        .locator(".hero img")
        .evaluate((img) => img.complete && img.naturalWidth > 0),
      true,
    );

    // Completion check, cancel, and duration input all persist across navigation.
    await page.locator('[data-action="check"][data-habit="move"]').click();
    assert.equal((await savedState()).checks.length, 1);
    await page.locator('[data-action="check"][data-habit="move"]').click();
    assert.equal((await savedState()).checks.length, 0);
    await page.locator('[data-action="check"][data-habit="reading"]').click();
    await page.locator('#dialog-form [name="minutes"]').fill("35");
    await page.locator('#dialog-form [type="submit"]').click();
    assert.equal((await savedState()).checks[0].minutes, 35);

    // Create a custom themed habit and a book with a chosen cover.
    await nav("growth");
    await page.getByRole("button", { name: "添加习惯", exact: true }).click();
    await page.locator('#dialog-form [name="title"]').fill("每天画一朵花");
    await page.locator('#dialog-form [name="theme"]').fill("My Creative Days");
    await page.locator('#dialog-form [name="target"]').fill("4");
    await page.locator('#dialog-form [type="submit"]').click();
    assert.equal((await savedState()).habits.at(-1).theme, "My Creative Days");
    await nav("books");
    await page.getByRole("button", { name: "创建手帐本", exact: true }).click();
    await page.locator('#dialog-form [name="title"]').fill("测试小日子");
    await page.locator('#dialog-form [name="color"]').selectOption("blue");
    await page.locator('#dialog-form [type="submit"]').click();
    const bookId = (await savedState()).books.at(-1).id;

    // Backfill a date, edit title/body/mood/template/font and put it in that book.
    await nav("calendar");
    const historical = await page
      .locator('[data-action="select-date"]')
      .first()
      .getAttribute("data-date");
    await page
      .locator(`[data-action="select-date"][data-date="${historical}"]`)
      .click();
    await page
      .locator('.date-summary [data-action="edit-date"]')
      .first()
      .click();
    await tool("text");
    await page.locator("#entry-title").fill("一朵花的练习");
    await page.locator("#entry-body").fill("记住今天，也记住慢慢变好的自己。");
    await tool("book");
    await page.locator('[data-editor-field="bookId"]').selectOption(bookId);
    await tool("font");
    await page.locator('[data-editor-field="font"]').selectOption("rounded");
    await tool("mood");
    await page.locator('[data-action="mood"][data-mood="🌷"]').click();
    await tool("paper");
    await page
      .locator('[data-action="template"][data-template="vintage"]')
      .click();
    await tool("stickers");
    await page.locator('[data-action="asset-sticker"]').first().click();
    const layer = page.locator(".layer").first();
    await layer.scrollIntoViewIfNeeded();
    const box = await layer.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(
      box.x + box.width / 2 - 45,
      box.y + box.height / 2 - 25,
      { steps: 8 },
    );
    await page.mouse.up();
    await tool("layer");
    for (const [field, value] of [
      ["scale", "1.5"],
      ["rotation", "20"],
    ]) {
      await page
        .locator(`[data-layer-field="${field}"]`)
        .evaluate((element, value) => {
          element.value = value;
          element.dispatchEvent(new Event("input", { bubbles: true }));
        }, value);
    }
    await waitSaved();
    assert.equal(
      (await savedState()).drafts[historical].layers[0].rotation,
      20,
    );
    await page.locator('[data-action="layer-front"]').click();
    await page.locator('[data-action="undo"]').click();
    await page.locator('[data-action="redo"]').click();

    // Upload a real JPEG into the draft, then export a non-empty PNG.
    await page
      .locator("#photo-input")
      .setInputFiles(
        path.join(
          __dirname,
          "../Packages/LittleDaysCore/Sources/LittleDaysCore/Resources/Media/coffee.jpg",
        ),
      );
    await page.waitForFunction(() =>
      document.querySelector(".canvas-photo img")?.src.startsWith("blob:"),
    );
    const downloadPromise = page.waitForEvent("download");
    await page.locator('[data-action="export"]').click();
    const download = await downloadPromise;
    assert.match(download.suggestedFilename(), /Little-Days-.*\.png/);
    const stream = await download.createReadStream();
    let size = 0;
    for await (const chunk of stream) size += chunk.length;
    assert.ok(size > 10000);
    await page.locator('[data-action="save-entry"]').click();
    assert.equal(
      (await savedState()).entries.find((e) => e.date === historical).title,
      "一朵花的练习",
    );
    assert.equal((await savedState()).drafts[historical], undefined);
    await page.reload();
    await page.waitForSelector(".hero");
    await nav("calendar");
    await page
      .locator(`[data-action="select-date"][data-date="${historical}"]`)
      .click();
    // V3.1: a date with saved content opens the read-only Day Detail.
    await page.waitForSelector(".day-detail");
    assert.match(await page.locator(".day-detail").innerText(), /一朵花的练习/);
    await page.locator('[data-action="day-back"]').click();
    assert.match(
      await page.locator(".date-summary").innerText(),
      /一朵花的练习/,
    );
    await page
      .locator('[data-action="calendar-mode"][data-mode="growth"]')
      .click();
    assert.match(await page.locator(".date-summary").innerText(), /共用日期/);
    await page.locator('[data-action="month"][data-delta="-1"]').click();
    await page.locator('[data-action="month"][data-delta="1"]').click();
    await nav("books");
    await page.locator(`[data-action="pull-book"][data-book="${bookId}"]`).click();
    await page.locator(`[data-action="book"][data-book="${bookId}"]`).click();
    assert.match(await page.locator("#app").innerText(), /一朵花的练习/);

    // Draft restore and text undo also work without formally saving a journal.
    await nav("studio");
    await tool("text");
    await page.locator("#entry-title").fill("尚未收藏的草稿");
    await waitSaved();
    await page.reload();
    await page.waitForSelector(".hero");
    await nav("studio");
    await tool("text");
    assert.equal(
      await page.locator("#entry-title").inputValue(),
      "尚未收藏的草稿",
    );
    await page.locator("#entry-title").fill("修改后");
    assert.equal(await page.locator('[data-action="undo"]').isEnabled(), true);
    await page.locator('[data-action="undo"]').click();
    assert.equal(
      await page.locator("#entry-title").inputValue(),
      "尚未收藏的草稿",
    );

    for (const width of [375, 390, 430]) {
      await page.setViewportSize({ width, height: 844 });
      for (const target of ["home", "calendar", "growth", "books", "studio"]) {
        await nav(target);
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          true,
          `${target} overflows at ${width}`,
        );
      }
    }
    assert.deepEqual(errors, []);
    // Optional screenshots use a fresh profile, so test data does not enter the demo.
    if (process.env.SCREENSHOT_DIR) {
      fs.mkdirSync(process.env.SCREENSHOT_DIR, { recursive: true });
      const fresh = await browser.newContext({
        viewport: { width: 1440, height: 1080 },
        timezoneId: "America/New_York",
      });
      const shot = await fresh.newPage();
      await shot.goto(process.env.PREVIEW_URL || "http://127.0.0.1:8080");
      await shot.waitForSelector(".hero");
      await shot.screenshot({
        path: path.join(process.env.SCREENSHOT_DIR, "little-days-home.png"),
        fullPage: true,
      });
      await shot.setViewportSize({ width: 390, height: 844 });
      await shot.screenshot({
        path: path.join(process.env.SCREENSHOT_DIR, "little-days-iphone.png"),
        fullPage: true,
      });
      await fresh.close();
    }
    console.log(
      "Browser E2E passed: navigation, checks, custom habits/books, backfill, editor, drag/transform, undo/redo, photo upload, PNG export, persistence, drafts, 375/390/430 layouts; no page errors.",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
