// V10.6 · Rich text in Journal Studio: bold / italic / underline /
// strikethrough on part of the words. The selection survives a tap on the
// buttons; a caret takes the look for what is typed next; the look is saved,
// survives a reload and re-editing, and is the same when reading, in the
// preview and in the exported picture. Old plain pages are untouched.
const { chromium, devices } = require("playwright");
const SS = require("./signed-in.cjs");
SS(chromium);
const assert = require("node:assert/strict");
const base = process.env.PREVIEW_URL || "http://127.0.0.1:8080";
const shots = process.env.SHOTS || "";

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
    const today = await page.evaluate(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; });
    const shot = async (name) => { if (shots) await page.screenshot({ path: `${shots}/${name}.png` }); };
    const BODY = '#journal-canvas [data-inline="body"]';
    const TITLE = '#journal-canvas [data-inline="title"]';
    const html = (selector) => page.evaluate((s) => document.querySelector(s)?.innerHTML ?? null, selector);
    // Selects characters start..end of the words in an element (as a person's selection would).
    const select = async (selector, start, end) => {
      await page.evaluate(([s, a, z]) => {
        const el = document.querySelector(s);
        const point = (offset) => { const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let node = walker.nextNode(), left = offset; while (node && left > node.length) { left -= node.length; node = walker.nextNode(); } return [node, left]; };
        const range = document.createRange();
        const from = point(a), to = point(z);
        range.setStart(from[0], from[1]);
        range.setEnd(to[0], to[1]);
        const selection = getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
      }, [selector, start, end]);
      await page.waitForTimeout(60);
    };
    const selected = () => page.evaluate(() => getSelection().toString());
    const pressed = (scope) => page.$$eval(`${scope} [data-type-mark][aria-pressed="true"]`, (els) => els.map((el) => el.dataset.typeMark));
    const mark = (key, scope = "#type-bar") => page.locator(`${scope} [data-type-mark="${key}"]`).tap();
    const saved = () => page.evaluate((date) => { const s = JSON.parse(localStorage.getItem("little-days.v1")); return s.drafts[date] || s.entries.find((e) => e.date === date); }, today);

    // 1. Words on the paper: only the selected words change; the selection stays; looks combine.
    await page.locator('[data-action="today-write"]').first().tap();
    await page.waitForSelector(TITLE);
    await page.keyboard.type("买电脑这件事");
    await page.locator(BODY).tap();
    await page.keyboard.type("今天在思考要不要买电脑。");
    assert.deepEqual(await page.$$eval("#type-bar [data-type-mark]", (els) => els.map((el) => el.dataset.typeMark)), ["bold", "italic", "underline", "strike"]);
    // The wider second row must not push the bar (or the page) sideways.
    const barFit = await page.evaluate(() => { const bar = document.querySelector("#type-bar"); const scroll = document.querySelector("#app-scroll"); return { bar: bar.scrollWidth <= bar.clientWidth + 1, page: scroll.scrollWidth <= scroll.clientWidth + 1 }; });
    assert.ok(barFit.bar && barFit.page, JSON.stringify(barFit));
    assert.deepEqual(await pressed("#type-bar"), []);
    await select(BODY, 8, 11);
    assert.equal(await selected(), "买电脑");
    await mark("bold");
    assert.equal(await html(BODY), '今天在思考要不要<span class="rt rt-b" data-m="b">买电脑</span>。');
    assert.equal(await selected(), "买电脑", "the selection is still there after the tap");
    assert.equal(await page.evaluate((s) => document.activeElement === document.querySelector(s), BODY), true, "the caret stays in the words");
    assert.deepEqual(await pressed("#type-bar"), ["bold"]);
    const weights = await page.evaluate((s) => { const el = document.querySelector(s); return [getComputedStyle(el).fontWeight, getComputedStyle(el.querySelector(".rt-b")).fontWeight]; }, BODY);
    assert.ok(Number(weights[1]) >= 700 && Number(weights[1]) > Number(weights[0]), `bold is heavier than the page's words (${weights})`);
    // The app turns faux bold off for its interface; marked words switch it back on (fonts without a bold face).
    assert.notEqual(await page.evaluate((s) => getComputedStyle(document.querySelector(`${s} .rt-b`)).fontSynthesisWeight, BODY), "none");
    await mark("underline");
    assert.deepEqual(await pressed("#type-bar"), ["bold", "underline"]);
    assert.match(await html(BODY), /<span class="rt rt-b rt-u" data-m="bu">买电脑<\/span>/);
    await select(BODY, 2, 5);
    await mark("italic");
    await select(BODY, 5, 8);
    await mark("strike");
    assert.equal(await html(BODY), '今天<span class="rt rt-i" data-m="i">在思考</span><span class="rt rt-s" data-m="x">要不要</span><span class="rt rt-b rt-u" data-m="bu">买电脑</span>。');
    const looks = await page.evaluate((s) => [...document.querySelectorAll(`${s} .rt`)].map((el) => { const c = getComputedStyle(el); return [el.textContent, c.fontStyle, c.textDecorationLine]; }), BODY);
    assert.deepEqual(looks, [["在思考", "italic", "none"], ["要不要", "normal", "line-through"], ["买电脑", "normal", "underline"]]);
    // A second tap takes a look off again; a partly formatted selection becomes all formatted first.
    await select(BODY, 5, 8);
    await mark("strike");
    await select(BODY, 6, 11);
    assert.deepEqual(await pressed("#type-bar"), [], "mixed selection: nothing lit");
    await mark("bold");
    assert.equal(await html(BODY), '今天<span class="rt rt-i" data-m="i">在思考</span>要<span class="rt rt-b" data-m="b">不要</span><span class="rt rt-b rt-u" data-m="bu">买电脑</span>。');
    await mark("bold");
    assert.equal(await html(BODY), '今天<span class="rt rt-i" data-m="i">在思考</span>要不要<span class="rt rt-u" data-m="u">买电脑</span>。');
    await mark("bold");
    await select(BODY, 5, 8);
    await mark("bold");
    await mark("bold");
    await select(BODY, 8, 11);
    await mark("bold");
    await mark("bold");
    await shot("01-body");
    passed.push("on the paper: only the selected words change; the selection and caret stay; B/I/U/S light up; looks combine and toggle off");

    // 2. Only a caret: the look is for what is typed next (and can be switched off again).
    await select(BODY, 12, 12);
    await mark("strike");
    assert.deepEqual(await pressed("#type-bar"), ["strike"]);
    const before = await html(BODY);
    assert.equal(before.includes("rt-s"), false, "nothing changes until words are typed");
    await page.keyboard.type("算了");
    assert.match(await html(BODY), /。<span class="rt rt-s" data-m="x">算了<\/span>$/);
    await mark("strike");
    await page.keyboard.type("再想想");
    assert.match(await html(BODY), /<span class="rt rt-s" data-m="x">算了<\/span>再想想$/);
    // Typing right after bold words continues bold (like Notes); the caret moved, so no look is pending.
    await select(BODY, 11, 11);
    assert.deepEqual(await pressed("#type-bar"), ["bold", "underline"]);
    await page.keyboard.type("吗");
    assert.match(await html(BODY), /data-m="bu">买电脑吗<\/span>/);
    // Input method: the look is applied once the characters are in (not while they are being chosen).
    await select(BODY, 18, 18);
    await mark("italic");
    await page.evaluate((s) => { const el = document.querySelector(s); el.dispatchEvent(new CompositionEvent("compositionstart", { bubbles: true })); document.execCommand("insertText", false, "zhong"); }, BODY);
    assert.equal((await html(BODY)).includes('data-m="i">zhong'), false, "not redrawn while composing");
    await page.evaluate((s) => { const el = document.querySelector(s); document.execCommand("delete"); for (let k = 0; k < 4; k++) document.execCommand("delete"); document.execCommand("insertText", false, "中文"); el.dispatchEvent(new CompositionEvent("compositionend", { bubbles: true, data: "中文" })); }, BODY);
    await page.waitForFunction((s) => /<span class="rt rt-i" data-m="i">中文<\/span>$/.test(document.querySelector(s).innerHTML), BODY);
    passed.push("caret only: the look applies to the words typed next and switches off again; typing after bold words stays bold; input-method text gets the look once it is in");

    // 3. Pasted text is plain words only and takes the look of where it lands.
    await select(BODY, 9, 9);
    await page.evaluate((s) => {
      const data = new DataTransfer();
      data.setData("text/html", '<b style="color:red;font-size:40px">新<a href="https://example.com">的</a></b><img src="x" onerror="window.__hacked=1"><script>window.__hacked=1</script>');
      data.setData("text/plain", "新的");
      document.querySelector(s).dispatchEvent(new ClipboardEvent("paste", { clipboardData: data, bubbles: true, cancelable: true }));
    }, BODY);
    assert.match(await html(BODY), /data-m="bu">买新的电脑吗<\/span>/);
    assert.equal(await page.evaluate((s) => document.querySelector(s).querySelectorAll("b, a, img, script, [style], font").length, BODY), 0, "no outside tags or styles");
    assert.equal(await page.evaluate(() => window.__hacked), undefined);
    // A stray element injected into the words adds no formatting to the saved page.
    await page.evaluate((s) => { const el = document.querySelector(s); const rogue = document.createElement("span"); rogue.dataset.m = "zzz"; rogue.style.color = "red"; rogue.textContent = "!"; el.appendChild(rogue); el.dispatchEvent(new InputEvent("input", { bubbles: true })); }, BODY);
    await page.evaluate(() => document.activeElement?.blur?.());
    passed.push("pasted rich text comes in as plain words (no fonts, colours, links, pictures) with the look of where it lands");

    // 4. A text box: part of it from the bar while typing; all of it from the Font sheet; undo / redo.
    await page.waitForFunction(() => !document.querySelector(".toast.visible"), null, { timeout: 8000 }).catch(() => {});
    await SS.studioMode(page, "layout");
    await page.waitForSelector("#journal-canvas .text-layer");
    const moved = await page.$$eval("#journal-canvas .text-layer .layer-text", (els) => els.map((el) => el.innerHTML));
    assert.ok(moved.some((h) => /data-m="bu">买新的电脑吗<\/span>/.test(h) && /data-m="i">在思考<\/span>/.test(h)), `the words keep their looks as a free text box (${moved.join(" | ")})`);
    await SS.studioDeselect(page);
    await page.locator('.tool-dock [data-action="add-text-layer"]').tap();
    await page.waitForSelector('.text-layer.editing .layer-text');
    const BOX = ".text-layer.active .layer-text";
    await page.keyboard.press("Control+A");
    await page.keyboard.type("Hello 小日子 world");
    assert.equal(await html(BOX), "Hello 小日子 world", "spaces are typed into the box (they used to open the layer panel)");
    assert.equal(await page.locator('.tool-sheet[data-tool-row="layer"]').count(), 0);
    await select(BOX, 6, 9);
    await mark("bold");
    assert.equal(await html(BOX), 'Hello <span class="rt rt-b" data-m="b">小日子</span> world');
    assert.equal(await selected(), "小日子");
    await page.evaluate(() => document.activeElement?.blur?.());
    await page.waitForSelector(".tool-dock.ctx");
    await page.locator('.tool-dock.ctx [data-action="text-style"][data-tab="font"]').tap();
    await page.waitForSelector('.type-sheet [data-type-mark="italic"]');
    assert.deepEqual(await pressed(".type-sheet"), [], "the whole box is not bold");
    const keys = await page.$$eval(".type-sheet [data-type-mark]", (els) => els.map((el) => { const r = el.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; }));
    assert.ok(keys.length === 4 && keys.every(([w, h]) => w >= 44 && h >= 44), `44px keys in the sheet (${keys})`);
    await mark("italic", ".type-sheet");
    assert.equal(await html(BOX), '<span class="rt rt-i" data-m="i">Hello </span><span class="rt rt-b rt-i" data-m="bi">小日子</span><span class="rt rt-i" data-m="i"> world</span>');
    assert.deepEqual(await pressed(".type-sheet"), ["italic"]);
    await shot("02-sheet");
    await page.locator('[data-action="undo"]').first().tap();
    await page.waitForFunction((s) => document.querySelector(s)?.innerHTML === 'Hello <span class="rt rt-b" data-m="b">小日子</span> world', BOX);
    await page.locator('[data-action="undo"]').first().tap();
    await page.waitForFunction((s) => document.querySelector(s)?.innerHTML === "Hello 小日子 world", BOX);
    await page.locator('[data-action="redo"]').first().tap();
    await page.locator('[data-action="redo"]').first().tap();
    await page.waitForFunction((s) => /data-m="bi">小日子/.test(document.querySelector(s)?.innerHTML || ""), BOX);
    await SS.studioClose(page);
    passed.push("a text box: part of it from the bar while typing, all of it from the Font sheet (44px keys); spaces type normally; undo / redo cover formatting; 转为自由文字框 keeps the looks");

    // 5. Preview, save, reload, read, edit again: the same looks everywhere.
    await SS.studioDeselect(page);
    const editing = await page.$$eval("#journal-canvas .text-layer .layer-text", (els) => els.map((el) => el.innerHTML).sort());
    await SS.studioPreview(page);
    const previewing = await page.$$eval("#journal-canvas .text-layer .layer-text, .studio-stage.previewing .text-layer .layer-text", (els) => [...new Set(els.map((el) => el.innerHTML))].sort());
    assert.deepEqual(previewing, editing, "the preview shows the same formatted words");
    await shot("03-preview");
    await SS.studioEdit(page);
    await page.waitForFunction(() => /已保存|Saved/.test(document.querySelector(".sv-top")?.textContent || ""), null, { timeout: 15000 });
    const draft = await saved();
    const moment = draft.moments[0];
    const box = moment.layers.find((layer) => layer.text === "Hello 小日子 world");
    assert.deepEqual(box.marks, [{ start: 0, end: 6, italic: true }, { start: 6, end: 9, bold: true, italic: true }, { start: 9, end: 15, italic: true }]);
    const words = moment.layers.find((layer) => /买新的电脑吗/.test(layer.text));
    assert.equal(words.text.slice(words.marks.find((m) => m.bold && m.underline).start, words.marks.find((m) => m.bold && m.underline).end), "买新的电脑吗");
    assert.equal(JSON.stringify(draft).includes("zzz"), false, "nothing from the stray element was saved");
    assert.equal(typeof words.text, "string", "the words are still a plain string");
    await page.locator('.sv-top [data-action="save-entry"]').tap();
    await page.waitForSelector(".flip-page");
    await page.reload();
    await page.waitForSelector(".hero");
    await page.locator('[data-action="open-day"]').first().tap().catch(() => {});
    if (!(await page.locator(".day-detail").count())) { await page.locator('#navigation [data-page="calendar"]').tap(); await page.locator(`[data-date="${today}"]`).first().tap(); }
    await page.waitForSelector(".day-detail .text-layer .layer-text");
    const reading = await page.$$eval(".day-detail .text-layer .layer-text", (els) => els.map((el) => el.innerHTML).sort());
    assert.deepEqual(reading, editing, "reading after a reload shows the same formatted words");
    await shot("04-reading");
    await page.locator('.day-detail [data-action="read-edit"]').first().tap();
    await page.waitForSelector("#journal-canvas .text-layer .layer-text");
    assert.deepEqual(await page.$$eval("#journal-canvas .text-layer .layer-text", (els) => els.map((el) => el.innerHTML).sort()), editing, "and so does editing it again");
    passed.push("preview, saved data (plain words + ranges), reload, reading and editing again all show the same looks");

    // 6. The exported picture draws the looks too (more ink for bold + underline than for plain words).
    const ink = await page.evaluate(async () => {
      const { renderJournalCanvas } = await import("./js/export.mjs");
      const count = async (marks) => {
        const canvas = await renderJournalCanvas({ id: "p", title: "", body: "", template: "minimal", font: "serif", layers: [{ id: "t", kind: "text", text: "Hello 小日子 world 今天", x: 50, y: 50, w: 80, scale: 1, rotation: 0, fontSize: 20, color: "#000000", align: "left", ...(marks ? { marks } : {}) }], media: [] }, { dayPage: false });
        const data = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
        let dark = 0;
        for (let k = 0; k < data.length; k += 4) if (data[k] < 90 && data[k + 1] < 90 && data[k + 2] < 90) dark++;
        return dark;
      };
      return { plain: await count(null), rich: await count([{ start: 0, end: 16, bold: true, underline: true, strike: true }]), same: await count([]) };
    });
    assert.equal(ink.same, ink.plain, "no marks: drawn exactly as before");
    assert.ok(ink.rich > ink.plain * 1.25, `bold + underline + strike add ink in the picture (${JSON.stringify(ink)})`);
    passed.push("the exported picture draws bold / underline / strikethrough; pages without marks are drawn exactly as before");

    // 7. A plain field elsewhere keeps the marks on their own characters; old pages stay plain.
    await SS.studioDeselect(page);
    assert.equal(await page.evaluate(() => document.querySelectorAll(".day-detail .rt").length), 0);
    const untouched = await page.evaluate(() => { const s = JSON.parse(localStorage.getItem("little-days.v1")); return s.entries.filter((e) => e.isDemo).every((e) => !JSON.stringify(e).includes("Marks") && !JSON.stringify(e).includes('"marks"')); });
    assert.ok(untouched, "sample pages (older plain text) have no marks");
    passed.push("older plain-text pages carry no marks and look the same");

    // 8. The example page from the update notes: one text box with plain, bold, italic and underlined words — editable.
    await SS.menu(page, "home");
    await page.locator(".settings-gear").tap();
    await page.waitForSelector(".s2");
    await page.locator('.s2-about [data-action="whats-new"]').evaluate((el) => el.scrollIntoView({ block: "center" }));
    await page.locator('.s2-about [data-action="whats-new"]').tap();
    await page.waitForSelector(".news-sheet");
    await page.locator('.news-sheet [data-action="rich-demo"]').tap();
    await page.waitForSelector("#journal-canvas .text-layer .layer-text .rt-b");
    const demo = await page.$eval("#journal-canvas .text-layer .layer-text", (el) => ({ html: el.innerHTML, looks: [...el.querySelectorAll(".rt")].map((x) => x.dataset.m), plain: [...el.childNodes].some((n) => n.nodeType === 3 && n.nodeValue.trim().length > 3) }));
    assert.ok(demo.plain && demo.looks.includes("b") && demo.looks.includes("i") && demo.looks.includes("u") && demo.looks.includes("bu"), JSON.stringify(demo.looks));
    assert.match(demo.html, /<span class="rt rt-b" data-m="b">买电脑<\/span>/);
    // It is a real page: edit the box and format more words.
    await page.locator("#journal-canvas .text-layer").first().tap();
    await page.locator('.tool-dock.ctx [data-action="ctx-edit-text"]').tap();
    await page.waitForSelector(".text-layer.editing .layer-text");
    await select(".text-layer.editing .layer-text", 0, 2);
    await mark("strike");
    assert.match(await html(".text-layer.editing .layer-text"), /^<span class="rt rt-s" data-m="x">今天<\/span>/);
    await shot("05-demo");
    passed.push("update notes → “put an example page in today”: one text box mixing plain, bold, italic, underlined words, and it is editable");

    // 9. A small phone: the keys fit in the typing bar.
    const small = await browser.newContext({ viewport: { width: 375, height: 667 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const sp = await small.newPage();
    sp.on("pageerror", (error) => errors.push(error.message));
    await sp.goto(base);
    await sp.waitForSelector(".hero");
    await sp.locator('[data-action="today-write"]').first().tap();
    await sp.waitForSelector(TITLE);
    await sp.keyboard.type("Small");
    const fit = await sp.evaluate(() => { const bar = document.querySelector("#type-bar").getBoundingClientRect(); return { marks: [...document.querySelectorAll("#type-bar [data-type-mark]")].every((b) => { const r = b.getBoundingClientRect(); return r.left >= bar.left && r.right <= bar.right && r.width >= 28; }), overflow: document.documentElement.scrollWidth <= innerWidth + 1 }; });
    assert.ok(fit.marks && fit.overflow, JSON.stringify(fit));
    if (shots) await sp.screenshot({ path: `${shots}/06-375.png` });
    await small.close();
    // (Where the bar sits above a real on-screen keyboard cannot be checked in headless Chromium.)
    passed.push("375 wide: B / I / U / S fit side by side inside the typing bar");

    assert.deepEqual(errors, []);
    console.log(`V10.6 E2E passed (${passed.length} groups):\n - ${passed.join("\n - ")}\nNo page errors.`);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
