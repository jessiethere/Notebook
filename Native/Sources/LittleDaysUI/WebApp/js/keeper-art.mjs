// Little Keeper's look: Captain, from the approved Captain Character
// Reference, used as image assets — never redrawn in SVG / CSS / emoji.
// The pictures are cut-outs of the reference (library.json "keepers",
// Resources/Keepers, tools/extract_captain.py).
//
// V8.0 ships Captain only, in four states: Normal, Happy, Sleepy and Peek.
// Other wanted states fall back to one of these (never a drawn stand-in);
// Bunny, Westie, other hats and more expressions wait for approved art.

export const DEFAULT_OUTFIT = { cat: "lemon" };

// The app's moods → the pictures, best first.
const FALLBACK = {
  idle: ["normal"],
  quiet: ["normal"], // writing: the calm pose (no Writing art yet)
  happy: ["happy", "normal"],
  excited: ["happy", "normal"],
  encouraging: ["happy", "normal"],
  sleepy: ["sleepy", "normal"],
  peek: ["peek", "normal"],
};

export function keeperOutfits(catalog, animal) {
  const seen = [];
  for (const item of catalog?.keepers || []) if (item.animal === animal && !seen.includes(item.outfit)) seen.push(item.outfit);
  return seen;
}

// V10.8: the wardrobe — looks that have approved pictures (library.json
// "keeperLooks"), hats first. Nothing is unlocked or earned: every look
// listed can simply be chosen.
export function keeperLooks(catalog, animal = "cat", language = "zh-CN") {
  const have = keeperOutfits(catalog, animal);
  const en = language === "en";
  return (catalog?.keeperLooks || [])
    .filter((look) => look.animal === animal && have.includes(look.id))
    .map((look) => ({ id: look.id, kind: look.kind === "accessory" ? "accessory" : "hat", name: en ? look.nameEn : look.nameZh, note: (en ? look.noteEn : look.noteZh) || "", isDefault: look.id === DEFAULT_OUTFIT[animal] }))
    .sort((x, y) => (x.kind === y.kind ? 0 : x.kind === "hat" ? -1 : 1));
}

// The picture for an animal / outfit / mood (an unknown animal or outfit
// shows Captain in the lemon hat).
export function keeperAsset(catalog, { animal = "cat", outfit = "", mood = "idle" } = {}) {
  const items = catalog?.keepers || [];
  let all = items.filter((item) => item.animal === animal);
  if (!all.length) all = items.filter((item) => item.animal === "cat");
  if (!all.length) return null;
  const wear = all.some((item) => item.outfit === outfit) ? outfit : DEFAULT_OUTFIT[all[0].animal] || all[0].outfit;
  const own = all.filter((item) => item.outfit === wear);
  for (const want of FALLBACK[mood] || FALLBACK.idle) {
    const hit = own.find((item) => item.mood === want);
    if (hit) return hit;
  }
  return own.find((item) => item.mood !== "peek") || own[0];
}

const attr = (value) => String(value).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

export function keeperImage(catalog, { animal = "cat", outfit = "", mood = "idle", label = "" } = {}) {
  const asset = keeperAsset(catalog, { animal, outfit, mood });
  if (!asset) return "";
  return `<img class="keeper-img${asset.mood === "peek" ? " is-peek" : ""}" src="library/keepers/${attr(asset.file)}" alt="${attr(label)}" data-animal="${attr(asset.animal)}" data-outfit="${attr(asset.outfit)}" data-mood="${attr(asset.mood)}" draggable="false">`;
}
