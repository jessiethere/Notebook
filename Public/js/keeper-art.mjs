// Little Keeper's look (V7.9): the approved 3D character artwork, used as
// image assets — never redrawn in SVG or CSS. The pictures are cut-outs of
// the product owner's character sheet and Captain reference
// (library.json "keepers", Resources/Keepers, tools/extract_keepers.py).
//
// Each picture is one animal in one outfit with one expression. When a
// wanted expression has no picture yet, the closest existing one is used
// (FALLBACK) — the art is never faked. Poses that still need new artwork:
// Peek for Bunny and Westie, a dedicated Writing pose (every picture already
// holds the green notebook and a pencil), Bunny Sleepy / Excited, Captain and
// Westie Encouraging.

export const DEFAULT_OUTFIT = { bunny: "sprout", cat: "lemon", westie: "sprout" };

// The app's moods → the expressions on the sheet, best first.
const FALLBACK = {
  idle: ["neutral", "happy"],
  quiet: ["neutral", "happy"], // writing: same calm pose (no Writing art yet)
  happy: ["happy", "neutral"],
  excited: ["excited", "happy", "neutral"],
  encouraging: ["encouraging", "happy", "neutral"],
  sleepy: ["sleepy", "neutral"],
  peek: ["peek", "neutral", "happy"],
};

export function keeperOutfits(catalog, animal) {
  const seen = [];
  for (const item of catalog?.keepers || []) if (item.animal === animal && !seen.includes(item.outfit)) seen.push(item.outfit);
  return seen;
}

// The picture for an animal / outfit / mood. An outfit with a single picture
// always shows that one. Sleepy in the default outfit may borrow the
// animal's own sleepy outfit (nightcap / bear hat).
export function keeperAsset(catalog, { animal = "bunny", outfit = "", mood = "idle" } = {}) {
  const all = (catalog?.keepers || []).filter((item) => item.animal === animal);
  if (!all.length) return null;
  const wear = all.some((item) => item.outfit === outfit) ? outfit : DEFAULT_OUTFIT[animal] || all[0].outfit;
  const own = all.filter((item) => item.outfit === wear);
  for (const want of FALLBACK[mood] || FALLBACK.idle) {
    const hit = own.find((item) => item.mood === want);
    if (hit) return hit;
    if (want === "sleepy" && wear === DEFAULT_OUTFIT[animal]) {
      const nap = all.find((item) => item.mood === "sleepy") || all.find((item) => item.outfit === "sleepy");
      if (nap) return nap;
    }
  }
  return own.find((item) => item.mood !== "peek") || own[0];
}

const attr = (value) => String(value).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

export function keeperImage(catalog, { animal = "bunny", outfit = "", mood = "idle", label = "" } = {}) {
  const asset = keeperAsset(catalog, { animal, outfit, mood });
  if (!asset) return "";
  return `<img class="keeper-img${asset.mood === "peek" ? " is-peek" : ""}" src="library/keepers/${attr(asset.file)}" alt="${attr(label)}" data-animal="${attr(asset.animal)}" data-outfit="${attr(asset.outfit)}" data-mood="${attr(asset.mood)}" draggable="false">`;
}
