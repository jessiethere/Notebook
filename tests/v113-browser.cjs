// V10.13 (development only) · Captain's optional local-model chat, with a
// MOCK Ollama on 127.0.0.1 (this container has no model). Checks the wiring:
// off by default; chat lines go to the model, real features stay with the
// rules; what is sent (no page titles or words); a failure falls back to the
// rules; the reply is never written into the journal; nothing leaves this computer.
const { chromium, devices } = require("playwright");
require("./signed-in.cjs")(chromium);
const assert = require("node:assert/strict");
const http = require("node:http");
const base = process.env.PREVIEW_URL || "http://127.0.0.1:8080";
const shots = process.env.SHOTS || "";

function mockOllama() {
  const seen = [];
  const state = { down: false };
  const server = http.createServer((req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") return res.end();
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      const json = body ? JSON.parse(body) : null;
      seen.push({ url: req.url, body: json });
      if (state.down) {
        res.statusCode = 503;
        return res.end("{}");
      }
      const last = json?.messages?.at(-1)?.content || "";
      const en = /[a-z]/i.test(last) && !/[一-鿿]/.test(last);
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ model: json?.model, message: { role: "assistant", content: en ? "<think>x</think>Oh! You found my good side. *purrs* Thanks!" : "（歪头）嘿嘿，被你发现啦。今天也想被夸一下。还有第三句。" }, eval_count: 12, eval_duration: 400e6 }));
    });
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve({ server, seen, state, endpoint: `http://127.0.0.1:${server.address().port}` })));
}

(async () => {
  const mock = await mockOllama();
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || undefined });
  const passed = [];
  try {
    const context = await browser.newContext({ ...devices["iPhone 13"] });
    const page = await context.newPage();
    const errors = [],
      outside = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("request", (request) => {
      const url = request.url();
      if (!/^(data|blob):/.test(url) && !["127.0.0.1", "localhost"].includes(new URL(url).hostname)) outside.push(url);
    });
    await page.goto(base);
    await page.waitForSelector(".hero");
    // Captain on, and a page today whose words must never be sent.
    await page.locator('.keeper-invite [data-action="keeper-onboard"]').tap();
    await page.locator('[data-action="keeper-pick-mode"][data-mode="interactive"]').tap();
    await page.locator('[data-action="keeper-start"]').tap();
    await page.waitForSelector("#choose-dialog:not([open])", { state: "attached" }).catch(() => {});
    const secret = "紫色长颈鹿秘密";
    await page.evaluate((words) => {
      const s = JSON.parse(localStorage.getItem("little-days.v1"));
      const d = new Date();
      const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      s.entries = s.entries.filter((e) => e.date !== date);
      s.entries.push({ id: "t-own", date, title: words, body: words + "的正文", mood: "", template: "minimal", layers: [], moments: [], bookId: s.books[0].id, visibility: "private", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
      localStorage.setItem("little-days.v1", JSON.stringify(s));
    }, secret);
    await page.reload();
    await page.waitForSelector(".hero");
    const before = await page.evaluate(() => localStorage.getItem("little-days.v1"));
    const openCorner = async () => {
      await page.locator(".keeper-entry").tap();
      await page.waitForSelector('.kp.corner[data-view="home"]');
    };
    const say = async (text) => {
      await page.locator("[data-keeper-say]").fill(text);
      await page.locator(".kp-send").tap();
      await page.waitForFunction(() => !document.querySelector(".kp .keeper-msg.pending"));
      const view = await page.locator(".kp").getAttribute("data-view");
      return view === "home" ? page.locator(".kp .keeper-msg.them").last().innerText() : `→ ${view}`;
    };

    // 1. Off by default: the rules answer, nothing is called.
    await openCorner();
    let reply = await say("你好可爱呀");
    assert.equal(mock.seen.length, 0, "off by default");
    assert.equal(await page.locator(".kp .keeper-msg.local-ai").count(), 0);
    assert.doesNotMatch(reply, /本机模型/);
    await page.locator(".kp .kp-x").first().tap();
    passed.push("off by default: the rules answer and nothing is called");

    // 2. On (dev switch in the address), chat → the model on 127.0.0.1.
    await page.goto(`${base}/?dev-local-ai=qwen3.5:4b`);
    await page.waitForSelector(".hero");
    // Point it at the mock server (the real one would be 127.0.0.1:11434).
    assert.deepEqual(JSON.parse(await page.evaluate(() => localStorage.getItem("little-days.dev.local-ai"))), { on: true, endpoint: "http://127.0.0.1:11434", model: "qwen3.5:4b" }, "the address switch turns it on");
    await page.evaluate((endpoint) => localStorage.setItem("little-days.dev.local-ai", JSON.stringify({ on: true, endpoint, model: "qwen3.5:4b" })), mock.endpoint);
    await page.goto(base);
    await page.waitForSelector(".hero");
    await openCorner();
    reply = await say("你好可爱呀");
    assert.equal(mock.seen.length, 1);
    assert.match(reply, /^嘿嘿，被你发现啦。今天也想被夸一下。/, "the model's reply, cleaned (no stage direction, two sentences)");
    assert.match(reply, /本机模型 · 开发/, "marked as the local model");
    const sent = mock.seen[0].body;
    assert.equal(mock.seen[0].url, "/api/chat");
    assert.equal(sent.model, "qwen3.5:4b");
    assert.equal(sent.think, false);
    const wire = JSON.stringify(sent);
    assert.ok(!wire.includes(secret), "no page title or words are sent");
    assert.deepEqual(sent.messages.map((m) => m.role), ["system", "user"], "only the system prompt and the typed line (the opening rule line is not sent)");
    assert.equal(sent.messages.at(-1).content, "你好可爱呀");
    if (shots) await page.screenshot({ path: `${shots}/v113-local-ai.png` });
    // A second line carries the earlier chat (typed words + model replies only).
    reply = await say("你的柠檬帽真好看");
    const second = mock.seen[1].body.messages;
    assert.deepEqual(second.map((m) => m.role), ["system", "user", "assistant", "user"]);
    assert.match(second[0].content, /柠檬帽|lemon/i, "what Captain wears is in the prompt");
    passed.push("on (dev switch): chat lines go to 127.0.0.1 /api/chat with think:false; the reply is cleaned and marked 本机模型 · 开发; only typed lines and earlier model replies are sent — never the page's title or words");

    // 3. Real features stay with the rules (no call).
    const calls = mock.seen.length;
    reply = await say("你会做什么");
    assert.match(reply, /理一理今天的页面/);
    assert.equal(mock.seen.length, calls, "what can you do → rules");
    reply = await say("帮我整理今天的故事");
    assert.equal(reply, "→ organize");
    assert.equal(mock.seen.length, calls, "organise → the real panel, no model");
    passed.push("real features (你会做什么, 整理今天的故事) stay with the rules — the model is not called");

    // 4. The model server stops → the rules answer, no error.
    await page.locator('.kp [data-action="keeper-view"][data-view="home"]').first().tap().catch(() => {});
    await page.waitForSelector('.kp[data-view="home"]');
    mock.state.down = true;
    reply = await say("今天有点累，但是写完了一页");
    assert.match(reply, /累的时候还写完了一页/, "the rules' reply");
    assert.doesNotMatch(reply, /本机模型/);
    passed.push("model server down → the rules' reply, quietly");

    // 5. English.
    mock.state.down = false;
    await page.locator(".kp .kp-x").first().tap();
    await page.evaluate(() => localStorage.setItem("little-days.language", "en"));
    await page.reload();
    await page.waitForSelector(".hero");
    await openCorner();
    reply = await say("Hello, you're adorable!");
    assert.match(reply, /^Oh! You found my good side\.\n/, "cleaned: no reasoning, no *purrs*, two sentences");
    assert.match(reply, /Local model · dev/);
    assert.match(mock.seen.at(-1).body.messages[0].content, /Answer in English/);
    passed.push("English: English prompt and reply");

    // 6. The journal is untouched; nothing went outside this computer; off again.
    const after = await page.evaluate(() => localStorage.getItem("little-days.v1"));
    const strip = (text) => { const s = JSON.parse(text); delete s.keeper; return JSON.stringify(s.entries); };
    assert.equal(strip(after), strip(before), "no reply was written into the journal");
    await page.goto(`${base}/?dev-local-ai=off`);
    await page.waitForSelector(".hero");
    assert.equal(await page.evaluate(() => localStorage.getItem("little-days.dev.local-ai")), null);
    assert.deepEqual(outside, [], "nothing left this computer");
    assert.deepEqual(errors, []);
    passed.push("journal untouched; ?dev-local-ai=off turns it off; no request left 127.0.0.1");
    await context.close();
  } finally {
    await browser.close();
    mock.server.close();
  }
  for (const line of passed) console.log("✓", line);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
