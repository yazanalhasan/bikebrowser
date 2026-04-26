import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: './',
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
