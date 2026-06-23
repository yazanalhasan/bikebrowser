// Bridge from the React apparatus labs back into the running Phaser game, so a
// successful result advances chapter progression (same idea as UTM's testMaterial).
export function emitGameEvent(name, detail) {
  try { window.__bikebrowserRebuildGame?.registry?.events?.emit(name, detail); } catch { /* game not present (standalone route) */ }
}
export function callRuntime(method, ...args) {
  try { return window.__GAME__?.[method]?.(...args); } catch { return undefined; }
}
