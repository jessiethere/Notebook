// V10.35 · Captain's card (contextual actions). The panel opens on one line
// that fits the moment and one or two buttons that really do it:
//   A  nothing kept today          → 选照片 / 随手写
//   B  a page just made, no words  → 写一句话 / 看看成品
//   B  a page just made, words     → 继续编辑 / 看看成品
//   C  today kept (a while ago)    → 翻翻今天 (and "今天 2 页")
//   D  just looked at an older day → 继续翻阅, with that day's date and page
// Opening again shows the next line of that state. Chat stays a chat: asked
// to write, Captain says it can't and offers buttons that really start a page.
// When the model on the Mac does not answer, the simple reply says so.
// zh at 375 and en at 430. Synthetic photos only; nothing leaves the device.
const { chromium } = require("playwright");
require("./signed-in.cjs")(chromium);
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const base = process.env.PREVIEW_URL || "http://127.0.0.1:8080";
const shots = process.env.SHOTS || "";
const I18N = JSON.parse(fs.readFileSync(path.join(__dirname, "../Packages/LittleDaysCore/Sources/LittleDaysCore/Resources/i18n.json"), "utf8"));
const lib = path.join(__dirname, "../Packages/LittleDaysCore/Sources/LittleDaysCore/Resources/Photos");
const photo = (n) => ({ name: `LD-photo-${n}.jpg`, mimeType: "image/jpeg", buffer: fs.readFileSync(path.join(lib, `LD-photo-${n}.jpg`)) });

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || undefined });
  const passed = [];
  try {
    for (const run of [{ lang: "zh", w: 375, h: 667 }, { lang: "en", w: 430, h: 932 }]) {
      const L = (key, values = {}) => Object.entries(values).reduce((s, [k, v]) => s.replace(`{${k}}`, v), I18N[key][run.lang]);
      const lines = (state) => Object.keys(I18N).filter((k) => k.startsWith(`cp.${state}.`)).map((k) => I18N[k][run.lang]);
      const context = await browser.newContext({ viewport: { width: run.w, height: run.h }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
      await context.addInitScript((lang) => localStorage.setItem("little-days.language", lang), run.lang === "zh" ? "zh-CN" : "en");
      const page = await context.newPage();
      await page.clock.install();
      const errors = [], outside = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("dialog", (d) => errors.push(`native dialog: ${d.message()}`));
      page.on("request", (r) => { const host = new URL(r.url()).hostname; if (!["127.0.0.1", "localhost"].includes(host) && !/^(data|blob):/.test(r.url())) outside.push(r.url()); });
      await page.goto(base);
      await page.waitForSelector(".hero");
      const where = `${run.lang} ${run.w}`;
      const shot = async (name) => { if (shots) await page.screenshot({ path: `${shots}/v135-${run.lang}-${name}.png` }); };
      const home = async () => {
        await require("./signed-in.cjs").leaveReader(page);
        await page.locator('#navigation [data-page="home"]').tap();
        await page.waitForSelector(".hero");
      };
      const open = async () => {
        await page.locator('.keeper-home [data-action="keeper-panel"]').tap();
        await page.waitForSelector("#choose-dialog[open] .kp .cp-card");
        return page.evaluate(() => {
          const card = document.querySelector(".kp .cp-card");
          const sheet = document.querySelector(".kp").getBoundingClientRect();
          return {
            state: card.dataset.state,
            line: card.querySelector("p").textContent,
            meta: card.querySelector(".cp-meta")?.textContent || "",
            buttons: [...card.querySelectorAll("button")].map((b) => ({ text: b.textContent, action: b.dataset.action, h: b.getBoundingClientRect().height })),
            quiet: document.querySelector(".kp").classList.contains("quiet"),
            msgs: document.querySelectorAll(".kp .keeper-msg").length,
            oldList: document.querySelectorAll(".kp .kp-do, .kp .kp-chip").length,
            sheet: { top: sheet.top, bottom: sheet.bottom, h: sheet.height },
            vh: innerHeight,
            footer: document.querySelector(".kp .keeper-local")?.textContent || "",
            fieldBottom: document.querySelector(".kp [data-keeper-say]").getBoundingClientRect().bottom,
          };
        });
      };
      const close = async () => {
        await page.locator('.kp [data-action="choose-close"]').first().tap();
        await page.waitForSelector("#choose-dialog:not([open])", { state: "attached" });
      };
      const makePage = async (files, line = "", from = '.v9-hero [data-action="today-photos"]') => {
        const [chooser] = await Promise.all([page.waitForEvent("filechooser"), page.locator(from).first().tap()]);
        await chooser.setFiles(files);
        await page.waitForSelector('[data-action="story-save"]');
        if (line) {
          await page.locator('.qe-tools [data-action="story-text"]').tap();
          await page.locator("#choose-dialog [data-sw-text]").fill(line);
          await page.locator('#choose-dialog [data-action="story-text-done"]').tap();
          await page.waitForSelector("#choose-dialog:not([open])", { state: "attached" });
        }
        await page.locator('[data-action="story-save"]').tap();
        await page.waitForSelector("#phone.in-reader");
        await home();
      };

      // Captain on.
      await page.locator('.keeper-invite [data-action="keeper-onboard"]').tap();
      await page.waitForSelector(".keeper-onboard");
      await page.locator('[data-action="keeper-start"]').tap();
      await page.waitForSelector(".keeper-home");

      // A · nothing kept today: two real buttons, no list of four, no chat yet.
      let p = await open();
      assert.equal(p.state, "A", `${where}: A`);
      assert.equal(p.line, lines("A")[0], "the first open shows the first line");
      assert.deepEqual(p.buttons.map((b) => b.text), [L("cp.photos"), L("cp.write")]);
      assert.ok(p.buttons.every((b) => b.h >= 44), "buttons are big enough to tap");
      assert.equal(p.oldList, 0, "the fixed list of four is gone");
      assert.equal(p.msgs, 0, "no status line pushed into the chat");
      assert.ok(p.quiet && p.sheet.h < p.vh * 0.7, `the panel is only as tall as it needs (${Math.round(p.sheet.h)} of ${p.vh})`);
      assert.ok(p.sheet.bottom <= p.vh + 1 && p.fieldBottom <= p.vh, "the field is on screen");
      assert.equal(p.footer, L("kp.simple"), "says plainly what the simple chat is");
      await shot("A");
      await close();
      p = await open();
      assert.equal(p.line, lines("A")[1], "opening again: the next line, not the same one");
      passed.push(`${where}: A — "${lines("A")[0]}" then "${lines("A")[1]}"; [${p.buttons.map((b) => b.text).join("] [")}]; no list of four; the panel fits what it holds`);

      // 选照片 really starts a page (the panel closes, the photo picker opens).
      // B · just made, photos only.
      await makePage([photo("frost")], "", '.kp [data-action="cp-go"][data-go="today-photos"]');
      p = await open();
      assert.equal(p.state, "B");
      assert.equal(p.line, lines("Bnew")[0]);
      assert.deepEqual(p.buttons.map((b) => b.text), [L("cp.addLine"), L("cp.seePage")]);
      await shot("B-new");
      await page.locator('.kp [data-action="cp-page"]').tap();
      await page.waitForSelector("#phone.in-reader");
      assert.equal(await page.locator("#choose-dialog[open]").count(), 0, "the panel closed");
      await home();
      passed.push(`${where}: B (no words) — "${lines("Bnew")[0]}" [${L("cp.addLine")}] [${L("cp.seePage")}]; 看看成品 opens the page in the reader`);

      // B · just made, with words: 继续编辑 instead of 写一句话.
      await makePage([photo("cookies"), photo("bouquet")], run.lang === "zh" ? "周六的咖啡" : "Saturday coffee");
      p = await open();
      assert.equal(p.state, "B");
      assert.ok(lines("Bsaid").includes(p.line), p.line);
      assert.deepEqual(p.buttons.map((b) => b.text), [L("cp.keepEditing"), L("cp.seePage")]);
      await shot("B-said");
      await close();
      passed.push(`${where}: B (with words) — "${p.line}" [${L("cp.keepEditing")}] [${L("cp.seePage")}]`);

      // C · today kept, a while ago (16 minutes later): the real page count.
      await page.clock.fastForward("16:00");
      p = await open();
      assert.equal(p.state, "C");
      assert.equal(p.line, lines("C")[0]);
      assert.equal(p.meta, L("cp.todayPages", { n: 2 }));
      assert.deepEqual(p.buttons.map((b) => b.text), [L("cp.openToday")]);
      await shot("C");
      await page.locator('.kp [data-action="cp-today"]').tap();
      await page.waitForSelector("#phone.in-reader");
      passed.push(`${where}: C — "${lines("C")[0]}" · ${p.meta}; [${L("cp.openToday")}] opens today's pages`);

      // D · the next day, after looking at that day in the reader.
      await page.clock.fastForward("24:00:00");
      await home();
      p = await open();
      assert.equal(p.state, "D", `${where}: D after the reader (${p.state})`);
      assert.equal(p.line, lines("D")[0]);
      assert.match(p.meta, run.lang === "zh" ? /月.*日 · / : / · /, "the real date and page");
      assert.deepEqual(p.buttons.map((b) => b.text), [L("cp.readOn")]);
      await shot("D");
      await page.locator('.kp [data-action="cp-read-on"]').tap();
      await page.waitForSelector("#phone.in-reader");
      await home();
      passed.push(`${where}: D — "${lines("D")[0]}" · ${p.meta}; [${L("cp.readOn")}] back in the reader`);

      // Chat history: the card stays on top; the panel grows for the words.
      await page.clock.fastForward("40:00");
      p = await open();
      assert.equal(p.state, "A", "a new day with nothing kept yet");
      await page.locator(".kp [data-keeper-say]").fill(run.lang === "zh" ? "今天有点累" : "A bit tired today");
      await page.locator('.kp [data-action="keeper-say"]').tap();
      await page.waitForSelector(".kp .keeper-msg.them:not(.pending)");
      // Asked to write: an honest answer, with buttons that really start a page.
      await page.locator(".kp [data-keeper-say]").fill(run.lang === "zh" ? "帮我写今天的日记" : "help me write today's page");
      await page.locator('.kp [data-action="keeper-say"]').tap();
      await page.waitForFunction(() => document.querySelectorAll(".kp .keeper-msg.them:not(.pending)").length >= 2 && !document.querySelector(".kp .keeper-msg.pending"));
      const chat = await page.evaluate(() => ({
        quiet: document.querySelector(".kp").classList.contains("quiet"),
        cardFirst: document.querySelector(".kp .cp-card").compareDocumentPosition(document.querySelector(".kp .keeper-msgs")) & Node.DOCUMENT_POSITION_FOLLOWING,
        last: [...document.querySelectorAll(".kp .keeper-msg.them")].at(-1)?.textContent || "",
        go: [...document.querySelectorAll(".kp .keeper-msg .cp-acts button")].map((b) => b.dataset.go),
      }));
      assert.equal(chat.quiet, false, "the chat gets its room");
      assert.ok(chat.cardFirst, "the card stays above the chat");
      assert.ok(chat.last.startsWith(L("kp.writeHelp")), `honest about writing: ${chat.last}`);
      assert.deepEqual(chat.go, ["today-photos", "today-write"]);
      await shot("chat");
      await page.locator('.kp .keeper-msg [data-go="today-write"]').tap();
      await page.waitForSelector("#phone.in-studio");
      passed.push(`${where}: chat — the card stays on top; asked to write, "${L("kp.writeHelp")}" with [${L("cp.photos")}] [${L("cp.write")}] that open the real flows`);

      assert.deepEqual(errors, [], `${where}: no errors`);
      assert.deepEqual(outside, [], `${where}: nothing sent off the device`);
      await context.close();
    }

    // The model on the Mac is switched on but does not answer: the simple
    // reply says so (the page never pretends the model replied).
    const context = await browser.newContext({ viewport: { width: 375, height: 667 }, isMobile: true, hasTouch: true });
    await context.addInitScript(() => localStorage.setItem("little-days.language", "zh-CN"));
    const page = await context.newPage();
    await page.route("http://127.0.0.1:11434/**", (route) => route.abort());
    await page.goto(`${base}/?dev-local-ai=qwen3.5:4b`);
    await page.waitForSelector(".hero");
    await page.locator('.keeper-invite [data-action="keeper-onboard"]').tap();
    await page.locator('[data-action="keeper-start"]').tap();
    await page.waitForSelector(".keeper-home");
    await page.locator('.keeper-home [data-action="keeper-panel"]').tap();
    await page.waitForSelector(".kp .cp-card");
    assert.equal(await page.locator(".kp .keeper-local").innerText(), I18N["kp.local"].zh, "with the model on, the footer is the model's note");
    await page.locator(".kp [data-keeper-say]").fill("今天有点累");
    await page.locator('.kp [data-action="keeper-say"]').tap();
    await page.waitForFunction(() => document.querySelector(".kp .keeper-msg.them:not(.pending)") && !document.querySelector(".kp .keeper-msg.pending"));
    assert.match(await page.locator(".kp .keeper-msg.them").last().innerText(), new RegExp(I18N["kp.localDown"].zh));
    if (shots) await page.screenshot({ path: `${shots}/v135-zh-model-down.png` });
    passed.push(`zh 375: the model on the Mac does not answer → the simple reply says "${I18N["kp.localDown"].zh}"`);
    await context.close();
  } finally {
    await browser.close();
  }
  for (const line of passed) console.log("✓", line);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
