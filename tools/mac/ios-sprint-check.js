// V10.41–V10.44 · S1 / counts / S3 / S4 inside the iOS app (WKWebView).
// Run with the Debug-only `-LittleDaysCheck <this file>` on a FRESH install
// (simctl uninstall + install first). It goes through the app's real flow:
// first start → Today's story from three library photos (taken 08:10 /
// 12:40 / 19:20; the photo picker is skipped: the files go to the page's own
// attachment input) → reuse a photo from "this day" → add the optional day cover
// → save → hide the cover in the Reader. Prints one JSON report. Library
// photos only; nothing is sent anywhere.
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
async function until(test, ms = 10000) {
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
  await wait(400);
};
const journal = () => JSON.parse(localStorage.getItem("little-days.v1") || "null");
const today = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; })();
const at = (hhmm) => { const [h, m] = hhmm.split(":").map(Number); const d = new Date(); d.setHours(h, m, 0, 0); return d.getTime(); };
const mediaCount = () => new Promise((resolve) => { const r = indexedDB.open("little-days-media"); r.onsuccess = () => { const c = r.result.transaction("media").objectStore("media").count(); c.onsuccess = () => { resolve(c.result); r.result.close(); }; }; r.onerror = () => resolve(-1); });
async function photo(name, hhmm) {
  const res = await fetch(`library/photos/LD-photo-${name}.jpg`);
  return new File([await res.blob()], `LD-photo-${name}.jpg`, { type: "image/jpeg", lastModified: at(hhmm) });
}
const report = { lang: "", steps: [] };
// The picker is skipped: the file input's own click() opens nothing during the check
// (Home's 选照片 uses #attachment-image-input — the same as tools/mac/ios-layout-check.js).
const input = $("#attachment-image-input");
input.click = () => {};
const step = (name, ok, detail = "") => report.steps.push({ name, ok: Boolean(ok), detail });
try {
  await until(() => $(".hero"), 60000);
  report.lang = document.documentElement.lang;
  // S1 / D1: the first start.
  await tap('#navigation [data-page="books"]');
  const books = $$('[data-action="pull-book"]').length;
  const shelf = $("#app").innerText;
  step("D1 one empty book", books === 1 && /我的手帐|My Journal/.test(shelf) && !$(".suggested-books"), `${books} book(s)`);
  await tap('#navigation [data-page="home"]');
  // Today's story from three photos at three times.
  await tap('[data-action="today-photos"]');
  const files = new DataTransfer();
  for (const f of [await photo("latte-art", "08:10"), await photo("golden-field", "12:40"), await photo("city-lights", "19:20")]) files.items.add(f);
  input.files = files.files;
  input.dispatchEvent(new Event("change", { bubbles: true }));
  // The photo editor may open first (编辑图片 1/3): 跳过 keeps the photos as they are.
  const next = await until(() => $('[data-action="story-save"]') || $('#photo-editor[open] [data-pe-action="cancel"]'), 20000);
  if (next?.matches?.('[data-pe-action="cancel"]')) {
    next.click();
    await wait(500);
  }
  if (!(await until(() => $('[data-action="story-save"]'), 20000))) throw new Error("Today's story did not open");
  await wait(800);
  const pageTabs = $$('.story-tabs [data-action="story-page"]').length;
  step("S4-A no automatic day cover", pageTabs === 3 && Boolean($('[data-action="story-cover-add"]')), `${pageTabs} page tabs`);
  // S3: on the 12:40 page, replace its photo with the 08:10 one from "this day".
  const media0 = await mediaCount();
  $$('.story-tabs [data-action="story-page"]')[1].click();
  await wait(500);
  await tap('.qe-tools [data-panel="photo"]');
  await tap('.qe-photo [data-action="story-pick"]');
  await tap('.qe-photo [data-action="story-replace"]');
  const title = (await until(() => $("#ps-title")))?.textContent || "";
  await tap('.ps-tabs [data-scope="day"]');
  const day0 = (journal().drafts[today] || {}).moments || [];
  const first = day0[0]?.layers.find((l) => l.kind === "photo" && !l.gen)?.mediaRef;
  const thumb = $(`.ps-thumb[data-ref="${first}"]`);
  if (thumb) thumb.click();
  await wait(800);
  const day1 = (journal().drafts[today] || {}).moments || [];
  const second = day1[1]?.layers.find((l) => l.kind === "photo" && !l.gen)?.mediaRef;
  step("S3 reuse from this day", /照片 1|photo 1/i.test(title) && second === first && (await mediaCount()) === media0, `title "${title}", media ${media0}→${await mediaCount()}`);
  // S4-B: add the optional cover, save, read.
  await tap('[data-action="story-cover-add"]');
  const withCover = $$('.story-tabs [data-action="story-page"]').length;
  step("S4-B cover on request", withCover === 4 && (await mediaCount()) === media0, `${withCover} tabs`);
  await tap('[data-action="story-save"]');
  await until(() => $(".reader-count"), 15000);
  const count = () => $(".reader-count")?.textContent || "";
  const shown = count();
  await tap('[data-action="reader-more"]');
  await tap('[data-action="day-cover-toggle"]');
  await wait(600);
  const hidden = count();
  const saved = journal().entries.find((e) => e.date === today);
  step("D3 hide the cover", /4/.test(shown) && /3/.test(hidden) && saved?.dayCoverHidden === true && saved.layers.length > 0, `${shown} → ${hidden}, layers kept ${saved?.layers.length}`);
  step("S1 no samples stored", !journal().entries.some((e) => e.isDemo), "");
} catch (error) {
  report.error = String(error?.message || error);
}
report.ok = !report.error && report.steps.every((s) => s.ok);
return JSON.stringify(report);
