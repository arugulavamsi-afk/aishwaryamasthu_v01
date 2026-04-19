/**
 * Generates public/icons/icon-192.png and icon-512.png
 * Uses only Node.js built-ins — no npm packages needed.
 * Run: node scripts/generate-icons.js
 */
const zlib = require('zlib');
const fs   = require('fs');
const path = require('path');

// ── Colors ────────────────────────────────────────────
const NAVY  = [12,  35,  64,  255];
const NAVY2 = [14,  74,  122, 255];
const GREEN = [14,  92,  58,  255];
const GOLD  = [245, 200, 66,  255];
const TRANS = [0,   0,   0,   0  ];

// ── PNG encoder (pure Node.js) ────────────────────────
const CRC_TABLE = (function() {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function pngChunk(type, data) {
  const t = Buffer.from(type, 'ascii');
  const d = Buffer.isBuffer(data) ? data : Buffer.from(data);
  const len = Buffer.alloc(4); len.writeUInt32BE(d.length);
  const crcInput = Buffer.concat([t, d]);
  const crcBuf = Buffer.alloc(4); crcBuf.writeUInt32BE(crc32(crcInput));
  return Buffer.concat([len, t, d, crcBuf]);
}

function encodePNG(width, height, pixels) {
  // pixels: flat Uint8Array of RGBA values, row by row
  const raw = [];
  for (let y = 0; y < height; y++) {
    raw.push(0); // filter type None
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      raw.push(pixels[i], pixels[i+1], pixels[i+2], pixels[i+3]);
    }
  }
  const compressed = zlib.deflateSync(Buffer.from(raw), { level: 9 });

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width,  0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8]  = 8;  // bit depth
  ihdrData[9]  = 6;  // RGBA
  ihdrData[10] = 0;  // deflate
  ihdrData[11] = 0;  // filter
  ihdrData[12] = 0;  // interlace none

  return Buffer.concat([
    Buffer.from([137,80,78,71,13,10,26,10]), // PNG sig
    pngChunk('IHDR', ihdrData),
    pngChunk('IDAT', compressed),
    pngChunk('IEND', Buffer.alloc(0))
  ]);
}

// ── Drawing helpers ───────────────────────────────────
function dist(ax, ay, bx, by) {
  return Math.sqrt((ax-bx)**2 + (ay-by)**2);
}

// Signed distance to a rounded rectangle (positive = outside)
function sdfRoundedRect(px, py, cx, cy, hw, hh, r) {
  const qx = Math.abs(px - cx) - hw + r;
  const qy = Math.abs(py - cy) - hh + r;
  return Math.sqrt(Math.max(qx,0)**2 + Math.max(qy,0)**2) + Math.min(Math.max(qx,qy),0) - r;
}

function setPixel(pixels, w, x, y, color) {
  if (x < 0 || y < 0 || x >= w || y >= w) return;
  const i = (Math.round(y) * w + Math.round(x)) * 4;
  pixels[i]=color[0]; pixels[i+1]=color[1]; pixels[i+2]=color[2]; pixels[i+3]=color[3];
}

function fillRect(pixels, w, x0, y0, x1, y1, color) {
  for (let y = Math.round(y0); y < Math.round(y1); y++)
    for (let x = Math.round(x0); x < Math.round(x1); x++)
      setPixel(pixels, w, x, y, color);
}

// ── Icon drawing ──────────────────────────────────────
function drawIcon(size) {
  const px = new Uint8Array(size * size * 4); // all transparent
  const cx = size / 2, cy = size / 2;
  const hw = size / 2, hh = size / 2;
  const r  = size * 0.20; // corner radius
  const border = size * 0.035;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const sdf = sdfRoundedRect(x + 0.5, y + 0.5, cx, cy, hw - 0.5, hh - 0.5, r);

      // Outside the shape → transparent
      if (sdf > 0.5) continue;

      // Gold border ring
      const innerSdf = sdfRoundedRect(x + 0.5, y + 0.5, cx, cy, hw - border, hh - border, r - border);
      if (innerSdf > -0.5) {
        setPixel(px, size, x, y, GOLD);
        continue;
      }

      // Background gradient (navy → navy-blue → dark green, diagonal)
      const t = (x + y) / (size * 2);
      const bg = t < 0.45
        ? lerpColor(NAVY, NAVY2, t / 0.45)
        : lerpColor(NAVY2, GREEN, (t - 0.45) / 0.55);
      setPixel(px, size, x, y, bg);
    }
  }

  // ── Gold coin circle ──────────────────────────────
  const coinR = size * 0.335;
  const coinBorder = size * 0.03;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const d = dist(x + 0.5, y + 0.5, cx, cy);
      if (d <= coinR + 0.5) {
        const color = d >= coinR - coinBorder ? GOLD
                    : d >= coinR - coinBorder * 2.5 ? lerpColor(GOLD, [220,170,40,255], 0.4)
                    : GOLD;
        setPixel(px, size, x, y, color);
      }
    }
  }

  // ── ₹ symbol inside the coin (navy on gold) ──────────
  const u = size / 512;  // scale unit
  // Vertical bar
  const barX  = cx - 20*u, barW = 38*u;
  const barY  = cy - 70*u, barH = 155*u;
  fillRect(px, size, barX, barY, barX+barW, barY+barH, NAVY);

  // Top horizontal bar
  const hbar1Y = cy - 70*u, hbar1H = 32*u;
  fillRect(px, size, cx - 70*u, hbar1Y, cx + 70*u, hbar1Y + hbar1H, NAVY);

  // Middle horizontal bar
  const hbar2Y = cy - 20*u, hbar2H = 30*u;
  fillRect(px, size, cx - 70*u, hbar2Y, cx + 70*u, hbar2Y + hbar2H, NAVY);

  // Diagonal slash (bottom-right of ₹)
  for (let i = 0; i < 110*u; i++) {
    const lx = (cx + 55*u) - i * 0.7;
    const ly = (cy - 5*u) + i;
    fillRect(px, size, lx, ly, lx + 30*u, ly + 28*u, NAVY);
  }

  return px;
}

function lerpColor(a, b, t) {
  return [
    Math.round(a[0] + (b[0]-a[0]) * t),
    Math.round(a[1] + (b[1]-a[1]) * t),
    Math.round(a[2] + (b[2]-a[2]) * t),
    255
  ];
}

// ── Generate & write ──────────────────────────────────
const outDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

[192, 512].forEach(function(size) {
  const pixels = drawIcon(size);
  const png    = encodePNG(size, size, pixels);
  const file   = path.join(outDir, 'icon-' + size + '.png');
  fs.writeFileSync(file, png);
  console.log('Written:', file, '(' + png.length + ' bytes)');
});

console.log('Done.');
