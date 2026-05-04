/**
 * useBackendReady — lightweight hook that tracks whether the local API server
 * is reachable. Backend-dependent components can gate on this to show
 * "Starting services…" instead of a confusing failure banner.
 *
 * Behaviour:
 *   1. On mount, pings the health endpoint.
 *   2. If healthy → ready immediately.
 *   3. If not → retries with backoff (1s, 2s, 4s, 8s, then every 10s).
 *   4. After maxWaitMs (default 30s) without success → gives up.
 *   5. Exposes { ready, checking, error }.
 *
 * Works in both Electron (where the main process starts the server) and
 * web mode (where `npm run dev:web` starts it via concurrently).
 */

import { useEffect, useRef, useState } from 'react';
import { CONFIG } from '../../../config/env.js';
import { isPublicPagesHost } from '../utils/runtimeMode';

const HEALTH_PATHS = ['/api/health', '/health'];
const MAX_WAIT_MS = 30_000;

async function checkHealth() {
  // On bike-browser.com (mobile/tunnel), only the relative proxy path works —
  // localhost URLs point at the phone, not the desktop. Prioritize accordingly.
  const onTunnel = typeof window !== 'undefined' &&
    window.location.hostname.includes('bike-browser.com');

  const bases = onTunnel
    ? ['']                     // only relative works through the tunnel
    : [
        '',                    // relative (Vite proxy)
        CONFIG.API_BASE_URL,   // from env
        'http://localhost:3001', // fallback
      ];

  // Only try /api/health — the Vite proxy prefix is /api so /health alone
  // falls through to the SPA and returns HTML, not a real health response.
  const paths = onTunnel ? ['/api/health'] : HEALTH_PATHS;

  for (const base of bases) {
    for (const path of paths) {
      try {
        const url = `${base}${path}`.replace(/([^:])\/\//g, '$1/');

        // AbortSignal.timeout() isn't available in older mobile browsers;
        // fall back to a manual AbortController.
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 4000);

        const res = await fetch(url, {
          cache: 'no-store',
          signal: controller.signal,
          headers: { 'x-api-key': CONFIG.API_KEY },
        });
        clearTimeout(timer);
        if (res.ok) return true;
      } catch {
        // try next
      }
    }
  }
  return false;
}

export function useBackendReady() {
  const publicPagesHost = isPublicPagesHost();
  const [ready, setReady] = useState(publicPagesHost);
  const [checking, setChecking] = useState(!publicPagesHost);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);
  const attemptRef = useRef(0);

  useEffect(() => {
    if (publicPagesHost) {
      setReady(true);
      setChecking(false);
      setError(null);
      return undefined;
    }

    mountedRef.current = true;
    let timer = null;
    const startTime = Date.now();

    async function poll() {
      if (!mountedRef.current) return;

      const ok = await checkHealth();
      if (!mountedRef.current) return;

      if (ok) {
        setReady(true);
        setChecking(false);
        setError(null);
        return;
      }

      attemptRef.current++;
      const elapsed = Date.now() - startTime;

      if (elapsed > MAX_WAIT_MS) {
        setChecking(false);
        setError('Search server did not start. Run "npm run dev:web" or "npm run server" to start it.');
        return;
      }

      // Backoff: 1s, 2s, 4s, 8s, then cap at 10s
      const delay = Math.min(1000 * Math.pow(2, attemptRef.current - 1), 10000);
      timer = setTimeout(poll, delay);
    }

    poll();

    return () => {
      mountedRef.current = false;
      if (timer) clearTimeout(timer);
    };
  }, [publicPagesHost]);

  return { ready, checking, error };
}

export default useBackendReady;
