import { fontFamily, coverColor, stickerURL } from "./library.mjs";
import { mediaCardHTML } from "./canvas.mjs";
export const escapeHTML = (value = "") =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const esc = escapeHTML;
export function fieldLabel(field, language) {
  return language === "en"
    ? field.labelEn || field.label
    : field.labelZh || field.label;
}
// Magazine covers use a photo: the book's own, or one from the photo library
// that suits what the book is about (always the same one for the same book).
const COVER_COLLECTIONS = [
  [/fit|sport|gym|run|运动|健身|跑/i, "move"],
  [/plant|garden|flower|植物|花|绿/i, "flowers"],
  [/pet|cat|dog|宠物|猫|狗/i, "pets"],
  [/parent|family|kid|baby|亲子|家庭|宝宝|孩子/i, "celebrate"],
  [/travel|trip|旅行|旅游|出发/i, "travel"],
  [/food|cook|recipe|美食|吃|做饭/i, "food"],
  [/read|study|learn|book|学习|读书|阅读/i, "quiet"],
  [/daily|life|日常|生活/i, "coffee"],
];
export function coverCollection(book) {
  const text = `${book.category || ""} ${book.title || ""}`;
  return (COVER_COLLECTIONS.find(([pattern]) => pattern.test(text)) || [null, "views"])[1];
}
export function coverPhotoRef(book, catalog) {
  if (book.coverImage) return book.coverImage;
  const photos = catalog.photos || [];
  const pool = photos.filter((photo) => photo.collection === coverCollection(book));
  const list = pool.length ? pool : photos;
  if (!list.length) return "";
  const seed = [...String(book.id || book.title || "")].reduce((sum, c) => (sum * 31 + c.charCodeAt(0)) >>> 0, 7);
  return `photo:${list[seed % list.length].id}`;
}
export const MAGAZINE_COVERS = ["magazine-jp", "magazine-west", "magazine-mono", "magazine-film", "magazine-minimal", "magazine-collage"];
// A few more photos for collage covers: the cover photo, then others from the
// same theme (always the same ones for the same book).
function extraPhotoRefs(book, catalog, count) {
  const main = coverPhotoRef(book, catalog);
  const photos = catalog.photos || [];
  const pool = photos.filter((photo) => photo.collection === coverCollection(book) && `photo:${photo.id}` !== main);
  const list = pool.length ? pool : photos;
  const seed = [...String(book.id || book.title || "")].reduce((sum, c) => (sum * 17 + c.charCodeAt(0)) >>> 0, 3);
  return [main, ...Array.from({ length: count }, (_, k) => list.length ? `photo:${list[(seed + k * 2) % list.length].id}` : "")];
}
function magazineCoverHTML(book, ctx, template) {
  const { tokens, media } = ctx;
  const photo = media.resolve(coverPhotoRef(book, ctx.catalog));
  const now = new Date();
  const issue = now.toLocaleDateString("en", { month: "short", year: "numeric" }).toUpperCase();
  const topic = String(book.category || "Journal").toUpperCase();
  const title = esc(book.title || "Capiday");
  const line = esc((book.description || "").trim());
  const img = photo ? `<img class="mag-photo" src="${esc(photo)}" alt="">` : `<span class="mag-photo mag-photo-empty"></span>`;
  const date = `'${String(now.getFullYear()).slice(2)} ${String(now.getMonth() + 1).padStart(2, "0")} ${String(now.getDate()).padStart(2, "0")}`;
  if (template === "magazine-mono")
    return `<div class="book-cover cover-magazine-mono" style="--cover-color:${coverColor(book, tokens)}"><span class="mag-top"><span>CAPIDAY</span><span>NO.${String(now.getMonth() + 1).padStart(2, "0")}</span></span><b class="cover-title">${title}</b><span class="mag-frame">${img}</span><span class="mag-foot"><span>${esc(topic)}</span><span>${esc(issue)}</span></span></div>`;
  if (template === "magazine-film")
    return `<div class="book-cover cover-magazine-film" style="--cover-color:${coverColor(book, tokens)}"><span class="film-holes" aria-hidden="true"></span><span class="mag-frame">${img}<i class="film-date">${esc(date)}</i></span><span class="film-holes bottom" aria-hidden="true"></span><span class="mag-foot"><b class="cover-title">${title}</b><span>${esc(topic)} · CAPIDAY</span></span></div>`;
  if (template === "magazine-minimal")
    return `<div class="book-cover cover-magazine-minimal" style="--cover-color:${coverColor(book, tokens)}"><span class="mag-brand">capiday</span><span class="mag-frame">${img}</span><b class="cover-title">${title}</b><span class="mag-foot">${line || esc(issue)}</span></div>`;
  if (template === "magazine-collage") {
    const [, second, third] = extraPhotoRefs(book, ctx.catalog, 2);
    const extra = (ref) => (media.resolve(ref) ? `<img class="mag-photo" src="${esc(media.resolve(ref))}" alt="">` : `<span class="mag-photo mag-photo-empty"></span>`);
    return `<div class="book-cover cover-magazine-collage" style="--cover-color:${coverColor(book, tokens)}"><span class="collage-grid"><span class="c-main">${img}</span><span class="c-a">${extra(second)}</span><span class="c-b">${extra(third)}</span></span><span class="collage-band"><b class="cover-title">${title}</b><span>${esc(topic)} · ${esc(issue)}</span></span></div>`;
  }
  if (template === "magazine-west")
    return `<div class="book-cover cover-magazine-west" style="--cover-color:${coverColor(book, tokens)}">${img}<span class="mag-shade" aria-hidden="true"></span><span class="mag-top"><span>${esc(issue)}</span><span>${esc(topic)}</span></span><span class="mag-masthead">CAPIDAY</span><span class="mag-lines"><b class="cover-title">${title}</b>${line ? `<i>${line}</i>` : ""}</span><span class="mag-barcode" aria-hidden="true"></span></div>`;
  return `<div class="book-cover cover-magazine-jp" style="--cover-color:${coverColor(book, tokens)}"><span class="mag-top"><span class="mag-brand">capiday</span><span>${esc(issue)}</span></span><span class="mag-frame">${img}</span><b class="mag-vertical cover-title" style="--n:${Math.max(4, [...String(book.title || "Capiday")].length)}">${title}</b><span class="mag-foot"><span>${esc(topic)}</span><i></i><span>${line || "LIFESTYLE JOURNAL"}</span></span></div>`;
}
// V10.54 · Ten themed covers. Each one is its own composition (a herbarium
// sheet, a café receipt, a recipe card, a postcard, a pet tag, polaroids, a
// ticket stub, an editorial grid, a cloud window, a season almanac) — not a
// recoloured background. They use the book's own photo, or one from the
// licensed photo library that suits the theme (always the same one for the
// same book). Colour, font and decoration from 封面细节 still apply. A book
// keeps its template id, so older covers keep their meaning.
export const THEME_COVERS = {
  "botanical-herbarium": "flowers",
  "cafe-receipt": "coffee",
  "food-recipe": "food",
  "travel-postcard": "travel",
  "pet-tag": "pets",
  "everyday-polaroid": "",
  "vintage-ticket": "",
  "editorial-grid": "",
  "pastel-cloud": "sweet",
  "seasonal-almanac": "",
};
const SEASON_PHOTOS = {
  spring: ["cherry-blossom", "spring-blooms"],
  summer: ["summer-tree", "golden-field"],
  autumn: ["misty-hills", "valley-morning"],
  winter: ["snowy-forest", "winter-wreath", "frost", "snowy-sunset"],
};
export function coverSeason(date = new Date()) {
  const m = date.getMonth() + 1;
  return m >= 3 && m <= 5 ? "spring" : m >= 6 && m <= 8 ? "summer" : m >= 9 && m <= 11 ? "autumn" : "winter";
}
function seedOf(book, salt = 7) {
  return [...String(book.id || book.title || "")].reduce((sum, c) => (sum * 31 + c.charCodeAt(0)) >>> 0, salt);
}
// The book's own photo first; then a library photo from the theme.
function themePhotoRefs(book, catalog, template, count = 1) {
  const photos = catalog.photos || [];
  let pool;
  if (template === "seasonal-almanac") {
    const ids = SEASON_PHOTOS[coverSeason()];
    pool = photos.filter((photo) => ids.includes(photo.id));
  } else {
    const collection = THEME_COVERS[template] || coverCollection(book);
    pool = photos.filter((photo) => photo.collection === collection);
  }
  const list = pool.length ? pool : photos;
  const seed = seedOf(book);
  const refs = list.length ? Array.from({ length: count + 1 }, (_, k) => `photo:${list[(seed + k * 2) % list.length].id}`) : [];
  if (book.coverImage) return [book.coverImage, ...refs.filter((ref) => ref !== book.coverImage)].slice(0, count);
  return refs.slice(0, count);
}
function themeCoverHTML(book, ctx, template) {
  const { tokens, media, catalog } = ctx;
  const refs = themePhotoRefs(book, catalog, template, template === "everyday-polaroid" ? 2 : 1);
  const img = (ref, cls = "cv-photo") => {
    const src = ref ? media.resolve(ref) : "";
    return src ? `<img class="${cls}" src="${esc(src)}" alt="" loading="lazy">` : `<span class="${cls} cv-photo-empty"></span>`;
  };
  const now = new Date();
  const title = esc(book.title || "Capiday");
  const topic = esc(String(book.category || "Journal").toUpperCase());
  const line = esc((book.description || "").trim());
  const no = String(now.getMonth() + 1).padStart(2, "0");
  const date = `${now.getFullYear()}.${no}.${String(now.getDate()).padStart(2, "0")}`;
  const deco = book.coverDecoration && book.coverDecoration !== "none" ? stickerURL(book.coverDecoration, catalog) : "";
  const decoImg = deco ? `<img class="cv-deco" src="${deco}" alt="">` : "";
  const style = `--cover-color:${coverColor(book, tokens)};--cover-font:${esc(fontFamily(book.coverFont || "elegant", catalog))}`;
  const open = (extra = "") => `<div class="book-cover cover-theme cover-${template}${extra}" style="${style}">`;
  const tt = (cls = "") => `<b class="cv-title ${cls}">${title}</b>`;
  switch (template) {
    case "botanical-herbarium":
      return `${open()}<span class="cv-sheet"><span class="cv-window">${img(refs[0])}<i class="cv-tape a"></i><i class="cv-tape b"></i></span><span class="cv-label"><small>HERBARIUM · NO.${no}</small>${tt()}<small>${topic}</small></span></span>${decoImg}</div>`;
    case "cafe-receipt":
      return `${open()}<span class="cv-receipt"><small class="cv-shop">CAPIDAY CAFÉ</small><span class="cv-cup">${img(refs[0])}</span><span class="cv-dots"></span>${tt()}<span class="cv-row"><span>ORDER</span><span>#${no}${String(now.getDate()).padStart(2, "0")}</span></span><span class="cv-bars" aria-hidden="true"></span><small class="cv-thanks">thank you · 慢慢来</small></span></div>`;
    case "food-recipe":
      return `${open()}<span class="cv-card"><span class="cv-snap">${img(refs[0])}<i class="cv-tape"></i></span><small class="cv-kicker">RECIPE · NO.${no}</small>${tt()}<span class="cv-lines" aria-hidden="true"></span></span></div>`;
    case "travel-postcard":
      return `${open()}<span class="cv-view">${img(refs[0])}<small class="cv-greet">GREETINGS FROM</small></span><span class="cv-back">${tt()}<span class="cv-stamp" aria-hidden="true"><i>AIR<br>MAIL</i></span><span class="cv-postmark" aria-hidden="true">${esc(date)}</span><span class="cv-address" aria-hidden="true"></span></span></div>`;
    case "pet-tag":
      return `${open()}<span class="cv-arch">${img(refs[0])}</span><span class="cv-tag"><i class="cv-hole"></i>${tt()}</span><small class="cv-paws" aria-hidden="true">· · ·</small>${decoImg}</div>`;
    case "everyday-polaroid":
      return `${open()}<span class="cv-pola back">${img(refs[1])}</span><span class="cv-pola front">${img(refs[0])}${tt()}</span><small class="cv-date">${esc(date)}</small></div>`;
    case "vintage-ticket":
      return `${open()}<span class="cv-torn">${img(refs[0])}</span><span class="cv-ticket"><small>ADMIT ONE · NO.${no}</small>${tt()}<small>${topic}</small></span><span class="cv-stampdate" aria-hidden="true">${esc(date)}</span><i class="cv-tape"></i></div>`;
    case "editorial-grid":
      return `${open()}<span class="cv-issue">${no}</span><span class="cv-mast">CAPIDAY<small>${topic}</small></span><span class="cv-frame">${img(refs[0])}</span>${tt()}<span class="cv-cols" aria-hidden="true"><i></i><i></i><i></i></span><small class="cv-foot">${line || "A LIFESTYLE JOURNAL"}</small></div>`;
    case "pastel-cloud":
      return `${open()}<span class="cv-stitch"></span><span class="cv-cloud">${img(refs[0])}</span>${tt()}<small class="cv-spark" aria-hidden="true">✦ ✧ ✦</small>${decoImg}</div>`;
    case "seasonal-almanac": {
      const season = coverSeason(now);
      const names = { spring: ["SPRING", "春"], summer: ["SUMMER", "夏"], autumn: ["AUTUMN", "秋"], winter: ["WINTER", "冬"] };
      const dots = ["spring", "summer", "autumn", "winter"].map((k) => `<i class="${k === season ? "on" : ""}">${names[k][1]}</i>`).join("");
      return `${open(` season-${season}`)}<span class="cv-season"><b>${names[season][0]}</b><span>${names[season][1]}</span></span><span class="cv-window">${img(refs[0])}</span>${tt()}<span class="cv-almanac" aria-hidden="true">${dots}</span></div>`;
    }
  }
  return "";
}
export function coverHTML(book, ctx) {
  const { catalog, tokens, media, t } = ctx;
  if (MAGAZINE_COVERS.includes(book.coverTemplate)) return magazineCoverHTML(book, ctx, book.coverTemplate);
  if (Object.hasOwn(THEME_COVERS, book.coverTemplate || "")) return themeCoverHTML(book, ctx, book.coverTemplate);
  const template = catalog.coverTemplates.some(
    (item) => item.id === book.coverTemplate,
  )
    ? book.coverTemplate
    : "minimal-linen";
  const decoration = stickerURL(book.coverDecoration || "tulip", catalog);
  const photo = media.resolve(book.coverImage || "");
  return `<div class="book-cover cover-${template}" style="--cover-color:${coverColor(book, tokens)};font-family:${esc(fontFamily(book.coverFont || "elegant", catalog))}">${photo ? `<img class="cover-photo" src="${esc(photo)}" alt="">` : ""}<span class="cover-rule"></span><span class="cover-title">${esc(book.title || "Capiday")}</span>${decoration && book.coverDecoration !== "none" ? `<img class="cover-decoration" src="${decoration}" alt="">` : ""}<span class="cover-imprint">CAPIDAY</span></div>`;
}
// Photos offered for a cover: the ones that suit the book first, then a mix.
function coverPhotoPicks(book, catalog) {
  // V10.52: the whole photo library (the ones that suit the book first).
  const photos = catalog.photos || [];
  const suited = photos.filter((photo) => photo.collection === coverCollection(book));
  const others = photos.filter((photo) => photo.collection !== coverCollection(book));
  return [...suited, ...others];
}
// V10.51 · Tags as chips: type a tag and press return (or a comma) — it
// becomes a chip with ×. Chinese, English and tags with spaces need no "#".
// The form still sends one "tags" value in the stored format ("#a#b c"),
// read by the same parseTags, so older tags load and save unchanged.
export const TAGS_MAX = 8;
export function tagsValue(tags) {
  return (tags || []).map((tag) => `#${tag}`).join("");
}
export function tagChipsHTML(tags, t) {
  const list = (tags || []).slice(0, TAGS_MAX);
  const chips = list.map((tag) => `<span class="tag-chip"><span>${esc(tag)}</span><button type="button" data-action="tag-remove" data-tag="${esc(tag)}" aria-label="${esc(t("tags.remove", { tag }))}">×</button></span>`).join("");
  const full = list.length >= TAGS_MAX;
  return `<div class="field tag-field"><span class="field-label" id="tag-label">${t("books.tags")}</span><div class="tag-chips" data-tag-chips role="group" aria-labelledby="tag-label">${chips}<input class="tag-entry" data-tag-entry maxlength="16" enterkeyhint="done" autocomplete="off" placeholder="${esc(t(full ? "tags.full" : list.length ? "tags.more" : "tags.placeholder"))}" aria-label="${esc(t("tags.add"))}" ${full ? "disabled" : ""}></div><input type="hidden" name="tags" value="${esc(tagsValue(list))}"><small class="field-hint">${t("tags.hint", { max: TAGS_MAX })}</small></div>`;
}
// V10.54 · 快速创建 + 按需个性化. The first view is the cover (live), the
// name, six featured cover styles and 创建 (always in reach at the bottom).
// "查看更多封面" opens a cover browser inside the same form (groups, the
// whole photo library, upload, reset) — going back keeps every choice,
// because nothing is re-rendered. Description / tags / theme, cover details
// and book settings fold under 更多个性化设置, each showing a short summary
// of its current values. Every field keeps its name and data-action, so
// saving and older books are unchanged.
const COVER_GROUPS = ["all", "life", "magazine", "paper", "cute"];
export const DEFAULT_COVER_TEMPLATE = "magazine-jp";
function templatePreviewBook(book, id) {
  // Classic paper covers are shown without the photo (as before V10.54);
  // magazine and themed covers show the book's photo or a library one.
  const photoCover = MAGAZINE_COVERS.includes(id) || Object.hasOwn(THEME_COVERS, id);
  return { ...book, coverTemplate: id, coverImage: photoCover ? book.coverImage : "" };
}
export function coverOptionHTML(book, ctx, template) {
  const tpl = book.coverTemplate || "minimal-linen";
  return `<button type="button" data-action="cover-template" data-template="${template.id}" class="cover-option ${tpl === template.id ? "selected" : ""}" aria-pressed="${tpl === template.id}">${coverHTML(templatePreviewBook(book, template.id), ctx)}<span>${ctx.t("cover." + template.id)}</span></button>`;
}
export function featuredCoverTemplates(book, catalog) {
  const all = catalog.coverTemplates || [];
  const featured = all.filter((template) => template.featured).slice(0, 6);
  const current = all.find((template) => template.id === book.coverTemplate);
  // The chosen cover is always in the short row (first), so it stays in sight.
  if (current && !featured.includes(current)) return [current, ...featured.slice(0, 5)];
  return featured.length ? featured : all.slice(0, 6);
}
export function coverBrowserGridHTML(book, ctx, group = "all") {
  const list = (ctx.catalog.coverTemplates || []).filter((template) => group === "all" || template.group === group);
  return list.map((template) => coverOptionHTML(book, ctx, template)).join("");
}
export function coverBrowserPhotosHTML(book, ctx) {
  const { t } = ctx;
  const own = book.coverImage && !book.coverImage.startsWith("photo:") ? book.coverImage : "";
  const ownSrc = own ? ctx.media.resolve(own) : "";
  const photos = coverPhotoPicks(book, ctx.catalog)
    .map((photo) => `<button type="button" data-action="cover-library-photo" data-photo="${esc(photo.id)}" class="${book.coverImage === `photo:${photo.id}` ? "selected" : ""}" aria-label="${esc(ctx.language === "en" ? photo.nameEn : photo.nameZh)}"><img src="${esc(ctx.media.resolve(`photo:${photo.id}`))}" alt="" loading="lazy" decoding="async"></button>`)
    .join("");
  return `<button type="button" class="cover-upload" data-action="cover-photo" aria-label="${esc(t("books.coverPhoto"))}"><span aria-hidden="true">＋</span><small>${t("books.upload")}</small></button><button type="button" class="cover-auto ${book.coverImage ? "" : "selected"}" data-action="cover-photo-remove"><span aria-hidden="true">✧</span><small>${t("books.photoAuto")}</small></button>${ownSrc ? `<button type="button" class="selected cover-own" data-action="cover-photo" aria-label="${esc(t("books.photoOwn"))}"><img src="${esc(ownSrc)}" alt=""></button>` : ""}${photos}`;
}
// The short summaries shown on the folded sections (updated as you type).
export function bookSectionHints(book, ctx) {
  const { t, catalog, language } = ctx;
  const tags = book.tags || [];
  const tagText = tags.slice(0, 3).map((tag) => `#${tag}`).join(" ") + (tags.length > 3 ? ` +${tags.length - 3}` : "");
  const basics = [String(book.category || "").trim() || "Daily Life", tagText].filter(Boolean).join(" · ");
  const font = (catalog.fonts || []).find((f) => f.id === (book.coverFont || "elegant"));
  const sticker = (catalog.stickers || []).find((x) => x.id === (book.coverDecoration || "tulip"));
  const deco = book.coverDecoration === "none" ? t("books.none") : sticker ? (language === "en" ? sticker.nameEn : sticker.nameZh) : "";
  const look = [t("color." + (book.color || "blush")), font?.name, deco, book.coverImage ? t("books.photoOwn") : t("books.photoAuto")].filter(Boolean).join(" · ");
  const n = (book.fields || []).length;
  const settings = `🔒 ${t("private")} · ${n ? t("books.fieldsCount", { count: n }) : t("books.noFields")}`;
  return { basics, look, settings };
}
export function bookDialogHTML(book, ctx) {
  const { catalog, t } = ctx;
  const tpl = book.coverTemplate || "minimal-linen";
  const featured = featuredCoverTemplates(book, catalog).map((template) => coverOptionHTML(book, ctx, template)).join("");
  const total = (catalog.coverTemplates || []).length;
  const tags = book.tags || [];
  const hints = bookSectionHints(book, ctx);
  const section = (id, title, hint, body) => `<details class="book-more" data-book-section="${id}"><summary><span><b>${title}</b><small data-section-hint="${id}">${esc(hint)}</small></span><i aria-hidden="true">›</i></summary><div class="book-more-body">${body}</div></details>`;
  const basicsBody = `<label class="field">${t("books.description")}<textarea name="description" rows="2" maxlength="300" placeholder="${esc(t("books.descriptionPlaceholder"))}">${esc(book.description || "")}</textarea></label>${tagChipsHTML(tags, t)}<label class="field">${t("books.category")}<input name="category" maxlength="40" placeholder="Daily Life" value="${esc(book.category || "Daily Life")}"></label>`;
  const lookBody = `<div class="field"><span class="field-label">${t("books.coverPhotoTitle")}</span><div class="cover-photo-quick" data-cover-photo-quick>${coverPhotoQuickHTML(book, ctx)}</div></div><div class="field-row"><label class="field">${t("books.color")}<select name="color">${["blush", "sage", "butter", "blue", "cream"].map((color) => `<option value="${color}" ${book.color === color ? "selected" : ""}>${t("color." + color)}</option>`).join("")}</select></label><label class="field">${t("books.font")}<select name="coverFont">${catalog.fonts.map((font) => `<option value="${font.id}" ${(book.coverFont || "elegant") === font.id ? "selected" : ""}>${font.name}</option>`).join("")}</select></label></div><label class="field">${t("books.decoration")}<select name="coverDecoration"><option value="none" ${book.coverDecoration === "none" ? "selected" : ""}>${t("books.none")}</option>${catalog.stickers.slice(0, 16).map((sticker) => `<option value="${sticker.id}" ${(book.coverDecoration || "tulip") === sticker.id ? "selected" : ""}>${ctx.language === "en" ? sticker.nameEn : sticker.nameZh}</option>`).join("")}</select></label>`;
  const settingsBody = `<label class="field">${t("books.permission")}<select name="visibility"><option value="private">${t("private")}</option><option value="public" disabled>${t("public")}</option><option value="shared" disabled>${t("shared")}</option></select></label><p class="save-help">${t("books.privateNotice")}</p><label class="field">${t("books.preset")}<select id="book-preset"><option value="blank">${t("books.blank")}</option>${(catalog.recordTemplates || []).map((item) => `<option value="${item.id}">${ctx.language === "en" ? item.nameEn : item.nameZh}</option>`).join("")}</select></label><h3 class="field-section-title">${t("books.fields")}</h3><div id="book-field-list">${(book.fields || []).map((f) => fieldDefinitionHTML(f, ctx)).join("")}</div><button class="secondary" type="button" data-action="field-add">${t("books.fieldAdd")}</button>`;
  const tabs = COVER_GROUPS.map((group, k) => `<button type="button" role="tab" data-action="cover-group" data-group="${group}" aria-selected="${k === 0}" class="${k === 0 ? "selected" : ""}">${t("coverGroup." + group)}</button>`).join("");
  const browser = `<section class="cover-browser" id="cover-browser" hidden aria-label="${esc(t("books.coverBrowser"))}"><header class="cover-browser-head"><button type="button" class="cb-back" data-action="cover-browse-close" aria-label="${esc(t("back"))}">‹ ${t("back")}</button><b>${t("books.coverBrowser")}</b><button type="button" class="primary cb-done" data-action="cover-browse-close">${t("books.coverDone")}</button></header><div class="cb-top"><div id="cover-browser-preview" class="cb-preview">${coverHTML(book, ctx)}</div><div class="cb-top-copy"><b id="cover-browser-name">${esc(t("cover." + tpl))}</b><small class="cb-season-note">${t("books.seasonNote")}</small><button type="button" class="text-button" data-action="cover-reset">${t("books.coverReset")}</button></div></div><div class="cb-tabs" role="tablist">${tabs}</div><div class="cover-template-grid cb-grid" id="cover-browser-grid" data-group="all"></div><div class="cb-photos"><div class="book-pick-head"><b>${t("books.coverPhotoTitle")}</b></div><p class="save-help">${t("books.coverPhotoHint")}</p><div class="cover-photo-picks" id="cover-browser-photos"></div></div></section>`;
  return `<div class="book-main"><h2>${t(book.id ? "books.dialogEdit" : "books.dialogNew")}</h2><div class="book-top"><div id="book-cover-preview" class="book-cover-preview">${coverHTML(book, ctx)}</div><div class="book-top-fields"><label class="field book-name">${t("books.name")}<input name="title" required maxlength="60" placeholder="${t("books.namePlaceholder")}" value="${esc(book.title || "")}" enterkeyhint="done" autocomplete="off"></label><small class="book-lock">🔒 ${t("private")}</small></div></div>
 <div class="book-pick"><div class="book-pick-head"><b>${t("books.coverStyle")}</b><button type="button" class="text-button cover-more-link" data-action="cover-browse">${t("books.moreCovers")} ›</button></div><input name="coverTemplate" type="hidden" value="${esc(tpl)}"><div class="cover-template-grid cover-template-row cover-featured">${featured}<button type="button" class="cover-more-tile" data-action="cover-browse"><span aria-hidden="true">＋</span><b>${t("books.moreCoversShort")}</b><small>${t("books.moreCoversCount", { count: total })}</small></button></div></div>
 <div class="book-more-group"><div class="book-more-title"><b>${t("books.morePersonal")}</b><small>${t("books.morePersonalHint")}</small></div>${section("basics", t("books.moreBasics"), hints.basics, basicsBody)}${section("look", t("books.moreLook"), hints.look, lookBody)}${section("settings", t("books.moreBook"), hints.settings, settingsBody)}</div></div>
 ${browser}
 <div class="dialog-actions book-actions"><button type="button" class="secondary" data-action="close-dialog">${t("cancel")}</button><button type="submit" class="primary book-submit">${t(book.id ? "save" : "create")}</button></div>`;
}
// The small cover-photo row inside 封面细节: upload, automatic, the chosen
// photo (if any) and a way to the whole library in the cover browser.
export function coverPhotoQuickHTML(book, ctx) {
  const { t } = ctx;
  const src = book.coverImage ? ctx.media.resolve(book.coverImage) : "";
  return `<button type="button" class="cover-upload" data-action="cover-photo"><span aria-hidden="true">＋</span><small>${t("books.upload")}</small></button><button type="button" class="cover-auto ${book.coverImage ? "" : "selected"}" data-action="cover-photo-remove"><span aria-hidden="true">✧</span><small>${t("books.photoAuto")}</small></button>${src ? `<span class="cover-current selected"><img src="${esc(src)}" alt=""></span>` : ""}<button type="button" class="text-button" data-action="cover-browse" data-focus="photos">${t("books.coverPhotoTitle")} ›</button>`;
}
export function fieldDefinitionHTML(field, ctx) {
  const { catalog, t, language } = ctx;
  return `<div class="custom-field-row" data-field-row="${esc(field.id)}"><input aria-label="${t("books.fieldName")}" data-definition-label value="${esc(fieldLabel(field, language))}" maxlength="60" required placeholder="${t("books.fieldName")}"><select data-definition-type aria-label="${t("dialog.kind")}">${catalog.fieldTypes.map((type) => `<option value="${type}" ${field.type === type ? "selected" : ""}>${t("field." + type)}</option>`).join("")}</select><input data-definition-options aria-label="${t("books.fieldOptions")}" placeholder="${t("books.fieldOptions")}" value="${esc((field.options || []).join(", "))}"><button type="button" data-action="field-remove" aria-label="${t("field.remove")}">×</button></div>`;
}
export function customFieldsHTML(book, entry, ctx) {
  if (!book?.fields?.length) return "";
  const { t, media, language } = ctx;
  return `<section class="custom-records"><h3>${t("books.records")}</h3>${book.fields
    .map((field) => {
      const value = entry.fieldValues?.[field.id] ?? "";
      const data = `data-custom-field="${esc(field.id)}" data-field-type="${field.type}"`;
      let control;
      if (field.type === "checkbox")
        control = `<input type="checkbox" ${data} ${value ? "checked" : ""}>`;
      else if (field.type === "select")
        control = `<select ${data}><option value="">—</option>${(field.options || []).map((option) => `<option value="${esc(option)}" ${option === value ? "selected" : ""}>${esc(option)}</option>`).join("")}</select>`;
      else if (field.type === "image")
        control = `<span class="field-image">${media.resolve(value) ? `<img src="${esc(media.resolve(value))}" alt="">` : ""}<button type="button" class="secondary" data-action="field-image" data-field="${esc(field.id)}">${t("field.upload")}</button></span>`;
      else
        control = `<input ${data} type="${field.type === "duration" ? "number" : field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}" ${["duration", "number"].includes(field.type) ? 'step="any"' : ""} value="${esc(value)}" maxlength="1000">`;
      return `<label class="field custom-record-field">${esc(fieldLabel(field, language))}${control}</label>`;
    })
    .join("")}</section>`;
}
// V10.50 · the voice recorder's five states, each said plainly: ready (with
// the microphone permission), recording (red dot, time, live sound level,
// a clear stop), saving (until the file is really stored), saved, failed
// (the recording is kept in memory and can be saved again).
export function clockText(seconds) {
  const s = Math.max(0, Math.floor(Number(seconds) || 0));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}
export function voiceRecorderHTML(voice, t) {
  const v = typeof voice === "object" && voice ? voice : { phase: voice ? "recording" : "ready" };
  const phase = ["ready", "recording", "saving", "saved", "failed"].includes(v.phase) ? v.phase : "ready";
  const hint = v.mic === "denied" ? t("voice.hintDenied") : v.mic === "granted" ? t("voice.hintGranted") : t("voice.hintPrompt");
  const body = {
    ready: `<button class="vr-start" data-action="record-audio"><span class="vr-dot" aria-hidden="true"></span>${t("voice.start")}</button><p class="vr-hint ${v.mic === "denied" ? "warn" : ""}">${hint}</p>`,
    recording: `<canvas id="vr-wave" class="vr-wave" width="560" height="52" aria-hidden="true"></canvas><div class="vr-row"><div class="vr-line" role="status"><span class="vr-dot live" aria-hidden="true"></span><b>${t("voice.recording")}</b><time id="vr-time" aria-live="off">${clockText(v.seconds)}</time></div><button class="vr-stop" data-action="stop-recording"><span class="vr-square" aria-hidden="true"></span>${t("voice.stop")}</button></div>`,
    saving: `<div class="vr-line" role="status"><span class="vr-spin" aria-hidden="true"></span><b>${t("voice.saving")}</b></div><p class="vr-hint">${t("voice.savingHint")}</p>`,
    saved: `<div class="vr-line ok" role="status"><span class="vr-check" aria-hidden="true">✓</span><b>${t("voice.saved")}</b></div><p class="vr-hint">${t("voice.savedHint")}</p><button class="vr-again" data-action="record-audio">${t("voice.again")}</button>`,
    failed: `<div class="vr-line err" role="alert"><b>${t("voice.failed")}</b></div><p class="vr-hint">${t("voice.failedHint")}</p><div class="vr-actions"><button class="primary" data-action="voice-retry">${t("voice.retry")}</button><button class="text-button danger-text" data-action="voice-discard">${t("voice.discard")}</button></div>`,
  }[phase];
  return `<div class="voice-rec" data-phase="${phase}" aria-label="${t("voice.label")}">${body}</div>`;
}
export function mediaPanelHTML(entry, ctx, voice) {
  const { t } = ctx;
  const add = `<div class="media-add-actions"><button class="secondary" data-action="upload-video">${t("media.video")}</button><button class="secondary" data-action="upload-audio">${t("media.audio")}</button></div><p class="save-help">${t("media.limit")}</p>`;
  const cards = (entry.media || []).map((clip) => mediaCardHTML(clip, ctx, { editable: true, onPage: (entry.layers || []).some((layer) => layer.clipId === clip.id) })).join("");
  // V10.23: a page's own clips (with 换封面 / 从页面移除) come first; adding
  // more is below them. An empty page shows the ways to add first.
  // V10.50: the recorder comes first, so "正在录音 / 正在保存" is always in
  // sight (the sheet is short on a small iPhone).
  const rec = voiceRecorderHTML(voice, t);
  return `<section class="media-section"><div class="section-heading"><h2>${t("media.title")}</h2><span class="badge">${t("media.local")}</span></div>${rec}${cards ? cards + add : add + `<p class="empty">${t("media.empty")}</p>`}</section>`;
}
