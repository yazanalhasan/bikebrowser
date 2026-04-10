require('dotenv').config();

const net = require('net');
const fs = require('fs');
const path = require('path');
const { createApiServer } = require('../src/server/api-server');
const { SearchPipeline } = require('../src/main/search-pipeline');

const apiPort = Number(process.env.BIKEBROWSER_API_PORT || 3001);
const webPort = Number(process.env.BIKEBROWSER_WEB_PORT || 5173);
const dataPath = path.join(process.cwd(), '.runtime-data');

if (!fs.existsSync(dataPath)) {
  fs.mkdirSync(dataPath, { recursive: true });
}

function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = net
      .createServer()
      .once('error', () => resolve(true))
      .once('listening', () => {
        server.close();
        resolve(false);
      })
      .listen(port);
  });
}

let apiServer = null;

async function main() {
  if (await isPortInUse(apiPort)) {
    console.log(`[api] Port ${apiPort} already in use - skipping startup`);
    return;
  }

  console.log(`[api] Starting server on port ${apiPort}`);

  let searchPipeline = null;
  try {
    searchPipeline = new SearchPipeline({
      youtubeApiKey: process.env.YOUTUBE_API_KEY,
    });
    console.log('[api] Search pipeline initialized');
  } catch (error) {
    console.warn('[api] Search pipeline init failed, running without AI search:', error.message);
  }

  apiServer = createApiServer({
    searchPipeline,
    appDataPath: dataPath,
    port: apiPort,
    webPort,
  });

  try {
    const info = await apiServer.start();
    console.log('[api] BikeBrowser API server started', info);
  } catch (error) {
    console.error('[api] Failed to start API server:', error);
    process.exitCode = 1;
  }
}

async function shutdown(signal) {
  console.log(`[api] Received ${signal}, shutting down...`);
  if (!apiServer) {
    process.exit(0);
    return;
  }

  try {
    await apiServer.stop();
  } catch (error) {
    console.error('[api] Error while stopping API server:', error);
  } finally {
    process.exit(0);
  }
}

main().catch((error) => {
  console.error('[api] Unhandled startup error:', error);
  process.exit(1);
});

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
