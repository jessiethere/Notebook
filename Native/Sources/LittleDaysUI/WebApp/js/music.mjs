// Background music: a few original soft loops (library.json "music", made by
// tools/make_music.py — no streaming songs). A page can keep one; it plays
// while the day is read or the book is flipped, and goes into a page's video.
// One shared player: only one piece plays at a time, and it pauses when a
// voice note or video starts (the app pauses every other <audio>/<video>).

export const MUSIC_DIR = "library/music/";
export const MUSIC_VOLUME = 0.7;
export const MUSIC_VOLUME_KEY = "little-days.music-volume";

// How loud the music plays on this device (0–1), remembered.
export function loadVolume(storage = globalThis.localStorage) {
  try {
    const raw = storage?.getItem(MUSIC_VOLUME_KEY);
    const n = raw === null || raw === undefined ? NaN : Number(raw);
    return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : MUSIC_VOLUME;
  } catch {
    return MUSIC_VOLUME;
  }
}
export function saveVolume(value, storage = globalThis.localStorage) {
  const n = Math.min(1, Math.max(0, Number(value) || 0));
  try {
    storage?.setItem(MUSIC_VOLUME_KEY, String(n));
  } catch {}
  return n;
}

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
// The music a day plays when it is read: the cover's, else the first page's,
// else the music of the book the day is in.
export function dayMusic(entry, books = []) {
  if (!entry) return "";
  return entry.music || (entry.moments || []).find((moment) => moment.music)?.music || bookMusic(books, entry.bookId);
}
export function bookMusic(books, bookId) {
  return (bookId && (books || []).find((book) => book.id === bookId)?.music) || "";
}
// A page's own music, else its book's.
export function pageMusic(page, books = [], fallbackBookId = "") {
  return page?.music || bookMusic(books, page?.bookId || fallbackBookId);
}

// A small play / pause chip for a page that has music.
export function musicChipHTML(track, ctx, extra = "") {
  if (!track) return "";
  const name = trackName(track, ctx.language);
  return `<button type="button" class="music-chip" data-action="music-toggle" data-music="${esc(track.id)}" aria-pressed="false" aria-label="${esc(ctx.t("music.toggle", { name }))}" ${extra}><span class="music-note" aria-hidden="true">♫</span><span class="music-name">${esc(name)}</span><i aria-hidden="true">▶</i></button>`;
}

// The shared player. The file is fetched once and played from a blob URL, so
// it also plays inside the iPhone shell (its custom scheme cannot stream).
// iPhone / iPad (also inside the app's shell) ignore <audio>.volume: it always
// reads back 1 and plays at full loudness. There the music goes through a Web
// Audio gain instead, which iOS does honour (V10.49).
export function ignoresVolume(el) {
  try {
    const before = el.volume;
    el.volume = before === 0.5 ? 0.25 : 0.5;
    const ignored = Math.abs(el.volume - (before === 0.5 ? 0.25 : 0.5)) > 0.01;
    el.volume = before;
    return ignored;
  } catch {
    return false;
  }
}
// iPhone / iPad (iPadOS reports a Mac with touch). Their <audio>.volume does
// nothing even when it reads back the value it was given, so it is not enough
// to test the element alone.
export function appleMobile(nav = globalThis.navigator) {
  const ua = String(nav?.userAgent || "");
  return /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && Number(nav?.maxTouchPoints) > 1);
}
export function createMusicPlayer({ doc = globalThis.document, fetcher = globalThis.fetch?.bind(globalThis), volume = MUSIC_VOLUME, AudioContextClass = globalThis.AudioContext || globalThis.webkitAudioContext } = {}) {
  let audio = null,
    current = "",
    level = volume,
    useGain = false,
    graph = null; // { ctx, gain, attached }
  const urls = new Map();
  // The gain is made on the first play (a tap), and the <audio> is routed
  // through it only once the context really runs, so the music is never
  // silenced by a context iOS has not started yet.
  function gainGraph() {
    if (!useGain || !AudioContextClass) return null;
    if (!graph) {
      try {
        const ctx = new AudioContextClass();
        const gain = ctx.createGain();
        gain.gain.value = level;
        gain.connect(ctx.destination);
        graph = { ctx, gain, attached: false };
        try {
          // Plays like media (not muted by the ring / silent switch).
          if (globalThis.navigator?.audioSession) globalThis.navigator.audioSession.type = "playback";
        } catch {}
      } catch {
        useGain = false;
        return null;
      }
    }
    const attach = () => {
      if (graph.attached || graph.ctx.state !== "running") return;
      try {
        graph.ctx.createMediaElementSource(audio).connect(graph.gain);
        graph.attached = true;
        audio.dataset.gain = "1";
      } catch {
        useGain = false;
      }
    };
    if (graph.ctx.state === "running") attach();
    else graph.ctx.resume?.().then(attach, () => {});
    return graph;
  }
  const listeners = new Set();
  const notify = () => listeners.forEach((fn) => fn());
  function element() {
    if (!audio) {
      audio = doc.createElement("audio");
      audio.id = "background-music";
      audio.loop = true;
      audio.preload = "auto";
      audio.hidden = true;
      audio.volume = level;
      useGain = appleMobile() || ignoresVolume(audio);
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
    gainGraph(); // before any await: iOS starts audio only from the tap itself
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
    volume: () => level,
    setVolume(value) {
      level = Math.min(1, Math.max(0, Number(value) || 0));
      if (audio) audio.volume = level;
      if (graph) {
        graph.gain.gain.value = level;
        if (graph.ctx.state !== "running") gainGraph();
      }
    },
    usesGain: () => Boolean(graph?.attached),
    playing: () => Boolean(audio && current && !audio.paused),
    onChange: (fn) => listeners.add(fn),
  };
}
