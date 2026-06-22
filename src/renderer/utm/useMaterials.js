import { useMemo } from 'react';
import { UTM_MATERIALS, getUtmMaterialById } from './utmMaterials.js';

// Single source of truth for material data in the UTM feature. Components read
// material properties exclusively through this hook — never hardcode values.
export function useMaterials() {
  return useMemo(() => ({ materials: UTM_MATERIALS, getMaterialById: getUtmMaterialById }), []);
}
