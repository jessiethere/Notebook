// When was a photo taken? Reads EXIF DateTimeOriginal from the original JPEG
// bytes. It must run BEFORE the photo is shrunk: drawing it on a canvas and
// encoding again drops EXIF. Pure parsing, no dependencies; HEIC and PNG have
// no readable time here and fall back to the file's date.

const ascii = (view, offset, length) => {
  let out = "";
  for (let i = 0; i < length && offset + i < view.byteLength; i++) {
    const c = view.getUint8(offset + i);
    if (!c) break;
    out += String.fromCharCode(c);
  }
  return out;
};

// "2026:11:09 08:10:00" → local Date (EXIF has no time zone by default).
export function parseExifDate(text) {
  const m = /^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/.exec(String(text || "").trim());
  if (!m) return null;
  const [y, mo, d, h, mi, s] = m.slice(1).map((n) => Number(n || 0));
  if (y < 1990 || mo < 1 || mo > 12 || d < 1 || d > 31 || h > 23 || mi > 59) return null;
  const date = new Date(y, mo - 1, d, h, mi, s);
  return Number.isNaN(date.getTime()) ? null : date;
}

function readIfd(view, tiff, offset, little, wanted) {
  const found = {};
  if (offset < 0 || tiff + offset + 2 > view.byteLength) return found;
  const count = view.getUint16(tiff + offset, little);
  for (let i = 0; i < count; i++) {
    const entry = tiff + offset + 2 + i * 12;
    if (entry + 12 > view.byteLength) break;
    const tag = view.getUint16(entry, little);
    if (!wanted.includes(tag)) continue;
    const type = view.getUint16(entry + 2, little);
    const length = view.getUint32(entry + 4, little);
    if (type === 2) found[tag] = ascii(view, length > 4 ? tiff + view.getUint32(entry + 8, little) : entry + 8, length);
    else if (type === 4) found[tag] = view.getUint32(entry + 8, little);
  }
  return found;
}

// The capture time in an ArrayBuffer holding (the start of) a JPEG, or null.
export function exifDate(buffer) {
  const view = new DataView(buffer);
  if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) return null;
  let offset = 2;
  while (offset + 4 <= view.byteLength) {
    const marker = view.getUint16(offset);
    if ((marker & 0xff00) !== 0xff00 || marker === 0xffda) break; // start of image data
    const size = view.getUint16(offset + 2);
    if (marker === 0xffe1 && ascii(view, offset + 4, 4) === "Exif") {
      const tiff = offset + 10;
      if (tiff + 8 > view.byteLength) return null;
      const little = view.getUint16(tiff) === 0x4949;
      const ifd0 = readIfd(view, tiff, view.getUint32(tiff + 4, little), little, [0x8769, 0x0132]);
      const exif = ifd0[0x8769] ? readIfd(view, tiff, ifd0[0x8769], little, [0x9003, 0x9004]) : {};
      return parseExifDate(exif[0x9003] || exif[0x9004] || ifd0[0x0132]);
    }
    offset += 2 + size;
  }
  return null;
}

// { time: ms since epoch or null, source: "exif" | "file" | "" }.
export async function photoTime(file) {
  try {
    if (/jpe?g$/i.test(file.type || "") || /\.jpe?g$/i.test(file.name || "")) {
      const head = await file.slice(0, 256 * 1024).arrayBuffer();
      const date = exifDate(head);
      if (date) return { time: date.getTime(), source: "exif" };
    }
  } catch {}
  return Number.isFinite(file.lastModified) && file.lastModified > 0 ? { time: file.lastModified, source: "file" } : { time: null, source: "" };
}
