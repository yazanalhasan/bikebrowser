const STORAGE_KEY = 'bikebrowser.gameRebuild.act1';

export function saveRebuildState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  return { ok: true, key: STORAGE_KEY };
}

export function loadRebuildState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearRebuildState() {
  localStorage.removeItem(STORAGE_KEY);
  return { ok: true, key: STORAGE_KEY };
}
