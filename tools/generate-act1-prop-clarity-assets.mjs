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
        <path d="M20 22 H80 L98 37 L80 52 H20 Z" fill="#f2c46d" stroke="#203029" stroke-width="4" stroke-linejoin="round"/>
        <path d="M92 56 H32 L14 71 L32 86 H92 Z" fill="#8ed6c9" stroke="#203029" stroke-width="4" stroke-linejoin="round"/>
        <path d="M35 37 h30" stroke="#203029" stroke-width="5" stroke-linecap="round"/>
        <path d="M71 37 l10 -6 v12z" fill="#203029"/>
        <path d="M72 71 H46" stroke="#203029" stroke-width="5" stroke-linecap="round"/>
        <path d="M38 71 l-10 -6 v12z" fill="#203029"/>
        <path d="M43 55 l13 -8 l13 8 v15 h-26z" fill="#704071" stroke="#203029" stroke-width="3" stroke-linejoin="round"/>
        <path d="M56 48 v22" stroke="#f2c46d" stroke-width="3"/>
        <circle cx="34" cy="87" r="8" fill="none" stroke="#203029" stroke-width="4"/>
        <circle cx="78" cy="87" r="8" fill="none" stroke="#203029" stroke-width="4"/>
      </g>
      <path d="M28 94 C45 80 67 80 84 94" fill="none" stroke="#fff0c7" stroke-width="5" opacity="0.65" stroke-linecap="round"/>
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
  {
    name: 'prop_replacement_garage_workbench',
    width: 220,
    height: 104,
    body: `
      <rect width="220" height="104" fill="none"/>
      <ellipse cx="112" cy="94" rx="82" ry="8" fill="#17221f" opacity="0.25"/>
      <g filter="url(#softShadow)">
        <rect x="12" y="18" width="196" height="52" rx="7" fill="#5b4638" stroke="#203029" stroke-width="4"/>
        <rect x="20" y="27" width="180" height="12" rx="4" fill="#d9b36a" opacity="0.48"/>
        <path d="M28 47 h52 m16 0 h34 m16 0 h42" stroke="#fff0c7" stroke-width="3" opacity="0.62" stroke-linecap="round"/>
        <circle cx="42" cy="31" r="5" fill="#f2c46d"/>
        <circle cx="68" cy="31" r="5" fill="#f2c46d"/>
        <circle cx="94" cy="31" r="5" fill="#f2c46d"/>
        <path d="M36 70 h148 v12 h-148z" fill="#7a5038" stroke="#203029" stroke-width="4"/>
        <rect x="48" y="74" width="12" height="24" rx="3" fill="#4a3528"/>
        <rect x="160" y="74" width="12" height="24" rx="3" fill="#4a3528"/>
        <rect x="72" y="58" width="62" height="20" rx="4" fill="#8bb09a" stroke="#203029" stroke-width="4"/>
        <path d="M86 67 h34" stroke="#8ed6c9" stroke-width="4" stroke-linecap="round"/>
        <rect x="136" y="54" width="38" height="26" rx="4" fill="#f2c46d" stroke="#203029" stroke-width="4"/>
        <path d="M144 62 h22 m-22 8 h16" stroke="#203029" stroke-width="3" stroke-linecap="round"/>
        <circle cx="36" cy="61" r="13" fill="none" stroke="#203029" stroke-width="5"/>
        <circle cx="36" cy="61" r="5" fill="#8ed6c9" stroke="#203029" stroke-width="3"/>
        <path d="M24 61 h24 M36 49 v24" stroke="#f2c46d" stroke-width="3" stroke-linecap="round"/>
        <path d="M184 28 l-15 15 m7 -16 l12 12" stroke="#8ed6c9" stroke-width="5" stroke-linecap="round"/>
      </g>
      <path d="M22 11 C60 4 102 4 144 11" fill="none" stroke="#8ed6c9" stroke-width="4" opacity="0.5" stroke-linecap="round"/>
    `,
  },
  {
    name: 'prop_replacement_material_table',
    width: 128,
    height: 86,
    body: `
      <rect width="128" height="86" fill="none"/>
      <ellipse cx="65" cy="76" rx="48" ry="6" fill="#17221f" opacity="0.24"/>
      <g filter="url(#softShadow)">
        <rect x="20" y="44" width="88" height="16" rx="5" fill="#8f623e" stroke="#203029" stroke-width="4"/>
        <rect x="30" y="58" width="8" height="20" rx="3" fill="#4a3528"/>
        <rect x="90" y="58" width="8" height="20" rx="3" fill="#4a3528"/>
        <rect x="29" y="26" width="22" height="16" rx="4" fill="#8ed6c9" stroke="#203029" stroke-width="3"/>
        <rect x="54" y="17" width="22" height="25" rx="3" fill="#d08b62" stroke="#203029" stroke-width="3"/>
        <rect x="80" y="29" width="24" height="13" rx="3" fill="#8bb09a" stroke="#203029" stroke-width="3"/>
        <path d="M30 26 h20 M54 25 h22 M80 29 h24" stroke="#fff0c7" stroke-width="2" opacity="0.72"/>
        <circle cx="36" cy="16" r="6" fill="#7f7369" stroke="#203029" stroke-width="3"/>
        <circle cx="47" cy="15" r="5" fill="#f2c46d" stroke="#203029" stroke-width="3"/>
        <path d="M91 17 l9 10 h-18z" fill="#704071" stroke="#203029" stroke-width="3" stroke-linejoin="round"/>
        <path d="M28 14 l14 -7" stroke="#fff0c7" stroke-width="4" stroke-linecap="round"/>
        <path d="M84 16 l14 -7" stroke="#f2c46d" stroke-width="4" stroke-linecap="round"/>
        <path d="M103 22 l12 -4" stroke="#fff0c7" stroke-width="4" stroke-linecap="round"/>
      </g>
      <path d="M23 64 h84" stroke="#f2c46d" stroke-width="3" opacity="0.45" stroke-linecap="round"/>
    `,
  },
  {
    name: 'prop_replacement_chemistry_bench',
    width: 132,
    height: 90,
    body: `
      <rect width="132" height="90" fill="none"/>
      <ellipse cx="68" cy="80" rx="48" ry="7" fill="#17221f" opacity="0.24"/>
      <g filter="url(#softShadow)">
        <rect x="18" y="48" width="94" height="16" rx="5" fill="#785743" stroke="#203029" stroke-width="4"/>
        <rect x="30" y="62" width="8" height="20" rx="3" fill="#4a3528"/>
        <rect x="94" y="62" width="8" height="20" rx="3" fill="#4a3528"/>
        <circle cx="39" cy="37" r="14" fill="#203029" stroke="#8ed6c9" stroke-width="4"/>
        <path d="M30 33 h18 m-14 8 h14" stroke="#fff0c7" stroke-width="3" opacity="0.7" stroke-linecap="round"/>
        <rect x="62" y="22" width="13" height="25" rx="4" fill="#8ed6c9" stroke="#203029" stroke-width="3"/>
        <rect x="82" y="27" width="14" height="20" rx="4" fill="#f2c46d" stroke="#203029" stroke-width="3"/>
        <path d="M67 25 v-10 h24 v12" fill="none" stroke="#fff0c7" stroke-width="3" opacity="0.65"/>
        <rect x="52" y="58" width="30" height="12" rx="3" fill="#d08b62" stroke="#203029" stroke-width="3"/>
        <path d="M54 17 h44" stroke="#203029" stroke-width="4" stroke-linecap="round"/>
        <circle cx="108" cy="42" r="7" fill="#8ed6c9" stroke="#203029" stroke-width="3"/>
        <path d="M103 42 h10 M108 37 v10" stroke="#fff0c7" stroke-width="2" stroke-linecap="round"/>
        <path d="M18 21 l20 -9" stroke="#f2c46d" stroke-width="4" stroke-linecap="round"/>
        <path d="M103 20 l14 -8" stroke="#fff0c7" stroke-width="4" stroke-linecap="round"/>
      </g>
      <path d="M29 74 h78" stroke="#8ed6c9" stroke-width="3" opacity="0.42" stroke-linecap="round"/>
    `,
  },
  {
    name: 'prop_replacement_bridge_debris',
    width: 184,
    height: 96,
    body: `
      <rect width="184" height="96" fill="none"/>
      <ellipse cx="92" cy="78" rx="74" ry="11" fill="#17221f" opacity="0.18"/>
      <g filter="url(#softShadow)">
        <path d="M14 64 C42 52 72 54 98 64 C124 74 150 72 172 60" fill="none" stroke="#8ed6c9" stroke-width="8" opacity="0.48" stroke-linecap="round"/>
        <rect x="28" y="34" width="52" height="14" rx="4" fill="#8f623e" stroke="#203029" stroke-width="4" transform="rotate(-13 54 41)"/>
        <rect x="72" y="42" width="60" height="14" rx="4" fill="#d9b36a" stroke="#203029" stroke-width="4" transform="rotate(8 102 49)"/>
        <rect x="114" y="30" width="42" height="14" rx="4" fill="#8f623e" stroke="#203029" stroke-width="4" transform="rotate(-8 135 37)"/>
        <path d="M34 31 l26 34 m30 -30 l32 34 m24 -36 l-28 36" stroke="#f2c46d" stroke-width="4" opacity="0.78" stroke-linecap="round"/>
        <circle cx="48" cy="66" r="5" fill="#7f7369"/>
        <circle cx="92" cy="70" r="4" fill="#7f7369"/>
        <circle cx="137" cy="67" r="5" fill="#7f7369"/>
        <path d="M54 54 l12 -10 m34 19 l13 -10 m23 -15 l9 10" stroke="#203029" stroke-width="3" opacity="0.75" stroke-linecap="round"/>
        <path d="M24 70 h28 m82 1 h28" stroke="#d9b36a" stroke-width="5" opacity="0.65" stroke-linecap="round"/>
      </g>
      <path d="M24 78 C62 86 122 86 160 76" fill="none" stroke="#fff0c7" stroke-width="4" opacity="0.42" stroke-linecap="round"/>
    `,
  },
  {
    name: 'environment_sonoran_mountain_vista',
    width: 1600,
    height: 360,
    body: `
      <rect width="1600" height="360" fill="#79aeb1" opacity="0.42"/>
      <ellipse cx="260" cy="92" rx="410" ry="94" fill="#ffd17a" opacity="0.24"/>
      <ellipse cx="1030" cy="84" rx="520" ry="58" fill="#fff0c7" opacity="0.18"/>
      <path d="M0 302 C116 252 214 196 308 236 C394 272 466 138 566 176 C660 212 748 286 852 238 C956 188 1028 210 1124 150 C1234 82 1320 216 1418 158 C1492 114 1548 126 1600 98 V360 H0 Z" fill="#3f536f" opacity="0.72"/>
      <path d="M0 326 C118 286 244 238 372 294 C496 348 594 198 718 234 C832 266 914 342 1026 280 C1138 218 1214 252 1320 204 C1432 152 1516 218 1600 180 V360 H0 Z" fill="#9b5b75" opacity="0.58"/>
      <path d="M0 344 C132 310 242 308 368 324 C520 344 650 286 800 302 C934 316 1020 354 1162 308 C1302 264 1442 310 1600 286 V360 H0 Z" fill="#d47b3d" opacity="0.45"/>
      <path d="M116 286 l70 -98 l70 98 M492 248 l74 -118 l74 118 M1186 232 l116 -142 l116 142" fill="none" stroke="#ffd17a" stroke-width="8" opacity="0.34" stroke-linejoin="round"/>
      <rect y="302" width="1600" height="58" fill="#637d4e" opacity="0.42"/>
      <path d="M0 332 C420 314 740 344 1600 310" fill="none" stroke="#d9b36a" stroke-width="16" opacity="0.18" stroke-linecap="round"/>
    `,
  },
  {
    name: 'environment_desert_road_system',
    width: 1600,
    height: 260,
    body: `
      <rect width="1600" height="260" fill="none"/>
      <rect x="0" y="52" width="1600" height="116" fill="#26343b"/>
      <rect x="0" y="0" width="1600" height="28" fill="#55646d" opacity="0.82"/>
      <rect x="0" y="196" width="1600" height="28" fill="#55646d" opacity="0.82"/>
      <rect x="0" y="28" width="1600" height="24" fill="#374851" opacity="0.68"/>
      <rect x="0" y="168" width="1600" height="28" fill="#374851" opacity="0.68"/>
      <g stroke="#d8c073" stroke-width="4" opacity="0.58" stroke-linecap="round">
        <path d="M52 110 h56 M172 110 h56 M292 110 h56 M412 110 h56 M532 110 h56 M652 110 h56 M772 110 h56 M892 110 h56 M1012 110 h56 M1132 110 h56 M1252 110 h56 M1372 110 h56 M1492 110 h56"/>
      </g>
      <g stroke="#d3a467" stroke-width="3" opacity="0.28" stroke-linecap="round">
        <path d="M660 84 l34 8 M678 96 l18 5 M942 88 l34 8 M960 100 l18 5"/>
      </g>
      <rect x="0" y="224" width="1600" height="36" fill="#2e4a3d" opacity="0.72"/>
    `,
  },
  {
    name: 'environment_vegetation_cluster',
    width: 128,
    height: 128,
    body: `
      <rect width="128" height="128" fill="none"/>
      <ellipse cx="66" cy="112" rx="46" ry="9" fill="#17221f" opacity="0.28"/>
      <g filter="url(#softShadow)">
        <rect x="58" y="28" width="12" height="72" rx="6" fill="#4f9c75"/>
        <rect x="38" y="54" width="24" height="10" rx="5" fill="#4f9c75"/>
        <rect x="68" y="44" width="24" height="10" rx="5" fill="#4f9c75"/>
        <ellipse cx="32" cy="94" rx="18" ry="12" fill="#7fb069"/>
        <ellipse cx="50" cy="88" rx="16" ry="11" fill="#8bbf65"/>
        <ellipse cx="86" cy="92" rx="19" ry="13" fill="#6f9d58"/>
        <path d="M18 104 C34 86 50 86 64 104 C78 88 94 88 112 104" fill="none" stroke="#d9b36a" stroke-width="5" stroke-linecap="round"/>
        <path d="M20 78 l18 14 m72 -20 l-18 18" stroke="#d08b62" stroke-width="5" stroke-linecap="round"/>
      </g>
    `,
  },
  {
    name: 'environment_ecology_patch',
    width: 164,
    height: 112,
    body: `
      <rect width="164" height="112" fill="none"/>
      <ellipse cx="82" cy="84" rx="66" ry="22" fill="#17221f" opacity="0.2"/>
      <path d="M24 78 C50 62 112 62 140 78" fill="none" stroke="#8ed6c9" stroke-width="8" opacity="0.62" stroke-linecap="round"/>
      <ellipse cx="48" cy="56" rx="22" ry="15" fill="#7fb069"/>
      <ellipse cx="76" cy="48" rx="18" ry="13" fill="#8bbf65"/>
      <rect x="102" y="28" width="11" height="56" rx="6" fill="#4f9c75"/>
      <rect x="86" y="52" width="20" height="8" rx="4" fill="#4f9c75"/>
      <rect x="112" y="42" width="20" height="8" rx="4" fill="#4f9c75"/>
      <path d="M28 88 h110" stroke="#d9b36a" stroke-width="5" opacity="0.45" stroke-linecap="round"/>
    `,
  },
  {
    name: 'ui_npc_cue_wrench',
    width: 48,
    height: 48,
    body: `
      <rect width="48" height="48" fill="none"/>
      <circle cx="24" cy="24" r="15" fill="#f2c46d" stroke="#203029" stroke-width="4"/>
      <path d="M17 31 l14 -14" stroke="#203029" stroke-width="5" stroke-linecap="round"/>
      <circle cx="33" cy="15" r="5" fill="none" stroke="#203029" stroke-width="4"/>
    `,
  },
  {
    name: 'ui_npc_cue_heart',
    width: 48,
    height: 48,
    body: `
      <rect width="48" height="48" fill="none"/>
      <circle cx="24" cy="24" r="15" fill="#f09d72" stroke="#203029" stroke-width="4"/>
      <path d="M16 22 C16 15 24 15 24 22 C24 15 32 15 32 22 C32 29 24 34 24 34 C24 34 16 29 16 22Z" fill="#fff0c7"/>
    `,
  },
  {
    name: 'ui_npc_cue_star',
    width: 48,
    height: 48,
    body: `
      <rect width="48" height="48" fill="none"/>
      <circle cx="24" cy="24" r="15" fill="#bec8ff" stroke="#203029" stroke-width="4"/>
      <path d="M24 12 l4 8 h9 l-7 6 l3 9 l-9 -5 l-9 5 l3 -9 l-7 -6 h9z" fill="#fff0c7" stroke="#203029" stroke-width="2" stroke-linejoin="round"/>
    `,
  },
  {
    name: 'ui_map_frame',
    width: 410,
    height: 184,
    body: `
      <rect width="410" height="184" fill="none"/>
      <rect x="4" y="4" width="402" height="176" rx="12" fill="#203029" opacity="0.92" stroke="#f2c46d" stroke-width="3"/>
      <rect x="18" y="52" width="316" height="74" rx="10" fill="#16201d" opacity="0.72"/>
      <path d="M28 118 C84 80 128 82 178 112 C230 142 268 82 324 66" fill="none" stroke="#8ed6c9" stroke-width="5" opacity="0.58" stroke-linecap="round"/>
      <rect x="36" y="144" width="116" height="18" rx="9" fill="#d9b36a" opacity="0.24"/>
      <rect x="172" y="144" width="116" height="18" rx="9" fill="#8ed6c9" opacity="0.18"/>
      <circle cx="348" cy="42" r="11" fill="#f2c46d" stroke="#203029" stroke-width="4"/>
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
