// Debug-only (tools/mac/uitest, via -LittleDaysCheck): records 3 s from the
// microphone in each format the app could pick, then checks the file the
// same way the app plays it (an <audio> on a blob URL) and decodes it.
// Publishes the result as an accessibility label "LDREC:{json}". Records only
// into memory; nothing is saved or sent.
const box = document.createElement("div");
box.setAttribute("role", "img");
box.style.cssText = "position:fixed;left:0;top:0;width:4px;height:4px;opacity:0.02;pointer-events:none;z-index:2147483647";
box.setAttribute("aria-label", "LDREC:{\"running\":true}");
document.documentElement.append(box);
const out = {};
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function record(mime) {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const rec = new MediaRecorder(stream, { mimeType: mime });
  const chunks = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  const stopped = new Promise((r) => (rec.onstop = r));
  rec.start(250);
  await wait(3000);
  rec.stop();
  await stopped;
  stream.getTracks().forEach((t) => t.stop());
  const blob = new Blob(chunks, { type: rec.mimeType });
  const r = { recMime: rec.mimeType, size: blob.size, chunks: chunks.length };
  const a = new Audio();
  a.preload = "auto";
  const meta = Promise.race([
    new Promise((res) => { a.onloadedmetadata = () => res("loadedmetadata"); a.onerror = () => res("error:" + (a.error && a.error.code)); }),
    wait(5000).then(() => "timeout"),
  ]);
  a.src = URL.createObjectURL(blob);
  r.meta = await meta;
  r.duration = String(a.duration);
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const buf = await ctx.decodeAudioData(await blob.arrayBuffer());
    const d = buf.getChannelData(0);
    let s = 0; for (let i = 0; i < d.length; i++) s += d[i] * d[i];
    r.decoded = { seconds: +buf.duration.toFixed(2), rms: +Math.sqrt(s / d.length).toFixed(5) };
    ctx.close();
  } catch (e) { r.decoded = "fail:" + e.name; }
  r.blob = blob;
  return r;
}
for (const m of ["audio/webm;codecs=opus", "audio/mp4"]) {
  try { out[m] = await record(m); } catch (e) { out[m] = "error:" + e.name; }
}
// Then a real tap plays each file the way the app does (<audio> on a blob URL).
const blobs = {};
for (const [m, r] of Object.entries(out)) if (r && r.blob) { blobs[m] = r.blob; delete r.blob; }
const play = (mime, label) => {
  const b = document.createElement("button");
  b.textContent = label;
  b.setAttribute("aria-label", label);
  b.style.cssText = "position:fixed;left:20px;top:" + (label === "LDPLAY-webm" ? 200 : 300) + "px;width:200px;height:80px;z-index:2147483647;font-size:20px";
  b.onclick = () => {
    const a = document.createElement("audio");
    a.src = URL.createObjectURL(blobs[mime]);
    document.body.append(a);
    const res = (out[mime].play = { events: [] });
    for (const ev of ["loadedmetadata", "playing", "ended", "error", "stalled"]) a.addEventListener(ev, () => res.events.push(ev + (ev === "error" ? ":" + (a.error && a.error.code) : "")));
    a.play().then(() => res.events.push("play-resolved"), (e) => res.events.push("play-rejected:" + e.name));
    setTimeout(() => { res.t = +a.currentTime.toFixed(2); res.duration = String(a.duration); res.paused = a.paused; box.setAttribute("aria-label", "LDREC:" + JSON.stringify(out)); }, 2000);
  };
  document.documentElement.append(b);
};
play("audio/webm;codecs=opus", "LDPLAY-webm");
play("audio/mp4", "LDPLAY-mp4");
out.session = navigator.audioSession ? navigator.audioSession.type + "/" + navigator.audioSession.state : "none";
box.setAttribute("aria-label", "LDREC:" + JSON.stringify(out));
return JSON.stringify(out);
