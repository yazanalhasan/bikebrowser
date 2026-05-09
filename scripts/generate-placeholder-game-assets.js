#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');

const root = process.cwd();
const publicGame = path.join(root, 'public', 'assets', 'game');

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function esc(text) {
  return String(text).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function svg(width, height, body) {
  return Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <filter id="soft" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="2.4"/>
    </filter>
    <linearGradient id="warm" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0" stop-color="#fff6dc"/>
      <stop offset="1" stop-color="#f4c868"/>
    </linearGradient>
  </defs>
  ${body}
</svg>`);
}

function atlasFrameJson(x, y, w, h) {
  return {
    frame: { x, y, w, h },
    rotated: false,
    trimmed: false,
    spriteSourceSize: { x: 0, y: 0, w, h },
    sourceSize: { w, h },
    pivot: { x: 0.5, y: 1 },
  };
}

async function writeAtlas({ name, frames, frameWidth, frameHeight, columns }) {
  const atlasDir = path.join(publicGame, 'atlases');
  ensureDir(atlasDir);
  const rows = Math.ceil(frames.length / columns);
  const width = columns * frameWidth;
  const height = rows * frameHeight;
  const composites = [];
  const jsonFrames = {};

  for (let i = 0; i < frames.length; i += 1) {
    const x = (i % columns) * frameWidth;
    const y = Math.floor(i / columns) * frameHeight;
    const buffer = await sharp(frames[i].svg).png().toBuffer();
    composites.push({ input: buffer, left: x, top: y });
    jsonFrames[frames[i].key] = atlasFrameJson(x, y, frameWidth, frameHeight);
  }

  await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(composites)
    .png()
    .toFile(path.join(atlasDir, `${name}.png`));

  fs.writeFileSync(path.join(atlasDir, `${name}.json`), `${JSON.stringify({
    frames: jsonFrames,
    meta: {
      app: 'bikebrowser-placeholder-game-assets',
      version: '1.0',
      image: `${name}.png`,
      format: 'RGBA8888',
      size: { w: width, h: height },
      scale: '1',
    },
  }, null, 2)}\n`);
}

function zuzuFrame(key, direction = 'down', step = 0) {
  const armSwing = step % 2 === 0 ? 3 : -3;
  const legSwing = step % 2 === 0 ? -3 : 3;
  const side = direction === 'left' || direction === 'right';
  const back = direction === 'up';
  const faceX = side ? (direction === 'left' ? 42 : 54) : 48;
  const eye = back ? '' : `
    <circle cx="${faceX - 8}" cy="40" r="2.7" fill="#38251a"/>
    <circle cx="${faceX + 8}" cy="40" r="2.7" fill="#38251a"/>
    <path d="M ${faceX - 6} 48 Q ${faceX} 54 ${faceX + 7} 48" fill="none" stroke="#8a3c24" stroke-width="2" stroke-linecap="round"/>
    <rect x="${faceX + 1}" y="48" width="4" height="3" rx="1" fill="#fff9ee"/>
  `;
  const hair = back
    ? '<path d="M31 28 Q48 13 66 28 L62 44 Q48 51 34 44Z" fill="#6f3e21"/>'
    : '<path d="M32 33 Q43 20 62 29 Q58 33 54 32 Q48 27 38 36Z" fill="#6f3e21"/>';

  return {
    key,
    svg: svg(96, 112, `
      <ellipse cx="48" cy="101" rx="21" ry="6" fill="#2f3d2a" opacity=".16" filter="url(#soft)"/>
      <path d="M34 ${72 + legSwing} L43 ${72 - legSwing} L40 98 L29 98Z" fill="#f1b27d"/>
      <path d="M52 ${72 - legSwing} L62 ${72 + legSwing} L67 98 L55 98Z" fill="#f1b27d"/>
      <path d="M28 96 Q36 91 45 97 L44 103 L27 103Z" fill="#1f4e79"/>
      <path d="M52 97 Q61 91 70 97 L69 103 L52 103Z" fill="#1f4e79"/>
      <path d="M30 62 Q48 55 66 62 L63 80 Q48 85 33 80Z" fill="#075985"/>
      <path d="M35 63 L45 62 L38 75Z" fill="#16b7d8" opacity=".95"/>
      <path d="M54 62 L64 65 L58 77Z" fill="#f97316" opacity=".9"/>
      <path d="M31 45 Q48 38 65 45 L68 65 Q49 75 29 65Z" fill="url(#warm)"/>
      <path d="M34 50 Q46 45 61 51" fill="none" stroke="#f59e0b" stroke-width="8" opacity=".58" stroke-linecap="round"/>
      <path d="M32 57 Q44 64 63 58" fill="none" stroke="#fff1b8" stroke-width="6" opacity=".7" stroke-linecap="round"/>
      <path d="M31 49 Q23 ${58 + armSwing} 26 72" fill="none" stroke="#f1b27d" stroke-width="8" stroke-linecap="round"/>
      <path d="M65 49 Q75 ${57 - armSwing} 70 72" fill="none" stroke="#f1b27d" stroke-width="8" stroke-linecap="round"/>
      <circle cx="${faceX}" cy="37" r="17" fill="#f5c39b"/>
      ${hair}
      <path d="M26 28 Q48 5 70 28 Q70 32 67 36 L29 36 Q26 32 26 28Z" fill="#ef3139"/>
      <path d="M31 27 Q48 13 66 27" fill="none" stroke="#ff7a72" stroke-width="4" stroke-linecap="round"/>
      <path d="M35 23 L39 34 M48 18 L48 34 M61 23 L57 34" stroke="#25314a" stroke-width="4" stroke-linecap="round"/>
      <path d="M27 35 Q48 42 69 35" fill="none" stroke="#1f2937" stroke-width="3" stroke-linecap="round"/>
      ${eye}
    `),
  };
}

function neighborhoodFrame(key, kind) {
  const plant = {
    mesquite: '<ellipse cx="80" cy="66" rx="48" ry="34" fill="#6f9f3a"/><ellipse cx="55" cy="57" rx="28" ry="22" fill="#85b94a"/><ellipse cx="101" cy="54" rx="27" ry="22" fill="#78a944"/><path d="M76 70 Q68 91 54 105 M83 70 Q91 89 105 104" stroke="#81522d" stroke-width="8" stroke-linecap="round"/>',
    creosote: '<g fill="#7ea84c"><ellipse cx="56" cy="78" rx="24" ry="20"/><ellipse cx="83" cy="68" rx="30" ry="24"/><ellipse cx="107" cy="80" rx="25" ry="21"/></g><g fill="#e8d36a"><circle cx="67" cy="65" r="2"/><circle cx="91" cy="75" r="2"/><circle cx="105" cy="67" r="2"/></g>',
    ephedra: '<g stroke="#708b38" stroke-width="5" stroke-linecap="round"><path d="M80 100 L72 51"/><path d="M82 101 L95 49"/><path d="M78 101 L58 62"/><path d="M84 99 L110 68"/></g><g fill="#d9c85b"><circle cx="72" cy="50" r="4"/><circle cx="95" cy="49" r="4"/></g>',
    cactus: '<ellipse cx="80" cy="76" rx="20" ry="34" fill="#6e9c4b"/><path d="M66 74 Q51 71 54 54" stroke="#6e9c4b" stroke-width="12" stroke-linecap="round"/><path d="M94 76 Q111 70 106 53" stroke="#6e9c4b" stroke-width="12" stroke-linecap="round"/>',
    spiky: '<g fill="#789f52"><path d="M80 100 L51 57 L71 83 L69 43 L82 79 L101 47 L92 84 L122 62Z"/><path d="M80 100 L38 77 L70 88 L49 99 L78 91 L111 99 L91 89 L122 80Z"/></g>',
    lavender: '<g stroke="#6f8c3f" stroke-width="4"><path d="M80 100 L66 54"/><path d="M82 100 L85 48"/><path d="M82 100 L105 58"/></g><g fill="#8d69c9"><circle cx="65" cy="54" r="5"/><circle cx="85" cy="48" r="5"/><circle cx="105" cy="58" r="5"/><circle cx="76" cy="66" r="4"/></g>',
    pear: '<ellipse cx="70" cy="79" rx="16" ry="24" fill="#61994d"/><ellipse cx="91" cy="76" rx="18" ry="29" fill="#70aa55"/><ellipse cx="105" cy="88" rx="15" ry="22" fill="#61994d"/><g fill="#e85d5d"><circle cx="70" cy="56" r="4"/><circle cx="93" cy="48" r="4"/><circle cx="109" cy="68" r="4"/></g>',
    jojoba: '<g fill="#6d9448"><ellipse cx="58" cy="80" rx="22" ry="15"/><ellipse cx="83" cy="72" rx="24" ry="18"/><ellipse cx="107" cy="82" rx="21" ry="16"/></g><g fill="#d68729"><circle cx="75" cy="75" r="3"/><circle cx="100" cy="83" r="3"/></g>',
  };
  const animals = {
    rabbit: '<ellipse cx="82" cy="81" rx="29" ry="17" fill="#a98258"/><circle cx="55" cy="73" r="15" fill="#ba946c"/><path d="M48 61 L41 31 L54 56Z" fill="#a98258"/><path d="M59 60 L59 28 L68 60Z" fill="#ba946c"/><circle cx="50" cy="70" r="2.5" fill="#2b2018"/><path d="M80 93 L70 106 M100 92 L116 105" stroke="#765235" stroke-width="6" stroke-linecap="round"/>',
    javelina: '<ellipse cx="83" cy="80" rx="38" ry="23" fill="#665d4a"/><circle cx="43" cy="75" r="16" fill="#756b55"/><path d="M34 61 L38 48 L45 62Z" fill="#4f4739"/><path d="M53 62 L60 50 L60 66Z" fill="#4f4739"/><circle cx="39" cy="73" r="2.5" fill="#211b16"/><path d="M61 98 L56 108 M86 101 L84 110 M105 96 L113 106" stroke="#40372e" stroke-width="5" stroke-linecap="round"/>',
    coyote: '<ellipse cx="82" cy="77" rx="35" ry="19" fill="#9b7a4e"/><circle cx="43" cy="67" r="15" fill="#b18b5a"/><path d="M35 54 L39 34 L48 57Z" fill="#8d6f48"/><path d="M51 55 L60 37 L61 61Z" fill="#8d6f48"/><path d="M113 77 Q136 63 143 48" fill="none" stroke="#9b7a4e" stroke-width="12" stroke-linecap="round"/><circle cx="39" cy="66" r="2.5" fill="#211b16"/><path d="M60 92 L52 108 M86 94 L83 110 M104 92 L115 107" stroke="#6a5034" stroke-width="5" stroke-linecap="round"/>',
  };
  const buildings = {
    houseZuzu: '<rect x="30" y="48" width="100" height="58" rx="2" fill="#e6c184"/><path d="M23 50 L80 18 L137 50Z" fill="#7a5947"/><path d="M30 50 L80 23 L130 50" fill="none" stroke="#fff6df" stroke-width="6"/><rect x="70" y="70" width="20" height="36" rx="2" fill="#5b3826"/><rect x="43" y="63" width="20" height="16" fill="#b8ddf0"/><rect x="98" y="63" width="20" height="16" fill="#b8ddf0"/>',
    houseRamirez: '<rect x="30" y="48" width="100" height="58" rx="2" fill="#ee8e7f"/><path d="M23 50 L80 18 L137 50Z" fill="#c83b2f"/><path d="M30 50 L80 23 L130 50" fill="none" stroke="#fff6df" stroke-width="6"/><rect x="70" y="70" width="20" height="36" rx="2" fill="#5b3826"/><rect x="43" y="63" width="20" height="16" fill="#b8ddf0"/><rect x="98" y="63" width="20" height="16" fill="#b8ddf0"/>',
    workshop: '<rect x="28" y="45" width="104" height="62" rx="2" fill="#99cce8"/><path d="M23 48 L80 18 L137 48Z" fill="#2563aa"/><path d="M30 49 L80 24 L130 49" fill="none" stroke="#eef7ff" stroke-width="6"/><rect x="52" y="65" width="56" height="38" rx="3" fill="#e8eef2" stroke="#6f8795" stroke-width="3"/><path d="M55 74 H105 M55 84 H105" stroke="#9baeb9" stroke-width="2"/>',
  };
  const props = {
    bike: '<g fill="none" stroke-linecap="round"><circle cx="52" cy="86" r="18" stroke="#263238" stroke-width="5"/><circle cx="107" cy="86" r="18" stroke="#263238" stroke-width="5"/><path d="M52 86 L72 62 L92 86 L67 86 L82 70" stroke="#1d6fe8" stroke-width="6"/><path d="M70 62 H86 M82 60 L84 51 M97 63 H111" stroke="#263238" stroke-width="5"/></g>',
    gps: '<rect x="65" y="35" width="30" height="56" rx="8" fill="#243044"/><rect x="70" y="42" width="20" height="32" rx="3" fill="#8ecae6"/><path d="M75 66 L88 52" stroke="#f5c542" stroke-width="3"/><rect x="74" y="94" width="12" height="16" fill="#667085"/>',
    heat: '<rect x="30" y="60" width="100" height="42" rx="18" fill="#263238" opacity=".26"/><g fill="none" stroke="#ff7a2f" stroke-width="4" stroke-linecap="round" opacity=".8"><path d="M55 91 Q47 80 55 69 Q62 60 55 53"/><path d="M80 91 Q72 80 80 69 Q87 60 80 53"/><path d="M105 91 Q97 80 105 69 Q112 60 105 53"/></g>',
  };
  const npcs = {
    chen: '<ellipse cx="80" cy="99" rx="22" ry="6" fill="#29322a" opacity=".17"/><rect x="61" y="55" width="38" height="40" rx="10" fill="#d9b887"/><circle cx="80" cy="40" r="17" fill="#e3b884"/><path d="M62 35 Q80 18 98 35 Q91 28 79 31 Q69 30 62 35Z" fill="#3f2a18"/><circle cx="73" cy="40" r="3" fill="#1f2937"/><circle cx="87" cy="40" r="3" fill="#1f2937"/><rect x="66" y="38" width="12" height="8" rx="4" fill="none" stroke="#1f2937" stroke-width="2"/><rect x="82" y="38" width="12" height="8" rx="4" fill="none" stroke="#1f2937" stroke-width="2"/><path d="M72 91 L67 108 M88 91 L93 108" stroke="#3d2d22" stroke-width="7" stroke-linecap="round"/>',
    ramirez: '<ellipse cx="80" cy="99" rx="22" ry="6" fill="#29322a" opacity=".17"/><rect x="59" y="56" width="42" height="39" rx="10" fill="#ee7c68"/><circle cx="80" cy="38" r="17" fill="#c38262"/><path d="M59 36 Q70 15 91 23 Q101 31 97 47 Q89 35 78 35 Q68 36 59 36Z" fill="#5f3824"/><circle cx="73" cy="39" r="3" fill="#1f2937"/><circle cx="87" cy="39" r="3" fill="#1f2937"/><path d="M72 91 L67 108 M88 91 L93 108" stroke="#5a463e" stroke-width="7" stroke-linecap="round"/>',
  };

  const art = {
    npc_mr_chen_idle: npcs.chen,
    npc_mrs_ramirez_idle: npcs.ramirez,
    plant_mesquite_tree_01: plant.mesquite,
    plant_creosote_bush_01: plant.creosote,
    plant_ephedra_mormon_tea_01: plant.ephedra,
    plant_barrel_cactus_01: plant.cactus,
    plant_yucca_01: plant.spiky,
    plant_agave_01: plant.spiky,
    plant_desert_lavender_01: plant.lavender,
    plant_prickly_pear_01: plant.pear,
    plant_jojoba_shrub_01: plant.jojoba,
    animal_jackrabbit_01: animals.rabbit,
    animal_javelina_01: animals.javelina,
    animal_coyote_01: animals.coyote,
    prop_flat_tire_bike: props.bike,
    prop_mr_chen_bike: props.bike,
    prop_bike_gps: props.gps,
    prop_scorching_pavement: props.heat,
    sign_garage_left: '<rect x="33" y="48" width="94" height="31" rx="7" fill="#fff2c8" stroke="#c49a43" stroke-width="3"/><text x="80" y="69" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="#263238">← Garage</text>',
    house_zuzu: buildings.houseZuzu,
    house_ramirez: buildings.houseRamirez,
    building_workshop: buildings.workshop,
  }[key] || `<text x="80" y="64" text-anchor="middle" font-family="Arial" font-size="14">${esc(kind || key)}</text>`;

  return {
    key,
    svg: svg(160, 120, `
      <ellipse cx="80" cy="101" rx="48" ry="8" fill="#263326" opacity=".13" filter="url(#soft)"/>
      ${art}
    `),
  };
}

async function writeShadows() {
  const dir = path.join(publicGame, 'ui');
  ensureDir(dir);
  const specs = [
    ['shadow_soft_small', 72, 28, 0.28],
    ['shadow_soft_medium', 116, 42, 0.24],
    ['shadow_soft_large', 190, 70, 0.2],
  ];
  for (const [name, w, h, alpha] of specs) {
    await sharp(svg(w, h, `<ellipse cx="${w / 2}" cy="${h / 2}" rx="${w * 0.4}" ry="${h * 0.28}" fill="#253028" opacity="${alpha}" filter="url(#soft)"/>`))
      .png()
      .toFile(path.join(dir, `${name}.png`));
  }
}

async function writeTilesetAndMap() {
  const tilesetDir = path.join(publicGame, 'tilesets');
  const mapDir = path.join(publicGame, 'maps');
  ensureDir(tilesetDir);
  ensureDir(mapDir);
  const tileColors = ['#77b63c', '#86c34c', '#383f3e', '#4a5150', '#d8d4c8', '#c7c0ad', '#d9b979', '#9bc45a'];
  const composites = [];
  for (let i = 0; i < tileColors.length; i += 1) {
    const x = (i % 4) * 64;
    const y = Math.floor(i / 4) * 64;
    const dots = Array.from({ length: 9 }, (_, n) => `<circle cx="${12 + (n * 17) % 44}" cy="${12 + (n * 23) % 42}" r="${1 + (n % 3)}" fill="#ffffff" opacity=".12"/>`).join('');
    const buffer = await sharp(svg(64, 64, `<rect width="64" height="64" fill="${tileColors[i]}"/>${dots}<path d="M0 63 H64" stroke="#000" opacity=".05"/>`)).png().toBuffer();
    composites.push({ input: buffer, left: x, top: y });
  }
  await sharp({
    create: { width: 256, height: 128, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  }).composite(composites).png().toFile(path.join(tilesetDir, 'sonoran_tiles.png'));

  const width = 16;
  const height = 11;
  const ground = Array.from({ length: width * height }, (_, i) => {
    const row = Math.floor(i / width);
    if (row === 5) return 3;
    if (row === 4 || row === 6) return 5;
    return (i + row) % 9 === 0 ? 2 : 1;
  });
  fs.writeFileSync(path.join(mapDir, 'neighborhood.json'), `${JSON.stringify({
    compressionlevel: -1,
    height,
    infinite: false,
    layers: [{
      data: ground,
      height,
      id: 1,
      name: 'Ground',
      opacity: 1,
      type: 'tilelayer',
      visible: true,
      width,
      x: 0,
      y: 0,
    }],
    nextlayerid: 2,
    nextobjectid: 1,
    orientation: 'orthogonal',
    renderorder: 'right-down',
    tiledversion: '1.10.2',
    tileheight: 64,
    tilesets: [{
      columns: 4,
      firstgid: 1,
      image: '../tilesets/sonoran_tiles.png',
      imageheight: 128,
      imagewidth: 256,
      margin: 0,
      name: 'sonoran_tiles',
      spacing: 0,
      tilecount: 8,
      tileheight: 64,
      tilewidth: 64,
    }],
    tilewidth: 64,
    type: 'map',
    version: '1.10',
    width,
  }, null, 2)}\n`);
}

async function main() {
  const zuzuFrames = [
    zuzuFrame('zuzu_idle_down', 'down', 0),
    zuzuFrame('zuzu_idle_up', 'up', 0),
    zuzuFrame('zuzu_idle_left', 'left', 0),
    zuzuFrame('zuzu_idle_right', 'right', 0),
    ...['down', 'up', 'left', 'right'].flatMap((direction) => [1, 2, 3, 4].map((i) => zuzuFrame(`zuzu_walk_${direction}_${String(i).padStart(2, '0')}`, direction, i))),
    zuzuFrame('zuzu_bike_idle', 'right', 0),
    zuzuFrame('zuzu_repair_kneel', 'down', 1),
    zuzuFrame('zuzu_excited', 'down', 2),
  ];

  const neighborhoodKeys = [
    'npc_mr_chen_idle',
    'npc_mrs_ramirez_idle',
    'plant_mesquite_tree_01',
    'plant_creosote_bush_01',
    'plant_ephedra_mormon_tea_01',
    'plant_barrel_cactus_01',
    'plant_yucca_01',
    'plant_agave_01',
    'plant_desert_lavender_01',
    'plant_prickly_pear_01',
    'plant_jojoba_shrub_01',
    'animal_jackrabbit_01',
    'animal_javelina_01',
    'animal_coyote_01',
    'prop_flat_tire_bike',
    'prop_mr_chen_bike',
    'prop_bike_gps',
    'prop_scorching_pavement',
    'sign_garage_left',
    'house_zuzu',
    'house_ramirez',
    'building_workshop',
  ];

  await writeAtlas({ name: 'zuzu', frames: zuzuFrames, frameWidth: 96, frameHeight: 112, columns: 6 });
  await writeAtlas({ name: 'neighborhood', frames: neighborhoodKeys.map((key) => neighborhoodFrame(key)), frameWidth: 160, frameHeight: 120, columns: 6 });
  await writeShadows();
  await writeTilesetAndMap();
  console.log('Generated placeholder game atlases, shadow textures, tileset, and map.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
