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
  const title = esc(book.title || "Little Days");
  const line = esc((book.description || "").trim());
  const img = photo ? `<img class="mag-photo" src="${esc(photo)}" alt="">` : `<span class="mag-photo mag-photo-empty"></span>`;
  const date = `'${String(now.getFullYear()).slice(2)} ${String(now.getMonth() + 1).padStart(2, "0")} ${String(now.getDate()).padStart(2, "0")}`;
  if (template === "magazine-mono")
    return `<div class="book-cover cover-magazine-mono" style="--cover-color:${coverColor(book, tokens)}"><span class="mag-top"><span>LITTLE DAYS</span><span>NO.${String(now.getMonth() + 1).padStart(2, "0")}</span></span><b class="cover-title">${title}</b><span class="mag-frame">${img}</span><span class="mag-foot"><span>${esc(topic)}</span><span>${esc(issue)}</span></span></div>`;
  if (template === "magazine-film")
    return `<div class="book-cover cover-magazine-film" style="--cover-color:${coverColor(book, tokens)}"><span class="film-holes" aria-hidden="true"></span><span class="mag-frame">${img}<i class="film-date">${esc(date)}</i></span><span class="film-holes bottom" aria-hidden="true"></span><span class="mag-foot"><b class="cover-title">${title}</b><span>${esc(topic)} · LITTLE DAYS</span></span></div>`;
  if (template === "magazine-minimal")
    return `<div class="book-cover cover-magazine-minimal" style="--cover-color:${coverColor(book, tokens)}"><span class="mag-brand">little days</span><span class="mag-frame">${img}</span><b class="cover-title">${title}</b><span class="mag-foot">${line || esc(issue)}</span></div>`;
  if (template === "magazine-collage") {
    const [, second, third] = extraPhotoRefs(book, ctx.catalog, 2);
    const extra = (ref) => (media.resolve(ref) ? `<img class="mag-photo" src="${esc(media.resolve(ref))}" alt="">` : `<span class="mag-photo mag-photo-empty"></span>`);
    return `<div class="book-cover cover-magazine-collage" style="--cover-color:${coverColor(book, tokens)}"><span class="collage-grid"><span class="c-main">${img}</span><span class="c-a">${extra(second)}</span><span class="c-b">${extra(third)}</span></span><span class="collage-band"><b class="cover-title">${title}</b><span>${esc(topic)} · ${esc(issue)}</span></span></div>`;
  }
  if (template === "magazine-west")
    return `<div class="book-cover cover-magazine-west" style="--cover-color:${coverColor(book, tokens)}">${img}<span class="mag-shade" aria-hidden="true"></span><span class="mag-top"><span>${esc(issue)}</span><span>${esc(topic)}</span></span><span class="mag-masthead">LITTLE DAYS</span><span class="mag-lines"><b class="cover-title">${title}</b>${line ? `<i>${line}</i>` : ""}</span><span class="mag-barcode" aria-hidden="true"></span></div>`;
  return `<div class="book-cover cover-magazine-jp" style="--cover-color:${coverColor(book, tokens)}"><span class="mag-top"><span class="mag-brand">little days</span><span>${esc(issue)}</span></span><span class="mag-frame">${img}</span><b class="mag-vertical cover-title" style="--n:${Math.max(4, [...String(book.title || "Little Days")].length)}">${title}</b><span class="mag-foot"><span>${esc(topic)}</span><i></i><span>${line || "LIFESTYLE JOURNAL"}</span></span></div>`;
}
export function coverHTML(book, ctx) {
  const { catalog, tokens, media, t } = ctx;
  if (MAGAZINE_COVERS.includes(book.coverTemplate)) return magazineCoverHTML(book, ctx, book.coverTemplate);
  const template = catalog.coverTemplates.some(
    (item) => item.id === book.coverTemplate,
  )
    ? book.coverTemplate
    : "minimal-linen";
  const decoration = stickerURL(book.coverDecoration || "tulip", catalog);
  const photo = media.resolve(book.coverImage || "");
  return `<div class="book-cover cover-${template}" style="--cover-color:${coverColor(book, tokens)};font-family:${esc(fontFamily(book.coverFont || "elegant", catalog))}">${photo ? `<img class="cover-photo" src="${esc(photo)}" alt="">` : ""}<span class="cover-rule"></span><span class="cover-title">${esc(book.title || "Little Days")}</span>${decoration && book.coverDecoration !== "none" ? `<img class="cover-decoration" src="${decoration}" alt="">` : ""}<span class="cover-imprint">LITTLE DAYS</span></div>`;
}
// Photos offered for a cover: the ones that suit the book first, then a mix.
function coverPhotoPicks(book, catalog) {
  const photos = catalog.photos || [];
  const suited = photos.filter((photo) => photo.collection === coverCollection(book));
  const others = photos.filter((photo, k) => photo.collection !== coverCollection(book) && k % 6 === 0);
  return [...suited, ...others].slice(0, 14);
}
export function bookDialogHTML(book, ctx) {
  const { catalog, t, tokens } = ctx;
  return `<h2>${t(book.id ? "books.dialogEdit" : "books.dialogNew")}</h2><p class="dialog-description">${t("books.dialogDescription")}</p><div id="book-cover-preview" class="book-cover-preview">${coverHTML(book, ctx)}</div><div class="dialog-fields">
 <label class="field">${t("books.name")}<input name="title" required maxlength="60" placeholder="${t("books.namePlaceholder")}" value="${esc(book.title || "")}"></label><label class="field">${t("books.description")}<textarea name="description" maxlength="300">${esc(book.description || "")}</textarea></label><label class="field">${t("books.tags")}<input name="tags" maxlength="120" placeholder="${t("books.tagsPlaceholder")}" value="${esc((book.tags || []).map((tag) => (/\s/.test(tag) ? `#${tag}` : tag)).join(" "))}"><small class="field-hint">${t("books.tagsHint")}</small></label><label class="field">${t("books.category")}<input name="category" required maxlength="40" value="${esc(book.category || "Daily Life")}"></label>
 <label class="field">${t("books.cover")}</label><input name="coverTemplate" type="hidden" value="${esc(book.coverTemplate || "minimal-linen")}"><div class="cover-template-grid">${catalog.coverTemplates.map((template) => `<button type="button" data-action="cover-template" data-template="${template.id}" class="cover-option ${(book.coverTemplate || "minimal-linen") === template.id ? "selected" : ""}">${coverHTML({ ...book, coverTemplate: template.id, coverImage: MAGAZINE_COVERS.includes(template.id) ? book.coverImage : "" }, ctx)}<span>${t("cover." + template.id)}</span></button>`).join("")}</div>
 <label class="field">${t("books.coverPhotoPick")}</label><div class="cover-photo-picks">${coverPhotoPicks(book, catalog)
   .map((photo) => `<button type="button" data-action="cover-library-photo" data-photo="${esc(photo.id)}" class="${book.coverImage === `photo:${photo.id}` ? "selected" : ""}" aria-label="${esc(ctx.language === "en" ? photo.nameEn : photo.nameZh)}"><img src="${esc(ctx.media.resolve(`photo:${photo.id}`))}" alt="" loading="lazy"></button>`)
   .join("")}</div>
 <div class="field-row"><label class="field">${t("books.color")}<select name="color">${["blush", "sage", "butter", "blue", "cream"].map((color) => `<option value="${color}" ${book.color === color ? "selected" : ""}>${t("color." + color)}</option>`).join("")}</select></label><label class="field">${t("books.font")}<select name="coverFont">${catalog.fonts.map((font) => `<option value="${font.id}" ${(book.coverFont || "elegant") === font.id ? "selected" : ""}>${font.name}</option>`).join("")}</select></label></div>
 <label class="field">${t("books.decoration")}<select name="coverDecoration"><option value="none" ${book.coverDecoration === "none" ? "selected" : ""}>${t("books.none")}</option>${catalog.stickers
   .slice(0, 16)
   .map(
     (s) =>
       `<option value="${s.id}" ${(book.coverDecoration || "tulip") === s.id ? "selected" : ""}>${ctx.language === "en" ? s.nameEn : s.nameZh}</option>`,
   )
   .join(
     "",
   )}</select></label><div class="editor-actions"><button type="button" data-action="cover-photo">${t("books.coverPhoto")}</button><button type="button" data-action="cover-photo-remove">${t("books.removePhoto")}</button></div>
 <label class="field">${t("books.permission")}<select name="visibility"><option value="private">${t("private")}</option><option value="public" disabled>${t("public")}</option><option value="shared" disabled>${t("shared")}</option></select></label><p class="save-help">${t("books.privateNotice")}</p>
 <label class="field">${t("books.preset")}<select id="book-preset"><option value="blank">${t("books.blank")}</option>${(catalog.recordTemplates || []).map((item) => `<option value="${item.id}">${ctx.language === "en" ? item.nameEn : item.nameZh}</option>`).join("")}</select></label><h3 class="field-section-title">${t("books.fields")}</h3><div id="book-field-list">${(book.fields || []).map((f) => fieldDefinitionHTML(f, ctx)).join("")}</div><button class="secondary" type="button" data-action="field-add">${t("books.fieldAdd")}</button>
 </div><div class="dialog-actions"><button type="button" class="secondary" data-action="close-dialog">${t("cancel")}</button><button type="submit" class="primary">${t(book.id ? "save" : "create")}</button></div>`;
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
export function mediaPanelHTML(entry, ctx, recording) {
  const { t } = ctx;
  const add = `<div class="media-add-actions"><button class="secondary" data-action="upload-video">${t("media.video")}</button><button class="secondary" data-action="upload-audio">${t("media.audio")}</button><button class="secondary ${recording ? "is-recording" : ""}" data-action="${recording ? "stop-recording" : "record-audio"}">${t(recording ? "media.stop" : "media.record")}</button></div><p id="record-status" class="record-status" role="status">${recording ? t("media.recording", { seconds: 0 }) : ""}</p><p class="save-help">${t("media.limit")}</p>`;
  const cards = (entry.media || []).map((clip) => mediaCardHTML(clip, ctx, { editable: true, onPage: (entry.layers || []).some((layer) => layer.clipId === clip.id) })).join("");
  // V10.23: a page's own clips (with 换封面 / 从页面移除) come first; adding
  // more is below them. An empty page shows the ways to add first.
  return `<section class="media-section"><div class="section-heading"><h2>${t("media.title")}</h2><span class="badge">${t("media.local")}</span></div>${cards ? cards + add : add + `<p class="empty">${t("media.empty")}</p>`}</section>`;
}
