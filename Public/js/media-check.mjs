// V10.22 · 检查照片和视频 (Settings): a read-only check of every photo, video
// and sound this device's journal uses, and of where the app is running.
// It never writes, converts, deletes or uploads anything, and its report has
// no names, words or pictures — only dates, kinds, sizes and error names —
// so it can be copied to a developer.
import { visitMediaReferences, blobOf, errName, kindOf } from "./media.mjs";

// The five ways a picture can fail to show, kept apart:
//   missing    no file under that id (never saved, or lost)
//   unreadable a file is there but its data cannot be read
//   empty      a file is there with no data
//   decode     the data is read but the picture / clip will not open
//   badref     the page points at something that is not a valid reference
// unchecked: a video / sound whose data never loaded within the time limit.
// iOS WebKit only loads media after a tap, so this is "not checked", not
// "broken" (V10.26, seen in the iOS Simulator with a readable test video).
export const STATUSES = ["ok", "missing", "unreadable", "empty", "decode", "badref", "unchecked"];

const VALID = /^(media:[a-f0-9-]{36}|photo:[a-z0-9-]+|scene:[a-z0-9-]+|\/assets\/[a-z0-9-]+\.jpg|data:image\/(jpeg|png|webp);base64,)/i;

// Where each referenced file is used: date and page number (no titles).
export function mediaUses(state) {
  const uses = new Map();
  const badRefs = [];
  const pageOf = (entry, moment) => (moment ? (entry.moments || []).indexOf(moment) + 1 : 0);
  const look = (entry, item, moment, draft) => {
    const where = { date: entry.date || "", page: pageOf(entry, moment), draft };
    const add = (value, type) => {
      if (typeof value !== "string" || !value) return;
      if (!VALID.test(value)) badRefs.push({ ...where, type });
      else if (value.startsWith("media:")) {
        const id = value.slice(6);
        if (!uses.has(id)) uses.set(id, { ...where, type });
      }
    };
    add(item.backdrop, "image");
    for (const clip of item.media || []) {
      add(clip.source, "clip");
      add(clip.poster, "image");
    }
    for (const layer of item.layers || []) {
      if (layer.kind === "photo" || layer.kind === "video" || layer.kind === "audio" || layer.mediaRef) add(layer.mediaRef, layer.kind === "photo" || layer.drawing ? "image" : "clip");
      add(layer.sourceRef, "image");
    }
  };
  for (const entry of state.entries || []) {
    look(entry, entry, null, false);
    for (const m of entry.moments || []) look(entry, m, m, false);
  }
  for (const entry of Object.values(state.drafts || {})) {
    look(entry, entry, null, true);
    for (const m of entry.moments || []) look(entry, m, m, true);
  }
  // Anything else the backup counts (book covers, check-in photos…).
  visitMediaReferences(structuredClone(state), (ref, type) => {
    const id = ref.slice(6);
    if (!uses.has(id)) uses.set(id, { date: "", page: 0, draft: false, type });
    return ref;
  });
  return { uses, badRefs };
}

function withTimeout(promise, ms, label) {
  return Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(Object.assign(new Error(label), { name: label })), ms))]);
}
async function opens(blob, kind) {
  if (kind === "photo" || kind === "drawing" || /^image\//.test(blob.type)) {
    if (typeof createImageBitmap === "function") {
      const bitmap = await withTimeout(createImageBitmap(blob), 8000, "timeout");
      bitmap.close?.();
      return;
    }
  }
  const url = URL.createObjectURL(blob);
  try {
    await withTimeout(
      new Promise((resolve, reject) => {
        if (/^image\//.test(blob.type)) {
          const img = new Image();
          img.onload = resolve;
          img.onerror = () => reject(Object.assign(new Error("decode"), { name: "imagedecode" }));
          img.src = url;
          return;
        }
        const el = document.createElement(/^audio\//.test(blob.type) ? "audio" : "video");
        el.preload = "metadata";
        el.muted = true;
        el.onloadedmetadata = resolve;
        el.onerror = () => reject(Object.assign(new Error("media"), { name: "mediaerror" + (el.error?.code || "") }));
        el.src = url;
      }),
      8000,
      "timeout",
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}

// Checks every referenced file. `media` is the app's MediaStore (only its
// read methods are used).
export async function inspectMedia(media, state, { decode = true, limit = 300 } = {}) {
  const { uses, badRefs } = mediaUses(state);
  await media.open();
  const all = await new Promise((resolve, reject) => {
    const r = media.db.transaction("media").objectStore("media").getAll();
    r.onsuccess = () => resolve(r.result || []);
    r.onerror = () => reject(r.error);
  });
  const byId = new Map(all.map((record) => [record.id, record]));
  const items = [];
  for (const [id, where] of [...uses].slice(0, limit)) {
    const record = byId.get(id);
    const item = { id: id.slice(0, 8), ...where, kind: where.type === "clip" ? "clip" : "photo", status: "ok", err: "", size: 0, legacy: false };
    if (!record) {
      item.status = "missing";
      items.push(item);
      continue;
    }
    item.kind = kindOf(record.kind, record.mime);
    item.legacy = !(record.bytes instanceof ArrayBuffer) && record.blob instanceof Blob;
    let blob = null;
    try {
      if (record.bytes instanceof ArrayBuffer) blob = blobOf(record);
      else if (record.blob instanceof Blob) {
        // Read an older record without rewriting it.
        const bytes = await record.blob.arrayBuffer();
        blob = new Blob([bytes], { type: record.mime || record.blob.type });
      }
    } catch (error) {
      item.status = "unreadable";
      item.err = errName(error);
      items.push(item);
      continue;
    }
    if (!blob) {
      item.status = "unreadable";
      item.err = "nodata";
    } else if (!blob.size) item.status = "empty";
    else {
      item.size = blob.size;
      if (decode) {
        try {
          await opens(blob, item.kind);
        } catch (error) {
          const clip = item.kind === "video" || item.kind === "audio" || item.kind === "clip";
          item.status = clip && error?.name === "timeout" ? "unchecked" : "decode";
          item.err = errName(error);
        }
      }
    }
    items.push(item);
  }
  for (const ref of badRefs) items.push({ id: "", ...ref, kind: ref.type === "clip" ? "clip" : "photo", status: "badref", err: "", size: 0, legacy: false });
  const counts = Object.fromEntries(STATUSES.map((s) => [s, items.filter((i) => i.status === s).length]));
  return { items, counts, referenced: uses.size, stored: all.length, unused: all.filter((r) => !uses.has(r.id)).length, legacy: items.filter((i) => i.legacy).length };
}

// Where the app is running — measured, not assumed.
export async function environment() {
  const ua = navigator.userAgent || "";
  const ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  const engine = /Firefox\//.test(ua) && !ios ? "Gecko" : /Chrome\/|Chromium\//.test(ua) && !ios ? "Blink" : /AppleWebKit\//.test(ua) ? "WebKit" : "?";
  const browser = ios
    ? /CriOS\//.test(ua) ? "Chrome (iOS)" : /FxiOS\//.test(ua) ? "Firefox (iOS)" : /EdgiOS\//.test(ua) ? "Edge (iOS)" : /Version\/[\d.]+.*Safari\//.test(ua) ? "Safari" : "in-app web view"
    : /Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "?";
  let embedded = false,
    parent = "";
  try {
    embedded = window.top !== window.self;
  } catch {
    embedded = true;
  }
  try {
    parent = [...(location.ancestorOrigins || [])].join(" > ");
  } catch {}
  if (!parent && embedded && document.referrer) {
    try {
      parent = new URL(document.referrer).origin;
    } catch {}
  }
  let persisted = null,
    usage = null,
    quota = null;
  try {
    persisted = (await navigator.storage?.persisted?.()) ?? null;
  } catch {}
  try {
    const estimate = await navigator.storage?.estimate?.();
    usage = estimate?.usage ?? null;
    quota = estimate?.quota ?? null;
  } catch {}
  let idb = "ok";
  try {
    if (!globalThis.indexedDB) idb = "missing";
  } catch (error) {
    idb = errName(error);
  }
  let local = "ok";
  try {
    localStorage.setItem("little-days.check", "1");
    localStorage.removeItem("little-days.check");
  } catch (error) {
    local = errName(error);
  }
  return {
    engine,
    browser,
    platform: ios ? "iOS" : /Android/.test(ua) ? "Android" : /Mac OS X/.test(ua) ? "macOS" : /Windows/.test(ua) ? "Windows" : /Linux/.test(ua) ? "Linux" : "?",
    shell: document.documentElement.dataset.shell || "",
    address: `${location.protocol}//${location.host}`,
    embedded,
    parent,
    standalone: Boolean(navigator.standalone) || matchMedia?.("(display-mode: standalone)")?.matches || false,
    persisted,
    usage,
    quota,
    idb,
    localStorage: local,
    ua,
  };
}

const MB = (n) => (n == null ? "?" : (n / 1024 / 1024).toFixed(1) + " MB");
// A plain-text report to copy (no names or words from the journal).
export function reportText({ env, result, events, version, now = new Date() }) {
  const lines = [];
  lines.push(`Little Days ${version} · media check · ${now.toISOString()}`);
  lines.push(`engine ${env.engine} · browser ${env.browser} · ${env.platform}${env.shell ? " · shell " + env.shell : ""}`);
  lines.push(`address ${env.address} · embedded ${env.embedded ? "yes" : "no"}${env.parent ? " in " + env.parent : ""}${env.standalone ? " · home screen" : ""}`);
  lines.push(`storage persisted ${env.persisted == null ? "?" : env.persisted ? "yes" : "no"} · used ${MB(env.usage)} of ${MB(env.quota)} · indexedDB ${env.idb} · localStorage ${env.localStorage}`);
  lines.push(`ua ${env.ua}`);
  lines.push(`files used ${result.referenced} · stored ${result.stored} · not used ${result.unused} · older format ${result.legacy}`);
  lines.push(STATUSES.map((s) => `${s} ${result.counts[s]}`).join(" · "));
  for (const item of result.items.filter((i) => i.status !== "ok"))
    lines.push(`  ${item.status.padEnd(10)} ${item.kind.padEnd(6)} ${item.date || "-"}${item.page ? " p" + item.page : " cover"}${item.draft ? " draft" : ""} ${item.id || "-"} ${item.err || ""}`.trimEnd());
  if (events.length) {
    lines.push("recent media events:");
    for (const e of events) lines.push(`  ${new Date(e.t).toISOString().slice(0, 19)} ${e.e}${e.kind ? " " + e.kind : ""}${e.stage ? " stage=" + e.stage : ""}${e.err ? " err=" + e.err : ""}${e.count != null ? " count=" + e.count : ""}`);
  }
  return lines.join("\n");
}
export const MEDIA_EVENTS = /^media_|^draft_save_failed$/;
