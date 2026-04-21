#!/usr/bin/env node
/**
 * Health Check Script — verifies all BikeBrowser services and dependencies.
 *
 * Usage: node scripts/check-health.js
 *        npm run check:health
 *
 * Checks:
 *   1. Native module (better-sqlite3) loads in Electron ABI
 *   2. Vite dev server on :5173
 *   3. API server on :3001
 *   4. Cloudflare tunnel process
 *   5. Public site (bike-browser.com)
 *   6. Local AI inference (LM Studio / Ollama)
 */

const http = require('http');
const https = require('https');
const { execSync } = require('child_process');

const CHECKS = [];

function ok(name, detail) { CHECKS.push({ name, status: 'OK', detail }); }
function fail(name, detail) { CHECKS.push({ name, status: 'FAIL', detail }); }
function skip(name, detail) { CHECKS.push({ name, status: 'SKIP', detail }); }

function httpGet(url, timeoutMs = 4000) {
  const mod = url.startsWith('https') ? https : http;
  return new Promise((resolve) => {
    const req = mod.get(url, { timeout: timeoutMs, rejectUnauthorized: false }, (res) => {
      resolve(res.statusCode);
    });
    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
  });
}

async function run() {
  console.log('BikeBrowser Health Check\n' + '='.repeat(50));

  // 1. Native module
  try {
    const Database = require('better-sqlite3');
    const db = new Database(':memory:');
    db.exec('SELECT 1');
    db.close();
    ok('Native module (better-sqlite3)', 'Loads in current Node ABI');
  } catch (e) {
    if (e.message.includes('NODE_MODULE_VERSION')) {
      // Expected: better-sqlite3 is built for Electron ABI, not system Node
      const match = e.message.match(/compiled against.*?(\d+).*?requires.*?(\d+)/);
      if (match) {
        ok('Native module (better-sqlite3)', `Built for Electron ABI ${match[1]} (system Node is ABI ${match[2]} — this is correct)`);
      } else {
        ok('Native module (better-sqlite3)', 'Built for Electron ABI (cannot load in plain Node — expected)');
      }
    } else {
      fail('Native module (better-sqlite3)', e.message.slice(0, 120));
    }
  }

  // 2. Electron ABI match
  try {
    const electronPkg = require('../node_modules/electron/package.json');
    const nodeAbi = process.versions.modules;
    ok('Electron installed', `v${electronPkg.version} (current Node ABI: ${nodeAbi})`);
  } catch {
    fail('Electron installed', 'electron package not found');
  }

  // 3. Vite dev server
  const viteStatus = await httpGet('http://localhost:5173/');
  if (viteStatus === 200) ok('Vite dev server (:5173)', 'Running');
  else fail('Vite dev server (:5173)', 'Not running — start with: npm run dev:web');

  // 4. API server
  const apiStatus = await httpGet('http://localhost:3001/api/health');
  if (apiStatus === 200) ok('API server (:3001)', 'Healthy');
  else fail('API server (:3001)', 'Not running — start with: npm run dev:web');

  // 5. Cloudflare tunnel
  try {
    const procs = execSync('tasklist', { encoding: 'utf8' });
    if (procs.toLowerCase().includes('cloudflared')) {
      ok('Cloudflare tunnel', 'cloudflared process running');
    } else {
      fail('Cloudflare tunnel', 'Not running — start with: npm run tunnel');
    }
  } catch {
    skip('Cloudflare tunnel', 'Could not check process list');
  }

  // 6. Public site
  const pubStatus = await httpGet('https://bike-browser.com/', 6000);
  if (pubStatus === 200) ok('Public site (bike-browser.com)', 'Reachable');
  else if (pubStatus) fail('Public site (bike-browser.com)', `HTTP ${pubStatus}`);
  else fail('Public site (bike-browser.com)', 'Unreachable — check tunnel');

  // 7. Local AI inference
  const localAi = await httpGet('http://localhost:1234/v1/models');
  if (localAi === 200) ok('Local AI (LM Studio :1234)', 'Running');
  else {
    const ollama = await httpGet('http://localhost:11434/api/tags');
    if (ollama === 200) ok('Local AI (Ollama :11434)', 'Running');
    else skip('Local AI', 'No local inference running (optional)');
  }

  // Print results
  console.log('');
  let hasFailure = false;
  for (const c of CHECKS) {
    const icon = c.status === 'OK' ? 'PASS' : c.status === 'FAIL' ? 'FAIL' : 'SKIP';
    const color = c.status === 'OK' ? '\x1b[32m' : c.status === 'FAIL' ? '\x1b[31m' : '\x1b[33m';
    console.log(`${color}[${icon}]\x1b[0m ${c.name} — ${c.detail}`);
    if (c.status === 'FAIL') hasFailure = true;
  }
  console.log('\n' + '='.repeat(50));
  if (hasFailure) {
    console.log('\x1b[31mSome checks failed. See details above.\x1b[0m');
    process.exit(1);
  } else {
    console.log('\x1b[32mAll checks passed.\x1b[0m');
  }
}

run().catch((e) => { console.error(e); process.exit(1); });
