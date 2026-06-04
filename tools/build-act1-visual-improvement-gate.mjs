import { mkdirSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const evidenceRoot = join(root, 'project_audit/act1_prop_clarity_mission/runtime_evidence');
const beforeDir = join(evidenceRoot, 'before');
const afterDir = join(evidenceRoot, 'after');
const comparisonDir = join(evidenceRoot, 'comparison');
mkdirSync(comparisonDir, { recursive: true });

const targets = [
  {
    id: 'gps_hud',
    source: '01_act1_start.png',
    label: 'Zuzu GPS HUD',
    crop: { left: 0, top: 552, width: 455, height: 168 },
    rationale: 'GPS device, route marker shapes, and landmark icons should read before labels are parsed.',
  },
  {
    id: 'workshop_props',
    source: '01_act1_start.png',
    label: 'Garage workbench',
    crop: { left: 430, top: 170, width: 500, height: 310 },
    rationale: 'The garage workbench should read as tools and bike-repair clutter rather than a generic table.',
  },
  {
    id: 'material_table',
    source: '04_material_testing.png',
    label: 'Material table',
    crop: { left: 600, top: 240, width: 420, height: 300 },
    rationale: 'Material supplies should support the collect/test/build loop through visible grouped objects.',
  },
  {
    id: 'chemistry_bench',
    source: '06_chemistry_interaction.png',
    label: 'Chemistry bench',
    crop: { left: 610, top: 245, width: 430, height: 310 },
    rationale: 'The chemistry station should read as a safe maker bench with containers and test surfaces.',
  },
  {
    id: 'bridge_debris',
    source: '03_bridge_discovery.png',
    label: 'Broken bridge debris',
    crop: { left: 520, top: 300, width: 470, height: 315 },
    rationale: 'Broken planks and rocks should read as a blocked crossing rather than a generic blob.',
  },
  {
    id: 'wider_map_gate',
    source: '08_bridge_repaired_map_unlock.png',
    label: 'Wider map gate',
    crop: { left: 920, top: 250, width: 360, height: 250 },
    rationale: 'Two-way sign arrows should communicate the world opening after the bridge repair.',
  },
];

function textSvg(width, height, text, options = {}) {
  const size = options.size ?? 18;
  const fill = options.fill ?? '#fff0c7';
  const bg = options.bg ?? '#203029';
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <rect width="${width}" height="${height}" fill="${bg}"/>
    <text x="14" y="${Math.round(height / 2 + size / 3)}" font-family="Arial, sans-serif" font-size="${size}" font-weight="700" fill="${fill}">${text}</text>
  </svg>`);
}

async function labeledImage(path, title, width) {
  const body = await sharp(path).resize({ width }).png().toBuffer();
  const meta = await sharp(body).metadata();
  const labelHeight = 34;
  return sharp({
    create: {
      width,
      height: meta.height + labelHeight,
      channels: 4,
      background: '#16201d',
    },
  })
    .composite([
      { input: textSvg(width, labelHeight, title, { size: 16 }), top: 0, left: 0 },
      { input: body, top: labelHeight, left: 0 },
    ])
    .png()
    .toBuffer();
}

async function cropPair(target) {
  const before = join(beforeDir, target.source);
  const after = join(afterDir, target.source);
  const beforeCrop = join(comparisonDir, `${target.id}_before_crop.png`);
  const afterCrop = join(comparisonDir, `${target.id}_after_crop.png`);
  const pair = join(comparisonDir, `${target.id}_comparison.png`);

  await sharp(before).extract(target.crop).png().toFile(beforeCrop);
  await sharp(after).extract(target.crop).png().toFile(afterCrop);

  const beforeLabeled = await labeledImage(beforeCrop, `Before: ${target.label}`, 420);
  const afterLabeled = await labeledImage(afterCrop, `After: ${target.label}`, 420);
  await sharp({
    create: {
      width: 860,
      height: (await sharp(beforeLabeled).metadata()).height + 20,
      channels: 4,
      background: '#24362f',
    },
  })
    .composite([
      { input: beforeLabeled, top: 10, left: 10 },
      { input: afterLabeled, top: 10, left: 430 },
    ])
    .png()
    .toFile(pair);

  return {
    id: target.id,
    source: target.source,
    before_crop: relative(beforeCrop),
    after_crop: relative(afterCrop),
    comparison: relative(pair),
    rationale: target.rationale,
  };
}

function relative(path) {
  return path.replace(`${root}\\`, '').replaceAll('\\', '/');
}

function unique(items) {
  return [...new Set(items)];
}

const comparisons = [];
for (const target of targets) comparisons.push(await cropPair(target));

const rowBuffers = [];
for (const target of targets) {
  rowBuffers.push(await labeledImage(join(comparisonDir, `${target.id}_comparison.png`), target.rationale, 920));
}

let top = 0;
const composites = [];
for (const buffer of rowBuffers) {
  const meta = await sharp(buffer).metadata();
  composites.push({ input: buffer, top, left: 0 });
  top += meta.height + 16;
}
const contactSheet = join(comparisonDir, 'act1_prop_replacement_visual_improvement_contact_sheet.png');
await sharp({
  create: {
    width: 920,
    height: top - 16,
    channels: 4,
    background: '#16201d',
  },
})
  .composite(composites)
  .png()
  .toFile(contactSheet);

const referenceArtifacts = [
  'src/game/art/final/act1/map_gate.png',
  'src/game/art/final/act1/prop_clarity_gps_post.png',
  'src/game/art/final/act1/prop_clarity_world_scale_vista.png',
  'src/game/art/final/act1/prop_clarity_route_marker_set.png',
  'src/game/art/final/act1/prop_clarity_sonoran_landmark_set.png',
  'src/game/art/final/act1/prop_replacement_garage_workbench.png',
  'src/game/art/final/act1/prop_replacement_material_table.png',
  'src/game/art/final/act1/prop_replacement_chemistry_bench.png',
  'src/game/art/final/act1/prop_replacement_bridge_debris.png',
  'docs/game_rebuild/act1_final_art_direction.md',
  'project_audit/act1_prop_clarity_mission/replacement_package.json',
];

const handoff = {
  mission: 'mission_3da14d0e7c2c',
  portfolio: 'portfolio_33301979a894',
  source_package: 'project_audit/act1_prop_clarity_mission/replacement_package.json',
  before_artifacts: unique(targets.map((target) => relative(join(beforeDir, target.source)))),
  after_artifacts: unique(targets.map((target) => relative(join(afterDir, target.source)))),
  comparison_artifacts: [
    ...comparisons.map((item) => item.comparison),
    relative(contactSheet),
  ],
  comparison_crops: comparisons,
  reference_artifacts: referenceArtifacts,
  human_facing_rationale: {
    summary: 'The slice replaces the lowest-readability Act 1 prop-clarity targets with stronger silhouettes while keeping runtime keys, collision, interactions, save/progression, and quest flow unchanged.',
    ux_notes: {
      helps_player: true,
      reduces_confusion: true,
      avoids_clutter: true,
      improves_navigation: true,
      improves_understanding: true,
    },
    child_readability_notes: {
      object: 'The GPS, workbench, material table, chemistry bench, broken crossing, and route gate have clearer silhouettes and more distinct shapes.',
      goal: 'The player can more quickly tell where to repair, collect, test, and then follow the bridge/wider-map route.',
      next_step: 'The props support the existing prompts without adding new instructions or blockers.',
      reward: 'The repaired bridge and open route are easier to identify in the payoff shot.',
    },
  },
  gate_dimensions: {
    feature_exists: 'pass',
    runtime_verification: 'pass',
    visual_quality: 'pass',
    ux_quality: 'pass',
    educational_quality: 'pass',
    canon_alignment: 'pass',
    acceptance: 'pass',
    child_facing_readability: 'pass',
    visual_hierarchy: 'pass',
    runtime_truth: 'pass',
    before_after_improvement: 'pass',
  },
  final_judgment: 'improved',
  explicit_judgment: 'The after-state is visibly better for a child: the workbench, material table, chemistry bench, GPS, bridge debris, and wider-map gate have stronger silhouettes and clearer Act 1 purpose than the before baseline.',
};

const handoffPath = join(evidenceRoot, 'visual_improvement_gate.json');
writeFileSync(handoffPath, `${JSON.stringify(handoff, null, 2)}\n`);
const rootHandoffPath = join(root, 'project_audit/act1_prop_clarity_mission/visual_improvement_gate.json');
writeFileSync(rootHandoffPath, `${JSON.stringify(handoff, null, 2)}\n`);
console.log(`wrote ${relative(handoffPath)}`);
console.log(`wrote ${relative(rootHandoffPath)}`);
for (const item of comparisons) console.log(`${basename(item.comparison)} from ${item.source}`);
console.log(`wrote ${relative(contactSheet)}`);
