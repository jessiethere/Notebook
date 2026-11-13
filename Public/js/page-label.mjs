// V10.27 · A page's title is optional, always. When a page has no title we
// never show "未命名的一页" / "Untitled page": we show a display label built
// from what the page really has. The label is only for showing — it is never
// written into page.title, so adding a title later shows it, and deleting the
// title brings the label back. No AI, no network, no guessing about feelings.
//
// Order: 1. the title the person wrote; 2. a short piece of their own words;
// 3. what is on the page (2 photos · 1 video); 4. the time of day it was
// recorded (evening notes); 5. the page number. Callers add the time
// ("11:05 · ") where a list needs it.

const clean = (value) => String(value ?? "").replace(/\s+/g, " ").trim();

// The person's own words on a page (not the title, not copies made by the
// day spread, not words bound to the title).
export function pageWords(page) {
  if (!page) return "";
  const body = clean(page.body);
  if (body) return body;
  const title = clean(page.title);
  const text = (page.layers || [])
    .filter((layer) => layer?.kind === "text" && !layer.bind && !layer.gen)
    .map((layer) => clean(layer.text))
    .find((words) => words && words !== title);
  return text || "";
}

// What is on a page: photos (own photos and library pictures, not drawings or
// copies), videos and sounds.
export function pageMedia(page, { dayPage = false } = {}) {
  const layers = page?.layers || [];
  const photos = new Set();
  if (/^(photo|media):/.test(String(page?.backdrop || ""))) photos.add(page.backdrop);
  if (dayPage && page?.photo) photos.add(page.photo);
  for (const layer of layers) if (layer?.kind === "photo" && layer.mediaRef && !layer.drawing && !layer.gen) photos.add(layer.mediaRef);
  const clipKinds = (kind) => new Set([...(page?.media || []).filter((clip) => clip?.kind === kind).map((clip) => clip.id), ...layers.filter((layer) => layer?.kind === kind && layer.clipId).map((layer) => layer.clipId)]).size;
  return { photos: photos.size, videos: clipKinds("video"), audios: clipKinds("audio") };
}

export function clip(text, max = 18) {
  const chars = [...clean(text)];
  return chars.length > max ? chars.slice(0, max - 1).join("").trimEnd() + "…" : chars.join("");
}

const partOfDayKey = (time) => {
  const match = /^(\d{1,2}):\d{2}/.exec(String(time || ""));
  if (!match) return "";
  const h = Number(match[1]);
  return h < 5 ? "night" : h < 12 ? "morning" : h < 18 ? "afternoon" : h < 22 ? "evening" : "night";
};

// { title, label, source } — `title` is exactly what the person wrote ("" if
// none); `label` is what to show; `source` says which rule gave it.
// options: t (translator), index (0-based page index, for "第 2 页"),
// max (characters of words to show), dayPage (the cover / whole-day page),
// words: false when the words are already shown next to the label.
export function pageLabel(page, { t, index = null, max = 18, dayPage = false, words: useWords = true } = {}) {
  const title = clean(page?.title);
  if (title) return { title, label: title, source: "title" };
  const words = useWords ? pageWords(page) : "";
  if (words) return { title: "", label: clip(words, max), source: "words" };
  const { photos, videos, audios } = pageMedia(page, { dayPage });
  const parts = [];
  if (photos) parts.push(t(photos === 1 ? "label.photo1" : "label.photos", { count: photos }));
  if (videos) parts.push(t(videos === 1 ? "label.video1" : "label.videos", { count: videos }));
  if (audios) parts.push(t(audios === 1 ? "label.audio1" : "label.audios", { count: audios }));
  if (parts.length) return { title: "", label: parts.join(" · "), source: "media" };
  const part = partOfDayKey(page?.time);
  if (part) return { title: "", label: t(`label.${part}`), source: "time" };
  if (Number.isInteger(index) && index >= 0) return { title: "", label: t("moment.chapter", { number: index + 1 }), source: "index" };
  return { title: "", label: t("label.page"), source: "none" };
}

// "11:05 · 2 张照片" — the time first when the page has one.
export function pageLine(page, options) {
  const { label } = pageLabel(page, options);
  return page?.time ? `${page.time} · ${label}` : label;
}

// A whole day (an entry and its pages) in one short line, for cards that
// stand for the day: its own title, else the first page's title, else the
// first words, else what the day holds (3 pages · 6 photos).
export function dayLabel(entry, { t, max = 18 } = {}) {
  const title = clean(entry?.title);
  if (title) return title;
  const pages = entry?.moments || [];
  const titled = pages.map((page) => clean(page?.title)).find(Boolean);
  if (titled) return titled;
  const words = [entry, ...pages].map((page) => pageWords(page)).find(Boolean);
  if (words) return clip(words, max);
  const photos = [entry, ...pages].reduce((sum, page, i) => sum + pageMedia(page, { dayPage: i === 0 }).photos, 0);
  const parts = [];
  if (pages.length > 1) parts.push(t("day.statMoments", { count: pages.length }));
  if (photos) parts.push(t(photos === 1 ? "label.photo1" : "label.photos", { count: photos }));
  return parts.length ? parts.join(" · ") : t("label.day");
}

// The picture that stands for a page in a list: its first own photo, else a
// photo background, else a video's cover. "" when the page has none.
export function pageCoverRef(page) {
  const layer = (page?.layers || []).find((l) => l?.kind === "photo" && l.mediaRef && !l.drawing && !l.gen);
  if (layer) return layer.mediaRef;
  if (/^(photo|media):/.test(String(page?.backdrop || ""))) return page.backdrop;
  return (page?.media || []).find((clip) => clip?.kind === "video" && clip.poster)?.poster || "";
}
