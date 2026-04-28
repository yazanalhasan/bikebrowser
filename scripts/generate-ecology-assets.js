/**
 * Ecology Asset Pack — placeholder generator.
 *
 * Renders 26 SVG silhouettes into 128x128 PNGs with transparent
 * backgrounds via `sharp`. One asset per file, centered, no labels.
 *
 * Output: public/assets/ecology/{plants,animals,terrain}/*.png
 *
 * Style: flat-color desert palette, recognizable silhouette per
 * species/feature. Production-shaped placeholders pending real art.
 *
 * Default mode is additive: files already present on disk are skipped
 * so the existing committed pack stays byte-identical. Pass `--force`
 * to regenerate everything from scratch.
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'public', 'assets', 'ecology');

const SIZE = 128;

// ── Desert palette ──────────────────────────────────────────────────────────
const C = {
  // greens
  cactusGreen: '#4f7d3a',
  cactusGreenDk: '#3a5e2a',
  cactusGreenLt: '#6b9a4a',
  bushGreen: '#5a7a3a',
  bushGreenDk: '#3f5a26',
  agaveGreen: '#7a9a55',
  juniperGreen: '#456b3a',
  // browns / tans
  trunkBrown: '#5a3a22',
  trunkBrownLt: '#7a5236',
  sandTan: '#d9b97a',
  sandTanDk: '#bf9a5c',
  sandTanLt: '#ecd398',
  rockGray: '#8a8275',
  rockGrayDk: '#5e574b',
  rockGrayLt: '#a89e8a',
  groundBrown: '#a3855a',
  groundBrownDk: '#7e6442',
  // animals
  furGray: '#6e6359',
  furGrayDk: '#4a423a',
  furBrown: '#7a5a3a',
  furLight: '#c9b48a',
  birdBrown: '#8a6a44',
  birdTan: '#c9a878',
  reptileOrange: '#b8693a',
  reptileBlack: '#2a2420',
  // accents
  flowerYellow: '#e8c14a',
  flowerPurple: '#7a4a8a',
  flowerWhite: '#f0e6c8',
  cactusFlowerPink: '#c97a8a',
};

// ── SVG builder helpers ─────────────────────────────────────────────────────

function svg(content) {
  // ViewBox 128x128, no background rect (so transparent output).
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
${content}
</svg>`;
}

// ── Plant SVGs ──────────────────────────────────────────────────────────────

function creosote() {
  // Small green bush silhouette: cluster of round leaf clumps.
  return svg(`
    <ellipse cx="64" cy="100" rx="44" ry="10" fill="${C.bushGreenDk}" opacity="0.5"/>
    <circle cx="44" cy="78" r="22" fill="${C.bushGreen}"/>
    <circle cx="84" cy="80" r="24" fill="${C.bushGreen}"/>
    <circle cx="64" cy="60" r="26" fill="${C.bushGreen}"/>
    <circle cx="56" cy="72" r="14" fill="${C.bushGreenDk}" opacity="0.6"/>
    <circle cx="78" cy="70" r="12" fill="${C.bushGreenDk}" opacity="0.55"/>
    <circle cx="48" cy="48" r="6" fill="${C.flowerYellow}"/>
    <circle cx="80" cy="52" r="5" fill="${C.flowerYellow}"/>
    <circle cx="64" cy="40" r="5" fill="${C.flowerYellow}"/>
    <line x1="64" y1="100" x2="60" y2="86" stroke="${C.trunkBrown}" stroke-width="3"/>
    <line x1="64" y1="100" x2="74" y2="84" stroke="${C.trunkBrown}" stroke-width="3"/>
  `);
}

function saguaro() {
  // Tall ribbed cactus silhouette with arms.
  return svg(`
    <ellipse cx="64" cy="118" rx="22" ry="6" fill="${C.cactusGreenDk}" opacity="0.4"/>
    <!-- main column -->
    <rect x="54" y="22" width="20" height="96" rx="10" fill="${C.cactusGreen}"/>
    <!-- ribs -->
    <line x1="60" y1="28" x2="60" y2="112" stroke="${C.cactusGreenDk}" stroke-width="1.5"/>
    <line x1="64" y1="24" x2="64" y2="116" stroke="${C.cactusGreenDk}" stroke-width="1.5"/>
    <line x1="68" y1="28" x2="68" y2="112" stroke="${C.cactusGreenDk}" stroke-width="1.5"/>
    <!-- left arm -->
    <path d="M 54 60 Q 38 60 38 50 L 38 36 Q 38 30 44 30 L 50 30 L 50 56 Z" fill="${C.cactusGreen}"/>
    <line x1="44" y1="36" x2="44" y2="54" stroke="${C.cactusGreenDk}" stroke-width="1.5"/>
    <!-- right arm -->
    <path d="M 74 70 Q 92 70 92 60 L 92 42 Q 92 36 86 36 L 80 36 L 80 66 Z" fill="${C.cactusGreen}"/>
    <line x1="86" y1="42" x2="86" y2="64" stroke="${C.cactusGreenDk}" stroke-width="1.5"/>
    <!-- top highlight -->
    <ellipse cx="64" cy="24" rx="10" ry="4" fill="${C.cactusGreenLt}"/>
    <!-- spines (dots) -->
    <circle cx="58" cy="44" r="0.8" fill="${C.cactusGreenDk}"/>
    <circle cx="66" cy="60" r="0.8" fill="${C.cactusGreenDk}"/>
    <circle cx="62" cy="80" r="0.8" fill="${C.cactusGreenDk}"/>
    <circle cx="70" cy="96" r="0.8" fill="${C.cactusGreenDk}"/>
  `);
}

function mesquite() {
  // Small twisted-trunk tree silhouette with rounded canopy.
  return svg(`
    <ellipse cx="64" cy="116" rx="34" ry="6" fill="${C.trunkBrown}" opacity="0.4"/>
    <!-- trunk (twisted) -->
    <path d="M 60 116 Q 56 92 64 78 Q 70 64 64 50" stroke="${C.trunkBrown}" stroke-width="6" fill="none" stroke-linecap="round"/>
    <path d="M 64 78 Q 76 76 84 70" stroke="${C.trunkBrown}" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path d="M 64 88 Q 50 86 42 78" stroke="${C.trunkBrown}" stroke-width="4" fill="none" stroke-linecap="round"/>
    <!-- canopy clumps -->
    <circle cx="64" cy="46" r="22" fill="${C.bushGreen}"/>
    <circle cx="44" cy="56" r="16" fill="${C.bushGreen}"/>
    <circle cx="86" cy="54" r="18" fill="${C.bushGreen}"/>
    <circle cx="58" cy="34" r="12" fill="${C.bushGreen}"/>
    <circle cx="76" cy="38" r="10" fill="${C.bushGreen}"/>
    <!-- shadow within canopy -->
    <circle cx="68" cy="56" r="10" fill="${C.bushGreenDk}" opacity="0.4"/>
    <circle cx="50" cy="62" r="6" fill="${C.bushGreenDk}" opacity="0.4"/>
  `);
}

function pricklyPear() {
  // Stack of oval pads (paddles) with spines.
  return svg(`
    <ellipse cx="64" cy="118" rx="30" ry="6" fill="${C.cactusGreenDk}" opacity="0.4"/>
    <!-- bottom pads -->
    <ellipse cx="46" cy="92" rx="18" ry="22" fill="${C.cactusGreen}"/>
    <ellipse cx="80" cy="94" rx="18" ry="22" fill="${C.cactusGreen}"/>
    <!-- mid pads -->
    <ellipse cx="60" cy="60" rx="18" ry="22" fill="${C.cactusGreen}" transform="rotate(-15 60 60)"/>
    <ellipse cx="86" cy="58" rx="16" ry="20" fill="${C.cactusGreen}" transform="rotate(15 86 58)"/>
    <!-- top pad -->
    <ellipse cx="68" cy="30" rx="14" ry="18" fill="${C.cactusGreen}"/>
    <!-- spines (dots) -->
    <g fill="${C.cactusGreenDk}">
      <circle cx="46" cy="86" r="0.9"/>
      <circle cx="50" cy="92" r="0.9"/>
      <circle cx="42" cy="96" r="0.9"/>
      <circle cx="80" cy="88" r="0.9"/>
      <circle cx="84" cy="98" r="0.9"/>
      <circle cx="76" cy="92" r="0.9"/>
      <circle cx="60" cy="56" r="0.9"/>
      <circle cx="58" cy="64" r="0.9"/>
      <circle cx="86" cy="56" r="0.9"/>
      <circle cx="68" cy="28" r="0.9"/>
      <circle cx="66" cy="36" r="0.9"/>
    </g>
    <!-- fruit -->
    <ellipse cx="62" cy="16" rx="3" ry="4" fill="${C.cactusFlowerPink}"/>
    <ellipse cx="76" cy="20" rx="3" ry="4" fill="${C.cactusFlowerPink}"/>
  `);
}

function barrelCactus() {
  // Squat ribbed barrel-shaped cactus.
  return svg(`
    <ellipse cx="64" cy="116" rx="34" ry="6" fill="${C.cactusGreenDk}" opacity="0.4"/>
    <!-- main body -->
    <ellipse cx="64" cy="78" rx="34" ry="42" fill="${C.cactusGreen}"/>
    <!-- ribs -->
    <path d="M 38 70 Q 38 100 44 116" stroke="${C.cactusGreenDk}" stroke-width="1.5" fill="none"/>
    <path d="M 50 50 Q 50 96 54 116" stroke="${C.cactusGreenDk}" stroke-width="1.5" fill="none"/>
    <path d="M 64 42 L 64 116" stroke="${C.cactusGreenDk}" stroke-width="1.5"/>
    <path d="M 78 50 Q 78 96 74 116" stroke="${C.cactusGreenDk}" stroke-width="1.5" fill="none"/>
    <path d="M 90 70 Q 90 100 84 116" stroke="${C.cactusGreenDk}" stroke-width="1.5" fill="none"/>
    <!-- top crown highlight -->
    <ellipse cx="64" cy="40" rx="22" ry="6" fill="${C.cactusGreenLt}"/>
    <!-- yellow crown flowers -->
    <circle cx="56" cy="38" r="3.5" fill="${C.flowerYellow}"/>
    <circle cx="64" cy="34" r="4" fill="${C.flowerYellow}"/>
    <circle cx="74" cy="38" r="3.5" fill="${C.flowerYellow}"/>
    <!-- spines -->
    <g fill="${C.reptileBlack}">
      <circle cx="42" cy="78" r="1"/>
      <circle cx="56" cy="86" r="1"/>
      <circle cx="64" cy="74" r="1"/>
      <circle cx="72" cy="86" r="1"/>
      <circle cx="86" cy="78" r="1"/>
      <circle cx="50" cy="100" r="1"/>
      <circle cx="78" cy="100" r="1"/>
    </g>
  `);
}

function jojoba() {
  // Low rounded shrub with paired leaves.
  return svg(`
    <ellipse cx="64" cy="112" rx="44" ry="6" fill="${C.bushGreenDk}" opacity="0.4"/>
    <!-- shrub mass -->
    <ellipse cx="64" cy="78" rx="46" ry="32" fill="${C.bushGreen}"/>
    <ellipse cx="44" cy="68" rx="20" ry="18" fill="${C.bushGreen}"/>
    <ellipse cx="84" cy="70" rx="22" ry="20" fill="${C.bushGreen}"/>
    <!-- darker shadow under -->
    <ellipse cx="64" cy="92" rx="40" ry="14" fill="${C.bushGreenDk}" opacity="0.5"/>
    <!-- paired leaves on top -->
    <g fill="${C.agaveGreen}" stroke="${C.bushGreenDk}" stroke-width="0.8">
      <ellipse cx="50" cy="58" rx="3" ry="6"/>
      <ellipse cx="56" cy="56" rx="3" ry="6"/>
      <ellipse cx="68" cy="50" rx="3" ry="6"/>
      <ellipse cx="74" cy="52" rx="3" ry="6"/>
      <ellipse cx="80" cy="58" rx="3" ry="6"/>
    </g>
    <!-- nut/berry -->
    <circle cx="64" cy="56" r="3" fill="${C.trunkBrown}"/>
    <circle cx="76" cy="62" r="3" fill="${C.trunkBrown}"/>
  `);
}

function agave() {
  // Rosette of pointed sword-leaves radiating from center.
  const leaves = [];
  const cx = 64, cy = 80;
  const N = 12;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2 - Math.PI / 2;
    const len = 44;
    const tipX = cx + Math.cos(a) * len;
    const tipY = cy + Math.sin(a) * len * 0.85;
    const w = 8;
    const px1 = cx + Math.cos(a + Math.PI / 2) * w;
    const py1 = cy + Math.sin(a + Math.PI / 2) * w * 0.85;
    const px2 = cx + Math.cos(a - Math.PI / 2) * w;
    const py2 = cy + Math.sin(a - Math.PI / 2) * w * 0.85;
    leaves.push(
      `<polygon points="${px1.toFixed(1)},${py1.toFixed(1)} ${tipX.toFixed(1)},${tipY.toFixed(1)} ${px2.toFixed(1)},${py2.toFixed(1)}" fill="${C.agaveGreen}" stroke="${C.bushGreenDk}" stroke-width="1"/>`
    );
  }
  return svg(`
    <ellipse cx="64" cy="118" rx="44" ry="5" fill="${C.bushGreenDk}" opacity="0.45"/>
    ${leaves.join('\n')}
    <circle cx="${cx}" cy="${cy}" r="6" fill="${C.bushGreenDk}"/>
    <circle cx="${cx}" cy="${cy}" r="3" fill="${C.flowerYellow}"/>
  `);
}

function yucca() {
  // Tall flowering stalk above a clump of bayonet leaves.
  return svg(`
    <ellipse cx="64" cy="118" rx="40" ry="5" fill="${C.bushGreenDk}" opacity="0.45"/>
    <!-- bayonet leaves -->
    <g fill="${C.agaveGreen}" stroke="${C.bushGreenDk}" stroke-width="1">
      <polygon points="64,90 38,118 36,116 60,86"/>
      <polygon points="64,90 92,118 94,116 68,86"/>
      <polygon points="64,90 50,120 46,118 60,86"/>
      <polygon points="64,90 78,120 82,118 68,86"/>
      <polygon points="64,90 30,108 28,106 60,86"/>
      <polygon points="64,90 100,108 100,106 68,86"/>
      <polygon points="64,90 64,118 62,118 62,86"/>
    </g>
    <!-- central stalk -->
    <rect x="62" y="20" width="4" height="74" fill="${C.trunkBrownLt}"/>
    <!-- flower cluster -->
    <g fill="${C.flowerWhite}" stroke="${C.bushGreenDk}" stroke-width="0.5">
      <circle cx="64" cy="20" r="6"/>
      <circle cx="56" cy="28" r="5"/>
      <circle cx="72" cy="28" r="5"/>
      <circle cx="64" cy="34" r="5"/>
      <circle cx="58" cy="40" r="4"/>
      <circle cx="70" cy="40" r="4"/>
      <circle cx="64" cy="46" r="4"/>
    </g>
  `);
}

function desertLavender() {
  // Loose airy shrub with lavender flower spikes.
  return svg(`
    <ellipse cx="64" cy="112" rx="40" ry="6" fill="${C.bushGreenDk}" opacity="0.4"/>
    <!-- shrub body -->
    <ellipse cx="64" cy="80" rx="36" ry="28" fill="${C.bushGreen}"/>
    <ellipse cx="44" cy="72" rx="16" ry="14" fill="${C.bushGreen}"/>
    <ellipse cx="84" cy="74" rx="18" ry="14" fill="${C.bushGreen}"/>
    <!-- flower spikes -->
    <g stroke="${C.flowerPurple}" stroke-width="2.5" stroke-linecap="round" fill="none">
      <line x1="40" y1="62" x2="36" y2="46"/>
      <line x1="52" y1="56" x2="50" y2="38"/>
      <line x1="64" y1="50" x2="64" y2="32"/>
      <line x1="76" y1="56" x2="78" y2="38"/>
      <line x1="88" y1="62" x2="92" y2="46"/>
    </g>
    <g fill="${C.flowerPurple}">
      <circle cx="36" cy="46" r="2.5"/>
      <circle cx="50" cy="38" r="2.5"/>
      <circle cx="64" cy="32" r="3"/>
      <circle cx="78" cy="38" r="2.5"/>
      <circle cx="92" cy="46" r="2.5"/>
    </g>
    <!-- darker base -->
    <ellipse cx="64" cy="94" rx="32" ry="10" fill="${C.bushGreenDk}" opacity="0.45"/>
  `);
}

function ephedra() {
  // Wispy thin-stem clump (Mormon tea).
  return svg(`
    <ellipse cx="64" cy="116" rx="36" ry="5" fill="${C.bushGreenDk}" opacity="0.4"/>
    <g stroke="${C.agaveGreen}" stroke-width="2" stroke-linecap="round" fill="none">
      <line x1="64" y1="116" x2="40" y2="40"/>
      <line x1="64" y1="116" x2="50" y2="32"/>
      <line x1="64" y1="116" x2="60" y2="24"/>
      <line x1="64" y1="116" x2="72" y2="22"/>
      <line x1="64" y1="116" x2="82" y2="30"/>
      <line x1="64" y1="116" x2="92" y2="42"/>
      <line x1="64" y1="116" x2="100" y2="56"/>
      <line x1="64" y1="116" x2="28" y2="58"/>
      <line x1="64" y1="116" x2="34" y2="78"/>
      <line x1="64" y1="116" x2="96" y2="78"/>
    </g>
    <!-- small horizontal joints -->
    <g stroke="${C.bushGreenDk}" stroke-width="1">
      <line x1="50" y1="60" x2="54" y2="64"/>
      <line x1="62" y1="50" x2="66" y2="54"/>
      <line x1="74" y1="58" x2="78" y2="62"/>
      <line x1="42" y1="80" x2="46" y2="84"/>
      <line x1="84" y1="80" x2="88" y2="84"/>
    </g>
    <!-- tiny cone tips -->
    <g fill="${C.flowerYellow}">
      <circle cx="40" cy="40" r="1.6"/>
      <circle cx="60" cy="24" r="1.6"/>
      <circle cx="82" cy="30" r="1.6"/>
      <circle cx="92" cy="42" r="1.6"/>
    </g>
  `);
}

function paloVerde() {
  // Small flowering desert tree silhouette: yellow-green slender trunk
  // and branching canopy with yellow flower accents.
  return svg(`
    <ellipse cx="64" cy="118" rx="42" ry="6" fill="${C.bushGreenDk}" opacity="0.4"/>
    <!-- pale green trunk (palo verde = "green stick") -->
    <path d="M 64 118 Q 60 96 62 76 Q 64 60 60 44" stroke="${C.agaveGreen}" stroke-width="6" fill="none" stroke-linecap="round"/>
    <path d="M 62 90 Q 80 86 90 76" stroke="${C.agaveGreen}" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path d="M 62 84 Q 44 80 36 70" stroke="${C.agaveGreen}" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path d="M 60 60 Q 80 54 92 46" stroke="${C.agaveGreen}" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M 60 60 Q 40 54 30 46" stroke="${C.agaveGreen}" stroke-width="3" fill="none" stroke-linecap="round"/>
    <!-- airy yellow-green canopy -->
    <ellipse cx="60" cy="42" rx="26" ry="18" fill="${C.cactusGreenLt}" opacity="0.85"/>
    <ellipse cx="40" cy="52" rx="14" ry="10" fill="${C.cactusGreenLt}" opacity="0.85"/>
    <ellipse cx="86" cy="50" rx="16" ry="12" fill="${C.cactusGreenLt}" opacity="0.85"/>
    <ellipse cx="64" cy="30" rx="14" ry="10" fill="${C.cactusGreenLt}" opacity="0.85"/>
    <ellipse cx="64" cy="44" rx="20" ry="10" fill="${C.bushGreen}" opacity="0.5"/>
    <!-- yellow flower accents (palo verde blooms in spring) -->
    <g fill="${C.flowerYellow}">
      <circle cx="46" cy="38" r="2.5"/>
      <circle cx="54" cy="28" r="2.5"/>
      <circle cx="64" cy="22" r="3"/>
      <circle cx="74" cy="28" r="2.5"/>
      <circle cx="82" cy="38" r="2.5"/>
      <circle cx="38" cy="48" r="2"/>
      <circle cx="92" cy="48" r="2"/>
      <circle cx="58" cy="50" r="2"/>
      <circle cx="72" cy="50" r="2"/>
    </g>
  `);
}

function juniper() {
  // Small evergreen tree silhouette, dark green dense conical canopy.
  return svg(`
    <ellipse cx="64" cy="118" rx="36" ry="5" fill="${C.juniperGreen}" opacity="0.5"/>
    <!-- short trunk -->
    <rect x="60" y="98" width="8" height="20" fill="${C.trunkBrown}"/>
    <!-- conical dense evergreen canopy -->
    <ellipse cx="64" cy="92" rx="36" ry="14" fill="${C.juniperGreen}"/>
    <ellipse cx="64" cy="78" rx="32" ry="14" fill="${C.juniperGreen}"/>
    <ellipse cx="64" cy="64" rx="26" ry="14" fill="${C.juniperGreen}"/>
    <ellipse cx="64" cy="50" rx="20" ry="12" fill="${C.juniperGreen}"/>
    <ellipse cx="64" cy="38" rx="14" ry="10" fill="${C.juniperGreen}"/>
    <ellipse cx="64" cy="28" rx="8" ry="8" fill="${C.juniperGreen}"/>
    <!-- darker shadow side -->
    <ellipse cx="74" cy="84" rx="14" ry="20" fill="${C.cactusGreenDk}" opacity="0.45"/>
    <ellipse cx="74" cy="60" rx="10" ry="14" fill="${C.cactusGreenDk}" opacity="0.45"/>
    <!-- small blue-gray berry hints -->
    <g fill="${C.rockGrayLt}" stroke="${C.juniperGreen}" stroke-width="0.5">
      <circle cx="50" cy="78" r="1.5"/>
      <circle cx="78" cy="74" r="1.5"/>
      <circle cx="58" cy="92" r="1.5"/>
      <circle cx="74" cy="98" r="1.5"/>
    </g>
  `);
}

function pinyon() {
  // Small evergreen pine silhouette — rounder, fluffier crown, distinct
  // from juniper's conical shape; slightly lighter green.
  return svg(`
    <ellipse cx="64" cy="118" rx="38" ry="5" fill="${C.juniperGreen}" opacity="0.5"/>
    <!-- trunk (forked) -->
    <path d="M 64 118 L 60 92" stroke="${C.trunkBrown}" stroke-width="6" stroke-linecap="round"/>
    <path d="M 64 110 Q 70 100 74 90" stroke="${C.trunkBrown}" stroke-width="4" fill="none" stroke-linecap="round"/>
    <!-- rounded fluffy needle clumps (pinyon pine crown) -->
    <circle cx="46" cy="78" r="20" fill="${C.cactusGreen}"/>
    <circle cx="82" cy="76" r="22" fill="${C.cactusGreen}"/>
    <circle cx="64" cy="62" r="24" fill="${C.cactusGreen}"/>
    <circle cx="44" cy="58" r="14" fill="${C.cactusGreen}"/>
    <circle cx="86" cy="56" r="16" fill="${C.cactusGreen}"/>
    <circle cx="64" cy="42" r="16" fill="${C.cactusGreen}"/>
    <!-- darker depth -->
    <circle cx="56" cy="74" r="10" fill="${C.cactusGreenDk}" opacity="0.45"/>
    <circle cx="76" cy="68" r="12" fill="${C.cactusGreenDk}" opacity="0.45"/>
    <circle cx="68" cy="56" r="8" fill="${C.cactusGreenDk}" opacity="0.4"/>
    <!-- pine cone hints -->
    <g fill="${C.trunkBrownLt}">
      <ellipse cx="50" cy="68" rx="2" ry="3"/>
      <ellipse cx="78" cy="62" rx="2" ry="3"/>
      <ellipse cx="60" cy="50" rx="2" ry="3"/>
    </g>
  `);
}

// ── Animal SVGs ─────────────────────────────────────────────────────────────

function javelina() {
  // Dark gray pig silhouette, side view.
  return svg(`
    <ellipse cx="64" cy="106" rx="44" ry="6" fill="${C.furGrayDk}" opacity="0.45"/>
    <!-- body -->
    <ellipse cx="60" cy="74" rx="42" ry="22" fill="${C.furGray}"/>
    <!-- shoulder hump -->
    <ellipse cx="46" cy="62" rx="18" ry="12" fill="${C.furGray}"/>
    <!-- head -->
    <ellipse cx="22" cy="72" rx="14" ry="12" fill="${C.furGrayDk}"/>
    <!-- snout -->
    <rect x="6" y="74" width="14" height="8" rx="3" fill="${C.furGrayDk}"/>
    <circle cx="8" cy="78" r="1.5" fill="${C.reptileBlack}"/>
    <!-- ear -->
    <polygon points="22,58 28,52 28,64" fill="${C.furGrayDk}"/>
    <!-- eye -->
    <circle cx="24" cy="68" r="1.4" fill="${C.reptileBlack}"/>
    <!-- legs -->
    <rect x="34" y="90" width="6" height="16" fill="${C.furGrayDk}"/>
    <rect x="50" y="90" width="6" height="16" fill="${C.furGrayDk}"/>
    <rect x="74" y="90" width="6" height="16" fill="${C.furGrayDk}"/>
    <rect x="88" y="90" width="6" height="16" fill="${C.furGrayDk}"/>
    <!-- bristly back -->
    <g stroke="${C.furGrayDk}" stroke-width="1.4">
      <line x1="30" y1="56" x2="30" y2="48"/>
      <line x1="40" y1="54" x2="40" y2="46"/>
      <line x1="52" y1="52" x2="52" y2="44"/>
      <line x1="64" y1="52" x2="64" y2="44"/>
      <line x1="76" y1="54" x2="76" y2="46"/>
      <line x1="88" y1="58" x2="88" y2="50"/>
    </g>
    <!-- light collar band -->
    <path d="M 30 76 Q 38 70 46 76" stroke="${C.furLight}" stroke-width="3" fill="none"/>
    <!-- tail nub -->
    <circle cx="100" cy="68" r="3" fill="${C.furGrayDk}"/>
  `);
}

function rabbit() {
  // Sitting rabbit silhouette, long ears.
  return svg(`
    <ellipse cx="64" cy="116" rx="36" ry="5" fill="${C.furBrown}" opacity="0.4"/>
    <!-- haunches -->
    <ellipse cx="76" cy="92" rx="22" ry="20" fill="${C.furBrown}"/>
    <!-- body -->
    <ellipse cx="60" cy="78" rx="22" ry="22" fill="${C.furBrown}"/>
    <!-- head -->
    <circle cx="46" cy="58" r="14" fill="${C.furBrown}"/>
    <!-- ears -->
    <ellipse cx="40" cy="32" rx="4" ry="14" fill="${C.furBrown}" transform="rotate(-10 40 32)"/>
    <ellipse cx="52" cy="30" rx="4" ry="14" fill="${C.furBrown}" transform="rotate(8 52 30)"/>
    <!-- inner ear -->
    <ellipse cx="40" cy="34" rx="1.5" ry="8" fill="${C.cactusFlowerPink}" transform="rotate(-10 40 34)"/>
    <ellipse cx="52" cy="32" rx="1.5" ry="8" fill="${C.cactusFlowerPink}" transform="rotate(8 52 32)"/>
    <!-- belly -->
    <ellipse cx="58" cy="86" rx="14" ry="10" fill="${C.furLight}"/>
    <!-- eye + nose -->
    <circle cx="40" cy="56" r="1.6" fill="${C.reptileBlack}"/>
    <circle cx="34" cy="62" r="1" fill="${C.reptileBlack}"/>
    <!-- whiskers -->
    <g stroke="${C.reptileBlack}" stroke-width="0.6">
      <line x1="34" y1="62" x2="22" y2="60"/>
      <line x1="34" y1="64" x2="22" y2="66"/>
    </g>
    <!-- front paws -->
    <ellipse cx="50" cy="100" rx="6" ry="4" fill="${C.furBrown}"/>
    <!-- tail -->
    <circle cx="96" cy="86" r="6" fill="${C.furLight}"/>
  `);
}

function kangarooRat() {
  // Small kangaroo rat: big hind legs, long tufted tail.
  return svg(`
    <ellipse cx="64" cy="112" rx="36" ry="5" fill="${C.furBrown}" opacity="0.4"/>
    <!-- tail -->
    <path d="M 90 96 Q 116 80 118 50" stroke="${C.furBrown}" stroke-width="3" fill="none" stroke-linecap="round"/>
    <ellipse cx="118" cy="46" rx="6" ry="4" fill="${C.furLight}" transform="rotate(-30 118 46)"/>
    <!-- haunch -->
    <ellipse cx="80" cy="92" rx="18" ry="14" fill="${C.furBrown}"/>
    <!-- body -->
    <ellipse cx="58" cy="80" rx="20" ry="14" fill="${C.furBrown}"/>
    <!-- head -->
    <ellipse cx="34" cy="74" rx="14" ry="11" fill="${C.furBrown}"/>
    <!-- nose tip -->
    <circle cx="22" cy="76" r="2" fill="${C.reptileBlack}"/>
    <!-- ear -->
    <ellipse cx="36" cy="62" rx="3" ry="6" fill="${C.furBrown}"/>
    <ellipse cx="36" cy="64" rx="1.4" ry="3" fill="${C.cactusFlowerPink}"/>
    <!-- eye -->
    <circle cx="30" cy="70" r="1.6" fill="${C.reptileBlack}"/>
    <!-- whiskers -->
    <g stroke="${C.reptileBlack}" stroke-width="0.5">
      <line x1="22" y1="76" x2="12" y2="74"/>
      <line x1="22" y1="78" x2="12" y2="80"/>
    </g>
    <!-- belly stripe -->
    <ellipse cx="56" cy="86" rx="14" ry="6" fill="${C.furLight}"/>
    <!-- big hind foot -->
    <path d="M 70 96 Q 78 110 92 108 L 92 102 Q 80 100 76 92 Z" fill="${C.furBrown}"/>
    <!-- tiny front leg -->
    <line x1="46" y1="86" x2="44" y2="96" stroke="${C.furBrown}" stroke-width="3" stroke-linecap="round"/>
  `);
}

function coyote() {
  // Coyote standing, side view, pointed ears, bushy tail.
  return svg(`
    <ellipse cx="64" cy="110" rx="50" ry="5" fill="${C.furGrayDk}" opacity="0.4"/>
    <!-- tail -->
    <path d="M 100 76 Q 118 78 118 96" stroke="${C.furGray}" stroke-width="10" fill="none" stroke-linecap="round"/>
    <!-- body -->
    <ellipse cx="64" cy="74" rx="36" ry="14" fill="${C.furGray}"/>
    <!-- chest -->
    <ellipse cx="36" cy="78" rx="10" ry="14" fill="${C.furGray}"/>
    <!-- haunch -->
    <ellipse cx="92" cy="78" rx="12" ry="14" fill="${C.furGray}"/>
    <!-- head -->
    <ellipse cx="22" cy="62" rx="12" ry="10" fill="${C.furGray}"/>
    <!-- snout -->
    <polygon points="6,62 18,60 18,68" fill="${C.furGray}"/>
    <circle cx="6" cy="64" r="1.4" fill="${C.reptileBlack}"/>
    <!-- ears -->
    <polygon points="20,46 24,56 28,52" fill="${C.furGrayDk}"/>
    <polygon points="28,46 32,56 24,54" fill="${C.furGrayDk}"/>
    <!-- eye -->
    <circle cx="20" cy="60" r="1.4" fill="${C.flowerYellow}"/>
    <!-- legs -->
    <rect x="32" y="86" width="5" height="22" fill="${C.furGrayDk}"/>
    <rect x="44" y="86" width="5" height="22" fill="${C.furGrayDk}"/>
    <rect x="78" y="86" width="5" height="22" fill="${C.furGrayDk}"/>
    <rect x="92" y="86" width="5" height="22" fill="${C.furGrayDk}"/>
    <!-- belly -->
    <ellipse cx="64" cy="84" rx="28" ry="6" fill="${C.furLight}"/>
    <!-- back stripe (darker) -->
    <ellipse cx="64" cy="66" rx="32" ry="4" fill="${C.furGrayDk}"/>
  `);
}

function roadrunner() {
  // Roadrunner silhouette: long tail, crest, running pose.
  return svg(`
    <ellipse cx="64" cy="116" rx="36" ry="4" fill="${C.birdBrown}" opacity="0.45"/>
    <!-- long tail -->
    <polygon points="74,80 116,68 118,76 78,90" fill="${C.birdBrown}"/>
    <polygon points="74,80 116,68 118,76 78,90" fill="${C.furGrayDk}" opacity="0.3"/>
    <!-- body -->
    <ellipse cx="62" cy="74" rx="22" ry="14" fill="${C.birdBrown}"/>
    <!-- belly -->
    <ellipse cx="58" cy="82" rx="16" ry="6" fill="${C.birdTan}"/>
    <!-- neck (curved) -->
    <path d="M 46 70 Q 36 56 30 40" stroke="${C.birdBrown}" stroke-width="9" fill="none" stroke-linecap="round"/>
    <!-- head -->
    <ellipse cx="28" cy="36" rx="9" ry="7" fill="${C.birdBrown}"/>
    <!-- crest -->
    <polygon points="28,28 22,16 26,28" fill="${C.furGrayDk}"/>
    <polygon points="32,28 30,16 34,28" fill="${C.furGrayDk}"/>
    <!-- beak -->
    <polygon points="20,36 6,32 20,40" fill="${C.reptileBlack}"/>
    <!-- eye -->
    <circle cx="26" cy="34" r="1.4" fill="${C.flowerYellow}"/>
    <circle cx="26" cy="34" r="0.6" fill="${C.reptileBlack}"/>
    <!-- legs -->
    <line x1="56" y1="86" x2="48" y2="110" stroke="${C.reptileOrange}" stroke-width="3" stroke-linecap="round"/>
    <line x1="68" y1="86" x2="74" y2="108" stroke="${C.reptileOrange}" stroke-width="3" stroke-linecap="round"/>
    <!-- toes -->
    <g stroke="${C.reptileOrange}" stroke-width="2" stroke-linecap="round">
      <line x1="48" y1="110" x2="42" y2="116"/>
      <line x1="48" y1="110" x2="54" y2="116"/>
      <line x1="74" y1="108" x2="80" y2="116"/>
      <line x1="74" y1="108" x2="68" y2="116"/>
    </g>
    <!-- speckles on body -->
    <g fill="${C.furGrayDk}">
      <circle cx="56" cy="68" r="1"/>
      <circle cx="62" cy="74" r="1"/>
      <circle cx="70" cy="70" r="1"/>
      <circle cx="76" cy="76" r="1"/>
    </g>
  `);
}

function quail() {
  // Plump quail with topknot plume.
  return svg(`
    <ellipse cx="64" cy="110" rx="34" ry="4" fill="${C.furGrayDk}" opacity="0.4"/>
    <!-- body -->
    <ellipse cx="64" cy="78" rx="32" ry="26" fill="${C.furGray}"/>
    <!-- belly -->
    <ellipse cx="60" cy="92" rx="22" ry="10" fill="${C.birdTan}"/>
    <!-- head -->
    <circle cx="44" cy="52" r="14" fill="${C.furGrayDk}"/>
    <!-- face mask (dark) -->
    <ellipse cx="40" cy="56" rx="6" ry="5" fill="${C.reptileBlack}"/>
    <!-- eye -->
    <circle cx="38" cy="54" r="1.2" fill="${C.flowerWhite}"/>
    <!-- beak -->
    <polygon points="30,56 22,58 30,62" fill="${C.reptileBlack}"/>
    <!-- topknot plume -->
    <path d="M 44 38 Q 38 26 30 22 Q 36 30 36 38" fill="${C.reptileBlack}"/>
    <!-- white forehead band -->
    <path d="M 38 46 Q 46 42 52 46" stroke="${C.flowerWhite}" stroke-width="2" fill="none"/>
    <!-- chest scales -->
    <g stroke="${C.furGrayDk}" stroke-width="0.6" fill="none">
      <path d="M 50 78 Q 56 82 62 78"/>
      <path d="M 56 86 Q 62 90 68 86"/>
      <path d="M 62 78 Q 68 82 74 78"/>
      <path d="M 68 86 Q 74 90 80 86"/>
    </g>
    <!-- wing -->
    <ellipse cx="78" cy="74" rx="14" ry="10" fill="${C.birdBrown}"/>
    <!-- legs -->
    <line x1="56" y1="102" x2="54" y2="112" stroke="${C.reptileOrange}" stroke-width="2.5"/>
    <line x1="68" y1="102" x2="70" y2="112" stroke="${C.reptileOrange}" stroke-width="2.5"/>
  `);
}

function gilaMonster() {
  // Stocky lizard with beaded black-and-orange pattern.
  return svg(`
    <ellipse cx="64" cy="100" rx="50" ry="5" fill="${C.reptileBlack}" opacity="0.35"/>
    <!-- tail -->
    <ellipse cx="106" cy="80" rx="14" ry="8" fill="${C.reptileOrange}"/>
    <!-- body -->
    <ellipse cx="64" cy="78" rx="38" ry="14" fill="${C.reptileOrange}"/>
    <!-- head -->
    <ellipse cx="22" cy="76" rx="14" ry="10" fill="${C.reptileBlack}"/>
    <!-- snout split -->
    <line x1="8" y1="76" x2="20" y2="76" stroke="${C.reptileOrange}" stroke-width="1.5"/>
    <!-- eye -->
    <circle cx="22" cy="72" r="1.4" fill="${C.flowerYellow}"/>
    <!-- legs (short, splayed) -->
    <ellipse cx="40" cy="92" rx="6" ry="4" fill="${C.reptileBlack}" transform="rotate(20 40 92)"/>
    <ellipse cx="86" cy="92" rx="6" ry="4" fill="${C.reptileBlack}" transform="rotate(-20 86 92)"/>
    <ellipse cx="36" cy="64" rx="6" ry="4" fill="${C.reptileBlack}" transform="rotate(-20 36 64)"/>
    <ellipse cx="86" cy="64" rx="6" ry="4" fill="${C.reptileBlack}" transform="rotate(20 86 64)"/>
    <!-- beaded pattern -->
    <g fill="${C.reptileBlack}">
      <circle cx="40" cy="74" r="2.5"/>
      <circle cx="50" cy="80" r="2.5"/>
      <circle cx="60" cy="74" r="2.5"/>
      <circle cx="70" cy="80" r="2.5"/>
      <circle cx="80" cy="74" r="2.5"/>
      <circle cx="46" cy="70" r="1.8"/>
      <circle cx="56" cy="84" r="1.8"/>
      <circle cx="66" cy="70" r="1.8"/>
      <circle cx="76" cy="84" r="1.8"/>
      <circle cx="100" cy="80" r="2"/>
      <circle cx="108" cy="78" r="2"/>
    </g>
  `);
}

function hawk() {
  // Hawk in flight pose: spread wings, banded tail.
  return svg(`
    <!-- wings spread -->
    <path d="M 64 60 Q 32 40 8 56 Q 24 62 50 70 Z" fill="${C.birdBrown}"/>
    <path d="M 64 60 Q 96 40 120 56 Q 104 62 78 70 Z" fill="${C.birdBrown}"/>
    <!-- wing tip feather slots -->
    <g fill="${C.furGrayDk}">
      <polygon points="16,52 8,56 14,60"/>
      <polygon points="22,48 14,52 20,58"/>
      <polygon points="112,52 120,56 114,60"/>
      <polygon points="106,48 114,52 108,58"/>
    </g>
    <!-- body -->
    <ellipse cx="64" cy="68" rx="10" ry="20" fill="${C.birdBrown}"/>
    <!-- belly -->
    <ellipse cx="64" cy="72" rx="6" ry="14" fill="${C.birdTan}"/>
    <!-- head -->
    <circle cx="64" cy="44" r="9" fill="${C.furGrayDk}"/>
    <!-- beak -->
    <polygon points="62,52 64,58 66,52" fill="${C.flowerYellow}"/>
    <!-- eye -->
    <circle cx="60" cy="42" r="1.4" fill="${C.flowerYellow}"/>
    <!-- tail -->
    <polygon points="56,86 64,108 72,86" fill="${C.birdBrown}"/>
    <line x1="58" y1="92" x2="70" y2="92" stroke="${C.furGrayDk}" stroke-width="1.2"/>
    <line x1="58" y1="98" x2="70" y2="98" stroke="${C.furGrayDk}" stroke-width="1.2"/>
    <line x1="58" y1="104" x2="70" y2="104" stroke="${C.furGrayDk}" stroke-width="1.2"/>
    <!-- belly streaks -->
    <g stroke="${C.furGrayDk}" stroke-width="1">
      <line x1="62" y1="68" x2="62" y2="78"/>
      <line x1="66" y1="68" x2="66" y2="78"/>
      <line x1="64" y1="62" x2="64" y2="72"/>
    </g>
  `);
}

function elk() {
  // Large mammal silhouette in dark brown, antlers visible, side view.
  return svg(`
    <ellipse cx="64" cy="116" rx="50" ry="5" fill="${C.furGrayDk}" opacity="0.45"/>
    <!-- antlers (branched rack above the head) -->
    <g stroke="${C.trunkBrownLt}" stroke-width="2.5" stroke-linecap="round" fill="none">
      <path d="M 26 30 L 22 14"/>
      <path d="M 26 30 L 14 18"/>
      <path d="M 26 30 L 30 12"/>
      <path d="M 26 30 L 38 16"/>
      <path d="M 26 30 L 8 28"/>
      <path d="M 26 30 L 44 26"/>
    </g>
    <!-- main beam tips (small knobs) -->
    <g fill="${C.trunkBrownLt}">
      <circle cx="22" cy="14" r="1.6"/>
      <circle cx="14" cy="18" r="1.6"/>
      <circle cx="30" cy="12" r="1.6"/>
      <circle cx="38" cy="16" r="1.6"/>
      <circle cx="8" cy="28" r="1.6"/>
      <circle cx="44" cy="26" r="1.6"/>
    </g>
    <!-- body -->
    <ellipse cx="72" cy="68" rx="40" ry="20" fill="${C.furBrown}"/>
    <!-- shoulder hump -->
    <ellipse cx="56" cy="58" rx="14" ry="12" fill="${C.furBrown}"/>
    <!-- haunch -->
    <ellipse cx="98" cy="68" rx="14" ry="16" fill="${C.furBrown}"/>
    <!-- neck -->
    <path d="M 36 60 Q 30 48 28 38" stroke="${C.furBrown}" stroke-width="14" fill="none" stroke-linecap="round"/>
    <!-- head -->
    <ellipse cx="26" cy="40" rx="10" ry="8" fill="${C.furBrown}"/>
    <!-- muzzle -->
    <ellipse cx="14" cy="44" rx="8" ry="5" fill="${C.furGrayDk}"/>
    <!-- ear -->
    <polygon points="34,32 38,24 36,34" fill="${C.furGrayDk}"/>
    <!-- eye -->
    <circle cx="24" cy="38" r="1.4" fill="${C.reptileBlack}"/>
    <!-- nose -->
    <circle cx="8" cy="44" r="1.4" fill="${C.reptileBlack}"/>
    <!-- light rump patch (elk are known for this) -->
    <ellipse cx="106" cy="64" rx="8" ry="10" fill="${C.furLight}" opacity="0.85"/>
    <!-- legs -->
    <rect x="46" y="84" width="5" height="28" fill="${C.furGrayDk}"/>
    <rect x="58" y="84" width="5" height="28" fill="${C.furGrayDk}"/>
    <rect x="92" y="84" width="5" height="28" fill="${C.furGrayDk}"/>
    <rect x="104" y="84" width="5" height="28" fill="${C.furGrayDk}"/>
    <!-- hooves -->
    <g fill="${C.reptileBlack}">
      <rect x="46" y="110" width="5" height="3"/>
      <rect x="58" y="110" width="5" height="3"/>
      <rect x="92" y="110" width="5" height="3"/>
      <rect x="104" y="110" width="5" height="3"/>
    </g>
    <!-- short tail -->
    <ellipse cx="112" cy="58" rx="3" ry="4" fill="${C.furLight}"/>
  `);
}

// ── Terrain SVGs ────────────────────────────────────────────────────────────

function sand() {
  // Tan textured tile: subtle dunes + speckles.
  const speckles = [];
  // Deterministic pseudo-random scatter (Mulberry32-style).
  let s = 0xdeadbeef;
  function rnd() {
    s |= 0;
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  for (let i = 0; i < 80; i++) {
    const x = (rnd() * 124 + 2).toFixed(1);
    const y = (rnd() * 124 + 2).toFixed(1);
    const r = (0.5 + rnd() * 1.4).toFixed(1);
    const c = rnd() > 0.5 ? C.sandTanDk : C.sandTanLt;
    speckles.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" opacity="0.7"/>`);
  }
  return svg(`
    <rect x="0" y="0" width="128" height="128" fill="${C.sandTan}"/>
    <!-- gentle dune curves -->
    <path d="M 0 36 Q 32 28 64 36 T 128 36" stroke="${C.sandTanLt}" stroke-width="2" fill="none" opacity="0.6"/>
    <path d="M 0 70 Q 40 62 80 70 T 128 70" stroke="${C.sandTanDk}" stroke-width="2" fill="none" opacity="0.5"/>
    <path d="M 0 100 Q 36 92 72 100 T 128 100" stroke="${C.sandTanLt}" stroke-width="2" fill="none" opacity="0.6"/>
    ${speckles.join('\n')}
  `);
}

function dryWash() {
  // Dry creek-bed: pale-gray stones in a winding band over tan.
  return svg(`
    <rect x="0" y="0" width="128" height="128" fill="${C.sandTan}"/>
    <!-- wash band (lighter) -->
    <path d="M 0 40 Q 30 60 64 56 Q 100 50 128 80 L 128 96 Q 96 80 64 84 Q 30 88 0 60 Z" fill="${C.sandTanLt}"/>
    <!-- darker meander shadow -->
    <path d="M 0 50 Q 30 66 64 62 Q 100 58 128 84" stroke="${C.sandTanDk}" stroke-width="1.5" fill="none" opacity="0.6"/>
    <!-- pebbles scattered in wash -->
    <g fill="${C.rockGrayLt}" stroke="${C.rockGrayDk}" stroke-width="0.5">
      <ellipse cx="20" cy="56" rx="4" ry="3"/>
      <ellipse cx="36" cy="52" rx="3" ry="2.5"/>
      <ellipse cx="48" cy="62" rx="5" ry="3.5"/>
      <ellipse cx="62" cy="56" rx="4" ry="3"/>
      <ellipse cx="78" cy="64" rx="3.5" ry="2.5"/>
      <ellipse cx="92" cy="62" rx="4.5" ry="3"/>
      <ellipse cx="108" cy="74" rx="4" ry="3"/>
      <ellipse cx="118" cy="86" rx="3" ry="2.5"/>
      <ellipse cx="28" cy="68" rx="3" ry="2"/>
      <ellipse cx="56" cy="74" rx="3.5" ry="2.5"/>
      <ellipse cx="86" cy="76" rx="3" ry="2"/>
    </g>
    <!-- a few twig hints -->
    <g stroke="${C.trunkBrown}" stroke-width="1" stroke-linecap="round">
      <line x1="16" y1="74" x2="22" y2="78"/>
      <line x1="98" y1="92" x2="106" y2="96"/>
    </g>
  `);
}

function rock() {
  // Single gray boulder silhouette.
  return svg(`
    <ellipse cx="64" cy="116" rx="46" ry="6" fill="${C.rockGrayDk}" opacity="0.45"/>
    <!-- main boulder -->
    <path d="M 16 92 Q 12 70 28 56 Q 38 42 56 40 Q 78 38 96 50 Q 116 64 114 86 Q 112 104 92 110 Q 56 116 28 110 Q 16 106 16 92 Z" fill="${C.rockGray}"/>
    <!-- highlight facet -->
    <path d="M 30 64 Q 50 50 72 50 Q 60 60 50 70 Q 40 76 30 76 Z" fill="${C.rockGrayLt}"/>
    <!-- shadow facet -->
    <path d="M 80 96 Q 100 96 110 86 Q 102 102 90 108 Q 76 110 70 102 Z" fill="${C.rockGrayDk}"/>
    <!-- crack lines -->
    <g stroke="${C.rockGrayDk}" stroke-width="1.2" fill="none">
      <path d="M 50 70 Q 56 84 60 96"/>
      <path d="M 78 60 Q 84 76 86 92"/>
    </g>
    <!-- speckles -->
    <g fill="${C.rockGrayDk}" opacity="0.6">
      <circle cx="36" cy="80" r="1"/>
      <circle cx="48" cy="58" r="1"/>
      <circle cx="64" cy="74" r="1"/>
      <circle cx="84" cy="68" r="1"/>
      <circle cx="96" cy="82" r="1"/>
      <circle cx="74" cy="92" r="1"/>
    </g>
  `);
}

function desertGround() {
  // Generic warm-brown desert dirt tile.
  const debris = [];
  let s = 0x1bad5eed;
  function rnd() {
    s |= 0;
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  for (let i = 0; i < 50; i++) {
    const x = (rnd() * 124 + 2).toFixed(1);
    const y = (rnd() * 124 + 2).toFixed(1);
    const r = (0.6 + rnd() * 1.6).toFixed(1);
    const c = rnd() > 0.5 ? C.groundBrownDk : C.sandTan;
    debris.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" opacity="0.7"/>`);
  }
  // a few tiny pebbles
  for (let i = 0; i < 12; i++) {
    const x = (rnd() * 120 + 4).toFixed(1);
    const y = (rnd() * 120 + 4).toFixed(1);
    debris.push(`<ellipse cx="${x}" cy="${y}" rx="2.4" ry="1.6" fill="${C.rockGrayLt}" stroke="${C.rockGrayDk}" stroke-width="0.4"/>`);
  }
  return svg(`
    <rect x="0" y="0" width="128" height="128" fill="${C.groundBrown}"/>
    <!-- soft mottling -->
    <ellipse cx="32" cy="40" rx="28" ry="18" fill="${C.groundBrownDk}" opacity="0.3"/>
    <ellipse cx="92" cy="80" rx="32" ry="22" fill="${C.groundBrownDk}" opacity="0.3"/>
    <ellipse cx="60" cy="100" rx="30" ry="16" fill="${C.sandTan}" opacity="0.25"/>
    ${debris.join('\n')}
  `);
}

// ── Generation table ────────────────────────────────────────────────────────

const ASSETS = [
  { kind: 'plants',  key: 'creosote',         build: creosote },
  { kind: 'plants',  key: 'saguaro',          build: saguaro },
  { kind: 'plants',  key: 'mesquite',         build: mesquite },
  { kind: 'plants',  key: 'prickly_pear',     build: pricklyPear },
  { kind: 'plants',  key: 'barrel_cactus',    build: barrelCactus },
  { kind: 'plants',  key: 'jojoba',           build: jojoba },
  { kind: 'plants',  key: 'agave',            build: agave },
  { kind: 'plants',  key: 'yucca',            build: yucca },
  { kind: 'plants',  key: 'desert_lavender',  build: desertLavender },
  { kind: 'plants',  key: 'ephedra',          build: ephedra },
  { kind: 'plants',  key: 'palo_verde',       build: paloVerde },
  { kind: 'plants',  key: 'juniper',          build: juniper },
  { kind: 'plants',  key: 'pinyon',           build: pinyon },
  { kind: 'animals', key: 'javelina',         build: javelina },
  { kind: 'animals', key: 'rabbit',           build: rabbit },
  { kind: 'animals', key: 'kangaroo_rat',     build: kangarooRat },
  { kind: 'animals', key: 'coyote',           build: coyote },
  { kind: 'animals', key: 'roadrunner',       build: roadrunner },
  { kind: 'animals', key: 'quail',            build: quail },
  { kind: 'animals', key: 'gila_monster',     build: gilaMonster },
  { kind: 'animals', key: 'hawk',             build: hawk },
  { kind: 'animals', key: 'elk',              build: elk },
  { kind: 'terrain', key: 'sand',             build: sand },
  { kind: 'terrain', key: 'dry_wash',         build: dryWash },
  { kind: 'terrain', key: 'rock',             build: rock },
  { kind: 'terrain', key: 'desert_ground',    build: desertGround },
];

async function main() {
  // CLI flag: --force regenerates everything; default is "additive only"
  // mode where files already on disk are skipped (so the original 22-asset
  // pack stays byte-identical when later additions are appended).
  const force = process.argv.includes('--force');

  let made = 0;
  let skipped = 0;
  let failures = [];
  for (const asset of ASSETS) {
    const dir = path.join(OUT_DIR, asset.kind);
    fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, `${asset.key}.png`);
    if (!force && fs.existsSync(filePath)) {
      skipped++;
      console.log(`  skip ${asset.kind}/${asset.key}.png (already exists)`);
      continue;
    }
    try {
      const svgString = asset.build();
      const buf = Buffer.from(svgString, 'utf8');
      await sharp(buf, { density: 96 })
        .resize(SIZE, SIZE, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png({ compressionLevel: 9 })
        .toFile(filePath);
      // Verify
      const meta = await sharp(filePath).metadata();
      if (meta.width !== SIZE || meta.height !== SIZE) {
        throw new Error(`size ${meta.width}x${meta.height} (expected ${SIZE}x${SIZE})`);
      }
      if (!meta.hasAlpha) {
        throw new Error('missing alpha channel');
      }
      made++;
      console.log(`  ok   ${asset.kind}/${asset.key}.png  (${meta.width}x${meta.height} alpha=${meta.hasAlpha})`);
    } catch (err) {
      failures.push({ asset, err: err.message });
      console.error(`  FAIL ${asset.kind}/${asset.key}.png — ${err.message}`);
    }
  }

  console.log(`\nGenerated ${made}, skipped ${skipped} (already on disk), of ${ASSETS.length} assets.`);
  if (failures.length) {
    console.error('\nFailures:');
    failures.forEach((f) => console.error(`  - ${f.asset.kind}/${f.asset.key}: ${f.err}`));
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
