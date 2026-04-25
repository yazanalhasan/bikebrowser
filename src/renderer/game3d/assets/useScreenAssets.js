/**
 * useScreenAssets(manifest)
 *
 * Lifecycle hook for per-screen asset loading in the R3F game module.
 *
 * Usage:
 *   const { models, ready } = useScreenAssets(manifest);
 *   // models['garage']  →  the GLTF result for the 'garage' entry
 *   // ready             →  true once every model has resolved
 *
 * Design notes:
 * - Preloading is triggered via useGLTF.preload() which queues requests
 *   outside the React tree so they start as early as possible.
 * - useGLTF() is called per model path inside the hook (suspense-compatible).
 *   If you do NOT want Suspense, wrap the consumer in <Suspense>.
 * - Unloading uses useGLTF.clear() in a useEffect cleanup. React Strict Mode
 *   double-mounts mean cleanup fires after the first mount, but preload() +
 *   useGLTF() will immediately re-resolve from the three.js cache on the
 *   second mount — no visible flicker in production builds.
 * - If manifest is null/undefined or has no models, the hook is a no-op and
 *   returns { models: {}, ready: true } immediately.
 */

import { useEffect, useRef } from 'react';
import { useGLTF } from '@react-three/drei';

/**
 * Inner hook for a single model entry.
 * Separated so the rules-of-hooks path is consistent regardless of list length.
 * Called only from useScreenAssets — not exported.
 */
function useModelEntry(entry) {
  return useGLTF(entry.path);
}

// ---------------------------------------------------------------------------
// Zero-model fast-path component (hooks cannot be called conditionally, so
// we handle the empty-manifest case at the top of useScreenAssets before any
// per-model hooks would run — that's safe because the count is stable).
// ---------------------------------------------------------------------------

/**
 * @param {object|null} manifest - A parsed asset manifest conforming to
 *   asset-manifest.schema.json. If null/undefined, acts as a no-op.
 * @returns {{ models: Object.<string,object>, ready: boolean }}
 */
export function useScreenAssets(manifest) {
  const models = manifest?.models ?? [];
  const paths = models.map((m) => m.path);

  // Track whether we've already called preload for this set of paths.
  // Preload is idempotent in drei/three but this avoids redundant work on
  // re-renders with the same manifest.
  const preloadedRef = useRef(false);

  if (!preloadedRef.current && paths.length > 0) {
    paths.forEach((path) => useGLTF.preload(path));
    preloadedRef.current = true;
  }

  // Unload on unmount (or manifest change via deps). Strict-mode safe: the
  // second mount will re-resolve from cache immediately via preload().
  useEffect(() => {
    return () => {
      paths.forEach((path) => useGLTF.clear(path));
      preloadedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paths.join(',')]);

  // Build the models map. useGLTF is called per path — the number of calls
  // must be stable per component instance (hooks rules). If the manifest
  // changes shape (different model count), the consumer must remount this
  // hook (e.g. via a key prop on the parent). This is the same constraint
  // that useGLTF itself carries.
  const gltfResults = paths.map((path) => useGLTF(path)); // eslint-disable-line react-hooks/rules-of-hooks

  const modelMap = {};
  let ready = true;

  models.forEach((entry, i) => {
    const result = gltfResults[i];
    modelMap[entry.id] = result ?? null;
    if (!result) ready = false;
  });

  return { models: modelMap, ready };
}

export default useScreenAssets;
