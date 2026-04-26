/**
 * terrainNoise — small deterministic value-noise helper for terrain rendering.
 *
 * Exposes:
 *   - hash2(seed, ix, iy)            32-bit int hash, deterministic
 *   - rand2(seed, ix, iy)            float in [0,1), deterministic
 *   - valueNoise2(seed, x, y)        smooth value noise in [0,1] over R^2
 *   - fbm2(seed, x, y, oct?, lac?, gain?)  fractal Brownian motion in [0,1]
 *   - generateHeightmap(opts)        coarse 2D heightmap as Float32Array
 *
 * Why vendored: keeps the world-map terrain pipeline self-contained — no
 * top-level dependency for what amounts to ~80 lines of hashing math.
 *
 * All outputs are deterministic given the same seed, so the same world map
 * renders identically across reloads / HMR cycles.
 */

// 32-bit integer hash (xorshift-flavored). Stable across V8 + Node.
export function hash2(seed, ix, iy) {
  let h = (seed | 0) ^ Math.imul(ix | 0, 0x27d4eb2d) ^ Math.imul(iy | 0, 0x165667b1);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  h = (h ^ (h >>> 16)) >>> 0;
  return h;
}

export function rand2(seed, ix, iy) {
  return hash2(seed, ix, iy) / 0xffffffff;
}

// Smoothstep — cheap C1 interpolant for value noise.
function smooth(t) {
  return t * t * (3 - 2 * t);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

/**
 * 2D value noise sampled at real coords (x, y). Cells are 1 unit wide;
 * caller scales the input to control feature size. Output in [0, 1].
 */
export function valueNoise2(seed, x, y) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = smooth(x - x0);
  const fy = smooth(y - y0);
  const v00 = rand2(seed, x0, y0);
  const v10 = rand2(seed, x0 + 1, y0);
  const v01 = rand2(seed, x0, y0 + 1);
  const v11 = rand2(seed, x0 + 1, y0 + 1);
  return lerp(lerp(v00, v10, fx), lerp(v01, v11, fx), fy);
}

/**
 * Fractal Brownian motion — sums a few octaves of value noise. Output is
 * normalized so it stays in [0, 1] regardless of octave count.
 */
export function fbm2(seed, x, y, octaves = 4, lacunarity = 2.0, gain = 0.5) {
  let amp = 1;
  let freq = 1;
  let sum = 0;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += amp * valueNoise2(seed + i * 1013, x * freq, y * freq);
    norm += amp;
    amp *= gain;
    freq *= lacunarity;
  }
  return norm > 0 ? sum / norm : 0;
}

/**
 * Generate a coarse 2D heightmap. Returns a flat Float32Array of length
 * (cols * rows) with values in [0, 1], plus the dimensions for sampling.
 *
 * @param {object} opts
 * @param {number} opts.seed       integer seed; same seed = same map
 * @param {number} opts.cols       grid width (cells)
 * @param {number} opts.rows       grid height (cells)
 * @param {number} [opts.scale=4]  fbm input scale; smaller = bigger features
 * @param {number} [opts.octaves=4]
 */
export function generateHeightmap({ seed, cols, rows, scale = 4, octaves = 4 }) {
  const data = new Float32Array(cols * rows);
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const nx = (x / cols) * scale;
      const ny = (y / rows) * scale;
      data[y * cols + x] = fbm2(seed, nx, ny, octaves);
    }
  }
  return { data, cols, rows };
}

/**
 * Sample a heightmap at fractional grid coords with bilinear interp.
 * Coords (gx, gy) are in cell units; out-of-range is clamped.
 */
export function sampleHeightmap(hm, gx, gy) {
  const { data, cols, rows } = hm;
  const cx = Math.max(0, Math.min(cols - 1.001, gx));
  const cy = Math.max(0, Math.min(rows - 1.001, gy));
  const x0 = Math.floor(cx);
  const y0 = Math.floor(cy);
  const fx = cx - x0;
  const fy = cy - y0;
  const v00 = data[y0 * cols + x0];
  const v10 = data[y0 * cols + (x0 + 1)];
  const v01 = data[(y0 + 1) * cols + x0];
  const v11 = data[(y0 + 1) * cols + (x0 + 1)];
  return lerp(lerp(v00, v10, fx), lerp(v01, v11, fx), fy);
}
