// Load environment variables FIRST
require('dotenv').config();

const { app, BrowserWindow, ipcMain, shell, session } = require('electron');
const http = require('http');
const fs = require('fs');
const net = require('net');
const path = require('path');
const { createApiServer } = require('../server/api-server');
const youtubeInterceptor = require('./youtubeInterceptor');
const rankingEngine = require('../services/rankingEngine');
const { SearchPipeline } = require('./search-pipeline');
const { FallbackHandler } = require('./deepseek/fallback-handler');
const { getAIProviderStatus } = require('./config/deepseek-config');

// Architecture upgrade: main-process services for camera, voice, history
const { ImageIntentService } = require('./services/image-intent-service');
const { VoiceIntentService } = require('./services/voice-intent-service');
const { HistoryStore } = require('./services/history-store');
const { normalizeTextInput, intentToSearchArgs } = require('./services/intent-normalizer');

// Import new API services
const googlePlacesService = require('../services/googlePlacesService');
const marketService = require('../services/marketService');
const { searchEbay } = require('../services/ebayService');
const { searchRetailerProducts, searchLocalProducts } = require('../services/projectShoppingService');

const PLAYER_AD_BLOCKLIST = [
  '*://*.doubleclick.net/*',
  '*://*.googleadservices.com/*',
  '*://*.googlesyndication.com/*',
  '*://*.youtube.com/pagead/*',
  '*://*.youtube.com/api/stats/ads*',
  '*://*.youtube.com/get_midroll_*',
  '*://*.youtube.com/ptracking*',
  '*://*.youtube.com/youtubei/v1/player/ad_break*'
];

const YOUTUBE_REQUEST_URLS = [
  '*://*.youtube.com/*',
  '*://*.youtube-nocookie.com/*',
  '*://*.ytimg.com/*',
  '*://*.googlevideo.com/*',
  '*://*.gstatic.com/*'
];

const YOUTUBE_COMPAT_USER_AGENT = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
  'AppleWebKit/537.36 (KHTML, like Gecko)',
  'Chrome/122.0.0.0 Safari/537.36'
].join(' ');

let mainWindow = null;
const playerWindows = new Set();
const isDev = !app.isPackaged;
let cspConfigured = false;
let searchPipeline = null;
let fallbackHandler = null;
let apiServer = null;
let apiConnectionInfo = null;
let localRendererServer = null;
let localRendererOrigin = null;
let imageIntentService = null;
let voiceIntentService = null;
let historyStore = null;
const ipcResponseCache = new Map();
const ipcInFlight = new Map();

function createCacheKey(namespace, payload) {
  return `${namespace}:${JSON.stringify(payload || {})}`;
}

async function withIpcCache(namespace, payload, ttlMs, producer) {
  const key = createCacheKey(namespace, payload);
  const now = Date.now();
  const cached = ipcResponseCache.get(key);

  if (cached && (now - cached.ts) < ttlMs) {
    return cached.value;
  }

  if (ipcInFlight.has(key)) {
    return ipcInFlight.get(key);
  }

  const pending = (async () => {
    try {
      const value = await producer();
      ipcResponseCache.set(key, {
        ts: Date.now(),
        value,
      });
      return value;
    } finally {
      ipcInFlight.delete(key);
    }
  })();

  ipcInFlight.set(key, pending);
  return pending;
}

function startLocalServer(staticPath) {
  return new Promise((resolve, reject) => {
    const mimeTypes = {
      '.html': 'text/html; charset=utf-8',
      '.js': 'text/javascript; charset=utf-8',
      '.mjs': 'text/javascript; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon',
      '.webp': 'image/webp',
      '.woff': 'font/woff',
      '.woff2': 'font/woff2',
      '.ttf': 'font/ttf',
      '.map': 'application/json; charset=utf-8'
    };

    const server = http.createServer((req, res) => {
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        res.writeHead(405);
        res.end('Method Not Allowed');
        return;
      }

      const requestedUrl = new URL(req.url || '/', 'http://127.0.0.1');
      const decodedPath = decodeURIComponent(requestedUrl.pathname || '/');
      if (decodedPath.includes('..')) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
      }

      const normalizedPath = decodedPath.replace(/^\/+/, '');
      let filePath = path.join(staticPath, normalizedPath || 'index.html');

      try {
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
          filePath = path.join(filePath, 'index.html');
        }
      } catch {
        const spaFallback = path.join(staticPath, 'index.html');
        if (!path.extname(filePath) && fs.existsSync(spaFallback)) {
          filePath = spaFallback;
        } else {
          res.writeHead(404);
          res.end('Not Found');
          return;
        }
      }

      if (!fs.existsSync(filePath)) {
        res.writeHead(404);
        res.end('Not Found');
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });

      if (req.method === 'HEAD') {
        res.end();
        return;
      }

      fs.createReadStream(filePath)
        .on('error', () => {
          if (!res.headersSent) {
            res.writeHead(404);
          }
          res.end();
        })
        .pipe(res);
    });

    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        reject(new Error('Failed to resolve local renderer server address'));
        return;
      }

      resolve({
        server,
        origin: `http://127.0.0.1:${address.port}`,
      });
    });

    server.on('error', reject);
  });
}

function isPortInUse(port) {
  return new Promise((resolve) => {
    const probe = net
      .createServer()
      .once('error', () => resolve(true))
      .once('listening', () => {
        probe.close();
        resolve(false);
      })
      .listen(port);
  });
}

function initializeSearchPipeline() {
  fallbackHandler = new FallbackHandler();
  const providerStatus = getAIProviderStatus();

  // Initialize SQLite history store
  try {
    const dbPath = path.join(app.getPath('userData'), 'history.db');
    historyStore = new HistoryStore(dbPath);
    console.log('History store initialized:', dbPath);
  } catch (err) {
    console.error('Failed to initialize history store:', err.message);
  }

  try {
    searchPipeline = new SearchPipeline({
      youtubeApiKey: process.env.YOUTUBE_API_KEY
    });

    // Wire history store into pipeline for learned suppression
    if (historyStore) {
      searchPipeline.setHistoryStore(historyStore);
    }

    // Initialize image and voice services (need providerManager from pipeline)
    imageIntentService = new ImageIntentService(searchPipeline.providerManager);
    voiceIntentService = new VoiceIntentService(searchPipeline.providerManager);

    console.log('AI search pipeline initialized');
    console.log('AI provider status', {
      ...providerStatus,
      cacheMode: searchPipeline.providerManager?.cache?.useMemoryCache ? 'memory' : 'sqlite',
      adaptiveBatchSize: searchPipeline.providerManager?.deepseekClient?.getAdaptiveBatchSize?.(),
      currentProvider: searchPipeline.providerManager?.getStats?.().currentProvider,
      enabledSources: Object.keys(searchPipeline.sources || {})
    });
    return;
  } catch (error) {
    console.error('Failed to initialize AI search pipeline:', error);
  }

  searchPipeline = null;
  console.log('Using fallback search handler');
}

function configureYouTubeSession(targetSession) {
  if (!targetSession || targetSession.__bikebrowserYouTubeConfigured) {
    return;
  }

  targetSession.__bikebrowserYouTubeConfigured = true;

  targetSession.webRequest.onBeforeSendHeaders({ urls: YOUTUBE_REQUEST_URLS }, (details, callback) => {
    const requestHeaders = {
      ...details.requestHeaders,
      'User-Agent': YOUTUBE_COMPAT_USER_AGENT,
      Referer: details.requestHeaders.Referer || 'https://www.youtube.com/',
      Origin: details.requestHeaders.Origin || 'https://www.youtube.com',
      'Accept-Language': details.requestHeaders['Accept-Language'] || 'en-US,en;q=0.9'
    };

    callback({ requestHeaders });
  });
}

// Enforce single Electron instance — second launch focuses the existing window
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

// ── GPU acceleration ────────────────────────────────────────────────────────
// Enable hardware-accelerated rasterisation and zero-copy texture uploads.
// These are safe default flags for a modern desktop Electron app on Windows.
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('enable-native-gpu-memory-buffers');
// Use the angle backend for best DX12/Vulkan compatibility on Windows
app.commandLine.appendSwitch('use-angle', 'd3d11');
// ────────────────────────────────────────────────────────────────────────────

function createVideoPlayerWindow(videoId, title = 'Video Player') {
  const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&controls=1&fs=1&modestbranding=1&rel=0&playsinline=1&iv_load_policy=3`;
  const playerWindow = new BrowserWindow({
    width: 900,
    height: 700,
    show: false,
    autoHideMenuBar: true,
    parent: mainWindow || undefined,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      partition: `temp:video-player-${videoId}-${Date.now()}`
    },
    title
  });

  playerWindows.add(playerWindow);

  const playerSession = playerWindow.webContents.session;
  configureYouTubeSession(playerSession);
  playerSession.webRequest.onBeforeRequest({ urls: PLAYER_AD_BLOCKLIST }, (details, callback) => {
    console.log('Blocked player request:', details.url);
    callback({ cancel: true });
  });

  playerWindow.webContents.setUserAgent(YOUTUBE_COMPAT_USER_AGENT);

  playerWindow.webContents.setWindowOpenHandler(() => {
    return { action: 'deny' };
  });

  playerWindow.webContents.on('will-navigate', (event, nextUrl) => {
    if (!nextUrl.startsWith('https://www.youtube-nocookie.com/embed/')) {
      event.preventDefault();
    }
  });

  playerWindow.webContents.setAudioMuted(false);
  playerWindow.webContents.on('did-finish-load', () => {
    console.log('Video window loaded');
    playerWindow.webContents.setAudioMuted(false);

    playerWindow.webContents.executeJavaScript(`
      const video = document.querySelector('video');
      if (video) {
        video.muted = false;
        video.volume = 1;
        video.play().catch(() => {});
      }
    `).catch(() => {});
  });

  playerWindow.webContents.on('did-fail-load', (event, code, description) => {
    console.error('Load failed:', code, description);
  });

  playerWindow.once('ready-to-show', () => {
    console.log('Window ready');
    playerWindow.show();
  });

  playerWindow.loadURL(embedUrl, {
    httpReferrer: 'https://www.youtube.com/',
    userAgent: mainWindow?.webContents.getUserAgent()
  });

  playerWindow.on('closed', () => {
    playerWindows.delete(playerWindow);
  });

  return playerWindow;
}

function createWindow({ rendererUrl } = {}) {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      webviewTag: true,
      plugins: true,
      webSecurity: true,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    },
    icon: path.join(__dirname, '../../assets/icon.png')
  });

  if (!cspConfigured) {
    configureYouTubeSession(session.defaultSession);
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      const isAppDocument =
        details.resourceType === 'mainFrame' ||
        details.resourceType === 'subFrame' ||
        details.url.startsWith('http://localhost:5173') ||
        (localRendererOrigin && details.url.startsWith(localRendererOrigin)) ||
        details.url.startsWith('file://');

      if (!isAppDocument) {
        callback({ responseHeaders: details.responseHeaders });
        return;
      }

      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [
            "default-src 'self' data: blob: http: https: 'unsafe-inline' 'unsafe-eval'; " +
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:5173 https://www.youtube.com http://www.youtube.com https://www.youtube-nocookie.com http://www.youtube-nocookie.com https://s.ytimg.com http://s.ytimg.com https://www.google.com http://www.google.com; " +
            "frame-src 'self' https://www.youtube.com http://www.youtube.com https://www.youtube-nocookie.com http://www.youtube-nocookie.com https://www.google.com; " +
            "connect-src 'self' http://localhost:5173 ws://localhost:5173 http: https: ws: wss:; " +
            "media-src 'self' data: blob: https://*.googlevideo.com https://*.youtube.com https://*.youtube-nocookie.com https:; " +
            "style-src 'self' 'unsafe-inline' http: https:; " +
            "img-src 'self' data: blob: http: https:; " +
            "font-src 'self' data: https:;"
          ]
        }
      });
    });
    cspConfigured = true;
  }

  mainWindow.webContents.setAudioMuted(false);
  mainWindow.webContents.setUserAgent(YOUTUBE_COMPAT_USER_AGENT);

  const builtIndexPath = path.join(__dirname, '../../build/index.html');

  // Load the app
  if (isDev) {
    mainWindow.webContents.once('did-fail-load', (_event, code, description, validatedURL, isMainFrame) => {
      if (!isMainFrame) {
        return;
      }

      console.error('Dev URL failed to load, falling back to build output:', {
        code,
        description,
        validatedURL
      });

      mainWindow.loadFile(builtIndexPath).catch((fallbackError) => {
        console.error('Fallback build load also failed:', fallbackError);
      });
    });

    mainWindow.loadURL('http://localhost:5173');
    if (!app.isPackaged) {
      // DevTools remain available in development but do not open automatically.
    }
  } else {
    if (rendererUrl) {
      mainWindow.loadURL(rendererUrl);
    } else {
      mainWindow.loadFile(builtIndexPath);
    }
  }

  // Initialize YouTube interceptor
  youtubeInterceptor.setup(mainWindow);

  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.setAudioMuted(false);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App lifecycle
app.whenReady().then(async () => {
  initializeSearchPipeline();

  let rendererUrl;
  if (!isDev) {
    const rendererCandidates = [
      path.join(__dirname, '../../build'),
      path.join(app.getAppPath(), 'build'),
      path.join(process.resourcesPath, 'build')
    ];

    const rendererPath = rendererCandidates.find((candidate) => fs.existsSync(path.join(candidate, 'index.html')));

    if (!rendererPath) {
      throw new Error('Unable to locate renderer build output (index.html) for local HTTP server');
    }

    const localServer = await startLocalServer(rendererPath);
    localRendererServer = localServer.server;
    localRendererOrigin = localServer.origin;
    rendererUrl = `${localRendererOrigin}/index.html`;

    console.log(`[MAIN] Local renderer server running at ${localRendererOrigin}`);
  }

  {
    const apiPort = Number(process.env.BIKEBROWSER_API_PORT || 3001);
    const alreadyRunning = await isPortInUse(apiPort);

    if (alreadyRunning) {
      console.log(`[MAIN] API already running on ${apiPort} - reusing existing server`);
    } else {
      console.log('[MAIN] Starting API server...');
      try {
        apiServer = createApiServer({
          searchPipeline,
          appDataPath: app.getPath('userData'),
          port: apiPort,
          webPort: 5173,
        });

        const info = await apiServer.start();
        apiConnectionInfo = info;
        console.log('LAN server ready:', info);
        console.log(`Open on phone: ${info.webUrl}`);
      } catch (error) {
        if (error?.code === 'EADDRINUSE') {
          console.log(`[MAIN] Port ${apiPort} taken - reusing existing API server`);
          apiServer = null;
        } else {
          console.error('Failed to start API server:', error);
        }
      }
    }
  }

  createWindow({ rendererUrl });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', async () => {
  if (localRendererServer) {
    await new Promise((resolve) => {
      localRendererServer.close(() => resolve());
    });
    localRendererServer = null;
    localRendererOrigin = null;
  }

  if (!apiServer) {
    return;
  }

  try {
    await apiServer.stop();
  } catch (error) {
    console.error('Failed to stop LAN server cleanly:', error);
  }

  // Close SQLite history store cleanly
  if (historyStore) {
    try { historyStore.close(); } catch (_) { /* ignore */ }
  }
});

// IPC Handlers
ipcMain.handle('search', async (_event, query, options = {}) => {
  try {
    if (searchPipeline) {
      return await searchPipeline.search(query, options);
    }

    return fallbackHandler.getFallbackResults(query);
  } catch (error) {
    console.error('Unified search error:', error);
    return fallbackHandler.getFallbackResults(query);
  }
});

ipcMain.handle('get-result', async (_event, source, id) => {
  try {
    if (!searchPipeline) {
      return null;
    }

    const normalizedSource = source === 'youtube-kids' ? 'youtubeKids' : source;
    const manager = searchPipeline.sources[normalizedSource];
    if (!manager) {
      return null;
    }

    return await manager.getById(id);
  } catch (error) {
    console.error('Get result error:', error);
    return null;
  }
});

ipcMain.handle('get-deepseek-stats', async () => {
  if (searchPipeline?.providerManager) {
    return searchPipeline.providerManager.getStats();
  }

  return null;
});

ipcMain.handle('get-ai-stats', async () => {
  if (searchPipeline?.providerManager) {
    return searchPipeline.providerManager.getStats();
  }

  return null;
});

ipcMain.handle('get-provider-status', async () => {
  if (searchPipeline?.providerManager) {
    return searchPipeline.providerManager.getProviderStatus();
  }

  return getAIProviderStatus();
});

ipcMain.handle('get-connection-info', async () => {
  if (apiServer) {
    return apiServer.getConnectionInfo();
  }

  if (apiConnectionInfo) {
    return apiConnectionInfo;
  }

  const port = Number(process.env.BIKEBROWSER_API_PORT || 3001);
  const webPort = Number(process.env.BIKEBROWSER_WEB_PORT || 5173);
  return {
    apiUrl: `http://localhost:${port}`,
    webUrl: `http://localhost:${webPort}`,
    publicUrl: process.env.PUBLIC_BASE_URL || `http://localhost:${webPort}`,
  };
});

ipcMain.handle('get-connection-status', async () => {
  try {
    const port = Number(process.env.BIKEBROWSER_API_PORT || 3001);
    const response = await fetch(`http://127.0.0.1:${port}/connection-status`, {
      headers: {
        'x-api-key': process.env.API_KEY || 'dev-local-key',
      },
    });
    return await response.json();
  } catch (error) {
    return { success: false, devices: [], activeCount: 0, error: error.message };
  }
});

async function callServer(pathname, method = 'GET', payload) {
  const port = Number(process.env.BIKEBROWSER_API_PORT || 3001);
  const response = await fetch(`http://127.0.0.1:${port}${pathname}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-device-id': 'desktop-electron',
      'x-api-key': process.env.API_KEY || 'dev-local-key',
    },
    body: payload ? JSON.stringify(payload) : undefined,
  });

  if (!response.ok) {
    throw new Error(`Server request failed: ${response.status}`);
  }

  return response.json();
}

ipcMain.handle('server:search', async (_event, payload) => {
  return callServer('/search', 'POST', payload || {});
});

ipcMain.handle('server:rank', async (_event, payload) => {
  return callServer('/rank', 'POST', payload || {});
});

ipcMain.handle('server:getProjects', async () => {
  return callServer('/projects', 'GET');
});

ipcMain.handle('server:createProject', async (_event, payload) => {
  return callServer('/projects', 'POST', payload || {});
});

ipcMain.handle('server:getNotes', async () => {
  return callServer('/notes', 'GET');
});

ipcMain.handle('server:addNote', async (_event, payload) => {
  return callServer('/notes', 'POST', payload || {});
});

ipcMain.handle('youtube:search', async (event, query) => {
  try {
    console.log('Received YouTube search request:', query);
    const rankedVideos = await withIpcCache(
      'youtube:search',
      { query: String(query || '').trim() },
      30 * 1000,
      async () => rankingEngine.processSearch(query)
    );
    return { success: true, videos: rankedVideos };
  } catch (error) {
    console.error('YouTube search error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('youtube:getVideoDetails', async (event, videoId) => {
  try {
    const details = await rankingEngine.getVideoDetails(videoId);
    return { success: true, details };
  } catch (error) {
    console.error('Get video details error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('youtube:openVideoPlayer', async (_event, videoId, title) => {
  try {
    console.log('IPC received:', videoId, title);

    if (!videoId) {
      console.error('Invalid videoId');
      return { success: false, error: 'Invalid videoId' };
    }

    createVideoPlayerWindow(videoId, title);
    return { success: true };
  } catch (error) {
    console.error('Open video player error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('youtube:reportEmbedStatus', async (_event, { videoId, channelId, embeddable, reason }) => {
  try {
    if (!videoId) {
      return { success: false, error: 'Invalid videoId' };
    }

    rankingEngine.reportEmbedStatus(videoId, channelId, embeddable, reason || '');
    return { success: true };
  } catch (error) {
    console.error('Report embed status error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('open-external', async (_event, url) => {
  try {
    await shell.openExternal(url);
    return { success: true };
  } catch (error) {
    console.error('Open external error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.on('debug:log', (_event, ...args) => {
  console.log('[renderer]', ...args);
});

ipcMain.handle('navigate', (event, url) => {
  if (mainWindow) {
    mainWindow.loadURL(url);
  }
});

// Database operations — backed by SQLite HistoryStore
ipcMain.handle('db:getHistory', async (_event, limit = 50, offset = 0) => {
  try {
    if (!historyStore) return { success: true, history: [] };
    const history = historyStore.getHistory(limit, offset);
    return { success: true, history };
  } catch (error) {
    console.error('db:getHistory error:', error.message);
    return { success: false, error: error.message, history: [] };
  }
});

// ── Performance stats (used by the diagnostics panel) ───────────────────────
ipcMain.handle('perf:getStats', async () => {
  try {
    const mem = process.memoryUsage();
    return {
      process: {
        heapUsedMB:  Math.round(mem.heapUsed  / 1024 / 1024),
        heapTotalMB: Math.round(mem.heapTotal / 1024 / 1024),
        rssMB:       Math.round(mem.rss       / 1024 / 1024),
        externalMB:  Math.round(mem.external  / 1024 / 1024),
      },
      ai: searchPipeline?.providerManager?.getStats?.() || null,
      providers: searchPipeline?.providerManager?.getProviderStatus?.() || getAIProviderStatus()
    };
  } catch {
    return {};
  }
});
// ────────────────────────────────────────────────────────────────────────────

ipcMain.handle('db:getTrustList', async () => {
  // TODO: Implement in Phase 3
  return { success: true, channels: [] };
});

// ── Camera / Image intent IPC ───────────────────────────────────────────────
ipcMain.handle('camera:analyzeImage', async (_event, imageBase64) => {
  try {
    if (!imageIntentService) return { success: false, error: 'Image service not initialized' };
    const result = await imageIntentService.analyzeImage(imageBase64);
    return { success: true, ...result };
  } catch (error) {
    console.error('camera:analyzeImage error:', error.message);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('search:fromImage', async (_event, imageBase64) => {
  try {
    if (!imageIntentService || !searchPipeline) {
      return { success: false, error: 'Services not initialized' };
    }
    const result = await imageIntentService.analyzeAndSearch(imageBase64, searchPipeline);
    // Save to history
    if (historyStore && result.normalizedIntent) {
      try {
        historyStore.saveSearchSession(
          result.normalizedIntent,
          result.searchArgs?.query || '',
          result.searchResult?.totalResults || 0,
          result.searchResult?.results || []
        );
      } catch (_) { /* history save is best-effort */ }
    }
    return { success: true, ...result };
  } catch (error) {
    console.error('search:fromImage error:', error.message);
    return { success: false, error: error.message };
  }
});

// ── Voice intent IPC ────────────────────────────────────────────────────────
ipcMain.handle('voice:parseTranscript', async (_event, transcript) => {
  try {
    if (!voiceIntentService) return { success: false, error: 'Voice service not initialized' };
    const result = await voiceIntentService.parseTranscript(transcript);
    return { success: true, ...result };
  } catch (error) {
    console.error('voice:parseTranscript error:', error.message);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('search:fromVoice', async (_event, transcript) => {
  try {
    if (!voiceIntentService || !searchPipeline) {
      return { success: false, error: 'Services not initialized' };
    }
    const result = await voiceIntentService.parseAndSearch(transcript, searchPipeline);
    // Save to history
    if (historyStore && result.normalizedIntent) {
      try {
        historyStore.saveSearchSession(
          result.normalizedIntent,
          result.searchArgs?.query || '',
          result.searchResult?.totalResults || 0,
          result.searchResult?.results || []
        );
      } catch (_) { /* history save is best-effort */ }
    }
    return { success: true, ...result };
  } catch (error) {
    console.error('search:fromVoice error:', error.message);
    return { success: false, error: error.message };
  }
});

// ── History & decisions IPC ─────────────────────────────────────────────────
ipcMain.handle('db:saveSearchSession', async (_event, { normalizedIntent, query, resultsCount, topResults }) => {
  try {
    if (!historyStore) return { success: false, error: 'History store not initialized' };
    const sessionId = historyStore.saveSearchSession(normalizedIntent, query, resultsCount, topResults || []);
    return { success: true, sessionId };
  } catch (error) {
    console.error('db:saveSearchSession error:', error.message);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('db:saveDecision', async (_event, decision) => {
  try {
    if (!historyStore) return { success: false, error: 'History store not initialized' };
    historyStore.saveDecision(decision);
    return { success: true };
  } catch (error) {
    console.error('db:saveDecision error:', error.message);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('db:getSessionWithResults', async (_event, sessionId) => {
  try {
    if (!historyStore) return { success: false, error: 'History store not initialized' };
    const session = historyStore.getSessionWithResults(sessionId);
    return { success: true, session };
  } catch (error) {
    console.error('db:getSessionWithResults error:', error.message);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('db:getDecisions', async (_event, limit = 100) => {
  try {
    if (!historyStore) return { success: true, decisions: [] };
    const decisions = historyStore.getDecisions(limit);
    return { success: true, decisions };
  } catch (error) {
    console.error('db:getDecisions error:', error.message);
    return { success: false, error: error.message, decisions: [] };
  }
});

// ── Compatibility profiles IPC ──────────────────────────────────────────────
ipcMain.handle('db:saveProfile', async (_event, profile) => {
  try {
    if (!historyStore) return { success: false, error: 'History store not initialized' };
    const id = historyStore.saveProfile(profile);
    return { success: true, id };
  } catch (error) {
    console.error('db:saveProfile error:', error.message);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('db:getProfiles', async () => {
  try {
    if (!historyStore) return { success: true, profiles: [] };
    const profiles = historyStore.getProfiles();
    return { success: true, profiles };
  } catch (error) {
    console.error('db:getProfiles error:', error.message);
    return { success: false, error: error.message, profiles: [] };
  }
});

// =============================================================================
// NEW API HANDLERS - Google Places, Marketcheck
// =============================================================================
// NOTE: AI requests are now routed through the ProviderManager in the main process

// Google Places Service Handlers
ipcMain.handle('places:search', async (event, query) => {
  try {
    console.log('Places search request:', query);
    const places = await googlePlacesService.searchPlaces(query);
    return { success: true, places };
  } catch (error) {
    console.error('Places search error:', error);
    return { success: false, error: error.message, places: [] };
  }
});

ipcMain.handle('places:nearby', async (event, { lat, lng, type, radius }) => {
  try {
    console.log('Places nearby request:', lat, lng, type);
    const places = await googlePlacesService.searchNearby(lat, lng, type, radius);
    return { success: true, places };
  } catch (error) {
    console.error('Places nearby error:', error);
    return { success: false, error: error.message, places: [] };
  }
});

ipcMain.handle('places:details', async (event, placeId) => {
  try {
    console.log('Place details request:', placeId);
    const details = await googlePlacesService.getPlaceDetails(placeId);
    return { success: true, details };
  } catch (error) {
    console.error('Place details error:', error);
    return { success: false, error: error.message, details: null };
  }
});

ipcMain.handle('places:bikeShops', async (event, location) => {
  try {
    console.log('Bike shops search:', location);
    const shops = await googlePlacesService.findBikeShops(location);
    return { success: true, shops };
  } catch (error) {
    console.error('Bike shops search error:', error);
    return { success: false, error: error.message, shops: [] };
  }
});

// Marketcheck Service Handlers
ipcMain.handle('market:search', async (event, { query, options }) => {
  try {
    console.log('Market search request:', query);
    const listings = await withIpcCache(
      'market:search',
      { query: String(query || '').trim(), options: options || {} },
      45 * 1000,
      async () => marketService.searchMarket(query, options)
    );
    return { success: true, listings };
  } catch (error) {
    console.error('Market search error:', error);
    return { success: false, error: error.message, listings: [] };
  }
});

ipcMain.handle('market:motorcycles', async (event, { query, filters }) => {
  try {
    console.log('Motorcycle search request:', query);
    const listings = await marketService.searchMotorcycles(query, filters);
    return { success: true, listings };
  } catch (error) {
    console.error('Motorcycle search error:', error);
    return { success: false, error: error.message, listings: [] };
  }
});

ipcMain.handle('market:electricBikes', async (event, filters) => {
  try {
    console.log('Electric bike search request');
    const listings = await marketService.searchElectricBikes(filters);
    return { success: true, listings };
  } catch (error) {
    console.error('Electric bike search error:', error);
    return { success: false, error: error.message, listings: [] };
  }
});

ipcMain.handle('market:dirtBikes', async (event, filters) => {
  try {
    console.log('Dirt bike search request');
    const listings = await marketService.searchDirtBikes(filters);
    return { success: true, listings };
  } catch (error) {
    console.error('Dirt bike search error:', error);
    return { success: false, error: error.message, listings: [] };
  }
});

ipcMain.handle('market:stats', async (event, query) => {
  try {
    console.log('Market stats request:', query);
    const stats = await marketService.getInventoryStats(query);
    return { success: true, stats };
  } catch (error) {
    console.error('Market stats error:', error);
    return { success: false, error: error.message, stats: null };
  }
});

ipcMain.handle('market:comparePrices', async (event, listings) => {
  try {
    const comparison = marketService.comparePrices(listings);
    return { success: true, comparison };
  } catch (error) {
    console.error('Price comparison error:', error);
    return { success: false, error: error.message, comparison: null };
  }
});

ipcMain.handle('shopping:searchRetailers', async (_event, query) => {
  try {
    const shoppingManager = searchPipeline?.sources?.shopping;
    const results = await withIpcCache(
      'shopping:searchRetailers',
      { query: String(query || '').trim() },
      45 * 1000,
      async () => searchRetailerProducts(shoppingManager, query)
    );
    return { success: true, results };
  } catch (error) {
    console.error('Retailer shopping search error:', error.message);
    return { success: false, error: error.message, results: [] };
  }
});

ipcMain.handle('shopping:searchLocal', async (_event, query, zipcode) => {
  try {
    const shoppingManager = searchPipeline?.sources?.shopping;
    const results = await searchLocalProducts(shoppingManager, `${query} ${zipcode}`.trim());
    return { success: true, results };
  } catch (error) {
    console.error('Local shopping search error:', error.message);
    return { success: false, error: error.message, results: [] };
  }
});

ipcMain.handle('shopping:searchEbay', async (_event, query, zipcode) => {
  try {
    const results = await searchEbay(query, zipcode);
    return { success: true, results };
  } catch (error) {
    console.error('eBay shopping search error:', error.message);
    return { success: false, error: error.message, results: [] };
  }
});

ipcMain.handle('local-search:search', async (_event, payload = {}) => {
  const query = String(payload.query || '').trim();

  if (!query) {
    return { success: true, results: [] };
  }

  // Local search is intentionally disabled until fully implemented with verified real listings.
  return { success: true, results: [] };
});

ipcMain.handle('local-search', async (_event, payload = {}) => {
  const query = String(payload.query || '').trim();

  if (!query) {
    return [];
  }

  try {
    // Legacy compatibility endpoint; returns empty list safely.
    return [];
  } catch (err) {
    console.error('Local search error:', err);
    return [];
  }
});

// =============================================================================
// THAURA AI SERVICE HANDLERS
// =============================================================================
// Secure AI integration using axios in main process with IPC
// API key stored in .env, never exposed to renderer

ipcMain.handle('ai:thaura', async (event, prompt, options) => {
  try {
    if (!searchPipeline?.providerManager) {
      return { success: false, error: 'AI provider manager unavailable' };
    }
    console.log('AI structured request:', prompt.substring(0, 50) + '...');
    const result = await searchPipeline.providerManager.executeWithOrchestration({
      taskType: 'structured_parsing',
      prompt,
      expectedFormat: options?.expectedFormat || 'json',
      metadata: options || {}
    });
    return { success: result.success, data: result.data, error: result.error, providerUsed: result.providerUsed, confidence: result.confidence };
  } catch (error) {
    console.error('Thaura AI error:', error.message);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('ai:thaura:explain', async (event, topic) => {
  try {
    if (!searchPipeline?.providerManager) {
      return { success: false, error: 'AI provider manager unavailable' };
    }
    const result = await searchPipeline.providerManager.executeWithOrchestration({
      taskType: 'high_confidence',
      prompt: `Explain this topic in simple terms for a 9-year-old who loves bikes and building things: ${topic}`,
      expectedFormat: 'text'
    });
    return { success: result.success, explanation: result.data, providerUsed: result.providerUsed, confidence: result.confidence };
  } catch (error) {
    console.error('Thaura explain error:', error.message);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('ai:thaura:suggestions', async (event, topic) => {
  try {
    if (!searchPipeline?.providerManager) {
      return { success: false, error: 'AI provider manager unavailable', suggestions: [] };
    }
    const result = await searchPipeline.providerManager.executeWithOrchestration({
      taskType: 'high_confidence',
      prompt: `Generate 5 educational search queries about "${topic}" for a 9-year-old learning about bikes. Return one suggestion per line.`,
      expectedFormat: 'text'
    });
    const suggestions = String(result.data || '')
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 5);
    return { success: result.success, suggestions, providerUsed: result.providerUsed, confidence: result.confidence };
  } catch (error) {
    console.error('Thaura suggestions error:', error.message);
    return { success: false, error: error.message, suggestions: [] };
  }
});

ipcMain.handle('ai:thaura:safety', async (event, { title, description }) => {
  try {
    if (!searchPipeline?.providerManager) {
      return { success: false, appropriate: true, reason: 'AI provider manager unavailable' };
    }
    const result = await searchPipeline.providerManager.executeWithOrchestration({
      taskType: 'safety_filter',
      prompt: `Title: ${title}\nDescription: ${description}`,
      expectedFormat: 'json',
      metadata: {
        fallbackData: { safe: true, category: 'unknown', riskScore: 0.25 }
      }
    });
    return {
      success: result.success,
      appropriate: result.data?.safe !== false,
      reason: result.data?.safe === false ? `Risk score ${result.data?.riskScore}` : 'Content appears safe for children',
      providerUsed: result.providerUsed,
      confidence: result.confidence
    };
  } catch (error) {
    console.error('Thaura safety check error:', error.message);
    return { success: false, appropriate: true, reason: 'Safety check unavailable' };
  }
});

ipcMain.handle('ai:explain', async (_event, topic) => {
  try {
    if (!searchPipeline?.providerManager) {
      return { success: false, error: 'AI provider manager unavailable' };
    }
    const result = await searchPipeline.providerManager.executeWithOrchestration({
      taskType: 'high_confidence',
      prompt: `Explain this in simple terms for a 9-year-old who loves bikes, building things, and engineering: ${topic}`,
      expectedFormat: 'text'
    });
    return { success: result.success, data: result.data, providerUsed: result.providerUsed, confidence: result.confidence };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('ai:suggestions', async (_event, topic) => {
  try {
    if (!searchPipeline?.providerManager) {
      return { success: false, error: 'AI provider manager unavailable', data: [] };
    }
    const result = await searchPipeline.providerManager.executeWithOrchestration({
      taskType: 'high_confidence',
      prompt: `Generate 5 specific child-safe educational search queries about: ${topic}. Return one per line.`,
      expectedFormat: 'text'
    });
    const suggestions = String(result.data || '')
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 5);
    return { success: result.success, data: suggestions, providerUsed: result.providerUsed, confidence: result.confidence };
  } catch (error) {
    return { success: false, error: error.message, data: [] };
  }
});

ipcMain.handle('ai:safety', async (_event, { title, description }) => {
  try {
    if (!searchPipeline?.providerManager) {
      return { success: false, error: 'AI provider manager unavailable' };
    }
    const result = await searchPipeline.providerManager.executeWithOrchestration({
      taskType: 'safety_filter',
      prompt: `Title: ${title}\nDescription: ${description}`,
      expectedFormat: 'json',
      metadata: {
        fallbackData: { safe: true, category: 'unknown', riskScore: 0.25 }
      }
    });
    return {
      success: result.success,
      data: {
        appropriate: result.data?.safe !== false,
        reason: result.data?.safe === false ? `Risk score ${result.data?.riskScore}` : 'Content appears safe for children'
      },
      providerUsed: result.providerUsed,
      confidence: result.confidence
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('ai:ux-audit', async (_event, { uiState, mode = 'continuous', includeHealthyState = false, hardViolations = [] } = {}) => {
  try {
    if (!searchPipeline?.providerManager) {
      return {
        success: false,
        violations: [],
        error: 'AI provider manager unavailable',
        providerUsed: 'offline'
      };
    }

    if (!uiState || typeof uiState !== 'object') {
      return {
        success: false,
        violations: [],
        error: 'UI state is required',
        providerUsed: 'offline'
      };
    }

    if (!includeHealthyState && (!Array.isArray(hardViolations) || hardViolations.length === 0)) {
      return {
        success: true,
        violations: [],
        providerUsed: 'skipped',
        confidence: 1,
        raw: { skipped: true, reason: 'no_hard_violations' }
      };
    }

    const prompt = [
      'You are a UX safety auditor for a child-safe browser.',
      '',
      'Rules:',
      '- Home button must ALWAYS be visible',
      '- Navigation must be consistent',
      '- No screen should trap the user',
      '',
      'UI State:',
      JSON.stringify(uiState, null, 2),
      '',
      'Known hard violations detected before AI reasoning:',
      JSON.stringify(hardViolations, null, 2),
      '',
      'Return JSON:',
      '{',
      '  "violations": [',
      '    {',
      '      "rule": "string",',
      '      "issue": "string",',
      '      "severity": "low|medium|critical",',
      '      "fix": "string"',
      '    }',
      '  ]',
      '}'
    ].join('\n');

    const result = await searchPipeline.providerManager.executeWithOrchestration({
      taskType: mode === 'debug' ? 'ux_debug' : 'ux_audit',
      prompt,
      expectedFormat: 'json',
      metadata: {
        schema: {
          type: 'object',
          required: ['violations'],
          properties: {
            violations: {
              type: 'array',
              items: {
                type: 'object',
                required: ['rule', 'issue', 'severity', 'fix'],
                properties: {
                  rule: 'string',
                  issue: 'string',
                  severity: { enum: ['low', 'medium', 'critical'] },
                  fix: 'string'
                }
              }
            }
          }
        },
        uiState,
        hardViolations,
        mode
      }
    });

    return {
      success: Boolean(result.success),
      violations: result.data?.violations || [],
      providerUsed: result.providerUsed,
      confidence: result.confidence,
      raw: result.data,
      error: result.error || null
    };
  } catch (error) {
    return {
      success: false,
      violations: [],
      error: error.message,
      providerUsed: 'offline'
    };
  }
});

ipcMain.handle('ai:orchestrate', async (_event, payload) => {
  try {
    if (!searchPipeline?.providerManager) {
      return {
        success: false,
        data: null,
        error: 'AI provider manager unavailable',
        latency: 0,
        confidence: 0,
        provider: 'offline',
        providerUsed: 'offline'
      };
    }
    return await searchPipeline.providerManager.executeWithOrchestration(payload);
  } catch (error) {
    return {
      success: false,
      data: null,
      error: error.message,
      latency: 0,
      confidence: 0,
      provider: 'offline',
      providerUsed: 'offline'
    };
  }
});

console.log('BikeBrowser main process initialized with API integrations');
console.log('Environment variables loaded:', {
  hasOpenAI: getAIProviderStatus().hasOpenAI,
  hasDeepSeek: getAIProviderStatus().hasDeepSeek,
  hasGoogleMaps: !!process.env.GOOGLE_MAPS_API_KEY,
  hasMarketcheck: !!process.env.MARKETCHECK_API_KEY,
  hasThaura: getAIProviderStatus().hasThaura
});

