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
    <filter id="shadow" x="-24%" y="-24%" width="148%" height="148%">
      <feDropShadow dx="0" dy="3" stdDeviation="2" flood-color="#16201d" flood-opacity="0.36"/>
    </filter>
    <filter id="smallShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="1.5" stdDeviation="1" flood-color="#16201d" flood-opacity="0.32"/>
    </filter>
  </defs>
  ${body}
</svg>`;
}

const assets = [
  {
    name: 'map_gate',
    width: 128,
    height: 112,
    body: `
      <ellipse cx="64" cy="97" rx="48" ry="10" fill="#16201d" opacity="0.28"/>
      <g filter="url(#shadow)">
        <rect x="17" y="31" width="10" height="63" rx="3" fill="#5b3f2f" stroke="#203029" stroke-width="3"/>
        <rect x="101" y="31" width="10" height="63" rx="3" fill="#5b3f2f" stroke="#203029" stroke-width="3"/>
        <path d="M24 19 H87 L107 34 L87 49 H24 Z" fill="#f2c46d" stroke="#203029" stroke-width="4" stroke-linejoin="round"/>
        <path d="M104 57 H41 L21 72 L41 87 H104 Z" fill="#8ed6c9" stroke="#203029" stroke-width="4" stroke-linejoin="round"/>
        <path d="M39 34 h25" stroke="#203029" stroke-width="5" stroke-linecap="round"/>
        <path d="M77 34 l12 -7 v14z" fill="#203029"/>
        <path d="M88 71 H64" stroke="#203029" stroke-width="5" stroke-linecap="round"/>
        <path d="M51 71 l-12 -7 v14z" fill="#203029"/>
        <path d="M48 52 C58 44 70 44 80 52" fill="none" stroke="#fff0c7" stroke-width="4" stroke-linecap="round"/>
        <path d="M58 55 l12 -7 l12 7 v13 h-24z" fill="#704071" stroke="#203029" stroke-width="3" stroke-linejoin="round"/>
        <path d="M28 92 C46 80 78 80 100 92" fill="none" stroke="#fff0c7" stroke-width="5" opacity="0.62" stroke-linecap="round"/>
      </g>
    `,
  },
  {
    name: 'prop_clarity_gps_post',
    width: 144,
    height: 104,
    body: `
      <ellipse cx="72" cy="91" rx="51" ry="9" fill="#16201d" opacity="0.28"/>
      <rect x="65" y="60" width="14" height="30" rx="4" fill="#6b4a33" stroke="#203029" stroke-width="3"/>
      <g filter="url(#shadow)">
        <path d="M32 24 h80 a9 9 0 0 1 9 9 v38 a9 9 0 0 1 -9 9 h-80 a9 9 0 0 1 -9 -9 v-38 a9 9 0 0 1 9 -9z" fill="#fff0c7" stroke="#203029" stroke-width="5"/>
        <rect x="39" y="35" width="66" height="32" rx="5" fill="#203029"/>
        <path d="M44 60 C54 47 65 62 77 48 C85 39 92 46 100 39" fill="none" stroke="#8ed6c9" stroke-width="5" stroke-linecap="round"/>
        <circle cx="47" cy="60" r="5" fill="#f2c46d" stroke="#203029" stroke-width="2"/>
        <path d="M95 36 l14 8 l-14 8z" fill="#f2c46d" stroke="#203029" stroke-width="2" stroke-linejoin="round"/>
        <path d="M57 21 l10 -13 h10 l10 13" fill="none" stroke="#203029" stroke-width="5" stroke-linecap="round"/>
        <circle cx="72" cy="8" r="5" fill="#8ed6c9" stroke="#203029" stroke-width="3"/>
        <path d="M53 75 h38" stroke="#f2c46d" stroke-width="4" stroke-linecap="round"/>
      </g>
      <path d="M18 86 C36 71 52 73 68 85 C86 98 104 98 126 78" fill="none" stroke="#2f84bd" stroke-width="5" opacity="0.72" stroke-linecap="round"/>
    `,
  },
  {
    name: 'prop_clarity_world_scale_vista',
    width: 520,
    height: 144,
    body: `
      <rect width="520" height="144" rx="14" fill="#16201d"/>
      <path d="M0 74 C78 44 126 86 194 54 C250 28 308 88 374 48 C426 18 474 54 520 34 V144 H0 Z" fill="#3f536f" opacity="0.76"/>
      <path d="M0 94 C74 66 124 102 198 78 C258 58 312 105 374 76 C432 48 470 82 520 62 V144 H0 Z" fill="#b46b45" opacity="0.56"/>
      <path d="M0 116 C96 94 174 103 252 92 C344 78 426 88 520 74 V144 H0 Z" fill="#d9b36a" opacity="0.5"/>
      <path d="M34 116 C84 88 132 88 184 116" stroke="#8ed6c9" stroke-width="6" opacity="0.78" fill="none" stroke-linecap="round"/>
      <circle cx="92" cy="96" r="10" fill="#8ed6c9" opacity="0.86"/>
      <path d="M356 94 l36 -27 l36 27 v26 h-72z" fill="#704071" opacity="0.82"/>
      <path d="M392 69 v50" stroke="#f2c46d" stroke-width="5" opacity="0.86"/>
      <path d="M264 119 l29 -59 l29 59z" fill="#d47b3d" opacity="0.9"/>
      <path d="M35 124 C112 104 194 121 260 108 C338 92 426 114 488 90" fill="none" stroke="#fff0c7" stroke-width="5" opacity="0.32" stroke-linecap="round"/>
    `,
  },
  {
    name: 'prop_clarity_route_marker_set',
    width: 192,
    height: 48,
    body: `
      <rect width="192" height="48" fill="none"/>
      <g transform="translate(24 24)" filter="url(#smallShadow)">
        <circle r="15" fill="#f2c46d" stroke="#203029" stroke-width="4"/>
        <path d="M0 -10 l9 21 h-18z" fill="#203029"/>
      </g>
      <g transform="translate(72 24)" filter="url(#smallShadow)">
        <path d="M0 -18 l16 16 l-16 20 l-16 -20z" fill="#fff0c7" stroke="#203029" stroke-width="4" stroke-linejoin="round"/>
        <path d="M0 -10 v13" stroke="#f2c46d" stroke-width="5" stroke-linecap="round"/>
        <circle cx="0" cy="11" r="3" fill="#f2c46d"/>
      </g>
      <g transform="translate(120 24)" filter="url(#smallShadow)">
        <rect x="-14" y="-1" width="28" height="18" rx="4" fill="#7f8783" stroke="#203029" stroke-width="4"/>
        <path d="M-8 -1 v-8 a8 8 0 0 1 16 0 v8" fill="none" stroke="#203029" stroke-width="4"/>
        <path d="M-10 13 l20 -20" stroke="#fff0c7" stroke-width="3" opacity="0.8"/>
      </g>
      <g transform="translate(168 24)" filter="url(#smallShadow)">
        <circle r="15" fill="#5aa67b" stroke="#203029" stroke-width="4"/>
        <path d="M-8 0 l5 7 l12 -14" fill="none" stroke="#fff0c7" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
      </g>
    `,
  },
  {
    name: 'prop_clarity_sonoran_landmark_set',
    width: 320,
    height: 64,
    body: `
      <rect width="320" height="64" fill="none"/>
      <g transform="translate(32 34)" filter="url(#smallShadow)">
        <path d="M-25 7 C-10 -10 10 -10 25 7" fill="none" stroke="#a78b76" stroke-width="9" stroke-linecap="round"/>
        <path d="M-18 11 C-5 1 5 1 18 11" fill="none" stroke="#8ed6c9" stroke-width="4" opacity="0.78"/>
      </g>
      <g transform="translate(96 34)" filter="url(#smallShadow)">
        <path d="M-26 9 h52" stroke="#6b4a33" stroke-width="8" stroke-linecap="round"/>
        <path d="M-20 9 l13 -24 l13 24 l13 -24 l13 24" fill="none" stroke="#f2c46d" stroke-width="5" stroke-linejoin="round"/>
      </g>
      <g transform="translate(160 34)" filter="url(#smallShadow)">
        <path d="M-25 7 C-10 -10 10 -10 25 7" fill="none" stroke="#8ed6c9" stroke-width="9" stroke-linecap="round"/>
        <circle cx="-8" cy="-4" r="5" fill="#fff0c7"/>
        <circle cx="11" cy="-6" r="4" fill="#fff0c7"/>
      </g>
      <g transform="translate(224 34)" filter="url(#smallShadow)">
        <path d="M-21 16 l21 -43 l21 43z" fill="#b46b45" stroke="#203029" stroke-width="4"/>
        <path d="M-9 5 h18" stroke="#f2c46d" stroke-width="5"/>
      </g>
      <g transform="translate(288 34)" filter="url(#smallShadow)">
        <rect x="-22" y="-8" width="44" height="27" rx="6" fill="#d9b28a" stroke="#203029" stroke-width="4"/>
        <path d="M-27 -8 l27 -17 l27 17" fill="#b46b45" stroke="#203029" stroke-width="3" stroke-linejoin="round"/>
        <rect x="-5" y="3" width="10" height="16" rx="2" fill="#f2c46d"/>
      </g>
    `,
  },
  {
    name: 'prop_replacement_bridge_debris',
    width: 208,
    height: 112,
    body: `
      <rect width="208" height="112" fill="none"/>
      <ellipse cx="104" cy="92" rx="86" ry="13" fill="#16201d" opacity="0.2"/>
      <path d="M15 77 C48 59 84 62 113 76 C144 91 174 84 195 67" fill="none" stroke="#8ed6c9" stroke-width="10" opacity="0.5" stroke-linecap="round"/>
      <g filter="url(#shadow)">
        <rect x="24" y="36" width="62" height="16" rx="4" fill="#8f623e" stroke="#203029" stroke-width="4" transform="rotate(-13 55 44)"/>
        <rect x="73" y="51" width="72" height="16" rx="4" fill="#d9b36a" stroke="#203029" stroke-width="4" transform="rotate(8 109 59)"/>
        <rect x="126" y="33" width="50" height="16" rx="4" fill="#8f623e" stroke="#203029" stroke-width="4" transform="rotate(-9 151 41)"/>
        <path d="M32 33 l32 42 m32 -36 l38 43 m30 -43 l-34 43" stroke="#f2c46d" stroke-width="5" opacity="0.86" stroke-linecap="round"/>
        <circle cx="48" cy="80" r="6" fill="#7f7369" stroke="#203029" stroke-width="2"/>
        <circle cx="98" cy="83" r="5" fill="#7f7369" stroke="#203029" stroke-width="2"/>
        <circle cx="151" cy="78" r="6" fill="#7f7369" stroke="#203029" stroke-width="2"/>
        <path d="M59 53 l10 10 m54 -4 l12 12 m17 -31 l10 9" stroke="#203029" stroke-width="3" opacity="0.6" stroke-linecap="round"/>
      </g>
      <path d="M24 94 C70 103 137 103 184 91" fill="none" stroke="#fff0c7" stroke-width="5" opacity="0.42" stroke-linecap="round"/>
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
