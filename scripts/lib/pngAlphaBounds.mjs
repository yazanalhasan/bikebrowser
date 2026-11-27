/**
 * Minimal PNG reader: find the bounding box of a PNG's non-transparent pixels.
 *
 * Used by the Act 1 art registry generator to record how much transparent
 * padding a tiling texture carries. A seamless ground texture that ships with
 * even two transparent pixels around its edge draws a visible grid of gaps
 * when it is tiled, so the registry stores the trim and the renderer tiles
 * the cropped region instead.
 *
 * Supports the colour types the art pipeline produces: 8-bit RGBA (6),
 * 8-bit RGB (2), 8-bit grey+alpha (4) and 8-bit grey (0), non-interlaced.
 * Anything else returns a zero trim, which is the safe answer.
 */

import zlib from 'node:zlib';
import fs from 'node:fs';

const CHANNELS = { 0: 1, 2: 3, 4: 2, 6: 4 };

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

/**
 * @param {string} file
 * @returns {{width:number,height:number,trim:[number,number,number,number]}}
 *   trim is [left, top, right, bottom] transparent padding in pixels.
 */
export function pngAlphaBounds(file) {
  const buf = fs.readFileSync(file);
  if (buf.toString('latin1', 1, 4) !== 'PNG') throw new Error(`not a png: ${file}`);

  let width = 0;
  let height = 0;
  let depth = 0;
  let colorType = 0;
  let interlace = 0;
  const idat = [];

  let off = 8;
  while (off < buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString('latin1', off + 4, off + 8);
    const data = buf.subarray(off + 8, off + 8 + len);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      depth = data[8];
      colorType = data[9];
      interlace = data[12];
    } else if (type === 'IDAT') {
      idat.push(data);
    } else if (type === 'IEND') {
      break;
    }
    off += 12 + len;
  }

  const zero = { width, height, trim: [0, 0, 0, 0] };
  const channels = CHANNELS[colorType];
  // No alpha channel, unusual bit depth, or interlaced: nothing to trim.
  if (!channels || depth !== 8 || interlace !== 0) return zero;
  if (colorType !== 4 && colorType !== 6) return zero;

  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const out = Buffer.alloc(height * stride);

  let pos = 0;
  for (let y = 0; y < height; y += 1) {
    const filter = raw[pos];
    pos += 1;
    const rowStart = y * stride;
    const prevStart = (y - 1) * stride;
    for (let x = 0; x < stride; x += 1) {
      const rawByte = raw[pos + x];
      const a = x >= channels ? out[rowStart + x - channels] : 0;
      const b = y > 0 ? out[prevStart + x] : 0;
      const c = x >= channels && y > 0 ? out[prevStart + x - channels] : 0;
      let value;
      switch (filter) {
        case 0: value = rawByte; break;
        case 1: value = rawByte + a; break;
        case 2: value = rawByte + b; break;
        case 3: value = rawByte + ((a + b) >> 1); break;
        case 4: value = rawByte + paeth(a, b, c); break;
        default: return zero;
      }
      out[rowStart + x] = value & 0xff;
    }
    pos += stride;
  }

  const alphaOffset = channels - 1;
  const THRESHOLD = 8;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y += 1) {
    const rowStart = y * stride;
    for (let x = 0; x < width; x += 1) {
      if (out[rowStart + x * channels + alphaOffset] > THRESHOLD) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return zero;
  return {
    width,
    height,
    trim: [minX, minY, width - 1 - maxX, height - 1 - maxY],
  };
}
