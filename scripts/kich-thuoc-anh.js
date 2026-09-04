// Đọc kích thước thật của ảnh từ vài byte đầu file — không cần thư viện ngoài.
// Dùng để chèn width/height vào <img>, thứ duy nhất cho trình duyệt biết tỉ lệ
// ảnh TRƯỚC khi ảnh tải xong. Thiếu nó thì ảnh chiếm cao 0px rồi bung ra khi
// tải xong, đẩy chữ bên dưới xuống — đúng định nghĩa CLS.
//
// .gitignore chặn package.json nên máy vừa clone không có thư viện nào; vì vậy
// parser viết tay, chỉ đọc phần header chứ không giải mã ảnh.

const fs = require('fs');

// ── WebP ────────────────────────────────────────────────────────────
// RIFF....WEBP + 1 trong 3 biến thể: VP8 (lossy), VP8L (lossless), VP8X (mở rộng)
function webpSize(b) {
  if (b.length < 30) return null;
  if (b.toString('ascii', 0, 4) !== 'RIFF' || b.toString('ascii', 8, 12) !== 'WEBP') return null;
  const fourcc = b.toString('ascii', 12, 16);

  if (fourcc === 'VP8 ') {
    // khung key-frame: 3 byte tag, 3 byte start code 9d 01 2a, rồi 2+2 byte kích thước
    if (b[23] !== 0x9d || b[24] !== 0x01 || b[25] !== 0x2a) return null;
    return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
  }
  if (fourcc === 'VP8L') {
    if (b[20] !== 0x2f) return null;
    const bits = b.readUInt32LE(21);
    return { w: (bits & 0x3fff) + 1, h: ((bits >> 14) & 0x3fff) + 1 };
  }
  if (fourcc === 'VP8X') {
    // kích thước là 2 số 24-bit little-endian, lưu dạng (giá trị - 1)
    return {
      w: (b[24] | (b[25] << 8) | (b[26] << 16)) + 1,
      h: (b[27] | (b[28] << 8) | (b[29] << 16)) + 1,
    };
  }
  return null;
}

// ── PNG ─────────────────────────────────────────────────────────────
function pngSize(b) {
  if (b.length < 24) return null;
  if (b.readUInt32BE(0) !== 0x89504e47) return null;
  if (b.toString('ascii', 12, 16) !== 'IHDR') return null;
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}

// ── JPEG ────────────────────────────────────────────────────────────
// duyệt các marker cho tới SOF0..SOF15 (bỏ DHT/DAC/RSTn), đọc 2 byte cao/rộng
function jpegSize(b) {
  if (b.length < 4 || b[0] !== 0xff || b[1] !== 0xd8) return null;
  let i = 2;
  while (i < b.length - 9) {
    if (b[i] !== 0xff) { i++; continue; }
    const marker = b[i + 1];
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) { i += 2; continue; }
    const len = b.readUInt16BE(i + 2);
    const isSOF = marker >= 0xc0 && marker <= 0xcf
      && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
    if (isSOF) return { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) };
    i += 2 + len;
  }
  return null;
}

// ── GIF ─────────────────────────────────────────────────────────────
function gifSize(b) {
  if (b.length < 10 || b.toString('ascii', 0, 3) !== 'GIF') return null;
  return { w: b.readUInt16LE(6), h: b.readUInt16LE(8) };
}

// ── SVG (viewBox / width+height) ────────────────────────────────────
function svgSize(b) {
  const s = b.toString('utf8', 0, Math.min(b.length, 2048));
  if (!/<svg/i.test(s)) return null;
  const vb = s.match(/viewBox\s*=\s*["']\s*[\d.-]+[\s,]+[\d.-]+[\s,]+([\d.]+)[\s,]+([\d.]+)/i);
  if (vb) return { w: Math.round(+vb[1]), h: Math.round(+vb[2]) };
  const w = s.match(/\bwidth\s*=\s*["'](\d+)/i), h = s.match(/\bheight\s*=\s*["'](\d+)/i);
  if (w && h) return { w: +w[1], h: +h[1] };
  return null;
}

const cache = new Map();

/** Trả về {w,h} hoặc null nếu không đọc được / file không tồn tại. */
function kichThuocAnh(file) {
  if (cache.has(file)) return cache.get(file);
  let out = null;
  try {
    const fd = fs.openSync(file, 'r');
    // 64 KB đủ cho mọi header; JPEG có EXIF to vẫn nằm gọn trong ngần này
    const buf = Buffer.alloc(Math.min(65536, fs.fstatSync(fd).size));
    fs.readSync(fd, buf, 0, buf.length, 0);
    fs.closeSync(fd);
    out = webpSize(buf) || pngSize(buf) || jpegSize(buf) || gifSize(buf) || svgSize(buf);
    if (out && (!out.w || !out.h)) out = null;
  } catch (e) { out = null; }
  cache.set(file, out);
  return out;
}

module.exports = { kichThuocAnh };
