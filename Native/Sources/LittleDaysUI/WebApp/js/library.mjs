// Relative so the same files work on localhost, in the iOS shell and as a hosted link.
export const LIBRARY_BASE = "library/";
// Simple defaults that use the device's own fonts (nothing bundled, no
// licence needed): 黑体, 宋体, 楷体. 楷体 falls back to the bundled WenKai
// where the device has no Kai font.
export const SYSTEM_FONTS = {
  hei: '"PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans SC","Source Han Sans SC",system-ui,sans-serif',
  song: '"Songti SC","STSong","SimSun","Noto Serif SC","Source Han Serif SC",Georgia,serif',
  kai: '"Kaiti SC","STKaiti","KaiTi","BiauKai","LD-zh-wenkai",serif',
};
export function fontFamily(fontId, catalog) {
  if (SYSTEM_FONTS[fontId]) return SYSTEM_FONTS[fontId];
  const font = catalog.fonts.find((f) => f.id === fontId);
  return font
    ? `"${font.family}","LD-chinese",serif`
    : fontId === "serif"
      ? 'Georgia,"Songti SC",SimSun,serif'
      : fontId === "rounded"
        ? '"Trebuchet MS","Microsoft YaHei",sans-serif'
        : "system-ui,sans-serif";
}
export function stickerURL(assetId, catalog) {
  const asset = catalog.stickers.find((item) => item.id === assetId);
  return asset ? `${LIBRARY_BASE}stickers/${asset.file}` : "";
}
export function coverColor(book, tokens) {
  return /^#[0-9a-f]{6}$/i.test(book.coverTint || "")
    ? book.coverTint
    : tokens.colors[book.color] || tokens.colors.blush;
}
export function validateFieldDefinitions(fields) {
  const allowed = [
    "text",
    "number",
    "date",
    "select",
    "checkbox",
    "duration",
    "image",
  ];
  if (fields.length > 20) throw new Error("error.fieldsLimit");
  const seen = new Set();
  for (const field of fields) {
    if (
      !field.label.trim() ||
      !allowed.includes(field.type) ||
      seen.has(field.id)
    )
      throw new Error("error.invalidField");
    seen.add(field.id);
    if (
      field.type === "select" &&
      (!field.options?.length || field.options.length > 20)
    )
      throw new Error("error.selectOptions");
  }
  return fields;
}
