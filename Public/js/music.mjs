// Background music: a few original soft loops (library.json "music", made by
// tools/make_music.py — no streaming songs). A page can keep one; it plays
// while the day is read or the book is flipped, and goes into a page's video.
// One shared player: only one piece plays at a time, and it pauses when a
// voice note or video starts (the app pauses every other <audio>/<video>).

export const MUSIC_DIR = "library/music/";
export const MUSIC_VOLUME = 0.7;

const esc = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);

export function musicTracks(catalog) {
  return Array.isArray(catalog?.music) ? catalog.music : [];
}
export function findTrack(catalog, id) {
  return (id && musicTracks(catalog).find((track) => track.id === id)) || null;
}
export function trackName(track, language = "zh") {
  return track ? (language === "en" ? track.nameEn : track.nameZh) : "";
}
export function trackMood(track, language = "zh") {
  return track ? (language === "en" ? track.moodEn : track.moodZh) : "";
}
export function clock(seconds) {
  const s = Math.max(0, Math.round(Number(seconds) || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
// The music a day plays when it is read: the cover's, else the first page's.
export function dayMusic(entry) {
  if (!entry) return "";
  return entry.music || (entry.moments || []).find((moment) => moment.music)?.music || "";
}

// A small play / pause chip for a page that has music.
export function musicChipHTML(track, ctx, extra = "") {
  if (!track) return "";
  const name = trackName(track, ctx.language);
  return `<button type="button" class="music-chip" data-action="music-toggle" data-music="${esc(track.id)}" aria-pressed="false" aria-label="${esc(ctx.t("music.toggle", { name }))}" ${extra}><span class="music-note" aria-hidden="true">♫</span><span class="music-name">${esc(name)}</span><i aria-hidden="true">▶</i></button>`;
}

// The shared player. The file is fetched once and played from a blob URL, so
// it also plays inside the iPhone shell (its custom scheme cannot stream).
export function createMusicPlayer({ doc = globalThis.document, fetcher = globalThis.fetch?.bind(globalThis) } = {}) {
  let audio = null,
    current = "";
  const urls = new Map();
  const listeners = new Set();
  const notify = () => listeners.forEach((fn) => fn());
  function element() {
    if (!audio) {
      audio = doc.createElement("audio");
      audio.id = "background-music";
      audio.loop = true;
      audio.preload = "auto";
      audio.hidden = true;
      audio.volume = MUSIC_VOLUME;
      audio.dataset.music = "";
      for (const type of ["play", "playing", "pause", "ended"]) audio.addEventListener(type, notify);
      doc.body.append(audio);
    }
    return audio;
  }
  async function url(track) {
    if (urls.has(track.id)) return urls.get(track.id);
    let result = MUSIC_DIR + track.file;
    try {
      const response = await fetcher(result);
      if (response.ok) result = URL.createObjectURL(await response.blob());
    } catch {}
    urls.set(track.id, result);
    return result;
  }
  async function play(track) {
    if (!track) return false;
    const el = element();
    if (current !== track.id || !el.getAttribute("src")) {
      current = track.id;
      el.dataset.music = track.id;
      notify();
      const src = await url(track);
      if (current !== track.id) return false; // another piece was asked for meanwhile
      el.src = src;
    }
    try {
      await el.play();
      return true;
    } catch {
      notify();
      return false;
    }
  }
  function pause() {
    audio?.pause();
  }
  function stop() {
    if (!current) return;
    current = "";
    if (audio) {
      audio.pause();
      audio.dataset.music = "";
      audio.removeAttribute("src");
      audio.load?.();
    }
    notify();
  }
  return {
    play,
    pause,
    stop,
    url,
    current: () => current,
    playing: () => Boolean(audio && current && !audio.paused),
    onChange: (fn) => listeners.add(fn),
  };
}
