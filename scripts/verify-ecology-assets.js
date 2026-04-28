/**
 * Verify the ecology asset pack:
 *   1. manifest.json parses
 *   2. every entry references a file that exists on disk
 *   3. every PNG is 128x128 with alpha
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '..');
const PACK_DIR = path.join(ROOT, 'public', 'assets', 'ecology');
const MANIFEST = path.join(PACK_DIR, 'manifest.json');

async function main() {
  const raw = fs.readFileSync(MANIFEST, 'utf8');
  const manifest = JSON.parse(raw);
  const errors = [];
  let count = 0;

  for (const category of ['plants', 'animals', 'terrain']) {
    const bucket = manifest[category];
    if (!bucket) {
      errors.push(`manifest.${category} missing`);
      continue;
    }
    for (const [name, entry] of Object.entries(bucket)) {
      const file = path.join(PACK_DIR, entry.file);
      if (!fs.existsSync(file)) {
        errors.push(`missing file: ${category}/${name} -> ${entry.file}`);
        continue;
      }
      const meta = await sharp(file).metadata();
      if (meta.width !== 128 || meta.height !== 128) {
        errors.push(`wrong size ${meta.width}x${meta.height}: ${entry.file}`);
      }
      if (!meta.hasAlpha) {
        errors.push(`no alpha channel: ${entry.file}`);
      }
      count++;
    }
  }

  console.log(`Verified ${count} entries in manifest.json`);
  if (errors.length) {
    console.error('Errors:');
    errors.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  }
  console.log('All checks passed.');
}

main().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});
