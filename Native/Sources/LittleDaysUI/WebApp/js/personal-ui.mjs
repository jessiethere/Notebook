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
export function coverHTML(book, ctx) {
  const { catalog, tokens, media, t } = ctx;
  const template = catalog.coverTemplates.some(
    (item) => item.id === book.coverTemplate,
  )
    ? book.coverTemplate
    : "minimal-linen";
  const decoration = stickerURL(book.coverDecoration || "tulip", catalog);
  const photo = media.resolve(book.coverImage || "");
  return `<div class="book-cover cover-${template}" style="--cover-color:${coverColor(book, tokens)};font-family:${esc(fontFamily(book.coverFont || "elegant", catalog))}">${photo ? `<img class="cover-photo" src="${esc(photo)}" alt="">` : ""}<span class="cover-rule"></span><span class="cover-title">${esc(book.title || "Little Days")}</span>${decoration && book.coverDecoration !== "none" ? `<img class="cover-decoration" src="${decoration}" alt="">` : ""}<span class="cover-imprint">LITTLE DAYS</span></div>`;
}
export function bookDialogHTML(book, ctx) {
  const { catalog, t, tokens } = ctx;
  return `<h2>${t(book.id ? "books.dialogEdit" : "books.dialogNew")}</h2><p class="dialog-description">${t("books.dialogDescription")}</p><div id="book-cover-preview" class="book-cover-preview">${coverHTML(book, ctx)}</div><div class="dialog-fields">
 <label class="field">${t("books.name")}<input name="title" required maxlength="60" placeholder="${t("books.namePlaceholder")}" value="${esc(book.title || "")}"></label><label class="field">${t("books.description")}<textarea name="description" maxlength="300">${esc(book.description || "")}</textarea></label><label class="field">${t("books.category")}<input name="category" required maxlength="40" value="${esc(book.category || "Daily Life")}"></label>
 <label class="field">${t("books.cover")}</label><input name="coverTemplate" type="hidden" value="${esc(book.coverTemplate || "minimal-linen")}"><div class="cover-template-grid">${catalog.coverTemplates.map((template) => `<button type="button" data-action="cover-template" data-template="${template.id}" class="cover-option ${(book.coverTemplate || "minimal-linen") === template.id ? "selected" : ""}">${coverHTML({ ...book, coverTemplate: template.id, coverImage: "" }, ctx)}<span>${t("cover." + template.id)}</span></button>`).join("")}</div>
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
  return `<section class="media-section"><div class="section-heading"><h2>${t("media.title")}</h2><span class="badge">IndexedDB</span></div><div class="media-add-actions"><button class="secondary" data-action="upload-video">${t("media.video")}</button><button class="secondary" data-action="upload-audio">${t("media.audio")}</button><button class="secondary ${recording ? "is-recording" : ""}" data-action="${recording ? "stop-recording" : "record-audio"}">${t(recording ? "media.stop" : "media.record")}</button></div><p id="record-status" class="record-status" role="status">${recording ? t("media.recording", { seconds: 0 }) : ""}</p><p class="save-help">${t("media.limit")}</p>${
    entry.media?.length
      ? entry.media
          .map((clip) => mediaCardHTML(clip, ctx, { editable: true }))
          .join("")
      : `<p class="empty">${t("media.empty")}</p>`
  }</section>`;
}
export function settingsHTML(ctx) {
  const { t, catalog, language } = ctx;
  return `<header class="page-top"><div><h1 class="page-title">${t("settings.title")}</h1><p class="page-subtitle">${t("settings.subtitle")}</p></div></header><section class="settings-card"><h2>${t("language")}</h2><div class="segmented"><button data-action="language" data-language="zh-CN" class="${language === "zh-CN" ? "selected" : ""}">简体中文</button><button data-action="language" data-language="en" class="${language === "en" ? "selected" : ""}">English</button></div><p>${t("settings.contentNote")}</p></section><section class="settings-card"><h2>${t("settings.storage")}</h2><p>${t("settings.storageNote")}</p><button class="primary" data-action="backup">${t("settings.backup")}</button><button class="secondary" data-action="restore-backup">${t("settings.restore")}</button><p>${t("settings.backupNote")}</p><p id="media-usage" role="status"></p></section><section class="settings-card"><h2>${t("settings.private")}</h2><p>${t("settings.privateNote")}</p></section><section class="settings-card"><h2>${t("settings.licenses")}</h2><p>${t("settings.licensesNote")}</p>${catalog.fonts.map((font) => `<a href="library/fonts/${font.license}" target="_blank" rel="noopener">${font.name} · SIL OFL 1.1 ↗</a>`).join("")}<a href="library/stickers/LittleDays-Original-Assets.txt" target="_blank" rel="noopener">Little Days Original Artwork ↗</a></section>`;
}
