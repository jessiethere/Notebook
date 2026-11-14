// Debug-only (tools/mac/uitest, via -LittleDaysCheck): does an off-page
// <video> on a blob URL load its metadata without a tap (what the app's
// import does right after the photo picker), and after a real tap?
// Makes a 2 s test video from a canvas in memory; nothing is saved.
const box = document.createElement("div");
box.setAttribute("role", "img");
box.style.cssText = "position:fixed;left:0;top:0;width:4px;height:4px;opacity:0.02;pointer-events:none;z-index:2147483647";
box.setAttribute("aria-label", "LDVID:{\"running\":true}");
document.documentElement.append(box);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const out = {};
const canvas = document.createElement("canvas");
canvas.width = 320; canvas.height = 240;
const g = canvas.getContext("2d");
const stream = canvas.captureStream(30);
const mime = ["video/mp4", "video/webm"].find((m) => MediaRecorder.isTypeSupported(m));
const rec = new MediaRecorder(stream, { mimeType: mime });
const chunks = [];
rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
const stopped = new Promise((r) => (rec.onstop = r));
let n = 0;
const draw = setInterval(() => { g.fillStyle = `hsl(${(n += 12) % 360} 60% 60%)`; g.fillRect(0, 0, 320, 240); }, 33);
rec.start(250);
await wait(2000);
rec.stop();
await stopped;
clearInterval(draw);
const blob = new Blob(chunks, { type: rec.mimeType });
out.video = { mime: rec.mimeType, size: blob.size };
const meta = (label) => new Promise((resolve) => {
  const v = document.createElement("video");
  const url = URL.createObjectURL(blob);
  const t0 = performance.now();
  const timer = setTimeout(() => resolve(label + ":timeout"), 10000);
  v.onloadedmetadata = () => { clearTimeout(timer); resolve(label + ":loaded " + Math.round(performance.now() - t0) + "ms d=" + v.duration.toFixed(2)); };
  v.onerror = () => { clearTimeout(timer); resolve(label + ":error " + (v.error && v.error.code)); };
  v.preload = "metadata";
  v.muted = true;
  v.playsInline = true;
  v.src = url;
});
out.noTap = await meta("noTap");
box.setAttribute("aria-label", "LDVID:" + JSON.stringify(out));
const b = document.createElement("button");
b.textContent = "LDVID-tap";
b.setAttribute("aria-label", "LDVID-tap");
b.style.cssText = "position:fixed;left:20px;top:200px;width:200px;height:80px;z-index:2147483647";
b.onclick = async () => { out.afterTap = await meta("afterTap"); box.setAttribute("aria-label", "LDVID:" + JSON.stringify(out)); };
document.documentElement.append(b);
return JSON.stringify(out);
