# Phase 1.4 — Inventory Metadata

Turn inventory from a bare set of ids into reasoned-about objects with
quantity + metadata (category, tags, source, durability, engineering/ecology
attributes) — the foundation for material choice (1.6) and future crafting.

## Changes (one scoped slice)
1. **New** `src/game/data/act1/act1Inventory.js` — per-item metadata catalog
   (`category`, `type`, `tags`, `source`, `durability`, `engineering`
   {strengthBand, bridgeSafe, bestUse}, `ecology` {species, harvestEthic}).
   Values grounded in `act1Materials` + `act1Ecology`. Exported via the act1 data
   index. `inventoryMetadataFor(id)` falls back safely for unknown items.
2. `InventorySystem` — now tracks **quantity** per item (Map) while keeping
   `getState().items` as a backward-compatible id-array; adds `getItem(id)`
   (quantity + metadata), `getQuantity`, and `getState().details` + `categories`.
   `add(id, qty)` increments; `loadState` restores ids + quantities.
3. `acceptance spec` — captures `inventoryDetails` and **asserts** steel
   (`category: material`, `bridgeSafe: true`, truthy source, numeric durability)
   and mesquite (`category: material`, `ecologySpecies: mesquite`). Coverage
   strengthened.

## Validation (runtime + state + UI + test + acceptance agree)
- `npm run build`: ✓ (8.1s).
- Playwright `game-rebuild.act1-acceptance`: **GREEN — 1 passed (1.5m)**.
- Inventory (live): 7 items with metadata; materials:
  - steel → material, salvage yard, durability 0.94, bridgeSafe true
  - copper_brace → material, local trader, 0.70, safe
  - weak_scrap → material, roadside, 0.20, **unsafe**
  - mesquite → material, desert ecology, 0.64, safe (+ ecology species)
- Console errors: none. Screenshots: full set regenerated.

## Result
- Items now carry the facts the UTM/bridge/ecology/crafting systems can consume:
  the same `bridgeSafe`/`durability` an engineer reasons with, plus `source`
  and `ecology` provenance.
- Backward compatible: `inventory.items` (id array) unchanged for existing
  consumers; `details`/`categories` added.

## Governance
- Free local; acceptance-protected; small reversible commit; concern separation
  held (no bridge/crafting coupling yet); no un-owned drift committed.

## Next
Phase 1.5 — Quest gating (Observe → Predict → Test → Build → Verify; no
skipping, no accidental completion, clear incomplete-state feedback).
