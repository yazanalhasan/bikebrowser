import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { promises as fs } from 'fs'
import { existsSync, readdirSync, rmSync, statSync } from 'fs'

// Dev-only plugin: persist layout JSON edits from LayoutEditorOverlayScene.
function layoutSaverPlugin() {
  return {
    name: 'bikebrowser-layout-saver',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/save-layout', async (req, res, next) => {
        if (req.method !== 'POST') return next();
        try {
          const chunks = [];
          for await (const c of req) chunks.push(c);
          const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
          const relPath = body?.path;
          const data = body?.data;
          const send = (status, payload) => {
            res.statusCode = status;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(payload));
          };
          if (typeof relPath !== 'string' || typeof data !== 'object' || data === null) {
            return send(400, { error: 'invalid body' });
          }
          if (path.isAbsolute(relPath) || relPath.includes('..') || !relPath.startsWith('layouts/')) {
            return send(400, { error: 'invalid path' });
          }
          const fullPath = path.join(__dirname, 'public', relPath);
          await fs.writeFile(fullPath, JSON.stringify(data, null, 2) + '\n', 'utf8');
          send(200, { ok: true, path: relPath });
        } catch (err) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err?.message || 'unknown' }));
        }
      });
    },
  };
}

// Archived masters and wavs that already have an ogg/mp3 sibling are kept
// in the repo but are not part of the Pages upload. The loader tries
// .ogg then .mp3 before .wav, so a wav next to a compressed file is unused.
function omitUnusedPublicAudio() {
  const dropRedundantWavs = (dir) => {
    if (!existsSync(dir)) return;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        dropRedundantWavs(full);
        continue;
      }
      if (!entry.name.endsWith('.wav')) continue;
      const stem = full.slice(0, -4);
      if (existsSync(`${stem}.ogg`) || existsSync(`${stem}.mp3`)) {
        rmSync(full);
      }
    }
  };

  return {
    name: 'omit-unused-public-audio',
    apply: 'build',
    closeBundle() {
      const outDir = path.resolve(__dirname, 'build');
      const archived = path.join(outDir, 'audio', '_archived');
      if (existsSync(archived)) {
        rmSync(archived, { recursive: true, force: true });
      }
      dropRedundantWavs(path.join(outDir, 'game', 'audio'));
      dropRedundantWavs(path.join(outDir, 'audio'));
      const archivedParent = path.join(outDir, 'audio');
      if (existsSync(archivedParent) && statSync(archivedParent).isDirectory() && readdirSync(archivedParent).length === 0) {
        rmSync(archivedParent, { recursive: true, force: true });
      }
    },
  };
}

const HEAVY_PRELOAD = ['vendor-three', 'vendor-r3f', 'vendor-drei', 'vendor-rapier'];

export default defineConfig({
  plugins: [react(), layoutSaverPlugin(), omitUnusedPublicAudio()],
  base: '/',
  optimizeDeps: {
    include: ['react', 'react-dom', 'react/jsx-runtime']
  },
  build: {
    outDir: 'build',
    emptyOutDir: true,
    modulePreload: {
      resolveDependencies(_filename, deps) {
        return deps.filter((dep) => !HEAVY_PRELOAD.some((name) => dep.includes(name)));
      },
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('phaser')) return 'vendor-phaser';
            if (id.includes('@react-three/rapier')) return 'vendor-rapier';
            if (id.includes('@react-three/drei')) return 'vendor-drei';
            if (id.includes('@react-three/fiber')) return 'vendor-r3f';
            if (id.includes('three')) return 'vendor-three';
            if (id.includes('react-router')) return 'vendor-router';
          }
        },
      },
    },
  },
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    headers: {
      'Cache-Control': 'no-store'
    },
    allowedHosts: [
      'bike-browser.com',
      'www.bike-browser.com',
      'private.bike-browser.com',
      '192.168.68.81',
      'localhost'
    ],
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, ''),
      },
    },
  },
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      '@': path.resolve(__dirname, './src/renderer'),
      react: path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
      'react/jsx-runtime': path.resolve(__dirname, 'node_modules/react/jsx-runtime.js'),
      'react/jsx-dev-runtime': path.resolve(__dirname, 'node_modules/react/jsx-dev-runtime.js')
    }
  }
})
