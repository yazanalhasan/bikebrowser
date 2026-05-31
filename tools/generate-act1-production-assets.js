import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import sharp from 'sharp';

const root = resolve(process.cwd());
const finalDir = join(root, 'src', 'game', 'art', 'final', 'act1');
const sourceDir = join(root, 'src', 'game', 'art', 'source', 'aseprite', 'act1');
mkdirSync(finalDir, { recursive: true });
mkdirSync(sourceDir, { recursive: true });

const aseprite = 'C:\\Program Files\\Aseprite\\Aseprite.exe';

function svg(width, height, body) {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" shape-rendering="crispEdges">${body}</svg>`);
}

function rounded(x, y, w, h, r, fill, stroke = null, sw = 1, opacity = 1) {
  const outline = stroke ? ` stroke="${stroke}" stroke-width="${sw}"` : '';
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" opacity="${opacity}"${outline}/>`;
}

function circle(cx, cy, r, fill, opacity = 1) {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" opacity="${opacity}"/>`;
}

function ellipse(cx, cy, rx, ry, fill, opacity = 1) {
  return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" opacity="${opacity}"/>`;
}

function line(x1, y1, x2, y2, stroke, sw = 2, opacity = 1) {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round" opacity="${opacity}"/>`;
}

function poly(points, fill, stroke = null, sw = 1, opacity = 1) {
  const outline = stroke ? ` stroke="${stroke}" stroke-width="${sw}"` : '';
  return `<polygon points="${points}" fill="${fill}" opacity="${opacity}"${outline}/>`;
}

const palette = {
  ink: '#26322d',
  shadow: '#17221f',
  paper: '#fff0c7',
  warm: '#f2c46d',
  copper: '#d08b62',
  teal: '#8ed6c9',
  green: '#5aa67b',
  sage: '#7fb069',
  clay: '#8f623e',
  dusk: '#3d485a',
  blue: '#2f6fb2',
  red: '#d94b45',
};

const assets = [
  {
    name: 'zuzu',
    width: 64,
    height: 72,
    body: `
      ${ellipse(32, 66, 22, 6, palette.shadow, 0.28)}
      ${rounded(20, 29, 24, 25, 7, palette.warm, '#fff6d6', 2)}
      ${rounded(18, 48, 10, 14, 3, '#68727b')}
      ${rounded(36, 48, 10, 14, 3, '#68727b')}
      ${circle(32, 19, 13, '#70452f')}
      ${circle(32, 23, 10, '#d9905d')}
      ${circle(28, 22, 2, palette.ink)}
      ${circle(36, 22, 2, palette.ink)}
      ${line(28, 31, 17, 41, palette.blue, 4)}
      ${line(42, 31, 53, 42, palette.red, 4)}
      ${rounded(25, 8, 15, 6, 3, '#6b3f2d')}
    `,
  },
  {
    name: 'npc_garage_mentor',
    width: 60,
    height: 72,
    body: `
      ${ellipse(30, 66, 21, 6, palette.shadow, 0.28)}
      ${rounded(18, 31, 24, 28, 6, '#46675f', '#fff0c7', 2)}
      ${circle(30, 19, 13, '#4f3b2c')}
      ${circle(30, 24, 10, '#c88f65')}
      ${line(15, 44, 6, 54, palette.warm, 4)}
      ${line(45, 44, 54, 54, palette.warm, 4)}
      ${line(10, 58, 24, 44, '#c6d1c7', 3)}
      ${circle(8, 60, 4, '#c6d1c7')}
    `,
  },
  {
    name: 'npc_neighbor',
    width: 60,
    height: 72,
    body: `
      ${ellipse(30, 66, 21, 6, palette.shadow, 0.28)}
      ${rounded(17, 31, 26, 28, 8, palette.copper, '#fff0c7', 2)}
      ${circle(30, 18, 12, '#593d36')}
      ${circle(30, 23, 10, '#d9a078')}
      ${rounded(19, 44, 22, 7, 3, '#f4d39b')}
      ${circle(18, 42, 4, '#f09d72')}
      ${circle(42, 42, 4, '#f09d72')}
      ${line(14, 46, 8, 56, '#f09d72', 4)}
      ${line(46, 46, 52, 56, '#f09d72', 4)}
    `,
  },
  {
    name: 'npc_arabic_mentor',
    width: 60,
    height: 72,
    body: `
      ${ellipse(30, 66, 21, 6, palette.shadow, 0.28)}
      ${rounded(18, 31, 24, 28, 7, '#6f74aa', '#fff0c7', 2)}
      ${circle(30, 20, 14, '#e8dfd3')}
      ${circle(30, 24, 10, '#c88f65')}
      ${line(18, 14, 42, 14, '#6f74aa', 3)}
      ${circle(22, 21, 2, palette.ink)}
      ${circle(38, 21, 2, palette.ink)}
      ${poly('30,42 23,54 37,54', palette.teal, palette.paper, 1)}
    `,
  },
  {
    name: 'garage_workbench',
    width: 192,
    height: 128,
    body: `
      ${ellipse(96, 104, 82, 14, palette.shadow, 0.2)}
      ${rounded(22, 28, 148, 72, 6, '#72553f', '#d9b36a', 3)}
      ${rounded(42, 46, 108, 48, 4, '#3b4a4c')}
      ${line(42, 60, 150, 60, '#d2b06b', 3)}
      ${line(42, 76, 150, 76, '#d2b06b', 3)}
      ${rounded(54, 86, 84, 18, 4, palette.clay, '#4a3528', 2)}
      ${rounded(70, 76, 28, 8, 3, palette.warm)}
      ${line(112, 84, 130, 72, palette.teal, 4)}
      ${circle(144, 36, 10, '#ffd98a', 0.7)}
    `,
  },
  {
    name: 'utm_rig',
    width: 96,
    height: 112,
    body: `
      ${ellipse(48, 103, 34, 7, palette.shadow, 0.24)}
      ${rounded(24, 10, 48, 82, 5, 'none', palette.ink, 6)}
      ${rounded(33, 35, 30, 10, 2, palette.teal, '#d9fff9', 1)}
      ${rounded(35, 52, 26, 8, 2, palette.copper)}
      ${line(48, 18, 48, 34, palette.warm, 4)}
      ${line(48, 62, 48, 86, palette.warm, 4)}
      ${rounded(29, 88, 38, 10, 2, palette.warm, palette.ink, 2)}
    `,
  },
  {
    name: 'material_samples',
    width: 112,
    height: 64,
    body: `
      ${ellipse(56, 54, 44, 5, palette.shadow, 0.2)}
      ${rounded(10, 24, 24, 14, 3, '#a7b3b5', palette.ink, 2)}
      ${rounded(44, 18, 22, 24, 2, '#b87333', palette.ink, 2)}
      ${rounded(78, 28, 24, 10, 2, '#8b7b6a', palette.ink, 2)}
      ${line(18, 16, 28, 10, '#d9e3e5', 3)}
      ${line(52, 10, 60, 8, '#ffc07a', 3)}
      ${line(86, 20, 98, 14, '#c9b99f', 3)}
    `,
  },
  {
    name: 'bridge_broken',
    width: 192,
    height: 88,
    body: `
      ${ellipse(96, 72, 88, 9, palette.shadow, 0.2)}
      ${line(12, 55, 72, 55, '#6b4a33', 7)}
      ${line(120, 55, 180, 55, '#6b4a33', 7)}
      ${line(76, 58, 108, 34, '#6b4a33', 5)}
      ${line(108, 34, 118, 58, '#6b4a33', 5)}
      ${poly('72,55 94,68 120,55 110,76 88,76', '#3f332a', null, 1, 0.85)}
      ${line(24, 54, 52, 24, palette.warm, 3)}
      ${line(140, 24, 168, 54, palette.warm, 3)}
    `,
  },
  {
    name: 'bridge_repaired',
    width: 192,
    height: 88,
    body: `
      ${ellipse(96, 72, 88, 9, palette.shadow, 0.2)}
      ${line(12, 55, 180, 55, '#6b4a33', 7)}
      ${line(20, 43, 172, 43, '#8f623e', 5)}
      ${line(24, 55, 52, 24, palette.warm, 3)}
      ${line(52, 24, 80, 55, palette.warm, 3)}
      ${line(80, 55, 108, 24, palette.warm, 3)}
      ${line(108, 24, 136, 55, palette.warm, 3)}
      ${line(136, 55, 164, 24, palette.warm, 3)}
      ${rounded(72, 36, 48, 10, 2, palette.teal, palette.paper, 1)}
    `,
  },
  {
    name: 'notebook_ui',
    width: 160,
    height: 128,
    body: `
      ${rounded(14, 10, 132, 104, 6, palette.paper, '#6b4a33', 3)}
      ${rounded(24, 10, 7, 104, 1, '#d9b36a', null, 1, 0.55)}
      ${rounded(42, 22, 38, 12, 3, '#f2c46d', null, 1, 0.45)}
      ${rounded(84, 22, 36, 12, 3, '#8ed6c9', null, 1, 0.35)}
      ${line(44, 48, 126, 48, '#8f806a', 2)}
      ${line(44, 62, 108, 62, '#8f806a', 2)}
      ${line(44, 76, 122, 76, '#8f806a', 2)}
      ${poly('124,88 130,100 142,101 132,108 135,120 124,113 113,120 116,108 106,101 118,100', palette.warm)}
    `,
  },
  {
    name: 'ecology_tokens',
    width: 112,
    height: 88,
    body: `
      ${ellipse(56, 76, 48, 6, palette.shadow, 0.2)}
      ${rounded(22, 24, 10, 46, 5, palette.green)}
      ${rounded(8, 42, 20, 7, 4, palette.green)}
      ${rounded(30, 34, 21, 7, 4, palette.green)}
      ${circle(70, 36, 12, palette.sage)}
      ${circle(82, 48, 9, palette.sage)}
      ${line(70, 48, 70, 70, '#4d7c55', 4)}
      ${line(20, 18, 30, 12, '#ffe8aa', 2, 0.7)}
      ${line(75, 20, 92, 16, '#ffe8aa', 2, 0.7)}
    `,
  },
  {
    name: 'chemistry_station',
    width: 112,
    height: 88,
    body: `
      ${ellipse(56, 76, 48, 6, palette.shadow, 0.2)}
      ${rounded(14, 58, 84, 14, 3, palette.clay, '#4a3528', 2)}
      ${rounded(30, 24, 14, 34, 5, palette.teal, '#e8fffb', 2)}
      ${rounded(58, 34, 18, 24, 5, palette.warm, '#fff6d6', 2)}
      ${line(37, 24, 37, 14, '#d9e3e5', 3)}
      ${line(67, 34, 76, 19, '#d9e3e5', 3)}
      ${circle(40, 42, 3, '#ffffff', 0.7)}
      ${circle(66, 48, 3, '#ffffff', 0.7)}
    `,
  },
  {
    name: 'hud_frame',
    width: 160,
    height: 64,
    body: `
      ${rounded(4, 6, 152, 48, 8, '#203029', '#fff0c7', 2, 0.86)}
      ${circle(22, 30, 8, palette.warm)}
      ${line(38, 23, 126, 23, '#fff0c7', 2, 0.7)}
      ${line(38, 36, 104, 36, '#8ed6c9', 2, 0.65)}
    `,
  },
  {
    name: 'map_gate',
    width: 112,
    height: 112,
    body: `
      ${ellipse(56, 96, 42, 7, palette.shadow, 0.22)}
      ${line(28, 92, 28, 22, '#6b4a33', 7)}
      ${line(84, 92, 84, 22, '#6b4a33', 7)}
      ${line(28, 24, 84, 24, palette.warm, 5)}
      ${line(28, 52, 84, 52, palette.warm, 5)}
      ${poly('44,78 68,78 56,48', palette.teal, palette.paper, 2)}
      ${circle(56, 44, 5, palette.paper)}
    `,
  },
];

for (const asset of assets) {
  const pngPath = join(finalDir, `${asset.name}.png`);
  const sourcePngPath = join(sourceDir, `${asset.name}_source.png`);
  const asepritePath = join(sourceDir, `${asset.name}.aseprite`);
  await sharp(svg(asset.width, asset.height, asset.body)).png().toFile(pngPath);
  await sharp(svg(asset.width, asset.height, asset.body)).png().toFile(sourcePngPath);
  if (existsSync(aseprite)) {
    execFileSync(aseprite, ['-b', sourcePngPath, '--save-as', asepritePath], { stdio: 'ignore' });
  }
}

console.log(`Generated ${assets.length} Act 1 authored production-preview assets in ${finalDir}`);
