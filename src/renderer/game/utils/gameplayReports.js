/**
 * The in-game BUG report button is a developer tool.
 * It is on in Vite dev, or when VITE_ENABLE_GAMEPLAY_REPORTS is exactly "true".
 * A missing env value must not turn it on in a production build.
 */
export function gameplayReportsEnabled(env = {}) {
  return Boolean(env.DEV) || env.VITE_ENABLE_GAMEPLAY_REPORTS === 'true';
}
