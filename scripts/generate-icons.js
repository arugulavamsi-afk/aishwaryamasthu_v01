/**
 * Resizes public/icons/Aishwaryamasthu_logo_v01.png → icon-192.png & icon-512.png
 * Pure Node.js — no npm packages needed.
 * Run: node scripts/generate-icons.js
 */
const zlib = require('zlib');
const fs   = require('fs');
const path = require('path');

// ── CRC32 ─────────────────────────────────────────────────────────────
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
  const ci = Buffer.alloc(4); ci.writeUInt32BE(crc32(Buffer.concat([t, d])));
  return Buffer.concat([len, t, d, ci]);
}

// ── Paeth predictor ───────────────────────────────────────────────────
function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
}

// ── PNG decoder → RGBA Uint8Array ─────────────────────────────────────
function decodePNG(buf) {
  const SIG = Buffer.from([137,80,78,71,13,10,26,10]);
  if (!buf.slice(0,8).equals(SIG)) throw new Error('Not a PNG file');

  let pos = 8, width, height, bitDepth, colorType;
  const idats = [];

  while (pos < buf.length) {
    const len  = buf.readUInt32BE(pos); pos += 4;
    const type = buf.slice(pos, pos+4).toString('ascii'); pos += 4;
    const data = buf.slice(pos, pos+len); pos += len + 4; // +4 skip CRC

    if (type === 'IHDR') {
      width=data.readUInt32BE(0); height=data.readUInt32BE(4);
      bitDepth=data[8]; colorType=data[9];
    } else if (type === 'IDAT') {
      idats.push(data);
    } else if (type === 'IEND') break;
  }

  const bpp = colorType===6 ? 4 : colorType===2 ? 3 : colorType===4 ? 2 : 1;
  const raw  = zlib.inflateSync(Buffer.concat(idats));
  const out  = new Uint8Array(width * height * 4);
  const stride = width * bpp;
  const prev = new Uint8Array(stride);

  let rp = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[rp++];
    const row = new Uint8Array(stride);
    for (let x = 0; x < stride; x++) {
      const byte = raw[rp++];
      const a = x >= bpp ? row[x-bpp] : 0;
      const b = prev[x];
      const c = x >= bpp ? prev[x-bpp] : 0;
      row[x] = filter===0 ? byte
             : filter===1 ? (byte+a)&0xFF
             : filter===2 ? (byte+b)&0xFF
             : filter===3 ? (byte+Math.floor((a+b)/2))&0xFF
             : (byte+paeth(a,b,c))&0xFF;
    }
    prev.set(row);
    for (let x = 0; x < width; x++) {
      const si = x*bpp, di = (y*width+x)*4;
      if (colorType===6) {
        out[di]=row[si]; out[di+1]=row[si+1]; out[di+2]=row[si+2]; out[di+3]=row[si+3];
      } else if (colorType===2) {
        out[di]=row[si]; out[di+1]=row[si+1]; out[di+2]=row[si+2]; out[di+3]=255;
      } else if (colorType===4) { // grey+alpha
        out[di]=out[di+1]=out[di+2]=row[si]; out[di+3]=row[si+1];
      } else { // grey
        out[di]=out[di+1]=out[di+2]=row[si]; out[di+3]=255;
      }
    }
  }
  return { width, height, pixels: out };
}

// ── Bilinear resize ───────────────────────────────────────────────────
function resize(src, srcW, srcH, dstW, dstH) {
  const dst = new Uint8Array(dstW * dstH * 4);
  const xScale = srcW / dstW, yScale = srcH / dstH;
  for (let dy = 0; dy < dstH; dy++) {
    for (let dx = 0; dx < dstW; dx++) {
      const sx = (dx+0.5)*xScale - 0.5, sy = (dy+0.5)*yScale - 0.5;
      const x0 = Math.max(0,Math.floor(sx)), y0 = Math.max(0,Math.floor(sy));
      const x1 = Math.min(srcW-1,x0+1),     y1 = Math.min(srcH-1,y0+1);
      const fx = sx-x0, fy = sy-y0;
      const di = (dy*dstW+dx)*4;
      for (let c = 0; c < 4; c++) {
        dst[di+c] = Math.round(
          src[(y0*srcW+x0)*4+c]*(1-fx)*(1-fy) +
          src[(y0*srcW+x1)*4+c]*fx*(1-fy)     +
          src[(y1*srcW+x0)*4+c]*(1-fx)*fy     +
          src[(y1*srcW+x1)*4+c]*fx*fy
        );
      }
    }
  }
  return dst;
}

// ── PNG encoder ───────────────────────────────────────────────────────
function encodePNG(width, height, pixels) {
  const raw = [];
  for (let y = 0; y < height; y++) {
    raw.push(0);
    for (let x = 0; x < width; x++) {
      const i = (y*width+x)*4;
      raw.push(pixels[i], pixels[i+1], pixels[i+2], pixels[i+3]);
    }
  }
  const compressed = zlib.deflateSync(Buffer.from(raw), { level: 9 });
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width,0); ihdr.writeUInt32BE(height,4);
  ihdr[8]=8; ihdr[9]=6; // RGBA
  return Buffer.concat([
    Buffer.from([137,80,78,71,13,10,26,10]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', compressed),
    pngChunk('IEND', Buffer.alloc(0))
  ]);
}

// ── Remove white background: make near-white pixels transparent ────────
function removeWhiteBg(logo) {
  var out = new Uint8Array(logo.pixels.length);
  for (var i = 0; i < logo.pixels.length; i += 4) {
    var r = logo.pixels[i], g = logo.pixels[i+1], b = logo.pixels[i+2], a = logo.pixels[i+3];
    // Compute "whiteness" — how close to white this pixel is
    var minCh = Math.min(r, g, b);
    var sat   = (Math.max(r,g,b) - minCh) / (Math.max(r,g,b) || 1); // 0=grey/white, 1=saturated
    var white = minCh / 255; // 0=dark, 1=pure white
    // Fade to transparent as pixel approaches white with low saturation
    var newAlpha = a;
    if (white > 0.88 && sat < 0.12) {
      newAlpha = Math.round(a * Math.max(0, 1 - (white - 0.88) / 0.12));
    }
    out[i] = r; out[i+1] = g; out[i+2] = b; out[i+3] = newAlpha;
  }
  return { width: logo.width, height: logo.height, pixels: out };
}

// ── Auto-crop: find bounding box of non-white/non-transparent pixels ──
function autoCrop(logo) {
  var minX = logo.width, maxX = 0, minY = logo.height, maxY = 0;
  for (var y = 0; y < logo.height; y++) {
    for (var x = 0; x < logo.width; x++) {
      var i = (y * logo.width + x) * 4;
      var r = logo.pixels[i], g = logo.pixels[i+1], b = logo.pixels[i+2], a = logo.pixels[i+3];
      // Skip fully transparent or near-white pixels
      if (a < 20) continue;
      if (r > 240 && g > 240 && b > 240) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  // Add 2% margin around detected content
  var mx = Math.round(logo.width  * 0.02);
  var my = Math.round(logo.height * 0.02);
  minX = Math.max(0, minX - mx); maxX = Math.min(logo.width  - 1, maxX + mx);
  minY = Math.max(0, minY - my); maxY = Math.min(logo.height - 1, maxY + my);
  var cw = maxX - minX + 1, ch = maxY - minY + 1;
  var cropped = new Uint8Array(cw * ch * 4);
  for (var cy = 0; cy < ch; cy++) {
    for (var cx = 0; cx < cw; cx++) {
      var si = ((minY + cy) * logo.width + (minX + cx)) * 4;
      var di = (cy * cw + cx) * 4;
      cropped[di] = logo.pixels[si]; cropped[di+1] = logo.pixels[si+1];
      cropped[di+2] = logo.pixels[si+2]; cropped[di+3] = logo.pixels[si+3];
    }
  }
  console.log('Auto-crop: ' + logo.width + 'x' + logo.height + ' → ' + cw + 'x' + ch + ' (x:' + minX + '-' + maxX + ' y:' + minY + '-' + maxY + ')');
  return { width: cw, height: ch, pixels: cropped };
}

// ── Gradient background pixel ──────────────────────────────────────────
function gradientBg(x, y, size) {
  // Diagonal gradient: top-left #071e22 → centre #0c2d45 → bottom-right #0d3a2a
  var t = (x + y) / (2 * (size - 1));
  var r = Math.round(0x07 + (0x0d - 0x07) * t);
  var g = Math.round(0x1e + (0x3a - 0x1e) * t);
  var b = Math.round(0x22 + (0x2a - 0x22) * t);
  return [r, g, b];
}

// ── Compose: gradient background + centered cropped logo ───────────────
function compose(logo, iconSize, paddingFraction) {
  var canvas = new Uint8Array(iconSize * iconSize * 4);

  // Fill gradient background
  for (var py = 0; py < iconSize; py++) {
    for (var px = 0; px < iconSize; px++) {
      var bg = gradientBg(px, py, iconSize);
      var di = (py * iconSize + px) * 4;
      canvas[di] = bg[0]; canvas[di+1] = bg[1]; canvas[di+2] = bg[2]; canvas[di+3] = 255;
    }
  }

  // Fit cropped logo inside canvas keeping aspect ratio
  var pad     = Math.round(iconSize * paddingFraction);
  var maxSide = iconSize - pad * 2;
  var scale   = Math.min(maxSide / logo.width, maxSide / logo.height);
  var dstW    = Math.round(logo.width  * scale);
  var dstH    = Math.round(logo.height * scale);
  var offX    = Math.round((iconSize - dstW) / 2);
  var offY    = Math.round((iconSize - dstH) / 2);

  var logoResized = resize(logo.pixels, logo.width, logo.height, dstW, dstH);

  // Alpha-composite logo over gradient
  for (var y = 0; y < dstH; y++) {
    for (var x = 0; x < dstW; x++) {
      var si = (y * dstW + x) * 4;
      var idx = ((offY + y) * iconSize + (offX + x)) * 4;
      var a   = logoResized[si + 3] / 255;
      var bg2 = [canvas[idx], canvas[idx+1], canvas[idx+2]];
      canvas[idx]   = Math.round(logoResized[si]   * a + bg2[0] * (1 - a));
      canvas[idx+1] = Math.round(logoResized[si+1] * a + bg2[1] * (1 - a));
      canvas[idx+2] = Math.round(logoResized[si+2] * a + bg2[2] * (1 - a));
      canvas[idx+3] = 255;
    }
  }

  return canvas;
}

// ── Main ──────────────────────────────────────────────────────────────
const srcFile = path.join(__dirname, '..', 'public', 'icons', 'Aishwaryamasthu_logo_v01.png');
const outDir  = path.join(__dirname, '..', 'public', 'icons');

console.log('Reading:', srcFile);
const srcRaw    = decodePNG(fs.readFileSync(srcFile));
console.log('Source:', srcRaw.width + 'x' + srcRaw.height);
const srcNoBg   = removeWhiteBg(srcRaw);  // strip white background
const src       = autoCrop(srcNoBg);      // crop to actual logo content

// 11% padding — logo occupies 78% of the icon
const PADDING = 0.11;

[192, 512].forEach(function(size) {
  const pixels = compose(src, size, PADDING);
  const png    = encodePNG(size, size, pixels);
  const out    = path.join(outDir, 'icon-' + size + '.png');
  fs.writeFileSync(out, png);
  console.log('Written:', out, '(' + png.length + ' bytes)');
});

console.log('Done.');
