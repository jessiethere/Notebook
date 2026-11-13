// V10.44 · after tools/mac/ios-sprint-check.js: relaunch the app WITHOUT
// reinstalling and run this with `-LittleDaysCheck <this file>`. It checks that
// what was saved survives the restart: three Moments, the reused photo still
// one shared media record (no copy), the hidden day cover still hidden and still
// stored, every photo drawn; then shows the cover again (D3 restore).
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const $ = (s) => document.querySelector(s);
// (one Day view open at a time: #app holds it)
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
const mediaCount = () => new Promise((resolve) => { const r = indexedDB.open("little-days-media"); r.onsuccess = () => { const c = r.result.transaction("media").objectStore("media").count(); c.onsuccess = () => { resolve(c.result); r.result.close(); }; }; r.onerror = () => resolve(-1); });
const report = { lang: "", steps: [] };
const step = (name, ok, detail = "") => report.steps.push({ name, ok: Boolean(ok), detail });
try {
  await until(() => $(".hero"), 60000);
  report.lang = document.documentElement.lang;
  const entry = journal()?.entries.find((e) => e.date === today);
  const refs = (entry?.moments || []).map((m) => m.layers.find((l) => l.kind === "photo" && !l.gen)?.mediaRef);
  step("saved day after restart", entry && entry.moments.length === 3 && entry.dayCoverHidden === true && entry.layers.length > 0, `${entry?.moments.length} Moments, cover hidden ${entry?.dayCoverHidden}`);
  step("reused photo is one shared record", refs[1] && refs[1] === refs[0] && (await mediaCount()) === 3, `media ${await mediaCount()}`);
  // The Day view (Home → today): the hidden cover shows as a quiet row, the photos draw.
  await tap(`[data-action="open-day"][data-date="${today}"]`);
  const note = await until(() => $(".day-cover-hidden"), 15000);
  await wait(1500);
  const imgs = [...document.querySelectorAll("#app .chapter-canvas img")];
  const broken = imgs.filter((i) => !i.complete || !i.naturalWidth).length;
  step("day view after restart", note && !$(".day-page") && imgs.length >= 3 && broken === 0, `hidden-cover row ${Boolean(note)}; ${imgs.length} photos drawn, ${broken} missing`);
  // D3 restore: 显示封面 brings the cover back; nothing was deleted.
  await tap('.day-cover-hidden [data-action="day-cover-toggle"]');
  await until(() => $(".day-page"), 5000);
  const back = journal().entries.find((e) => e.date === today);
  step("D3 show the cover again", $(".day-page") && !$(".day-cover-hidden") && !back.dayCoverHidden && back.layers.length === entry.layers.length, `cover shown, layers ${back.layers.length}`);
} catch (error) {
  report.error = String(error?.message || error);
}
report.ok = !report.error && report.steps.every((s) => s.ok);
return JSON.stringify(report);
