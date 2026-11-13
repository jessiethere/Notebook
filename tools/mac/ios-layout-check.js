// V10.35 · Layout check L4, inside the iOS app (WKWebView, the iPhone's own
// fonts). Run by tools/mac/ios-layout-check.sh through the Debug-only
// `-LittleDaysCheck` launch argument: the shell runs this file's body as an
// async function in the page and prints what it returns.
//
// The same eight cases as tests/v133-browser.cjs, through the app's real
// flow (photos → Today's story → words → layout → split → save), but the
// photo picker is skipped: the files are handed to the page's own file input,
// as the picker would. Photos are the app's own library photos (or drawn
// stand-ins); the meme and the 16:9 picture are drawn here. No real person's
// pictures, nothing is sent anywhere.
//
// CHECK_LANG ("zh" | "en") is put in front of this file by the .sh script;
// CHECK_ONLY ("1,8": case numbers) runs only some cases; CHECK_PAUSE (ms) is
// the time on each finished page for a screenshot.
const LANG = typeof CHECK_LANG === "string" ? CHECK_LANG : "zh";
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const $ = (s) => document.querySelector(s);
async function until(test, ms = 8000) {
  for (let t = 0; t < ms; t += 100) {
    const v = test();
    if (v) return v;
    await wait(100);
  }
  return null;
}
const tap = async (sel) => {
  const el = await until(() => $(sel));
  if (!el) throw new Error(`not found: ${sel}`);
  el.click();
  await wait(350);
};

// 1. A signed-in local account in the right language (one reload, then this
// file runs again from the top).
const want = LANG === "zh" ? "zh-CN" : "en";
const seed = {
  "little-days.labs": "1",
  "little-days.studio-guide": JSON.stringify({ tour: "skipped", tips: { dblTap: true } }),
  "little-days.account": JSON.stringify({ version: 1, method: "local", name: "", avatar: "🌷", createdAt: "2026-11-08T00:00:00.000Z", signedIn: true, onboarded: true }),
};
let reload = localStorage.getItem("little-days.language") !== want;
localStorage.setItem("little-days.language", want);
for (const [k, v] of Object.entries(seed)) if (localStorage.getItem(k) === null) { localStorage.setItem(k, v); reload = true; }
const d0 = new Date();
localStorage.setItem("little-days.celebrated", `${d0.getFullYear()}-${String(d0.getMonth() + 1).padStart(2, "0")}-${String(d0.getDate()).padStart(2, "0")}`);
if (reload) {
  setTimeout(() => location.reload(), 50);
  return "reloading for the language / account";
}
await until(() => $("#navigation [data-page]"), 15000);

const zh = LANG === "zh";
const ZH_LONG = "今天和朋友在街角的咖啡馆坐了一个下午，聊了很多以前的事，窗外一直在下小雨，感觉很安静也很幸福";
const EN_LONG = "A whole afternoon at the corner cafe, old stories, soft rain outside";
const MIX = "和 Lily 去 Blue Bottle 喝了 2 杯 latte，回家路上看到 sunset 好开心";
const LONG = zh ? ZH_LONG : EN_LONG;

function drawn(kind, w, h) {
  const c = document.createElement("canvas");
  [c.width, c.height] = [w, h];
  const g = c.getContext("2d");
  const grad = g.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, kind === "meme" ? "#d98b6f" : "#7fa3b8");
  grad.addColorStop(1, kind === "meme" ? "#6f8fd9" : "#e3c48f");
  g.fillStyle = grad;
  g.fillRect(0, 0, w, h);
  if (kind === "meme") {
    g.fillStyle = "#fff";
    g.strokeStyle = "#000";
    g.lineWidth = 8;
    g.font = "bold 84px sans-serif";
    g.textAlign = "center";
    for (const [text, y] of [["周五下班的我", 150], ["冲！！！", 1180]]) {
      g.strokeText(text, w / 2, y);
      g.fillText(text, w / 2, y);
    }
  }
  return new Promise((r) => c.toBlob((b) => r(new File([b], `test-${kind}.jpg`, { type: "image/jpeg" })), "image/jpeg", 0.85));
}
const SHAPES = { frost: [900, 1200], bouquet: [900, 1200], cookies: [900, 1200], donuts: [900, 1200], "ginger-cat": [900, 1200], "city-lights": [900, 1200], "corner-cafe": [1200, 900], "beach-day": [1200, 900], "golden-field": [1200, 900], brunch: [1200, 900] };
async function photo(name) {
  try {
    const res = await fetch(`library/photos/LD-photo-${name}.jpg`);
    if (res.ok) return new File([await res.blob()], `LD-photo-${name}.jpg`, { type: "image/jpeg" });
  } catch {}
  const [w, h] = SHAPES[name] || [900, 1200];
  return drawn(name, w, h);
}
const meme = await drawn("meme", 720, 1280);
const wide = await drawn("wide", 1280, 720);

function boxes(words) {
  const paper = $(".story-canvas .journal-canvas");
  const P = paper.getBoundingClientRect();
  const rel = (r) => ({ l: ((r.left - P.left) / P.width) * 100, r: ((r.right - P.left) / P.width) * 100, t: ((r.top - P.top) / P.height) * 100, b: ((r.bottom - P.top) / P.height) * 100 });
  const photos = [...paper.querySelectorAll(".photo-layer")].filter((el) => !el.closest(".gen")).map((el) => rel(el.getBoundingClientRect()));
  const texts = [...paper.querySelectorAll(".text-layer")].filter((el) => words.includes(el.textContent.trim())).map((el) => ({ text: el.textContent.trim(), ...rel(el.getBoundingClientRect()), size: parseFloat(getComputedStyle(el).fontSize), family: getComputedStyle(el).fontFamily.split(",")[0], paperW: P.width }));
  return { photos, texts, paperW: P.width };
}
function check({ photos, texts }) {
  const out = [];
  const ov = (a, b) => Math.max(0, Math.min(a.r, b.r) - Math.max(a.l, b.l)) * Math.max(0, Math.min(a.b, b.b) - Math.max(a.t, b.t));
  for (const p of photos) {
    const w = p.r - p.l, h = p.b - p.t;
    const short = Math.min(w, h / 0.8);
    const tall = (w * 0.8) / h <= 0.62;
    if (short < (tall ? 25.5 : 19.5)) out.push(`${tall ? "tall picture" : "photo"} short side ${short.toFixed(1)}%`);
    if ((w * h) / 100 < 5.3) out.push(`photo area ${((w * h) / 100).toFixed(1)}%`);
  }
  for (const t of texts) {
    const area = (t.r - t.l) * (t.b - t.t);
    const on = photos.reduce((s, p) => s + ov(t, p), 0) / area;
    if (on > 0.01) out.push(`"${t.text.slice(0, 10)}" ${(on * 100).toFixed(1)}% on a photo`);
    if (t.l < 0 || t.r > 100.5 || t.t < 0 || t.b > 100.5) out.push(`"${t.text.slice(0, 10)}" off the page`);
  }
  return out;
}

const CASES = [
  { id: "1 meme+3+long (problem 1)", files: () => Promise.all([photo("frost"), photo("bouquet"), wide, meme]), title: LONG },
  { id: "2 problem 1 + two captions", files: () => Promise.all([photo("frost"), photo("bouquet"), wide, meme]), title: LONG, caps: zh ? ["窗边的霜花", "第二张照片的一句话"] : ["Frost on the window", "A line for the second photo"], split: [2, 2] },
  { id: "3 five portraits, words (problem 2)", files: () => Promise.all(["frost", "cookies", "donuts", "ginger-cat", "city-lights"].map(photo)), title: zh ? "周六的咖啡" : "Saturday coffee", caps: zh ? ["拿铁", "第二张照片的一句话", "早午餐吃得很饱", "回家路上看到 sunset", "晚安"] : ["Latte", "A line for the second photo", "Brunch, very full", "Sunset on the way home", "Good night"] },
  { id: "4 three photos + long (problem 3)", files: () => Promise.all(["corner-cafe", "frost", "cookies"].map(photo)), title: LONG },
  { id: "5 one 9:16 meme", files: async () => [meme] },
  { id: "6 two landscapes + portrait", files: () => Promise.all(["beach-day", "golden-field", "ginger-cat"].map(photo)), title: zh ? "海边的周末" : "A weekend by the sea" },
  { id: "7 mixed line, Serif, bigger", files: () => Promise.all([photo("corner-cafe"), photo("cookies"), photo("bouquet"), meme]), title: MIX, font: "song", bigger: true },
  { id: "8 six + long + captions", files: () => Promise.all(["frost", "bouquet", "corner-cafe", "cookies", "donuts", "brunch"].map(photo)), title: LONG, caps: zh ? ["霜花", "花束", "街角", "饼干", "甜甜圈", "早午餐"] : ["Frost", "Flowers", "Corner", "Cookies", "Donuts", "Brunch"], split: [3, 3] },
];

// The picker is skipped: the file input's own click() opens nothing during the check.
const input = $("#attachment-image-input");
input.click = () => {};
const PAUSE = Number(typeof CHECK_PAUSE === "number" ? CHECK_PAUSE : 2500); // time for a screenshot
const report = { lang: LANG, screen: [innerWidth, innerHeight], dpr: devicePixelRatio, ua: navigator.userAgent.replace(/.*(iPhone OS [\d_]+).*/, "$1"), cases: [] };
const RUN = typeof CHECK_ONLY === "string" ? CASES.filter((c) => CHECK_ONLY.split(",").some((k) => c.id.startsWith(k))) : CASES;
for (const c of RUN) {
  const row = { id: c.id, at: Date.now() };
  try {
    await tap('#navigation [data-page="home"]').catch(() => {});
    await until(() => $(".hero"));
    await tap('[data-action="today-photos"]');
    const files = new DataTransfer();
    for (const f of await c.files()) files.items.add(f);
    input.files = files.files;
    input.dispatchEvent(new Event("change", { bubbles: true }));
    if (!(await until(() => $('[data-action="story-save"]'), 15000))) throw new Error("Today's story did not open");
    if (c.title || c.caps || c.font) {
      await tap('.qe-tools [data-action="story-text"]');
      await until(() => $("#choose-dialog[open] [data-sw-text]"));
      const fill = (text) => {
        const f = $("#choose-dialog [data-sw-text]");
        f.value = text;
        f.dispatchEvent(new Event("input", { bubbles: true }));
      };
      if (c.title) fill(c.title);
      await wait(300);
      for (const [i, cap] of (c.caps || []).entries()) {
        document.querySelectorAll('#choose-dialog [data-action="sw-target"]')[i + 1].click();
        await wait(300);
        fill(cap);
        await wait(300);
      }
      if (c.font) {
        const more = $("#choose-dialog .sw-more");
        if (!more.open) more.querySelector("summary").click();
        await wait(300);
        await tap(`#choose-dialog [data-action="sw-font"][data-font="${c.font}"]`);
        if (c.bigger) await tap('#choose-dialog [data-action="sw-size"][data-dir="1"]');
      }
      await tap('#choose-dialog [data-action="story-text-done"]');
      await until(() => !$("#choose-dialog[open]"));
    }
    await wait(1500); // fonts arrive; the page is laid out again with the real measure
    const words = [c.title, ...(c.caps || [])].filter(Boolean);
    const split = !!$(".qe-split");
    row.split = split;
    row.expectSplit = !!c.split;
    if (split) {
      row.at = Date.now();
      $(".qe-split").scrollIntoView({ block: "center" });
      await wait(PAUSE);
      await tap('[data-action="story-split-pages"]');
      await until(() => $(".story-tabs"));
      const tabs = document.querySelectorAll(".story-tabs button").length;
      row.pages = [];
      const seen = [];
      for (let i = 0; i < tabs; i++) {
        document.querySelectorAll(".story-tabs button")[i].click();
        await wait(900);
        if (i === 0 && tabs > 2) continue;
        $(".story-canvas")?.scrollIntoView({ block: "start" });
        const b = boxes(words);
        seen.push(...b.texts.map((t) => t.text));
        row.pages.push({ photos: b.photos.length, problems: check(b), texts: b.texts.map((t) => ({ text: t.text.slice(0, 8), px: +t.size.toFixed(1), family: t.family, h: +(t.b - t.t).toFixed(2) })) });
        await wait(PAUSE);
      }
      row.allWords = [...new Set(seen)].sort().join("|") === [...words].sort().join("|");
    } else {
      $(".story-canvas")?.scrollIntoView({ block: "start" });
      const b = boxes(words);
      row.photos = b.photos.map((p) => [+(p.r - p.l).toFixed(1), +(p.b - p.t).toFixed(1)]);
      row.problems = check(b);
      row.texts = b.texts.map((t) => ({ text: t.text.slice(0, 8), px: +t.size.toFixed(1), family: t.family, h: +(t.b - t.t).toFixed(2), w: +(t.r - t.l).toFixed(1) }));
      row.at = Date.now();
      await wait(PAUSE);
    }
    await tap('[data-action="story-save"]');
    await until(() => $("#phone.in-reader"), 8000);
    await wait(600);
    if ($("#choose-dialog[open]")) $("#choose-dialog").close();
    $('[data-action="reader-back"]')?.click();
    await until(() => !$("#phone.in-reader"), 4000);
    await wait(600);
  } catch (e) {
    row.error = String(e?.message || e);
  }
  report.cases.push(row);
}
report.fontsReady = document.fonts?.status;
return JSON.stringify(report);
