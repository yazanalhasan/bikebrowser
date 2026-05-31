import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import sharp from 'sharp';
import { chromium } from 'playwright';

const ROOT = process.cwd();
const BASE_URL = process.env.BIKEBROWSER_AUDIT_URL || 'http://127.0.0.1:5173/game-rebuild';
const ARTIFACT_ROOT = path.join(ROOT, 'artifacts', 'art_audit');
const REQUIRED_CHARACTERS = ['zuzu', 'mr_chen', 'neighbor', 'auntie_mariam'];
const CHARACTER_ALIASES = {
  zuzu: 'Zuzu',
  mr_chen: 'Mr. Chen',
  neighbor: 'Mrs. Ramirez',
  auntie_mariam: 'Auntie Mariam',
};

const TEXTURE_SOURCES = {
  'act1.zuzu.walk.sheet': 'src/game/art/final/act1/characters/zuzu_walk_native96_sheet.png',
  'act1.npc.garage_mentor.talk.sheet': 'src/game/art/final/act1/characters/mr_chen_talk_sheet.png',
  'act1.npc.neighbor.talk.sheet': 'src/game/art/final/act1/characters/mrs_ramirez_talk_sheet.png',
  'act1.npc.arabic_mentor.talk.sheet': 'src/game/art/final/act1/characters/auntie_mariam_style_reference_sheet.png',
};

const THRESHOLDS = {
  meanAbsoluteError: 34,
  changedOpaqueRatio: 0.38,
  minOpaqueCoverage: 0.04,
};

async function ensureDirs() {
  for (const part of ['source_exact', 'runtime_scene', 'runtime_crops', 'diff_overlay', 'contact_sheet']) {
    await mkdir(path.join(ARTIFACT_ROOT, part), { recursive: true });
  }
}

async function serverHealthy() {
  try {
    const response = await fetch('http://127.0.0.1:5173', { signal: AbortSignal.timeout(1500) });
    return response.ok || response.status < 500;
  } catch {
    return false;
  }
}

async function waitForServer() {
  const start = Date.now();
  while (Date.now() - start < 30000) {
    if (await serverHealthy()) return true;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return false;
}

async function startServerIfNeeded() {
  if (await serverHealthy()) return null;
  const child = spawn('npm', ['run', 'dev:react', '--', '--host', '127.0.0.1'], {
    cwd: ROOT,
    shell: true,
    stdio: 'pipe',
  });
  child.stdout.on('data', (data) => process.stdout.write(`[vite] ${data}`));
  child.stderr.on('data', (data) => process.stderr.write(`[vite] ${data}`));
  if (!(await waitForServer())) {
    child.kill();
    throw new Error('Vite dev server did not become healthy on 127.0.0.1:5173.');
  }
  return child;
}

function assertFrameMetadata(character) {
  const required = ['textureKey', 'cutX', 'cutY', 'cutWidth', 'cutHeight', 'bounds'];
  const missing = required.filter((key) => character[key] === null || character[key] === undefined);
  if (missing.length) {
    throw new Error(`${character.characterId} is missing runtime frame metadata: ${missing.join(', ')}`);
  }
}

function screenCropFor(character, canvasRect, padding = 6) {
  const zoom = character.cameraZoom || 1;
  const scrollX = character.cameraScroll?.x || 0;
  const scrollY = character.cameraScroll?.y || 0;
  const dpr = canvasRect.devicePixelRatio || 1;
  const x = (canvasRect.x + (character.bounds.x - scrollX) * zoom - padding) * dpr;
  const y = (canvasRect.y + (character.bounds.y - scrollY) * zoom - padding) * dpr;
  const width = (character.bounds.width * zoom + padding * 2) * dpr;
  const height = (character.bounds.height * zoom + padding * 2) * dpr;
  return {
    left: Math.max(0, Math.floor(x)),
    top: Math.max(0, Math.floor(y)),
    width: Math.max(1, Math.ceil(width)),
    height: Math.max(1, Math.ceil(height)),
    padding,
    rotationAware: false,
  };
}

async function cropRuntimeCharacter(scenePath, outputPath, crop) {
  const meta = await sharp(scenePath).metadata();
  const left = Math.min(crop.left, Math.max(0, meta.width - 1));
  const top = Math.min(crop.top, Math.max(0, meta.height - 1));
  const width = Math.max(1, Math.min(crop.width, meta.width - left));
  const height = Math.max(1, Math.min(crop.height, meta.height - top));
  await sharp(scenePath).extract({ left, top, width, height }).png().toFile(outputPath);
  return { left, top, width, height, padding: crop.padding, rotationAware: crop.rotationAware };
}

async function createSourceCrop(character, outputPath) {
  const sourceRelative = TEXTURE_SOURCES[character.textureKey];
  if (!sourceRelative) {
    throw new Error(`${character.characterId} texture ${character.textureKey} has no art-audit source mapping.`);
  }
  const sourcePath = path.join(ROOT, sourceRelative);
  if (!existsSync(sourcePath)) {
    throw new Error(`${character.characterId} mapped source file does not exist: ${sourcePath}`);
  }
  await sharp(sourcePath)
    .extract({
      left: character.cutX,
      top: character.cutY,
      width: character.cutWidth,
      height: character.cutHeight,
    })
    .png()
    .toFile(outputPath);
  return { sourcePath, sourceRelative };
}

async function transformedSourcePng(sourcePath, character, width, height) {
  let pipeline = sharp(sourcePath, { limitInputPixels: false });
  if (character.flipX) pipeline = pipeline.flop();
  if (character.flipY) pipeline = pipeline.flip();
  return pipeline
    .resize(width, height, { kernel: 'nearest', fit: 'fill' })
    .ensureAlpha()
    .png()
    .toBuffer();
}

async function expectedSourceRaw(sourcePath, character, runtimeCrop) {
  const targetWidth = Math.max(1, runtimeCrop.width - runtimeCrop.padding * 2);
  const targetHeight = Math.max(1, runtimeCrop.height - runtimeCrop.padding * 2);
  const scaledSource = await transformedSourcePng(sourcePath, character, targetWidth, targetHeight);
  const expected = sharp({
    create: {
      width: runtimeCrop.width,
      height: runtimeCrop.height,
      channels: 4,
      background: '#00000000',
    },
  }).composite([
    {
      input: scaledSource,
      left: runtimeCrop.padding,
      top: runtimeCrop.padding,
    },
  ]).ensureAlpha();
  return {
    buffer: await expected.raw().toBuffer(),
    width: runtimeCrop.width,
    height: runtimeCrop.height,
    png: await sharp({
      create: {
        width: runtimeCrop.width,
        height: runtimeCrop.height,
        channels: 4,
        background: '#00000000',
      },
    }).composite([{ input: scaledSource, left: runtimeCrop.padding, top: runtimeCrop.padding }]).png().toBuffer(),
  };
}

async function rawImage(filePath) {
  const image = sharp(filePath, { limitInputPixels: false }).ensureAlpha();
  const metadata = await image.metadata();
  const buffer = await image.raw().toBuffer();
  return { buffer, width: metadata.width, height: metadata.height };
}

function comparePixels(sourceRaw, runtimeRaw) {
  const totalPixels = sourceRaw.width * sourceRaw.height;
  let opaquePixels = 0;
  let changedPixels = 0;
  let absoluteError = 0;
  for (let index = 0; index < totalPixels; index += 1) {
    const offset = index * 4;
    const alpha = sourceRaw.buffer[offset + 3];
    if (alpha < 96) continue;
    opaquePixels += 1;
    const dr = Math.abs(sourceRaw.buffer[offset] - runtimeRaw.buffer[offset]);
    const dg = Math.abs(sourceRaw.buffer[offset + 1] - runtimeRaw.buffer[offset + 1]);
    const db = Math.abs(sourceRaw.buffer[offset + 2] - runtimeRaw.buffer[offset + 2]);
    const pixelError = (dr + dg + db) / 3;
    absoluteError += pixelError;
    if (pixelError > 54) changedPixels += 1;
  }
  const meanAbsoluteError = opaquePixels ? absoluteError / opaquePixels : 255;
  const changedOpaqueRatio = opaquePixels ? changedPixels / opaquePixels : 1;
  const opaqueCoverage = opaquePixels / totalPixels;
  return {
    opaquePixels,
    opaqueCoverage,
    meanAbsoluteError,
    changedOpaqueRatio,
  };
}

async function createDiffOverlay(sourceCanvasPng, runtimePath, character, outputPath) {
  const runtimeMeta = await sharp(runtimePath).metadata();
  await sharp(runtimePath)
    .composite([
      { input: sourceCanvasPng, blend: 'difference', left: 0, top: 0 },
      {
        input: Buffer.from(
          `<svg width="${runtimeMeta.width}" height="${runtimeMeta.height}">
            <rect x="0" y="0" width="${runtimeMeta.width}" height="${runtimeMeta.height}" fill="none" stroke="#ffef7a" stroke-width="2"/>
            <text x="6" y="18" font-size="14" font-family="Arial" fill="#ffef7a">${character.characterId}</text>
          </svg>`,
        ),
        left: 0,
        top: 0,
      },
    ])
    .png()
    .toFile(outputPath);
}

function warningsFor(character, runtimeCrop, comparison) {
  const warnings = [];
  const tintValues = [character.tintTopLeft, character.tintTopRight, character.tintBottomLeft, character.tintBottomRight];
  if (tintValues.some((value) => value !== null && value !== 0xffffff)) warnings.push('Runtime tint changes source appearance.');
  if (character.alpha < 0.99) warnings.push('Runtime alpha changes source appearance.');
  if (character.flipX || character.flipY) warnings.push('Runtime flip transform applied before comparison.');
  if (Math.abs(character.rotation) > 0.001) warnings.push('Runtime rotation detected; crop is conservative axis-aligned.');
  if (Math.abs(character.scaleX - character.scaleY) > 0.08) warnings.push('Non-uniform scaling changes source proportions.');
  if (character.occludedBy?.length) warnings.push(`Runtime bounds overlap other character(s): ${character.occludedBy.join(', ')}.`);
  const sourceRatio = character.cutWidth / character.cutHeight;
  const runtimeRatio = runtimeCrop.width / runtimeCrop.height;
  if (Math.abs(sourceRatio - runtimeRatio) > 0.18) warnings.push('Source and runtime crop aspect ratios differ.');
  if (comparison.opaqueCoverage < THRESHOLDS.minOpaqueCoverage) warnings.push('Runtime crop is dominated by background/transparent frame padding.');
  return warnings;
}

function overlapRatio(a, b) {
  const left = Math.max(a.left, b.left);
  const right = Math.min(a.right, b.right);
  const top = Math.max(a.top, b.top);
  const bottom = Math.min(a.bottom, b.bottom);
  const width = Math.max(0, right - left);
  const height = Math.max(0, bottom - top);
  const overlapArea = width * height;
  const aArea = Math.max(1, a.width * a.height);
  return overlapArea / aArea;
}

function markCharacterOverlaps(characters) {
  for (const character of characters) {
    character.occludedBy = [];
    for (const other of characters) {
      if (character.characterId === other.characterId) continue;
      if (overlapRatio(character.bounds, other.bounds) > 0.025) {
        character.occludedBy.push(other.characterId);
      }
    }
  }
  return characters;
}

function likelyMismatchReasons(character, comparison, warnings) {
  const reasons = [];
  if (comparison.meanAbsoluteError > THRESHOLDS.meanAbsoluteError) reasons.push('High masked pixel color error.');
  if (comparison.changedOpaqueRatio > THRESHOLDS.changedOpaqueRatio) reasons.push('Many opaque source pixels differ from runtime crop.');
  if (warnings.some((warning) => warning.includes('tint'))) reasons.push('Tint transform may alter rendered character.');
  if (warnings.some((warning) => warning.includes('alpha'))) reasons.push('Alpha transform may blend character with background.');
  if (warnings.some((warning) => warning.includes('rotation'))) reasons.push('Rotation makes axis-aligned visual comparison less exact.');
  return reasons;
}

async function compareCharacter(character, sourcePath, runtimePath, overlayPath, runtimeCrop) {
  const runtime = await rawImage(runtimePath);
  const source = await expectedSourceRaw(sourcePath, character, runtimeCrop);
  const comparison = comparePixels(source, runtime);
  await createDiffOverlay(source.png, runtimePath, character, overlayPath);
  const warnings = warningsFor(character, runtime, comparison);
  const pass = (
    comparison.meanAbsoluteError <= THRESHOLDS.meanAbsoluteError
    && comparison.changedOpaqueRatio <= THRESHOLDS.changedOpaqueRatio
    && comparison.opaqueCoverage >= THRESHOLDS.minOpaqueCoverage
  );
  return {
    ...comparison,
    pass,
    warnings,
    likelyMismatchReasons: likelyMismatchReasons(character, comparison, warnings),
  };
}

async function createContactSheet(results, outputPath) {
  const rowWidth = 1040;
  const rowHeight = 190;
  const headerHeight = 44;
  const canvasHeight = headerHeight + results.length * rowHeight;
  const base = sharp({
    create: {
      width: rowWidth,
      height: canvasHeight,
      channels: 4,
      background: '#18211f',
    },
  });
  const composites = [
    {
      input: Buffer.from(`<svg width="${rowWidth}" height="${headerHeight}">
        <text x="18" y="28" font-family="Arial" font-size="22" fill="#fff0c7">Act 1 Character Runtime Source Match Audit</text>
      </svg>`),
      left: 0,
      top: 0,
    },
  ];
  for (const [index, result] of results.entries()) {
    const y = headerHeight + index * rowHeight;
    const source = await sharp(result.sourceCropPath).resize(144, 144, { kernel: 'nearest', fit: 'contain', background: '#00000000' }).png().toBuffer();
    const runtime = await sharp(result.runtimeCropPath).resize(144, 144, { kernel: 'nearest', fit: 'contain', background: '#00000000' }).png().toBuffer();
    const overlay = await sharp(result.comparisonOverlayPath).resize(144, 144, { kernel: 'nearest', fit: 'contain', background: '#00000000' }).png().toBuffer();
    const status = result.pass ? 'PASS' : 'FAIL';
    const color = result.pass ? '#8df0a4' : '#ff8f7a';
    composites.push(
      { input: source, left: 18, top: y + 28 },
      { input: runtime, left: 190, top: y + 28 },
      { input: overlay, left: 362, top: y + 28 },
      {
        input: Buffer.from(`<svg width="500" height="${rowHeight}">
          <text x="0" y="30" font-family="Arial" font-size="18" fill="${color}">${status}: ${result.displayName}</text>
          <text x="0" y="58" font-family="Arial" font-size="13" fill="#fff0c7">texture: ${result.textureKey}</text>
          <text x="0" y="80" font-family="Arial" font-size="13" fill="#fff0c7">frame: ${result.currentFrameIndex} (${result.cutX},${result.cutY},${result.cutWidth},${result.cutHeight})</text>
          <text x="0" y="102" font-family="Arial" font-size="13" fill="#fff0c7">MAE: ${result.diffScore.meanAbsoluteError.toFixed(2)} | changed: ${(result.diffScore.changedOpaqueRatio * 100).toFixed(1)}%</text>
          <text x="0" y="124" font-family="Arial" font-size="13" fill="#d8c073">warnings: ${result.warnings.length ? result.warnings.join('; ') : 'none'}</text>
        </svg>`),
        left: 536,
        top: y + 18,
      },
    );
  }
  await base.composite(composites).png().toFile(outputPath);
}

function markdownReport(audit, results, contactSheetPath, scenePath) {
  const lines = [
    '# Act 1 Character Visual Audit',
    '',
    `Scene: ${audit.sceneName}`,
    `Timestamp: ${audit.timestamp}`,
    '',
    `Runtime scene screenshot: ${scenePath}`,
    `Contact sheet: ${contactSheetPath}`,
    '',
    '## Final Conclusion',
    '',
    results.every((item) => item.pass)
      ? 'Visual match confirmed for every required character. Each source crop was extracted from Phaser runtime frame metadata and compared against the live scene crop.'
      : 'Mismatch detected. One or more characters failed exact runtime source-frame visual comparison.',
    '',
    '## Character Results',
    '',
  ];
  for (const result of results) {
    lines.push(
      `### ${result.displayName}`,
      '',
      `- Character ID: ${result.characterId}`,
      `- Texture key: ${result.textureKey}`,
      `- Current animation: ${result.currentAnimationKey || 'none'}`,
      `- Current frame index: ${result.currentFrameIndex}`,
      `- Verified exact runtime frame: ${result.verifiedExactRuntimeFrame ? 'yes' : 'no'}`,
      `- Visual match confirmed: ${result.pass ? 'yes' : 'no'}`,
      `- Source crop: ${result.sourceCropPath}`,
      `- Runtime crop: ${result.runtimeCropPath}`,
      `- Difference overlay: ${result.comparisonOverlayPath}`,
      `- Mean absolute error: ${result.diffScore.meanAbsoluteError.toFixed(2)}`,
      `- Changed opaque ratio: ${(result.diffScore.changedOpaqueRatio * 100).toFixed(1)}%`,
      `- Warnings: ${result.warnings.length ? result.warnings.join('; ') : 'none'}`,
      `- Likely mismatch reasons: ${result.likelyMismatchReasons.length ? result.likelyMismatchReasons.join('; ') : 'none'}`,
      '',
    );
  }
  return `${lines.join('\n')}\n`;
}

async function main() {
  await ensureDirs();
  let server = null;
  let browser = null;
  try {
    server = await startServerIfNeeded();
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
    await page.goto(`${BASE_URL}${BASE_URL.includes('?') ? '&' : '?'}artAudit=${Date.now()}`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => window.__bikebrowserRebuildReady === true && Boolean(window.__GAME_ART_AUDIT__), null, { timeout: 30000 });
    await page.evaluate(() => {
      const scene = window.__bikebrowserRebuildGame.scene.getScene('NeighborhoodScene');
      scene?.tweens?.pauseAll?.();
      for (const object of [scene?.player, ...scene.children.list.filter((item) => item?.getData?.('characterId'))]) {
        object?.anims?.pause?.();
      }
    });
    const audit = await page.evaluate(() => {
      const state = window.__GAME_ART_AUDIT__.captureCharacterRuntimeState();
      const canvasRect = window.__bikebrowserRebuildGame.canvas.getBoundingClientRect();
      return {
        ...state,
        canvasRect: {
          x: canvasRect.x,
          y: canvasRect.y,
          width: canvasRect.width,
          height: canvasRect.height,
          devicePixelRatio: window.devicePixelRatio || 1,
        },
      };
    });
    const scenePath = path.join(ARTIFACT_ROOT, 'runtime_scene', 'act1_scene.png');
    await page.screenshot({ path: scenePath, fullPage: false });

    const presentIds = new Set(audit.characters.map((character) => character.characterId));
    const missing = REQUIRED_CHARACTERS.filter((id) => !presentIds.has(id));
    if (missing.length) {
      throw new Error(`Required characters missing from runtime audit: ${missing.join(', ')}`);
    }

    const results = [];
    const requiredCharacters = markCharacterOverlaps(audit.characters.filter((item) => REQUIRED_CHARACTERS.includes(item.characterId)));
    for (const character of requiredCharacters) {
      assertFrameMetadata(character);
      const sourceCropPath = path.join(ARTIFACT_ROOT, 'source_exact', `${character.characterId}.png`);
      const runtimeCropPath = path.join(ARTIFACT_ROOT, 'runtime_crops', `${character.characterId}.png`);
      const comparisonOverlayPath = path.join(ARTIFACT_ROOT, 'diff_overlay', `${character.characterId}.png`);
      const source = await createSourceCrop(character, sourceCropPath);
      const runtimeCrop = await cropRuntimeCharacter(scenePath, runtimeCropPath, screenCropFor(character, audit.canvasRect));
      const comparison = await compareCharacter(character, sourceCropPath, runtimeCropPath, comparisonOverlayPath, runtimeCrop);
      results.push({
        characterId: character.characterId,
        displayName: character.displayName || CHARACTER_ALIASES[character.characterId] || character.characterId,
        textureKey: character.textureKey,
        currentAnimationKey: character.currentAnimationKey,
        currentFrameIndex: character.currentFrameIndex,
        currentFrameName: character.currentFrameName,
        cutX: character.cutX,
        cutY: character.cutY,
        cutWidth: character.cutWidth,
        cutHeight: character.cutHeight,
        transform: {
          x: character.x,
          y: character.y,
          scaleX: character.scaleX,
          scaleY: character.scaleY,
          alpha: character.alpha,
          flipX: character.flipX,
          flipY: character.flipY,
          rotation: character.rotation,
          angle: character.angle,
          originX: character.originX,
          originY: character.originY,
          depth: character.depth,
          visible: character.visible,
        },
        bounds: character.bounds,
        sourceImagePath: source.sourcePath,
        sourceCropPath,
        runtimeCropPath,
        runtimeCrop,
        comparisonOverlayPath,
        diffScore: {
          meanAbsoluteError: comparison.meanAbsoluteError,
          changedOpaqueRatio: comparison.changedOpaqueRatio,
          opaqueCoverage: comparison.opaqueCoverage,
          opaquePixels: comparison.opaquePixels,
        },
        pass: comparison.pass,
        warnings: comparison.warnings,
        likelyMismatchReasons: comparison.likelyMismatchReasons,
        verifiedExactRuntimeFrame: true,
      });
    }

    const contactSheetPath = path.join(ARTIFACT_ROOT, 'contact_sheet', 'act1_character_match_sheet.png');
    await createContactSheet(results, contactSheetPath);

    const report = {
      sceneName: audit.sceneName,
      timestamp: audit.timestamp,
      thresholds: THRESHOLDS,
      runtimeScenePath: scenePath,
      contactSheetPath,
      characters: results,
      pass: results.every((item) => item.pass),
    };
    const jsonPath = path.join(ARTIFACT_ROOT, 'act1_character_visual_audit.json');
    const markdownPath = path.join(ARTIFACT_ROOT, 'act1_character_visual_audit.md');
    await writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
    await writeFile(markdownPath, markdownReport(audit, results, contactSheetPath, scenePath), 'utf8');

    for (const result of results) {
      const status = result.pass ? 'PASS' : 'FAIL';
      console.log(`${status} ${result.displayName}: frame=${result.currentFrameIndex} mae=${result.diffScore.meanAbsoluteError.toFixed(2)} changed=${(result.diffScore.changedOpaqueRatio * 100).toFixed(1)}%`);
    }
    console.log(`Contact sheet: ${contactSheetPath}`);
    console.log(`JSON report: ${jsonPath}`);
    console.log(`Markdown report: ${markdownPath}`);
    if (!report.pass) process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
    if (server) server.kill();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
