import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function appRoutes() {
  const source = readFileSync(join(root, 'src/renderer/App.jsx'), 'utf8');
  return [...source.matchAll(/path="([^"]+)"/g)].map((match) => match[1]);
}

function redirectRules() {
  const lines = readFileSync(join(root, 'public/_redirects'), 'utf8').split('\n');
  return lines
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => line.split(/\s+/)[0]);
}

function isCovered(routePath, rules) {
  return rules.some((rule) => {
    if (rule === '/*') return false;
    if (rule === routePath) return true;
    if (rule.endsWith('/*')) {
      const prefix = rule.slice(0, -1);
      return routePath.startsWith(prefix);
    }
    if (rule.endsWith('/*') === false && routePath.startsWith(`${rule}/`)) return false;
    return false;
  });
}

test('every App.jsx route has a specific Pages rewrite', () => {
  const rules = redirectRules();
  const missing = appRoutes().filter((routePath) => {
    if (routePath === '/' || routePath === '*') return false;
    return !isCovered(routePath, rules);
  });
  assert.deepEqual(missing, []);
});

test('/builder is an explicit 200 rewrite, not only the splat', () => {
  const text = readFileSync(join(root, 'public/_redirects'), 'utf8');
  assert.match(text, /^\/builder \/ 200$/m);
});
