import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import sharp from 'sharp';

const finalDir = join(process.cwd(), 'src/game/art/final/act1');
const sourceDir = join(process.cwd(), 'src/game/art/source/aseprite/act1/prop_clarity');
mkdirSync(finalDir, { recursive: true });
mkdirSync(sourceDir, { recursive: true });

function svg(width, height, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="3" stdDeviation="2" flood-color="#17221f" flood-opacity="0.35"/>
    </filter>
  </defs>
  ${body}
</svg>`;
}

const assets = [
  {
    name: 'map_gate',
    width: 112,
    height: 112,
    body: `
      <ellipse cx="56" cy="96" rx="42" ry="9" fill="#17221f" opacity="0.28"/>
      <g filter="url(#softShadow)">
        <rect x="20" y="36" width="8" height="56" rx="3" fill="#6b4a33"/>
        <rect x="84" y="36" width="8" height="56" rx="3" fill="#6b4a33"/>
        <path d="M24 25 H80 L94 38 L80 51 H24 Z" fill="#f2c46d" stroke="#6b4a33" stroke-width="4" stroke-linejoin="round"/>
        <path d="M88 56 H32 L18 69 L32 82 H88 Z" fill="#8ed6c9" stroke="#6b4a33" stroke-width="4" stroke-linejoin="round"/>
        <path d="M39 37 C47 31 57 31 65 37" fill="none" stroke="#203029" stroke-width="4" stroke-linecap="round"/>
        <circle cx="42" cy="68" r="7" fill="#203029"/>
        <path d="M60 63 l11 -7 l11 7 v12 h-22z" fill="#203029"/>
        <path d="M67 60 v15" stroke="#f2c46d" stroke-width="2"/>
      </g>
      <path d="M30 92 C47 76 65 76 82 92" fill="none" stroke="#fff0c7" stroke-width="5" opacity="0.65" stroke-linecap="round"/>
    `,
  },
  {
    name: 'prop_clarity_gps_post',
    width: 128,
    height: 96,
    body: `
      <ellipse cx="64" cy="83" rx="46" ry="8" fill="#17221f" opacity="0.28"/>
      <rect x="58" y="50" width="12" height="32" rx="4" fill="#6b4a33"/>
      <path d="M35 26 h58 a8 8 0 0 1 8 8 v32 a8 8 0 0 1 -8 8 h-58 a8 8 0 0 1 -8 -8 v-32 a8 8 0 0 1 8 -8z" fill="#fff0c7" stroke="#203029" stroke-width="5" filter="url(#softShadow)"/>
      <rect x="41" y="37" width="46" height="24" rx="4" fill="#203029"/>
      <path d="M45 55 C55 43 65 57 83 43" fill="none" stroke="#8ed6c9" stroke-width="4" stroke-linecap="round"/>
      <circle cx="49" cy="55" r="4" fill="#f2c46d"/>
      <path d="M78 41 l11 6 l-11 6z" fill="#f7c46d"/>
      <path d="M53 22 l8 -12 h6 l8 12" fill="none" stroke="#203029" stroke-width="4" stroke-linecap="round"/>
      <circle cx="64" cy="10" r="4" fill="#8ed6c9" stroke="#203029" stroke-width="2"/>
      <path d="M22 72 C36 60 50 60 64 72 C78 84 92 84 106 72" fill="none" stroke="#2f84bd" stroke-width="5" stroke-linecap="round"/>
    `,
  },
  {
    name: 'prop_clarity_world_scale_vista',
    width: 480,
    height: 128,
    body: `
      <rect width="480" height="128" rx="12" fill="#203029"/>
      <path d="M0 72 C72 48 112 88 176 56 C230 30 274 84 342 48 C392 22 432 54 480 36 V128 H0 Z" fill="#3f536f" opacity="0.66"/>
      <path d="M0 88 C74 64 120 104 188 74 C246 48 298 98 354 68 C408 42 442 76 480 58 V128 H0 Z" fill="#d47b3d" opacity="0.46"/>
      <path d="M0 100 C76 88 148 96 220 86 C306 74 384 82 480 70 V128 H0 Z" fill="#d9b36a" opacity="0.42"/>
      <path d="M40 106 C94 82 134 82 188 106" stroke="#8ed6c9" stroke-width="5" opacity="0.72" fill="none" stroke-linecap="round"/>
      <circle cx="86" cy="91" r="9" fill="#8ed6c9" opacity="0.78"/>
      <path d="M340 86 l34 -24 l34 24 v23 h-68z" fill="#704071" opacity="0.72"/>
      <path d="M371 64 v43" stroke="#f2c46d" stroke-width="4" opacity="0.78"/>
      <path d="M270 106 l26 -52 l26 52z" fill="#b46b45" opacity="0.82"/>
    `,
  },
  {
    name: 'prop_clarity_route_marker_set',
    width: 192,
    height: 48,
    body: `
      <rect width="192" height="48" fill="none"/>
      <g transform="translate(24 24)">
        <circle r="14" fill="#f2c46d" stroke="#203029" stroke-width="4"/>
        <path d="M0 -8 l8 18 h-16z" fill="#203029"/>
      </g>
      <g transform="translate(72 24)">
        <path d="M0 -17 l15 15 l-15 19 l-15 -19z" fill="#fff0c7" stroke="#203029" stroke-width="4" stroke-linejoin="round"/>
        <circle cx="0" cy="-2" r="4" fill="#f7c46d"/>
        <rect x="-2" y="4" width="4" height="9" rx="2" fill="#f7c46d"/>
      </g>
      <g transform="translate(120 24)">
        <rect x="-13" y="-2" width="26" height="18" rx="4" fill="#7f8783" stroke="#203029" stroke-width="4"/>
        <path d="M-8 -2 v-7 a8 8 0 0 1 16 0 v7" fill="none" stroke="#203029" stroke-width="4"/>
        <path d="M-9 11 l18 -18" stroke="#fff0c7" stroke-width="3" opacity="0.75"/>
      </g>
      <g transform="translate(168 24)">
        <circle r="14" fill="#8bb09a" stroke="#203029" stroke-width="4"/>
        <path d="M-7 0 l5 6 l10 -12" fill="none" stroke="#fff0c7" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
      </g>
    `,
  },
  {
    name: 'prop_clarity_sonoran_landmark_set',
    width: 320,
    height: 64,
    body: `
      <rect width="320" height="64" fill="none"/>
      <g transform="translate(32 34)">
        <path d="M-24 5 C-9 -9 9 -9 24 5" fill="none" stroke="#a78b76" stroke-width="8" stroke-linecap="round"/>
        <path d="M-17 9 C-5 0 5 0 17 9" fill="none" stroke="#8ed6c9" stroke-width="3" opacity="0.7"/>
      </g>
      <g transform="translate(96 34)">
        <path d="M-24 8 h48" stroke="#6b4a33" stroke-width="7" stroke-linecap="round"/>
        <path d="M-18 8 l12 -22 l12 22 l12 -22 l12 22" fill="none" stroke="#f2c46d" stroke-width="4" stroke-linejoin="round"/>
      </g>
      <g transform="translate(160 34)">
        <path d="M-24 6 C-10 -8 10 -8 24 6" fill="none" stroke="#8ed6c9" stroke-width="8" stroke-linecap="round"/>
        <circle cx="-8" cy="-3" r="4" fill="#fff0c7"/>
        <circle cx="10" cy="-5" r="3" fill="#fff0c7"/>
      </g>
      <g transform="translate(224 34)">
        <path d="M-20 15 l20 -40 l20 40z" fill="#b46b45" stroke="#203029" stroke-width="4"/>
        <path d="M-8 5 h16" stroke="#f2c46d" stroke-width="4"/>
      </g>
      <g transform="translate(288 34)">
        <rect x="-22" y="-8" width="44" height="26" rx="6" fill="#d9b28a" stroke="#203029" stroke-width="4"/>
        <path d="M-26 -8 l26 -16 l26 16" fill="#b46b45"/>
        <rect x="-5" y="3" width="10" height="15" rx="2" fill="#f2c46d"/>
      </g>
    `,
  },
];

for (const asset of assets) {
  const content = svg(asset.width, asset.height, asset.body);
  const sourcePath = join(sourceDir, `${asset.name}.svg`);
  const outPath = join(finalDir, `${asset.name}.png`);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(sourcePath, `${content}\n`);
  await sharp(Buffer.from(content)).png().toFile(outPath);
  console.log(`wrote ${outPath}`);
}
