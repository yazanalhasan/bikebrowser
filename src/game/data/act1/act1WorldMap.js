// Phase 2.3 — World Map. The single source of truth for map DESTINATIONS and
// their gating. Pixel positions live in the layout (for rendering); this catalog
// owns which places exist and how they unlock, so Current/Reachable/Locked is
// derived from real game state — no fake destinations, no dead links.
export const act1WorldMapPoints = [
  { id: 'home', label: 'Home', region: 'neighborhood', alwaysKnown: true },
  { id: 'garage', label: 'Garage', region: 'neighborhood', alwaysKnown: true },
  { id: 'street', label: 'Street', region: 'neighborhood', alwaysKnown: true },
  { id: 'dry_wash', label: 'Dry Wash', region: 'wash' },
  { id: 'bridge', label: 'Broken Bridge', region: 'wash' },
  // Gated behind repairing the bridge (the wider map). Revealed but locked.
  { id: 'wider_gate', label: 'City Gate', region: 'map_edge', lockedByWiderMap: true },
  { id: 'salt_river', label: 'Salt River', region: 'river', lockedByWiderMap: true },
  { id: 'copper_mine', label: 'Copper Mine', region: 'mountain', lockedByWiderMap: true },
];
