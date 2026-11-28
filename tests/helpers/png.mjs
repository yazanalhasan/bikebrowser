/**
 * A minimal PNG reader, so tests can look at the art itself.
 *
 * Two plan items need pixels: 0.10 (the idle side frames are swapped) and
 * 0.9 (sprites whose opaque edge is cut flat inside the canvas). Both are
 * faults in the image, and a test that cannot see pixels can only assert
 * that someone remembered to write a number down.
 *
 * Handles what the repo's art actually is: non-interlaced, 8-bit, colour
 * type 2 (RGB) or 6 (RGBA). Anything else throws rather than guessing.
 */
import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';

const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

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
 * @param {string|URL} path
 * @returns {{width: number, height: number, data: Uint8Array}} RGBA, 4 bytes per pixel
 */
export function readPng(path) {
  const buf = readFileSync(path);
  if (!buf.subarray(0, 8).equals(SIGNATURE)) throw new Error(`not a PNG: ${path}`);

  let width = 0;
  let height = 0;
  let depth = 0;
  let colorType = 0;
  const idat = [];

  let offset = 8;
  while (offset < buf.length) {
    const length = buf.readUInt32BE(offset);
    const type = buf.toString('ascii', offset + 4, offset + 8);
    const body = buf.subarray(offset + 8, offset + 8 + length);
    if (type === 'IHDR') {
      width = body.readUInt32BE(0);
      height = body.readUInt32BE(4);
      depth = body[8];
      colorType = body[9];
      const interlace = body[12];
      if (depth !== 8) throw new Error(`unsupported bit depth ${depth} in ${path}`);
      if (colorType !== 2 && colorType !== 6) {
        throw new Error(`unsupported colour type ${colorType} in ${path}`);
      }
      if (interlace !== 0) throw new Error(`interlaced PNG not supported: ${path}`);
    } else if (type === 'IDAT') {
      idat.push(body);
    } else if (type === 'IEND') {
      break;
    }
    offset += 12 + length;
  }

  const channels = colorType === 6 ? 4 : 3;
  const stride = width * channels;
  const raw = inflateSync(Buffer.concat(idat));
  const out = new Uint8Array(width * height * 4);
  const line = new Uint8Array(stride);
  const prev = new Uint8Array(stride);

  let pos = 0;
  for (let y = 0; y < height; y += 1) {
    const filter = raw[pos];
    pos += 1;
    raw.copy(line, 0, pos, pos + stride);
    pos += stride;

    for (let i = 0; i < stride; i += 1) {
      const a = i >= channels ? line[i - channels] : 0;
      const b = prev[i];
      const c = i >= channels ? prev[i - channels] : 0;
      switch (filter) {
        case 0: break;
        case 1: line[i] = (line[i] + a) & 0xff; break;
        case 2: line[i] = (line[i] + b) & 0xff; break;
        case 3: line[i] = (line[i] + ((a + b) >> 1)) & 0xff; break;
        case 4: line[i] = (line[i] + paeth(a, b, c)) & 0xff; break;
        default: throw new Error(`unknown PNG filter ${filter} in ${path}`);
      }
    }

    for (let x = 0; x < width; x += 1) {
      const src = x * channels;
      const dst = (y * width + x) * 4;
      out[dst] = line[src];
      out[dst + 1] = line[src + 1];
      out[dst + 2] = line[src + 2];
      out[dst + 3] = channels === 4 ? line[src + 3] : 255;
    }
    prev.set(line);
  }

  return { width, height, data: out };
}

/** A rectangle out of a decoded image, same shape as `readPng`. */
export function crop(img, x, y, w, h) {
  const data = new Uint8Array(w * h * 4);
  for (let row = 0; row < h; row += 1) {
    for (let col = 0; col < w; col += 1) {
      const src = ((y + row) * img.width + (x + col)) * 4;
      const dst = (row * w + col) * 4;
      data.set(img.data.subarray(src, src + 4), dst);
    }
  }
  return { width: w, height: h, data };
}

/** `fn(x, y, r, g, b, a)` for every pixel. */
export function eachPixel(img, fn) {
  for (let y = 0; y < img.height; y += 1) {
    for (let x = 0; x < img.width; x += 1) {
      const i = (y * img.width + x) * 4;
      fn(x, y, img.data[i], img.data[i + 1], img.data[i + 2], img.data[i + 3]);
    }
  }
}

/** The bounding box of pixels with alpha above `threshold`, or null. */
export function opaqueBounds(img, threshold = 16) {
  let minX = img.width;
  let minY = img.height;
  let maxX = -1;
  let maxY = -1;
  eachPixel(img, (x, y, _r, _g, _b, a) => {
    if (a <= threshold) return;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  });
  if (maxX < 0) return null;
  return { minX, minY, maxX, maxY, width: maxX - minX + 1, height: maxY - minY + 1 };
}
