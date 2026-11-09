// V4.6: write right on the paper. A story is either 随手写 (a note: title and
// words typed on the paper) or 自由排版 (photos, text boxes, stickers placed
// freely; text boxes are typed into on the paper too).
const { chromium, devices } = require("playwright");
require("./signed-in.cjs")(chromium);
const { menu } = require("./signed-in.cjs");
const assert = require("node:assert/strict");
const base = process.env.PREVIEW_URL || "http://127.0.0.1:8080";
const shots = process.env.SHOTS_DIR || "";

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || undefined });
  const passed = [];
  try {
    const context = await browser.newContext({ ...devices["iPhone 13"] });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(base);
    await page.waitForSelector(".hero");
    const draft = () =>
      page.evaluate(() => {
        const d = new Date();
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        return JSON.parse(localStorage.getItem("little-days.v1") || "null")?.drafts?.[key];
      });
    const story = async () => (await draft()).moments.at(-1);
    const settle = () => page.waitForTimeout(1300); // drafts save after a short pause

    // 1. 写一个小故事 → a note: type the title and words right on the paper.
    await page.locator('.home-mag [data-action="quick-moment"]').tap();
    await page.waitForSelector('[data-action="page-mode"][data-mode="note"][aria-pressed="true"]');
    assert.equal(await page.evaluate(() => document.activeElement?.dataset.inline), "title");
    await page.keyboard.type("窗边的下午");
    // Tapping blank paper starts typing the words.
    const paper = await page.locator("#journal-canvas").boundingBox();
    await page.mouse.click(paper.x + paper.width * 0.5, paper.y + paper.height * 0.9);
    assert.equal(await page.evaluate(() => document.activeElement?.dataset.inline), "body", "blank paper → typing the words");
    await page.keyboard.type("读了几页书，\n风很温柔。");
    await settle();
    let s = await story();
    assert.equal(s.title, "窗边的下午");
    assert.equal(s.body, "读了几页书，\n风很温柔。");
    assert.equal(s.layoutTemplate, "text");
    // Below the paper: no second title/words box, just a tip and tags.
    assert.equal(await page.locator(".write-card.note-mode .write-title, .write-card.note-mode .write-body").count(), 0);
    assert.match(await page.locator(".write-card.note-mode .write-tip").innerText(), /纸上/);
    if (shots) await page.screenshot({ path: `${shots}/v46-note.png` });
    passed.push("随手写: title and words typed on the paper (tap blank paper to type); nothing duplicated below");

    // 2. One undo step takes back one stretch of typing.
    await page.evaluate(() => document.activeElement.blur());
    await page.locator('[data-action="undo"]').tap();
    await page.waitForFunction(() => document.querySelector('#journal-canvas [data-inline="body"]').innerText.trim() === "");
    assert.equal(await page.locator('#journal-canvas [data-inline="title"]').innerText(), "窗边的下午");
    await page.locator('[data-action="redo"]').tap();
    await page.waitForFunction(() => document.querySelector('#journal-canvas [data-inline="body"]').innerText.includes("风很温柔"));
    passed.push("undo / redo: one step per stretch of typing");

    // 3. 自由排版: what was written stays on the paper as text boxes.
    await page.locator('[data-action="page-mode"][data-mode="layout"]').tap();
    await page.waitForSelector('[data-action="page-mode"][data-mode="layout"][aria-pressed="true"]');
    await settle();
    s = await story();
    assert.notEqual(s.layoutTemplate, "text");
    assert.deepEqual(s.layers.filter((l) => l.kind === "text").map((l) => l.text), ["窗边的下午", "读了几页书，\n风很温柔。"]);
    assert.equal(s.title, "窗边的下午", "still the page's name");
    assert.equal(s.body, "");
    assert.match(await page.locator(".write-card.moment").innerText(), /这一页的名字[\s\S]*页面下方的说明/);
    passed.push("自由排版: the words become text boxes on the paper; the boxes below are labelled name / caption");

    // 4. Tap a text box twice and type into it on the paper.
    const words = s.layers.find((l) => l.text.startsWith("读了"));
    const box = page.locator(`#journal-canvas [data-layer="${words.id}"]`);
    await box.click();
    await box.click();
    await page.waitForFunction(() => document.activeElement?.classList.contains("layer-text"));
    await page.keyboard.press("End");
    await page.keyboard.type("真好。");
    await settle();
    s = await story();
    assert.match(s.layers.find((l) => l.id === words.id).text, /真好。$/);
    await page.evaluate(() => document.activeElement.blur());
    if (shots) await page.screenshot({ path: `${shots}/v46-layout.png` });
    passed.push("text box: second tap types into it right on the paper");

    // 5. Back to 随手写: the paper's title/words are typed there again.
    await page.locator('[data-action="page-mode"][data-mode="note"]').tap();
    await page.waitForSelector('#journal-canvas [data-inline="title"]');
    await settle();
    assert.equal((await story()).layoutTemplate, "text");
    passed.push("switching back to 随手写 works");

    // 6. The day page: its title on the paper can be typed into too, and the
    // box below follows.
    await page.locator('[data-action="save-entry"]').tap();
    await page.waitForSelector(".hero");
    await menu(page, "calendar");
    const today = await page.evaluate(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; });
    await page.locator('[data-action="calendar-mode"][data-mode="wall"]').tap();
    await page.locator(`.wall-day[data-date="${today}"]`).tap();
    await page.waitForSelector(".day-detail");
    assert.equal(await page.locator('.day-detail [contenteditable]').count(), 0, "reading mode is not editable");
    await page.locator('.day-detail-top [data-action="edit-date"]').tap();
    const dayChip = page.locator('[data-action="moment-select"][data-moment=""], .chapter-chips [data-day-page], .chapter-chips button:has-text("当日主页")').first();
    if (await dayChip.count()) await dayChip.tap();
    await page.waitForSelector('#journal-canvas.day-canvas [data-inline="title"]');
    const title = page.locator('#journal-canvas [data-inline="title"]');
    await title.click();
    await page.keyboard.press("End");
    await page.keyboard.type("！");
    await page.waitForFunction(() => document.querySelector("#entry-title")?.value.endsWith("！"));
    passed.push("day page: type on the paper; the box below follows; reading mode stays read-only");

    assert.deepEqual(errors, []);
    console.log(`V4.6 E2E passed (${passed.length} groups):\n - ${passed.join("\n - ")}\nNo page errors.`);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
