// Video cover: pick any frame with a slider, or upload a picture.
// Also grabs an automatic cover when a video is added (so iPhones, which
// don't draw a first frame until playback, never show a black box).

function waitFor(element, event, timeout = 8000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timeout:${event}`)), timeout);
    element.addEventListener(
      event,
      () => {
        clearTimeout(timer);
        resolve();
      },
      { once: true },
    );
  });
}

// Draws the frame at `time` (seconds) of a video URL into a JPEG Blob.
export async function frameAt(url, time = 0.5, maxSide = 1280) {
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.setAttribute("playsinline", "");
  video.preload = "auto";
  video.src = url;
  try {
    await waitFor(video, "loadeddata");
    const target = Math.max(0, Math.min(time, (video.duration || time) - 0.05));
    if (Math.abs(video.currentTime - target) > 0.02) {
      video.currentTime = target;
      await waitFor(video, "seeked");
    }
    return await drawFrame(video, maxSide);
  } finally {
    video.removeAttribute("src");
    video.load();
  }
}
function drawFrame(video, maxSide = 1280) {
  const w = video.videoWidth,
    h = video.videoHeight;
  if (!w || !h) throw new Error("no-frame");
  const factor = Math.min(1, maxSide / Math.max(w, h));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(w * factor);
  canvas.height = Math.round(h * factor);
  canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("encode"))), "image/jpeg", 0.85),
  );
}

// Resolves to {blob} for a chosen frame, {upload: true} to pick a picture,
// or null when cancelled.
export function openPosterPicker(options) {
  const { t, src, duration = 0, poster = "" } = options;
  const dialog = document.getElementById("poster-dialog");
  const max = Math.max(0.1, duration || 0);
  dialog.innerHTML = `<div class="poster-sheet"><h2>${t("poster.title")}</h2><p class="dialog-description">${t("poster.help")}</p>${poster ? `<div class="poster-now"><img src="${poster}" alt=""><span>${t("poster.current")}</span></div>` : ""}<div class="poster-stage"><video playsinline muted preload="auto" src="${src}" ${poster ? `poster="${poster}"` : ""}></video></div><label class="poster-slider"><span>${t("poster.frame")}</span><input type="range" min="0" max="${max}" step="0.05" value="${Math.min(0.5, max)}" data-poster-time><output>0:00</output></label><div class="dialog-actions poster-actions"><button type="button" class="secondary" data-poster="upload">⤒ ${t("poster.upload")}</button><button type="button" class="primary" data-poster="frame">${t("poster.done")}</button></div><button type="button" class="text-button poster-cancel" data-poster="cancel">${t("cancel")}</button></div>`;
  const video = dialog.querySelector("video");
  const slider = dialog.querySelector("[data-poster-time]");
  const output = dialog.querySelector("output");
  const label = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  const seek = () => {
    const value = Number(slider.value);
    output.textContent = label(value);
    try {
      video.currentTime = value;
    } catch {}
  };
  video.addEventListener("loadedmetadata", () => {
    if (!duration && Number.isFinite(video.duration)) slider.max = String(video.duration);
    seek();
  });
  slider.addEventListener("input", seek);
  return new Promise((resolve) => {
    const finish = (result) => {
      dialog.removeEventListener("click", onClick);
      dialog.removeEventListener("cancel", onCancel);
      video.pause();
      video.removeAttribute("src");
      video.load();
      dialog.close();
      resolve(result);
    };
    const onCancel = (event) => {
      event.preventDefault();
      finish(null);
    };
    const onClick = async (event) => {
      const choice = event.target.closest("[data-poster]")?.dataset.poster;
      if (!choice) return;
      if (choice === "cancel") return finish(null);
      if (choice === "upload") return finish({ upload: true });
      try {
        if (video.readyState < 2) await waitFor(video, "loadeddata");
        finish({ blob: await drawFrame(video) });
      } catch {
        finish({ error: true });
      }
    };
    dialog.addEventListener("click", onClick);
    dialog.addEventListener("cancel", onCancel);
    dialog.showModal();
  });
}
