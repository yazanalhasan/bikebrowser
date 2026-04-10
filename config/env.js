const processEnv = typeof process !== 'undefined' && process.env ? process.env : {};
const viteEnv = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};

const fallbackApi = 'http://localhost:3001';
const fallbackPublic = 'http://localhost:5173';

export const CONFIG = {
  API_BASE_URL: processEnv.API_BASE_URL || viteEnv.VITE_API_BASE_URL || fallbackApi,
  PUBLIC_BASE_URL: processEnv.PUBLIC_BASE_URL || viteEnv.VITE_PUBLIC_BASE_URL || fallbackPublic,
  // Falls back to 'dev-local-key' for local development only.
  // In production, set API_KEY / VITE_API_KEY in .env to a secure random value.
  API_KEY: processEnv.API_KEY || viteEnv.VITE_API_KEY || 'dev-local-key',
};
