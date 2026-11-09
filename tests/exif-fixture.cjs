// Test helper: adds an EXIF DateTimeOriginal to a JPEG buffer (synthetic
// test data; the photos are the app's own public sample photos).
function withExifTime(jpeg, when) {
  const text = Buffer.from(`${when}\0`, "ascii"); // "2026:11:09 08:10:00"
  const tiff = Buffer.alloc(44 + text.length);
  tiff.write("MM", 0, "ascii");
  tiff.writeUInt16BE(42, 2);
  tiff.writeUInt32BE(8, 4);
  tiff.writeUInt16BE(1, 8); // IFD0: one entry, the Exif IFD pointer
  tiff.writeUInt16BE(0x8769, 10);
  tiff.writeUInt16BE(4, 12);
  tiff.writeUInt32BE(1, 14);
  tiff.writeUInt32BE(26, 18);
  tiff.writeUInt32BE(0, 22);
  tiff.writeUInt16BE(1, 26); // Exif IFD: DateTimeOriginal
  tiff.writeUInt16BE(0x9003, 28);
  tiff.writeUInt16BE(2, 30);
  tiff.writeUInt32BE(text.length, 32);
  tiff.writeUInt32BE(44, 36);
  tiff.writeUInt32BE(0, 40);
  text.copy(tiff, 44);
  const header = Buffer.from("Exif\0\0", "binary");
  const app1 = Buffer.alloc(4);
  app1.writeUInt16BE(0xffe1, 0);
  app1.writeUInt16BE(2 + header.length + tiff.length, 2);
  return Buffer.concat([jpeg.subarray(0, 2), app1, header, tiff, jpeg.subarray(2)]);
}
module.exports = { withExifTime };
