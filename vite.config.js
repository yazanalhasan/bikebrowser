import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { promises as fs } from 'fs'

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

export default defineConfig({
  plugins: [react(), layoutSaverPlugin()],
  base: '/',
  optimizeDeps: {
    include: ['react', 'react-dom', 'react/jsx-runtime']
  },
  build: {
    outDir: 'build',
    emptyOutDir: true,
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
