import { CONFIG } from '../../config/env.js';

const LOCAL_API_FALLBACK = 'http://localhost:3001';
const REQUEST_TIMEOUT_MS = 8000;
const SEARCH_TIMEOUT_MS = 25000;
const RANK_TIMEOUT_MS = 15000;
const RANK_STATUS_TIMEOUT_MS = 10000;

function inferBaseUrl() {
  // When accessed via bike-browser.com, use the Vite /api proxy so requests
  // go through the same Cloudflare Tunnel instead of hitting localhost:3001
  if (typeof window !== 'undefined' && window.location.hostname.includes('bike-browser.com')) {
    return '/api';
  }

  const saved = typeof window !== 'undefined' ? window.localStorage.getItem('bikebrowser_api_base') : '';
  const base = (saved || CONFIG.API_BASE_URL || '').trim();
  if (base) {
    return base;
  }

  return CONFIG.API_BASE_URL;
}

let apiBaseUrl = inferBaseUrl();

export function getApiBaseUrl() {
  return apiBaseUrl;
}

export function setApiBaseUrl(nextUrl) {
  const normalized = String(nextUrl || '').trim();
  if (!normalized) {
    return apiBaseUrl;
  }

  apiBaseUrl = normalized.replace(/\/$/, '');
  if (typeof window !== 'undefined') {
    window.localStorage.setItem('bikebrowser_api_base', apiBaseUrl);
  }

  return apiBaseUrl;
}

function getTimeoutForPath(path) {
  if (path === '/search') {
    return SEARCH_TIMEOUT_MS;
  }
  if (path === '/rank' || path.startsWith('/rank/')) {
    return path === '/rank' ? RANK_TIMEOUT_MS : RANK_STATUS_TIMEOUT_MS;
  }
  return REQUEST_TIMEOUT_MS;
}

async function request(path, method = 'GET', body) {
  const baseCandidates = [
    apiBaseUrl,
    CONFIG.API_BASE_URL,
    LOCAL_API_FALLBACK,
  ]
    .map((value) => String(value || '').trim().replace(/\/$/, ''))
    .filter(Boolean)
    .filter((value, index, list) => list.indexOf(value) === index);

  let lastError = null;

  for (const base of baseCandidates) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), getTimeoutForPath(path));

    try {
      const response = await fetch(`${base}${path}`, {
        method,
        cache: 'no-store',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'x-device-id': typeof navigator !== 'undefined' ? navigator.userAgent : 'web-client',
          'x-api-key': CONFIG.API_KEY,
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        throw new Error(`API ${method} ${path} failed with ${response.status}`);
      }

      if (base !== apiBaseUrl) {
        setApiBaseUrl(base);
      }

      return response.json();
    } catch (error) {
      lastError = error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw lastError || new Error(`API ${method} ${path} failed`);
}

export const apiClient = {
  health: () => request('/api/health', 'GET'),
  wakeComputer: ({ mac, pin } = {}) => request('/api/wake', 'POST', { mac, pin }),
  search: (query, options = {}) => request('/search', 'POST', { query, options }),
  rank: (payload = {}) => request('/rank', 'POST', payload),
  rankStatus: (jobId) => request(`/rank/${encodeURIComponent(jobId)}`, 'GET'),
  getProjects: () => request('/projects', 'GET'),
  createProject: (payload) => request('/projects', 'POST', payload),
  getNotes: () => request('/notes', 'GET'),
  createNote: (payload) => request('/notes', 'POST', payload),
  getConnectionStatus: () => request('/connection-status', 'GET'),

  // Unified search endpoints
  searchText: (query, options = {}, projectContext = null) =>
    request('/search/text', 'POST', { query, options, projectContext }),
  searchVoice: (transcript) =>
    request('/search/voice', 'POST', { transcript }),
  searchImage: (imageBase64) =>
    request('/search/image', 'POST', { image: imageBase64 }),

  // Compare
  compareItems: (itemA, itemB) =>
    request('/compare', 'POST', { itemA, itemB }),

  // History
  getHistory: (limit = 50) => request(`/history?limit=${limit}`, 'GET'),
  findSimilar: (query) => request(`/history/similar?q=${encodeURIComponent(query)}`, 'GET'),
  getHistoryProjects: () => request('/history/projects', 'GET'),
  createHistoryProject: (name) => request('/history/projects', 'POST', { name }),
  getProjectHistory: (id) => request(`/history/projects/${encodeURIComponent(id)}`, 'GET'),
  addProjectItem: (id, item) => request(`/history/projects/${encodeURIComponent(id)}/items`, 'POST', item),
  addProjectNote: (id, text) => request(`/history/projects/${encodeURIComponent(id)}/notes`, 'POST', { text }),
};
