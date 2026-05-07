import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

function git(args, fallback = '') {
  try {
    return execFileSync('git', args, { encoding: 'utf8' }).trim();
  } catch {
    return fallback;
  }
}

const outputPath = path.resolve('public', 'build-info.json');
const sha = process.env.GIT_SHA || process.env.CF_PAGES_COMMIT_SHA || git(['rev-parse', 'HEAD'], 'unknown');
const branch = process.env.GIT_BRANCH || process.env.CF_PAGES_BRANCH || git(['rev-parse', '--abbrev-ref', 'HEAD'], 'unknown');
const status = git(['status', '--porcelain'], '')
  .split('\n')
  .filter(Boolean)
  .filter((line) => !line.endsWith(' public/build-info.json') && !line.endsWith(' public\\build-info.json'));

const buildInfo = {
  app: 'bikebrowser',
  sha,
  shortSha: sha === 'unknown' ? 'unknown' : sha.slice(0, 12),
  branch,
  dirty: status.length > 0,
  buildTimestamp: process.env.BUILD_TIMESTAMP || new Date().toISOString(),
  source: process.env.GITHUB_ACTIONS ? 'github-actions' : 'local',
};

mkdirSync(path.dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(buildInfo, null, 2)}\n`, 'utf8');
console.log(`Wrote ${outputPath} (${buildInfo.shortSha}, dirty=${buildInfo.dirty})`);
