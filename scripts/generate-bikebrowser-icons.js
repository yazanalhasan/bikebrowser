const fs = require('fs/promises');
const path = require('path');
const sharp = require('sharp');

const OUTPUT_DIR = path.join(__dirname, '..', 'assets', 'icons');
const APP_ICON_PNG = path.join(__dirname, '..', 'assets', 'icon.png');
const APP_ICON_SVG = path.join(__dirname, '..', 'assets', 'icon.svg');
const SIZE = 1024;

function gearPath(cx, cy, innerRadius, outerRadius, teeth) {
  const points = [];
  const totalPoints = teeth * 2;

  for (let index = 0; index < totalPoints; index += 1) {
    const angle = (-Math.PI / 2) + (index * Math.PI / teeth);
    const radius = index % 2 === 0 ? outerRadius : innerRadius;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    points.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }

  return points.join(' ');
}

function shieldPath() {
  return [
    'M512 118',
    'C646 118 770 188 814 302',
    'L814 468',
    'C814 640 702 794 512 902',
    'C322 794 210 640 210 468',
    'L210 302',
    'C254 188 378 118 512 118',
    'Z'
  ].join(' ');
}

function bikeGroup(config) {
  const wheelGlow = config.wheelGlow || config.accent;
  const electricBolt = config.boltColor || '#ffffff';
  const flame = config.flameColor || config.accent;
  const bodyShadow = config.bodyShadow || '#09111c';

  const accentOverlay = (() => {
    if (config.accentMode === 'electric') {
      return `
        <path d="M526 388 L472 506 H536 L488 636 L636 470 H552 L608 388 Z"
          fill="${electricBolt}" stroke="#09203b" stroke-width="18" stroke-linejoin="round" filter="url(#softGlow)" />
        <path d="M308 382 C266 360 236 364 198 390" stroke="${config.accent}" stroke-width="22" stroke-linecap="round" opacity="0.9" filter="url(#softGlow)" />
        <path d="M722 320 C768 288 810 284 852 306" stroke="${config.secondary}" stroke-width="18" stroke-linecap="round" opacity="0.85" filter="url(#softGlow)" />
      `;
    }

    if (config.accentMode === 'flame') {
      return `
        <path d="M202 544 C146 528 122 492 136 454 C166 470 194 458 212 422 C238 446 244 488 232 530 Z"
          fill="${flame}" opacity="0.94" filter="url(#softGlow)" />
        <path d="M808 306 C840 292 872 298 898 326" stroke="${config.secondary}" stroke-width="18" stroke-linecap="round" opacity="0.8" />
      `;
    }

    if (config.accentMode === 'minimal') {
      return `
        <path d="M440 414 H598" stroke="${config.accent}" stroke-width="18" stroke-linecap="round" opacity="0.9" />
      `;
    }

    return `
      <circle cx="786" cy="274" r="44" fill="${config.secondary}" opacity="0.94" />
      <path d="M784 248 L794 268 L818 272 L800 288 L804 312 L784 300 L764 312 L768 288 L750 272 L774 268 Z"
        fill="#ffffff" opacity="0.96" />
    `;
  })();

  return `
    <g transform="translate(0 12)">
      ${accentOverlay}

      <g opacity="0.95">
        <circle cx="314" cy="694" r="128" fill="#0a1017" stroke="${wheelGlow}" stroke-width="20" filter="url(#softGlow)" />
        <circle cx="314" cy="694" r="64" fill="#1f2d3f" stroke="#ffffff" stroke-width="16" />
        <circle cx="710" cy="694" r="128" fill="#0a1017" stroke="${wheelGlow}" stroke-width="20" filter="url(#softGlow)" />
        <circle cx="710" cy="694" r="64" fill="#1f2d3f" stroke="#ffffff" stroke-width="16" />
      </g>

      <path d="M228 616 C252 570 296 538 344 534" stroke="${config.primary}" stroke-width="34" stroke-linecap="round" opacity="0.85" />
      <path d="M618 526 C674 528 726 560 778 624" stroke="${config.primary}" stroke-width="34" stroke-linecap="round" opacity="0.85" />

      <path d="M360 592 L432 454 L556 454 L646 548 L710 694" fill="none" stroke="${bodyShadow}" stroke-width="54" stroke-linecap="round" stroke-linejoin="round" opacity="0.9" />
      <path d="M360 592 L432 454 L556 454 L646 548 L710 694" fill="none" stroke="${config.primary}" stroke-width="36" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M360 592 L314 694" fill="none" stroke="${config.primary}" stroke-width="36" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M646 548 L710 694" fill="none" stroke="${config.primary}" stroke-width="36" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M504 454 L580 378 L692 378" fill="none" stroke="${config.primary}" stroke-width="32" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M694 378 L754 332" fill="none" stroke="${config.primary}" stroke-width="24" stroke-linecap="round" />
      <path d="M752 330 L782 342" fill="none" stroke="${config.primary}" stroke-width="20" stroke-linecap="round" />

      <rect x="410" y="396" width="216" height="112" rx="56" fill="${config.primary}" stroke="#ffffff" stroke-width="18" filter="url(#softGlow)" />
      <rect x="444" y="362" width="126" height="44" rx="22" fill="${config.secondary}" stroke="#ffffff" stroke-width="14" />
      <path d="M354 604 L482 604" stroke="${config.secondary}" stroke-width="22" stroke-linecap="round" />
      <path d="M586 530 L684 530" stroke="${config.secondary}" stroke-width="22" stroke-linecap="round" />
      <path d="M370 592 C398 552 434 528 472 520" stroke="#ffffff" stroke-width="14" stroke-linecap="round" opacity="0.95" />
      <path d="M620 540 C650 556 678 586 696 626" stroke="#ffffff" stroke-width="14" stroke-linecap="round" opacity="0.85" />

      <path d="M238 532 C266 500 294 484 330 478" stroke="${config.secondary}" stroke-width="24" stroke-linecap="round" opacity="0.88" />
      <path d="M636 480 C670 470 706 472 744 492" stroke="${config.secondary}" stroke-width="24" stroke-linecap="round" opacity="0.88" />
    </g>
  `;
}

function svgFor(config, backgroundMode) {
  const isTransparent = backgroundMode === 'transparent';
  const backgroundBlock = isTransparent
    ? ''
    : `<rect x="0" y="0" width="1024" height="1024" rx="232" fill="url(#backgroundGradient)" />`;

  const outerRing = config.outerRing || '#ffffff';

  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 1024 1024" fill="none">
    <defs>
      <linearGradient id="backgroundGradient" x1="96" y1="64" x2="904" y2="960" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="${config.bgStart}"/>
        <stop offset="100%" stop-color="${config.bgEnd}"/>
      </linearGradient>
      <linearGradient id="shieldGradient" x1="300" y1="180" x2="780" y2="840" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="${config.shieldStart}"/>
        <stop offset="100%" stop-color="${config.shieldEnd}"/>
      </linearGradient>
      <filter id="softGlow" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="12" result="blur"/>
        <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.65 0" result="glow"/>
        <feBlend in="SourceGraphic" in2="glow" mode="screen"/>
      </filter>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="20" stdDeviation="22" flood-color="#000000" flood-opacity="0.34"/>
      </filter>
    </defs>

    ${backgroundBlock}

    <g filter="url(#shadow)">
      <path d="${shieldPath()}" fill="url(#shieldGradient)" stroke="${outerRing}" stroke-width="28" />
      <path d="${shieldPath()}" fill="none" stroke="${config.primary}" stroke-width="10" opacity="0.8" />
    </g>

    <g filter="url(#shadow)" opacity="0.95">
      <polygon points="${gearPath(config.gearX, config.gearY, 72, 112, 10)}" fill="${config.gearFill}" stroke="${config.gearStroke}" stroke-width="20" />
      <circle cx="${config.gearX}" cy="${config.gearY}" r="52" fill="${config.gearInner}" stroke="#ffffff" stroke-width="16" />
      <circle cx="${config.gearX}" cy="${config.gearY}" r="16" fill="#ffffff" opacity="0.95" />
    </g>

    ${bikeGroup(config)}

    <path d="M286 204 C382 154 638 154 734 204" stroke="#ffffff" stroke-width="14" stroke-linecap="round" opacity="0.35" />
  </svg>`;
}

const variations = [
  {
    id: 'electric-focused',
    label: 'Electric Focused',
    primary: '#00C2FF',
    secondary: '#39FF14',
    accent: '#8EF7FF',
    bgStart: '#10203F',
    bgEnd: '#02060C',
    shieldStart: '#183D7A',
    shieldEnd: '#09111D',
    gearFill: '#39FF14',
    gearStroke: '#09203B',
    gearInner: '#114C4D',
    gearX: 760,
    gearY: 762,
    boltColor: '#FFFFFF',
    accentMode: 'electric',
    outerRing: '#A4F6FF'
  },
  {
    id: 'dirt-bike-rugged',
    label: 'Dirt Bike Rugged',
    primary: '#FF7A00',
    secondary: '#FF4F2E',
    accent: '#FFC542',
    bgStart: '#301106',
    bgEnd: '#080402',
    shieldStart: '#7A2C0E',
    shieldEnd: '#220B05',
    gearFill: '#FFB21E',
    gearStroke: '#3B1407',
    gearInner: '#6A260E',
    gearX: 768,
    gearY: 758,
    flameColor: '#FF5A24',
    accentMode: 'flame',
    outerRing: '#FFD59A'
  },
  {
    id: 'clean-minimal',
    label: 'Clean Minimal',
    primary: '#00C2FF',
    secondary: '#FFFFFF',
    accent: '#39FF14',
    bgStart: '#18263D',
    bgEnd: '#050910',
    shieldStart: '#27486F',
    shieldEnd: '#0B1322',
    gearFill: '#11243A',
    gearStroke: '#8BD9FF',
    gearInner: '#00C2FF',
    gearX: 770,
    gearY: 766,
    accentMode: 'minimal',
    outerRing: '#F2FAFF',
    wheelGlow: '#8BD9FF'
  },
  {
    id: 'game-badge',
    label: 'Game Badge',
    primary: '#00C2FF',
    secondary: '#FF7A00',
    accent: '#39FF14',
    bgStart: '#121A35',
    bgEnd: '#02050B',
    shieldStart: '#20467E',
    shieldEnd: '#0A1224',
    gearFill: '#FF7A00',
    gearStroke: '#341402',
    gearInner: '#8B3600',
    gearX: 246,
    gearY: 292,
    accentMode: 'badge',
    outerRing: '#E4F6FF'
  }
];

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function writeVariantAssets(config) {
  const outputs = [];

  for (const mode of ['solid', 'transparent']) {
    const svg = svgFor(config, mode);
    const svgName = `${config.id}-${mode}.svg`;
    const pngName = `${config.id}-${mode}.png`;
    const svgPath = path.join(OUTPUT_DIR, svgName);
    const pngPath = path.join(OUTPUT_DIR, pngName);

    await fs.writeFile(svgPath, svg, 'utf8');
    await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).resize(SIZE, SIZE).toFile(pngPath);

    outputs.push({ svgPath, pngPath });
  }

  return outputs;
}

async function main() {
  await ensureDir(OUTPUT_DIR);
  const generated = [];

  for (const variation of variations) {
    const outputs = await writeVariantAssets(variation);
    generated.push({ variation: variation.id, outputs });
  }

  const primary = variations.find((variation) => variation.id === 'game-badge');
  const primarySolidSvg = svgFor(primary, 'solid');
  await fs.writeFile(APP_ICON_SVG, primarySolidSvg, 'utf8');
  await sharp(Buffer.from(primarySolidSvg)).png({ compressionLevel: 9 }).resize(SIZE, SIZE).toFile(APP_ICON_PNG);

  const manifest = {
    generatedAt: new Date().toISOString(),
    defaultAppIcon: {
      svg: path.relative(path.join(__dirname, '..'), APP_ICON_SVG).replace(/\\/g, '/'),
      png: path.relative(path.join(__dirname, '..'), APP_ICON_PNG).replace(/\\/g, '/')
    },
    variations: generated.map((entry) => ({
      variation: entry.variation,
      files: entry.outputs.map((output) => ({
        svg: path.relative(path.join(__dirname, '..'), output.svgPath).replace(/\\/g, '/'),
        png: path.relative(path.join(__dirname, '..'), output.pngPath).replace(/\\/g, '/')
      }))
    }))
  };

  await fs.writeFile(path.join(OUTPUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
  console.log(`Generated ${variations.length * 2} SVG masters and matching PNG exports in ${OUTPUT_DIR}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});