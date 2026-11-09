let messages = {},
  language = "zh-CN",
  storage;
export function configureI18n(dictionary, preferences) {
  messages = dictionary;
  storage = preferences;
  language =
    preferences.getItem("little-days.language") === "en" ? "en" : "zh-CN";
}
export function locale() {
  return language === "en" ? "en-US" : "zh-CN";
}
export function languageCode() {
  return language;
}
export function t(key, values = {}) {
  let value = messages[key]?.[language === "en" ? "en" : "zh"] ?? key;
  for (const [name, replacement] of Object.entries(values))
    value = value.split(`{${name}}`).join(String(replacement));
  return value;
}
// Built-in labels (sample habit themes, book categories) are shown in the
// interface language; anything a person typed has no key and stays as is.
export function presetLabel(kind, value) {
  const key = `${kind}.${value}`;
  return messages[key] ? t(key) : value;
}
export function setLanguage(next) {
  if (!["zh-CN", "en"].includes(next)) throw new Error("Unsupported language");
  storage.setItem("little-days.language", next);
  language = next;
  document.documentElement.lang = next;
}
