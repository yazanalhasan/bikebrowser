import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import sharp from 'sharp';

const root = resolve(process.cwd());
const outDir = join(root, 'public', 'game', 'assets', 'generated_drafts');
mkdirSync(outDir, { recursive: true });

function svg(width, height, body) {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" shape-rendering="geometricPrecision">${body}</svg>`);
}

async function writePng(name, width, height, body) {
  await sharp(svg(width, height, body)).png().toFile(join(outDir, `${name}.png`));
}

const label = (text, x, y) => `<text x="${x}" y="${y}" font-family="Arial" font-size="13" fill="#fff0c7">${text}</text>`;
const rect = (x, y, w, h, fill, rx = 0, opacity = 1) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" opacity="${opacity}"/>`;
const poly = (points, fill, opacity = 1) => `<polygon points="${points}" fill="${fill}" opacity="${opacity}"/>`;
const ellipse = (cx, cy, rx, ry, fill, opacity = 1) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" opacity="${opacity}"/>`;
const line = (x1, y1, x2, y2, stroke, sw = 2, opacity = 1) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round" opacity="${opacity}"/>`;

await writePng('wave1_sonoran_vista_draft', 1600, 392, `
  ${rect(0, 0, 1600, 392, '#2e4a3d')}
  ${rect(0, 0, 1600, 230, '#7db3b8', 0, 0.35)}
  ${ellipse(280, 116, 680, 174, '#ffd17a', 0.32)}
  ${ellipse(910, 96, 900, 70, '#fff0c7', 0.22)}
  ${poly('0,330 88,286 172,198 268,304 402,242 532,118 692,314 828,236 946,322 1084,190 1242,98 1396,276 1542,170 1600,224 1600,392 0,392', '#3f536f', 0.72)}
  ${poly('0,344 122,300 254,230 390,328 520,266 664,190 812,330 990,276 1130,172 1288,324 1438,248 1600,310 1600,392 0,392', '#9b5b75', 0.62)}
  ${poly('0,360 142,314 268,284 418,352 612,298 792,266 964,348 1134,296 1300,250 1468,338 1600,306 1600,392 0,392', '#d47b3d', 0.52)}
  ${rect(0, 318, 1600, 70, '#a8b86d', 0, 0.46)}
  ${rect(0, 350, 1600, 28, '#637d4e', 12, 0.44)}
  ${label('UNKNOWN_DRAFT vista - replace with Blender/Aseprite mountain pass', 24, 32)}
`);

await writePng('wave1_road_system_draft', 1600, 260, `
  ${rect(0, 0, 1600, 260, '#2e4a3d')}
  ${rect(0, 71, 1600, 28, '#55646d', 0, 0.92)}
  ${rect(0, 99, 1600, 116, '#26343b')}
  ${rect(0, 215, 1600, 28, '#55646d', 0, 0.92)}
  ${Array.from({ length: 14 }, (_, i) => rect(80 + i * 120, 156, 56, 4, '#d8c073', 2, 0.7)).join('')}
  ${label('UNKNOWN_DRAFT road system - replace with Aseprite tiles', 24, 34)}
`);

async function houseBody(name, w, h, body) {
  await writePng(name, w, h, `
    ${ellipse(w / 2, h - 10, w * 0.42, 10, '#17221f', 0.24)}
    ${body}
    ${label('DRAFT', 10, h - 12)}
  `);
}

await houseBody('house_pueblo_01_draft', 312, 152, `
  ${rect(6, 26, 300, 112, '#c88457', 14)}
  ${rect(22, 12, 268, 28, '#f0c997', 10)}
  ${rect(0, 10, 312, 18, '#8b5a3e', 8)}
  ${Array.from({ length: 9 }, (_, i) => rect(28 + i * 30, 0, 14, 18, '#5e392b', 5, 0.92)).join('')}
  ${rect(137, 96, 36, 42, '#f2c46d', 5)}
  ${rect(34, 62, 42, 28, '#31485a', 5, 0.9)}
  ${rect(232, 62, 42, 28, '#31485a', 5, 0.9)}
`);

await houseBody('house_pueblo_02_draft', 232, 126, `
  ${rect(4, 24, 224, 90, '#d39a66', 12)}
  ${rect(18, 10, 196, 24, '#f3d19d', 9)}
  ${rect(0, 8, 232, 16, '#8b5a3e', 8)}
  ${Array.from({ length: 7 }, (_, i) => rect(24 + i * 28, 0, 12, 16, '#5e392b', 5, 0.9)).join('')}
  ${rect(100, 74, 32, 40, '#f2c46d', 5)}
  ${rect(30, 50, 34, 24, '#31485a', 5, 0.9)}
  ${rect(168, 50, 34, 24, '#31485a', 5, 0.9)}
`);

await houseBody('house_mission_01_draft', 218, 128, `
  ${rect(14, 38, 190, 78, '#d9b28a', 7)}
  ${poly('0,40 109,0 218,40', '#b44f30')}
  ${Array.from({ length: 9 }, (_, i) => poly(`${24 + i * 18},30 ${33 + i * 18},20 ${42 + i * 18},30`, '#8e3d2a', 0.75)).join('')}
  ${rect(94, 72, 30, 42, '#f2c46d', 14)}
  ${rect(34, 62, 28, 22, '#31485a', 4, 0.9)}
  ${rect(156, 62, 28, 22, '#31485a', 4, 0.9)}
`);

await houseBody('house_territorial_01_draft', 260, 136, `
  ${rect(0, 24, 260, 100, '#c79b6f', 5)}
  ${poly('-4,24 130,0 264,24', '#8f5e3d')}
  ${rect(-10, 44, 280, 18, '#f0d19a', 3, 0.95)}
  ${rect(-14, 60, 288, 20, '#f7e0b4', 6)}
  ${Array.from({ length: 6 }, (_, i) => rect(18 + i * 46, 60, 7, 62, '#6b4a33', 3, 0.9)).join('')}
  ${rect(122, 74, 30, 44, '#f2c46d', 4)}
  ${rect(34, 70, 28, 24, '#31485a', 4, 0.9)}
  ${rect(200, 70, 28, 24, '#31485a', 4, 0.9)}
`);

await writePng('vegetation_saguaro_cluster_draft', 96, 112, `
  ${ellipse(48, 104, 34, 7, '#17221f', 0.24)}
  ${rect(44, 22, 11, 74, '#4f9c75', 6)}
  ${rect(22, 50, 22, 8, '#4f9c75', 4)}
  ${rect(55, 40, 24, 8, '#4f9c75', 4)}
  ${rect(72, 30, 9, 58, '#5aa67b', 5)}
  ${rect(10, 66, 9, 34, '#7fb069', 5)}
  ${label('DRAFT', 8, 18)}
`);

await writePng('quest_marker_story_draft', 42, 54, `
  ${ellipse(21, 48, 16, 4, '#17221f', 0.24)}
  ${poly('21,50 8,24 34,24', '#f2c46d')}
  ${ellipse(21, 18, 15, 15, '#ffe08a')}
  ${ellipse(21, 18, 5, 5, '#26322d')}
  ${label('D', 17, 22)}
`);

writeFileSync(join(outDir, 'wave1_manifest.json'), JSON.stringify({
  status: 'draft',
  approved: false,
  source_tool: 'UNKNOWN_DRAFT',
  created_by: 'Codex temporary SVG-to-PNG stub generator',
  created_for: 'Wave 1 wiring and placement validation only',
  runtime_promotion: 'forbidden until replaced by approved Meshy/Blender/Aseprite/ComfyUI/Hunyuan pipeline output',
  assets: [
    'wave1_sonoran_vista_draft.png',
    'wave1_road_system_draft.png',
    'house_pueblo_01_draft.png',
    'house_pueblo_02_draft.png',
    'house_mission_01_draft.png',
    'house_territorial_01_draft.png',
    'vegetation_saguaro_cluster_draft.png',
    'quest_marker_story_draft.png',
  ],
}, null, 2));

console.log(`Generated Wave 1 draft assets in ${outDir}`);
