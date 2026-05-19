const express = require('express');
const cors = require('cors');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const dgram = require('dgram');
const { getLocalIpAddress } = require('./network');
const { ServerStorage } = require('./storage');
const { JobQueue } = require('./job-queue');
const { HistoryStore } = require('../storage/history-store');
const {
  dedupeResults,
  compatibilityScore,
  applyNotesDecisionState,
} = require('./ranking-utils');

function createApiServer({ searchPipeline, appDataPath, port = 3001, webPort = 5173 }) {
  const localIp = getLocalIpAddress();
  const app = express();
  app.set('trust proxy', true);

  const storage = new ServerStorage(path.join(appDataPath, 'server-state.json'));
  const historyStore = new HistoryStore(appDataPath);

  // Wire history into the search pipeline
  if (searchPipeline && typeof searchPipeline.setHistoryStore === 'function') {
    searchPipeline.setHistoryStore(historyStore);
  }

  const connectedDevices = new Map();
  const searchCache = new Map();
  const rankCache = new Map();

  const rankQueue = new JobQueue(async (payload) => {
    return runHeavyRank(payload);
  });

  app.use(express.json({ limit: '5mb' }));
  app.use(cors({
    origin: true,
    credentials: true,
  }));

  function requireApiKey(req, res, next) {
    const expected = process.env.API_KEY || 'dev-local-key';
    const key = req.headers['x-api-key'];
    if (!key || key !== expected) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    return next();
  }

  function sendWakeOnLan(mac, host = '255.255.255.255', wolPort = 9) {
    return new Promise((resolve, reject) => {
      const macParts = String(mac || '')
        .replace(/-/g, ':')
        .split(':')
        .filter(Boolean);

      if (macParts.length !== 6 || macParts.some((part) => part.length !== 2 || Number.isNaN(parseInt(part, 16)))) {
        reject(new Error('Invalid MAC address format'));
        return;
      }

      const macBytes = macParts.map((part) => parseInt(part, 16));
      const buffer = Buffer.alloc(102);

      for (let i = 0; i < 6; i += 1) {
        buffer[i] = 0xff;
      }

      for (let packet = 1; packet <= 16; packet += 1) {
        macBytes.forEach((byte, index) => {
          buffer[packet * 6 + index] = byte;
        });
      }

      const socket = dgram.createSocket('udp4');
      socket.on('error', (error) => {
        socket.close();
        reject(error);
      });

      socket.bind(() => {
        socket.setBroadcast(true);
        socket.send(buffer, 0, buffer.length, wolPort, host, (error) => {
          socket.close();
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
    });
  }

  function requireWakeAuth(req, res, next) {
    const expectedApiKey = process.env.API_KEY || 'dev-local-key';
    const expectedPin = process.env.WAKE_PIN || '';
    const apiKey = req.headers['x-api-key'];
    const providedPin = String(req.headers['x-wake-pin'] || req.body?.pin || '');

    const apiAllowed = Boolean(apiKey && apiKey === expectedApiKey);
    const pinAllowed = Boolean(expectedPin && providedPin && providedPin === expectedPin);

    if (!apiAllowed && !pinAllowed) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    req.wakeAuthMethod = apiAllowed ? 'api-key' : 'pin';
    return next();
  }

  app.use((req, _res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const ua = req.headers['user-agent'] || 'unknown';
    console.log(`[API] ${req.method} ${req.url} from ${ip}`);

    const isMobile = /android|iphone|ipad|mobile/i.test(ua);
    if (isMobile) {
      const deviceKey = String(req.headers['x-device-id'] || ip);
      connectedDevices.set(deviceKey, { lastSeen: Date.now(), userAgent: ua, ip: String(ip) });
    }

    next();
  });

  const devEditorEnabled = process.env.NODE_ENV !== 'production' && process.env.BIKEBROWSER_DEV_EDITOR === '1';
  const devEditorToken = devEditorEnabled ? crypto.randomBytes(32).toString('hex') : null;
  const projectRoot = path.resolve(process.cwd(), 'BikeBrowserWorld');
  const auditRoot = path.resolve(process.cwd(), 'project_audit');
  const editorWriteLog = path.join(auditRoot, 'editor_writes.log');

  function isLoopbackRequest(req) {
    const candidates = [
      req.ip,
      req.socket && req.socket.remoteAddress,
      req.headers['x-forwarded-for'],
    ].filter(Boolean).flatMap((value) => String(value).split(',').map((part) => part.trim()));
    return candidates.some((value) => (
      value === '127.0.0.1' ||
      value === '::1' ||
      value === '::ffff:127.0.0.1' ||
      value === 'localhost'
    ));
  }

  function requireDevEditorLocal(req, res, next) {
    if (!isLoopbackRequest(req)) {
      return res.status(403).json({ success: false, error: 'Dev editor endpoint is localhost-only' });
    }
    return next();
  }

  function requireDevEditorToken(req, res, next) {
    const token = String(req.headers['x-dev-editor-token'] || '');
    if (!devEditorToken || token !== devEditorToken) {
      return res.status(401).json({ success: false, error: 'Invalid dev editor token' });
    }
    return next();
  }

  function resolveEditorPath(relativePath) {
    const raw = String(relativePath || '').replace(/\\\\/g, '/');
    if (!raw || raw.includes('..') || path.isAbsolute(raw)) {
      throw new Error('Invalid scene path');
    }
    const ext = path.extname(raw).toLowerCase();
    if (ext !== '.tscn' && ext !== '.tres') {
      throw new Error('Only .tscn and .tres files can be edited');
    }
    const absolute = path.resolve(projectRoot, raw);
    const relative = path.relative(projectRoot, absolute);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      throw new Error('Scene path is outside the Godot project');
    }
    return { absolute, relative: relative.replace(/\\\\/g, '/') };
  }

  function sha256(contents) {
    return crypto.createHash('sha256').update(contents).digest('hex');
  }

  function pruneBackups(backupDir, baseName) {
    const prefix = baseName + '.bak.';
    const backups = fs.readdirSync(backupDir)
      .filter((name) => name.startsWith(prefix))
      .map((name) => ({ name, fullPath: path.join(backupDir, name), stat: fs.statSync(path.join(backupDir, name)) }))
      .sort((a, b) => b.stat.mtimeMs - a.stat.mtimeMs);
    backups.slice(20).forEach((entry) => fs.rmSync(entry.fullPath, { force: true }));
  }

  function backupFile(filePath) {
    const backupDir = path.join(path.dirname(filePath), '.editor_backups');
    fs.mkdirSync(backupDir, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, path.basename(filePath) + '.bak.' + timestamp);
    fs.copyFileSync(filePath, backupPath);
    pruneBackups(backupDir, path.basename(filePath));
    return backupPath;
  }

  function appendEditorWriteLog(relativePath, contents) {
    fs.mkdirSync(auditRoot, { recursive: true });
    const bytes = Buffer.byteLength(contents, 'utf8');
    const digest = sha256(contents);
    fs.appendFileSync(editorWriteLog, new Date().toISOString() + ' ' + relativePath + ' ' + bytes + ' ' + digest + '\n', 'utf8');
    return { bytes, sha256: digest };
  }

  function vectorToTscn(value) {
    if (!value || typeof value !== 'object') return null;
    const x = Number(value.x);
    const y = Number(value.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
    return 'Vector2(' + Number(x.toFixed(3)) + ', ' + Number(y.toFixed(3)) + ')';
  }

  function scalarToTscn(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return null;
    return String(Number(n.toFixed(6)));
  }

  function valueToTscn(property, value) {
    if (property === 'position' || property === 'scale') return vectorToTscn(value);
    if (property === 'rotation' || property === 'z_index') return scalarToTscn(value);
    if (property === 'visible') return value ? 'true' : 'false';
    return null;
  }

  function findNodeBlock(lines, nodePath) {
    const normalized = String(nodePath || '').replace(/^\/+/, '');
    const parts = normalized.split('/').filter(Boolean);
    if (parts.length === 0) return null;
    const name = parts[parts.length - 1];
    const parent = parts.length === 1 ? '.' : parts.slice(0, -1).join('/');
    let start = -1;
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      if (!line.startsWith('[node ') || !line.includes('name="' + name + '"')) {
        continue;
      }
      const hasParent = line.includes('parent="' + parent + '"');
      const isRoot = parent === '.' && !line.includes('parent=');
      if (hasParent || isRoot) {
        start = i;
        break;
      }
    }
    if (start < 0) {
      for (let i = 0; i < lines.length; i += 1) {
        const line = lines[i];
        if (line.startsWith('[node ') && line.includes('name="' + name + '"')) {
          start = i;
          break;
        }
      }
    }
    if (start < 0) return null;
    let end = lines.length;
    for (let i = start + 1; i < lines.length; i += 1) {
      if (lines[i].startsWith('[node ')) {
        end = i;
        break;
      }
    }
    return { start, end };
  }

  function applyScenePatches(original, patches) {
    const lines = original.split(/\r\n|\n|\r/);
    for (const patch of patches || []) {
      const nodePath = String(patch.nodePath || '');
      const properties = patch.properties || {};
      const block = findNodeBlock(lines, nodePath);
      if (!block) {
        const wanted = String(nodePath || '').split('/').filter(Boolean).pop() || '';
        const matches = lines.filter((line) => line.startsWith('[node ') && line.includes('name="' + wanted + '"')).slice(0, 3);
        throw new Error('Node not found in scene text: ' + nodePath + ' matches=' + JSON.stringify(matches));
      }
      for (const [property, value] of Object.entries(properties)) {
        const rendered = valueToTscn(property, value);
        if (rendered == null) throw new Error('Unsupported property patch: ' + property);
        const prefix = property + ' =';
        let replaced = false;
        for (let i = block.start + 1; i < block.end; i += 1) {
          if (lines[i].startsWith(prefix)) {
            lines[i] = property + ' = ' + rendered;
            replaced = true;
            break;
          }
        }
        if (!replaced) {
          lines.splice(block.end, 0, property + ' = ' + rendered);
          block.end += 1;
        }
      }
    }
    return lines.join('\n');
  }

  if (devEditorEnabled) {
    app.get('/api/dev-token', requireDevEditorLocal, (_req, res) => {
      res.json({ success: true, token: devEditorToken, projectRoot });
    });

    app.post('/api/dev-editor/save-scene', requireDevEditorLocal, requireDevEditorToken, (req, res) => {
      try {
        const body = req.body || {};
        const { absolute, relative } = resolveEditorPath(body.relativePath);
        if (!fs.existsSync(absolute)) {
          return res.status(404).json({ success: false, error: 'Scene file not found' });
        }
        const current = fs.readFileSync(absolute, 'utf8');
        const stat = fs.statSync(absolute);
        const currentHash = sha256(current);
        if (body.expectedHash && body.expectedHash !== currentHash) {
          return res.status(409).json({ success: false, error: 'Scene file changed externally', currentHash, mtimeMs: stat.mtimeMs });
        }
        if (body.expectedMtimeMs && Math.abs(Number(body.expectedMtimeMs) - stat.mtimeMs) > 2) {
          return res.status(409).json({ success: false, error: 'Scene file changed externally', currentHash, mtimeMs: stat.mtimeMs });
        }
        const nextContents = typeof body.contents === 'string' ? body.contents : applyScenePatches(current, body.patches || []);
        if (Buffer.byteLength(nextContents, 'utf8') > 5 * 1024 * 1024) {
          return res.status(413).json({ success: false, error: 'Scene save exceeds 5 MB limit' });
        }
        const backupPath = backupFile(absolute);
        const tmpPath = absolute + '.tmp';
        fs.writeFileSync(tmpPath, nextContents, 'utf8');
        fs.renameSync(tmpPath, absolute);
        const meta = appendEditorWriteLog(relative, nextContents);
        res.json({ success: true, relativePath: relative, backupPath, ...meta });
      } catch (error) {
        res.status(400).json({ success: false, error: error.message });
      }
    });
  }

  function getCacheKey(prefix, payload) {
    return `${prefix}:${JSON.stringify(payload || {})}`;
  }

  async function doSearch(payload = {}) {
    const query = String(payload.query || '').trim();
    const options = payload.options || {};
    if (!query) {
      return { query, results: [], grouped: { build: [], buy: [], watch: [] }, totalResults: 0 };
    }

    const key = getCacheKey('search', { query, options });
    const cached = searchCache.get(key);
    if (cached && Date.now() - cached.ts < 60 * 1000) {
      return cached.value;
    }

    const value = searchPipeline
      ? await searchPipeline.search(query, options)
      : { query, results: [], grouped: { build: [], buy: [], watch: [] }, totalResults: 0 };

    searchCache.set(key, { ts: Date.now(), value });
    return value;
  }

  async function runHeavyRank(payload = {}) {
    const query = String(payload.query || '').trim();
    const options = payload.options || {};
    const inputResults = Array.isArray(payload.results) ? payload.results : null;

    const sourceResults = inputResults || (await doSearch({ query, options })).results || [];

    const withDecision = applyNotesDecisionState(sourceResults, storage.getPreferences());
    const clusters = dedupeResults(withDecision);
    const deduped = clusters.map((cluster) => {
      const sorted = [...cluster.items].sort((a, b) => (b.compositeScore || b.score || 0) - (a.compositeScore || a.score || 0));
      const best = sorted[0];
      return {
        ...best,
        duplicateCount: sorted.length - 1,
        duplicates: sorted.slice(1),
      };
    });

    const compatibleScore = compatibilityScore(payload.compatibility || {});
    const ranked = deduped
      .map((item) => ({
        ...item,
        compatibilityScore: compatibleScore,
        score: Number(item.compositeScore || item.score || 0),
      }))
      .sort((a, b) => b.score - a.score);

    return {
      ranked,
      compatibilityScore: compatibleScore,
      total: ranked.length,
    };
  }

  app.post('/search', requireApiKey, async (req, res) => {
    try {
      const data = await Promise.race([
        doSearch(req.body || {}),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Search request timeout')), 20000)
        )
      ]);
      res.json({ success: true, ...data });
    } catch (error) {
      console.error('[API] /search error:', error.message);
      const query = String((req.body || {}).query || '').trim();
      res.json({
        success: true,
        query,
        results: [],
        grouped: { build: [], buy: [], watch: [] },
        totalResults: 0,
        metadata: { error: error.message, tier: 'timeout-fallback' }
      });
    }
  });

  app.post('/rank', requireApiKey, async (req, res) => {
    try {
      const payload = req.body || {};
      const key = getCacheKey('rank', payload);
      const cached = rankCache.get(key);
      if (cached && Date.now() - cached.ts < 120 * 1000) {
        res.json({ success: true, cached: true, ...cached.value });
        return;
      }

      const quickBase = Array.isArray(payload.results) ? payload.results : [];
      const initial = quickBase
        .map((item) => ({ ...item, score: Number(item.compositeScore || item.score || 0) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 12);

      const job = rankQueue.enqueue(payload);
      const result = {
        mode: 'incremental',
        initial,
        jobId: job.id,
      };

      rankCache.set(key, { ts: Date.now(), value: result });
      res.json({ success: true, ...result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get('/rank/:jobId', requireApiKey, (req, res) => {
    const job = rankQueue.get(req.params.jobId);
    if (!job) {
      res.status(404).json({ success: false, error: 'Job not found' });
      return;
    }

    res.json({
      success: true,
      status: job.status,
      result: job.result,
      error: job.error,
    });
  });

  app.get('/projects', requireApiKey, (_req, res) => {
    res.json({ success: true, projects: storage.getProjects() });
  });

  app.post('/projects', requireApiKey, (req, res) => {
    const project = storage.createProject(req.body || {});
    res.json({ success: true, project });
  });

  app.post('/notes', requireApiKey, (req, res) => {
    const note = storage.addNote(req.body || {});
    res.json({ success: true, note });
  });

  app.get('/notes', requireApiKey, (_req, res) => {
    res.json({ success: true, notes: storage.getNotes() });
  });

  app.get('/api/health', (_req, res) => {
    res.json({ success: true, status: 'ok' });
  });

  app.get('/health', (_req, res) => {
    res.json({ success: true, status: 'ok' });
  });

  app.get('/connection-status', requireApiKey, (_req, res) => {
    const now = Date.now();
    const devices = Array.from(connectedDevices.entries())
      .map(([id, value]) => ({ id, ...value, active: now - value.lastSeen < 30 * 1000 }))
      .filter((entry) => now - entry.lastSeen < 10 * 60 * 1000);

    res.json({ success: true, devices, activeCount: devices.filter((d) => d.active).length });
  });

  // --- Unified search endpoints ---

  app.post('/search/text', requireApiKey, async (req, res) => {
    try {
      if (!searchPipeline) {
        return res.json({ success: false, error: 'Search pipeline not available' });
      }
      const query = String((req.body || {}).query || '').trim();
      const options = (req.body || {}).options || {};
      const projectContext = (req.body || {}).projectContext || null;

      const data = await Promise.race([
        searchPipeline.runSearchPipeline({ _inputType: 'text', query, options, projectContext }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 20000))
      ]);
      res.json({ success: true, ...data });
    } catch (error) {
      console.error('[API] /search/text error:', error.message);
      res.json({ success: true, query: String((req.body || {}).query || ''), results: [], grouped: { build: [], buy: [], watch: [] }, totalResults: 0, metadata: { error: error.message } });
    }
  });

  app.post('/search/voice', requireApiKey, async (req, res) => {
    try {
      if (!searchPipeline) {
        return res.json({ success: false, error: 'Search pipeline not available' });
      }
      const transcript = String((req.body || {}).transcript || '').trim();
      if (!transcript) {
        return res.json({ success: false, error: 'No transcript provided' });
      }

      const data = await Promise.race([
        searchPipeline.processVoiceInput(transcript),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 25000))
      ]);
      res.json({ success: true, ...data });
    } catch (error) {
      console.error('[API] /search/voice error:', error.message);
      res.json({ success: true, query: '', results: [], grouped: { build: [], buy: [], watch: [] }, totalResults: 0, metadata: { error: error.message } });
    }
  });

  app.post('/search/image', requireApiKey, express.json({ limit: '10mb' }), async (req, res) => {
    try {
      if (!searchPipeline) {
        return res.json({ success: false, error: 'Search pipeline not available' });
      }
      const imageBase64 = String((req.body || {}).image || '').trim();
      if (!imageBase64) {
        return res.json({ success: false, error: 'No image data provided' });
      }
      // Basic size check (10 MB base64 ≈ 7.5 MB image)
      if (imageBase64.length > 10 * 1024 * 1024) {
        return res.status(413).json({ success: false, error: 'Image too large (max 10MB)' });
      }

      const data = await Promise.race([
        searchPipeline.processImageInput(imageBase64),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 30000))
      ]);
      res.json({ success: true, ...data });
    } catch (error) {
      console.error('[API] /search/image error:', error.message);
      res.json({ success: true, query: '', results: [], grouped: { build: [], buy: [], watch: [] }, totalResults: 0, metadata: { error: error.message } });
    }
  });

  // --- History endpoints ---

  app.get('/history', requireApiKey, (req, res) => {
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    res.json({ success: true, searches: historyStore.getSearchHistory(limit) });
  });

  app.get('/history/similar', requireApiKey, (req, res) => {
    const query = String(req.query.q || '').trim();
    if (!query) {
      return res.json({ success: true, items: [] });
    }
    const items = historyStore.findSimilarItems(query);
    res.json({ success: true, items });
  });

  app.get('/history/projects', requireApiKey, (_req, res) => {
    res.json({ success: true, projects: historyStore.getProjects() });
  });

  app.post('/history/projects', requireApiKey, (req, res) => {
    const name = String((req.body || {}).name || '').trim();
    if (!name) {
      return res.json({ success: false, error: 'Project name required' });
    }
    const project = historyStore.createProject(name);
    res.json({ success: true, project });
  });

  app.get('/history/projects/:id', requireApiKey, (req, res) => {
    const history = historyStore.getProjectHistory(req.params.id);
    res.json({ success: true, ...history });
  });

  app.post('/history/projects/:id/items', requireApiKey, (req, res) => {
    const entry = historyStore.addItemToProject(req.params.id, req.body || {});
    if (!entry) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    res.json({ success: true, item: entry });
  });

  app.post('/history/projects/:id/notes', requireApiKey, (req, res) => {
    const note = String((req.body || {}).text || '').trim();
    const entry = historyStore.addNoteToProject(req.params.id, note);
    if (!entry) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    res.json({ success: true, note: entry });
  });

  // --- Compare endpoint ---

  app.post('/compare', requireApiKey, async (req, res) => {
    try {
      if (!searchPipeline) {
        return res.json({ success: false, error: 'Pipeline not available' });
      }
      const { itemA, itemB } = req.body || {};
      if (!itemA || !itemB) {
        return res.json({ success: false, error: 'Both itemA and itemB are required' });
      }
      const result = await searchPipeline.providerManager.compareItems(itemA, itemB);
      res.json({ success: true, ...result });
    } catch (error) {
      console.error('[API] /compare error:', error.message);
      res.json({ success: false, error: error.message });
    }
  });

  async function handleWakeRequest(req, res) {
    const timestamp = new Date().toISOString();
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    const deviceId = req.headers['x-device-id'] || 'unknown';

    try {
      const mac = String(req.body?.mac || '').trim();
      if (!mac) {
        res.status(400).json({ success: false, error: 'MAC address is required' });
        return;
      }

      await sendWakeOnLan(mac, process.env.WOL_BROADCAST || '255.255.255.255', Number(process.env.WOL_PORT || 9));

      console.log(`[WAKE] Triggered at ${timestamp} by ${ip} (device=${deviceId}, auth=${req.wakeAuthMethod})`);
      console.log(`[WAKE] UA: ${userAgent}`);

      res.json({ success: true, status: 'wake-sent', timestamp });
    } catch (error) {
      console.error(`[WAKE] Failed at ${timestamp} from ${ip}:`, error.message);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  app.post('/api/wake', requireWakeAuth, handleWakeRequest);

  app.post('/wake', requireWakeAuth, handleWakeRequest);

  let server = null;
  let qrDataUrl = null;

  async function start() {
    if (server) {
      return {
        localIp,
        apiUrl: `http://${localIp}:${port}`,
        webUrl: `http://${localIp}:${webPort}`,
        publicUrl: process.env.PUBLIC_BASE_URL || null,
        qrDataUrl,
      };
    }

    server = await new Promise((resolve, reject) => {
      const host = devEditorEnabled ? '127.0.0.1' : '0.0.0.0';
      const listener = app.listen(port, host, () => resolve(listener));
      listener.on('error', reject);
    });

    const webUrl = `http://${localIp}:${webPort}`;
    const publicUrl = process.env.PUBLIC_BASE_URL || null;
    qrDataUrl = await QRCode.toDataURL(publicUrl || webUrl);

    return {
      localIp,
      apiUrl: `http://${localIp}:${port}`,
      webUrl,
      publicUrl,
      qrDataUrl,
    };
  }

  async function stop() {
    if (!server) {
      return;
    }

    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });

    server = null;
  }

  function getConnectionInfo() {
    return {
      localIp,
      apiUrl: `http://${localIp}:${port}`,
      webUrl: `http://${localIp}:${webPort}`,
      publicUrl: process.env.PUBLIC_BASE_URL || null,
      qrDataUrl,
    };
  }

  return {
    start,
    stop,
    getConnectionInfo,
  };
}

module.exports = {
  createApiServer,
};
